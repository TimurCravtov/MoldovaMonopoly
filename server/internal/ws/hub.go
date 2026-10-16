package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"sync"
	"time"

	"chisinau-monopoly/server/internal/game"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type ClientMessage struct {
	Action    string            `json:"action"`
	TargetID  string            `json:"targetId,omitempty"`
	Name      string            `json:"name,omitempty"`
	Token     string            `json:"token,omitempty"`
	Color     string            `json:"color,omitempty"`
	TileIndex int               `json:"tileIndex,omitempty"`
	Amount    int               `json:"amount,omitempty"`
	TradeID   string            `json:"tradeId,omitempty"`
	Accept    bool              `json:"accept,omitempty"`
	Trade     *game.TradeOffer  `json:"trade,omitempty"`
	Settings  *game.GameSettings `json:"settings,omitempty"`
	ChatText  string            `json:"chatText,omitempty"`
}

type ServerEnvelope struct {
	Type    string          `json:"type"` // "STATE", "ERROR"
	State   *game.GameState `json:"state,omitempty"`
	Message string          `json:"message,omitempty"`
}

type ClientConn struct {
	Conn     *websocket.Conn
	PlayerID string
	Room     *Room
	sendMu   sync.Mutex
}

func (c *ClientConn) SendJSON(v interface{}) error {
	c.sendMu.Lock()
	defer c.sendMu.Unlock()
	_ = c.Conn.SetWriteDeadline(time.Now().Add(8 * time.Second))
	return c.Conn.WriteJSON(v)
}

type Room struct {
	ID        string
	Name      string
	Engine    *game.Engine
	clients   map[*ClientConn]bool
	mu        sync.RWMutex
	stopCh    chan struct{}
	CreatedAt time.Time
}

func NewRoom(id, name string) *Room {
	r := &Room{
		ID:        id,
		Name:      name,
		Engine:    game.NewEngine(id, name),
		clients:   make(map[*ClientConn]bool),
		stopCh:    make(chan struct{}),
		CreatedAt: time.Now(),
	}
	go r.botLoop()
	return r
}

func (r *Room) botLoop() {
	ticker := time.NewTicker(850 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-r.stopCh:
			return
		case <-ticker.C:
			r.Engine.Lock()
			changed := r.Engine.StepBot()
			r.Engine.Unlock()
			if changed {
				r.BroadcastState()
			}
		}
	}
}

func (r *Room) BroadcastState() {
	r.Engine.Lock()
	data, err := json.Marshal(ServerEnvelope{
		Type:  "STATE",
		State: r.Engine.State,
	})
	r.Engine.Unlock()
	if err != nil {
		return
	}

	r.mu.RLock()
	conns := make([]*ClientConn, 0, len(r.clients))
	for c := range r.clients {
		conns = append(conns, c)
	}
	r.mu.RUnlock()

	for _, c := range conns {
		c.sendMu.Lock()
		_ = c.Conn.SetWriteDeadline(time.Now().Add(8 * time.Second))
		_ = c.Conn.WriteMessage(websocket.TextMessage, data)
		c.sendMu.Unlock()
	}
}

type Hub struct {
	mu    sync.RWMutex
	rooms map[string]*Room
}

func NewHub() *Hub {
	h := &Hub{
		rooms: make(map[string]*Room),
	}
	presets := []struct {
		id       string
		name     string
		settings game.GameSettings
	}{
		{
			id:   "chisinau-central",
			name: "Chișinău — Piața Marii Adunări Naționale",
			settings: game.GameSettings{
				MaxPlayers:         4,
				StartingCash:       1500,
				FreeParkingJackpot: true,
				DoubleOnGo:         false,
				AuctionEnabled:     true,
				AutoStart:          false,
			},
		},
		{
			id:   "botanica-duel",
			name: "Duel 1v1 — Poarta Orașului (Botanica)",
			settings: game.GameSettings{
				MaxPlayers:         2,
				StartingCash:       1500,
				FreeParkingJackpot: false,
				DoubleOnGo:         false,
				AuctionEnabled:     true,
				AutoStart:          true,
			},
		},
		{
			id:   "cricova-vip",
			name: "Cricova VIP — Galeriile Subterane",
			settings: game.GameSettings{
				MaxPlayers:         4,
				StartingCash:       2500,
				FreeParkingJackpot: true,
				DoubleOnGo:         true,
				AuctionEnabled:     true,
				AutoStart:          false,
			},
		},
		{
			id:   "buiucani-rapid",
			name: "Buiucani Express — Masă de 3 Jucători",
			settings: game.GameSettings{
				MaxPlayers:         3,
				StartingCash:       1500,
				FreeParkingJackpot: true,
				DoubleOnGo:         false,
				AuctionEnabled:     true,
				AutoStart:          true,
			},
		},
		{
			id:   "ciocana-cumatrie",
			name: "Cumătrie Mare — Masa de 6 (Ciocana)",
			settings: game.GameSettings{
				MaxPlayers:         6,
				StartingCash:       2000,
				FreeParkingJackpot: true,
				DoubleOnGo:         true,
				AuctionEnabled:     true,
				AutoStart:          false,
			},
		},
		{
			id:   "purcari-grand",
			name: "Castel Mimi & Purcari — Sala de 8 Jucători",
			settings: game.GameSettings{
				MaxPlayers:         8,
				StartingCash:       1500,
				FreeParkingJackpot: true,
				DoubleOnGo:         false,
				AuctionEnabled:     true,
				AutoStart:          false,
			},
		},
	}

	for i, p := range presets {
		r := NewRoom(p.id, p.name)
		r.CreatedAt = time.Now().Add(time.Duration(i) * time.Millisecond)
		r.Engine.State.Settings = p.settings
		h.rooms[r.ID] = r
	}
	return h
}

