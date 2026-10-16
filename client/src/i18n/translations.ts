import { Language, LocalizedText } from '../types/game';

export function t(text: LocalizedText | undefined, lang: Language): string {
  if (!text) return '';
  return text[lang] || text.ro || text.en;
}

export const UI_TEXT = {
  title: {
    ro: 'MONOPOLY: CHIȘINĂU & MOLDOVA',
    en: 'MONOPOLY: CHIȘINĂU & MOLDOVA',
    ru: 'МОНОПОЛИЯ: КИШИНЁВ И МОЛДОВА',
  },
  subtitle: {
    ro: 'Ediția Cumătrie, Vinării, Troleibuzul 22 & Bulevardul Ștefan cel Mare',
    en: 'Cumătrie, Wineries, Trolleybus 22 & Ștefan cel Mare Blvd Edition',
    ru: 'Издание: Кумэтрия, Винодельни, Троллейбус № 22 и бул. Штефана чел Маре',
  },
  yourName: {
    ro: 'Numele tău de Orășean / Cumătru',
    en: 'Your Player Name',
    ru: 'Ваше имя игрока',
  },
  chooseToken: {
    ro: 'Alege Pionul Moldovenesc',
    en: 'Choose Your Moldovan Token',
    ru: 'Выберите молдавскую фишку',
  },
  chooseColor: {
    ro: 'Culoarea Jucătorului',
    en: 'Player Color',
    ru: 'Цвет игрока',
  },
  playersInRoom: {
    ro: 'Jucători la Masă',
    en: 'Players at the Table',
    ru: 'Игроки за столом',
  },
  addBot: {
    ro: '+ Adaugă Cumătru (Bot AI)',
    en: '+ Add Cumătru (AI Bot)',
    ru: '+ Добавить Кума (ИИ-Бот)',
  },
  startGame: {
    ro: '🚀 Începe Jocul în Chișinău!',
    en: '🚀 Start Chișinău Game!',
    ru: '🚀 Начать игру в Кишинёве!',
  },
  needMorePlayers: {
    ro: 'Adaugă cel puțin 2 jucători (sau un Bot AI) pentru a începe!',
    en: 'Add at least 2 players (or an AI Bot) to start!',
    ru: 'Добавьте минимум 2 игроков (или ИИ-бота), чтобы начать!',
  },
  gameSettings: {
    ro: 'Regulile Casei (Primăria Chișinău)',
    en: 'House Rules (Chișinău City Hall)',
    ru: 'Правила дома (Примэрия Кишинёва)',
  },
  startingCash: {
    ro: 'Capital Inițial (MDL)',
    en: 'Starting Cash (MDL)',
    ru: 'Стартовый капитал (MDL)',
  },
  freeParkingJackpot: {
    ro: 'Fond la Arcul de Triumf (Amenzile merg la Parcare Gratis)',
    en: 'Triumphal Arch Jackpot (Taxes & Fines go to Free Parking)',
    ru: 'Куш у Арки Победы (Штрафы и налоги идут на Бесплатную Парковку)',
  },
  doubleOnGo: {
    ro: 'Salariu Dublu (400 MDL) dacă aterizezi exact pe START',
    en: 'Double Payday (400 MDL) when landing directly on GO',
    ru: 'Двойная зарплата (400 MDL) при остановке точно на СТАРТЕ',
  },
  auctionEnabled: {
    ro: 'Licitație dacă jucătorul refuză cumpărarea',
    en: 'Live Auction when a player declines buying',
    ru: 'Аукцион при отказе от покупки',
  },
  rollDice: {
    ro: '🎲 Dă cu Zarul!',
    en: '🎲 Roll Dice!',
    ru: '🎲 Бросить кубики!',
  },
  buyProperty: {
    ro: '🏠 Cumpără Proprietatea',
    en: '🏠 Buy Property',
    ru: '🏠 Купить объект',
  },
  sendToAuction: {
    ro: '🔨 Trimite la Licitație / Pas',
    en: '🔨 Send to Auction / Pass',
    ru: '🔨 На аукцион / Пас',
  },
  endTurn: {
    ro: '⏭️ Încheie Tura',
    en: '⏭️ End Turn',
    ru: '⏭️ Завершить ход',
  },
  payBail: {
    ro: '🔓 Plătește Cauțiune (50 MDL)',
    en: '🔓 Pay Bail (50 MDL)',
    ru: '🔓 Заплатить залог (50 MDL)',
  },
  useJailCard: {
    ro: '📜 Folosește «Scrisoare de la Cumătru»',
    en: '📜 Use "Letter from Cumătru"',
    ru: '📜 Использовать «Звонок от Кума»',
  },
  payDebt: {
    ro: '✅ Achită Datoria',
    en: '✅ Pay Debt',
    ru: '✅ Оплатить долг',
  },
  declareBankruptcy: {
    ro: '💸 Declară Faliment (Pleacă în Diaspora)',
    en: '💸 Declare Bankruptcy (Leave for Diaspora)',
    ru: '💸 Объявить банкротство (Уехать на заработки)',
  },
  buildHouse: {
    ro: '🏗️ Construiește (+1)',
    en: '🏗️ Build (+1)',
    ru: '🏗️ Построить (+1)',
  },
  sellHouse: {
    ro: '🏚️ Vinde Construcția',
    en: '🏚️ Sell Building',
    ru: '🏚️ Продать постройку',
  },
  mortgage: {
    ro: '🏦 Gajează (Ipotecă +50%)',
    en: '🏦 Mortgage (+50%)',
    ru: '🏦 Заложить (+50%)',
  },
  unmortgage: {
    ro: '🔓 Răscumpără Ipoteca (55%)',
    en: '🔓 Unmortgage (55%)',
    ru: '🔓 Выкупить залог (55%)',
  },
  proposeTrade: {
    ro: '🤝 Propune o Afacere (Schimb)',
    en: '🤝 Propose Trade',
    ru: '🤝 Предложить сделку (Обмен)',
  },
  turnOf: {
    ro: 'Rândul lui',
    en: 'Current Turn:',
    ru: 'Ходит:',
  },
  bankReserve: {
    ro: 'Banca Națională (BNM)',
    en: 'National Bank (BNM)',
    ru: 'Нацбанк (НБМ)',
  },
  housesLeft: {
    ro: 'Case / Chioșcuri:',
    en: 'Houses Left:',
    ru: 'Дома / Киоски:',
  },
  hotelsLeft: {
    ro: 'Hoteluri / Vinării:',
    en: 'Hotels / Wineries:',
    ru: 'Отели / Винодельни:',
  },
  jackpotPot: {
    ro: 'Fond Arcul de Triumf:',
    en: 'Triumphal Arch Pot:',
    ru: 'Фонд у Арки Победы:',
  },
  deedTitle: {
    ro: 'TITLU DE PROPRIETATE — CADASTRU',
    en: 'TITLE DEED — CADASTRE',
    ru: 'ТИТУЛ СОБСТВЕННОСТИ — КАДАСТР',
  },
  baseRent: {
    ro: 'Chirie de bază (teren):',
    en: 'Base Rent (unimproved):',
    ru: 'Базовая аренда:',
  },
  monopolyRent: {
    ro: 'Chirie cu tot sectorul (2x):',
    en: 'Full Color Group Rent (2x):',
    ru: 'Аренда с полным сектором (2x):',
  },
  with1House: {
    ro: 'Cu 1 Chioșc / Casă:',
    en: 'With 1 House:',
    ru: 'С 1 домом:',
  },
  with2Houses: {
    ro: 'Cu 2 Case / Blocuri:',
    en: 'With 2 Houses:',
    ru: 'С 2 домами:',
  },
  with3Houses: {
    ro: 'Cu 3 Case / Blocuri:',
    en: 'With 3 Houses:',
    ru: 'С 3 домами:',
  },
  with4Houses: {
    ro: 'Cu 4 Case / Blocuri:',
    en: 'With 4 Houses:',
    ru: 'С 4 домами:',
  },
  withHotel: {
    ro: 'Cu HOTEL / Vinărie VIP:',
    en: 'With Luxury HOTEL / Winery:',
    ru: 'С ОТЕЛЕМ / VIP-Винодельней:',
  },
  buildCost: {
    ro: 'Cost construcție:',
    en: 'Building Cost:',
    ru: 'Стоимость постройки:',
  },
  mortgageVal: {
    ro: 'Valoare ipotecă (50%):',
    en: 'Mortgage Value (50%):',
    ru: 'Залоговая стоимость (50%):',
  },
  owner: {
    ro: 'Proprietar:',
    en: 'Owner:',
    ru: 'Владелец:',
  },
  unowned: {
    ro: 'Disponibil la Primărie',
    en: 'Available (Unowned)',
    ru: 'Свободно (В банке)',
  },
  inJailBadge: {
    ro: 'Penitenciarul Nr. 13',
    en: 'Prison No. 13',
    ru: 'Тюрьма № 13',
  },
  mortgagedBadge: {
    ro: 'GAJAT',
    en: 'MORTGAGED',
    ru: 'В ЗАЛОГЕ',
  },
  gameLog: {
    ro: 'Cronica Chișinăului (Jurnal)',
    en: 'Chișinău Chronicle (Game Log)',
    ru: 'Хроника Кишинёва (Журнал)',
  },
  myProperties: {
    ro: 'Proprietățile Mele',
    en: 'My Properties',
    ru: 'Мои объекты',
  },
  clickTileHint: {
    ro: 'Apasă pe orice căsuță de pe tablă pentru detalii, construcții sau ipotecă.',
    en: 'Click any board tile to inspect details, build houses, or mortgage.',
    ru: 'Нажмите на любую клетку поля для просмотра деталей, постройки домов или залога.',
  },
  resetRoom: {
    ro: '🔄 Joc Nou (Lobby)',
    en: '🔄 New Game (Lobby)',
    ru: '🔄 Новая игра (Лобби)',
  },
};
