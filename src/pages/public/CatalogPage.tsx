import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Sprout } from 'lucide-react';
import { Product, ProductLine, ProductColor } from '../../types';
import { productService } from '../../services/productService';
import { lineService } from '../../services/lineService';
import { ProductCard } from '../../components/public/ProductCard';
import { OrderBar } from '../../components/public/OrderBar';

const getCachedLines = (): ProductLine[] => {
  try {
    const cached = localStorage.getItem('terra_cached_lines');
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
};

const getCachedProducts = (): Product[] => {
  try {
    const cached = localStorage.getItem('terra_cached_active_products');
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
};

type SortBy = 'featured' | 'price-asc' | 'price-desc' | 'name';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedLineParam = searchParams.get('linea') || 'todas';
  const selectedColorParam = searchParams.get('color') || '';

  const [products, setProducts] = useState<Product[]>(getCachedProducts);
  const [lines, setLines] = useState<ProductLine[]>(getCachedLines);
  const [loading, setLoading] = useState(() => getCachedProducts().length === 0);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('featured');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [linesRes, prodsRes] = await Promise.allSettled([lineService.getActive(), productService.getActive()]);
        if (isMounted) {
          if (linesRes.status === 'fulfilled') {
            const val = linesRes.value || [];
            setLines(val);
            try {
              localStorage.setItem('terra_cached_lines', JSON.stringify(val));
            } catch {}
          }
          if (prodsRes.status === 'fulfilled') {
            const val = prodsRes.value || [];
            setProducts(val);
            try {
              localStorage.setItem('terra_cached_active_products', JSON.stringify(val));
            } catch {}
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const handleLineChange = (lineId: string) => setParam('linea', lineId === 'todas' ? null : lineId);
  const handleColorChange = (colorId: string) => setParam('color', colorId === selectedColorParam ? null : colorId);

  // Colores que tienen las piezas del catálogo, los más usados primero
  const availableColors = useMemo(() => {
    const byId = new Map<string, ProductColor & { count: number }>();
    for (const p of products) {
      for (const c of p.colors ?? []) {
        const prev = byId.get(c.id);
        byId.set(c.id, { ...c, count: (prev?.count ?? 0) + 1 });
      }
    }
    return [...byId.values()].sort((a, b) => b.count - a.count);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products
      .filter((product) => {
        if (selectedLineParam !== 'todas' && product.lineId !== selectedLineParam) return false;
        if (selectedColorParam && !(product.colors ?? []).some((c) => c.id === selectedColorParam)) return false;
        if (q) {
          const colorNames = (product.colors ?? []).map((c) => c.name).join(' ');
          const haystack = `${product.name} ${product.description} ${product.dimensions ?? ''} ${colorNames}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedLineParam, selectedColorParam, searchQuery, sortBy]);

  const linesWithProducts = useMemo(() => {
    return lines.filter((line) => (line.productsCount ?? 0) > 0 || products.some((p) => p.lineId === line.id && p.active));
  }, [lines, products]);

  const activeLineObj = linesWithProducts.find((l) => l.id === selectedLineParam);
  const activeColorObj = availableColors.find((c) => c.id === selectedColorParam);
  const hasFilters = selectedLineParam !== 'todas' || !!selectedColorParam || !!searchQuery.trim();

  // Sin filtros, la primera pieza destacada ocupa el doble
  const bigFirst = !hasFilters && sortBy === 'featured' && !!filteredProducts[0]?.featured && filteredProducts.length >= 4;

  const getLineName = (lineId: string) => lines.find((l) => l.id === lineId)?.name;

  const clearAll = () => {
    setSearchQuery('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const lineLinkClass = (active: boolean) =>
    `relative whitespace-nowrap py-1.5 text-sm transition-colors cursor-pointer after:absolute after:left-0 after:right-0 after:-bottom-px after:h-[1.5px] after:bg-[#222A21] after:origin-left after:transition-transform after:duration-300 ${
      active ? 'text-[#222A21] font-semibold after:scale-x-100' : 'text-[#6F7B6D] hover:text-[#222A21] after:scale-x-0 hover:after:scale-x-100'
    }`;

  return (
    <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-10 sm:py-14 pb-28 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#5E725F] block mb-2">Colección disponible</span>
          <h1 className="font-serif text-4xl sm:text-6xl font-medium text-[#222A21] leading-none">
            {activeLineObj ? activeLineObj.name : 'Catálogo'}
          </h1>
          {activeLineObj?.description && <p className="text-sm sm:text-base text-[#657363] max-w-2xl mt-3">{activeLineObj.description}</p>}
        </div>
        {!loading && (
          <p className="text-sm text-[#6F7B6D] tabular-nums shrink-0">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'pieza' : 'piezas'}
            {hasFilters && ` de ${products.length}`}
          </p>
        )}
      </div>

      {/* Filtros */}
      <div className="border-y border-[#E8E2D6] py-3 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <nav className="flex items-center gap-5 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="Líneas">
            <button type="button" onClick={() => handleLineChange('todas')} className={lineLinkClass(selectedLineParam === 'todas')}>
              Todas
            </button>
            {linesWithProducts.map((line) => (
              <button
                key={line.id}
                type="button"
                onClick={() => handleLineChange(line.id)}
                className={lineLinkClass(selectedLineParam === line.id)}
                aria-current={selectedLineParam === line.id ? 'true' : undefined}
              >
                {line.name}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 lg:w-64">
              <Search className="w-4 h-4 text-[#7A8878] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="catalog-search"
                type="search"
                placeholder="Buscar por nombre, medida o color"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white border border-[#D9D2C5] rounded-xl text-xs text-[#2D3A2F] placeholder-[#8A9588] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
                aria-label="Buscar en el catálogo"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A8878] hover:text-[#2D3A2F]"
                  aria-label="Borrar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <label htmlFor="catalog-sort" className="sr-only">
              Ordenar
            </label>
            <select
              id="catalog-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="text-xs bg-white border border-[#D9D2C5] rounded-xl px-3 py-2 text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F] cursor-pointer"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </div>
        </div>

        {/* Filtro por color */}
        {availableColors.length > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#7D8B7A] shrink-0">Color</span>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-1" role="group" aria-label="Filtrar por color">
              {availableColors.map((c) => {
                const active = c.id === selectedColorParam;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleColorChange(c.id)}
                    aria-pressed={active}
                    aria-label={`${c.name} (${c.count})`}
                    title={`${c.name} · ${c.count} ${c.count === 1 ? 'pieza' : 'piezas'}`}
                    className={`w-6 h-6 rounded-full shrink-0 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D3A2F] focus-visible:ring-offset-2 ${
                      active ? 'ring-2 ring-[#2D3A2F] ring-offset-2 ring-offset-[#FAF8F5] scale-110' : 'ring-1 ring-black/15 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>
            {activeColorObj && (
              <button
                type="button"
                onClick={() => handleColorChange(activeColorObj.id)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D3A2F] bg-[#EDE7DC] rounded-full px-2.5 py-1 shrink-0 hover:bg-[#E2DACB]"
              >
                {activeColorObj.name} <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grilla */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-[#EBE5DA] rounded-2xl aspect-4/5" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#EAE4D7] flex items-center justify-center mx-auto text-[#4A5D4E]">
            <Sprout className="w-8 h-8 opacity-60" />
          </div>
          <h2 className="font-serif text-2xl font-medium text-[#222A21]">No hay piezas con esos filtros</h2>
          <p className="text-xs text-[#6F7B6D] leading-relaxed">Probá con otro color o línea, o mirá todo el catálogo.</p>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold uppercase tracking-wider text-[#2D3A2F] underline hover:text-[#4A5D4E]"
          >
            Ver todo el catálogo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
          {filteredProducts.map((product, i) => {
            const large = bigFirst && i === 0;
            return (
              <div key={product.id} className={large ? 'col-span-2 lg:row-span-2' : ''}>
                <ProductCard
                  product={product}
                  lineName={getLineName(product.lineId)}
                  large={large}
                  preferredColorId={selectedColorParam || undefined}
                  openCartAfterAdd={false}
                />
              </div>
            );
          })}
        </div>
      )}

      <OrderBar />
    </div>
  );
};
