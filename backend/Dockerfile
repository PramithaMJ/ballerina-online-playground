# Use the official Go image as the base
FROM golang:1.23-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the Go modules and source code
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build the Go application
RUN go build -o ballerina-compiler-backend .

# Use a minimal image for the final build
FROM alpine:3.20.2

# Create a non-root user and group
# Using a fixed UID/GID for better security and predictability
RUN addgroup -g 10014 appgroup && \
    adduser -u 10014 -G appgroup -s /bin/sh -D appuser

# Set working directory in the minimal image
WORKDIR /app

# Copy the compiled binary from the build stage
COPY --from=build /app/ballerina-compiler-backend .

# Change ownership of the application files to the non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER 10014

# Expose port 8080
EXPOSE 8081

ENTRYPOINT ["/app/ballerina-compiler-backend"]
