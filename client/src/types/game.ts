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
  emoji: string;
  name: LocalizedText;
}

export const MOLDOVA_TOKENS: TokenInfo[] = [
  {
    id: 'trolleybus',
    emoji: '🚎',
    name: {
      ro: 'Troleibuzul 22',
      en: 'Trolleybus No. 22',
      ru: 'Троллейбус № 22',
    },
  },
  {
    id: 'placinta',
    emoji: '🥧',
    name: {
      ro: 'Plăcintă Învârtită',
      en: 'Moldovan Plăcintă',
      ru: 'Молдавская Плацинда',
    },
  },
  {
    id: 'grapes',
    emoji: '🍇',
    name: {
      ro: 'Strugure de Moldova',
      en: 'Moldovan Grapes',
      ru: 'Виноград «Молдова»',
    },
  },
  {
    id: 'wine',
    emoji: '🍷',
    name: {
      ro: 'Pahar de Purcari',
      en: 'Glass of Purcari Wine',
      ru: 'Бокал вина Пуркарь',
    },
  },
  {
    id: 'cusma',
    emoji: '🎩',
    name: {
      ro: 'Cușmă de Cârlan',
      en: 'Traditional Fur Hat (Cușmă)',
      ru: 'Кушма из каракуля',
    },
  },
  {
    id: 'rutiera',
    emoji: '🚐',
    name: {
      ro: 'Rutiera 101',
      en: 'Marshrutka 101',
      ru: 'Маршрутка 101',
    },
  },
  {
    id: 'sunflower',
    emoji: '🌻',
    name: {
      ro: 'Floarea-Soarelui',
      en: 'Moldovan Sunflower',
      ru: 'Подсолнух Бельц',
    },
  },
  {
    id: 'violin',
    emoji: '🎻',
    name: {
      ro: 'Vioara Lăutarului',
      en: 'Lăutar Violin',
      ru: 'Скрипка Лэутара',
    },
  },
];

export const PLAYER_COLORS = [
  '#E11D48', // Rose Red
  '#2563EB', // Royal Blue
  '#16A34A', // Emerald Green
  '#D97706', // Amber Gold
  '#9333EA', // Purple
  '#0891B2', // Cyan
  '#DB2777', // Pink
  '#4F46E5', // Indigo
];

export const GROUP_COLORS: Record<ColorGroup, { bg: string; border: string; text: string; hex: string }> = {
  NONE: { bg: 'bg-slate-700', border: 'border-slate-600', text: 'text-slate-200', hex: '#475569' },
  BROWN: { bg: 'bg-amber-900', border: 'border-amber-800', text: 'text-amber-100', hex: '#78350F' },
  LIGHT_BLUE: { bg: 'bg-sky-400', border: 'border-sky-500', text: 'text-slate-950', hex: '#38BDF8' },
  PINK: { bg: 'bg-pink-500', border: 'border-pink-600', text: 'text-white', hex: '#EC4899' },
  ORANGE: { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white', hex: '#F97316' },
  RED: { bg: 'bg-red-600', border: 'border-red-700', text: 'text-white', hex: '#DC2626' },
  YELLOW: { bg: 'bg-yellow-400', border: 'border-yellow-500', text: 'text-slate-950', hex: '#FACC15' },
  GREEN: { bg: 'bg-emerald-600', border: 'border-emerald-700', text: 'text-white', hex: '#059669' },
  DARK_BLUE: { bg: 'bg-blue-800', border: 'border-blue-900', text: 'text-white', hex: '#1E40AF' },
  TRANSPORT: { bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-amber-300', hex: '#1E293B' },
  UTILITY: { bg: 'bg-teal-700', border: 'border-teal-800', text: 'text-white', hex: '#0F766E' },
};

export function getTokenEmoji(tokenId: string): string {
  return MOLDOVA_TOKENS.find((t) => t.id === tokenId)?.emoji || '🍇';
}
