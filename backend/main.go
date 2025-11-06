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
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, CF-Turnstile-Token")
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
		// Get origin from request
		origin := r.Header.Get("Origin")

		// Define allowed origins
		allowedOrigins := []string{
			"https://pramithamj.github.io",
			"https://ballerina-online-playground.pages.dev",
			"https://77a3215d.ballerina-online-playground.pages.dev",
			"http://localhost:3000",
			"http://localhost:5173",
		}

		// Check from environment variable first
		envOrigin := os.Getenv("ALLOWED_ORIGIN")
		if envOrigin != "" {
			allowedOrigins = append(allowedOrigins, envOrigin)
		}

		// Determine which origin to allow
		allowedOrigin := ""
		for _, allowed := range allowedOrigins {
			if origin == allowed || (len(origin) > 0 && (origin[:8] == "https://" || origin[:7] == "http://") &&
				(len(origin) > 20 && origin[len(origin)-20:] == ".pages.dev")) {
				allowedOrigin = origin
				break
			}
		}

		// If no match and origin is a Cloudflare Pages preview URL, allow it
		if allowedOrigin == "" && origin != "" {
			// Allow all *.pages.dev domains (Cloudflare Pages)
			if len(origin) > 10 && origin[len(origin)-10:] == ".pages.dev" {
				allowedOrigin = origin
			} else if origin == "http://localhost:3000" || origin == "http://localhost:5173" {
				allowedOrigin = origin
			}
		}

		// Fallback to wildcard for development
		if allowedOrigin == "" {
			allowedOrigin = "*"
		}

		// Handle preflight request immediately
		if r.Method == "OPTIONS" {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, HEAD")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, CF-Turnstile-Token")
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
		// Only log slow requests (> 5 seconds) or errors
		duration := time.Since(start)
		if duration > 5*time.Second {
			log.Printf("SLOW: %s %s - %v", r.Method, r.URL.Path, duration)
		}
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
	log.Println("Ballerina Playground Backend starting...")

	// Initialize Turnstile configuration
	turnstileConfig := middleware.NewTurnstileConfig()
	if turnstileConfig.Enabled && turnstileConfig.SecretKey != "" {
		log.Println("✓ Turnstile bot protection enabled")
	}

	// Initialize the container pool (pre-pull images and create containers)
	go func() {
		if err := utils.InitializePool(ctx); err != nil {
			log.Printf("⚠️  Container pool initialization failed: %v", err)
			log.Println("   Fallback mode: Using docker run")
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

	// Create a middleware chain for protected endpoints
	protectedChain := func(h http.HandlerFunc) http.HandlerFunc {
		return chain(
			h,
			middleware.RateLimitMiddleware(rateLimiter),
			func(next http.HandlerFunc) http.HandlerFunc {
				return middleware.VerifyTurnstile(turnstileConfig)(http.HandlerFunc(next)).ServeHTTP
			},
			performanceMiddleware,
			loggingMiddleware,
			enableCORS,
		)
	}

	http.HandleFunc("/run", protectedChain(handler.RunCode))
	http.HandleFunc("/compile", protectedChain(handler.CompileCode))
	http.HandleFunc("/execute", protectedChain(handler.RunCode))

	// Debug endpoints (WebSocket doesn't need Turnstile)
	http.HandleFunc("/debug/start", protectedChain(handler.StartDebugHandler))
	http.HandleFunc("/debug/ws/", enableCORS(handler.DebugWebSocketHandler))

	// Configure server with security optimizations
	server := &http.Server{
		Addr:           ":8081",
		Handler:        nil,
		ReadTimeout:    60 * time.Second,  // Time to read request body
		WriteTimeout:   120 * time.Second, // 2 minutes for compilation + execution + response
		IdleTimeout:    180 * time.Second, // 3 minutes for keep-alive connections
		MaxHeaderBytes: 1 << 20,           // 1 MB
	}

	log.Println("✓ Server ready on port 8081")
	log.Println("  Security: Rate limiting, Docker isolation, Resource limits")
	if turnstileConfig.Enabled {
		log.Println("  Bot protection: Cloudflare Turnstile")
	}

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
	log.Println("⏸ Shutting down gracefully...")

	// Graceful shutdown with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("⚠️  Forced shutdown: %v", err)
	}

	// Cleanup container pool
	if utils.Pool != nil {
		utils.Pool.Shutdown(context.Background())
	}

	log.Println("✓ Server stopped")
}
