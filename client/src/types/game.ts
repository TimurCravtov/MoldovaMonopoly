export type Language = 'ro' | 'en' | 'ru';

export interface LocalizedText {
  ro: string;
  en: string;
  ru: string;
}

export type TileType =
  | 'GO'
  | 'PROPERTY'
  | 'COMMUNITY_CHEST'
  | 'CHANCE'
  | 'TAX'
  | 'TRANSPORT'
  | 'UTILITY'
  | 'JAIL'
  | 'FREE_PARKING'
  | 'GO_TO_JAIL';

export type ColorGroup =
  | 'NONE'
  | 'BROWN'
  | 'LIGHT_BLUE'
  | 'PINK'
  | 'ORANGE'
  | 'RED'
  | 'YELLOW'
  | 'GREEN'
  | 'DARK_BLUE'
  | 'TRANSPORT'
  | 'UTILITY';

export interface Tile {
  index: number;
  type: TileType;
  group: ColorGroup;
  name: LocalizedText;
  subtitle: LocalizedText;
  flavor: LocalizedText;
  price: number;
  houseCost: number;
  rents: number[];
  taxAmount?: number;
  icon: string;
  ownerId: string;
  houses: number; // 0..4 houses, 5 = hotel
  mortgaged: boolean;
}

export interface Card {
  id: string;
  deck: 'CHANCE' | 'COMMUNITY_CHEST';
  title: LocalizedText;
  description: LocalizedText;
  effect: string;
  value: number;
  extraValue: number;
}

export type TurnPhase =
  | 'LOBBY'
  | 'ROLL'
  | 'BUY_OR_AUCTION'
  | 'AUCTION'
  | 'ACTION'
  | 'DEBT'
  | 'GAME_OVER';

export interface Player {
  id: string;
  name: string;
  token: string;
  color: string;
  cash: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  getOutOfJailFree: number;
  bankrupt: boolean;
  isBot: boolean;
  connected: boolean;
}

export interface AuctionState {
  tileIndex: number;
  currentBid: number;
  highestBidderId: string;
  passedPlayers: Record<string, boolean>;
  activeBidderId: string;
}

export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  offerCash: number;
  requestCash: number;
  offerProperties: number[];
  requestProperties: number[];
  offerJailCards: number;
  requestJailCards: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
}

export interface DebtState {
  debtorId: string;
  creditorId: string;
  amount: number;
  reason: LocalizedText;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  text: LocalizedText;
  type: string;
}

export interface GameSettings {
  startingCash: number;
  freeParkingJackpot: boolean;
  doubleOnGo: boolean;
  auctionEnabled: boolean;
}

export interface GameState {
  roomId: string;
  roomName: string;
  hostId: string;
  phase: TurnPhase;
  players: Player[];
  currentPlayerIdx: number;
  tiles: Tile[];
  lastDice: [number, number];
  doublesCount: number;
  hasRolled: boolean;
  freeParkingPot: number;
  housesRemaining: number;
  hotelsRemaining: number;
  lastDrawnCard?: Card;
  auction?: AuctionState;
  pendingDebt?: DebtState;
  trades: TradeOffer[];
  winnerId?: string;
  settings: GameSettings;
  logs: LogEntry[];
  turnNumber: number;
}

export interface TokenInfo {
  id: string;
  name: LocalizedText;
}

export const MOLDOVA_TOKENS: TokenInfo[] = [
  {
    id: 'trolleybus',
    name: {
      ro: 'Troleibuzul 22',
      en: 'Trolleybus No. 22',
      ru: 'Троллейбус № 22',
    },
  },
  {
    id: 'placinta',
    name: {
      ro: 'Plăcintă Învârtită',
      en: 'Moldovan Plăcintă',
      ru: 'Молдавская Плацинда',
    },
  },
  {
    id: 'grapes',
    name: {
      ro: 'Strugure de Moldova',
      en: 'Moldovan Grapes',
      ru: 'Виноград «Молдова»',
    },
  },
  {
    id: 'wine',
    name: {
      ro: 'Pahar de Purcari',
      en: 'Glass of Purcari Wine',
      ru: 'Бокал вина Пуркарь',
    },
  },
  {
    id: 'cusma',
    name: {
      ro: 'Cușmă de Cârlan',
      en: 'Traditional Fur Hat (Cușmă)',
      ru: 'Кушма из каракуля',
    },
  },
  {
    id: 'rutiera',
    name: {
      ro: 'Rutiera 101',
      en: 'Marshrutka 101',
      ru: 'Маршрутка 101',
    },
  },
  {
    id: 'sunflower',
    name: {
      ro: 'Floarea-Soarelui',
      en: 'Moldovan Sunflower',
      ru: 'Подсолнух Бельц',
    },
  },
  {
    id: 'violin',
    name: {
      ro: 'Vioara Lăutarului',
      en: 'Lăutar Violin',
      ru: 'Скрипка Лэутара',
    },
  },
];

export const PLAYER_COLORS = [
  '#9F1239', // Purcari Crimson
  '#1E40AF', // Moldovan Cobalt
  '#166534', // Codrii Forest Green
  '#B45309', // Amber Gold
  '#581C87', // Royal Plum
  '#0F766E', // Nistru Teal
  '#831843', // Burgundy Wine
  '#3730A3', // Deep Indigo
];

export const GROUP_COLORS: Record<
  ColorGroup,
  { bg: string; border: string; text: string; hex: string }
> = {
  NONE: {
    bg: 'bg-[#4A3F35]',
    border: 'border-[#3B3129]',
    text: 'text-[#F5EFE6]',
    hex: '#4A3F35',
  },
  BROWN: {
    bg: 'bg-[#5C3A21]',
    border: 'border-[#472C18]',
    text: 'text-[#FAF3E8]',
    hex: '#5C3A21',
  },
  LIGHT_BLUE: {
    bg: 'bg-[#6BA3BE]',
    border: 'border-[#5189A4]',
    text: 'text-[#111C24]',
    hex: '#6BA3BE',
  },
  PINK: {
    bg: 'bg-[#B84A69]',
    border: 'border-[#963853]',
    text: 'text-white',
    hex: '#B84A69',
  },
  ORANGE: {
    bg: 'bg-[#D97224]',
    border: 'border-[#B85B14]',
    text: 'text-white',
    hex: '#D97224',
  },
  RED: {
    bg: 'bg-[#B91C1C]',
    border: 'border-[#991B1B]',
    text: 'text-white',
    hex: '#B91C1C',
  },
  YELLOW: {
    bg: 'bg-[#DFB127]',
    border: 'border-[#BA911A]',
    text: 'text-[#1C1608]',
    hex: '#DFB127',
  },
  GREEN: {
    bg: 'bg-[#1E6B45]',
    border: 'border-[#145334]',
    text: 'text-white',
    hex: '#1E6B45',
  },
  DARK_BLUE: {
    bg: 'bg-[#1E3A8A]',
    border: 'border-[#172554]',
    text: 'text-white',
    hex: '#1E3A8A',
  },
  TRANSPORT: {
    bg: 'bg-[#2C2520]',
    border: 'border-[#1E1915]',
    text: 'text-[#E5C158]',
    hex: '#2C2520',
  },
  UTILITY: {
    bg: 'bg-[#235347]',
    border: 'border-[#183B32]',
    text: 'text-[#F5EFE6]',
    hex: '#235347',
  },
};
