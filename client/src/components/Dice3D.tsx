import React, { useEffect, useState } from 'react';

interface Dice3DProps {
  dice: [number, number];
  isRollingTrigger: number;
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
      className={`w-11 h-11 sm:w-12 sm:h-12 bg-white border-2 border-[#141414] shadow-[3px_3px_0_#141414] p-1.5 grid grid-cols-3 grid-rows-3 place-items-center transition-transform ${
        rolling
          ? index === 0
            ? 'animate-die-tumble-left'
            : 'animate-die-tumble-right'
          : 'hover:-translate-y-0.5'
      }`}
    >
      {Array.from({ length: 9 }).map((_, cellIdx) => {
        const hasPip = activePips.includes(cellIdx);
        return (
          <span
            key={cellIdx}
            className={`rounded-full ${
              hasPip
                ? 'w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#141414]'
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

    const interval = setInterval(() => {
      setDisplayDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
    }, 60);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setDisplayDice([dice[0] || 1, dice[1] || 1]);
      setRolling(false);
    }, 450);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isRollingTrigger, dice[0], dice[1]]);

  return (
    <div
      onClick={() => {
        if (canRoll && onRollClick && !rolling) {
          onRollClick();
        }
      }}
      className={`inline-flex items-center gap-3 px-2 py-1 ${
        canRoll ? 'cursor-pointer' : ''
      }`}
    >
      <DieFace value={displayDice[0]} rolling={rolling} index={0} />
      <DieFace value={displayDice[1]} rolling={rolling} index={1} />
    </div>
  );
};
