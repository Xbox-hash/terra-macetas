import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building2, Save, MessageCircle, MapPin, Mail, Clock, Camera, Globe, Sparkles, CheckCircle2 } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/common/Button';
import { FormInput } from '../../components/common/FormInput';
import { ImageUploader } from '../../components/common/ImageUploader';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { StoreConfig } from '../../types';
import { formatPhoneNumber } from '../../utils';

export const CompanyAdminPage: React.FC = () => {
  const { openMobileSidebar } = useOutletContext<{ openMobileSidebar: () => void }>();
  const { config, updateConfig, isLoading } = useCompany();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState<StoreConfig>(config);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(config);
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.storeName.trim() || !form.whatsappNumber.trim()) {
      showToast('El nombre de la tienda y el número de WhatsApp son obligatorios.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        ...form,
        whatsappDisplay: formatPhoneNumber(form.whatsappNumber),
      };
      await updateConfig(dataToSave);
      showToast('¡Información de la empresa actualizada con éxito!');
    } catch (err: any) {
      showToast(err.message || 'Error al guardar la información.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Datos de la Empresa"
        subtitle="Configurá el nombre, logo, teléfonos, dirección y redes que se muestran en la tienda pública"
        onOpenMobileSidebar={openMobileSidebar}
      />

      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-5xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Card 1: Identidad y Marca */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD4] shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-[#EFE9DE] pb-4">
              <div className="p-2.5 rounded-2xl bg-[#2D3A2F]/10 text-[#2D3A2F]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-[#222A21]">Identidad y Marca</h2>
                <p className="text-xs text-[#6F7B6D]">Nombre comercial, slogan y logo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Nombre del Negocio"
                required
                placeholder="Ej: TERRA"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              />

              <FormInput
                label="Eslogan / Subtítulo"
                placeholder="Ej: Macetas de autor & diseño botánico"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#475446]">
                Logo de la Empresa (Opcional - Reemplaza el ícono por defecto)
              </label>
              <ImageUploader
                maxImages={1}
                value={form.logoUrl ? [form.logoUrl] : []}
                onChange={(imgs) => setForm({ ...form, logoUrl: imgs[0] || '' })}
              />
            </div>
          </div>

          {/* Card 2: Contacto y WhatsApp de Pedidos */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD4] shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-[#EFE9DE] pb-4">
              <div className="p-2.5 rounded-2xl bg-[#25D366]/15 text-[#1EA851]">
                <MessageCircle className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-[#222A21]">Canal de Pedidos & WhatsApp</h2>
                <p className="text-xs text-[#6F7B6D]">Aquí recibirás los pedidos del carrito</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Número de WhatsApp de Contacto y Pedidos"
                required
                helperText="Incluir código de país sin signos (Ej: 595981234567 para Paraguay o 5545999887766 para Brasil)"
                placeholder="595981234567"
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value.replace(/[^0-9]/g, '') })}
              />

              <FormInput
                label="Correo Electrónico de Contacto"
                type="email"
                placeholder="contacto@terramacetas.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Usuario de Instagram"
                placeholder="@terra.macetas"
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              />
            </div>
          </div>

          {/* Card 3: Servidor de Envíos Automáticos WhatsApp (Solo visible para Desarrollador / SuperAdmin) */}
          {(user?.role?.toLowerCase() === 'superadmin' || user?.permissions?.includes('developer') || user?.name?.toLowerCase() === 'dev') && (
            <div className="bg-[#1C231D] text-white rounded-3xl p-6 sm:p-8 border border-[#2D392E] shadow-lg space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#2C382D] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-lg font-bold text-white">Servidor de WhatsApp Automático (Gateway)</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Solo Desarrollador
                      </span>
                    </div>
                    <p className="text-xs text-[#8BA088]">Configuración técnica interna de Evolution API (Oculto para el cliente)</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.whatsappGatewayEnabled ?? true}
                    onChange={(e) => setForm({ ...form, whatsappGatewayEnabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-xs font-bold text-emerald-400">
                    {form.whatsappGatewayEnabled ? 'Activo' : 'Pausado'}
                  </span>
                </label>
              </div>

              <div className="p-4 bg-[#141A15] rounded-2xl border border-[#2B372C] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <span className="text-xs font-bold text-white block">Instancia WhatsApp Conectada</span>
                    <span className="text-[11px] text-[#8BA088]">Instancia: <strong>{form.whatsappInstanceName || 'terra_bot'}</strong> (Evolution API v2)</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                  ● En línea & Listo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#98AC96] mb-1.5">
                    URL Servidor Evolution API
                  </label>
                  <input
                    type="text"
                    value={form.whatsappApiUrl || 'http://localhost:8080'}
                    onChange={(e) => setForm({ ...form, whatsappApiUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#141A15] border border-[#2B372C] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#98AC96] mb-1.5">
                    Nombre de Instancia
                  </label>
                  <input
                    type="text"
                    value={form.whatsappInstanceName || 'terra_bot'}
                    onChange={(e) => setForm({ ...form, whatsappInstanceName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#141A15] border border-[#2B372C] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#98AC96] mb-1.5">
                    API Key de Seguridad
                  </label>
                  <input
                    type="password"
                    value={form.whatsappApiKey || ''}
                    onChange={(e) => setForm({ ...form, whatsappApiKey: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#141A15] border border-[#2B372C] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Card 3: Ubicación y Horarios */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD4] shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-[#EFE9DE] pb-4">
              <div className="p-2.5 rounded-2xl bg-[#2D3A2F]/10 text-[#2D3A2F]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-[#222A21]">Ubicación & Horarios</h2>
                <p className="text-xs text-[#6F7B6D]">Información para visitas al taller/showroom y envíos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <FormInput
                  label="Dirección física del showroom / taller"
                  placeholder="Av. Santa Teresa 1420 c/ Aviadores"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <FormInput
                label="Ciudad"
                placeholder="Asunción"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="País"
                placeholder="Paraguay"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />

              <FormInput
                label="Horarios de Atención"
                placeholder="Lunes a Sábados: 09:00 - 18:30 hs"
                value={form.businessHours}
                onChange={(e) => setForm({ ...form, businessHours: e.target.value })}
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-4 p-4 bg-[#F2EDE4] rounded-2xl border border-[#DCD5C9]">
            <p className="text-xs text-[#627060]">
              Los cambios se aplicarán y actualizarán al instante en la tienda pública.
            </p>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSaving}
              leftIcon={<Save className="w-5 h-5" />}
            >
              Guardar Información
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};
