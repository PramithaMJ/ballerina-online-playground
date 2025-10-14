FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY . .

RUN go build -o ballerina-compiler-backend .

FROM alpine:3.20.2

RUN apk add --no-cache docker-cli

RUN addgroup -g 10014 appgroup && \
    adduser -u 10014 -G appgroup -s /bin/sh -D appuser

WORKDIR /app

COPY --from=builder /app/ballerina-compiler-backend .

RUN chown -R appuser:appgroup /app

# Note: Running as root to access Docker socket
# In production, consider using Docker socket proxy for better security
# USER 10014

EXPOSE 8081

ENTRYPOINT ["/app/ballerina-compiler-backend"]
