import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, Power, Search, Filter, Sparkles, X, Package, Check, Palette } from 'lucide-react';
import { Product, ProductLine, ProductColor } from '../../types';
import { productService } from '../../services/productService';
import { lineService } from '../../services/lineService';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
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

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setIsModalOpen(true);
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
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price <= 0) return;

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

      setIsModalOpen(false);
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

      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Filters Toolbar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E5DFD4] shadow-xs space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#7A8878] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#FAF8F5] border border-[#D9D2C5] rounded-xl text-xs text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
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

          {/* Select filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-[#5D6B5C]">
              <Filter className="w-3.5 h-3.5" />
              <span>Línea:</span>
              <select
                value={selectedLineFilter}
                onChange={(e) => setSelectedLineFilter(e.target.value)}
                className="text-xs bg-[#FAF8F5] border border-[#D9D2C5] rounded-xl px-2.5 py-1.5 text-[#2D3A2F] focus:outline-none focus:ring-1 focus:ring-[#2D3A2F]"
              >
                <option value="all">Todas ({products.length})</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#5D6B5C]">
              <span>Estado:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs bg-[#FAF8F5] border border-[#D9D2C5] rounded-xl px-2.5 py-1.5 text-[#2D3A2F] focus:outline-none focus:ring-1 focus:ring-[#2D3A2F]"
              >
                <option value="all">Todos</option>
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
              <h2 className="font-serif text-lg font-bold text-[#222A21]">Listado de Modelos</h2>
              <p className="text-xs text-[#6F7B6D] mt-0.5">Mostrando {filteredProducts.length} productos</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2D3A2F]">
              <thead className="bg-[#F8F5EE] text-[#556253] uppercase text-[10px] font-bold tracking-wider border-b border-[#EFE9DE]">
                <tr>
                  <th className="px-6 py-3.5">Imagen</th>
                  <th className="px-6 py-3.5">Producto</th>
                  <th className="px-6 py-3.5">Línea</th>
                  <th className="px-6 py-3.5">Precio</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE2]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#7E8B7D]">
                      Cargando productos...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#7E8B7D]">
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
                          className="w-14 h-14 rounded-xl object-cover bg-[#F0ECE4] border border-[#E8E2D7]"
                        />
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <span className="font-bold text-sm text-[#222A21] block">{product.name}</span>
                        {product.colors && product.colors.length > 0 ? (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex -space-x-1">
                              {product.colors.slice(0, 5).map((c) => (
                                <span
                                  key={c.id}
                                  className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs inline-block"
                                  style={{ backgroundColor: c.hex }}
                                  title={c.name}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-[#768474] font-medium ml-1">
                              {product.colors.length} {product.colors.length === 1 ? 'color' : 'colores'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8C988A] block mt-0.5">Paleta completa</span>
                        )}
                        {product.featured && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1">
                            ⭐ Destacado en Home
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#5B6858]">{getLineName(product.lineId)}</td>
                      <td className="px-6 py-4 font-bold text-sm text-[#222A21]">{formatPrice(product.price)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge active={product.active} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(product)}
                            className="p-1.5 rounded-lg text-[#556353] hover:text-[#222A21] hover:bg-[#EDE7DC] transition-colors"
                            title={product.active ? 'Pausar producto' : 'Activar producto'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 rounded-lg text-[#556353] hover:text-[#222A21] hover:bg-[#EDE7DC] transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="p-1.5 rounded-lg text-[#556353] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* CREATE / EDIT PRODUCT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Nombre del producto"
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
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              >
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Precio (Guaraníes ₲)"
              type="number"
              required
              min={1000}
              step={1000}
              placeholder="85000"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            />

            <FormInput
              label="Dimensiones (opcional)"
              placeholder="Ej: Ø 24 cm x Alto 28 cm"
              value={formData.dimensions}
              onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Material (opcional)"
              placeholder="Ej: Cerámica refractaria cocida a leña"
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
            />

            <FormInput
              label="Acabado / Color (opcional)"
              placeholder="Ej: Esmalte satinado terracota"
              value={formData.finish}
              onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
            />
          </div>

          {/* Selector de Colores Disponibles */}
          <div className="space-y-2.5 text-left bg-[#F4EFE6] p-3.5 rounded-2xl border border-[#E3DDD1]">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#475446] flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#4A5D4E]" />
                  Colores disponibles ({formData.colors.length} seleccionados)
                </label>
                <p className="text-[11px] text-[#6E7B6C] mt-0.5">
                  Elige los colores específicos para esta maceta (ej: 3, 4 colores o los que fabrique el cliente).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, colors: [...DEFAULT_POT_PALETTE] })}
                  className="text-[11px] font-semibold text-[#4A5D4E] hover:underline cursor-pointer"
                >
                  Marcar todos
                </button>
                <span className="text-[10px] text-[#A9BCA1]">|</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, colors: [] })}
                  className="text-[11px] font-semibold text-[#8C988A] hover:underline cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 pt-1">
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
                    title={color.name}
                    aria-label={`Color ${color.name}`}
                    className={`relative aspect-square rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
                      isSelected
                        ? 'ring-2 ring-[#222A21] ring-offset-2 scale-105 shadow-sm border-white/60'
                        : 'border-black/10 opacity-35 hover:opacity-90 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && (
                      <span className="p-0.5 rounded-full bg-black/40 text-white backdrop-blur-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {formData.colors.length === 0 ? (
              <p className="text-[11px] text-amber-700 font-medium pt-0.5">
                * Si no seleccionas ninguno específico, se habilitará la paleta completa en la tienda.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.colors.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white border border-[#DDD6C8] text-[#2D3A2F]"
                  >
                    <span className="w-2 h-2 rounded-full border border-black/20" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
              Descripción
            </label>
            <textarea
              rows={3}
              required
              placeholder="Contá para qué plantas es ideal, detalles de drenaje y estética..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
            />
          </div>

          {/* Images Gallery Uploader */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
              Fotografías del producto (Hasta 4 imágenes)
            </label>
            <ImageUploader
              maxImages={4}
              value={formData.images}
              onChange={(imgs) => setFormData({ ...formData, images: imgs })}
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded text-[#2D3A2F] focus:ring-[#2D3A2F] border-[#D9D3C7]"
              />
              <span className="text-xs font-semibold text-[#2D3A2F]">Producto Activo</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="rounded text-[#2D3A2F] focus:ring-[#2D3A2F] border-[#D9D3C7]"
              />
              <span className="text-xs font-semibold text-[#2D3A2F]">Destacar en Home</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE4D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </Modal>

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
