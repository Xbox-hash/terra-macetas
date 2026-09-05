import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Truck, Palette, HeartHandshake } from 'lucide-react';
import { Product, ProductLine } from '../../types';
import { productService } from '../../services/productService';
import { lineService } from '../../services/lineService';
import { ProductCard } from '../../components/public/ProductCard';
import { LineCard } from '../../components/public/LineCard';
import { Button } from '../../components/common/Button';
import { useCompany } from '../../contexts/CompanyContext';

export const HomePage: React.FC = () => {
  const { config } = useCompany();
  const [lines, setLines] = useState<ProductLine[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [linesData, featuredData, allProds] = await Promise.all([
          lineService.getActive(),
          productService.getFeatured(),
          productService.getAll(),
        ]);
        setLines(linesData);
        setFeaturedProducts(featuredData.slice(0, 4));
        setAllProducts(allProds);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getLineProductCount = (lineId: string) => {
    return allProducts.filter((p) => p.lineId === lineId && p.active).length;
  };

  const getLineName = (lineId: string) => {
    return lines.find((l) => l.id === lineId)?.name;
  };

  return (
    <div className="space-y-24 pb-20">
      {/* HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center bg-[#F2EDE4] overflow-hidden pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E4DDD0] text-[#3D4B3E] text-xs font-semibold tracking-wider uppercase animate-in fade-in">
                <Sparkles className="w-3.5 h-3.5 text-[#5A735C]" />
                Colección Nueva Temporada 2026
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-[#222A21] leading-[1.08]">
                Macetas que <br />
                <span className="italic font-normal text-[#4A5D4E]">transforman</span> tus espacios
              </h1>

              <p className="text-base sm:text-lg text-[#5A6757] max-w-xl leading-relaxed font-normal">
                Encontrá el diseño ideal para darle vida a cada rincón. Cerámica de autor, texturas minerales y siluetas contemporáneas pensadas para realzar la belleza natural de tus plantas.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/catalogo">
                  <Button size="lg" className="shadow-md hover:shadow-xl group">
                    Ver catálogo completo
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                </Link>

                <a href="#lineas">
                  <Button variant="secondary" size="lg">
                    Conocer líneas
                  </Button>
                </a>
              </div>

              {/* Value stats banner */}
              <div className="pt-8 border-t border-[#DED7C8] grid grid-cols-3 gap-6 max-w-lg">
                <div>
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#222A21] block">100%</span>
                  <span className="text-xs text-[#6B7968]">Materiales Nobles</span>
                </div>
                <div>
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#222A21] block">+4</span>
                  <span className="text-xs text-[#6B7968]">Líneas de Diseño</span>
                </div>
                <div>
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#222A21] block">WhatsApp</span>
                  <span className="text-xs text-[#6B7968]">Atención Directa</span>
                </div>
              </div>
            </div>

            {/* Right Hero Images - Editorial Collage */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="relative aspect-4/5 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80">
                  <img
                    src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1200&q=85"
                    alt="Colección de Macetas Terra"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <p className="text-xs uppercase tracking-widest text-[#E0EBDC] font-semibold mb-1">
                      Artesanía & Botánica
                    </p>
                    <p className="font-serif text-xl font-medium">Texturas minerales y tonos tierra</p>
                  </div>
                </div>

                {/* Floating mini card */}
                <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-[#EBE5DA] hidden sm:flex items-center gap-3 max-w-xs animate-in slide-in-from-bottom-6">
                  <div className="w-12 h-12 rounded-xl bg-[#F0EBE0] overflow-hidden shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=300&q=80"
                      alt="Maceta Minimalista"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#556957]">Diseño de Autor</span>
                    <p className="text-xs font-semibold text-[#222A21]">Terminaciones a mano</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE LÍNEAS */}
      <section id="lineas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#5E725F] block mb-2">
              Nuestras Colecciones
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#222A21]">
              Líneas pensadas para cada estilo
            </h2>
          </div>
          <p className="text-sm text-[#667464] max-w-md">
            Desde la calidez de la cerámica modelada a torno hasta la sobriedad geométrica nórdica y la durabilidad del hormigón exterior.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {lines.map((line) => (
            <LineCard
              key={line.id}
              line={line}
              productCount={getLineProductCount(line.id)}
            />
          ))}
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#5E725F] block mb-2">
              Selección Exclusiva
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#222A21]">
              Piezas destacadas
            </h2>
          </div>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2D3A2F] hover:text-[#4A5D4E] transition-colors"
          >
            Ver todo el catálogo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              lineName={getLineName(product.lineId)}
            />
          ))}
        </div>
      </section>

      {/* SECCIÓN SOBRE EL NEGOCIO */}
      <section className="bg-[#EFEAE1] py-20 border-y border-[#E2DBD0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 relative order-2 lg:order-1">
              <div className="aspect-4/3 sm:aspect-square rounded-3xl overflow-hidden shadow-xl border border-[#DDD6C8]">
                <img
                  src="https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&w=1000&q=80"
                  alt="Taller de Cerámica y Macetas"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6 text-left order-1 lg:order-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#5E725F] block">
                Nuestra Filosofía
              </span>

              <h2 className="font-serif text-3xl sm:text-5xl font-medium text-[#222A21] leading-tight">
                Amor por la arcilla, el diseño y las plantas vivas
              </h2>

              <p className="text-base sm:text-lg text-[#526050] font-light leading-relaxed">
                En <strong>{config.storeName || 'nuestro taller'}</strong> entendemos que incorporar vegetación en tu hogar u oficina es un ritual de bienestar. Por eso no creamos macetas genéricas: diseñamos piezas con personalidad, peso, textura y proporciones cuidadosamente estudiadas para que tus plantas respiren y luzcan en su máximo esplendor.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="flex gap-3.5 items-start">
                  <div className="p-2.5 rounded-xl bg-[#E2DACB] text-[#2D3A2F] shrink-0">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-base font-semibold text-[#222A21] mb-1">Texturas Únicas</h4>
                    <p className="text-xs text-[#667464] leading-relaxed">
                      Esmaltados mate, arenas y terminaciones táctiles inspiradas en la naturaleza.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="p-2.5 rounded-xl bg-[#E2DACB] text-[#2D3A2F] shrink-0">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-base font-semibold text-[#222A21] mb-1">Asesoría Cálida</h4>
                    <p className="text-xs text-[#667464] leading-relaxed">
                      Atención directa por WhatsApp para elegir el tamaño y drenaje perfecto.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-[#2D3A2F] text-white rounded-3xl p-10 sm:p-16 lg:p-20 overflow-hidden text-center shadow-2xl">
          {/* Subtle background plant graphic element */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-[#3B4C3E]/50 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -top-16 w-80 h-80 rounded-full bg-[#3B4C3E]/50 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C4D1B8] block">
              Explorá la Colección Completa
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
              ¿Listo para darle una nueva energía a tu hogar?
            </h2>
            <p className="text-sm sm:text-base text-[#CAD6C6] leading-relaxed">
              Descubrí todos los modelos, diámetros y acabados disponibles. Hacé tu pedido fácilmente y coordiná la entrega directa por WhatsApp.
            </p>
            <div className="pt-4">
              <Link to="/catalogo">
                <Button size="lg" className="bg-[#FAF8F5] text-[#222A21] hover:bg-white hover:text-black shadow-lg">
                  Ver todas las macetas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
