import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductLine } from '../../types';

interface LineCardProps {
  line: ProductLine;
  productCount?: number;
}

export const LineCard: React.FC<LineCardProps> = ({ line, productCount }) => {
  return (
    <Link
      to={`/catalogo?linea=${line.id}`}
      className="group relative h-96 rounded-2xl overflow-hidden block shadow-sm hover:shadow-xl transition-all duration-500 border border-[#E5DFD4]"
    >
      {/* Background Image */}
      <img
        src={line.image}
        alt={line.name}
        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
      />

      {/* Elegant Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1A221B]/90 via-[#1A221B]/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-6 sm:p-7 flex flex-col justify-end text-white">
        <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
          {productCount !== undefined && (
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#CAD9C6] block mb-1">
              {productCount} {productCount === 1 ? 'modelo' : 'modelos'}
            </span>
          )}
          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            {line.name}
          </h3>
          <p className="text-xs sm:text-sm text-stone-200 line-clamp-2 leading-relaxed opacity-90 mb-4 max-w-sm">
            {line.description}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#D4DEC9] group-hover:text-white transition-colors">
          <span>Explorar colección</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
        </div>
      </div>
    </Link>
  );
};
