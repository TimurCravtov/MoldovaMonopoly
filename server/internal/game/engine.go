package game

import (
	"errors"
	"fmt"
	"math/rand"
	"sync"
	"time"
)

var (
	AvailableTokens = []string{"trolleybus", "placinta", "grapes", "wine", "cusma", "rutiera", "sunflower", "violin"}
	AvailableColors = []string{"#9F1239", "#1E40AF", "#166534", "#B45309", "#581C87", "#0F766E", "#831843", "#3730A3"}
	BotNames        = []string{"Cumatrul Ion (AI)", "Nanasul Vasile (AI)", "Tanti Zina (AI)", "Soferul Ruta 22 (AI)", "Baiatul din Ciocana (AI)", "Inspectorul FISC (AI)"}
)

type Engine struct {
	mu                 sync.RWMutex
	State              *GameState
	chanceDeck         []Card
	communityChestDeck []Card
	chanceIdx          int
	communityIdx       int
	rng                *rand.Rand
}

func NewEngine(roomID, roomName string) *Engine {
	src := rand.NewSource(time.Now().UnixNano())
	rng := rand.New(src)

	e := &Engine{
		State: &GameState{
			RoomID:          roomID,
			RoomName:        roomName,
			Phase:           PhaseLobby,
			Players:         make([]*Player, 0),
			Tiles:           NewChisinauBoard(),
			HousesRemaining: 32,
			HotelsRemaining: 12,
			Trades:          make([]*TradeOffer, 0),
			Settings: GameSettings{
				StartingCash:       1500,
				FreeParkingJackpot: true,
				DoubleOnGo:         false,
				AuctionEnabled:     true,
			},
			Logs:       make([]LogEntry, 0),
			TurnNumber: 1,
		},
		chanceDeck:         NewChanceDeck(),
		communityChestDeck: NewCommunityChestDeck(),
		rng:                rng,
	}
	e.shuffleDecks()
	return e
}

func (e *Engine) shuffleDecks() {
	e.rng.Shuffle(len(e.chanceDeck), func(i, j int) {
		e.chanceDeck[i], e.chanceDeck[j] = e.chanceDeck[j], e.chanceDeck[i]
	})
	e.rng.Shuffle(len(e.communityChestDeck), func(i, j int) {
		e.communityChestDeck[i], e.communityChestDeck[j] = e.communityChestDeck[j], e.communityChestDeck[i]
	})
}

func (e *Engine) addLog(logType string, ro, en, ru string) {
	entry := LogEntry{
		ID:        fmt.Sprintf("log_%d_%d", time.Now().UnixNano(), len(e.State.Logs)),
		Timestamp: time.Now(),
		Type:      logType,
		Text: LocalizedText{
			RO: ro,
			EN: en,
			RU: ru,
		},
	}
	e.State.Logs = append(e.State.Logs, entry)
	if len(e.State.Logs) > 120 {
		e.State.Logs = e.State.Logs[len(e.State.Logs)-120:]
	}
}

func (e *Engine) Lock()   { e.mu.Lock() }
func (e *Engine) Unlock() { e.mu.Unlock() }

func (e *Engine) GetPlayer(id string) *Player {
	for _, p := range e.State.Players {
		if p.ID == id {
			return p
		}
	}
	return nil
}

func (e *Engine) CurrentPlayer() *Player {
	if len(e.State.Players) == 0 || e.State.CurrentPlayerIdx >= len(e.State.Players) {
		return nil
	}
	return e.State.Players[e.State.CurrentPlayerIdx]
}

func (e *Engine) AddPlayer(id, name, token, color string, isBot bool) (*Player, error) {
	if existing := e.GetPlayer(id); existing != nil {
		existing.Connected = true
		if name != "" {
			existing.Name = name
		}
		return existing, nil
	}
	if e.State.Phase != PhaseLobby {
		return nil, errors.New("game has already started")
	}
	if len(e.State.Players) >= 8 {
		return nil, errors.New("room is full (max 8 players)")
	}

	if token == "" {
		token = e.pickUnusedToken()
	}
	if color == "" {
		color = e.pickUnusedColor()
	}

	p := &Player{
		ID:        id,
		Name:      name,
		Token:     token,
		Color:     color,
		Cash:      e.State.Settings.StartingCash,
		Position:  0,
		IsBot:     isBot,
		Connected: true,
	}
	e.State.Players = append(e.State.Players, p)
	if e.State.HostID == "" && !isBot {
		e.State.HostID = id
	}

	e.addLog("info",
		fmt.Sprintf("%s s-a alăturat mesei.", p.Name),
		fmt.Sprintf("%s joined the table.", p.Name),
		fmt.Sprintf("%s присоединился к столу.", p.Name),
	)
	return p, nil
}

func (e *Engine) AddBot() (*Player, error) {
	if e.State.Phase != PhaseLobby {
		return nil, errors.New("can only add bots in lobby")
	}
	if len(e.State.Players) >= 8 {
		return nil, errors.New("room is full")
	}
	botIndex := 0
	for _, p := range e.State.Players {
		if p.IsBot {
			botIndex++
		}
	}
	botName := BotNames[botIndex%len(BotNames)]
	botID := fmt.Sprintf("bot_%d_%d", botIndex+1, time.Now().UnixMilli()%10000)
	return e.AddPlayer(botID, botName, "", "", true)
}

func (e *Engine) RemovePlayer(id string) error {
	if e.State.Phase != PhaseLobby {
		return errors.New("can only remove players in lobby")
	}
	idx := -1
	for i, p := range e.State.Players {
		if p.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return errors.New("player not found")
	}
	removed := e.State.Players[idx]
	e.State.Players = append(e.State.Players[:idx], e.State.Players[idx+1:]...)
	if e.State.HostID == id {
		e.State.HostID = ""
		for _, p := range e.State.Players {
			if !p.IsBot {
				e.State.HostID = p.ID
				break
			}
		}
	}
	e.addLog("info",
		fmt.Sprintf("%s a părăsit camera.", removed.Name),
		fmt.Sprintf("%s left the room.", removed.Name),
		fmt.Sprintf("%s покинул комнату.", removed.Name),
	)
	return nil
}

func (e *Engine) UpdateSettings(s GameSettings) error {
	if e.State.Phase != PhaseLobby {
		return errors.New("can only update settings in lobby")
	}
	if s.StartingCash < 500 || s.StartingCash > 5000 {
		s.StartingCash = 1500
	}
	e.State.Settings = s
	for _, p := range e.State.Players {
		p.Cash = s.StartingCash
	}
	return nil
}

func (e *Engine) UpdatePlayerAppearance(playerID, name, token, color string) error {
	if e.State.Phase != PhaseLobby {
		return errors.New("can only customize player in lobby")
	}
	p := e.GetPlayer(playerID)
	if p == nil {
		return errors.New("player not found")
	}
	if name != "" {
		p.Name = name
	}
	if token != "" {
		p.Token = token
	}
	if color != "" {
		p.Color = color
	}
	return nil
}

