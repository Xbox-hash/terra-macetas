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
      className="group relative h-96 rounded-2xl overflow-hidden block border border-[#E5DFD4] hover:border-[#3E4E40]/40 card-hover"
    >
      {/* Background Image */}
      <img
        src={line.image}
        alt={line.name}
        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
      />

      {/* Elegant Gradient Overlay with smooth opacity transition */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1A221B]/95 via-[#1A221B]/45 to-transparent transition-opacity duration-500 group-hover:opacity-90" />

      {/* Content */}
      <div className="absolute inset-0 p-6 sm:p-7 flex flex-col justify-end text-white">
        <div className="transform transition-transform duration-500 ease-out group-hover:-translate-y-2">
          {productCount !== undefined && (
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#CAD9C6] block mb-1 transition-colors duration-300 group-hover:text-white">
              {productCount} {productCount === 1 ? 'modelo' : 'modelos'}
            </span>
          )}
          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 transition-transform duration-300">
            {line.name}
          </h3>
          <p className="text-xs sm:text-sm text-stone-200 line-clamp-2 leading-relaxed opacity-90 mb-4 max-w-sm transition-opacity duration-300 group-hover:opacity-100">
            {line.description}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#D4DEC9] group-hover:text-white transition-colors duration-300">
          <span>Explorar colección</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" />
        </div>
      </div>
    </Link>
  );
};
