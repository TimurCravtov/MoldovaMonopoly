package ws

import (
	"sync"
	"testing"
)

func TestRoomResetAndConcurrentBroadcast(t *testing.T) {
	hub := NewHub()
	room := hub.GetOrCreateRoom("chisinau-central", "Chișinău")

	room.Engine.Lock()
	_, err := room.Engine.AddPlayer("p1", "Ion", "trolleybus", "#E11D48", false)
	room.Engine.Unlock()
	if err != nil {
		t.Fatalf("failed to add player: %v", err)
	}

	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_ = room.ExecuteAction("p1", ClientMessage{Action: "ADD_BOT"})
			_ = room.ExecuteAction("p1", ClientMessage{Action: "RESET_GAME"})
			room.BroadcastState()
			hub.ResetRoom("chisinau-central")
		}()
	}
	wg.Wait()
}
