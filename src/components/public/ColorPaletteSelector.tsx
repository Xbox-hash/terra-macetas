import React from 'react';
import { ProductColor } from '../../types';
import { Check, Sparkles, Info } from 'lucide-react';

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
    <div className="space-y-4 pt-2">
      {/* Header: Label and Active Color Badge */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-[#5A6858]">
          Color / Acabado:
        </span>
        <div className="flex items-center gap-2">
          {/* Mini swatch preview */}
          <span
            className="w-4 h-4 rounded-full border border-black/20 shadow-2xs overflow-hidden shrink-0"
            style={{ backgroundColor: activeColor.hex }}
          >
            {activeColor.image && (
              <img
                src={activeColor.image}
                alt={activeColor.name}
                className="w-full h-full object-cover rounded-full"
              />
            )}
          </span>
          <span className="font-bold text-[#222A21] text-sm transition-all duration-200">
            {activeColor.name}
          </span>
        </div>
      </div>

      {/* Grid de Muestras en Formato Circular (rounded-full) */}
      <div className="p-3.5 bg-[#F4EFE6] rounded-2xl border border-[#E3DDD1]">
        <div className="flex flex-wrap gap-2.5 sm:gap-3 items-center">
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
                className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center p-0.5 border ${
                  isSelected
                    ? 'ring-2 ring-[#222A21] ring-offset-2 scale-110 shadow-md border-white'
                    : 'border-black/15 hover:scale-105 hover:shadow-xs active:scale-95'
                }`}
                style={{ backgroundColor: color.hex }}
              >
                {/* Imagen circular de textura real si existe */}
                {color.image ? (
                  <img
                    src={color.image}
                    alt={color.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="w-full h-full rounded-full bg-gradient-to-tr from-black/15 via-transparent to-white/15 block" />
                )}

                {/* Check indicador si está seleccionado */}
                {isSelected && (
                  <span className="absolute inset-0 m-auto w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center shadow-xs backdrop-blur-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nota artesanal */}
      <div className="flex items-start gap-1.5 text-[11px] text-[#6E7B6C] leading-tight">
        <Sparkles className="w-3.5 h-3.5 text-[#526654] shrink-0 mt-0.5" />
        <p>
          Por ser piezas de autor y elaboración manual, el tono y textura del acabado pueden presentar leves variaciones naturales que las hacen únicas.
        </p>
      </div>
    </div>
  );
};
