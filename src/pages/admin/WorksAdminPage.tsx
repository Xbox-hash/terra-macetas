import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, Camera, MapPin, Package } from 'lucide-react';
import { ClientWork, Product } from '../../types';
import { workService, workTitle, SaveClientWork } from '../../services/workService';
import { productService } from '../../services/productService';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { FormInput } from '../../components/common/FormInput';
import { ImageUploader } from '../../components/common/ImageUploader';
import { useToast } from '../../contexts/ToastContext';

const MAX_IMAGES = 8;

const emptyForm: SaveClientWork = {
  images: [],
  clientName: '',
  showClientName: false,
  city: '',
  description: '',
  productId: '',
  active: true,
  featured: false,
  sortOrder: 0,
};

/** Interruptor accesible con texto de ayuda. */
const Toggle: React.FC<{ id: string; checked: boolean; onChange: (v: boolean) => void; label: string; help: string }> = ({
  id,
  checked,
  onChange,
  label,
  help,
}) => (
  <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-xl border border-[#E5DFD4] bg-white hover:bg-[#FAF8F4]">
    <span className="relative mt-0.5 shrink-0">
      <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="block w-9 h-5 rounded-full bg-[#CFC8BA] peer-checked:bg-[#2D3A2F] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#2D3A2F] peer-focus-visible:ring-offset-2" />
      <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
    </span>
    <span>
      <span className="block text-xs font-semibold text-[#2D3A2F]">{label}</span>
      <span className="block text-[11px] text-[#6E7B6C] mt-0.5">{help}</span>
    </span>
  </label>
);

export const WorksAdminPage: React.FC = () => {
  const { openMobileSidebar } = useOutletContext<{ openMobileSidebar: () => void }>();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [works, setWorks] = useState<ClientWork[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientWork | null>(null);
  const [form, setForm] = useState<SaveClientWork>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ClientWork | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    try {
      setWorks(await workService.getAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    productService.getAll().then(setProducts).catch(() => setProducts([]));
  }, []);

  const sortedProducts = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products]);

  // Los trabajos nuevos se cargan en la pantalla de 3 pasos; la ventana queda para editar
  const openCreate = () => navigate('/admin/trabajos/nuevo');

  const openEdit = (w: ClientWork) => {
    setEditing(w);
    setForm({
      images: w.images,
      clientName: w.clientName ?? '',
      showClientName: w.showClientName,
      city: w.city ?? '',
      description: w.description ?? '',
      productId: w.productId ?? '',
      active: w.active,
      featured: w.featured,
      sortOrder: w.sortOrder,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.images.length === 0) {
      showToast('Subí al menos una foto del trabajo.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const body = { ...form, productId: form.productId || null };
      if (editing) {
        await workService.update(editing.id, body);
        showToast('Trabajo actualizado.');
      } else {
        await workService.create(body);
        showToast('Trabajo publicado.');
      }
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      showToast(err.message || 'No se pudo guardar el trabajo', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (w: ClientWork) => {
    setWorks((prev) => prev.map((x) => (x.id === w.id ? { ...x, active: !x.active } : x)));
    try {
      await workService.toggleActive(w.id);
      showToast(w.active ? 'El trabajo quedó oculto en la tienda.' : 'El trabajo ya se ve en la tienda.');
    } catch {
      showToast('No se pudo cambiar la visibilidad', 'error');
    }
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await workService.delete(deleteTarget.id);
      setWorks((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      showToast('Trabajo eliminado.');
      setDeleteTarget(null);
    } catch (err: any) {
      showToast(err.message || 'No se pudo eliminar', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const preview = workTitle({ clientName: form.clientName, showClientName: form.showClientName, city: form.city });
  const previewProduct = products.find((p) => p.id === form.productId);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Trabajos realizados"
        subtitle="Fotos de macetas ya instaladas en casas, negocios y oficinas de clientes"
        onOpenMobileSidebar={openMobileSidebar}
        actions={
          <Button variant="primary" size="sm" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo trabajo
          </Button>
        }
      />

      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-[#EBE5DA] rounded-2xl aspect-4/3" />
            ))}
          </div>
        ) : works.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#D5CEC2] p-10 sm:p-14 text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#EAE4D7] flex items-center justify-center mx-auto text-[#4A5D4E]">
              <Camera className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#222A21]">Todavía no cargaste trabajos</h2>
            <p className="text-sm text-[#6E7B6C] leading-relaxed">
              Subí fotos de las macetas ya instaladas en lugares de tus clientes. Aparecen en la página "Trabajos realizados", en el
              inicio (si las marcás como destacadas) y en la ficha de la pieza usada.
            </p>
            <Button variant="primary" size="sm" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
              Cargar el primer trabajo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {works.map((w) => {
              const t = workTitle({ ...w, clientName: w.clientName });
              return (
                <article
                  key={w.id}
                  className={`bg-white rounded-2xl border border-[#E5DFD4] overflow-hidden flex flex-col transition-opacity ${w.active ? '' : 'opacity-60'}`}
                >
                  <div className="relative aspect-4/3 bg-[#F0ECE4]">
                    {w.images[0] && <img src={w.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />}
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                      {w.featured && (
                        <span className="inline-flex items-center gap-1 bg-[#2D3A2F]/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                          <Star className="w-3 h-3" /> En el inicio
                        </span>
                      )}
                      {!w.active && (
                        <span className="bg-neutral-800/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">Oculto</span>
                      )}
                    </div>
                    <span className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-[10px] font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1">
                      <Camera className="w-3 h-3" /> {w.images.length}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#7D8B7A]">
                      {w.clientName ? (w.showClientName ? 'Nombre visible' : 'Nombre oculto en la tienda') : 'Sin cliente'}
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-[#222A21] leading-tight">{w.clientName || t.title}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#6E7B6C]">
                      {w.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {w.city}
                        </span>
                      )}
                      {w.productName && (
                        <span className="inline-flex items-center gap-1">
                          <Package className="w-3 h-3" /> {w.productName}
                        </span>
                      )}
                    </div>
                    {w.description && <p className="text-xs text-[#5A6757] line-clamp-2">{w.description}</p>}
                  </div>
                  <div className="px-3 py-2.5 border-t border-[#F2ECE2] flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleToggle(w)}
                      className="p-2 rounded-lg text-[#556353] hover:text-[#222A21] hover:bg-[#EDE7DC] transition-colors"
                      title={w.active ? 'Ocultar en la tienda' : 'Mostrar en la tienda'}
                      aria-label={w.active ? 'Ocultar en la tienda' : 'Mostrar en la tienda'}
                    >
                      {w.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(w)}
                      className="p-2 rounded-lg text-[#556353] hover:text-[#222A21] hover:bg-[#EDE7DC] transition-colors"
                      title="Editar"
                      aria-label="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(w)}
                      className="p-2 rounded-lg text-[#556353] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Editar trabajo' : 'Nuevo trabajo'} maxWidth="2xl">
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
                  Fotos <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-[#7E8B7D]">
                  {form.images.length} de {MAX_IMAGES}
                </span>
              </div>
              <p className="text-[11px] text-[#6E7B6C]">La primera foto es la portada. Arrastralas o usá las flechas para cambiar el orden. Se comprimen solas al subirlas.</p>
              <ImageUploader maxImages={MAX_IMAGES} folder="works" value={form.images} onChange={(images) => setForm({ ...form, images })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                id="work-client"
                label="Para quién (opcional)"
                placeholder="Ej: Familia B. o Cafetería en Villa Morra"
                maxLength={150}
                value={form.clientName ?? ''}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              />
              <FormInput
                id="work-city"
                label="Ciudad (opcional)"
                placeholder="Ej: Luque"
                maxLength={120}
                value={form.city ?? ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label htmlFor="work-desc" className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
                Descripción (opcional)
              </label>
              <textarea
                id="work-desc"
                rows={3}
                maxLength={1000}
                placeholder="Qué se hizo y dónde quedó. Ej: Dos Tótem en gris perla a los lados de la entrada."
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label htmlFor="work-product" className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
                Pieza usada (opcional)
              </label>
              <select
                id="work-product"
                value={form.productId ?? ''}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              >
                <option value="">Ninguna</option>
                {sortedProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.active ? '' : ' (pausado)'}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#6E7B6C]">Pone un botón hacia la ficha y muestra este trabajo en esa ficha.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Toggle
                id="work-show-name"
                checked={form.showClientName}
                onChange={(v) => setForm({ ...form, showClientName: v })}
                label="Mostrar el nombre del cliente"
                help="Activalo solo si el cliente dio permiso. Si no, se ve la ciudad."
              />
              <Toggle
                id="work-featured"
                checked={form.featured}
                onChange={(v) => setForm({ ...form, featured: v })}
                label="Destacado en el inicio"
                help="Aparece en el carrusel de la página principal."
              />
              <Toggle
                id="work-active"
                checked={form.active}
                onChange={(v) => setForm({ ...form, active: v })}
                label="Visible en la tienda"
                help="Apagalo para guardarlo sin publicarlo."
              />
              <FormInput
                id="work-order"
                label="Orden"
                type="number"
                min={0}
                helperText="Los números más bajos van primero."
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Vista previa en vivo */}
          <aside className="space-y-2 lg:sticky lg:top-0 self-start">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">Vista previa</span>
            <div className="relative aspect-4/5 rounded-2xl overflow-hidden bg-[#1F2720]">
              {form.images[0] ? (
                <img src={form.images[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#8C988A]">
                  <Camera className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4 pt-14 bg-gradient-to-t from-[#1A221B]/90 to-transparent text-white space-y-1">
                <span className="block text-[9px] uppercase tracking-widest opacity-80">{preview.eyebrow}</span>
                <span className="block font-serif text-lg font-semibold leading-tight">{preview.title}</span>
                {form.description && <p className="text-[11px] opacity-90 line-clamp-3">{form.description}</p>}
                {previewProduct && (
                  <span className="inline-block mt-1 bg-white/90 text-[#222A21] text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    {previewProduct.name} →
                  </span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-[#6E7B6C]">Así se ve en la tienda.</p>
          </aside>

          <div className="lg:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-[#EAE4D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {editing ? 'Guardar cambios' : 'Publicar trabajo'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar trabajo?"
        message="Se borra de la tienda y del panel. Esta acción no se puede deshacer."
        confirmText="Eliminar"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