type RoomPlayerPreview struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Token string `json:"token"`
	Color string `json:"color"`
	IsBot bool   `json:"isBot"`
}

type RoomSummary struct {
	ID          string              `json:"id"`
	Name        string              `json:"name"`
	Phase       game.TurnPhase      `json:"phase"`
	PlayerCount int                 `json:"playerCount"`
	MaxPlayers  int                 `json:"maxPlayers"`
	Players     []RoomPlayerPreview `json:"players"`
	Settings    game.GameSettings   `json:"settings"`
	CreatedAt   int64               `json:"createdAt"`
}

func (h *Hub) ListRooms() []RoomSummary {
	h.mu.RLock()
	defer h.mu.RUnlock()
	list := make([]RoomSummary, 0, len(h.rooms))
	for _, r := range h.rooms {
		r.Engine.Lock()
		if r.Engine.State.Settings.IsPrivate {
			r.Engine.Unlock()
			continue
		}
		maxP := r.Engine.State.Settings.MaxPlayers
		if maxP < 2 || maxP > 8 {
			maxP = 4
		}
		players := make([]RoomPlayerPreview, 0, len(r.Engine.State.Players))
		for _, p := range r.Engine.State.Players {
			players = append(players, RoomPlayerPreview{
				ID:    p.ID,
				Name:  p.Name,
				Token: p.Token,
				Color: p.Color,
				IsBot: p.IsBot,
			})
		}
		list = append(list, RoomSummary{
			ID:          r.ID,
			Name:        r.Name,
			Phase:       r.Engine.State.Phase,
			PlayerCount: len(r.Engine.State.Players),
			MaxPlayers:  maxP,
			Players:     players,
			Settings:    r.Engine.State.Settings,
			CreatedAt:   r.CreatedAt.UnixMilli(),
		})
		r.Engine.Unlock()
	}
	sort.Slice(list, func(i, j int) bool {
		// Prioritize rooms in LOBBY with players waiting, then by CreatedAt
		if (list[i].Phase == game.PhaseLobby) != (list[j].Phase == game.PhaseLobby) {
			return list[i].Phase == game.PhaseLobby
		}
		return list[i].CreatedAt < list[j].CreatedAt
	})
	return list
}

func (h *Hub) GetOrCreateRoom(id, name string) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()
	if r, ok := h.rooms[id]; ok {
		return r
	}
	if name == "" {
		name = "Masa " + id
	}
	r := NewRoom(id, name)
	h.rooms[id] = r
	return r
}

func (h *Hub) CreateRoom(id, name string, settings *game.GameSettings) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()
	if r, ok := h.rooms[id]; ok {
		return r
	}
	if name == "" {
		name = "Masa " + id
	}
	r := NewRoom(id, name)
	if settings != nil {
		_ = r.Engine.UpdateSettings(*settings)
	}
	h.rooms[id] = r
	return r
}

func (h *Hub) ResetRoom(id string) *Room {
	h.mu.Lock()
	r, ok := h.rooms[id]
	if !ok {
		r = NewRoom(id, "Chișinău — Piața Marii Adunări Naționale")
		h.rooms[id] = r
		h.mu.Unlock()
		return r
	}
	h.mu.Unlock()

	r.Engine.Lock()
	r.Engine.Reset()
	r.Engine.Unlock()
	r.BroadcastState()
	return r
}

