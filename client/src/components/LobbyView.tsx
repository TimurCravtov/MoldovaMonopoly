import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Sliders,
  Play,
  Check,
  UserCheck,
} from 'lucide-react';
import {
  GameState,
  Language,
  MOLDOVA_TOKENS,
  PLAYER_COLORS,
} from '../types/game';
import { t, UI_TEXT } from '../i18n/translations';
import { TokenSvg } from './icons/MoldovaIcons';

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
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Editorial Hero Banner with AI-Generated Engraving */}
      <div className="relative overflow-hidden bg-[#221814] border-2 border-[#C59B27]/70 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center gap-6">
        <img
          src="/assets/chisinau-emblem.jpg"
          alt="Chișinău Emblem"
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-[#C59B27] shadow-2xl shrink-0"
        />
        <div className="text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#3A2820] border border-[#C59B27]/40 text-[11px] font-semibold uppercase tracking-widest text-[#E5C158]">
            <span>Ediție Oficială de Masă</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-4xl font-bold text-[#FAF6EE] tracking-wide">
            {t(UI_TEXT.title, lang)}
          </h1>
          <p className="text-xs sm:text-sm text-[#C8B9A6] max-w-2xl">
            {t(UI_TEXT.subtitle, lang)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Card (7 cols): Customize Player & Municipal Rules */}
        <div className="md:col-span-7 bg-[#201713] border border-[#3E2E25] rounded-2xl p-5 space-y-5 shadow-xl">
          <div className="flex items-center gap-2 border-b border-[#34261E] pb-2.5">
            <UserCheck className="w-4 h-4 text-[#E5C158]" />
            <h2 className="font-editorial text-base font-bold text-[#E5C158] uppercase tracking-wider">
              {t(UI_TEXT.yourName, lang)}
            </h2>
          </div>

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
              placeholder="Ex: Arhitect Bernardazzi"
              className="flex-1 bg-[#16100D] border border-[#4A382E] rounded-lg px-3.5 py-2 text-sm text-[#FAF6EE] focus:outline-none focus:border-[#C59B27]"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C59B27] hover:bg-[#D4AB37] text-[#16110E] font-bold text-xs uppercase tracking-wider"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmă</span>
            </button>
          </div>

          {/* Vector SVG Token Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#B8A99A] mb-2.5">
              {t(UI_TEXT.chooseToken, lang)}
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
                    className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition ${
                      selected
                        ? 'bg-[#C59B27]/20 border-[#C59B27] text-[#FAF6EE] ring-1 ring-[#C59B27]'
                        : 'bg-[#16100D]/80 border-[#382A22] hover:border-[#6E5647] text-[#C8B9A6]'
                    }`}
                  >
                    <TokenSvg
                      tokenId={tok.id}
                      className="w-6 h-6 mb-1.5 text-[#E5C158]"
                    />
                    <span className="text-[11px] font-semibold leading-tight">
                      {t(tok.name, lang)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#B8A99A] mb-2">
              {t(UI_TEXT.chooseColor, lang)}
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
                        ? 'scale-110 ring-2 ring-[#FAF6EE] shadow-lg'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Municipal House Rules */}
          <div className="pt-3 border-t border-[#34261E] space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E5C158]">
              <Sliders className="w-3.5 h-3.5" />
              <span>{t(UI_TEXT.gameSettings, lang)}</span>
            </div>

            <label className="flex items-center justify-between text-xs text-[#D6C7B2]">
              <span>{t(UI_TEXT.startingCash, lang)}</span>
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
                className="bg-[#16100D] border border-[#4A382E] rounded-lg px-2.5 py-1 text-[#E5C158] font-mono-num font-bold"
              >
                <option value={1000}>1000 MDL</option>
                <option value={1500}>1500 MDL (Standard)</option>
                <option value={2000}>2000 MDL</option>
                <option value={3000}>3000 MDL</option>
              </select>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#D6C7B2] cursor-pointer">
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
                className="accent-[#C59B27]"
              />
              <span>{t(UI_TEXT.freeParkingJackpot, lang)}</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#D6C7B2] cursor-pointer">
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
                className="accent-[#C59B27]"
              />
              <span>{t(UI_TEXT.doubleOnGo, lang)}</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#D6C7B2] cursor-pointer">
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
                className="accent-[#C59B27]"
              />
              <span>{t(UI_TEXT.auctionEnabled, lang)}</span>
            </label>
          </div>
        </div>

        {/* Right Card (5 cols): Players Registry & Start Match */}
        <div className="md:col-span-5 bg-[#201713] border border-[#3E2E25] rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#34261E] pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#E5C158]" />
                <h2 className="font-editorial text-base font-bold text-[#E5C158] uppercase tracking-wider">
                  {t(UI_TEXT.playersInRoom, lang)} ({state.players.length}/8)
                </h2>
              </div>
              {state.players.length < 8 && (
                <button
                  onClick={() => onSendAction('ADD_BOT')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3A2C24] hover:bg-[#4A382E] border border-[#C59B27]/50 text-[#FAF6EE] font-bold text-xs shadow"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#E5C158]" />
                  <span>{t(UI_TEXT.addBot, lang)}</span>
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {state.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-[#16100D] border border-[#34261E] rounded-xl px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: p.color }}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow border border-[#FAF6EE]/40"
                    >
                      <TokenSvg tokenId={p.token} className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#FAF6EE] flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.id === myPlayerId && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C59B27]/20 text-[#E5C158] border border-[#C59B27]/40 uppercase">
                            TU
                          </span>
                        )}
                      </div>
                      <div className="font-mono-num text-xs text-[#4ADE80] font-semibold">
                        {p.cash} MDL
                      </div>
                    </div>
                  </div>

                  {p.isBot && (
                    <button
                      onClick={() =>
                        onSendAction('REMOVE_PLAYER', { targetId: p.id })
                      }
                      className="p-1.5 rounded-lg bg-[#3B1216] hover:bg-[#58111A] text-[#FCA5A5]"
                      title="Elimină Partener AI"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#34261E] mt-4">
            {state.players.length < 2 && (
              <p className="text-xs text-[#E5C158] text-center mb-3">
                {t(UI_TEXT.needMorePlayers, lang)}
              </p>
            )}
            <button
              disabled={state.players.length < 2}
              onClick={() => onSendAction('START_GAME')}
              className="w-full py-3 rounded-xl bg-[#C59B27] hover:bg-[#D4AB37] disabled:opacity-40 text-[#16110E] font-bold text-sm uppercase tracking-widest shadow-xl transition inline-flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t(UI_TEXT.startGame, lang)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