func (e *Engine) pickUnusedToken() string {
	used := map[string]bool{}
	for _, p := range e.State.Players {
		used[p.Token] = true
	}
	for _, t := range AvailableTokens {
		if !used[t] {
			return t
		}
	}
	return AvailableTokens[len(e.State.Players)%len(AvailableTokens)]
}

func (e *Engine) pickUnusedColor() string {
	used := map[string]bool{}
	for _, p := range e.State.Players {
		used[p.Color] = true
	}
	for _, c := range AvailableColors {
		if !used[c] {
			return c
		}
	}
	return AvailableColors[len(e.State.Players)%len(AvailableColors)]
}

func (e *Engine) StartGame(requesterID string) error {
	if e.State.Phase != PhaseLobby {
		return errors.New("game already started")
	}
	if len(e.State.Players) < 2 {
		return errors.New("need at least 2 players to start")
	}
	for _, p := range e.State.Players {
		p.Cash = e.State.Settings.StartingCash
		p.Position = 0
		p.InJail = false
		p.JailTurns = 0
		p.Bankrupt = false
	}
	e.State.CurrentPlayerIdx = 0
	e.State.Phase = PhaseRoll
	e.State.TurnNumber = 1
	cur := e.CurrentPlayer()
	e.addLog("info",
		fmt.Sprintf("Partida a început! Este rândul lui %s.", cur.Name),
		fmt.Sprintf("Match started! It is %s's turn.", cur.Name),
		fmt.Sprintf("Партия началась! Ходит %s.", cur.Name),
	)
	return nil
}

func (e *Engine) PayJailBail(playerID string) error {
	cur := e.CurrentPlayer()
	if cur == nil || cur.ID != playerID {
		return errors.New("not your turn")
	}
	if e.State.Phase != PhaseRoll || !cur.InJail {
		return errors.New("you are not in jail or cannot pay bail right now")
	}
	if cur.Cash < 50 {
		return errors.New("not enough cash to pay 50 MDL bail")
	}
	cur.Cash -= 50
	if e.State.Settings.FreeParkingJackpot {
		e.State.FreeParkingPot += 50
	}
	cur.InJail = false
	cur.JailTurns = 0
	e.addLog("jail",
		fmt.Sprintf("%s a achitat cauțiunea de 50 MDL și a ieșit din Penitenciarul Nr. 13.", cur.Name),
		fmt.Sprintf("%s paid 50 MDL bail and exited Prison No. 13.", cur.Name),
		fmt.Sprintf("%s заплатил залог 50 MDL и вышел из Тюрьмы № 13.", cur.Name),
	)
	return nil
}

func (e *Engine) UseJailCard(playerID string) error {
	cur := e.CurrentPlayer()
	if cur == nil || cur.ID != playerID {
		return errors.New("not your turn")
	}
	if e.State.Phase != PhaseRoll || !cur.InJail {
		return errors.New("you are not in jail")
	}
	if cur.GetOutOfJailFree <= 0 {
		return errors.New("no Get Out of Jail Free card available")
	}
	cur.GetOutOfJailFree--
	cur.InJail = false
	cur.JailTurns = 0
	e.addLog("jail",
		fmt.Sprintf("%s a folosit «Scrisoarea de la Cumătru» și a fost eliberat din Penitenciarul Nr. 13.", cur.Name),
		fmt.Sprintf("%s used 'Letter from Cumătru' and exited Prison No. 13 for free.", cur.Name),
		fmt.Sprintf("%s использовал «Звонок от Кума» и вышел из Тюрьмы № 13.", cur.Name),
	)
	return nil
}

func (e *Engine) RollDice(playerID string) error {
	cur := e.CurrentPlayer()
	if cur == nil || cur.ID != playerID {
		return errors.New("not your turn")
	}
	if e.State.Phase != PhaseRoll {
		return errors.New("cannot roll dice in current phase")
	}

	d1 := e.rng.Intn(6) + 1
	d2 := e.rng.Intn(6) + 1
	e.State.LastDice = [2]int{d1, d2}
	e.State.HasRolled = true
	e.State.LastDrawnCard = nil
	isDoubles := d1 == d2
	sum := d1 + d2

	if cur.InJail {
		if isDoubles {
			cur.InJail = false
			cur.JailTurns = 0
			e.State.DoublesCount = 0
			e.addLog("jail",
				fmt.Sprintf("%s a aruncat dublă (%d+%d) și a ieșit din Penitenciarul Nr. 13!", cur.Name, d1, d2),
				fmt.Sprintf("%s rolled doubles (%d+%d) and escaped Prison No. 13!", cur.Name, d1, d2),
				fmt.Sprintf("%s выбросил дубль (%d+%d) и вышел из Тюрьмы № 13!", cur.Name, d1, d2),
			)
			e.movePlayerBySteps(cur, sum, false)
			return nil
		}

		cur.JailTurns++
		if cur.JailTurns >= 3 {
			cur.InJail = false
			cur.JailTurns = 0
			e.addLog("jail",
				fmt.Sprintf("%s nu a dat dublă după 3 încercări (%d+%d). Achită 50 MDL cauțiune și avansează.", cur.Name, d1, d2),
				fmt.Sprintf("%s failed 3rd roll (%d+%d). Pays 50 MDL bail and moves.", cur.Name, d1, d2),
				fmt.Sprintf("%s не выбросил дубль с 3-й попытки (%d+%d). Платит 50 MDL и идёт вперёд.", cur.Name, d1, d2),
			)
			if e.State.Settings.FreeParkingJackpot {
				e.State.FreeParkingPot += 50
			}
			cur.Cash -= 50
			e.movePlayerBySteps(cur, sum, false)
			if cur.Cash < 0 && e.State.Phase != PhaseDebt {
				e.setDebt(cur, "", -cur.Cash, LocalizedText{
					RO: "Cauțiune Penitenciarul Nr. 13",
					EN: "Prison No. 13 Bail",
					RU: "Залог Тюрьмы № 13",
				})
			}
			return nil
		}

		e.addLog("jail",
			fmt.Sprintf("%s a aruncat %d+%d (fără dublă) și rămâne în Penitenciarul Nr. 13 (%d/3).", cur.Name, d1, d2, cur.JailTurns),
			fmt.Sprintf("%s rolled %d+%d (no doubles) and stays in Prison No. 13 (%d/3).", cur.Name, d1, d2, cur.JailTurns),
			fmt.Sprintf("%s выбросил %d+%d (без дубля) и остаётся в Тюрьме № 13 (%d/3).", cur.Name, d1, d2, cur.JailTurns),
		)
		e.State.Phase = PhaseAction
		return nil
	}

	if isDoubles {
		e.State.DoublesCount++
		if e.State.DoublesCount >= 3 {
			e.addLog("jail",
				fmt.Sprintf("%s a dat 3 duble consecutiv (%d+%d)! Trimis direct la Penitenciarul Nr. 13!", cur.Name, d1, d2),
				fmt.Sprintf("%s rolled 3 consecutive doubles (%d+%d)! Sent directly to Prison No. 13!", cur.Name, d1, d2),
				fmt.Sprintf("%s выбросил 3 дубля подряд (%d+%d)! Отправлен прямо в Тюрьму № 13!", cur.Name, d1, d2),
			)
			e.sendToJail(cur)
			return nil
		}
	} else {
		e.State.DoublesCount = 0
	}

	e.movePlayerBySteps(cur, sum, isDoubles)
	return nil
}

