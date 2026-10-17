# Stage 1: Build Go WebSocket server binary
FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /chisinau-monopoly-server ./cmd/server

# Stage 2: Minimal Alpine runtime
FROM alpine:3.21

RUN apk --no-cache add ca-certificates wget

WORKDIR /app
COPY --from=builder /chisinau-monopoly-server /app/chisinau-monopoly-server

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/health || exit 1

CMD ["/app/chisinau-monopoly-server"]
