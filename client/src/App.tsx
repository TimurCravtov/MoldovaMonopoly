import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
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
import { TokenSvg } from './components/icons/MoldovaIcons';

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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [boardOnly, setBoardOnly] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  };

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
      } bg-[#E6E2D8] text-[#141414] flex flex-col`}
    >
      {/* Compact Print Top Bar (48px) */}
      <header className="h-[48px] shrink-0 bg-[#FAF8F5] border-b-2 border-[#141414] px-4 flex items-center justify-between gap-3 z-30">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#E32626] text-white font-black text-xs px-2 py-0.5 border-[1.5px] border-[#141414] tracking-widest uppercase">
            MONOPOLY
          </div>
          <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-[#141414] hidden sm:inline">
            CHIȘINĂU & MOLDOVA
          </span>
          <span
            className={`inline-block w-2 h-2 rounded-full border border-[#141414] ${
              connected ? 'bg-[#1EA350]' : 'bg-[#E32626]'
            }`}
            title={connected ? 'Online' : 'Offline'}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Room Selector */}
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="bg-white border-[1.5px] border-[#141414] text-xs px-2 py-1 text-[#141414] font-bold uppercase focus:outline-none hidden md:block"
          >
            <option value="chisinau-central">Sala PMAN (Central)</option>
            <option value="botanica-gates">Sala Porțile Orașului</option>
            <option value="cricova-vip">Sala Beciurile Cricova</option>
          </select>

          {/* Language Switcher: RO / EN / RU */}
          <div className="flex border-[1.5px] border-[#141414] bg-white">
            {(['ro', 'en', 'ru'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-0.5 text-[11px] font-black uppercase transition ${
                  lang === l
                    ? 'bg-[#141414] text-white'
                    : 'text-[#141414] hover:bg-neutral-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Board-Only Toggle (hides/shows right panel) */}
          {isGameActive && (
            <button
              onClick={() => setBoardOnly((prev) => !prev)}
              className={`px-2.5 py-1 border-[1.5px] border-[#141414] text-[11px] font-black uppercase transition ${
                boardOnly
                  ? 'bg-[#FDE021] text-[#141414]'
                  : 'bg-white hover:bg-neutral-200 text-[#141414]'
              }`}
            >
              {boardOnly
                ? t(UI_TEXT.showSidebar, lang)
                : t(UI_TEXT.boardOnly, lang)}
            </button>
          )}

          {/* Native Browser Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`px-2.5 py-1 border-[1.5px] border-[#141414] text-[11px] font-black uppercase transition ${
              isFullscreen
                ? 'bg-[#141414] text-white'
                : 'bg-white hover:bg-neutral-200 text-[#141414]'
            }`}
            title={
              isFullscreen
                ? t(UI_TEXT.exitFullscreen, lang)
                : t(UI_TEXT.fullscreen, lang)
            }
          >
            {isFullscreen
              ? t(UI_TEXT.exitFullscreen, lang)
              : t(UI_TEXT.fullscreen, lang)}
          </button>

          {isGameActive && (
            <button
              onClick={() => sendAction('RESET_GAME')}
              className="px-2.5 py-1 bg-white hover:bg-neutral-200 border-[1.5px] border-[#141414] text-[11px] font-black uppercase text-[#141414] hidden sm:inline-block"
            >
              {t(UI_TEXT.resetRoom, lang)}
            </button>
          )}
        </div>
      </header>

      {/* Error Notification */}
      {errorToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#E32626] text-white px-4 py-2 border-2 border-[#141414] shadow-[4px_4px_0_#141414] font-bold text-xs uppercase">
          {errorToast}
        </div>
      )}

      {/* Main Content */}
      {!state ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-[#141414]">
            CONECTARE LA SERVERUL DIN CHIȘINĂU...
          </p>
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
        <main className="flex-1 min-h-0 w-full flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-3 p-2 sm:p-2.5 overflow-y-auto lg:overflow-hidden relative">
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
              expanded={boardOnly}
            />
          </div>

          {/* Floating Title Deed Inspector when in Board-Only Mode */}
          {boardOnly && selectedTile && (
            <div className="fixed top-14 right-4 z-40 w-80">
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

          {/* Right Sidebar: Independently Scrollable Title Deed, Players & Chronicle */}
          {!boardOnly && (
            <aside className="w-full lg:w-[365px] xl:w-[380px] shrink-0 flex flex-col gap-3 lg:h-full lg:overflow-y-auto pr-0.5">
              {/* Incoming Pending Trades Alert */}
              {pendingTradesForMe.map((tr) => {
                const fromPlayer = state.players.find(
                  (p) => p.id === tr.fromPlayerId
                );
                return (
                  <div
                    key={tr.id}
                    className="bg-[#FDE021] border-2 border-[#141414] shadow-[4px_4px_0_#141414] p-3 space-y-2 shrink-0"
                  >
                    <div className="text-xs font-black uppercase text-[#141414]">
                      OFERTĂ DE SCHIMB DE LA {fromPlayer?.name}
                    </div>
                    <div className="text-xs space-y-1 text-[#141414]">
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
                        className="px-3 py-1 bg-[#1EA350] text-white border border-[#141414] font-black text-xs uppercase"
                      >
                        Acceptă
                      </button>
                      <button
                        onClick={() =>
                          sendAction('RESPOND_TRADE', {
                            tradeId: tr.id,
                            accept: false,
                          })
                        }
                        className="px-3 py-1 bg-[#E32626] text-white border border-[#141414] font-black text-xs uppercase"
                      >
                        Refuză
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Selected Tile Title Deed Card */}
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
              <div className="bg-[#FAF8F5] border-2 border-[#141414] shadow-[4px_4px_0_#141414] p-3 space-y-2.5 shrink-0">
                <div className="flex items-center justify-between border-b-2 border-[#141414] pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    {t(UI_TEXT.playersInRoom, lang)}
                  </h3>
                  <button
                    onClick={() => setShowTradeModal(true)}
                    className="text-[10.5px] px-2 py-0.5 bg-white hover:bg-neutral-200 border border-[#141414] font-bold uppercase"
                  >
                    {t(UI_TEXT.proposeTrade, lang)}
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
                        className={`p-2 border-[1.5px] border-[#141414] ${
                          p.bankrupt
                            ? 'opacity-40 bg-neutral-200'
                            : isTurn
                            ? 'bg-[#D8E5D7] shadow-[2px_2px_0_#141414]'
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              style={{ backgroundColor: p.color }}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white border-[1.5px] border-[#141414] shrink-0"
                            >
                              <TokenSvg tokenId={p.token} className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-black text-xs uppercase flex items-center gap-1.5 truncate">
                                <span className="truncate">{p.name}</span>
                                {p.id === myPlayerId && (
                                  <span className="text-[8.5px] px-1 bg-[#141414] text-white">
                                    TU
                                  </span>
                                )}
                                {p.inJail && (
                                  <span className="text-[8.5px] px-1 bg-[#F58220] text-[#141414] border border-[#141414] font-black">
                                    {t(UI_TEXT.inJailBadge, lang)}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-neutral-600 font-medium truncate">
                                {t(state.tiles[p.position]?.name, lang)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <div className="font-mono-num font-bold text-xs sm:text-sm text-[#141414]">
                              {p.cash} MDL
                            </div>
                            {p.getOutOfJailFree > 0 && (
                              <div className="text-[9.5px] font-bold text-[#E32626] uppercase">
                                ×{p.getOutOfJailFree} CUMĂTRU
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Owned Property Color Swatches */}
                        {ownedTiles.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1 pt-1.5 border-t border-neutral-300">
                            {ownedTiles.map((tile) => {
                              const grp =
                                GROUP_COLORS[tile.group] || GROUP_COLORS.NONE;
                              return (
                                <button
                                  key={tile.index}
                                  onClick={() => setSelectedTileIdx(tile.index)}
                                  className={`text-[9px] px-1.5 py-0.5 font-bold uppercase flex items-center gap-1 border border-[#141414] ${grp.bg} ${grp.text} ${
                                    tile.mortgaged ? 'opacity-45 line-through' : ''
                                  }`}
                                  title={t(tile.name, lang)}
                                >
                                  <span className="max-w-[85px] truncate">
                                    {t(tile.name, lang)}
                                  </span>
                                  {tile.houses > 0 && (
                                    <span className="font-mono-num">
                                      {tile.houses === 5
                                        ? '[H]'
                                        : `[${tile.houses}]`}
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
              <div className="bg-[#FAF8F5] border-2 border-[#141414] shadow-[4px_4px_0_#141414] p-3 shrink-0">
                <div className="border-b-2 border-[#141414] pb-1 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    {t(UI_TEXT.gameLog, lang)}
                  </h3>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto text-[11px] pr-1 font-medium">
                  {[...state.logs].reverse().map((entry) => (
                    <div
                      key={entry.id}
                      className="text-[#141414] bg-white px-2 py-1 border border-neutral-300 leading-snug"
                    >
                      {t(entry.text, lang)}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}
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
