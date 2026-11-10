import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, MessageCircle, Truck, Sparkles, Clock, ChevronLeft, ChevronRight, ZoomIn, ExternalLink } from 'lucide-react';
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
import { colorService } from '../../services/colorService';
import { ImageStack } from '../../components/common/ImageStack';
import { InstagramIcon } from '../../components/common/InstagramIcon';
import { Modal } from '../../components/common/Modal';

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
  const [productColors, setProductColors] = useState<ProductColor[]>([]);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  // Foto de detalle abierta en grande (índice) o null si no hay ninguna abierta
  const [zoomedDetail, setZoomedDetail] = useState<number | null>(null);

  // Todas las fotos que puede mostrar la imagen grande: galería + una por color
  const mainImages = useMemo(() => {
    if (!product) return [];
    const all = [...product.images, ...productColors.map((c) => c.image)];
    return Array.from(new Set(all.filter((src): src is string => !!src)));
  }, [product, productColors]);

  const detailPhotos = product?.detailPhotos?.filter((p) => !!p.image) ?? [];

  // Flechas del teclado dentro de la foto de detalle ampliada
  useEffect(() => {
    if (zoomedDetail === null || detailPhotos.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setZoomedDetail((i) => (i === null ? i : (i + 1) % detailPhotos.length));
      if (e.key === 'ArrowLeft') setZoomedDetail((i) => (i === null ? i : (i - 1 + detailPhotos.length) % detailPhotos.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomedDetail, detailPhotos.length]);

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

          // La imagen principal SIEMPRE inicia con la foto real del producto
          const defaultImage = prod.images && prod.images.length > 0 ? prod.images[0] : '';
          setActiveImage(defaultImage);

          // REGLA: Solo mostrar colores si el producto los tiene asignados explícitamente en el admin
          if (prod.colors && prod.colors.length > 0) {
            const enriched = prod.colors.map((c) => {
              const reg = colorMap.get(c.id);
              const validProdImage = c.image && c.image !== 'has-photo' ? c.image : undefined;
              return {
                ...c,
                name: c.name || reg?.name || 'Color',
                hex: c.hex || reg?.hex || '#999999',
                description: c.description || reg?.description,
                image: validProdImage, // Foto real de la maceta en este color
                swatchImage: reg?.image, // Muestra circular de textura para el botón del selector
              };
            });

            setProductColors(enriched);
            setSelectedColor(enriched[0] || null);

            // Si el primer color asignado tiene una foto de producto real, la mostramos; si no, mantenemos defaultImage
            if (enriched[0]?.image) {
              setActiveImage(enriched[0].image);
            }
          } else {
            // El producto NO tiene colores asignados -> No mostrar paleta ni selector
            setProductColors([]);
            setSelectedColor(null);
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
    if (selectedColor && newColor.id === selectedColor.id) return;
    setSelectedColor(newColor);
    if (newColor.image) {
      setActiveImage(newColor.image);
    } else {
      setActiveImage(product.images[selectedImageIndex] || product.images[0] || '');
    }
  };

  const shownImage = activeImage || product.images[selectedImageIndex] || product.images[0] || '';
  const activeMainIndex = Math.max(0, mainImages.indexOf(shownImage));

  const handleAddToCart = () => {
    const colorToSave = productColors.length > 0 && selectedColor ? selectedColor.name : undefined;
    addToCart(product, quantity, colorToSave);
    const colorLabel = colorToSave ? ` (${colorToSave})` : '';
    showToast(`¡Agregaste ${quantity}x "${product.name}"${colorLabel} al pedido!`);
    openCartDrawer();
  };

  const handleQuickWhatsApp = () => {
    const timeDetail = product.manufacturingTime ? `\n⏳ *Tiempo de fabricación:* ${product.manufacturingTime}` : '';
    const colorDetail = productColors.length > 0 && selectedColor ? `\n🎨 *Color seleccionado:* ${selectedColor.name}` : '';
    const message = `✨ *¡Hola ${config.storeName}!* Me interesa pedir directamente esta pieza:\n\n🏺 *${product.name}*${colorDetail}${timeDetail}\n   • Cantidad: ${quantity}\n   • Precio unitario: ${formatPrice(product.price)}\n   • Total estimado: ${formatPrice(product.price * quantity)}\n\n¿Tienen disponibilidad y cómo coordinamos la entrega? ¡Muchas gracias!`;
    const targetNumber = config.whatsappNumber?.replace(/\D/g, '') || '595981234567';
    const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-8 sm:py-14 space-y-20">
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
            <ImageStack
              images={mainImages.length > 0 ? mainImages : [shownImage]}
              activeIndex={activeMainIndex}
              alt={`${product.name}${selectedColor ? ` - ${selectedColor.name}` : ''}`}
              fadeMs={650}
              eager
            />

            {product.featured && (
              <span className="absolute top-4 left-4 bg-[#2D3A2F]/90 backdrop-blur-xs text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md z-10">
                Pieza Destacada
              </span>
            )}

            {/* Active Selected Color Pill Badge */}
            {productColors.length > 0 && selectedColor && (
              <div
                key={selectedColor.id}
                className="absolute bottom-4 left-4 z-10 bg-[#1E261F]/85 backdrop-blur-md text-white text-xs px-3.5 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-lg animate-fade-in"
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-xs"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                <span className="font-medium text-[11px] sm:text-xs">Color: {selectedColor.name}</span>
              </div>
            )}
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

          {/* Pedido del cliente: link a la publicación con la foto real de la maceta */}
          {product.instagramUrl && (
            <a
              href={product.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group/ig flex items-center gap-3.5 rounded-2xl border border-[#E3DDD1] bg-white p-3.5 pr-4 hover:border-[#C13584]/40 hover:shadow-md transition-all duration-300"
            >
              <span className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white bg-[linear-gradient(45deg,#F58529,#DD2A7B_50%,#8134AF)] transition-transform duration-300 group-hover/ig:scale-110 group-hover/ig:-rotate-6">
                <InstagramIcon className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-[#222A21]">Ver la foto real en Instagram</span>
                <span className="block text-[11px] text-[#6F7B6D]">Así se ve esta maceta terminada, sin edición</span>
              </span>
              <ExternalLink className="w-4 h-4 text-[#8C988A] shrink-0 transition-transform duration-300 group-hover/ig:translate-x-0.5 group-hover/ig:-translate-y-0.5" />
            </a>
          )}

          {/* Color Palette Selector */}
          {productColors.length > 0 && selectedColor && (
            <ColorPaletteSelector
              colors={productColors}
              selectedColor={selectedColor}
              onSelectColor={handleColorChange}
            />
          )}

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
                Agregar pedido
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

          {/* Pedido del cliente: hasta 4 fotos de detalle (impermeabilización, patitas, acabado...) */}
          {detailPhotos.length > 0 && (
            <div className="border-t border-[#E8E2D6] pt-6">
              <h3 className="text-xs uppercase font-bold tracking-wider text-[#5A6858] mb-3">
                Detalles de la pieza
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {detailPhotos.map((photo, idx) => (
                  <button
                    key={photo.image}
                    type="button"
                    onClick={() => setZoomedDetail(idx)}
                    className="group/detail relative aspect-square rounded-2xl overflow-hidden bg-[#F1EDE5] border border-[#E6E0D4] cursor-zoom-in text-left animate-fade-in-up"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <img
                      src={photo.image}
                      alt={photo.caption || `Detalle ${idx + 1} de ${product.name}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/detail:scale-110"
                    />
                    <span className="absolute top-2 right-2 p-1.5 rounded-full bg-white/85 text-[#2D3A2F] opacity-0 group-hover/detail:opacity-100 transition-opacity duration-300">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </span>
                    {photo.caption && (
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pt-6 pb-2.5 text-[11px] sm:text-xs font-semibold text-white leading-snug">
                        {photo.caption}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Foto de detalle ampliada */}
      <Modal
        isOpen={zoomedDetail !== null}
        onClose={() => setZoomedDetail(null)}
        title={zoomedDetail !== null ? detailPhotos[zoomedDetail]?.caption || 'Detalle de la pieza' : undefined}
        maxWidth="2xl"
      >
        {zoomedDetail !== null && detailPhotos[zoomedDetail] && (
          <div className="relative -m-6">
            <img
              key={detailPhotos[zoomedDetail].image}
              src={detailPhotos[zoomedDetail].image}
              alt={detailPhotos[zoomedDetail].caption || 'Detalle de la pieza'}
              className="w-full max-h-[75vh] object-contain bg-[#1C221D] animate-fade-in"
            />
            {detailPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Foto anterior"
                  onClick={() => setZoomedDetail((zoomedDetail - 1 + detailPhotos.length) % detailPhotos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-[#2D3A2F] shadow-md hover:bg-white cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Foto siguiente"
                  onClick={() => setZoomedDetail((zoomedDetail + 1) % detailPhotos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 text-[#2D3A2F] shadow-md hover:bg-white cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        )}
      </Modal>

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
