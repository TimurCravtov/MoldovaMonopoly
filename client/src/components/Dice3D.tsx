import React, { useEffect, useState } from 'react';

interface Dice3DProps {
  dice: [number, number];
  isRollingTrigger: number; // increments whenever a roll happens
  onRollClick?: () => void;
  canRoll?: boolean;
}

const PIP_POSITIONS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const DieFace: React.FC<{ value: number; rolling: boolean; index: number }> = ({
  value,
  rolling,
  index,
}) => {
  const safeVal = value >= 1 && value <= 6 ? value : 1;
  const activePips = PIP_POSITIONS[safeVal] || [4];

  return (
    <div
      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#FAF6EE] border-2 border-[#C8B99E] shadow-[0_6px_0_#9E8C6C,0_10px_20px_rgba(0,0,0,0.35)] p-2 grid grid-cols-3 grid-rows-3 place-items-center transition-transform duration-300 ${
        rolling
          ? index === 0
            ? 'animate-die-tumble-left'
            : 'animate-die-tumble-right'
          : 'hover:-translate-y-0.5'
      }`}
    >
      {Array.from({ length: 9 }).map((_, cellIdx) => {
        const hasPip = activePips.includes(cellIdx);
        const isCenterAce = safeVal === 1 && cellIdx === 4;
        return (
          <span
            key={cellIdx}
            className={`rounded-full transition-all duration-150 ${
              hasPip
                ? isCenterAce
                  ? 'w-3 h-3 bg-[#8B1E24] shadow-inner'
                  : 'w-2.2 h-2.2 sm:w-2.5 sm:h-2.5 bg-[#1E1B18] shadow-inner'
                : 'w-0 h-0 opacity-0'
            }`}
          />
        );
      })}
    </div>
  );
};

export const Dice3D: React.FC<Dice3DProps> = ({
  dice,
  isRollingTrigger,
  onRollClick,
  canRoll,
}) => {
  const [rolling, setRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState<[number, number]>([
    dice[0] || 1,
    dice[1] || 6,
  ]);

  useEffect(() => {
    if (isRollingTrigger === 0 && dice[0] === 0) return;
    setRolling(true);

    // Rapidly cycle random faces while tumbling
    const interval = setInterval(() => {
      setDisplayDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
    }, 65);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setDisplayDice([dice[0] || 1, dice[1] || 1]);
      setRolling(false);
    }, 520);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isRollingTrigger, dice[0], dice[1]]);

  const isDoubles = !rolling && dice[0] > 0 && dice[0] === dice[1];

  return (
    <div
      onClick={() => {
        if (canRoll && onRollClick && !rolling) {
          onRollClick();
        }
      }}
      className={`inline-flex items-center gap-3.5 px-4 py-2.5 rounded-2xl transition ${
        canRoll
          ? 'cursor-pointer bg-[#231915]/70 hover:bg-[#2E201B]/90 ring-1 ring-[#C59B27]/50'
          : 'bg-[#1A1310]/50'
      } ${isDoubles ? 'ring-2 ring-[#C59B27]' : ''}`}
    >
      <DieFace value={displayDice[0]} rolling={rolling} index={0} />
      <DieFace value={displayDice[1]} rolling={rolling} index={1} />
    </div>
  );
};
