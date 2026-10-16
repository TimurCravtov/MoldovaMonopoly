package game

import "time"

type TileType string

const (
	TileGo             TileType = "GO"
	TileProperty       TileType = "PROPERTY"
	TileCommunityChest TileType = "COMMUNITY_CHEST"
	TileChance         TileType = "CHANCE"
	TileTax            TileType = "TAX"
	TileTransport      TileType = "TRANSPORT"
	TileUtility        TileType = "UTILITY"
	TileJail           TileType = "JAIL"
	TileFreeParking    TileType = "FREE_PARKING"
	TileGoToJail       TileType = "GO_TO_JAIL"
)

type ColorGroup string

const (
	GroupNone      ColorGroup = "NONE"
	GroupBrown     ColorGroup = "BROWN"
	GroupLightBlue ColorGroup = "LIGHT_BLUE"
	GroupPink      ColorGroup = "PINK"
	GroupOrange    ColorGroup = "ORANGE"
	GroupRed       ColorGroup = "RED"
	GroupYellow    ColorGroup = "YELLOW"
	GroupGreen     ColorGroup = "GREEN"
	GroupDarkBlue  ColorGroup = "DARK_BLUE"
	GroupTransport ColorGroup = "TRANSPORT"
	GroupUtility   ColorGroup = "UTILITY"
)

type LocalizedText struct {
	RO string `json:"ro"`
	EN string `json:"en"`
	RU string `json:"ru"`
}

type Tile struct {
	Index         int           `json:"index"`
	Type          TileType      `json:"type"`
	Group         ColorGroup    `json:"group"`
	Name          LocalizedText `json:"name"`
	Subtitle      LocalizedText `json:"subtitle"`
	Flavor        LocalizedText `json:"flavor"`
	Price         int           `json:"price"`
	HouseCost     int           `json:"houseCost"`
	Rents         []int         `json:"rents"` // [base, 1h, 2h, 3h, 4h, hotel] or transport [25,50,100,200]
	TaxAmount     int           `json:"taxAmount,omitempty"`
	Icon          string        `json:"icon"`
	OwnerID       string        `json:"ownerId"`       // "" if unowned
	Houses        int           `json:"houses"`        // 0..4 houses, 5 = hotel
	Mortgaged     bool          `json:"mortgaged"`
}

type CardDeckType string

const (
	DeckChance         CardDeckType = "CHANCE"          // Noroc / Șansă
	DeckCommunityChest CardDeckType = "COMMUNITY_CHEST" // Cumătrie / Cutia Comunității
)

type CardEffectType string

const (
	EffectMoney          CardEffectType = "MONEY"            // + or - cash from/to bank
	EffectMoveTo         CardEffectType = "MOVE_TO"          // Move to specific tile index (collect GO if passed)
	EffectMoveSteps      CardEffectType = "MOVE_STEPS"       // Move relative steps (e.g. -3)
	EffectGoToJail       CardEffectType = "GO_TO_JAIL"       // Directly to Penitenciarul Nr. 13
	EffectGetOutOfJail   CardEffectType = "GET_OUT_OF_JAIL"  // Keepable card ("Scrisoare de la Cumătru")
	EffectEachPlayer     CardEffectType = "EACH_PLAYER"      // Collect/pay amount from/to each active player
	EffectStreetRepairs  CardEffectType = "STREET_REPAIRS"   // Pay per house and per hotel
	EffectNearestUtility CardEffectType = "NEAREST_UTILITY"  // Advance to nearest utility
	EffectNearestTransp  CardEffectType = "NEAREST_TRANSPORT"// Advance to nearest transport
)

type Card struct {
	ID          string         `json:"id"`
	Deck        CardDeckType   `json:"deck"`
	Title       LocalizedText  `json:"title"`
	Description LocalizedText  `json:"description"`
	Effect      CardEffectType `json:"effect"`
	Value       int            `json:"value"`      // Amount or target tile index
	ExtraValue  int            `json:"extraValue"` // Hotel repair cost
}

type TurnPhase string