func (e *Engine) movePlayerBySteps(p *Player, steps int, allowExtraRoll bool) {
	oldPos := p.Position
	newPos := (oldPos + steps) % 40
	if newPos < 0 {
		newPos += 40
	}
	passedGo := steps > 0 && (oldPos+steps) >= 40
	p.Position = newPos

	tile := e.State.Tiles[newPos]
	d1, d2 := e.State.LastDice[0], e.State.LastDice[1]
	e.addLog("info",
		fmt.Sprintf("%s a aruncat %d+%d=%d și a ajuns pe «%s».", p.Name, d1, d2, d1+d2, tile.Name.RO),
		fmt.Sprintf("%s rolled %d+%d=%d and landed on '%s'.", p.Name, d1, d2, d1+d2, tile.Name.EN),
		fmt.Sprintf("%s выбросил %d+%d=%d и попал на «%s».", p.Name, d1, d2, d1+d2, tile.Name.RU),
	)

	if passedGo {
		goReward := 200
		if newPos == 0 && e.State.Settings.DoubleOnGo {
			goReward = 400
		}
		p.Cash += goReward
		e.addLog("info",
			fmt.Sprintf("%s a trecut pe la START (Ziua de Salariu) și a încasat %d MDL.", p.Name, goReward),
			fmt.Sprintf("%s passed GO (Payday) and collected %d MDL.", p.Name, goReward),
			fmt.Sprintf("%s прошёл СТАРТ (День зарплаты) и получил %d MDL.", p.Name, goReward),
		)
	}

	e.resolveTileLanding(p, tile, 1)
}

func (e *Engine) movePlayerToIndex(p *Player, targetIdx int, collectGo bool, rentMultiplier int) {
	oldPos := p.Position
	if collectGo && targetIdx < oldPos && targetIdx != 10 {
		p.Cash += 200
		e.addLog("info",
			fmt.Sprintf("%s a trecut pe la START și a încasat 200 MDL.", p.Name),
			fmt.Sprintf("%s passed GO and collected 200 MDL.", p.Name),
			fmt.Sprintf("%s прошёл СТАРТ и получил 200 MDL.", p.Name),
		)
	} else if collectGo && targetIdx == 0 && oldPos != 0 {
		goReward := 200
		if e.State.Settings.DoubleOnGo {
			goReward = 400
		}
		p.Cash += goReward
		e.addLog("info",
			fmt.Sprintf("%s a ajuns pe START și a încasat %d MDL.", p.Name, goReward),
			fmt.Sprintf("%s landed on GO and collected %d MDL.", p.Name, goReward),
			fmt.Sprintf("%s попал на СТАРТ и получил %d MDL.", p.Name, goReward),
		)
	}
	p.Position = targetIdx
	tile := e.State.Tiles[targetIdx]
	e.resolveTileLanding(p, tile, rentMultiplier)
}

func (e *Engine) sendToJail(p *Player) {
	p.Position = 10
	p.InJail = true
	p.JailTurns = 0
	e.State.DoublesCount = 0
	e.State.Phase = PhaseAction
}

func (e *Engine) resolveTileLanding(p *Player, tile *Tile, rentMultiplier int) {
	switch tile.Type {
	case TileGo, TileJail:
		e.finishPostLandingPhase()

	case TileFreeParking:
		if e.State.Settings.FreeParkingJackpot && e.State.FreeParkingPot > 0 {
			pot := e.State.FreeParkingPot
			e.State.FreeParkingPot = 0
			p.Cash += pot
			e.addLog("info",
				fmt.Sprintf("%s a încasat fondul de la Arcul de Triumf: +%d MDL!", p.Name, pot),
				fmt.Sprintf("%s collected the Triumphal Arch Free Parking pot: +%d MDL!", p.Name, pot),
				fmt.Sprintf("%s получил фонд Бесплатной Парковки у Арки Победы: +%d MDL!", p.Name, pot),
			)
		}
		e.finishPostLandingPhase()

	case TileGoToJail:
		e.addLog("jail",
			fmt.Sprintf("%s a fost reținut de CNA și trimis la Penitenciarul Nr. 13!", p.Name),
			fmt.Sprintf("%s was detained by CNA and sent to Prison No. 13!", p.Name),
			fmt.Sprintf("%s задержан НЦБК и отправлен в Тюрьму № 13!", p.Name),
		)
		e.sendToJail(p)

	case TileTax:
		amount := tile.TaxAmount
		if e.State.Settings.FreeParkingJackpot {
			e.State.FreeParkingPot += amount
		}
		e.chargePlayer(p, "", amount, tile.Name)

	case TileChance:
		card := e.drawChanceCard()
		e.applyCard(p, card)

	case TileCommunityChest:
		card := e.drawCommunityCard()
		e.applyCard(p, card)

	case TileProperty, TileTransport, TileUtility:
		if tile.OwnerID == "" {
			e.State.Phase = PhaseBuyOrAuction
			return
		}
		if tile.OwnerID == p.ID {
			e.finishPostLandingPhase()
			return
		}
		if tile.Mortgaged {
			e.addLog("info",
				fmt.Sprintf("«%s» este ipotecată — nu se percepe chirie.", tile.Name.RO),
				fmt.Sprintf("'%s' is mortgaged — no rent is due.", tile.Name.EN),
				fmt.Sprintf("«%s» в залоге — аренда не взимается.", tile.Name.RU),
			)
			e.finishPostLandingPhase()
			return
		}
		owner := e.GetPlayer(tile.OwnerID)
		if owner == nil || owner.Bankrupt {
			e.finishPostLandingPhase()
			return
		}
		rent := e.CalculateRent(tile) * rentMultiplier
		e.addLog("rent",
			fmt.Sprintf("%s îi achită %d MDL chirie lui %s pentru «%s».", p.Name, rent, owner.Name, tile.Name.RO),
			fmt.Sprintf("%s pays %d MDL rent to %s for '%s'.", p.Name, rent, owner.Name, tile.Name.EN),
			fmt.Sprintf("%s платит %d MDL аренды игроку %s за «%s».", p.Name, rent, owner.Name, tile.Name.RU),
		)
		e.chargePlayer(p, owner.ID, rent, tile.Name)
	}
}