func (r *Room) ExecuteAction(playerID string, msg ClientMessage) error {
	r.Engine.Lock()
	defer r.Engine.Unlock()

	switch msg.Action {
	case "ADD_BOT":
		_, err := r.Engine.AddBot()
		return err
	case "REMOVE_PLAYER":
		return r.Engine.RemovePlayer(msg.TargetID)
	case "UPDATE_APPEARANCE":
		return r.Engine.UpdatePlayerAppearance(playerID, msg.Name, msg.Token, msg.Color)
	case "UPDATE_SETTINGS":
		if msg.Settings != nil {
			return r.Engine.UpdateSettings(*msg.Settings)
		}
		return nil
	case "START_GAME":
		return r.Engine.StartGame(playerID)
	case "ROLL_DICE":
		return r.Engine.RollDice(playerID)
	case "BUY_PROPERTY":
		return r.Engine.BuyProperty(playerID)
	case "DECLINE_PROPERTY":
		return r.Engine.DeclineProperty(playerID)
	case "PLACE_BID":
		return r.Engine.PlaceBid(playerID, msg.Amount)
	case "PASS_AUCTION":
		return r.Engine.PassAuction(playerID)
	case "BUILD_HOUSE":
		return r.Engine.BuildHouse(playerID, msg.TileIndex)
	case "SELL_HOUSE":
		return r.Engine.SellHouse(playerID, msg.TileIndex)
	case "MORTGAGE_PROPERTY":
		return r.Engine.MortgageProperty(playerID, msg.TileIndex)
	case "UNMORTGAGE_PROPERTY":
		return r.Engine.UnmortgageProperty(playerID, msg.TileIndex)
	case "PAY_JAIL_BAIL":
		return r.Engine.PayJailBail(playerID)
	case "USE_JAIL_CARD":
		return r.Engine.UseJailCard(playerID)
	case "PAY_DEBT":
		return r.Engine.PayDebt(playerID)
	case "DECLARE_BANKRUPTCY":
		return r.Engine.DeclareBankruptcy(playerID)
	case "END_TURN":
		return r.Engine.EndTurn(playerID)
	case "PROPOSE_TRADE":
		if msg.Trade != nil {
			msg.Trade.FromPlayerID = playerID
			_, err := r.Engine.ProposeTrade(*msg.Trade)
			return err
		}
		return nil
	case "RESPOND_TRADE":
		return r.Engine.RespondTrade(msg.TradeID, playerID, msg.Accept)
	case "RESET_GAME":
		r.Engine.Reset()
		return nil
	}
	return nil
}

func (h *Hub) ServeWS(w http.ResponseWriter, req *http.Request) {
	roomID := req.URL.Query().Get("roomId")
	if roomID == "" {
		roomID = "chisinau-central"
	}
	roomName := req.URL.Query().Get("roomName")
	playerID := req.URL.Query().Get("playerId")
	playerName := req.URL.Query().Get("playerName")
	token := req.URL.Query().Get("token")
	color := req.URL.Query().Get("color")

	if playerID == "" {
		playerID = fmt.Sprintf("p_%d", time.Now().UnixNano()%1000000)
	}
	if playerName == "" {
		playerName = "Orășean"
	}

	room := h.GetOrCreateRoom(roomID, roomName)

	conn, err := upgrader.Upgrade(w, req, nil)
	if err != nil {
		log.Printf("websocket upgrade failed: %v", err)
		return
	}

	client := &ClientConn{
		Conn:     conn,
		PlayerID: playerID,
		Room:     room,
	}

	room.mu.Lock()
	room.clients[client] = true
	room.mu.Unlock()

	room.Engine.Lock()
	_, _ = room.Engine.AddPlayer(playerID, playerName, token, color, false)
	room.Engine.Unlock()

	room.BroadcastState()

	go h.readPump(client)
}

func (h *Hub) readPump(c *ClientConn) {
	room := c.Room
	defer func() {
		room.mu.Lock()
		delete(room.clients, c)
		room.mu.Unlock()

		room.Engine.Lock()
		if p := room.Engine.GetPlayer(c.PlayerID); p != nil {
			p.Connected = false
		}
		room.Engine.Unlock()
		_ = c.Conn.Close()
		room.BroadcastState()
	}()

	for {
		var msg ClientMessage
		if err := c.Conn.ReadJSON(&msg); err != nil {
			break
		}

		if actionErr := room.ExecuteAction(c.PlayerID, msg); actionErr != nil {
			_ = c.SendJSON(ServerEnvelope{
				Type:    "ERROR",
				Message: actionErr.Error(),
			})
		} else {
			room.BroadcastState()
		}
	}
}
