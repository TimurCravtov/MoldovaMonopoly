package ws

import (
	"sync"
	"testing"

	"chisinau-monopoly/server/internal/game"
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

func TestUnlimitedCustomRoomsAndAutoStart(t *testing.T) {
	hub := NewHub()
	initialCount := len(hub.ListRooms())
	if initialCount < 6 {
		t.Fatalf("expected at least 6 pre-seeded public rooms, got %d", initialCount)
	}

	// Create 25 custom public rooms + 5 private rooms
	for i := 0; i < 25; i++ {
		id := "custom-public-" + string(rune('a'+(i%26))) + "-" + string(rune('0'+(i/10)))
		hub.CreateRoom(id, "Custom Table", &game.GameSettings{
			MaxPlayers:   2,
			StartingCash: 2000,
			AutoStart:    true,
			IsPrivate:    false,
		})
	}
	for i := 0; i < 5; i++ {
		id := "custom-private-" + string(rune('a'+i))
		hub.CreateRoom(id, "Secret Table", &game.GameSettings{
			MaxPlayers:   4,
			StartingCash: 1500,
			IsPrivate:    true,
		})
	}

	publicList := hub.ListRooms()
	if len(publicList) != initialCount+25 {
		t.Fatalf("expected %d public rooms in ListRooms, got %d", initialCount+25, len(publicList))
	}

	// Verify 2-player AutoStart room launches game automatically when 2nd player sits down
	duelRoom := hub.CreateRoom("vk-duel-test", "Duel 1v1", &game.GameSettings{
		MaxPlayers:   2,
		StartingCash: 1500,
		AutoStart:    true,
	})
	duelRoom.Engine.Lock()
	_, _ = duelRoom.Engine.AddPlayer("u1", "Mihai", "trolleybus", "#9F1239", false)
	if duelRoom.Engine.State.Phase != game.PhaseLobby {
		t.Fatalf("expected PhaseLobby with 1/2 players, got %s", duelRoom.Engine.State.Phase)
	}
	_, _ = duelRoom.Engine.AddPlayer("u2", "Elena", "wine", "#1E40AF", false)
	if duelRoom.Engine.State.Phase != game.PhaseRoll {
		t.Fatalf("expected AutoStart to transition 2/2 room to PhaseRoll, got %s", duelRoom.Engine.State.Phase)
	}
	duelRoom.Engine.Unlock()
}
