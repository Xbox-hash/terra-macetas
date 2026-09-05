import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Edit2, Trash2, Power, Layers, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { ProductLine } from '../../types';
import { lineService } from '../../services/lineService';
import { productService } from '../../services/productService';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { FormInput } from '../../components/common/FormInput';
import { ImageUploader } from '../../components/common/ImageUploader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../contexts/ToastContext';

export const LinesAdminPage: React.FC = () => {
  const { openMobileSidebar } = useOutletContext<{ openMobileSidebar: () => void }>();
  const { showToast } = useToast();

  const [lines, setLines] = useState<ProductLine[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<ProductLine | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<ProductLine | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadLines();
  }, []);

  const loadLines = async () => {
    setLoading(true);
    try {
      const [allLines, allProds] = await Promise.all([
        lineService.getAll(),
        productService.getAll(),
      ]);
      setLines(allLines);

      // Calcular cantidad de productos por línea
      const counts: Record<string, number> = {};
      allLines.forEach((l) => {
        counts[l.id] = allProds.filter((p) => p.lineId === l.id).length;
      });
      setProductCounts(counts);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingLine(null);
    setFormData({
      name: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1000&q=80',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (line: ProductLine) => {
    setEditingLine(line);
    setFormData({
      name: line.name,
      description: line.description,
      image: line.image,
      active: line.active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (editingLine) {
        await lineService.update(editingLine.id, {
          name: formData.name,
          slug,
          description: formData.description,
          image: formData.image,
          active: formData.active,
        });
        showToast(`Línea "${formData.name}" actualizada con éxito.`);
      } else {
        await lineService.create({
          name: formData.name,
          slug,
          description: formData.description,
          image: formData.image,
          active: formData.active,
        });
        showToast(`Nueva línea "${formData.name}" creada.`);
      }
      setIsModalOpen(false);
      loadLines();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar línea', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (line: ProductLine) => {
    try {
      await lineService.toggleActive(line.id);
      showToast(`Estado de "${line.name}" actualizado.`);
      loadLines();
    } catch (err: any) {
      showToast('Error al alternar estado', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await lineService.delete(deleteTarget.id);
      showToast(`Línea "${deleteTarget.name}" eliminada.`);
      setDeleteTarget(null);
      loadLines();
    } catch (err: any) {
      showToast('Error al eliminar línea', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Líneas de Productos"
        subtitle="Administrá las familias de colecciones visibles en el catálogo"
        onOpenMobileSidebar={openMobileSidebar}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Línea
          </Button>
        }
      />

      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-[#E5DFD4] shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-[#EFE9DE] flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#222A21]">Listado de Líneas</h2>
              <p className="text-xs text-[#6F7B6D] mt-0.5">Total de líneas registradas: {lines.length}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2D3A2F]">
              <thead className="bg-[#F8F5EE] text-[#556253] uppercase text-[10px] font-bold tracking-wider border-b border-[#EFE9DE]">
                <tr>
                  <th className="px-6 py-3.5">Imagen</th>
                  <th className="px-6 py-3.5">Nombre</th>
                  <th className="px-6 py-3.5">Descripción</th>
                  <th className="px-6 py-3.5 text-center">Productos</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE2]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#7E8B7D]">
                      Cargando líneas...
                    </td>
                  </tr>
                ) : lines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#7E8B7D]">
                      No hay líneas creadas todavía.
                    </td>
                  </tr>
                ) : (
                  lines.map((line) => (
                    <tr key={line.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="px-6 py-4">
                        <img
                          src={line.image}
                          alt={line.name}
                          className="w-14 h-14 rounded-xl object-cover bg-[#F0ECE4] border border-[#E8E2D7]"
                        />
                      </td>
                      <td className="px-6 py-4 font-bold text-sm text-[#222A21] max-w-xs">
                        {line.name}
                      </td>
                      <td className="px-6 py-4 text-[#606E5E] max-w-md line-clamp-2">
                        {line.description}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-[#3E4E40]">
                        <span className="px-2.5 py-1 rounded-full bg-[#EAE4D7] text-xs">
                          {productCounts[line.id] || 0} modelos
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge active={line.active} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(line)}
                            className="p-1.5 rounded-lg text-[#556353] hover:text-[#222A21] hover:bg-[#EDE7DC] transition-colors"
                            title={line.active ? 'Desactivar' : 'Activar'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(line)}
                            className="p-1.5 rounded-lg text-[#556353] hover:text-[#222A21] hover:bg-[#EDE7DC] transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(line)}
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

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLine ? 'Editar Línea de Macetas' : 'Crear Nueva Línea de Macetas'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormInput
            label="Nombre de la línea"
            required
            placeholder="Ej: Línea Cerámica Artesanal"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
              Descripción breve
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describí los materiales, texturas y el estilo de esta línea..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-[#D9D3C7] rounded-xl text-sm text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
              Imagen de Portada
            </label>
            <ImageUploader
              maxImages={1}
              value={formData.image ? [formData.image] : []}
              onChange={(imgs) => setFormData({ ...formData, image: imgs[0] || '' })}
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded text-[#2D3A2F] focus:ring-[#2D3A2F] border-[#D9D3C7]"
              />
              <span className="text-xs font-semibold text-[#2D3A2F]">Línea Activa y visible en la tienda</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE4D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {editingLine ? 'Guardar Cambios' : 'Crear Línea'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar línea?"
        message={`Estás a punto de eliminar "${deleteTarget?.name}". Esta acción no se puede deshacer.`}
        confirmText="Eliminar permanentemente"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
