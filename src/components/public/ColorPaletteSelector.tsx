import React from 'react';
import { ProductColor } from '../../types';
import { Check, Sparkles } from 'lucide-react';

interface ColorPaletteSelectorProps {
  colors: ProductColor[];
  selectedColor: ProductColor;
  onSelectColor: (color: ProductColor) => void;
}

export const ColorPaletteSelector: React.FC<ColorPaletteSelectorProps> = ({
  colors,
  selectedColor,
  onSelectColor,
}) => {
  const [hoveredColor, setHoveredColor] = React.useState<ProductColor | null>(null);
  const activeColor = hoveredColor || selectedColor;

  return (
    <div className="space-y-3.5 pt-2">
      {/* Label and Selected Color Name */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-[#5A6858]">
          Color / Acabado:
        </span>
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs transition-colors duration-200"
            style={{ backgroundColor: activeColor.hex }}
          />
          <span className="font-bold text-[#222A21] text-sm transition-all duration-200">
            {activeColor.name}
          </span>
        </div>
      </div>

      {/* Color Swatches Grid (Similar to Vaso & Cor) */}
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 sm:gap-2.5 p-3 bg-[#F4EFE6] rounded-2xl border border-[#E3DDD1]">
        {colors.map((color) => {
          const isSelected = selectedColor.id === color.id;
          return (
            <button
              key={color.id}
              type="button"
              onClick={() => onSelectColor(color)}
              onMouseEnter={() => setHoveredColor(color)}
              onMouseLeave={() => setHoveredColor(null)}
              title={color.name}
              aria-label={`Seleccionar color ${color.name}`}
              className={`relative aspect-square rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center border ${
                isSelected
                  ? 'ring-2 ring-[#222A21] ring-offset-2 scale-105 shadow-sm border-white/50'
                  : 'border-black/10 hover:scale-105 hover:shadow-xs active:scale-95'
              }`}
              style={{ backgroundColor: color.hex }}
            >
              {isSelected && (
                <span className="p-0.5 rounded-full bg-black/40 text-white backdrop-blur-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Disclaimer Text from Screenshot */}
      <div className="flex items-start gap-1.5 text-[11px] text-[#6E7B6C] leading-tight">
        <Sparkles className="w-3.5 h-3.5 text-[#526654] shrink-0 mt-0.5" />
        <p>
          Por ser un producto artesanal, el tono y textura del acabado pueden presentar leves variaciones naturales.
        </p>
      </div>
    </div>
  );
};
