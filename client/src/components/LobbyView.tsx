import React, { useState } from 'react';
import {
  GameState,
  Language,
  MOLDOVA_TOKENS,
  PLAYER_COLORS,
  getTokenEmoji,
} from '../types/game';
import { t, UI_TEXT } from '../i18n/translations';

interface LobbyViewProps {
  state: GameState;
  myPlayerId: string;
  lang: Language;
  onSendAction: (action: string, payload?: Record<string, unknown>) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  state,
  myPlayerId,
  lang,
  onSendAction,
}) => {
  const myPlayer = state.players.find((p) => p.id === myPlayerId);
  const [nameInput, setNameInput] = useState(myPlayer?.name || '');

  const handleAppearanceChange = (
    newName: string,
    newToken: string,
    newColor: string
  ) => {
    onSendAction('UPDATE_APPEARANCE', {
      name: newName,
      token: newToken,
      color: newColor,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-amber-900/60 to-rose-950 border-2 border-amber-500/60 rounded-3xl p-6 text-center shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-amber-500/40 text-xs text-amber-300 mb-3">
          <span>🇲🇩</span>
          <span>Chișinău & Moldova Edition</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          {t(UI_TEXT.title, lang)}
        </h1>
        <p className="text-xs sm:text-sm text-amber-200/90 mt-1.5 max-w-2xl mx-auto">
          {t(UI_TEXT.subtitle, lang)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Customize Your Moldovan Character */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-amber-400 border-b border-slate-800 pb-2">
            🪪 {t(UI_TEXT.yourName, lang)}
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={() => {
                if (nameInput.trim() && myPlayer) {
                  handleAppearanceChange(
                    nameInput.trim(),
                    myPlayer.token,
                    myPlayer.color
                  );
                }
              }}
              placeholder="Ex: Cumătrul Vasile"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => {
                if (nameInput.trim() && myPlayer) {
                  handleAppearanceChange(
                    nameInput.trim(),
                    myPlayer.token,
                    myPlayer.color
                  );
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Salvează
            </button>
          </div>

          {/* Token Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              {t(UI_TEXT.chooseToken, lang)}:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MOLDOVA_TOKENS.map((tok) => {
                const selected = myPlayer?.token === tok.id;
                return (
                  <button
                    key={tok.id}
                    onClick={() =>
                      myPlayer &&
                      handleAppearanceChange(
                        myPlayer.name,
                        tok.id,
                        myPlayer.color
                      )
                    }
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition ${
                      selected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                        : 'bg-slate-800/70 border-slate-700/80 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="text-2xl mb-1">{tok.emoji}</span>
                    <span className="text-[10px] font-semibold leading-tight">
                      {t(tok.name, lang)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              {t(UI_TEXT.chooseColor, lang)}:
            </label>
            <div className="flex flex-wrap gap-2.5">
              {PLAYER_COLORS.map((col) => {
                const selected = myPlayer?.color === col;
                return (
                  <button
                    key={col}
                    onClick={() =>
                      myPlayer &&
                      handleAppearanceChange(
                        myPlayer.name,
                        myPlayer.token,
                        col
                      )
                    }
                    style={{ backgroundColor: col }}
                    className={`w-8 h-8 rounded-full transition transform ${
                      selected
                        ? 'scale-110 ring-2 ring-white shadow-lg'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* House Rules Settings */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              ⚙️ {t(UI_TEXT.gameSettings, lang)}
            </h3>

            <label className="flex items-center justify-between text-xs text-slate-300">
              <span>{t(UI_TEXT.startingCash, lang)}:</span>
              <select
                value={state.settings.startingCash}
                onChange={(e) =>
                  onSendAction('UPDATE_SETTINGS', {
                    settings: {
                      ...state.settings,
                      startingCash: Number(e.target.value),
                    },
                  })
                }
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-amber-300 font-bold"
              >
                <option value={1000}>1000 MDL</option>
                <option value={1500}>1500 MDL (Clasic)</option>
                <option value={2000}>2000 MDL (Cumătrie)</option>
                <option value={3000}>3000 MDL (Magnat)</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={state.settings.freeParkingJackpot}
                onChange={(e) =>
                  onSendAction('UPDATE_SETTINGS', {
                    settings: {
                      ...state.settings,
                      freeParkingJackpot: e.target.checked,
                    },
                  })
                }
              />
              <span>{t(UI_TEXT.freeParkingJackpot, lang)}</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={state.settings.doubleOnGo}
                onChange={(e) =>
                  onSendAction('UPDATE_SETTINGS', {
                    settings: {
                      ...state.settings,
                      doubleOnGo: e.target.checked,
                    },
                  })
                }
              />
              <span>{t(UI_TEXT.doubleOnGo, lang)}</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={state.settings.auctionEnabled}
                onChange={(e) =>
                  onSendAction('UPDATE_SETTINGS', {
                    settings: {
                      ...state.settings,
                      auctionEnabled: e.target.checked,
                    },
                  })
                }
              />
              <span>{t(UI_TEXT.auctionEnabled, lang)}</span>
            </label>
          </div>
        </div>

        {/* Right Card: Players in Room & AI Bots & Start Button */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-base font-bold text-amber-400">
                👥 {t(UI_TEXT.playersInRoom, lang)} ({state.players.length}/8)
              </h2>
              {state.players.length < 8 && (
                <button
                  onClick={() => onSendAction('ADD_BOT')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow"
                >
                  {t(UI_TEXT.addBot, lang)}
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {state.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: p.color }}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-lg shadow border border-white/40"
                    >
                      {getTokenEmoji(p.token)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.id === myPlayerId && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            TU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-emerald-400 font-medium">
                        {p.cash} MDL
                      </div>
                    </div>
                  </div>

                  {p.isBot && (
                    <button
                      onClick={() =>
                        onSendAction('REMOVE_PLAYER', { targetId: p.id })
                      }
                      className="text-xs px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200"
                    >
                      Șterge Bot
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4">
            {state.players.length < 2 && (
              <p className="text-xs text-amber-300 text-center mb-3">
                ⚠️ {t(UI_TEXT.needMorePlayers, lang)}
              </p>
            )}
            <button
              disabled={state.players.length < 2}
              onClick={() => onSendAction('START_GAME')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-slate-950 font-black text-base shadow-xl transition"
            >
              {t(UI_TEXT.startGame, lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