func (e *Engine) CalculateRent(tile *Tile) int {
	if tile.OwnerID == "" || tile.Mortgaged {
		return 0
	}
	switch tile.Type {
	case TileProperty:
		if tile.Houses > 0 && tile.Houses < len(tile.Rents) {
			return tile.Rents[tile.Houses]
		}
		base := tile.Rents[0]
		if e.OwnsFullColorGroup(tile.OwnerID, tile.Group) {
			return base * 2
		}
		return base

	case TileTransport:
		count := 0
		for _, t := range e.State.Tiles {
			if t.Type == TileTransport && t.OwnerID == tile.OwnerID && !t.Mortgaged {
				count++
			}
		}
		if count <= 0 {
			return 0
		}
		if count > len(tile.Rents) {
			count = len(tile.Rents)
		}
		return tile.Rents[count-1]

	case TileUtility:
		count := 0
		for _, t := range e.State.Tiles {
			if t.Type == TileUtility && t.OwnerID == tile.OwnerID && !t.Mortgaged {
				count++
			}
		}
		diceSum := e.State.LastDice[0] + e.State.LastDice[1]
		if diceSum == 0 {
			diceSum = 7
		}
		if count >= 2 {
			return diceSum * 10
		}
		return diceSum * 4
	}
	return 0
}

func (e *Engine) OwnsFullColorGroup(playerID string, group ColorGroup) bool {
	if group == GroupNone || playerID == "" {
		return false
	}
	count := 0
	for _, t := range e.State.Tiles {
		if t.Group == group {
			count++
			if t.OwnerID != playerID || t.Mortgaged {
				return false
			}
		}
	}
	return count > 0
}

func (e *Engine) drawChanceCard() Card {
	card := e.chanceDeck[e.chanceIdx%len(e.chanceDeck)]
	e.chanceIdx++
	return card
}

func (e *Engine) drawCommunityCard() Card {
	card := e.communityChestDeck[e.communityIdx%len(e.communityChestDeck)]
	e.communityIdx++
	return card
}

func (e *Engine) applyCard(p *Player, card Card) {
	c := card
	e.State.LastDrawnCard = &c
	e.addLog("card",
		fmt.Sprintf("%s a tras cartea «%s»: %s", p.Name, card.Title.RO, card.Description.RO),
		fmt.Sprintf("%s drew '%s': %s", p.Name, card.Title.EN, card.Description.EN),
		fmt.Sprintf("%s вытянул «%s»: %s", p.Name, card.Title.RU, card.Description.RU),
	)

	switch card.Effect {
	case EffectMoney:
		if card.Value >= 0 {
			p.Cash += card.Value
			e.finishPostLandingPhase()
		} else {
			cost := -card.Value
			if e.State.Settings.FreeParkingJackpot {
				e.State.FreeParkingPot += cost
			}
			e.chargePlayer(p, "", cost, card.Title)
		}

	case EffectMoveTo:
		e.movePlayerToIndex(p, card.Value, true, 1)

	case EffectMoveSteps:
		e.movePlayerBySteps(p, card.Value, false)

	case EffectGoToJail:
		e.sendToJail(p)

	case EffectGetOutOfJail:
		p.GetOutOfJailFree++
		e.finishPostLandingPhase()

	case EffectEachPlayer:
		if card.Value > 0 {
			total := 0
			for _, other := range e.State.Players {
				if other.ID != p.ID && !other.Bankrupt {
					amount := card.Value
					if other.Cash < amount {
						amount = other.Cash
					}
					other.Cash -= amount
					total += amount
				}
			}
			p.Cash += total
			e.finishPostLandingPhase()
		} else {
			perPlayer := -card.Value
			activeOthers := 0
			for _, other := range e.State.Players {
				if other.ID != p.ID && !other.Bankrupt {
					activeOthers++
				}
			}
			totalCost := perPlayer * activeOthers
			for _, other := range e.State.Players {
				if other.ID != p.ID && !other.Bankrupt {
					other.Cash += perPlayer
				}
			}
			e.chargePlayer(p, "", totalCost, card.Title)
		}

	case EffectStreetRepairs:
		houses := 0
		hotels := 0
		for _, t := range e.State.Tiles {
			if t.OwnerID == p.ID {
				if t.Houses == 5 {
					hotels++
				} else if t.Houses > 0 {
					houses += t.Houses
				}
			}
		}
		totalCost := houses*card.Value + hotels*card.ExtraValue
		if totalCost == 0 {
			e.finishPostLandingPhase()
			return
		}
		if e.State.Settings.FreeParkingJackpot {
			e.State.FreeParkingPot += totalCost
		}
		e.chargePlayer(p, "", totalCost, card.Title)

	case EffectNearestTransp:
		transports := []int{5, 15, 25, 35}
		target := transports[0]
		for _, idx := range transports {
			if idx > p.Position {
				target = idx
				break
			}
		}
		e.movePlayerToIndex(p, target, true, 2)

	case EffectNearestUtility:
		utilities := []int{12, 28}
		target := utilities[0]
		for _, idx := range utilities {
			if idx > p.Position {
				target = idx
				break
			}
		}
		e.movePlayerToIndex(p, target, true, 2)
	}
}

func (e *Engine) chargePlayer(debtor *Player, creditorID string, amount int, reason LocalizedText) {
	if amount <= 0 {
		e.finishPostLandingPhase()
		return
	}
	if debtor.Cash >= amount {
		debtor.Cash -= amount
		if creditorID != "" {
			if cred := e.GetPlayer(creditorID); cred != nil {
				cred.Cash += amount
			}
		}
		e.finishPostLandingPhase()
		return
	}
	e.setDebt(debtor, creditorID, amount, reason)
}

func (e *Engine) setDebt(debtor *Player, creditorID string, amount int, reason LocalizedText) {
	e.State.PendingDebt = &DebtState{
		DebtorID:   debtor.ID,
		CreditorID: creditorID,
		Amount:     amount,
		Reason:     reason,
	}
	e.State.Phase = PhaseDebt
	e.addLog("tax",
		fmt.Sprintf("%s are o datorie scadentă de %d MDL (disponibil: %d MDL).", debtor.Name, amount, debtor.Cash),
		fmt.Sprintf("%s owes %d MDL (available: %d MDL).", debtor.Name, amount, debtor.Cash),
		fmt.Sprintf("%s должен %d MDL (доступно: %d MDL).", debtor.Name, amount, debtor.Cash),
	)
}

