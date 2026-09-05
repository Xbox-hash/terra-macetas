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
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { User } from '../../types';

export const UsersAdminPage: React.FC = () => {
  const { openMobileSidebar } = useOutletContext<{ openMobileSidebar: () => void }>();
  const { user: currentUser } = useAuth();
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
    permissions: ['all'] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const availableModules = [
    { key: 'dashboard', label: 'Dashboard y Pedidos', desc: 'Ver métricas de ventas y gestionar/cancelar pedidos' },
    { key: 'analytics', label: 'Reportes & BI (Power BI)', desc: 'Visualizar gráficos analíticos y exportar reportes Excel/PDF' },
    { key: 'lines', label: 'Líneas de Macetas', desc: 'Crear, editar y organizar categorías de productos' },
    { key: 'products', label: 'Productos del Catálogo', desc: 'Gestionar productos, precios, fotos y características' },
    { key: 'company', label: 'Datos de la Empresa', desc: 'Editar WhatsApp, dirección, redes y configuraciones generales' },
    { key: 'users', label: 'Gestión de Usuarios', desc: 'Crear otros usuarios y asignar permisos en el sistema' },
  ];

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
      role: 'Staff',
      active: true,
      permissions: ['dashboard', 'lines', 'products'],
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
      permissions: user.permissions && user.permissions.length > 0 ? user.permissions : ['all'],
    });
    setIsModalOpen(true);
  };

  const togglePermission = (key: string) => {
    if (key === 'all') {
      if (formData.permissions.includes('all')) {
        setFormData({ ...formData, permissions: [] });
      } else {
        setFormData({ ...formData, permissions: ['all', 'dashboard', 'analytics', 'lines', 'products', 'company', 'users'] });
      }
      return;
    }

    let updated = formData.permissions.filter((p) => p !== 'all');
    if (updated.includes(key)) {
      updated = updated.filter((p) => p !== key);
    } else {
      updated.push(key);
    }

    // Si tiene todos los modulos seleccionados, añadir 'all'
    if (availableModules.every((m) => updated.includes(m.key))) {
      updated.push('all');
    }

    setFormData({ ...formData, permissions: updated });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (!editingUser && !formData.password.trim()) {
      showToast('La contraseña es obligatoria para un nuevo usuario.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await authService.updateUser(editingUser.id, {
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          newPassword: formData.password.trim() || undefined,
          role: formData.role,
          permissions: formData.permissions,
          active: formData.active,
        });
        showToast(`Usuario "${formData.name}" actualizado.`);
      } else {
        await authService.createUser({
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          password: formData.password.trim(),
          role: formData.role,
          permissions: formData.permissions,
        });
        showToast(`Usuario "${formData.name}" creado con éxito.`);
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
              <h2 className="font-serif text-lg font-bold text-[#222A21]">Cuentas con Acceso al Panel</h2>
              <p className="text-xs text-[#6F7B6D] mt-0.5">Usuarios registrados con permisos para administrar la tienda</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2D3A2F]">
              <thead className="bg-[#F8F5EE] text-[#556253] uppercase text-[10px] font-bold tracking-wider border-b border-[#EFE9DE]">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Correo Electrónico</th>
                  <th className="px-6 py-4">Rol / Tipo</th>
                  <th className="px-6 py-4">Secciones Permitidas</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE2]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#7E8B7D]">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : (
                  users
                    .filter((u) => {
                      const isDevAccount = u.name.toLowerCase() === 'dev' || u.role?.toLowerCase() === 'superadmin';
                      const isViewingAsDev = currentUser?.name.toLowerCase() === 'dev' || currentUser?.role?.toLowerCase() === 'superadmin';
                      if (isDevAccount && !isViewingAsDev) return false;
                      return true;
                    })
                    .map((u) => {
                      const isSuper = !u.permissions || u.permissions.includes('all') || u.permissions.length === 6;
                      return (
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
                        <td className="px-6 py-4">
                          {isSuper ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              Acceso Total (Todos los Módulos)
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {u.permissions?.map((p) => {
                                const mod = availableModules.find((m) => m.key === p);
                                if (!mod) return null;
                                return (
                                  <span key={p} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#EFE9DE] text-[#3D4A3C]">
                                    {mod.label.split(' ')[0]}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 rounded-lg text-[#556353] hover:text-[#222A21] hover:bg-[#EDE7DC] transition-colors cursor-pointer"
                              title="Editar usuario y permisos"
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
                    );
                  })
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
        title={editingUser ? `Editar Usuario y Permisos: ${editingUser.name}` : 'Crear Nuevo Usuario y Configurar Permisos'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="Nombre de Usuario / Acceso"
              required
              placeholder="Ej: nelson o maria"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <FormInput
              label="Correo Electrónico (Opcional)"
              type="email"
              placeholder="admin@terra.com (opcional)"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label={editingUser ? 'Nueva Contraseña (dejar en blanco para conservar)' : 'Contraseña de Ingreso'}
              type="password"
              required={!editingUser}
              placeholder={editingUser ? '•••••••• (sin cambios)' : 'Mínimo 6 caracteres'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A5D4E] mb-1">
                Rol / Etiqueta
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-[#DDD5C7] rounded-xl text-[#222A21] focus:outline-none focus:ring-2 focus:ring-[#374538]/20 focus:border-[#374538]"
              >
                <option value="Admin">Administrador</option>
                <option value="Staff">Vendedor / Personal (Staff)</option>
                <option value="Soporte">Soporte y Catálogo</option>
              </select>
            </div>
          </div>

          {/* PERMISSIONS SELECTOR */}
          <div className="pt-3 border-t border-[#EAE4D7]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#4A5D4E] block">
                  Permisos de Visualización y Acceso
                </label>
                <p className="text-[11px] text-[#6F7B6D]">
                  Marcá qué secciones de la barra lateral podrá ver y utilizar este usuario
                </p>
              </div>
              <button
                type="button"
                onClick={() => togglePermission('all')}
                className="text-xs font-semibold text-[#374538] hover:underline cursor-pointer"
              >
                {formData.permissions.includes('all') ? 'Deseleccionar todo' : 'Permitir todo (Super Admin)'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {availableModules.map((mod) => {
                const isChecked = formData.permissions.includes('all') || formData.permissions.includes(mod.key);
                return (
                  <div
                    key={mod.key}
                    onClick={() => togglePermission(mod.key)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isChecked
                        ? 'bg-[#F2ECE2] border-[#374538] text-[#222A21] shadow-2xs'
                        : 'bg-white border-[#E8E1D5] text-[#7A8677] hover:border-[#C4BAA9]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isChecked ? 'bg-[#374538] text-white' : 'border border-[#C4BAA9] bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#222A21] block leading-tight">{mod.label}</span>
                      <span className="text-[10px] text-[#6F7B6D] leading-snug block mt-0.5">{mod.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
