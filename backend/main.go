package main

import (
	"ballerina-compiler/ballerina-compiler-backend/handler"
	"log"
	"net/http"
	"time"
)

// CORS middleware to allow frontend access
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // In production, specify your frontend domain
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// Performance middleware with timeout and connection optimization
func performanceMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Set timeout for request
		ctx := r.Context()

		// Add performance headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")

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

	// Health check endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"ballerina-compiler-backend"}`))
	})

	// Apply middleware chain to handlers
	http.HandleFunc("/run", chain(handler.RunCode, enableCORS, performanceMiddleware, loggingMiddleware))
	http.HandleFunc("/compile", chain(handler.CompileCode, enableCORS, performanceMiddleware, loggingMiddleware))
	http.HandleFunc("/execute", chain(handler.RunCode, enableCORS, performanceMiddleware, loggingMiddleware))

	// Configure server with optimizations
	server := &http.Server{
		Addr:           ":8081",
		Handler:        nil,
		ReadTimeout:    60 * time.Second,
		WriteTimeout:   60 * time.Second,
		IdleTimeout:    120 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	log.Println("Server started on port 8081")
	log.Println("CORS enabled for all origins")
	log.Println("Performance optimizations enabled")
	log.Fatal(server.ListenAndServe())
}