func (e *Engine) PayDebt(playerID string) error {
	if e.State.Phase != PhaseDebt || e.State.PendingDebt == nil {
		return errors.New("no pending debt")
	}
	debt := e.State.PendingDebt
	if debt.DebtorID != playerID {
		return errors.New("not your debt")
	}
	p := e.GetPlayer(playerID)
	if p == nil || p.Cash < debt.Amount {
		return errors.New("insufficient cash to pay debt")
	}
	p.Cash -= debt.Amount
	if debt.CreditorID != "" {
		if cred := e.GetPlayer(debt.CreditorID); cred != nil {
			cred.Cash += debt.Amount
		}
	}
	e.State.PendingDebt = nil
	e.addLog("info",
		fmt.Sprintf("%s a achitat integral datoria de %d MDL.", p.Name, debt.Amount),
		fmt.Sprintf("%s paid off the %d MDL debt.", p.Name, debt.Amount),
		fmt.Sprintf("%s полностью погасил долг %d MDL.", p.Name, debt.Amount),
	)
	e.finishPostLandingPhase()
	return nil
}

func (e *Engine) finishPostLandingPhase() {
	cur := e.CurrentPlayer()
	if cur != nil && !cur.InJail && e.State.DoublesCount > 0 {
		e.State.Phase = PhaseRoll
		e.State.HasRolled = false
		e.addLog("info",
			fmt.Sprintf("Dublă! %s primește încă o aruncare.", cur.Name),
			fmt.Sprintf("Doubles! %s gets an extra roll.", cur.Name),
			fmt.Sprintf("Дубль! %s получает дополнительный бросок.", cur.Name),
		)
		return
	}
	e.State.Phase = PhaseAction
}

func (e *Engine) BuyProperty(playerID string) error {
	cur := e.CurrentPlayer()
	if cur == nil || cur.ID != playerID {
		return errors.New("not your turn")
	}
	if e.State.Phase != PhaseBuyOrAuction {
		return errors.New("not in buy or auction phase")
	}
	tile := e.State.Tiles[cur.Position]
	if tile.OwnerID != "" {
		return errors.New("property already owned")
	}
	if cur.Cash < tile.Price {
		return errors.New("not enough MDL to buy this property")
	}
	cur.Cash -= tile.Price
	tile.OwnerID = cur.ID
	tile.Mortgaged = false
	tile.Houses = 0

	e.addLog("buy",
		fmt.Sprintf("%s a achiziționat «%s» pentru %d MDL.", cur.Name, tile.Name.RO, tile.Price),
		fmt.Sprintf("%s purchased '%s' for %d MDL.", cur.Name, tile.Name.EN, tile.Price),
		fmt.Sprintf("%s приобрёл «%s» за %d MDL.", cur.Name, tile.Name.RU, tile.Price),
	)
	e.finishPostLandingPhase()
	return nil
}

func (e *Engine) DeclineProperty(playerID string) error {
	cur := e.CurrentPlayer()
	if cur == nil || cur.ID != playerID {
		return errors.New("not your turn")
	}
	if e.State.Phase != PhaseBuyOrAuction {
		return errors.New("not in buy phase")
	}
	tile := e.State.Tiles[cur.Position]
	if !e.State.Settings.AuctionEnabled {
		e.finishPostLandingPhase()
		return nil
	}

	e.State.Auction = &AuctionState{
		TileIndex:       tile.Index,
		CurrentBid:      10,
		HighestBidderID: "",
		PassedPlayers:   make(map[string]bool),
		ActiveBidderID:  cur.ID,
	}
	e.State.Phase = PhaseAuction
	e.addLog("info",
		fmt.Sprintf("Licitație deschisă pentru «%s»! Preț de pornire: 10 MDL.", tile.Name.RO),
		fmt.Sprintf("Auction started for '%s'! Starting bid: 10 MDL.", tile.Name.EN),
		fmt.Sprintf("Открыт аукцион за «%s»! Стартовая ставка: 10 MDL.", tile.Name.RU),
	)
	return nil
}

func (e *Engine) PlaceBid(playerID string, amount int) error {
	if e.State.Phase != PhaseAuction || e.State.Auction == nil {
		return errors.New("no active auction")
	}
	auc := e.State.Auction
	p := e.GetPlayer(playerID)
	if p == nil || p.Bankrupt || auc.PassedPlayers[playerID] {
		return errors.New("cannot bid in this auction")
	}
	minBid := auc.CurrentBid + 10
	if auc.HighestBidderID == "" {
		minBid = 10
	}
	if amount < minBid {
		return fmt.Errorf("minimum bid is %d MDL", minBid)
	}
	if p.Cash < amount {
		return errors.New("not enough cash for this bid")
	}
	auc.CurrentBid = amount
	auc.HighestBidderID = playerID
	tile := e.State.Tiles[auc.TileIndex]
	e.addLog("buy",
		fmt.Sprintf("%s licitează %d MDL pentru «%s».", p.Name, amount, tile.Name.RO),
		fmt.Sprintf("%s bids %d MDL for '%s'.", p.Name, amount, tile.Name.EN),
		fmt.Sprintf("%s ставит %d MDL за «%s».", p.Name, amount, tile.Name.RU),
	)
	e.advanceAuctionTurn(playerID)
	return nil
}

func (e *Engine) PassAuction(playerID string) error {
	if e.State.Phase != PhaseAuction || e.State.Auction == nil {
		return errors.New("no active auction")
	}
	auc := e.State.Auction
	auc.PassedPlayers[playerID] = true
	e.advanceAuctionTurn(playerID)
	return nil
}

func (e *Engine) advanceAuctionTurn(lastPlayerID string) {
	auc := e.State.Auction
	if auc == nil {
		return
	}

	eligible := make([]*Player, 0)
	for _, p := range e.State.Players {
		if !p.Bankrupt && !auc.PassedPlayers[p.ID] {
			eligible = append(eligible, p)
		}
	}

	if len(eligible) == 0 || (len(eligible) == 1 && eligible[0].ID == auc.HighestBidderID) {
		e.concludeAuction()
		return
	}

	startIdx := 0
	for i, p := range e.State.Players {
		if p.ID == lastPlayerID {
			startIdx = i
			break
		}
	}
	for offset := 1; offset <= len(e.State.Players); offset++ {
		cand := e.State.Players[(startIdx+offset)%len(e.State.Players)]
		if !cand.Bankrupt && !auc.PassedPlayers[cand.ID] {
			auc.ActiveBidderID = cand.ID
			break
		}
	}
}

