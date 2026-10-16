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
    ro: 'Ediția Oficială de Colecție — Bulevardul Ștefan cel Mare, Vinării & RTEC',
    en: 'Official Collector Edition — Ștefan cel Mare Blvd, Wineries & RTEC',
    ru: 'Коллекционное издание — бул. Штефана чел Маре, Винодельни и RTEC',
  },
  yourName: {
    ro: 'Numele Jucătorului',
    en: 'Player Name',
    ru: 'Имя игрока',
  },
  chooseToken: {
    ro: 'Pionul de Joc',
    en: 'Board Token',
    ru: 'Игровая фишка',
  },
  chooseColor: {
    ro: 'Culoarea Cadastrală',
    en: 'Cadastre Color',
    ru: 'Цвет игрока',
  },
  playersInRoom: {
    ro: 'Registru Jucători',
    en: 'Player Registry',
    ru: 'Реестр игроков',
  },
  addBot: {
    ro: 'Adaugă Partener AI',
    en: 'Add AI Opponent',
    ru: 'Добавить ИИ-соперника',
  },
  startGame: {
    ro: 'Deschide Partida',
    en: 'Launch Match',
    ru: 'Начать партию',
  },
  needMorePlayers: {
    ro: 'Sunt necesari minimum 2 participanți (sau un Partener AI) pentru începerea partidei.',
    en: 'At least 2 participants (or an AI opponent) are required to launch the match.',
    ru: 'Для начала партии необходимы минимум 2 участника (или ИИ-соперник).',
  },
  gameSettings: {
    ro: 'Regulamentul Primăriei Chișinău',
    en: 'Chișinău Municipal Rules',
    ru: 'Регламент Примэрии Кишинёва',
  },
  startingCash: {
    ro: 'Capital Inițial (MDL)',
    en: 'Starting Capital (MDL)',
    ru: 'Стартовый капитал (MDL)',
  },
  freeParkingJackpot: {
    ro: 'Fondul Arcul de Triumf (Taxele se acumulează la Parcare Gratis)',
    en: 'Triumphal Arch Jackpot (Taxes accumulate at Free Parking)',
    ru: 'Фонд у Арки Победы (Налоги накапливаются на Бесплатной Парковке)',
  },
  doubleOnGo: {
    ro: 'Salariu Dublu (400 MDL) la oprirea exactă pe START',
    en: 'Double Payday (400 MDL) when landing directly on GO',
    ru: 'Двойная зарплата (400 MDL) при остановке точно на СТАРТЕ',
  },
  auctionEnabled: {
    ro: 'Licitație publică la refuzul achiziției',
    en: 'Public auction when declining purchase',
    ru: 'Публичный аукцион при отказе от покупки',
  },
  rollDice: {
    ro: 'Aruncă Zarurile',
    en: 'Roll Dice',
    ru: 'Бросить кубики',
  },
  buyProperty: {
    ro: 'Cumpără Proprietatea',
    en: 'Purchase Property',
    ru: 'Купить объект',
  },
  sendToAuction: {
    ro: 'Scoate la Licitație',
    en: 'Send to Auction',
    ru: 'Выставить на аукцион',
  },
  endTurn: {
    ro: 'Încheie Tura',
    en: 'End Turn',
    ru: 'Завершить ход',
  },
  payBail: {
    ro: 'Achită Cauțiunea (50 MDL)',
    en: 'Pay Bail (50 MDL)',
    ru: 'Оплатить залог (50 MDL)',
  },
  useJailCard: {
    ro: 'Folosește «Scrisoare de la Cumătru»',
    en: 'Use "Letter from Cumătru"',
    ru: 'Использовать «Звонок от Кума»',
  },
  payDebt: {
    ro: 'Achită Datoria',
    en: 'Settle Debt',
    ru: 'Погасить долг',
  },
  declareBankruptcy: {
    ro: 'Declară Insolvența (Faliment)',
    en: 'Declare Bankruptcy',
    ru: 'Объявить банкротство',
  },
  buildHouse: {
    ro: 'Construiește (+1)',
    en: 'Build (+1)',
    ru: 'Построить (+1)',
  },
  sellHouse: {
    ro: 'Vinde Clădirea',
    en: 'Sell Building',
    ru: 'Продать здание',
  },
  mortgage: {
    ro: 'Ipotechează (+50%)',
    en: 'Mortgage (+50%)',
    ru: 'Заложить (+50%)',
  },
  unmortgage: {
    ro: 'Ridică Ipoteca (55%)',
    en: 'Unmortgage (55%)',
    ru: 'Выкупить залог (55%)',
  },
  proposeTrade: {
    ro: 'Tranzacție / Schimb',
    en: 'Trade Offer',
    ru: 'Предложить обмен',
  },
  turnOf: {
    ro: 'La mutare:',
    en: 'Active Turn:',
    ru: 'Ход игрока:',
  },
  bankReserve: {
    ro: 'Banca Națională (BNM)',
    en: 'National Bank (BNM)',
    ru: 'Нацбанк (НБМ)',
  },
  housesLeft: {
    ro: 'Case:',
    en: 'Houses:',
    ru: 'Дома:',
  },
  hotelsLeft: {
    ro: 'Hoteluri:',
    en: 'Hotels:',
    ru: 'Отели:',
  },
  jackpotPot: {
    ro: 'Fond Arcul de Triumf:',
    en: 'Triumphal Arch Pot:',
    ru: 'Фонд у Арки Победы:',
  },
  deedTitle: {
    ro: 'EXTRAS DIN REGISTRUL BUNURILOR IMOBILE',
    en: 'CADASTRAL TITLE DEED CERTIFICATE',
    ru: 'ВЫПИСКА ИЗ РЕЕСТРА НЕДВИЖИМОСТИ',
  },
  baseRent: {
    ro: 'Chirie teren neamenajat:',
    en: 'Base Rent (unimproved):',
    ru: 'Базовая аренда:',
  },
  monopolyRent: {
    ro: 'Chirie monopol sector (2x):',
    en: 'Full Color Set Rent (2x):',
    ru: 'Аренда за весь сектор (2x):',
  },
  with1House: {
    ro: 'Cu 1 Casă:',
    en: 'With 1 House:',
    ru: 'С 1 домом:',
  },
  with2Houses: {
    ro: 'Cu 2 Case:',
    en: 'With 2 Houses:',
    ru: 'С 2 домами:',
  },
  with3Houses: {
    ro: 'Cu 3 Case:',
    en: 'With 3 Houses:',
    ru: 'С 3 домами:',
  },
  with4Houses: {
    ro: 'Cu 4 Case:',
    en: 'With 4 Houses:',
    ru: 'С 4 домами:',
  },
  withHotel: {
    ro: 'Cu HOTEL / Vinărie:',
    en: 'With Grand HOTEL:',
    ru: 'С ОТЕЛЕМ / Винодельней:',
  },
  buildCost: {
    ro: 'Cost construcție clădire:',
    en: 'Building Construction Cost:',
    ru: 'Стоимость постройки:',
  },
  mortgageVal: {
    ro: 'Valoare ipotecară (50%):',
    en: 'Mortgage Value (50%):',
    ru: 'Залоговая стоимость (50%):',
  },
  owner: {
    ro: 'Proprietar:',
    en: 'Owner:',
    ru: 'Владелец:',
  },
  unowned: {
    ro: 'Proprietate Municipală (Liber)',
    en: 'Municipal Property (Available)',
    ru: 'Муниципальная собственность',
  },
  inJailBadge: {
    ro: 'Nr. 13',
    en: 'No. 13',
    ru: '№ 13',
  },
  mortgagedBadge: {
    ro: 'IPOTECAT',
    en: 'MORTGAGED',
    ru: 'В ЗАЛОГЕ',
  },
  gameLog: {
    ro: 'Cronica Partidei',
    en: 'Match Chronicle',
    ru: 'Хроника партии',
  },
  myProperties: {
    ro: 'Portofoliu Imobiliar',
    en: 'Real Estate Portfolio',
    ru: 'Портфель недвижимости',
  },
  clickTileHint: {
    ro: 'Selectează orice parcelă de pe tablă pentru extrasul cadastral, construcții sau ipotecă.',
    en: 'Select any parcel on the board to inspect its title deed, construct buildings, or mortgage.',
    ru: 'Выберите любой участок на поле для просмотра кадастра, постройки зданий или залога.',
  },
  resetRoom: {
    ro: 'Partidă Nouă',
    en: 'New Match',
    ru: 'Новая партия',
  },
  fullscreen: {
    ro: 'Ecran Complet',
    en: 'Fullscreen',
    ru: 'Полный экран',
  },
  exitFullscreen: {
    ro: 'Ieșire Ecran',
    en: 'Exit Fullscreen',
    ru: 'Оконный режим',
  },
  boardOnly: {
    ro: 'Doar Tabla',
    en: 'Board Only',
    ru: 'Только поле',
  },
  showSidebar: {
    ro: 'Arată Panoul',
    en: 'Show Panel',
    ru: 'Показать панель',
  },
};
