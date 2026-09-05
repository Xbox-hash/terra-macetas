import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, MessageCircle, Truck, Sparkles, Shield, Check, Info } from 'lucide-react';
import { Product, ProductLine } from '../../types';
import { productService } from '../../services/productService';
import { lineService } from '../../services/lineService';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { formatPrice, getWhatsAppUrl } from '../../utils';
import { Button } from '../../components/common/Button';
import { QuantitySelector } from '../../components/common/QuantitySelector';
import { ProductCard } from '../../components/public/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, openCartDrawer } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [line, setLine] = useState<ProductLine | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProductData() {
      if (!id) return;
      setLoading(true);
      try {
        const prod = await productService.getById(id);
        if (prod) {
          setProduct(prod);
          setSelectedImageIndex(0);
          setQuantity(1);

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

  const handleAddToCart = () => {
    addToCart(product, quantity);
    showToast(`¡Agregaste ${quantity}x "${product.name}" al carrito!`);
    openCartDrawer();
  };

  const handleQuickWhatsApp = () => {
    const singleItem = [{ product, quantity, subtotal: product.price * quantity }];
    const url = getWhatsAppUrl(singleItem, product.price * quantity, `Hola, me interesa pedir específicamente esta maceta: ${product.name}`);
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
          <div className="relative aspect-4/5 rounded-3xl overflow-hidden bg-[#F1EDE5] border border-[#E6E0D4] shadow-sm">
            <img
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-all duration-500"
            />

            {product.featured && (
              <span className="absolute top-4 left-4 bg-[#2D3A2F]/90 backdrop-blur-xs text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                Pieza Destacada
              </span>
            )}
          </div>

          {/* Gallery Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    selectedImageIndex === idx
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
              <div className="flex justify-between">
                <span className="font-semibold text-[#2D3A2F]">Acabado:</span>
                <span>{product.finish}</span>
              </div>
            )}
          </div>

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

          {/* Botanical guarantee note */}
          <div className="border-t border-[#E8E2D6] pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#637261]">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#4A5D4E] shrink-0" />
              <span>Diseño original de taller</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-[#4A5D4E] shrink-0" />
              <span>Embalaje reforzado anti-quiebres</span>
            </div>
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