func (e *Engine) concludeAuction() {
	auc := e.State.Auction
	if auc == nil {
		return
	}
	tile := e.State.Tiles[auc.TileIndex]
	if auc.HighestBidderID != "" {
		winner := e.GetPlayer(auc.HighestBidderID)
		if winner != nil && winner.Cash >= auc.CurrentBid {
			winner.Cash -= auc.CurrentBid
			tile.OwnerID = winner.ID
			tile.Mortgaged = false
			tile.Houses = 0
			e.addLog("buy",
				fmt.Sprintf("%s a adjudecat «%s» la licitație pentru %d MDL!", winner.Name, tile.Name.RO, auc.CurrentBid),
				fmt.Sprintf("%s won the auction for '%s' at %d MDL!", winner.Name, tile.Name.EN, auc.CurrentBid),
				fmt.Sprintf("%s выиграл аукцион за «%s» за %d MDL!", winner.Name, tile.Name.RU, auc.CurrentBid),
			)
		}
	} else {
		e.addLog("info",
			fmt.Sprintf("Licitația pentru «%s» s-a încheiat fără oferte.", tile.Name.RO),
			fmt.Sprintf("Auction for '%s' ended with no bids.", tile.Name.EN),
			fmt.Sprintf("Аукцион за «%s» завершился без ставок.", tile.Name.RU),
		)
	}
	e.State.Auction = nil
	e.finishPostLandingPhase()
}

func (e *Engine) BuildHouse(playerID string, tileIdx int) error {
	if tileIdx < 0 || tileIdx >= len(e.State.Tiles) {
		return errors.New("invalid tile index")
	}
	p := e.GetPlayer(playerID)
	tile := e.State.Tiles[tileIdx]
	if p == nil || tile.OwnerID != playerID {
		return errors.New("you do not own this property")
	}
	if tile.Type != TileProperty {
		return errors.New("can only build on street properties")
	}
	if !e.OwnsFullColorGroup(playerID, tile.Group) {
		return errors.New("must own all unmortgaged properties in color group")
	}
	if tile.Houses >= 5 {
		return errors.New("maximum development (Hotel) reached")
	}
	if p.Cash < tile.HouseCost {
		return errors.New("insufficient MDL to build")
	}

	minHouses := 5
	for _, t := range e.State.Tiles {
		if t.Group == tile.Group {
			if t.Mortgaged {
				return errors.New("cannot build while a property in the group is mortgaged")
			}
			if t.Houses < minHouses {
				minHouses = t.Houses
			}
		}
	}
	if tile.Houses > minHouses {
		return errors.New("even building rule: build evenly across all properties in this color group first")
	}

	if tile.Houses == 4 {
		if e.State.HotelsRemaining <= 0 {
			return errors.New("no hotels remaining in the bank")
		}
		e.State.HotelsRemaining--
		e.State.HousesRemaining += 4
	} else {
		if e.State.HousesRemaining <= 0 {
			return errors.New("no houses remaining in the bank")
		}
		e.State.HousesRemaining--
	}

	p.Cash -= tile.HouseCost
	tile.Houses++
	labelRO, labelEN, labelRU := "o casă", "a house", "дом"
	if tile.Houses == 5 {
		labelRO, labelEN, labelRU = "un hotel de lux", "a luxury hotel", "отель"
	}
	e.addLog("buy",
		fmt.Sprintf("%s a construit %s pe «%s» (-%d MDL).", p.Name, labelRO, tile.Name.RO, tile.HouseCost),
		fmt.Sprintf("%s built %s on '%s' (-%d MDL).", p.Name, labelEN, tile.Name.EN, tile.HouseCost),
		fmt.Sprintf("%s построил %s на «%s» (-%d MDL).", p.Name, labelRU, tile.Name.RU, tile.HouseCost),
	)
	return nil
}

func (e *Engine) SellHouse(playerID string, tileIdx int) error {
	if tileIdx < 0 || tileIdx >= len(e.State.Tiles) {
		return errors.New("invalid tile index")
	}
	p := e.GetPlayer(playerID)
	tile := e.State.Tiles[tileIdx]
	if p == nil || tile.OwnerID != playerID {
		return errors.New("you do not own this property")
	}
	if tile.Houses <= 0 {
		return errors.New("no houses to sell on this property")
	}

	maxHouses := 0
	for _, t := range e.State.Tiles {
		if t.Group == tile.Group && t.Houses > maxHouses {
			maxHouses = t.Houses
		}
	}
	if tile.Houses < maxHouses {
		return errors.New("even selling rule: sell from the most developed property in this group first")
	}

	if tile.Houses == 5 {
		e.State.HotelsRemaining++
		if e.State.HousesRemaining >= 4 {
			e.State.HousesRemaining -= 4
		}
	} else {
		e.State.HousesRemaining++
	}

	refund := tile.HouseCost / 2
	tile.Houses--
	p.Cash += refund

	e.addLog("info",
		fmt.Sprintf("%s a vândut o clădire de pe «%s» (+%d MDL).", p.Name, tile.Name.RO, refund),
		fmt.Sprintf("%s sold a building on '%s' (+%d MDL).", p.Name, tile.Name.EN, refund),
		fmt.Sprintf("%s продал постройку на «%s» (+%d MDL).", p.Name, tile.Name.RU, refund),
	)
	return nil
}

func (e *Engine) MortgageProperty(playerID string, tileIdx int) error {
	if tileIdx < 0 || tileIdx >= len(e.State.Tiles) {
		return errors.New("invalid tile index")
	}
	p := e.GetPlayer(playerID)
	tile := e.State.Tiles[tileIdx]
	if p == nil || tile.OwnerID != playerID {
		return errors.New("you do not own this property")
	}
	if tile.Mortgaged {
		return errors.New("property is already mortgaged")
	}
	for _, t := range e.State.Tiles {
		if t.Group == tile.Group && tile.Group != GroupNone && t.Houses > 0 {
			return errors.New("must sell all houses in this color group before mortgaging")
		}
	}

	mortgageValue := tile.Price / 2
	tile.Mortgaged = true
	p.Cash += mortgageValue

	e.addLog("info",
		fmt.Sprintf("%s a ipotecat «%s» pentru +%d MDL.", p.Name, tile.Name.RO, mortgageValue),
		fmt.Sprintf("%s mortgaged '%s' for +%d MDL.", p.Name, tile.Name.EN, mortgageValue),
		fmt.Sprintf("%s заложил «%s» за +%d MDL.", p.Name, tile.Name.RU, mortgageValue),
	)
	return nil
}

func (e *Engine) UnmortgageProperty(playerID string, tileIdx int) error {
	if tileIdx < 0 || tileIdx >= len(e.State.Tiles) {
		return errors.New("invalid tile index")
	}
	p := e.GetPlayer(playerID)
	tile := e.State.Tiles[tileIdx]
	if p == nil || tile.OwnerID != playerID {
		return errors.New("you do not own this property")
	}
	if !tile.Mortgaged {
		return errors.New("property is not mortgaged")
	}

	cost := (tile.Price * 55) / 100
	if p.Cash < cost {
		return fmt.Errorf("need %d MDL to unmortgage", cost)
	}
	p.Cash -= cost
	tile.Mortgaged = false

	e.addLog("info",
		fmt.Sprintf("%s a ridicat ipoteca de pe «%s» (-%d MDL).", p.Name, tile.Name.RO, cost),
		fmt.Sprintf("%s unmortgaged '%s' (-%d MDL).", p.Name, tile.Name.EN, cost),
		fmt.Sprintf("%s выкупил залог «%s» (-%d MDL).", p.Name, tile.Name.RU, cost),
	)
	return nil
}

