import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, Power, Search, Filter, Sparkles, X, Package, Check, Palette, Camera, UploadCloud, ArrowLeft, Save, Eye } from 'lucide-react';
import { Product, ProductLine, ProductColor } from '../../types';
import { productService } from '../../services/productService';
import { lineService } from '../../services/lineService';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { FormInput } from '../../components/common/FormInput';
import { ImageUploader } from '../../components/common/ImageUploader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatPrice } from '../../utils';
import { useToast } from '../../contexts/ToastContext';
import { DEFAULT_POT_PALETTE } from '../../data/potColors';

export const ProductsAdminPage: React.FC = () => {
  const { openMobileSidebar } = useOutletContext<{ openMobileSidebar: () => void }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<ProductLine[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLineFilter, setSelectedLineFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Full-page Form view state ('list' | 'form')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    lineId: '',
    description: '',
    price: 0,
    images: [] as string[],
    dimensions: '',
    material: '',
    finish: '',
    colors: [] as ProductColor[],
    active: true,
    featured: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeColorPhotoId, setActiveColorPhotoId] = useState<string | null>(null);
  const [tempUrlMap, setTempUrlMap] = useState<Record<string, string>>({});

  const handleSetColorImage = (colorId: string, imageUrl?: string) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.map((c) =>
        c.id === colorId ? { ...c, image: imageUrl || undefined } : c
      ),
    }));
  };

  const handleColorFileUpload = (colorId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const base64 = loadEvent.target?.result as string;
      if (base64) {
        handleSetColorImage(colorId, base64);
        setActiveColorPhotoId(null);
        showToast('Foto asignada al color seleccionado.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Check if edit parameter was passed in url query
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && products.length > 0) {
      const prodToEdit = products.find((p) => p.id === editId);
      if (prodToEdit) {
        handleOpenEdit(prodToEdit);
        searchParams.delete('edit');
        setSearchParams(searchParams);
      }
    }
  }, [products, searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsData, linesData] = await Promise.all([
        productService.getAll(),
        lineService.getAll(),
      ]);
      setProducts(prodsData);
      setLines(linesData);
      if (linesData.length > 0 && !formData.lineId) {
        setFormData((prev) => ({ ...prev, lineId: linesData[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedLineFilter !== 'all' && p.lineId !== selectedLineFilter) return false;
      if (selectedStatusFilter === 'active' && !p.active) return false;
      if (selectedStatusFilter === 'inactive' && p.active) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [products, selectedLineFilter, selectedStatusFilter, searchQuery]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      lineId: lines[0]?.id || '',
      description: '',
      price: 50000,
      images: [
        'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1000&q=80',
      ],
      dimensions: 'Ø 20 cm x Alto 22 cm',
      material: 'Cerámica cocida de taller',
      finish: 'Mate artesanal',
      colors: [],
      active: true,
      featured: false,
    });
    setActiveColorPhotoId(null);
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      lineId: prod.lineId,
      description: prod.description,
      price: prod.price,
      images: prod.images || [],
      dimensions: prod.dimensions || '',
      material: prod.material || '',
      finish: prod.finish || '',
      colors: prod.colors || [],
      active: prod.active,
      featured: !!prod.featured,
    });
    setActiveColorPhotoId(null);
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price <= 0) {
      showToast('Por favor completa el nombre y un precio válido.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const payload = {
        name: formData.name,
        slug,
        lineId: formData.lineId,
        description: formData.description,
        price: Number(formData.price),
        images: formData.images.length > 0 ? formData.images : ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1000&q=80'],
        dimensions: formData.dimensions,
        material: formData.material,
        finish: formData.finish,
        colors: formData.colors,
        active: formData.active,
        featured: formData.featured,
      };

      if (editingProduct) {
        await productService.update(editingProduct.id, payload);
        showToast(`Producto "${formData.name}" actualizado.`);
      } else {
        await productService.create(payload);
        showToast(`Nuevo producto "${formData.name}" creado.`);
      }

      setViewMode('list');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar producto', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (prod: Product) => {
    try {
      await productService.toggleActive(prod.id);
      showToast(`Estado de "${prod.name}" modificado.`);
      loadData();
    } catch (err: any) {
      showToast('Error al modificar estado', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await productService.delete(deleteTarget.id);
      showToast(`Producto "${deleteTarget.name}" eliminado.`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      showToast('Error al eliminar producto', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getLineName = (lineId: string) => {
    return lines.find((l) => l.id === lineId)?.name || 'Sin línea';
  };

  // FULL-PAGE CREATE / EDIT VIEW
  if (viewMode === 'form') {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#F7F5F0]">
        <AdminHeader
          title={editingProduct ? `Editar Producto: ${editingProduct.name}` : 'Crear Nuevo Producto'}
          subtitle={
            editingProduct
              ? 'Modifica las características, paleta de colores y fotografías de este modelo'
              : 'Completa las especificaciones para publicar una nueva maceta en el catálogo'
          }
          onOpenMobileSidebar={openMobileSidebar}
          actions={
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setViewMode('list');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Volver al listado
              </Button>
              <Button
                type="submit"
                form="product-full-form"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {editingProduct ? 'Guardar Cambios' : 'Publicar Producto'}
              </Button>
            </div>
          }
        />

        <main className="flex-1 px-4 sm:px-8 py-6 w-full pb-24">
          <form id="product-full-form" onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Columna Izquierda: Datos principales, Colores & Fotos, Ficha técnica */}
              <div className="lg:col-span-8 space-y-6">

                {/* CARD 1: INFORMACIÓN PRINCIPAL */}
                <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E5DFD4] shadow-xs space-y-5">
                  <div className="border-b border-[#F0EBE1] pb-3 flex items-center justify-between">
                    <h3 className="font-serif text-base font-bold text-[#222A21] flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#4A5D4E]" />
                      Información Básica del Producto
                    </h3>
                    <span className="text-[11px] text-[#7F8D7E]">* Campos requeridos</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormInput
                      label="Nombre del modelo"
                      required
                      placeholder="Ej: Maceta Roma Terracota"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />

                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
                        Línea de diseño
                      </label>
                      <select
                        required
                        value={formData.lineId}
                        onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
                      >
                        {lines.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <FormInput
                      label="Precio de Venta (Guaraníes ₲)"
                      type="number"
                      required
                      min={1000}
                      step={1000}
                      placeholder="85000"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
                      Descripción artesanal
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Describí para qué plantas es ideal, detalles de drenaje, estilo de cocción y estética..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
                    />
                  </div>
                </div>

                {/* CARD 2: PALETA DE COLORES Y FOTOS POR COLOR (AMPLIA Y CÓMODA) */}
                <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E5DFD4] shadow-xs space-y-6">
                  <div className="border-b border-[#F0EBE1] pb-3 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-serif text-base font-bold text-[#222A21] flex items-center gap-2">
                        <Palette className="w-4 h-4 text-[#4A5D4E]" />
                        Colores de Fabricación y Variantes ({formData.colors.length} seleccionados)
                      </h3>
                      <p className="text-xs text-[#6E7B6C] mt-0.5">
                        Selecciona los colores en que se produce esta maceta. Si subes fotos individuales, la tienda cambiará a esa foto al seleccionarlo.
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, colors: [...DEFAULT_POT_PALETTE] })}
                        className="text-xs font-semibold text-[#4A5D4E] hover:underline cursor-pointer bg-[#F2EFE8] px-2.5 py-1 rounded-lg"
                      >
                        Marcar todos (17)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, colors: [] })}
                        className="text-xs font-semibold text-[#8C988A] hover:underline cursor-pointer bg-[#F2EFE8] px-2.5 py-1 rounded-lg"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>

                  {/* Grid grande de selección de colores */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3">
                    {DEFAULT_POT_PALETTE.map((color) => {
                      const isSelected = formData.colors.some((c) => c.id === color.id);
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFormData({
                                ...formData,
                                colors: formData.colors.filter((c) => c.id !== color.id),
                              });
                            } else {
                              setFormData({
                                ...formData,
                                colors: [...formData.colors, color],
                              });
                            }
                          }}
                          className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#F5F2EB] border-[#2D3A2F] ring-2 ring-[#2D3A2F] shadow-sm'
                              : 'bg-white border-[#E7E1D4] opacity-60 hover:opacity-100 hover:border-[#2D3A2F]/40'
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-full border border-black/20 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
                            style={{ backgroundColor: color.hex }}
                          >
                            {isSelected && (
                              <span className="p-0.5 rounded-full bg-black/50 text-white backdrop-blur-xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-[#2D3A2F] text-center leading-tight line-clamp-1">
                            {color.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Subpanel de Fotos por cada color seleccionado */}
                  {formData.colors.length === 0 ? (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                      💡 Si no seleccionas colores específicos, se habilitará la paleta completa con tonos artesanales dinámicos.
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-[#F0EBE1] space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#475446] flex items-center gap-2">
                            <Camera className="w-4 h-4 text-[#4A5D4E]" />
                            Asignación de Fotografías por Variante de Color
                          </h4>
                          <p className="text-xs text-[#6E7B6C] mt-0.5">
                            Para cada color, podés adjuntar la foto real de la maceta. El comprador la verá de inmediato al hacer clic en ese color.
                          </p>
                        </div>
                        <span className="text-xs font-bold text-[#3C6E3D] bg-[#E5F2E6] px-2.5 py-1 rounded-full shrink-0">
                          {formData.colors.filter((c) => !!c.image).length} de {formData.colors.length} con foto
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                        {formData.colors.map((color) => {
                          const isConfiguring = activeColorPhotoId === color.id;
                          return (
                            <div
                              key={color.id}
                              className={`p-3.5 rounded-2xl border transition-all ${
                                isConfiguring
                                  ? 'bg-white border-[#2D3A2F] ring-2 ring-[#2D3A2F]/20 shadow-md'
                                  : color.image
                                  ? 'bg-[#FCFBF8] border-[#BCD4BE]'
                                  : 'bg-[#FAF8F5] border-[#E5DFD4]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span
                                    className="w-6 h-6 rounded-full border border-black/20 shrink-0 shadow-xs"
                                    style={{ backgroundColor: color.hex }}
                                  />
                                  <div className="truncate">
                                    <span className="text-xs font-bold text-[#2D3A2F] block truncate">
                                      {color.name}
                                    </span>
                                    <span className="text-[11px] text-[#7A8878]">
                                      {color.image ? 'Foto real asignada' : 'Tono cerámico interactivo'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {color.image ? (
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={color.image}
                                        alt={color.name}
                                        className="w-11 h-11 rounded-xl object-cover border border-[#D5CEC2] shadow-2xs"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setActiveColorPhotoId(isConfiguring ? null : color.id)}
                                        className="text-xs font-semibold text-[#4A5D4E] hover:underline cursor-pointer"
                                      >
                                        {isConfiguring ? 'Cerrar' : 'Cambiar'}
                                      </button>
                                      <button
                                        type="button"
                                        title="Quitar foto"
                                        onClick={() => handleSetColorImage(color.id, undefined)}
                                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setActiveColorPhotoId(isConfiguring ? null : color.id)}
                                      className="text-xs font-semibold text-[#2D3A2F] bg-white hover:bg-[#EAE4D7] border border-[#D9D3C7] px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Camera className="w-3.5 h-3.5 text-[#4A5D4E]" />
                                      {isConfiguring ? 'Cancelar' : 'Asignar foto'}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Panel Desplegable para Asignar Foto */}
                              {isConfiguring && (
                                <div className="mt-3 pt-3 border-t border-[#EFECE6] space-y-3 text-left">
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs font-medium bg-[#2D3A2F] hover:bg-[#3D4D3F] text-white px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xs">
                                      <UploadCloud className="w-4 h-4" />
                                      <span>Subir archivo desde mi PC</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleColorFileUpload(color.id, e)}
                                      />
                                    </label>
                                  </div>

                                  {formData.images.length > 0 && (
                                    <div className="space-y-1.5">
                                      <span className="text-[11px] font-medium text-[#768474] block">
                                        O seleccionar de las fotos cargadas en este producto:
                                      </span>
                                      <div className="flex gap-2 overflow-x-auto py-1">
                                        {formData.images.map((imgUrl, imgIdx) => (
                                          <button
                                            key={imgIdx}
                                            type="button"
                                            onClick={() => {
                                              handleSetColorImage(color.id, imgUrl);
                                              setActiveColorPhotoId(null);
                                            }}
                                            className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                                              color.image === imgUrl
                                                ? 'border-[#2D3A2F] ring-2 ring-[#2D3A2F]'
                                                : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
                                            }`}
                                          >
                                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="space-y-1">
                                    <span className="text-[11px] font-medium text-[#768474] block">
                                      O pegar enlace web directo:
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="url"
                                        placeholder="https://images.unsplash.com/..."
                                        value={tempUrlMap[color.id] || ''}
                                        onChange={(e) =>
                                          setTempUrlMap({ ...tempUrlMap, [color.id]: e.target.value })
                                        }
                                        className="w-full px-3 py-1.5 text-xs bg-white border border-[#D9D3C7] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#2D3A2F]"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const url = tempUrlMap[color.id]?.trim();
                                          if (url) {
                                            handleSetColorImage(color.id, url);
                                            setActiveColorPhotoId(null);
                                          }
                                        }}
                                        className="text-xs px-3 py-1.5 shrink-0"
                                      >
                                        Asignar
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD 3: ESPECIFICACIONES TÉCNICAS */}
                <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E5DFD4] shadow-xs space-y-5">
                  <div className="border-b border-[#F0EBE1] pb-3">
                    <h3 className="font-serif text-base font-bold text-[#222A21]">
                      Ficha Técnica y Dimensiones (Opcional)
                    </h3>
                    <p className="text-xs text-[#6E7B6C] mt-0.5">
                      Detalles constructivos que se muestran en la pestaña de especificaciones en la tienda.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <FormInput
                      label="Dimensiones"
                      placeholder="Ej: Ø 24 cm x Alto 28 cm"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    />

                    <FormInput
                      label="Material de fabricación"
                      placeholder="Ej: Cerámica refractaria"
                      value={formData.material}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    />

                    <FormInput
                      label="Acabado y textura"
                      placeholder="Ej: Esmalte satinado al horno"
                      value={formData.finish}
                      onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                    />
                  </div>
                </div>

              </div>

              {/* Columna Derecha: Galería Principal, Toggles y Live Preview */}
              <div className="lg:col-span-4 space-y-6">

                {/* CARD FOTOGRAFÍAS GENERALES */}
                <div className="bg-white p-6 rounded-2xl border border-[#E5DFD4] shadow-xs space-y-4">
                  <div className="border-b border-[#F0EBE1] pb-3">
                    <h3 className="font-serif text-base font-bold text-[#222A21] flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#4A5D4E]" />
                      Galería Principal (Hasta 4 fotos)
                    </h3>
                    <p className="text-xs text-[#6E7B6C] mt-0.5">
                      Vistas generales para el catálogo y el carrusel de imágenes.
                    </p>
                  </div>

                  <ImageUploader
                    maxImages={4}
                    value={formData.images}
                    onChange={(imgs) => setFormData({ ...formData, images: imgs })}
                  />
                </div>

                {/* CARD VISIBILIDAD & ESTADO */}
                <div className="bg-white p-6 rounded-2xl border border-[#E5DFD4] shadow-xs space-y-4">
                  <h3 className="font-serif text-base font-bold text-[#222A21] border-b border-[#F0EBE1] pb-3">
                    Visibilidad en la Tienda
                  </h3>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] cursor-pointer hover:bg-[#F4EFE6] transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-4 h-4 rounded text-[#2D3A2F] focus:ring-[#2D3A2F] border-[#D9D3C7]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#2D3A2F] block">Producto Activo</span>
                        <span className="text-[11px] text-[#6E7B6C]">Visible para compra y consulta en el catálogo</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] cursor-pointer hover:bg-[#F4EFE6] transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="w-4 h-4 rounded text-[#2D3A2F] focus:ring-[#2D3A2F] border-[#D9D3C7]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#2D3A2F] block">⭐ Destacar en Home</span>
                        <span className="text-[11px] text-[#6E7B6C]">Aparece en la sección destacada de la portada</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* CARD VISTA PREVIA EN VIVO */}
                <div className="bg-white p-6 rounded-2xl border border-[#E5DFD4] shadow-xs space-y-3">
                  <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#475446] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#4A5D4E]" />
                    Vista Previa en Tienda
                  </h3>

                  <div className="rounded-2xl overflow-hidden border border-[#E5DFD4] bg-[#FAF8F5]">
                    <div className="aspect-4/3 relative bg-[#ECE7DC]">
                      <img
                        src={formData.images[0] || 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1000&q=80'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {formData.featured && (
                        <span className="absolute top-2 left-2 bg-[#2D3A2F]/90 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                          Destacado
                        </span>
                      )}
                    </div>
                    <div className="p-4 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#556353]">
                        {lines.find((l) => l.id === formData.lineId)?.name || 'Línea de diseño'}
                      </span>
                      <h4 className="font-serif text-sm font-bold text-[#222A21] line-clamp-1">
                        {formData.name || 'Nombre del Producto'}
                      </h4>
                      <p className="text-sm font-bold text-[#2D3A2F]">
                        {formatPrice(formData.price || 0)}
                      </p>
                      {formData.colors.length > 0 && (
                        <div className="flex items-center gap-1 pt-1">
                          {formData.colors.slice(0, 6).map((c) => (
                            <span
                              key={c.id}
                              className="w-3.5 h-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            />
                          ))}
                          {formData.colors.length > 6 && (
                            <span className="text-[10px] text-[#7A8878] font-medium">
                              +{formData.colors.length - 6}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ACCIONES INFERIORES LATERALES */}
                <div className="pt-2 flex flex-col gap-2.5">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                    isLoading={isSubmitting}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    {editingProduct ? 'Guardar Cambios' : 'Publicar Producto'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    className="w-full justify-center"
                    onClick={() => {
                      setViewMode('list');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Cancelar y Volver
                  </Button>
                </div>

              </div>
            </div>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Catálogo de Productos"
        subtitle="Administrá piezas, precios, fotografías y visibilidad en tienda"
        onOpenMobileSidebar={openMobileSidebar}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo Producto
          </Button>
        }
      />

      <main className="flex-1 px-4 sm:px-8 py-6 space-y-6 w-full">
        {/* Filters Toolbar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5DFD4] shadow-xs space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-[#7A8878] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar maceta por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-[#FAF8F5] border border-[#D9D2C5] rounded-xl text-sm text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8878] hover:text-[#2D3A2F]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Select filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-[#5D6B5C]">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Línea:</span>
              <select
                value={selectedLineFilter}
                onChange={(e) => setSelectedLineFilter(e.target.value)}
                className="text-sm bg-[#FAF8F5] border border-[#D9D2C5] rounded-xl px-3 py-2 text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              >
                <option value="all">Todas las líneas ({products.length})</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#5D6B5C]">
              <span className="font-medium">Estado:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-sm bg-[#FAF8F5] border border-[#D9D2C5] rounded-xl px-3 py-2 text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-[#E5DFD4] shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-[#EFE9DE] flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#222A21]">Listado de Modelos</h2>
              <p className="text-xs text-[#6F7B6D] mt-0.5">Mostrando {filteredProducts.length} productos en catálogo</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#2D3A2F]">
              <thead className="bg-[#F8F5EE] text-[#475546] uppercase text-xs font-bold tracking-wider border-b border-[#EFE9DE]">
                <tr>
                  <th className="px-6 py-4">Imagen</th>
                  <th className="px-6 py-4">Producto y Variantes</th>
                  <th className="px-6 py-4">Línea de Diseño</th>
                  <th className="px-6 py-4">Precio de Venta</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE2]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-[#7E8B7D]">
                      Cargando productos...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-[#7E8B7D]">
                      No hay productos que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="px-6 py-4">
                        <img
                          src={product.images[0] || 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1000&q=80'}
                          alt={product.name}
                          className="w-16 h-16 rounded-xl object-cover bg-[#F0ECE4] border border-[#E8E2D7] shadow-2xs"
                        />
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <span className="font-bold text-base text-[#222A21] block leading-snug">{product.name}</span>
                        {product.colors && product.colors.length > 0 ? (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <div className="flex -space-x-1">
                              {product.colors.slice(0, 6).map((c) => (
                                <span
                                  key={c.id}
                                  className="w-4 h-4 rounded-full border border-white shadow-2xs inline-block"
                                  style={{ backgroundColor: c.hex }}
                                  title={c.name}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-[#768474] font-medium ml-1">
                              {product.colors.length} {product.colors.length === 1 ? 'color' : 'colores'}
                            </span>
                            {product.colors.some((c) => !!c.image) && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#3C6E3D] bg-[#E3F2E4] px-2 py-0.5 rounded-full"
                                title="Tiene fotos asignadas por color"
                              >
                                <Camera className="w-3 h-3" /> con fotos
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#8C988A] block mt-1">Paleta completa</span>
                        )}
                        {product.featured && (
                          <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full inline-block mt-1.5">
                            ⭐ Destacado en Home
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[#4A5749]">{getLineName(product.lineId)}</td>
                      <td className="px-6 py-4 font-bold text-base text-[#222A21]">{formatPrice(product.price)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge active={product.active} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(product)}
                            className="p-2 rounded-xl text-[#556353] hover:text-[#222A21] hover:bg-[#EDE7DC] transition-colors"
                            title={product.active ? 'Pausar producto' : 'Activar producto'}
                          >
                            <Power className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-2 rounded-xl text-[#556353] hover:text-[#222A21] hover:bg-[#EDE7DC] transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="p-2 rounded-xl text-[#556353] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>



      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar producto?"
        message={`Estás a punto de eliminar permanentemente "${deleteTarget?.name}".`}
        confirmText="Eliminar producto"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
