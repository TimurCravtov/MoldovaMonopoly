import React, { useState } from 'react';
import {
  GameState,
  Language,
  MOLDOVA_TOKENS,
  PLAYER_COLORS,
} from '../types/game';
import { t, UI_TEXT } from '../i18n/translations';
import { TokenSvg } from './icons/MoldovaIcons';
import { RoomBrowser } from './RoomBrowserModal';

interface LobbyViewProps {
  state: GameState;
  myPlayerId: string;
  lang: Language;
  onSendAction: (action: string, payload?: Record<string, unknown>) => void;
  onSwitchRoom: (roomId: string) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  state,
  myPlayerId,
  lang,
  onSendAction,
  onSwitchRoom,
}) => {
  const myPlayer = state.players.find((p) => p.id === myPlayerId);
  const [nameInput, setNameInput] = useState(myPlayer?.name || '');
  const maxSeats = state.settings.maxPlayers || 4;

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
      {/* Classic Box Cover Header */}
      <div className="bg-[#D8E5D7] border-[3px] border-[#141414] shadow-[6px_6px_0_#141414] p-5 text-center">
        <div className="inline-block bg-[#E32626] text-white border-[2.5px] border-[#141414] shadow-[4px_4px_0_#141414] px-8 py-2 mb-2.5">
          <h1 className="text-2xl sm:text-4xl font-black tracking-[0.15em] uppercase leading-none">
            MONOPOLY
          </h1>
          <div className="text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase mt-1 border-t border-white/40 pt-1">
            CHIȘINĂU & MOLDOVA
          </div>
        </div>
        <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#141414] max-w-xl mx-auto">
          {t(UI_TEXT.subtitle, lang)}
        </p>
      </div>

      {/* Live VK Monopoly Style Room Directory & Create New Table */}
      <RoomBrowser
        inline
        lang={lang}
        currentRoomId={state.roomId}
        onSelectRoom={onSwitchRoom}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Card (7 cols): Player Sheet & Rules */}
        <div className="md:col-span-7 bg-[#FAF8F5] border-2 border-[#141414] shadow-[5px_5px_0_#141414] p-5 space-y-5">
          <div className="border-b-2 border-[#141414] pb-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#141414]">
              1. {t(UI_TEXT.yourName, lang)}
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
              placeholder="Numele tău"
              className="flex-1 bg-white border-2 border-[#141414] px-3 py-2 text-sm font-bold text-[#141414] focus:outline-none"
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
              className="px-4 py-2 bg-[#141414] hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider"
            >
              OK
            </button>
          </div>

          {/* Token Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#141414] mb-2">
              2. {t(UI_TEXT.chooseToken, lang)}
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
                    className={`flex flex-col items-center p-2.5 border-2 text-center transition ${
                      selected
                        ? 'bg-[#FDE021] border-[#141414] shadow-[2px_2px_0_#141414]'
                        : 'bg-white border-neutral-400 hover:border-[#141414]'
                    }`}
                  >
                    <TokenSvg
                      tokenId={tok.id}
                      className="w-6 h-6 mb-1 text-[#141414]"
                    />
                    <span className="text-[10.5px] font-bold uppercase leading-tight">
                      {t(tok.name, lang)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#141414] mb-2">
              3. {t(UI_TEXT.chooseColor, lang)}
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
                    className={`w-8 h-8 border-2 border-[#141414] transition ${
                      selected
                        ? 'shadow-[3px_3px_0_#141414] -translate-y-0.5'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Municipal House Rules */}
          <div className="pt-3 border-t-2 border-[#141414] space-y-2.5">
            <div className="text-xs font-black uppercase tracking-wider text-[#141414]">
              4. {t(UI_TEXT.gameSettings, lang)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center justify-between text-xs font-semibold">
                <span>{t(UI_TEXT.maxPlayersLabel, lang)}</span>
                <select
                  value={maxSeats}
                  onChange={(e) =>
                    onSendAction('UPDATE_SETTINGS', {
                      settings: {
                        ...state.settings,
                        maxPlayers: Number(e.target.value),
                      },
                    })
                  }
                  className="bg-white border-2 border-[#141414] px-2 py-1 font-mono-num font-bold"
                >
                  <option value={2}>2 (Duel 1v1)</option>
                  <option value={3}>3</option>
                  <option value={4}>4 (Standard)</option>
                  <option value={6}>6</option>
                  <option value={8}>8 (Maxim)</option>
                </select>
              </label>

              <label className="flex items-center justify-between text-xs font-semibold">
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
                  className="bg-white border-2 border-[#141414] px-2 py-1 font-mono-num font-bold"
                >
                  <option value={1000}>1000 MDL</option>
                  <option value={1500}>1500 MDL</option>
                  <option value={2000}>2000 MDL</option>
                  <option value={2500}>2500 MDL</option>
                  <option value={3000}>3000 MDL</option>
                </select>
              </label>
            </div>

            <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(state.settings.autoStart)}
                onChange={(e) =>
                  onSendAction('UPDATE_SETTINGS', {
                    settings: {
                      ...state.settings,
                      autoStart: e.target.checked,
                    },
                  })
                }
                className="accent-[#141414] w-4 h-4"
              />
              <span>{t(UI_TEXT.autoStartLabel, lang)}</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
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
                className="accent-[#141414] w-4 h-4"
              />
              <span>{t(UI_TEXT.freeParkingJackpot, lang)}</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
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
                className="accent-[#141414] w-4 h-4"
              />
              <span>{t(UI_TEXT.doubleOnGo, lang)}</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
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
                className="accent-[#141414] w-4 h-4"
              />
              <span>{t(UI_TEXT.auctionEnabled, lang)}</span>
            </label>
          </div>
        </div>

        {/* Right Card (5 cols): Players List & Start Button */}
        <div className="md:col-span-5 bg-[#FAF8F5] border-2 border-[#141414] shadow-[5px_5px_0_#141414] p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#141414] pb-2">
              <h2 className="text-sm font-black uppercase tracking-wider">
                {t(UI_TEXT.playersInRoom, lang)} ({state.players.length}/{maxSeats})
              </h2>
              {state.players.length < maxSeats && (
                <button
                  onClick={() => onSendAction('ADD_BOT')}
                  className="px-2.5 py-1 bg-[#FDE021] hover:bg-[#F5D400] border-[1.5px] border-[#141414] shadow-[2px_2px_0_#141414] text-[#141414] font-black text-[11px] uppercase"
                >
                  + {t(UI_TEXT.addBot, lang)}
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {state.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-white border-[1.5px] border-[#141414] px-3 py-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      style={{ backgroundColor: p.color }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white border-[1.5px] border-[#141414]"
                    >
                      <TokenSvg tokenId={p.token} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-xs uppercase flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.id === myPlayerId && (
                          <span className="text-[9px] px-1 bg-[#141414] text-white">
                            TU
                          </span>
                        )}
                      </div>
                      <div className="font-mono-num text-xs text-[#1EA350] font-bold">
                        {p.cash} MDL
                      </div>
                    </div>
                  </div>

                  {p.isBot && (
                    <button
                      onClick={() =>
                        onSendAction('REMOVE_PLAYER', { targetId: p.id })
                      }
                      className="px-2 py-0.5 bg-[#E32626] text-white font-bold text-[10px] border border-[#141414] uppercase"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t-2 border-[#141414] mt-4">
            {state.players.length < 2 && (
              <p className="text-xs font-bold text-[#E32626] text-center mb-3">
                {t(UI_TEXT.needMorePlayers, lang)}
              </p>
            )}
            <button
              disabled={state.players.length < 2}
              onClick={() => onSendAction('START_GAME')}
              className="w-full py-3 bg-[#1EA350] hover:bg-[#168A41] disabled:opacity-40 text-white font-black text-sm uppercase tracking-widest border-2 border-[#141414] shadow-[4px_4px_0_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              {t(UI_TEXT.startGame, lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
