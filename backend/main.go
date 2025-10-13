package main

import (
	"ballerina-compiler/ballerina-compiler-backend/handler"
	"ballerina-compiler/ballerina-compiler-backend/middleware"
	"ballerina-compiler/ballerina-compiler-backend/utils"
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

// ResponseWriter wrapper to ensure CORS headers are always set
type corsResponseWriter struct {
	http.ResponseWriter
	wroteHeader bool
	origin      string
}

func (w *corsResponseWriter) WriteHeader(statusCode int) {
	if !w.wroteHeader {
		// Set CORS headers before writing status
		w.Header().Set("Access-Control-Allow-Origin", w.origin)
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, HEAD")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Type")
		w.Header().Set("Access-Control-Max-Age", "86400")
		w.Header().Add("Vary", "Origin")
		w.Header().Add("Vary", "Access-Control-Request-Method")
		w.Header().Add("Vary", "Access-Control-Request-Headers")
		w.wroteHeader = true
	}
	w.ResponseWriter.WriteHeader(statusCode)
}

func (w *corsResponseWriter) Write(b []byte) (int, error) {
	if !w.wroteHeader {
		w.WriteHeader(http.StatusOK)
	}
	return w.ResponseWriter.Write(b)
}

// CORS middleware with response writer wrapper
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get allowed origin from environment or use default
		allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
		if allowedOrigin == "" {
			// Allow GitHub Pages and other common origins
			origin := r.Header.Get("Origin")
			if origin != "" {
				allowedOrigin = origin
			} else {
				allowedOrigin = "*"
			}
		}

		// Handle preflight request immediately
		if r.Method == "OPTIONS" {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, HEAD")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
			w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Type")
			w.Header().Set("Access-Control-Max-Age", "86400")
			w.Header().Add("Vary", "Origin")
			w.Header().Add("Vary", "Access-Control-Request-Method")
			w.Header().Add("Vary", "Access-Control-Request-Headers")
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// Wrap response writer to ensure CORS headers are always set
		wrappedWriter := &corsResponseWriter{
			ResponseWriter: w,
			origin:         allowedOrigin,
		}

		next(wrappedWriter, r)
	}
}

// Performance middleware with timeout and security headers
func performanceMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get context
		ctx := r.Context()

		// Add security headers (but don't override CORS headers)
		if w.Header().Get("X-Content-Type-Options") == "" {
			w.Header().Set("X-Content-Type-Options", "nosniff")
		}
		if w.Header().Get("X-Frame-Options") == "" {
			w.Header().Set("X-Frame-Options", "DENY")
		}
		if w.Header().Get("X-XSS-Protection") == "" {
			w.Header().Set("X-XSS-Protection", "1; mode=block")
		}
		// Relax CSP to allow cross-origin requests
		if w.Header().Get("Content-Security-Policy") == "" {
			w.Header().Set("Content-Security-Policy", "default-src 'self'; connect-src *")
		}
		if w.Header().Get("Referrer-Policy") == "" {
			w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		}

		// Call next handler
		next(w, r.WithContext(ctx))
	}
}

// Logging middleware
func loggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next(w, r)
		log.Printf("%s %s - %v", r.Method, r.URL.Path, time.Since(start))
	}
}

// Chain middlewares
func chain(handler http.HandlerFunc, middlewares ...func(http.HandlerFunc) http.HandlerFunc) http.HandlerFunc {
	for i := len(middlewares) - 1; i >= 0; i-- {
		handler = middlewares[i](handler)
	}
	return handler
}

func main() {
	// Initialize container pool in background
	ctx := context.Background()
	log.Println("Starting Ballerina Compiler Backend...")

	// Initialize the container pool (pre-pull images and create containers)
	go func() {
		if err := utils.InitializePool(ctx); err != nil {
			log.Printf(" Failed to initialize container pool: %v", err)
			log.Println(" Will fallback to docker run for code execution")
		}
	}()

	// Create rate limiter: 3 requests per 5 seconds per IP, burst of 5
	rateLimiter := middleware.NewRateLimiter(5*time.Second, 5)

	// Health check endpoint
	http.HandleFunc("/health", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"ballerina-compiler-backend","security":"enabled"}`))
	}))

	// Apply middleware chain to handlers with rate limiting
	// Order matters: rightmost middleware is applied first
	http.HandleFunc("/run", chain(
		handler.RunCode,
		middleware.RateLimitMiddleware(rateLimiter),
		performanceMiddleware,
		loggingMiddleware,
		enableCORS, // Apply CORS last (first in execution) to ensure headers are set
	))
	http.HandleFunc("/compile", chain(
		handler.CompileCode,
		middleware.RateLimitMiddleware(rateLimiter),
		performanceMiddleware,
		loggingMiddleware,
		enableCORS, // Apply CORS last (first in execution) to ensure headers are set
	))
	http.HandleFunc("/execute", chain(
		handler.RunCode,
		middleware.RateLimitMiddleware(rateLimiter),
		performanceMiddleware,
		loggingMiddleware,
		enableCORS, // Apply CORS last (first in execution) to ensure headers are set
	))

	// Configure server with security optimizations
	server := &http.Server{
		Addr:           ":8081",
		Handler:        nil,
		ReadTimeout:    60 * time.Second,  // Time to read request body
		WriteTimeout:   120 * time.Second, // 2 minutes for compilation + execution + response
		IdleTimeout:    180 * time.Second, // 3 minutes for keep-alive connections
		MaxHeaderBytes: 1 << 20,           // 1 MB
	}

	log.Println("Server started on port 8081")
	log.Println(" Security features enabled:")
	log.Println("  - Rate limiting: 5 requests per 5 seconds")
	log.Println("  - Code validation and sanitization")
	log.Println("  - Docker isolation with security constraints")
	log.Println("  - Network disabled in containers")
	log.Println("  - Resource limits enforced")
	log.Println("  - Execution timeout: 60 seconds")
	log.Println("  - Container pooling for performance")

	// Setup graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Start server in goroutine
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	<-stop
	log.Println(" Shutting down server...")

	// Graceful shutdown with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	// Cleanup container pool
	if utils.Pool != nil {
		utils.Pool.Shutdown(context.Background())
	}

	log.Println(" Server gracefully stopped")
}
