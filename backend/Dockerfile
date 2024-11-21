# Use the official Go image as the base
FROM golang:1.20 AS build

# Set the working directory inside the container
WORKDIR /app

# Copy the Go modules and source code
COPY go.mod go.sum ./
RUN go mod tidy

COPY . .

# Build the Go application
RUN go build -o ballerina-compiler-backend .

# Use a minimal image for the final build
FROM debian:bullseye-slim

# Set working directory in the minimal image
WORKDIR /app

# Copy the compiled binary from the build stage
COPY --from=build /app/ballerina-compiler-backend .

# Expose port 8080
EXPOSE 8081

# Command to run the application
CMD ["./ballerina-compiler-backend"]
