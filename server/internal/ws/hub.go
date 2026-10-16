package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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
	ID      string
	Name    string
	Engine  *game.Engine
	clients map[*ClientConn]bool
	mu      sync.RWMutex
	stopCh  chan struct{}
}

func NewRoom(id, name string) *Room {
	r := &Room{
		ID:      id,
		Name:    name,
		Engine:  game.NewEngine(id, name),
		clients: make(map[*ClientConn]bool),
		stopCh:  make(chan struct{}),
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
	// Pre-create a default Chișinău room
	defaultRoom := NewRoom("chisinau-central", "Chișinău — Piața Marii Adunări Naționale")
	h.rooms[defaultRoom.ID] = defaultRoom
	return h
}

type RoomSummary struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Phase       game.TurnPhase `json:"phase"`
	PlayerCount int            `json:"playerCount"`
	MaxPlayers  int            `json:"maxPlayers"`
}

func (h *Hub) ListRooms() []RoomSummary {
	h.mu.RLock()
	defer h.mu.RUnlock()
	list := make([]RoomSummary, 0, len(h.rooms))
	for _, r := range h.rooms {
		r.Engine.Lock()
		list = append(list, RoomSummary{
			ID:          r.ID,
			Name:        r.Name,
			Phase:       r.Engine.State.Phase,
			PlayerCount: len(r.Engine.State.Players),
			MaxPlayers:  8,
		})
		r.Engine.Unlock()
	}
	return list
}

func (h *Hub) GetOrCreateRoom(id, name string) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()
	if r, ok := h.rooms[id]; ok {
		return r
	}
	if name == "" {
		name = "Camera " + id
	}
	r := NewRoom(id, name)
	h.rooms[id] = r
	return r
}

func (h *Hub) ResetRoom(id string) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()
	name := "Chișinău — Piața Marii Adunări Naționale"
	if old, ok := h.rooms[id]; ok {
		name = old.Name
		close(old.stopCh)
	}
	r := NewRoom(id, name)
	h.rooms[id] = r
	return r
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

		var actionErr error
		room.Engine.Lock()
		switch msg.Action {
		case "ADD_BOT":
			_, actionErr = room.Engine.AddBot()
		case "REMOVE_PLAYER":
			actionErr = room.Engine.RemovePlayer(msg.TargetID)
		case "UPDATE_APPEARANCE":
			actionErr = room.Engine.UpdatePlayerAppearance(c.PlayerID, msg.Name, msg.Token, msg.Color)
		case "UPDATE_SETTINGS":
			if msg.Settings != nil {
				actionErr = room.Engine.UpdateSettings(*msg.Settings)
			}
		case "START_GAME":
			actionErr = room.Engine.StartGame(c.PlayerID)
		case "ROLL_DICE":
			actionErr = room.Engine.RollDice(c.PlayerID)
		case "BUY_PROPERTY":
			actionErr = room.Engine.BuyProperty(c.PlayerID)
		case "DECLINE_PROPERTY":
			actionErr = room.Engine.DeclineProperty(c.PlayerID)
		case "PLACE_BID":
			actionErr = room.Engine.PlaceBid(c.PlayerID, msg.Amount)
		case "PASS_AUCTION":
			actionErr = room.Engine.PassAuction(c.PlayerID)
		case "BUILD_HOUSE":
			actionErr = room.Engine.BuildHouse(c.PlayerID, msg.TileIndex)
		case "SELL_HOUSE":
			actionErr = room.Engine.SellHouse(c.PlayerID, msg.TileIndex)
		case "MORTGAGE_PROPERTY":
			actionErr = room.Engine.MortgageProperty(c.PlayerID, msg.TileIndex)
		case "UNMORTGAGE_PROPERTY":
			actionErr = room.Engine.UnmortgageProperty(c.PlayerID, msg.TileIndex)
		case "PAY_JAIL_BAIL":
			actionErr = room.Engine.PayJailBail(c.PlayerID)
		case "USE_JAIL_CARD":
			actionErr = room.Engine.UseJailCard(c.PlayerID)
		case "PAY_DEBT":
			actionErr = room.Engine.PayDebt(c.PlayerID)
		case "DECLARE_BANKRUPTCY":
			actionErr = room.Engine.DeclareBankruptcy(c.PlayerID)
		case "END_TURN":
			actionErr = room.Engine.EndTurn(c.PlayerID)
		case "PROPOSE_TRADE":
			if msg.Trade != nil {
				msg.Trade.FromPlayerID = c.PlayerID
				_, actionErr = room.Engine.ProposeTrade(*msg.Trade)
			}
		case "RESPOND_TRADE":
			actionErr = room.Engine.RespondTrade(msg.TradeID, c.PlayerID, msg.Accept)
		case "RESET_GAME":
			room.Engine.Reset()
		}
		room.Engine.Unlock()

		if actionErr != nil {
			_ = c.SendJSON(ServerEnvelope{
				Type:    "ERROR",
				Message: actionErr.Error(),
			})
		} else {
			room.BroadcastState()
		}
	}
}
