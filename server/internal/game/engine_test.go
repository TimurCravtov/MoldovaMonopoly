package game

import "testing"

func TestMonopolyCoreMechanics(t *testing.T) {
	eng := NewEngine("room1", "Chișinău Test")
	p1, err := eng.AddPlayer("p1", "Ion", "trolleybus", "#E11D48", false)
	if err != nil {
		t.Fatalf("unexpected error adding p1: %v", err)
	}
	p2, err := eng.AddPlayer("p2", "Vasile", "placinta", "#2563EB", false)
	if err != nil {
		t.Fatalf("unexpected error adding p2: %v", err)
	}

	if err := eng.StartGame("p1"); err != nil {
		t.Fatalf("failed to start game: %v", err)
	}

	// Test buying a property and Monopoly 2x rent + Even Building rule
	// Brown group is tile 1 (Otovasca, 60 MDL) and tile 3 (Poșta Veche, 60 MDL)
	p1.Position = 1
	eng.State.Phase = PhaseBuyOrAuction
	if err := eng.BuyProperty("p1"); err != nil {
		t.Fatalf("p1 buy tile 1 failed: %v", err)
	}
	if p1.Cash != 1440 {
		t.Fatalf("expected p1 cash 1440, got %d", p1.Cash)
	}

	// Single property rent should be base rent (2 MDL)
	if rent := eng.CalculateRent(eng.State.Tiles[1]); rent != 2 {
		t.Fatalf("expected base rent 2, got %d", rent)
	}

	// Now p1 also acquires tile 3 (Poșta Veche)
	p1.Position = 3
	eng.State.Phase = PhaseBuyOrAuction
	if err := eng.BuyProperty("p1"); err != nil {
		t.Fatalf("p1 buy tile 3 failed: %v", err)
	}

	// Full color set unimproved rent should double (4 MDL for tile 1, 8 MDL for tile 3)
	if rent := eng.CalculateRent(eng.State.Tiles[1]); rent != 4 {
		t.Fatalf("expected doubled monopoly rent 4, got %d", rent)
	}

	// Test Even Building rule: build 1 house on tile 1 (ok), then 2nd house on tile 1 before tile 3 (should fail)
	if err := eng.BuildHouse("p1", 1); err != nil {
		t.Fatalf("expected build first house on tile 1 to succeed: %v", err)
	}
	if err := eng.BuildHouse("p1", 1); err == nil {
		t.Fatalf("expected even build rule to block building 2nd house on tile 1 before tile 3 has 1")
	}
	if err := eng.BuildHouse("p1", 3); err != nil {
		t.Fatalf("expected building 1st house on tile 3 to succeed: %v", err)
	}

	// Test Auction flow
	eng.State.CurrentPlayerIdx = 1 // p2's turn
	p2.Position = 5                // Troleibuzul Nr. 22 (Price 200)
	eng.State.Phase = PhaseBuyOrAuction
	if err := eng.DeclineProperty("p2"); err != nil {
		t.Fatalf("decline property failed: %v", err)
	}
	if eng.State.Phase != PhaseAuction {
		t.Fatalf("expected PhaseAuction, got %s", eng.State.Phase)
	}
	if err := eng.PlaceBid("p2", 50); err != nil {
		t.Fatalf("p2 bid failed: %v", err)
	}
	if err := eng.PassAuction("p1"); err != nil {
		t.Fatalf("p1 pass auction failed: %v", err)
	}
	if eng.State.Tiles[5].OwnerID != "p2" {
		t.Fatalf("expected p2 to win auction for tile 5, owner is %q", eng.State.Tiles[5].OwnerID)
	}

	// Test Reset while locked does not unlock a different mutex and preserves connected human players
	eng.Lock()
	eng.Reset()
	eng.Unlock()
	if eng.State.Phase != PhaseLobby {
		t.Fatalf("expected PhaseLobby after Reset, got %s", eng.State.Phase)
	}
	if len(eng.State.Players) != 2 {
		t.Fatalf("expected 2 connected human players preserved after Reset, got %d", len(eng.State.Players))
	}
}
