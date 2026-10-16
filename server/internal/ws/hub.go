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
