import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
  size = 'md',
}) => {
  const isSm = size === 'sm';

  return (
    <div className={`inline-flex items-center border border-[#D5CEC2] rounded-xl bg-white/70 backdrop-blur-xs overflow-hidden ${isSm ? 'h-8' : 'h-11'}`}>
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= min}
        className={`flex items-center justify-center text-[#5A6557] hover:text-[#2D3A2F] hover:bg-[#F3EFE7] active:bg-[#EAE4D7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
          isSm ? 'w-8 h-8' : 'w-11 h-11'
        }`}
        aria-label="Disminuir cantidad"
      >
        <Minus className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </button>

      <span className={`flex items-center justify-center font-medium text-[#2D3A2F] select-none text-center ${
        isSm ? 'w-8 text-xs' : 'w-11 text-sm'
      }`}>
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={quantity >= max}
        className={`flex items-center justify-center text-[#5A6557] hover:text-[#2D3A2F] hover:bg-[#F3EFE7] active:bg-[#EAE4D7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
          isSm ? 'w-8 h-8' : 'w-11 h-11'
        }`}
        aria-label="Aumentar cantidad"
      >
        <Plus className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </button>
    </div>
  );
};
