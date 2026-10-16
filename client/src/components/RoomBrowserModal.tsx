import React, { useEffect, useState, useCallback } from 'react';
import { GameSettings, Language, RoomSummary } from '../types/game';
import { t, UI_TEXT } from '../i18n/translations';
import { TokenSvg } from './icons/MoldovaIcons';

interface RoomBrowserProps {
  lang: Language;
  currentRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onClose?: () => void;
  inline?: boolean;
}

const SEAT_OPTIONS = [2, 3, 4, 6, 8];
const CASH_OPTIONS = [1000, 1500, 2000, 2500, 3000];

export const RoomBrowser: React.FC<RoomBrowserProps> = ({
  lang,
  currentRoomId,
  onSelectRoom,
  onClose,
  inline = false,
}) => {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState('');

  // New Room Form State
  const [newRoomName, setNewRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [startingCash, setStartingCash] = useState<number>(1500);
  const [autoStart, setAutoStart] = useState<boolean>(true);
  const [freeParkingJackpot, setFreeParkingJackpot] = useState<boolean>(true);
  const [doubleOnGo, setDoubleOnGo] = useState<boolean>(false);
  const [auctionEnabled, setAuctionEnabled] = useState<boolean>(true);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [creating, setCreating] = useState(false);

  const getApiBase = () => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    if (window.location.port === '5173') {
      return `${window.location.protocol}//${window.location.hostname}:8080`;
    }
    return '';
  };

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getApiBase()}/api/rooms`);
      if (res.ok) {
        const data: RoomSummary[] = await res.json();
        setRooms(data);
      }
    } catch {
      // Ignore transient network errors during poll
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 2500);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const slug = `masa-${Math.floor(1000 + Math.random() * 9000)}`;
      const finalName =
        newRoomName.trim() ||
        (lang === 'ro'
          ? `Masa Chișinău #${slug.split('-')[1]}`
          : lang === 'ru'
          ? `Стол Кишинёв #${slug.split('-')[1]}`
          : `Chișinău Table #${slug.split('-')[1]}`);

      const settings: GameSettings = {
        maxPlayers,
        startingCash,
        autoStart,
        freeParkingJackpot,
        doubleOnGo,
        auctionEnabled,
        isPrivate,
      };

      const res = await fetch(`${getApiBase()}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: slug,
          name: finalName,
          settings,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setShowCreateForm(false);
        setNewRoomName('');
        await fetchRooms();
        onSelectRoom(created.id || slug);
        onClose?.();
      } else {
        onSelectRoom(slug);
        onClose?.();
      }
    } catch {
      const fallbackSlug = `masa-${Math.floor(1000 + Math.random() * 9000)}`;
      onSelectRoom(fallbackSlug);
      onClose?.();
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customCodeInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-');
    if (!cleaned) return;
    setCustomCodeInput('');
    onSelectRoom(cleaned);
    onClose?.();
  };

  const content = (
    <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0_#141414] overflow-hidden">
      {/* Header Bar */}
      <div className="bg-[#141414] text-[#FAF8F5] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-serif font-black text-xs uppercase tracking-[0.16em]">
            {t(UI_TEXT.roomBrowser, lang)}
          </span>
          <span className="bg-[#D8E5D7] text-[#141414] px-2 py-0.5 text-[10px] font-mono font-black">
            {rooms.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRooms}
            className="px-2.5 py-1 bg-[#262626] hover:bg-[#363636] text-[#FAF8F5] border border-[#FAF8F5]/30 text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            {loading ? '...' : t(UI_TEXT.refreshRooms, lang)}
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className={`px-3 py-1 border border-[#141414] text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
              showCreateForm
                ? 'bg-[#FDE021] text-[#141414]'
                : 'bg-[#1EA350] hover:bg-[#16833E] text-white'
            }`}
          >
            + {t(UI_TEXT.createNewRoom, lang)}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 bg-[#E32626] text-white text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              X
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Create New Table Builder (VK Monopoly Style) */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateRoom}
          className="bg-[#FAF8F5] border-b-2 border-[#141414] p-4 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Table Name */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#141414]/70 mb-1">
                {t(UI_TEXT.roomNameLabel, lang)}
              </label>
              <input
                type="text"
                maxLength={36}
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder={
                  lang === 'ro'
                    ? 'Ex: Masa Centru / Duel Rîșcani'
                    : lang === 'ru'
                    ? 'Напр.: Стол Центр / Дуэль Рышкановка'
                    : 'E.g., Central Table / Rîșcani Duel'
                }
                className="w-full bg-white border-2 border-[#141414] px-2.5 py-1.5 text-xs font-bold text-[#141414] focus:outline-none"
              />
            </div>

            {/* Max Players Seats (2, 3, 4, 6, 8) */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#141414]/70 mb-1">
                {t(UI_TEXT.maxPlayersLabel, lang)}
              </label>
              <div className="grid grid-cols-5 gap-1">
                {SEAT_OPTIONS.map((seats) => (
                  <button
                    key={seats}
                    type="button"
                    onClick={() => setMaxPlayers(seats)}
                    className={`py-1.5 text-xs font-mono font-black border-2 border-[#141414] cursor-pointer transition-all ${
                      maxPlayers === seats
                        ? 'bg-[#141414] text-white'
                        : 'bg-white text-[#141414] hover:bg-[#D8E5D7]'
                    }`}
                  >
                    {seats}P
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Capital */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#141414]/70 mb-1">
                {t(UI_TEXT.startingCash, lang)}
              </label>
              <div className="grid grid-cols-5 gap-1">
                {CASH_OPTIONS.map((cash) => (
                  <button
                    key={cash}
                    type="button"
                    onClick={() => setStartingCash(cash)}
                    className={`py-1.5 text-[10px] font-mono font-black border-2 border-[#141414] cursor-pointer transition-all ${
                      startingCash === cash
                        ? 'bg-[#141414] text-white'
                        : 'bg-white text-[#141414] hover:bg-[#D8E5D7]'
                    }`}
                  >
                    {cash}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rule Checkboxes & Submit */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#141414]/15">
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-[#141414]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#141414]"
                />
                <span>{t(UI_TEXT.autoStartLabel, lang)}</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeParkingJackpot}
                  onChange={(e) => setFreeParkingJackpot(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#141414]"
                />
                <span>Jackpot Arcul de Triumf</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doubleOnGo}
                  onChange={(e) => setDoubleOnGo(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#141414]"
                />
                <span>2x START (400 MDL)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={auctionEnabled}
                  onChange={(e) => setAuctionEnabled(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#141414]"
                />
                <span>Licitații</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#141414]"
                />
                <span>{t(UI_TEXT.privateRoomLabel, lang)}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-[#E32626] hover:bg-[#C81E1E] text-white font-serif font-black text-xs uppercase tracking-wider border-2 border-[#141414] shadow-[2px_2px_0_#141414] cursor-pointer"
            >
              {creating ? '...' : t(UI_TEXT.createAndJoin, lang)}
            </button>
          </div>
        </form>
      )}

      {/* VK Monopoly-Style Open Tables Grid */}
      <div className="p-3 bg-[#D8E5D7]/45 max-h-[340px] overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {rooms.map((room) => {
          const isCurrent = room.id === currentRoomId;
          const isLobby = room.phase === 'LOBBY';
          const isFull = room.playerCount >= room.maxPlayers;
          const seats = Array.from({ length: room.maxPlayers }, (_, idx) => room.players?.[idx] || null);

          return (
            <div
              key={room.id}
              className={`bg-white border-2 border-[#141414] p-3 flex flex-col justify-between gap-2.5 transition-all ${
                isCurrent
                  ? 'ring-2 ring-[#E32626] shadow-[3px_3px_0_#141414]'
                  : 'hover:bg-[#FAF8F5]'
              }`}
            >
              {/* Top Row: Room Title, Code & Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-serif font-black text-xs uppercase tracking-wide text-[#141414] truncate">
                      {room.name}
                    </span>
                    <span className="font-mono text-[9px] font-bold text-[#141414]/55 bg-[#FAF8F5] border border-[#141414]/30 px-1.5 py-0.2">
                      #{room.id}
                    </span>
                  </div>
                  {/* Rule Badges */}
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    <span className="text-[9px] font-mono font-black px-1.5 py-0.5 bg-[#D8E5D7] text-[#141414] border border-[#141414]/40">
                      {room.settings?.startingCash || 1500} MDL
                    </span>
                    {room.settings?.autoStart && (
                      <span className="text-[9px] font-mono font-black px-1.5 py-0.5 bg-[#FDE021] text-[#141414] border border-[#141414]/40">
                        AUTO
                      </span>
                    )}
                    {room.settings?.freeParkingJackpot && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#FAF8F5] text-[#141414]/80 border border-[#141414]/30">
                        JACKPOT
                      </span>
                    )}
                    {room.settings?.doubleOnGo && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#FAF8F5] text-[#141414]/80 border border-[#141414]/30">
                        2X START
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Pill */}
                <span
                  className={`shrink-0 px-2 py-0.5 text-[9px] font-mono font-black uppercase border border-[#141414] ${
                    !isLobby
                      ? 'bg-[#F58220] text-[#141414]'
                      : isFull
                      ? 'bg-[#141414] text-white'
                      : 'bg-[#1EA350] text-white'
                  }`}
                >
                  {!isLobby
                    ? t(UI_TEXT.inProgressBadge, lang)
                    : isFull
                    ? t(UI_TEXT.roomFullBadge, lang)
                    : `${room.playerCount}/${room.maxPlayers}`}
                </span>
              </div>

              {/* Middle Row: Visual VK-Style Player Seat Slots */}
              <div className="flex items-center gap-1.5 flex-wrap py-1">
                {seats.map((seatedPlayer, seatIdx) =>
                  seatedPlayer ? (
                    <div
                      key={seatedPlayer.id || seatIdx}
                      title={seatedPlayer.name}
                      className="flex items-center gap-1.5 px-2 py-1 bg-[#FAF8F5] border border-[#141414] text-[10px] font-bold text-[#141414]"
                    >
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 border border-[#141414]"
                        style={{ backgroundColor: seatedPlayer.color }}
                      >
                        <TokenSvg tokenId={seatedPlayer.token} className="w-2.5 h-2.5" />
                      </span>
                      <span className="truncate max-w-[78px]">{seatedPlayer.name}</span>
                    </div>
                  ) : (
                    <div
                      key={`empty-${seatIdx}`}
                      className="px-2 py-1 border border-dashed border-[#141414]/35 text-[9px] font-mono font-bold text-[#141414]/40 uppercase"
                    >
                      {lang === 'ro' ? 'Liber' : lang === 'ru' ? 'Свободно' : 'Open'}
                    </div>
                  )
                )}
              </div>

              {/* Bottom Row: Join Button */}
              <div className="flex items-center justify-between pt-1 border-t border-[#141414]/15">
                <span className="text-[9px] font-mono font-bold uppercase text-[#141414]/60">
                  {isLobby ? t(UI_TEXT.openLobbyBadge, lang) : t(UI_TEXT.inProgressBadge, lang)}
                </span>

                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => {
                    onSelectRoom(room.id);
                    onClose?.();
                  }}
                  className={`px-3 py-1 text-[10px] font-serif font-black uppercase tracking-wider border border-[#141414] transition-all ${
                    isCurrent
                      ? 'bg-[#D8E5D7] text-[#141414] cursor-default'
                      : isLobby && !isFull
                      ? 'bg-[#E32626] hover:bg-[#C81E1E] text-white shadow-[2px_2px_0_#141414] cursor-pointer'
                      : 'bg-[#FAF8F5] hover:bg-[#D8E5D7] text-[#141414] cursor-pointer'
                  }`}
                >
                  {isCurrent
                    ? t(UI_TEXT.currentRoomBadge, lang)
                    : t(UI_TEXT.joinRoomBtn, lang)}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Bar: Join by Custom/Private Room Code */}
      <form
        onSubmit={handleJoinByCode}
        className="bg-[#FAF8F5] border-t-2 border-[#141414] px-3 py-2 flex items-center justify-between gap-2"
      >
        <input
          type="text"
          value={customCodeInput}
          onChange={(e) => setCustomCodeInput(e.target.value)}
          placeholder={t(UI_TEXT.joinByCodePlaceholder, lang)}
          className="flex-1 bg-white border border-[#141414] px-2.5 py-1 text-xs font-mono font-bold text-[#141414] focus:outline-none"
        />
        <button
          type="submit"
          className="px-3 py-1 bg-[#141414] text-white text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-[#333333]"
        >
          {t(UI_TEXT.joinRoomBtn, lang)}
        </button>
      </form>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">{content}</div>
    </div>
  );
};
