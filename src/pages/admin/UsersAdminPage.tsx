import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, UserPlus, Edit2, Trash2, Key, ShieldCheck, Mail, User as UserIcon, Lock, Check } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { FormInput } from '../../components/common/FormInput';
import { StatusBadge } from '../../components/common/StatusBadge';
import { authService } from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';
import { User } from '../../types';

export const UsersAdminPage: React.FC = () => {
  const { openMobileSidebar } = useOutletContext<{ openMobileSidebar: () => void }>();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin',
    active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Admin',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Vacío para no cambiar contraseña si no se desea
      role: user.role,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (!editingUser && !formData.password.trim()) {
      showToast('La contraseña es obligatoria para un nuevo usuario.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await authService.updateUser(editingUser.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          newPassword: formData.password.trim() || undefined,
          role: formData.role,
          active: formData.active,
        });
        showToast(`Usuario "${formData.name}" actualizado.`);
      } else {
        await authService.createUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          role: formData.role,
        });
        showToast(`Usuario "${formData.name}" creado con éxito en SQL Server.`);
      }

      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar usuario', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await authService.deleteUser(deleteTarget.id);
      showToast(`Usuario "${deleteTarget.name}" eliminado.`);
      setDeleteTarget(null);
      loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar usuario', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Usuarios y Accesos"
        subtitle="Administrá las cuentas con permiso para gestionar el catálogo y los pedidos"
        onOpenMobileSidebar={openMobileSidebar}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate} leftIcon={<UserPlus className="w-4 h-4" />}>
            Nuevo Usuario
          </Button>
        }
      />

      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-5xl w-full mx-auto">
        <div className="bg-white rounded-3xl border border-[#E5DFD4] shadow-xs overflow-hidden">
          <div className="p-5 sm:p-7 border-b border-[#EFE9DE] flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#222A21]">Cuentas de Administrador</h2>
              <p className="text-xs text-[#6F7B6D] mt-0.5">Usuarios guardados en SQL Server con contraseñas encriptadas</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2D3A2F]">
              <thead className="bg-[#F8F5EE] text-[#556253] uppercase text-[10px] font-bold tracking-wider border-b border-[#EFE9DE]">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Correo Electrónico</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE2]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[#7E8B7D]">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#2D3A2F] text-white font-bold text-xs flex items-center justify-center">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-[#222A21] block">{u.name}</span>
                          <span className="text-[10px] text-[#7A8677]">ID: {u.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#4A5748]">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAE4D7] text-[#2D3A2F]">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#4A5D4E]" />
                          {u.role || 'Admin'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-[#556353] hover:text-[#222A21] hover:bg-[#EDE7DC] transition-colors cursor-pointer"
                            title="Editar usuario"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {users.length > 1 && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-1.5 rounded-lg text-[#556353] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* CREATE / EDIT USER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Editar Usuario: ${editingUser.name}` : 'Crear Nuevo Administrador'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormInput
            label="Nombre Completo"
            required
            placeholder="Ej: Nelson Benítez"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <FormInput
            label="Correo Electrónico de Acceso"
            type="email"
            required
            placeholder="admin@terra.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <FormInput
            label={editingUser ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña de Ingreso'}
            type="password"
            required={!editingUser}
            placeholder={editingUser ? '•••••••• (sin cambios)' : 'Mínimo 6 caracteres'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE4D7]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar usuario?"
        message={`¿Estás seguro de que deseas eliminar el acceso para "${deleteTarget?.name}"? Ya no podrá ingresar al panel.`}
        confirmText="Eliminar acceso"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
