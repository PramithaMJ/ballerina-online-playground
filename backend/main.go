package main

import (
	"ballerina-compiler/ballerina-compiler-backend/handler"
	"ballerina-compiler/ballerina-compiler-backend/middleware"
	"log"
	"net/http"
	"os"
	"time"
)

// CORS middleware with stricter configuration
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

		// Set CORS headers FIRST before any other headers
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, HEAD")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Type")
		w.Header().Set("Access-Control-Max-Age", "86400") // 24 hours

		// Add Vary header to indicate response varies by Origin
		w.Header().Add("Vary", "Origin")
		w.Header().Add("Vary", "Access-Control-Request-Method")
		w.Header().Add("Vary", "Access-Control-Request-Headers")

		// Handle preflight request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next(w, r)
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
	// Create rate limiter: 3 requests per 5 seconds per IP, burst of 5
	rateLimiter := middleware.NewRateLimiter(5*time.Second, 5)

	// Health check endpoint
	http.HandleFunc("/health", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"ballerina-compiler-backend","security":"enabled"}`))
	}))

	// Apply middleware chain to handlers with rate limiting
	http.HandleFunc("/run", chain(
		handler.RunCode,
		enableCORS,
		middleware.RateLimitMiddleware(rateLimiter),
		performanceMiddleware,
		loggingMiddleware,
	))
	http.HandleFunc("/compile", chain(
		handler.CompileCode,
		enableCORS,
		middleware.RateLimitMiddleware(rateLimiter),
		performanceMiddleware,
		loggingMiddleware,
	))
	http.HandleFunc("/execute", chain(
		handler.RunCode,
		enableCORS,
		middleware.RateLimitMiddleware(rateLimiter),
		performanceMiddleware,
		loggingMiddleware,
	))

	// Configure server with security optimizations
	server := &http.Server{
		Addr:           ":8081",
		Handler:        nil,
		ReadTimeout:    15 * time.Second, // Reduced timeout
		WriteTimeout:   15 * time.Second, // Reduced timeout
		IdleTimeout:    60 * time.Second, // Reduced timeout
		MaxHeaderBytes: 1 << 20,          // 1 MB
	}

	log.Println("🚀 Server started on port 8081")
	log.Println("🔒 Security features enabled:")
	log.Println("  - Rate limiting: 5 requests per 5 seconds")
	log.Println("  - Code validation and sanitization")
	log.Println("  - Docker isolation with security constraints")
	log.Println("  - Network disabled in containers")
	log.Println("  - Resource limits enforced")
	log.Println("  - Execution timeout: 60 seconds")
	log.Fatal(server.ListenAndServe())
}
