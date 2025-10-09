package main

import (
	"ballerina-compiler/ballerina-compiler-backend/handler"
	"log"
	"net/http"
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

func main() {

	// Health check endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"ballerina-compiler-backend"}`))
	})

	http.HandleFunc("/run", enableCORS(handler.RunCode))
	http.HandleFunc("/compile", enableCORS(handler.CompileCode))
	http.HandleFunc("/execute", enableCORS(handler.RunCode)) // Alias for frontend compatibility

	log.Println("Server started on port 8081")
	log.Println("CORS enabled for all origins")
	log.Fatal(http.ListenAndServe(":8081", nil))
}