func (e *Engine) ProposeTrade(offer TradeOffer) (*TradeOffer, error) {
	from := e.GetPlayer(offer.FromPlayerID)
	to := e.GetPlayer(offer.ToPlayerID)
	if from == nil || to == nil || from.Bankrupt || to.Bankrupt || from.ID == to.ID {
		return nil, errors.New("invalid trade participants")
	}
	if offer.OfferCash < 0 || offer.RequestCash < 0 || from.Cash < offer.OfferCash {
		return nil, errors.New("invalid cash amount in trade")
	}
	if offer.OfferJailCards < 0 || offer.OfferJailCards > from.GetOutOfJailFree {
		return nil, errors.New("invalid Get Out of Jail cards offered")
	}
	if offer.RequestJailCards < 0 || offer.RequestJailCards > to.GetOutOfJailFree {
		return nil, errors.New("invalid Get Out of Jail cards requested")
	}

	for _, idx := range offer.OfferProperties {
		if idx < 0 || idx >= 40 || e.State.Tiles[idx].OwnerID != from.ID || e.State.Tiles[idx].Houses > 0 {
			return nil, errors.New("offered property cannot have houses or belongs to someone else")
		}
	}
	for _, idx := range offer.RequestProperties {
		if idx < 0 || idx >= 40 || e.State.Tiles[idx].OwnerID != to.ID || e.State.Tiles[idx].Houses > 0 {
			return nil, errors.New("requested property cannot have houses or belongs to someone else")
		}
	}

	offer.ID = fmt.Sprintf("tr_%d", time.Now().UnixNano())
	offer.Status = "PENDING"
	e.State.Trades = append(e.State.Trades, &offer)

	e.addLog("trade",
		fmt.Sprintf("%s i-a trimis o ofertă comercială lui %s.", from.Name, to.Name),
		fmt.Sprintf("%s proposed a trade to %s.", from.Name, to.Name),
		fmt.Sprintf("%s предложил сделку игроку %s.", from.Name, to.Name),
	)

	if to.IsBot {
		e.evaluateBotTrade(&offer)
	}
	return &offer, nil
}

func (e *Engine) RespondTrade(tradeID, playerID string, accept bool) error {
	var tr *TradeOffer
	for _, t := range e.State.Trades {
		if t.ID == tradeID {
			tr = t
			break
		}
	}
	if tr == nil || tr.Status != "PENDING" {
		return errors.New("trade offer not found or no longer pending")
	}
	if tr.ToPlayerID != playerID && tr.FromPlayerID != playerID {
		return errors.New("not authorized for this trade")
	}
	if !accept {
		tr.Status = "REJECTED"
		from := e.GetPlayer(tr.FromPlayerID)
		to := e.GetPlayer(tr.ToPlayerID)
		if from != nil && to != nil {
			e.addLog("trade",
				fmt.Sprintf("Tranzacția dintre %s și %s a fost refuzată.", from.Name, to.Name),
				fmt.Sprintf("Trade between %s and %s was declined.", from.Name, to.Name),
				fmt.Sprintf("Сделка между %s и %s была отклонена.", from.Name, to.Name),
			)
		}
		return nil
	}
	if tr.ToPlayerID != playerID {
		return errors.New("only the recipient can accept the trade")
	}

	from := e.GetPlayer(tr.FromPlayerID)
	to := e.GetPlayer(tr.ToPlayerID)
	if from == nil || to == nil || from.Cash < tr.OfferCash || to.Cash < tr.RequestCash {
		return errors.New("players no longer have required cash")
	}
	for _, idx := range tr.OfferProperties {
		if e.State.Tiles[idx].OwnerID != from.ID || e.State.Tiles[idx].Houses > 0 {
			return errors.New("offered property no longer valid")
		}
	}
	for _, idx := range tr.RequestProperties {
		if e.State.Tiles[idx].OwnerID != to.ID || e.State.Tiles[idx].Houses > 0 {
			return errors.New("requested property no longer valid")
		}
	}

	from.Cash = from.Cash - tr.OfferCash + tr.RequestCash
	to.Cash = to.Cash - tr.RequestCash + tr.OfferCash
	from.GetOutOfJailFree = from.GetOutOfJailFree - tr.OfferJailCards + tr.RequestJailCards
	to.GetOutOfJailFree = to.GetOutOfJailFree - tr.RequestJailCards + tr.OfferJailCards

	for _, idx := range tr.OfferProperties {
		e.State.Tiles[idx].OwnerID = to.ID
	}
	for _, idx := range tr.RequestProperties {
		e.State.Tiles[idx].OwnerID = from.ID
	}
	tr.Status = "ACCEPTED"

	e.addLog("trade",
		fmt.Sprintf("Tranzacție încheiată între %s și %s.", from.Name, to.Name),
		fmt.Sprintf("Trade completed between %s and %s.", from.Name, to.Name),
		fmt.Sprintf("Сделка между %s и %s успешно заключена.", from.Name, to.Name),
	)
	return nil
}

