package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"chisinau-monopoly/server/internal/game"
	"chisinau-monopoly/server/internal/ws"
)

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	hub := ws.NewHub()

	mux := http.NewServeMux()

	mux.HandleFunc("/api/health", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"status":  "ok",
			"edition": "Chișinău & Moldova Monopoly",
		})
	}))

	mux.HandleFunc("/api/rooms", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodPost {
			var req struct {
				ID   string `json:"id"`
				Name string `json:"name"`
			}
			_ = json.NewDecoder(r.Body).Decode(&req)
			if req.ID == "" {
				req.ID = fmt.Sprintf("room-%d", time.Now().Unix()%10000)
			}
			if req.Name == "" {
				req.Name = "Camera Chișinău"
			}
			room := hub.GetOrCreateRoom(req.ID, req.Name)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"id":   room.ID,
				"name": room.Name,
			})
			return
		}
		_ = json.NewEncoder(w).Encode(hub.ListRooms())
	}))

	mux.HandleFunc("/api/board", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"tiles":          game.NewChisinauBoard(),
			"chance":         game.NewChanceDeck(),
			"communityChest": game.NewCommunityChestDeck(),
		})
	}))

	mux.HandleFunc("/ws", hub.ServeWS)

	addr := ":" + port
	log.Printf("[CHISINAU MONOPOLY] Server listening on http://localhost%s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
