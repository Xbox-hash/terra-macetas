import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, MessageCircle, Truck, Sparkles, Shield, Check, Info, Clock } from 'lucide-react';
import { Product, ProductLine, ProductColor } from '../../types';
import { productService } from '../../services/productService';
import { lineService } from '../../services/lineService';
import { useCart } from '../../contexts/CartContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../contexts/ToastContext';
import { formatPrice, getWhatsAppUrl } from '../../utils';
import { Button } from '../../components/common/Button';
import { QuantitySelector } from '../../components/common/QuantitySelector';
import { ProductCard } from '../../components/public/ProductCard';
import { ColorPaletteSelector } from '../../components/public/ColorPaletteSelector';
import { DEFAULT_POT_PALETTE } from '../../data/potColors';
import { colorService } from '../../services/colorService';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, openCartDrawer } = useCart();
  const { config } = useCompany();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [line, setLine] = useState<ProductLine | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [productColors, setProductColors] = useState<ProductColor[]>(DEFAULT_POT_PALETTE);
  const [selectedColor, setSelectedColor] = useState<ProductColor>(DEFAULT_POT_PALETTE[0]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [isColorTransitioning, setIsColorTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProductData() {
      if (!id) return;
      setLoading(true);
      try {
        const [prod, allRegisteredColors] = await Promise.all([
          productService.getById(id),
          colorService.getAll(),
        ]);

        if (prod) {
          setProduct(prod);
          setSelectedImageIndex(0);
          setQuantity(1);

          const colorMap = new Map(allRegisteredColors.map((c) => [c.id, c]));
          const baseList =
            prod.colors && prod.colors.length > 0
              ? prod.colors
              : allRegisteredColors.filter((c) => c.active !== false);

          const enriched = baseList.map((c) => {
            const reg = colorMap.get(c.id);
            return {
              ...c,
              description: c.description || reg?.description,
              image: c.image || reg?.image,
            };
          });

          setProductColors(enriched);

          if (enriched.length > 0) {
            setSelectedColor(enriched[0]);
            setActiveImage(enriched[0].image || prod.images[0] || '');
          } else {
            setSelectedColor(DEFAULT_POT_PALETTE[0]);
            setActiveImage(prod.images[0] || '');
          }

          const [lineData, related] = await Promise.all([
            lineService.getById(prod.lineId),
            productService.getRelated(prod.lineId, prod.id, 4),
          ]);
          setLine(lineData || null);
          setRelatedProducts(related);
        } else {
          setProduct(null);
        }
      } finally {
        setLoading(false);
      }
    }
    loadProductData();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-12 h-12 border-3 border-[#2D3A2F]/20 border-t-[#2D3A2F] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-[#5D6B5B]">Cargando detalle de la pieza...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-4">
        <h2 className="font-serif text-3xl font-medium text-[#222A21]">Producto no encontrado</h2>
        <p className="text-sm text-[#6F7D6D]">La maceta que buscas no existe o ha sido descontinuada.</p>
        <Link to="/catalogo">
          <Button variant="primary">Volver al catálogo</Button>
        </Link>
      </div>
    );
  }

  const handleColorChange = (newColor: ProductColor) => {
    if (newColor.id === selectedColor.id) return;
    setIsColorTransitioning(true);
    setSelectedColor(newColor);
    if (newColor.image) {
      setActiveImage(newColor.image);
    } else {
      setActiveImage(product.images[selectedImageIndex] || product.images[0] || '');
    }
    setTimeout(() => {
      setIsColorTransitioning(false);
    }, 350);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedColor.name);
    showToast(`¡Agregaste ${quantity}x "${product.name}" (${selectedColor.name}) al carrito!`);
    openCartDrawer();
  };

  const handleQuickWhatsApp = () => {
    const timeDetail = product.manufacturingTime ? `\n⏳ *Tiempo de fabricación:* ${product.manufacturingTime}` : '';
    const message = `✨ *¡Hola ${config.storeName}!* Me interesa pedir directamente esta pieza:\n\n🏺 *${product.name}*\n🎨 *Color seleccionado:* ${selectedColor.name}${timeDetail}\n   • Cantidad: ${quantity}\n   • Precio unitario: ${formatPrice(product.price)}\n   • Total estimado: ${formatPrice(product.price * quantity)}\n\n¿Tienen disponibilidad y cómo coordinamos la entrega? ¡Muchas gracias!`;
    const targetNumber = config.whatsappNumber?.replace(/\D/g, '') || '595981234567';
    const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-20">
      {/* Breadcrumb / Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#586656] hover:text-[#222A21] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Volver atrás
        </button>
      </div>

      {/* Main Product Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left Column: Big Image & Thumbnails */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Image Container */}
          <div className="relative aspect-4/5 rounded-3xl overflow-hidden bg-[#F1EDE5] border border-[#E6E0D4] shadow-sm group">
            <img
              src={activeImage || selectedColor.image || product.images[selectedImageIndex] || product.images[0]}
              alt={`${product.name} - ${selectedColor.name}`}
              className={`w-full h-full object-cover object-center transition-all duration-500 ease-out ${
                isColorTransitioning ? 'opacity-30 scale-95 blur-[2px]' : 'opacity-100 scale-100 blur-0'
              }`}
            />

            {/* Subtle Dynamic Color Tone Overlay */}
            <div
              className={`absolute inset-0 pointer-events-none mix-blend-color transition-all duration-700 ease-in-out ${
                selectedColor.image && activeImage === selectedColor.image ? 'opacity-0' : 'opacity-35'
              }`}
              style={{ backgroundColor: selectedColor.hex }}
            />

            {product.featured && (
              <span className="absolute top-4 left-4 bg-[#2D3A2F]/90 backdrop-blur-xs text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md z-10">
                Pieza Destacada
              </span>
            )}

            {/* Active Selected Color Pill Badge */}
            <div className="absolute bottom-4 left-4 z-10 bg-[#1E261F]/85 backdrop-blur-md text-white text-xs px-3.5 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-lg">
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-xs"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span className="font-medium text-[11px] sm:text-xs">Color: {selectedColor.name}</span>
            </div>
          </div>

          {/* Gallery Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImageIndex(idx);
                    setActiveImage(img);
                  }}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    activeImage === img
                      ? 'border-[#2D3A2F] scale-95 shadow-md'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            {line && (
              <Link
                to={`/catalogo?linea=${line.id}`}
                className="inline-block text-xs font-bold uppercase tracking-widest text-[#5E725F] hover:underline mb-2"
              >
                {line.name}
              </Link>
            )}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#222A21] leading-tight">
              {product.name}
            </h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-[#222A21]">
                {formatPrice(product.price)}
              </span>
              <span className="text-xs text-[#7B8878] font-medium">IVA incluido</span>
            </div>
          </div>

          <div className="border-t border-[#E8E2D6] pt-6">
            <h3 className="text-xs uppercase font-bold tracking-wider text-[#5A6858] mb-2">
              Descripción
            </h3>
            <p className="text-sm text-[#5B6858] leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Technical Specifications */}
          <div className="bg-[#F3EFE7] rounded-2xl p-4.5 border border-[#E3DDD1] space-y-2.5 text-xs text-[#4A5748]">
            {product.dimensions && (
              <div className="flex justify-between border-b border-[#E7E1D4] pb-2">
                <span className="font-semibold text-[#2D3A2F]">Dimensiones:</span>
                <span>{product.dimensions}</span>
              </div>
            )}
            {product.material && (
              <div className="flex justify-between border-b border-[#E7E1D4] pb-2">
                <span className="font-semibold text-[#2D3A2F]">Material:</span>
                <span className="text-right max-w-xs">{product.material}</span>
              </div>
            )}
            {product.finish && (
              <div className={`flex justify-between ${product.manufacturingTime ? 'border-b border-[#E7E1D4] pb-2' : ''}`}>
                <span className="font-semibold text-[#2D3A2F]">Acabado:</span>
                <span>{product.finish}</span>
              </div>
            )}
            {product.manufacturingTime && (
              <div className="flex justify-between items-center pt-0.5">
                <span className="font-semibold text-[#2D3A2F] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#5A6E59]" />
                  Tiempo de fabricación:
                </span>
                <span className="font-semibold text-[#2E4A32] bg-[#E2EBE2] px-2.5 py-0.5 rounded-full text-[11px]">
                  {product.manufacturingTime}
                </span>
              </div>
            )}
          </div>

          {/* Color Palette Selector (Vaso & Cor inspired) */}
          <ColorPaletteSelector
            colors={productColors}
            selectedColor={selectedColor}
            onSelectColor={handleColorChange}
          />

          {/* Quantity and Actions */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5A6858]">
                Cantidad:
              </span>
              <QuantitySelector
                quantity={quantity}
                onIncrease={() => setQuantity((q) => q + 1)}
                onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1 justify-center shadow-md"
                onClick={handleAddToCart}
                leftIcon={<ShoppingBag className="w-5 h-5" />}
              >
                Agregar al carrito
              </Button>
              <Button
                variant="whatsapp"
                size="lg"
                onClick={handleQuickWhatsApp}
                className="sm:w-auto justify-center"
                title="Pedir directamente esta pieza por WhatsApp"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
              </Button>
            </div>
          </div>

          {/* Quality and design note */}
          <div className="border-t border-[#E8E2D6] pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#637261]">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#4A5D4E] shrink-0" />
              <span>Diseño original de taller</span>
            </div>
            {product.manufacturingTime ? (
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#4A5D4E] shrink-0" />
                <span>Tiempo de producción: {product.manufacturingTime}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#4A5D4E] shrink-0" />
                <span>Embalaje reforzado anti-quiebres</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section className="pt-12 border-t border-[#E5DFD4]">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#5E725F] block mb-1">
                Combiná tu espacio
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#222A21]">
                Otras piezas de la {line?.name || 'colección'}
              </h3>
            </div>
            <Link
              to={`/catalogo?linea=${product.lineId}`}
              className="text-xs font-semibold text-[#2D3A2F] hover:underline"
            >
              Ver más de esta línea →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} lineName={line?.name} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