func (e *Engine) DeclareBankruptcy(playerID string) error {
	p := e.GetPlayer(playerID)
	if p == nil || p.Bankrupt {
		return errors.New("invalid player")
	}

	creditorID := ""
	if e.State.PendingDebt != nil && e.State.PendingDebt.DebtorID == playerID {
		creditorID = e.State.PendingDebt.CreditorID
	}

	for _, t := range e.State.Tiles {
		if t.OwnerID == p.ID && t.Houses > 0 {
			if t.Houses == 5 {
				e.State.HotelsRemaining++
			} else {
				e.State.HousesRemaining += t.Houses
			}
			t.Houses = 0
		}
	}

	if creditorID != "" {
		cred := e.GetPlayer(creditorID)
		if cred != nil {
			if p.Cash > 0 {
				cred.Cash += p.Cash
			}
			cred.GetOutOfJailFree += p.GetOutOfJailFree
			for _, t := range e.State.Tiles {
				if t.OwnerID == p.ID {
					t.OwnerID = cred.ID
				}
			}
		}
	} else {
		for _, t := range e.State.Tiles {
			if t.OwnerID == p.ID {
				t.OwnerID = ""
				t.Mortgaged = false
				t.Houses = 0
			}
		}
	}

	p.Cash = 0
	p.GetOutOfJailFree = 0
	p.Bankrupt = true
	p.InJail = false
	if e.State.PendingDebt != nil && e.State.PendingDebt.DebtorID == playerID {
		e.State.PendingDebt = nil
	}

	e.addLog("bankrupt",
		fmt.Sprintf("%s a intrat în insolvență și a părăsit jocul.", p.Name),
		fmt.Sprintf("%s declared bankruptcy and left the game.", p.Name),
		fmt.Sprintf("%s объявил банкротство и выбыл из игры.", p.Name),
	)

	active := make([]*Player, 0)
	for _, pl := range e.State.Players {
		if !pl.Bankrupt {
			active = append(active, pl)
		}
	}
	if len(active) == 1 {
		e.State.WinnerID = active[0].ID
		e.State.Phase = PhaseGameOver
		e.addLog("info",
			fmt.Sprintf("%s a devenit Magnatul Imobiliar al Chișinăului și a câștigat partida!", active[0].Name),
			fmt.Sprintf("%s became the Real Estate Mogul of Chișinău and won the match!", active[0].Name),
			fmt.Sprintf("%s стал главным магнатом Кишинёва и победил в игре!", active[0].Name),
		)
		return nil
	}

	if cur := e.CurrentPlayer(); cur != nil && cur.ID == playerID {
		e.advanceToNextPlayer()
	}
	return nil
}

func (e *Engine) EndTurn(playerID string) error {
	cur := e.CurrentPlayer()
	if cur == nil || cur.ID != playerID {
		return errors.New("not your turn")
	}
	if e.State.Phase != PhaseAction {
		return errors.New("cannot end turn right now")
	}
	e.advanceToNextPlayer()
	return nil
}

func (e *Engine) advanceToNextPlayer() {
	n := len(e.State.Players)
	if n == 0 {
		return
	}
	for i := 1; i <= n; i++ {
		nextIdx := (e.State.CurrentPlayerIdx + i) % n
		cand := e.State.Players[nextIdx]
		if !cand.Bankrupt {
			if nextIdx <= e.State.CurrentPlayerIdx {
				e.State.TurnNumber++
			}
			e.State.CurrentPlayerIdx = nextIdx
			e.State.Phase = PhaseRoll
			e.State.DoublesCount = 0
			e.State.HasRolled = false
			e.State.LastDrawnCard = nil
			return
		}
	}
}

func (e *Engine) StepBot() bool {
	if e.State.Phase == PhaseLobby || e.State.Phase == PhaseGameOver {
		return false
	}

	if e.State.Phase == PhaseAuction && e.State.Auction != nil {
		auc := e.State.Auction
		bidder := e.GetPlayer(auc.ActiveBidderID)
		if bidder != nil && bidder.IsBot && !bidder.Bankrupt {
			tile := e.State.Tiles[auc.TileIndex]
			maxWilling := tile.Price + 20
			if e.wouldCompleteGroup(bidder.ID, tile.Group) {
				maxWilling = int(float64(tile.Price) * 1.4)
			}
			nextBid := auc.CurrentBid + 10
			if auc.HighestBidderID == "" {
				nextBid = 10
			}
			if nextBid <= maxWilling && bidder.Cash >= nextBid+80 {
				_ = e.PlaceBid(bidder.ID, nextBid)
			} else {
				_ = e.PassAuction(bidder.ID)
			}
			return true
		}
		return false
	}

	cur := e.CurrentPlayer()
	if cur == nil || !cur.IsBot || cur.Bankrupt {
		return false
	}

	switch e.State.Phase {
	case PhaseRoll:
		if cur.InJail {
			if cur.GetOutOfJailFree > 0 {
				_ = e.UseJailCard(cur.ID)
				return true
			}
			if cur.Cash >= 250 {
				_ = e.PayJailBail(cur.ID)
				return true
			}
		}
		_ = e.RollDice(cur.ID)
		return true

	case PhaseBuyOrAuction:
		tile := e.State.Tiles[cur.Position]
		if cur.Cash >= tile.Price {
			_ = e.BuyProperty(cur.ID)
		} else {
			_ = e.DeclineProperty(cur.ID)
		}
		return true

	case PhaseDebt:
		debt := e.State.PendingDebt
		if debt == nil {
			return false
		}
		if cur.Cash >= debt.Amount {
			_ = e.PayDebt(cur.ID)
			return true
		}
		for _, t := range e.State.Tiles {
			if t.OwnerID == cur.ID && t.Houses > 0 {
				if err := e.SellHouse(cur.ID, t.Index); err == nil {
					return true
				}
			}
		}
		for _, t := range e.State.Tiles {
			if t.OwnerID == cur.ID && !t.Mortgaged && t.Houses == 0 {
				if err := e.MortgageProperty(cur.ID, t.Index); err == nil {
					return true
				}
			}
		}
		_ = e.DeclareBankruptcy(cur.ID)
		return true

	case PhaseAction:
		for _, t := range e.State.Tiles {
			if t.OwnerID == cur.ID && t.Mortgaged {
				cost := (t.Price * 55) / 100
				if cur.Cash >= cost+350 {
					if err := e.UnmortgageProperty(cur.ID, t.Index); err == nil {
						return true
					}
				}
			}
		}
		for _, t := range e.State.Tiles {
			if t.OwnerID == cur.ID && t.Type == TileProperty && t.Houses < 5 {
				if cur.Cash >= t.HouseCost+250 {
					if err := e.BuildHouse(cur.ID, t.Index); err == nil {
						return true
					}
				}
			}
		}
		_ = e.EndTurn(cur.ID)
		return true
	}

	return false
}

func (e *Engine) wouldCompleteGroup(playerID string, group ColorGroup) bool {
	if group == GroupNone {
		return false
	}
	total := 0
	owned := 0
	for _, t := range e.State.Tiles {
		if t.Group == group {
			total++
			if t.OwnerID == playerID {
				owned++
			}
		}
	}
	return total > 1 && owned == total-1
}

func (e *Engine) evaluateBotTrade(tr *TradeOffer) {
	offeredVal := tr.OfferCash + tr.OfferJailCards*50
	for _, idx := range tr.OfferProperties {
		offeredVal += e.State.Tiles[idx].Price
	}
	requestedVal := tr.RequestCash + tr.RequestJailCards*50
	for _, idx := range tr.RequestProperties {
		t := e.State.Tiles[idx]
		val := t.Price
		if e.OwnsFullColorGroup(tr.ToPlayerID, t.Group) {
			val *= 2
		}
		requestedVal += val
	}
	if offeredVal >= requestedVal && requestedVal > 0 {
		_ = e.RespondTrade(tr.ID, tr.ToPlayerID, true)
	} else {
		_ = e.RespondTrade(tr.ID, tr.ToPlayerID, false)
	}
}
