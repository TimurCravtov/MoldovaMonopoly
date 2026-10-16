import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  GameState,
  GROUP_COLORS,
  Language,
  getTokenEmoji,
} from './types/game';
import { t, UI_TEXT } from './i18n/translations';
import { MonopolyBoard } from './components/MonopolyBoard';
import { PropertyDeedCard } from './components/PropertyDeedCard';
import { LobbyView } from './components/LobbyView';
import { TradeModal } from './components/TradeModal';

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
  return localStorage.getItem('chisinau_monopoly_player_name') || 'Cumătrul';
}

export function App() {
  const [lang, setLang] = useState<Language>('ro');
  const [roomId, setRoomId] = useState<string>('chisinau-central');
  const [myPlayerId] = useState<string>(getOrCreatePlayerId);
  const [state, setState] = useState<GameState | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [selectedTileIdx, setSelectedTileIdx] = useState<number | null>(39); // Default to Bd. Ștefan cel Mare
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🇲🇩</span>
          <div>
            <span className="font-black text-sm sm:text-base tracking-wide text-amber-400">
              {t(UI_TEXT.title, lang)}
            </span>
            <span
              className={`ml-2 inline-block w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-400' : 'bg-red-500'
              }`}
              title={connected ? 'Conectat la Server' : 'Deconectat'}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Room Quick Switcher */}
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-200 font-medium"
          >
            <option value="chisinau-central">🏛️ Sala PMAN (Central)</option>
            <option value="botanica-gates">🏙️ Sala Porțile Orașului</option>
            <option value="cricova-vip">🍷 Sala Beciurile Cricova</option>
          </select>

          {/* Language Switcher: RO / EN / RU */}
          <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            {(['ro', 'en', 'ru'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition ${
                  lang === l
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {state && state.phase !== 'LOBBY' && (
            <button
              onClick={() => sendAction('RESET_GAME')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300"
            >
              {t(UI_TEXT.resetRoom, lang)}
            </button>
          )}
        </div>
      </header>

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-red-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-red-400 font-bold text-xs sm:text-sm animate-bounce">
          ⚠️ {errorToast}
        </div>
      )}

      {/* Main Content */}
      {!state ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="space-y-2">
            <div className="text-4xl animate-spin">🚎</div>
            <p className="text-sm text-slate-400">
              Se conectează la serverul din Chișinău (Troleibuzul 22)...
            </p>
          </div>
        </div>
      ) : state.phase === 'LOBBY' ? (
        <main className="flex-1 py-4">
          <LobbyView
            state={state}
            myPlayerId={myPlayerId}
            lang={lang}
            onSendAction={sendAction}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* Left Column (8 cols on XL): The 40-Tile Board */}
          <div className="xl:col-span-8 flex items-center justify-center">
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

          {/* Right Column (4 cols on XL): Players, Deed Inspector, Trades & Game Log */}
          <div className="xl:col-span-4 space-y-4">
            {/* Incoming Pending Trades Alert */}
            {pendingTradesForMe.map((tr) => {
              const fromPlayer = state.players.find(
                (p) => p.id === tr.fromPlayerId
              );
              return (
                <div
                  key={tr.id}
                  className="bg-indigo-950/90 border-2 border-indigo-400 rounded-2xl p-3.5 space-y-2 shadow-xl"
                >
                  <div className="text-xs font-black uppercase text-indigo-300">
                    🤝 Ofertă de Schimb de la {fromPlayer?.name}
                  </div>
                  <div className="text-xs space-y-1 text-slate-200">
                    <div>
                      <strong>Primești:</strong> {tr.offerCash} MDL{' '}
                      {tr.offerProperties
                        .map((i) => t(state.tiles[i].name, lang))
                        .join(', ')}
                    </div>
                    <div>
                      <strong>Dai în schimb:</strong> {tr.requestCash} MDL{' '}
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
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Acceptă 🤝
                    </button>
                    <button
                      onClick={() =>
                        sendAction('RESPOND_TRADE', {
                          tradeId: tr.id,
                          accept: false,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs"
                    >
                      Refuză ✕
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Players Standings & Portfolio */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  👥 {t(UI_TEXT.playersInRoom, lang)}
                </h3>
                <button
                  onClick={() => setShowTradeModal(true)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold"
                >
                  {t(UI_TEXT.proposeTrade, lang)}
                </button>
              </div>

              <div className="space-y-2.5">
                {state.players.map((p, idx) => {
                  const ownedTiles = state.tiles.filter(
                    (tile) => tile.ownerId === p.id
                  );
                  const isTurn = idx === state.currentPlayerIdx;
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border transition ${
                        p.bankrupt
                          ? 'opacity-45 bg-slate-900 border-slate-800'
                          : isTurn
                          ? 'bg-slate-800/95 border-amber-500 shadow-md'
                          : 'bg-slate-800/60 border-slate-700/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            style={{ backgroundColor: p.color }}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-sm shadow border border-white/40"
                          >
                            {getTokenEmoji(p.token)}
                          </div>
                          <div>
                            <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {p.id === myPlayerId && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                                  TU
                                </span>
                              )}
                              {p.inJail && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-800 text-rose-200">
                                  🔒 {t(UI_TEXT.inJailBadge, lang)}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              📍 {t(state.tiles[p.position]?.name, lang)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm text-emerald-400">
                            {p.cash} MDL
                          </div>
                          {p.getOutOfJailFree > 0 && (
                            <div className="text-[10px] text-amber-300">
                              📜 ×{p.getOutOfJailFree} Cumătru
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Owned Property Chips */}
                      {ownedTiles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1 pt-2 border-t border-slate-700/60">
                          {ownedTiles.map((tile) => {
                            const grp =
                              GROUP_COLORS[tile.group] || GROUP_COLORS.NONE;
                            return (
                              <button
                                key={tile.index}
                                onClick={() => setSelectedTileIdx(tile.index)}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 border ${grp.bg} ${grp.text} ${
                                  tile.mortgaged ? 'opacity-50 line-through' : ''
                                }`}
                                title={t(tile.name, lang)}
                              >
                                <span>{tile.icon}</span>
                                <span className="max-w-[90px] truncate">
                                  {t(tile.name, lang)}
                                </span>
                                {tile.houses > 0 && (
                                  <span>
                                    {tile.houses === 5
                                      ? '🏰'
                                      : `×${tile.houses}🏠`}
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

            {/* Selected Tile Cadastral Deed Card */}
            {selectedTile && (
              <PropertyDeedCard
                tile={selectedTile}
                state={state}
                myPlayerId={myPlayerId}
                lang={lang}
                onSendAction={sendAction}
                onClose={() => setSelectedTileIdx(null)}
              />
            )}

            {/* Chișinău Chronicle (Game Log) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-2 border-b border-slate-800 pb-1.5">
                📜 {t(UI_TEXT.gameLog, lang)}
              </h3>
              <div className="space-y-1.5 max-h-56 overflow-y-auto text-xs pr-1">
                {[...state.logs].reverse().map((entry) => (
                  <div
                    key={entry.id}
                    className="text-slate-300 bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-800"
                  >
                    {t(entry.text, lang)}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
