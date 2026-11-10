import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Building2, Save, MapPin, Camera, Mail, MessageCircle } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/common/Button';
import { FormInput } from '../../components/common/FormInput';
import { ImageUploader } from '../../components/common/ImageUploader';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../contexts/ToastContext';
import { StoreConfig } from '../../types';
import { formatPhoneNumber } from '../../utils';

export const CompanyAdminPage: React.FC = () => {
  const { openMobileSidebar } = useOutletContext<{ openMobileSidebar: () => void }>();
  const { config, updateConfig } = useCompany();
  const { showToast } = useToast();

  const [form, setForm] = useState<StoreConfig>(config);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(config);
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.storeName.trim()) {
      showToast('El nombre de la tienda es obligatorio.', 'error');
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
        subtitle="Configurá el nombre, logo, fotos, contacto y dirección que se muestran en la tienda pública"
        onOpenMobileSidebar={openMobileSidebar}
      />

      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-5xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Aviso: WhatsApp se movió a su propia sección */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#EAF1E6] border border-[#CFDCC8] text-sm text-[#2F4A33]">
            <span>El número de pedidos y el servidor automático de WhatsApp ahora están en su propia sección.</span>
            <Link to="/admin/whatsapp" className="font-semibold underline shrink-0">
              Ir a WhatsApp y Pedidos →
            </Link>
          </div>

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
                placeholder="Ej: Macetas de autor & diseño decorativo"
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
                folder="company"
                value={form.logoUrl ? [form.logoUrl] : []}
                onChange={(imgs) => setForm({ ...form, logoUrl: imgs[0] || '' })}
              />
            </div>
          </div>

          {/* Card: Fotos de Portada y Filosofía (Página de Inicio) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD4] shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-[#EFE9DE] pb-4">
              <div className="p-2.5 rounded-2xl bg-[#2D3A2F]/10 text-[#2D3A2F]">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-[#222A21]">Fotos de Portada y Filosofía (Página de Inicio)</h2>
                <p className="text-xs text-[#6F7B6D]">Cargá las fotografías de tus macetas que se muestran en el banner principal y en la sección del taller</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Foto Principal de Portada */}
              <div className="space-y-2 text-left bg-[#FAF8F5] p-5 rounded-2xl border border-[#EDE7DC]">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#354333]">
                    1. Fotos del Banner Principal (Carrusel)
                  </label>
                  <p className="text-[11px] text-[#6E7B6C] mt-0.5">
                    Hasta 6 fotos que van pasando con un fundido suave en la portada. La primera es la que se ve al entrar. Recomendado: formato vertical con buena iluminación.
                  </p>
                </div>
                <ImageUploader
                  maxImages={6}
                  folder="company"
                  value={
                    form.heroImages && form.heroImages.length > 0
                      ? form.heroImages
                      : form.heroImageUrl
                        ? [form.heroImageUrl]
                        : []
                  }
                  onChange={(imgs) => setForm({ ...form, heroImages: imgs, heroImageUrl: imgs[0] || '' })}
                />
              </div>

              {/* Foto Tarjeta Flotante */}
              <div className="space-y-2 text-left bg-[#FAF8F5] p-5 rounded-2xl border border-[#EDE7DC]">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#354333]">
                    2. Miniatura Flotante "Diseño de Autor"
                  </label>
                  <p className="text-[11px] text-[#6E7B6C] mt-0.5">
                    Detalle decorativo que flota en la esquina inferior del banner principal. Recomendado: foto cercana de una maceta o acabado.
                  </p>
                </div>
                <ImageUploader
                  maxImages={1}
                  folder="company"
                  value={form.heroFloatingImageUrl ? [form.heroFloatingImageUrl] : []}
                  onChange={(imgs) => setForm({ ...form, heroFloatingImageUrl: imgs[0] || '' })}
                />
              </div>

              {/* Foto Nuestra Filosofía */}
              <div className="space-y-2 text-left bg-[#FAF8F5] p-5 rounded-2xl border border-[#EDE7DC] md:col-span-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#354333]">
                    3. Foto de la Sección "Nuestra Filosofía"
                  </label>
                  <p className="text-[11px] text-[#6E7B6C] mt-0.5">
                    Muestra tu espacio de trabajo, taller de vaciado, moldes o mesa con macetas terminadas. Aparece junto al texto de filosofía de cemento y texturas.
                  </p>
                </div>
                <ImageUploader
                  maxImages={1}
                  folder="company"
                  value={form.philosophyImageUrl ? [form.philosophyImageUrl] : []}
                  onChange={(imgs) => setForm({ ...form, philosophyImageUrl: imgs[0] || '' })}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Contacto y Redes */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD4] shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-[#EFE9DE] pb-4">
              <div className="p-2.5 rounded-2xl bg-[#2D3A2F]/10 text-[#2D3A2F]">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-[#222A21]">Contacto & Redes</h2>
                <p className="text-xs text-[#6F7B6D]">Se muestran en el pie de página y en la página de contacto</p>
              </div>
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE7DC]">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-[#1EA851]" />
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6F7B6D]">
                    WhatsApp público (solo lectura)
                  </span>
                  <span className="block text-base font-bold text-[#222A21]">
                    {form.whatsappNumber ? formatPhoneNumber(form.whatsappNumber) : 'Sin configurar'}
                  </span>
                </div>
              </div>
              <Link to="/admin/whatsapp" className="text-sm font-semibold text-[#2D3A2F] underline">
                Cambiar en WhatsApp y Pedidos
              </Link>
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
