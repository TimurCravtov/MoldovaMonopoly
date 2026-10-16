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
    bg: 'bg-[#D8E5D7]',
    border: 'border-[#141414]',
    text: 'text-[#141414]',
    hex: '#D8E5D7',
  },
  BROWN: {
    bg: 'bg-[#8B4726]',
    border: 'border-[#141414]',
    text: 'text-white',
    hex: '#8B4726',
  },
  LIGHT_BLUE: {
    bg: 'bg-[#8FD3E8]',
    border: 'border-[#141414]',
    text: 'text-[#141414]',
    hex: '#8FD3E8',
  },
  PINK: {
    bg: 'bg-[#D93883]',
    border: 'border-[#141414]',
    text: 'text-white',
    hex: '#D93883',
  },
  ORANGE: {
    bg: 'bg-[#F58220]',
    border: 'border-[#141414]',
    text: 'text-[#141414]',
    hex: '#F58220',
  },
  RED: {
    bg: 'bg-[#E32626]',
    border: 'border-[#141414]',
    text: 'text-white',
    hex: '#E32626',
  },
  YELLOW: {
    bg: 'bg-[#FDE021]',
    border: 'border-[#141414]',
    text: 'text-[#141414]',
    hex: '#FDE021',
  },
  GREEN: {
    bg: 'bg-[#1EA350]',
    border: 'border-[#141414]',
    text: 'text-white',
    hex: '#1EA350',
  },
  DARK_BLUE: {
    bg: 'bg-[#1B469B]',
    border: 'border-[#141414]',
    text: 'text-white',
    hex: '#1B469B',
  },
  TRANSPORT: {
    bg: 'bg-[#141414]',
    border: 'border-[#141414]',
    text: 'text-white',
    hex: '#141414',
  },
  UTILITY: {
    bg: 'bg-[#5A6B5C]',
    border: 'border-[#141414]',
    text: 'text-white',
    hex: '#5A6B5C',
  },
};
