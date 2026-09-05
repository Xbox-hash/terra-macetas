import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building2, Save, MessageCircle, MapPin, Mail, Clock, Camera, Globe, Sparkles, CheckCircle2 } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/common/Button';
import { FormInput } from '../../components/common/FormInput';
import { ImageUploader } from '../../components/common/ImageUploader';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../contexts/ToastContext';
import { StoreConfig } from '../../types';

export const CompanyAdminPage: React.FC = () => {
  const { openMobileSidebar } = useOutletContext<{ openMobileSidebar: () => void }>();
  const { config, updateConfig, isLoading } = useCompany();
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
      await updateConfig(form);
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
                label="Número de WhatsApp para Pedidos (Sin espacios ni signos)"
                required
                helperText="Incluir código de país (Ej: 595981234567 para Paraguay o 549112345678 para Argentina)"
                placeholder="595981234567"
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value.replace(/[^0-9]/g, '') })}
              />

              <FormInput
                label="WhatsApp para Mostrar al Público"
                placeholder="+595 981 234 567"
                value={form.whatsappDisplay}
                onChange={(e) => setForm({ ...form, whatsappDisplay: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Correo Electrónico de Contacto"
                type="email"
                placeholder="contacto@terramacetas.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <FormInput
                label="Usuario de Instagram"
                placeholder="@terra.macetas"
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              />
            </div>
          </div>

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
              Los cambios se guardan en la base de datos SQL Server y se reflejan al instante en la tienda.
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