const (
	PhaseLobby        TurnPhase = "LOBBY"
	PhaseRoll         TurnPhase = "ROLL"
	PhaseBuyOrAuction TurnPhase = "BUY_OR_AUCTION"
	PhaseAuction      TurnPhase = "AUCTION"
	PhaseAction       TurnPhase = "ACTION" // End turn, build, mortgage, trade
	PhaseDebt         TurnPhase = "DEBT"   // Must raise funds or declare bankruptcy
	PhaseGameOver     TurnPhase = "GAME_OVER"
)

type Player struct {
	ID               string `json:"id"`
	Name             string `json:"name"`
	Token            string `json:"token"` // e.g. "trolleybus", "placinta", "grapes", "wine", "cusma", "rutiera", "sunflower", "violin"
	Color            string `json:"color"`
	Cash             int    `json:"cash"`
	Position         int    `json:"position"`
	InJail           bool   `json:"inJail"`
	JailTurns        int    `json:"jailTurns"`
	GetOutOfJailFree int    `json:"getOutOfJailFree"`
	Bankrupt         bool   `json:"bankrupt"`
	IsBot            bool   `json:"isBot"`
	Connected        bool   `json:"connected"`
}

type AuctionState struct {
	TileIndex       int             `json:"tileIndex"`
	CurrentBid      int             `json:"currentBid"`
	HighestBidderID string          `json:"highestBidderId"`
	PassedPlayers   map[string]bool `json:"passedPlayers"`
	ActiveBidderID  string          `json:"activeBidderId"`
}

type TradeOffer struct {
	ID                 string `json:"id"`
	FromPlayerID       string `json:"fromPlayerId"`
	ToPlayerID         string `json:"toPlayerId"`
	OfferCash          int    `json:"offerCash"`
	RequestCash        int    `json:"requestCash"`
	OfferProperties    []int  `json:"offerProperties"`
	RequestProperties  []int  `json:"requestProperties"`
	OfferJailCards     int    `json:"offerJailCards"`
	RequestJailCards   int    `json:"requestJailCards"`
	Status             string `json:"status"` // "PENDING", "ACCEPTED", "REJECTED", "CANCELLED"
}

type DebtState struct {
	DebtorID   string `json:"debtorId"`
	CreditorID string `json:"creditorId"` // "" means Bank / FISC
	Amount     int    `json:"amount"`
	Reason     LocalizedText `json:"reason"`
}

type LogEntry struct {
	ID        string        `json:"id"`
	Timestamp time.Time     `json:"timestamp"`
	Text      LocalizedText `json:"text"`
	Type      string        `json:"type"` // "info", "rent", "buy", "card", "jail", "trade", "bankrupt", "tax"
}

type GameSettings struct {
	MaxPlayers         int  `json:"maxPlayers"`
	StartingCash       int  `json:"startingCash"`
	FreeParkingJackpot bool `json:"freeParkingJackpot"`
	DoubleOnGo         bool `json:"doubleOnGo"`
	AuctionEnabled     bool `json:"auctionEnabled"`
	AutoStart          bool `json:"autoStart"`
	IsPrivate          bool `json:"isPrivate"`
}

type GameState struct {
	RoomID            string        `json:"roomId"`
	RoomName          string        `json:"roomName"`
	HostID            string        `json:"hostId"`
	Phase             TurnPhase     `json:"phase"`
	Players           []*Player     `json:"players"`
	CurrentPlayerIdx  int           `json:"currentPlayerIdx"`
	Tiles             []*Tile       `json:"tiles"`
	LastDice          [2]int        `json:"lastDice"`
	DoublesCount      int           `json:"doublesCount"`
	HasRolled         bool          `json:"hasRolled"`
	FreeParkingPot    int           `json:"freeParkingPot"`
	HousesRemaining   int           `json:"housesRemaining"`
	HotelsRemaining   int           `json:"hotelsRemaining"`
	LastDrawnCard     *Card         `json:"lastDrawnCard,omitempty"`
	Auction           *AuctionState `json:"auction,omitempty"`
	PendingDebt       *DebtState    `json:"pendingDebt,omitempty"`
	Trades            []*TradeOffer `json:"trades"`
	WinnerID          string        `json:"winnerId,omitempty"`
	Settings          GameSettings  `json:"settings"`
	Logs              []LogEntry    `json:"logs"`
	TurnNumber        int           `json:"turnNumber"`
}
