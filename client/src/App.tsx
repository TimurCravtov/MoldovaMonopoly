import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Users,
  Handshake,
  ScrollText,
  RotateCcw,
  MapPin,
  Lock,
  KeyRound,
  AlertCircle,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import {
  GameState,
  GROUP_COLORS,
  Language,
} from './types/game';
import { t, UI_TEXT } from './i18n/translations';
import { MonopolyBoard } from './components/MonopolyBoard';
import { PropertyDeedCard } from './components/PropertyDeedCard';
import { LobbyView } from './components/LobbyView';
import { TradeModal } from './components/TradeModal';
import {
  TokenSvg,
  TileIcon,
  HouseSvg,
  HotelSvg,
} from './components/icons/MoldovaIcons';

function getOrCreatePlayerId(): string {
  const key = 'chisinau_monopoly_player_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(key, id);
  }
  return id;
}

function getSavedPlayerName(): string {
  return localStorage.getItem('chisinau_monopoly_player_name') || 'Orășean';
}

export function App() {
  const [lang, setLang] = useState<Language>('ro');
  const [roomId, setRoomId] = useState<string>('chisinau-central');
  const [myPlayerId] = useState<string>(getOrCreatePlayerId);
  const [state, setState] = useState<GameState | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [selectedTileIdx, setSelectedTileIdx] = useState<number | null>(39);
  const [showTradeModal, setShowTradeModal] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host =
      window.location.port === '5173'
        ? `${window.location.hostname}:8080`
        : window.location.host;
    const savedName = encodeURIComponent(getSavedPlayerName());
    const wsUrl = `${protocol}//${host}/ws?roomId=${encodeURIComponent(
      roomId
    )}&playerId=${encodeURIComponent(myPlayerId)}&playerName=${savedName}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'STATE' && msg.state) {
          setState(msg.state);
          const me = (msg.state as GameState).players.find(
            (p) => p.id === myPlayerId
          );
          if (me) {
            localStorage.setItem('chisinau_monopoly_player_name', me.name);
          }
          if (msg.state.phase === 'GAME_OVER' && msg.state.winnerId) {
            confetti({
              particleCount: 90,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        } else if (msg.type === 'ERROR' && msg.message) {
          setErrorToast(msg.message);
          setTimeout(() => setErrorToast(null), 4000);
        }
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [roomId, myPlayerId]);

  const sendAction = (action: string, payload: Record<string, unknown> = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        action,
        ...payload,
      })
    );
  };

  const pendingTradesForMe =
    state?.trades.filter(
      (tr) => tr.status === 'PENDING' && tr.toPlayerId === myPlayerId
    ) || [];

  const selectedTile =
    state && selectedTileIdx !== null ? state.tiles[selectedTileIdx] : null;

  const isGameActive = state && state.phase !== 'LOBBY';

  return (
    <div
      className={`${
        isGameActive ? 'h-screen overflow-hidden' : 'min-h-screen'
      } bg-[#16110E] text-[#F5EFE6] flex flex-col`}
    >
      {/* Compact Editorial Top Bar (52px) */}
      <header className="h-[52px] shrink-0 bg-[#1E1612] border-b border-[#3A2C24] px-4 flex items-center justify-between gap-3 z-30">
        <div className="flex items-center gap-3">
          {/* Moldovan Tricolor Vertical Ribbon */}
          <div className="flex h-5 w-3 rounded-xs overflow-hidden border border-white/20 shrink-0">
            <span className="flex-1 bg-[#0046AE]" />
            <span className="flex-1 bg-[#FFD200]" />
            <span className="flex-1 bg-[#CC092F]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-editorial font-bold text-sm sm:text-base tracking-wider text-[#E5C158] uppercase">
              {t(UI_TEXT.title, lang)}
            </span>
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                connected ? 'bg-[#4ADE80]' : 'bg-[#EF4444]'
              }`}
              title={connected ? 'Online' : 'Offline'}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Room Selector */}
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="bg-[#140E0C] border border-[#3E2E25] text-xs rounded-lg px-2.5 py-1.5 text-[#D6C7B2] font-medium focus:outline-none focus:border-[#C59B27]"
          >
            <option value="chisinau-central">Sala PMAN (Central)</option>
            <option value="botanica-gates">Sala Porțile Orașului</option>
            <option value="cricova-vip">Sala Beciurile Cricova</option>
          </select>

          {/* Language Switcher: RO / EN / RU */}
          <div className="flex bg-[#140E0C] p-0.5 rounded-lg border border-[#3E2E25]">
            {(['ro', 'en', 'ru'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition ${
                  lang === l
                    ? 'bg-[#C59B27] text-[#16110E] shadow'
                    : 'text-[#9E8E7E] hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {isGameActive && (
            <button
              onClick={() => sendAction('RESET_GAME')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2A1E19] hover:bg-[#3A2C24] border border-[#4A382E] text-xs font-semibold text-[#E5C158]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {t(UI_TEXT.resetRoom, lang)}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Error Notification */}
      {errorToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#7C1D26] text-[#FAF6EE] px-4 py-2.5 rounded-xl shadow-2xl border border-[#F87171]/40 font-semibold text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#FCA5A5] shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Main Content */}
      {!state ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="space-y-3 flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-[#E5C158] animate-spin" />
            <p className="text-sm text-[#B8A99A]">
              Se conectează la serverul din Chișinău...
            </p>
          </div>
        </div>
      ) : state.phase === 'LOBBY' ? (
        <main className="flex-1 py-4 overflow-y-auto">
          <LobbyView
            state={state}
            myPlayerId={myPlayerId}
            lang={lang}
            onSendAction={sendAction}
          />
        </main>
      ) : (
        <main className="flex-1 min-h-0 w-full flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-3 p-2 sm:p-3 overflow-y-auto lg:overflow-hidden">
          {/* Left Stage: Full-Viewport Square 40-Tile Board */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <MonopolyBoard
              state={state}
              myPlayerId={myPlayerId}
              lang={lang}
              selectedTileIdx={selectedTileIdx}
              onSelectTile={(idx) => setSelectedTileIdx(idx)}
              onSendAction={sendAction}
              onOpenTradeModal={() => setShowTradeModal(true)}
            />
          </div>

          {/* Right Sidebar: Independently Scrollable Inspector, Players & Chronicle */}
          <aside className="w-full lg:w-[375px] xl:w-[400px] shrink-0 flex flex-col gap-3 lg:h-full lg:overflow-y-auto pr-0.5">
            {/* Incoming Pending Trades Alert */}
            {pendingTradesForMe.map((tr) => {
              const fromPlayer = state.players.find(
                (p) => p.id === tr.fromPlayerId
              );
              return (
                <div
                  key={tr.id}
                  className="bg-[#261C17] border-2 border-[#C59B27] rounded-xl p-3 space-y-2 shadow-xl shrink-0"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-[#E5C158]">
                    <Handshake className="w-4 h-4" />
                    <span>Ofertă de la {fromPlayer?.name}</span>
                  </div>
                  <div className="text-xs space-y-1 text-[#EDE3D2]">
                    <div>
                      <strong>Primești:</strong> {tr.offerCash} MDL{' '}
                      {tr.offerProperties
                        .map((i) => t(state.tiles[i].name, lang))
                        .join(', ')}
                    </div>
                    <div>
                      <strong>Cedezi:</strong> {tr.requestCash} MDL{' '}
                      {tr.requestProperties
                        .map((i) => t(state.tiles[i].name, lang))
                        .join(', ')}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() =>
                        sendAction('RESPOND_TRADE', {
                          tradeId: tr.id,
                          accept: true,
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E6B45] hover:bg-[#165234] text-white font-bold text-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Acceptă</span>
                    </button>
                    <button
                      onClick={() =>
                        sendAction('RESPOND_TRADE', {
                          tradeId: tr.id,
                          accept: false,
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#7C1D26] hover:bg-[#9F1239] text-white font-bold text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Refuză</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Selected Tile Cadastral Deed Card */}
            {selectedTile && (
              <div className="shrink-0">
                <PropertyDeedCard
                  tile={selectedTile}
                  state={state}
                  myPlayerId={myPlayerId}
                  lang={lang}
                  onSendAction={sendAction}
                  onClose={() => setSelectedTileIdx(null)}
                />
              </div>
            )}

            {/* Players Standings & Portfolio */}
            <div className="bg-[#1E1612] border border-[#3A2C24] rounded-xl p-3 space-y-2.5 shadow-xl shrink-0">
              <div className="flex items-center justify-between border-b border-[#34261E] pb-2">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#E5C158]" />
                  <h3 className="font-editorial text-xs font-bold uppercase tracking-wider text-[#E5C158]">
                    {t(UI_TEXT.playersInRoom, lang)}
                  </h3>
                </div>
                <button
                  onClick={() => setShowTradeModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-[#2C201B] hover:bg-[#3A2C24] border border-[#5C493E] text-[#E5C158] font-semibold"
                >
                  <Handshake className="w-3 h-3" />
                  <span>{t(UI_TEXT.proposeTrade, lang)}</span>
                </button>
              </div>

              <div className="space-y-2">
                {state.players.map((p, idx) => {
                  const ownedTiles = state.tiles.filter(
                    (tile) => tile.ownerId === p.id
                  );
                  const isTurn = idx === state.currentPlayerIdx;
                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-lg border transition ${
                        p.bankrupt
                          ? 'opacity-40 bg-[#16100D] border-[#2A1E19]'
                          : isTurn
                          ? 'bg-[#281E18] border-[#C59B27] shadow-md'
                          : 'bg-[#16100D]/90 border-[#34261E]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            style={{ backgroundColor: p.color }}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow border border-white/40 shrink-0"
                          >
                            <TokenSvg tokenId={p.token} className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs flex items-center gap-1.5 truncate">
                              <span className="truncate">{p.name}</span>
                              {p.id === myPlayerId && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#C59B27]/20 text-[#E5C158] border border-[#C59B27]/40">
                                  TU
                                </span>
                              )}
                              {p.inJail && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded bg-[#7C1D26] text-white">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>{t(UI_TEXT.inJailBadge, lang)}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#9E8E7E] flex items-center gap-1 truncate">
                              <MapPin className="w-2.5 h-2.5 text-[#C59B27] shrink-0" />
                              <span className="truncate">
                                {t(state.tiles[p.position]?.name, lang)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="font-mono-num font-bold text-xs sm:text-sm text-[#4ADE80]">
                            {p.cash} MDL
                          </div>
                          {p.getOutOfJailFree > 0 && (
                            <div className="inline-flex items-center gap-1 text-[10px] text-[#E5C158]">
                              <KeyRound className="w-2.5 h-2.5" />
                              <span>×{p.getOutOfJailFree}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Owned Property Chips */}
                      {ownedTiles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1 pt-1.5 border-t border-[#34261E]">
                          {ownedTiles.map((tile) => {
                            const grp =
                              GROUP_COLORS[tile.group] || GROUP_COLORS.NONE;
                            return (
                              <button
                                key={tile.index}
                                onClick={() => setSelectedTileIdx(tile.index)}
                                className={`text-[9.5px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 border ${grp.bg} ${grp.text} ${
                                  tile.mortgaged ? 'opacity-45 line-through' : ''
                                }`}
                                title={t(tile.name, lang)}
                              >
                                <TileIcon
                                  iconKey={tile.icon}
                                  className="w-2.5 h-2.5 shrink-0"
                                />
                                <span className="max-w-[82px] truncate">
                                  {t(tile.name, lang)}
                                </span>
                                {tile.houses > 0 && (
                                  <span className="inline-flex items-center">
                                    {tile.houses === 5 ? (
                                      <HotelSvg className="w-2.5 h-2.5" />
                                    ) : (
                                      <>
                                        ×{tile.houses}
                                        <HouseSvg className="w-2.5 h-2.5" />
                                      </>
                                    )}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Match Chronicle (Game Log) */}
            <div className="bg-[#1E1612] border border-[#3A2C24] rounded-xl p-3 shadow-xl shrink-0">
              <div className="flex items-center gap-1.5 border-b border-[#34261E] pb-1.5 mb-2">
                <ScrollText className="w-3.5 h-3.5 text-[#E5C158]" />
                <h3 className="font-editorial text-xs font-bold uppercase tracking-wider text-[#E5C158]">
                  {t(UI_TEXT.gameLog, lang)}
                </h3>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto text-[11px] pr-1">
                {[...state.logs].reverse().map((entry) => (
                  <div
                    key={entry.id}
                    className="text-[#D6C7B2] bg-[#16100D] px-2.5 py-1.5 rounded border border-[#2C201B] leading-snug"
                  >
                    {t(entry.text, lang)}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </main>
      )}

      {/* Trade Negotiation Modal */}
      {showTradeModal && state && (
        <TradeModal
          state={state}
          myPlayerId={myPlayerId}
          lang={lang}
          onClose={() => setShowTradeModal(false)}
          onSendAction={sendAction}
        />
      )}
    </div>
  );
}
export default App;
