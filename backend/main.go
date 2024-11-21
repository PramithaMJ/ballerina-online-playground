package main

import (
	"ballerina-compiler/ballerina-compiler-backend/handler"
	"log"
	"net/http"
)

func main() {
	
	http.HandleFunc("/run", handler.RunCode)
	http.HandleFunc("/compile", handler.CompileCode)

	log.Println("Server started on port 8081")
	log.Fatal(http.ListenAndServe(":8081", nil))
}
