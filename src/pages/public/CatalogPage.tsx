import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ArrowUpDown, X, Sprout } from 'lucide-react';
import { Product, ProductLine } from '../../types';
import { productService } from '../../services/productService';
import { lineService } from '../../services/lineService';
import { ProductCard } from '../../components/public/ProductCard';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedLineParam = searchParams.get('linea') || 'todas';

  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<ProductLine[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');

  useEffect(() => {
    async function loadData() {
      try {
        const [linesData, prodsData] = await Promise.all([
          lineService.getActive(),
          productService.getActive(),
        ]);
        setLines(linesData);
        setProducts(prodsData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleLineChange = (lineId: string) => {
    if (lineId === 'todas') {
      searchParams.delete('linea');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ linea: lineId });
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Line filter
        if (selectedLineParam !== 'todas' && product.lineId !== selectedLineParam) {
          return false;
        }
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = product.name.toLowerCase().includes(q);
          const matchDesc = product.description.toLowerCase().includes(q);
          if (!matchName && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        // Featured first
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedLineParam, searchQuery, sortBy]);

  const activeLineObj = lines.find((l) => l.id === selectedLineParam);

  const getLineName = (lineId: string) => {
    return lines.find((l) => l.id === lineId)?.name;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Header Banner */}
      <div className="border-b border-[#E8E2D6] pb-8 text-center sm:text-left">
        <span className="text-xs font-bold uppercase tracking-widest text-[#5E725F] block mb-2">
          Colección Disponible
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-medium text-[#222A21] mb-3">
          {activeLineObj ? activeLineObj.name : 'Nuestro Catálogo'}
        </h1>
        <p className="text-sm sm:text-base text-[#657363] max-w-2xl">
          {activeLineObj
            ? activeLineObj.description
            : 'Explorá nuestras piezas exclusivas de cerámica, cemento aligerado y gres. Cada maceta está diseñada para convivir en armonía con tu estilo y la vida de tus plantas.'}
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-4">
        {/* Line Pill Selector (Horizontal Scroll on Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleLineChange('todas')}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
              selectedLineParam === 'todas'
                ? 'bg-[#2D3A2F] text-white shadow-xs'
                : 'bg-[#EDE7DC] text-[#4A5748] hover:bg-[#E2DACB]'
            }`}
          >
            Todas las macetas ({products.length})
          </button>

          {lines.map((line) => {
            const count = products.filter((p) => p.lineId === line.id).length;
            const isSelected = selectedLineParam === line.id;
            return (
              <button
                key={line.id}
                onClick={() => handleLineChange(line.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#2D3A2F] text-white shadow-xs'
                    : 'bg-[#EDE7DC] text-[#4A5748] hover:bg-[#E2DACB]'
                }`}
              >
                {line.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search and Sort Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#7A8878] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, acabado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-[#D9D2C5] rounded-xl text-xs text-[#2D3A2F] placeholder-[#8A9588] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8878] hover:text-[#2D3A2F]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <label className="text-xs text-[#6F7B6D] font-medium flex items-center gap-1.5 whitespace-nowrap">
              <ArrowUpDown className="w-3.5 h-3.5" /> Ordenar por:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-white border border-[#D9D2C5] rounded-xl px-3 py-2 text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F] cursor-pointer"
            >
              <option value="featured">Destacados primero</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="name">Nombre: A a Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Tags */}
      {(selectedLineParam !== 'todas' || searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-[#5A6757] pt-1">
          <span>Filtros activos:</span>
          {selectedLineParam !== 'todas' && (
            <span className="inline-flex items-center gap-1 bg-[#E2DACB] text-[#2D3A2F] px-2.5 py-1 rounded-md font-medium">
              Línea: {activeLineObj?.name}
              <button onClick={() => handleLineChange('todas')} className="hover:text-black">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 bg-[#E2DACB] text-[#2D3A2F] px-2.5 py-1 rounded-md font-medium">
              Búsqueda: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:text-black">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse bg-[#EBE5DA] rounded-2xl aspect-4/5" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#EAE4D7] flex items-center justify-center mx-auto text-[#4A5D4E]">
            <Sprout className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="font-serif text-2xl font-medium text-[#222A21]">
            No encontramos productos con esos filtros
          </h3>
          <p className="text-xs text-[#6F7B6D] leading-relaxed">
            Probá quitando los filtros de búsqueda o explorando todas nuestras líneas disponibles.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              handleLineChange('todas');
            }}
            className="text-xs font-semibold uppercase tracking-wider text-[#2D3A2F] underline hover:text-[#4A5D4E]"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              lineName={getLineName(product.lineId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
