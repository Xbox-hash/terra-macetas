import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Palette,
  Camera,
  Search,
  Sparkles,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ProductColor } from '../../types';
import { colorService } from '../../services/colorService';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { FormInput } from '../../components/common/FormInput';
import { compressImageFile } from '../../utils/imageCompressor';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../contexts/ToastContext';

export const ColorsAdminPage: React.FC = () => {
  const { openMobileSidebar } = useOutletContext<{ openMobileSidebar: () => void }>();
  const { showToast } = useToast();

  const [colors, setColors] = useState<ProductColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'with-photo' | 'without-photo'>('all');

  // Modal / Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<ProductColor | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    hex: string;
    description: string;
    image: string;
    active: boolean;
  }>({
    name: '',
    hex: '#D8C4A7',
    description: '',
    image: '',
    active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoInputMode, setPhotoInputMode] = useState<'file' | 'url'>('file');

  // Delete & Reset Confirmations
  const [deleteTarget, setDeleteTarget] = useState<ProductColor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    setLoading(true);
    try {
      const data = await colorService.getAll();
      setColors(data);
    } catch {
      showToast('Error al cargar la paleta de colores.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingColor(null);
    setFormData({
      name: '',
      hex: '#D8C4A7',
      description: '',
      image: '',
      active: true,
    });
    setPhotoInputMode('file');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (color: ProductColor) => {
    setEditingColor(color);
    setFormData({
      name: color.name,
      hex: color.hex || '#D8C4A7',
      description: color.description || '',
      image: color.image || '',
      active: color.active !== false,
    });
    setPhotoInputMode(color.image && !color.image.startsWith('data:') ? 'url' : 'file');
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor seleccioná un archivo de imagen válido.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen supera los 5MB. Elegí una imagen más liviana.', 'error');
      return;
    }

    try {
      const compressed = await compressImageFile(file, { maxWidth: 400, maxHeight: 400, quality: 0.82 });
      setFormData((prev) => ({ ...prev, image: compressed }));
      showToast('Foto circular cargada y optimizada con éxito.');
    } catch (err) {
      showToast('Error al procesar la imagen.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('El nombre del color es obligatorio.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingColor) {
        await colorService.update(editingColor.id, {
          name: formData.name.trim(),
          hex: formData.hex,
          description: formData.description.trim(),
          image: formData.image.trim() || undefined,
          active: formData.active,
        });
        showToast(`Color "${formData.name}" actualizado.`);
      } else {
        await colorService.create({
          name: formData.name.trim(),
          hex: formData.hex,
          description: formData.description.trim(),
          image: formData.image.trim() || undefined,
          active: formData.active,
        });
        showToast(`Color "${formData.name}" registrado en la paleta.`);
      }
      setIsModalOpen(false);
      await loadColors();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar el color.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (color: ProductColor) => {
    try {
      const nextActive = color.active === false ? true : false;
      await colorService.update(color.id, { active: nextActive });
      setColors((prev) =>
        prev.map((c) => (c.id === color.id ? { ...c, active: nextActive } : c))
      );
      showToast(`Color "${color.name}" ahora está ${nextActive ? 'activo' : 'inactivo'}.`);
    } catch {
      showToast('Error al actualizar estado del color.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await colorService.delete(deleteTarget.id);
      showToast(`Color "${deleteTarget.name}" eliminado.`);
      setDeleteTarget(null);
      await loadColors();
    } catch {
      showToast('Error al eliminar el color.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetDefaults = async () => {
    try {
      await colorService.resetToDefaults();
      showToast('Paleta restablecida a los colores predeterminados.');
      setIsResetConfirmOpen(false);
      await loadColors();
    } catch {
      showToast('Error al restablecer la paleta.', 'error');
    }
  };

  // Filter & Search Logic
  const filteredColors = colors.filter((color) => {
    const matchesSearch =
      color.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (color.description && color.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      color.hex.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'active') return color.active !== false;
    if (filterType === 'with-photo') return !!color.image;
    if (filterType === 'without-photo') return !color.image;
    return true;
  });

  const totalColors = colors.length;
  const activeColorsCount = colors.filter((c) => c.active !== false).length;
  const withPhotoCount = colors.filter((c) => !!c.image).length;

  return (
    <div className="flex-1 min-h-screen bg-[#F7F5F0]">
      <AdminHeader
        title="Paleta de Colores & Acabados de Autor"
        subtitle="Registrá y personalizá las opciones de color de las macetas. Cada variante cuenta con su textura fotográfica circular y descripción artesanal."
        onOpenMobileSidebar={openMobileSidebar}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetConfirmOpen(true)}
              className="hidden sm:flex text-xs"
              title="Restablecer a paleta original de autor"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Restablecer Base
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenCreateModal}
              className="shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Color / Acabado
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* KPI / Métricas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E9E4DB] shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EDE7DC] flex items-center justify-center text-[#2D3A2F]">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#6C796A] uppercase tracking-wider block">
                Total Registrados
              </span>
              <span className="text-2xl font-bold font-serif text-[#222A21]">{totalColors}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E9E4DB] shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#6C796A] uppercase tracking-wider block">
                Colores Activos
              </span>
              <span className="text-2xl font-bold font-serif text-[#222A21]">{activeColorsCount}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E9E4DB] shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#6C796A] uppercase tracking-wider block">
                Con Foto de Textura
              </span>
              <span className="text-2xl font-bold font-serif text-[#222A21]">{withPhotoCount}</span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-white rounded-2xl p-4 border border-[#E9E4DB] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#8C988A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por color, descripción o hex..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded-xl text-xs text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#2D3A2F] text-white'
                  : 'bg-[#F2EFE8] text-[#556353] hover:bg-[#E8E2D6]'
              }`}
            >
              Todos ({totalColors})
            </button>
            <button
              onClick={() => setFilterType('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'active'
                  ? 'bg-[#2D3A2F] text-white'
                  : 'bg-[#F2EFE8] text-[#556353] hover:bg-[#E8E2D6]'
              }`}
            >
              Solo Activos ({activeColorsCount})
            </button>
            <button
              onClick={() => setFilterType('with-photo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'with-photo'
                  ? 'bg-[#2D3A2F] text-white'
                  : 'bg-[#F2EFE8] text-[#556353] hover:bg-[#E8E2D6]'
              }`}
            >
              Con Foto Circular ({withPhotoCount})
            </button>
          </div>
        </div>

        {/* Grid de Colores */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#2D3A2F]/20 border-t-[#2D3A2F] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#707E6E] font-medium">Cargando paleta de acabados...</p>
          </div>
        ) : filteredColors.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E9E4DB] space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#F5F2EB] flex items-center justify-center mx-auto text-[#6F7D6D]">
              <Palette className="w-8 h-8 opacity-60" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#222A21]">No se encontraron colores</h3>
              <p className="text-xs text-[#6F7D6D] max-w-sm mx-auto mt-1">
                {searchQuery
                  ? 'No hay colores que coincidan con los términos de búsqueda.'
                  : 'Comenzá agregando tu primer color con foto circular y descripción artesanal.'}
              </p>
            </div>
            {searchQuery ? (
              <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                Limpiar búsqueda
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
                <Plus className="w-4 h-4 mr-1.5" />
                Registrar nuevo color
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredColors.map((color) => {
              const isActive = color.active !== false;
              return (
                <div
                  key={color.id}
                  className={`bg-white rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between group shadow-2xs ${
                    isActive
                      ? 'border-[#E6DFD3] hover:shadow-md hover:border-[#2D3A2F]/40'
                      : 'border-[#EDE8E0] bg-[#FAF8F5]/60 opacity-75'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header de la Tarjeta con Swatch Circular y Badges */}
                    <div className="flex items-start justify-between gap-3">
                      {/* Swatch circular prominente con textura o tono */}
                      <div className="relative group/swatch">
                        <div
                          className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white ring-2 ring-[#2D3A2F]/20 flex items-center justify-center shrink-0 transition-transform group-hover/swatch:scale-105"
                          style={{ backgroundColor: color.hex }}
                        >
                          {color.image ? (
                            <img
                              src={color.image}
                              alt={color.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-black/20 via-transparent to-white/20 rounded-full" />
                          )}
                        </div>
                        {color.image && (
                          <span
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#2D3A2F] text-white flex items-center justify-center text-[10px] shadow-xs"
                            title="Foto real de textura"
                          >
                            <Camera className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <StatusBadge
                          active={isActive}
                          activeText="Activo"
                          inactiveText="Inactivo"
                        />
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F2EDE4] text-[#475446] text-[11px] font-mono font-medium">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.hex.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Nombre y Descripción */}
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#222A21] leading-tight group-hover:text-[#4A5D4E] transition-colors">
                        {color.name}
                      </h3>
                      <p className="text-xs text-[#6A7869] mt-1.5 line-clamp-3 leading-relaxed">
                        {color.description || 'Sin descripción artesanal configurada.'}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="pt-4 mt-4 border-t border-[#F0EBE1] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(color)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'text-[#5C6A5A] hover:bg-[#F2EFE8]'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                      title={isActive ? 'Desactivar este color' : 'Activar este color'}
                    >
                      {isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isActive ? 'Pausar' : 'Activar'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(color)}
                        className="text-[#2D3A2F] hover:bg-[#EAE4D7] px-2.5"
                        title="Editar color y textura"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(color)}
                        className="text-rose-600 hover:bg-rose-50 px-2"
                        title="Eliminar de la paleta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL CREAR / EDITAR COLOR */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingColor ? `Editar Color: ${editingColor.name}` : 'Registrar Nuevo Color o Acabado'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview Circular Central */}
          <div className="p-5 rounded-2xl bg-[#F6F2EA] border border-[#E5DFD4] flex flex-col sm:flex-row items-center gap-5">
            <div className="relative shrink-0">
              <div
                className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-4 border-white ring-4 ring-[#2D3A2F]/20 flex items-center justify-center transition-all duration-300"
                style={{ backgroundColor: formData.hex }}
              >
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Vista previa circular"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-black/20 via-transparent to-white/20 rounded-full" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#2D3A2F] text-white text-[10px] font-bold shadow-xs">
                Muestra
              </span>
            </div>

            <div className="text-center sm:text-left space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C6E5B]">
                Previsualización en Detalle de Maceta
              </span>
              <h4 className="font-serif text-xl font-bold text-[#222A21]">
                {formData.name.trim() || 'Nombre del color'}
              </h4>
              <p className="text-xs text-[#6B796A] line-clamp-2">
                {formData.description.trim() ||
                  'Aquí se mostrará la explicación del tacto, porosidad o reflejos artesanales para tus clientes.'}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <FormInput
              label="Nombre del Color o Acabado *"
              placeholder="Ej: Arena Volcánica, Terracota Rústico, Marfil Mate..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            {/* Selector de Tono Hexadecimal */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
                Tono Base de Referencia (Color Hex) *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.hex}
                  onChange={(e) => setFormData({ ...formData, hex: e.target.value })}
                  className="w-12 h-11 p-1 rounded-xl border border-[#D9D3C7] cursor-pointer bg-white"
                  title="Elegir color base"
                />
                <input
                  type="text"
                  value={formData.hex}
                  onChange={(e) => setFormData({ ...formData, hex: e.target.value })}
                  placeholder="#A7471E"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-[#D9D3C7] rounded-xl text-sm font-mono font-bold text-[#2D3A2F] uppercase focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
                />
              </div>
              <span className="text-[11px] text-[#717E6F] block">
                Se utiliza como respaldo visual y para los indicadores en miniatura.
              </span>
            </div>

            {/* Descripción Artesanal */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
                Descripción del Acabado y Textura
              </label>
              <textarea
                rows={3}
                placeholder="Ej: Textura arenisca con micro-granos minerales visibles al tacto, terminación mate que no refleja luz..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9D3C7] rounded-xl text-xs text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              />
              <span className="text-[11px] text-[#717E6F] block">
                Esta descripción le aparecerá al cliente en la tienda al pasar el cursor o hacer clic sobre la muestra.
              </span>
            </div>

            {/* Carga de Foto Circular de Textura */}
            <div className="space-y-2 text-left pt-2 border-t border-[#EAE4D7]">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475446]">
                  Foto de Textura Circular (Recomendada)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPhotoInputMode('file')}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer ${
                      photoInputMode === 'file'
                        ? 'bg-[#2D3A2F] text-white'
                        : 'bg-[#EDE7DC] text-[#4F5D4D]'
                    }`}
                  >
                    Subir archivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoInputMode('url')}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer ${
                      photoInputMode === 'url'
                        ? 'bg-[#2D3A2F] text-white'
                        : 'bg-[#EDE7DC] text-[#4F5D4D]'
                    }`}
                  >
                    Pegar enlace
                  </button>
                </div>
              </div>

              {photoInputMode === 'file' ? (
                <div>
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#C9BFB0] hover:border-[#2D3A2F] rounded-2xl bg-[#FAF8F5] cursor-pointer transition-colors group">
                    <Upload className="w-6 h-6 text-[#7E8D7B] group-hover:text-[#2D3A2F] mb-1.5 transition-colors" />
                    <span className="text-xs font-semibold text-[#2D3A2F]">
                      Hacé clic para elegir una foto de la textura
                    </span>
                    <span className="text-[10px] text-[#788676] mt-0.5">
                      JPG, PNG o WEBP (se recortará automáticamente en círculo)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 text-[#7A8778] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/textura-acabado.jpg"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#D9D3C7] rounded-xl text-xs text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
                    />
                  </div>
                </div>
              )}

              {formData.image && (
                <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    Fotografía de textura activa en el círculo
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Quitar foto
                  </button>
                </div>
              )}
            </div>

            {/* Toggle Activo */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-[#2D3A2F] focus:ring-[#2D3A2F] border-[#D9D3C7] w-4 h-4"
                />
                <span className="text-xs font-semibold text-[#2D3A2F]">
                  Color disponible para catálogo y fabricación de macetas
                </span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE4D7]">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              {editingColor ? 'Guardar Cambios' : 'Registrar Color'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DIÁLOGO CONFIRMAR ELIMINACIÓN */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="¿Eliminar este color de la paleta?"
        message={`Estás a punto de eliminar "${deleteTarget?.name}". Las macetas que tengan este color configurado dejarán de mostrar esta opción en tienda.`}
        confirmText="Sí, eliminar color"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      {/* DIÁLOGO CONFIRMAR RESTABLECER PREDETERMINADOS */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="¿Restablecer a la paleta predeterminada?"
        message="Se reiniciará la paleta con los 17 colores tradicionales de autor. Cualquier color personalizado creado recientemente se reemplazará."
        confirmText="Restablecer paleta base"
        isDestructive={false}
        onConfirm={handleResetDefaults}
        onClose={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
