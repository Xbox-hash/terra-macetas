import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building2, Save, MessageCircle, MapPin, Mail, Clock, Camera, Globe, Sparkles, CheckCircle2, QrCode, RefreshCw, AlertTriangle } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FormInput } from '../../components/common/FormInput';
import { ImageUploader } from '../../components/common/ImageUploader';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { StoreConfig } from '../../types';
import { formatPhoneNumber } from '../../utils';
import { whatsappService, WhatsAppStatus, WhatsAppQrResponse } from '../../services/whatsappService';

export const CompanyAdminPage: React.FC = () => {
  const { openMobileSidebar } = useOutletContext<{ openMobileSidebar: () => void }>();
  const { config, updateConfig, isLoading } = useCompany();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState<StoreConfig>(config);
  const [isSaving, setIsSaving] = useState(false);

  // Estados de WhatsApp Gateway
  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>(null);
  const [isCheckingWa, setIsCheckingWa] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<WhatsAppQrResponse | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  const checkWhatsApp = async () => {
    setIsCheckingWa(true);
    try {
      const st = await whatsappService.getStatus();
      setWaStatus(st);
    } catch {
      setWaStatus({ isOnline: false, state: 'offline' });
    } finally {
      setIsCheckingWa(false);
    }
  };

  const handleOpenQrModal = async () => {
    setIsQrModalOpen(true);
    setIsLoadingQr(true);
    try {
      const data = await whatsappService.getQr();
      setQrData(data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al obtener código QR. Verificá que Docker esté corriendo.', 'error');
    } finally {
      setIsLoadingQr(false);
    }
  };

  useEffect(() => {
    checkWhatsApp();
    const interval = setInterval(checkWhatsApp, 12000);
    return () => clearInterval(interval);
  }, []);

  // Si el modal de QR está abierto, monitorear cada 3s para cerrar al conectar
  useEffect(() => {
    if (!isQrModalOpen) return;
    const interval = setInterval(async () => {
      try {
        const st = await whatsappService.getStatus();
        setWaStatus(st);
        if (st.isOnline) {
          showToast('¡WhatsApp vinculado exitosamente!');
          setIsQrModalOpen(false);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [isQrModalOpen]);

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
                    1. Foto Principal del Banner (Hero)
                  </label>
                  <p className="text-[11px] text-[#6E7B6C] mt-0.5">
                    Imagen grande principal que recibe al cliente en la portada. Recomendado: formato vertical o cuadrado con buena iluminación.
                  </p>
                </div>
                <ImageUploader
                  maxImages={1}
                  value={form.heroImageUrl ? [form.heroImageUrl] : []}
                  onChange={(imgs) => setForm({ ...form, heroImageUrl: imgs[0] || '' })}
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
                  value={form.philosophyImageUrl ? [form.philosophyImageUrl] : []}
                  onChange={(imgs) => setForm({ ...form, philosophyImageUrl: imgs[0] || '' })}
                />
              </div>
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

          {/* Card: Servidor de Envíos Automáticos WhatsApp (Visible para Administradores) */}
          <div className="bg-[#1C231D] text-white rounded-3xl p-6 sm:p-8 border border-[#2D392E] shadow-lg space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2C382D] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-lg font-bold text-white">Servidor de WhatsApp Automático (Gateway)</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Evolution API v2
                    </span>
                  </div>
                  <p className="text-xs text-[#8BA088]">
                    Envía pedidos automáticamente al WhatsApp del negocio y confirma al cliente sin intervención manual.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={checkWhatsApp}
                  disabled={isCheckingWa}
                  className="p-2 text-xs text-[#8BA088] hover:text-white bg-[#141A15] border border-[#2B372C] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Actualizar estado"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingWa ? 'animate-spin' : ''}`} />
                  <span>Verificar</span>
                </button>

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
            </div>

            {/* Estado dinámico de la conexión */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              waStatus?.isOnline
                ? 'bg-emerald-950/30 border-emerald-800/60'
                : waStatus?.state === 'offline'
                ? 'bg-rose-950/30 border-rose-800/60'
                : 'bg-amber-950/30 border-amber-800/60'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full ${
                  waStatus?.isOnline
                    ? 'bg-emerald-400 animate-pulse'
                    : waStatus?.state === 'offline'
                    ? 'bg-rose-500'
                    : 'bg-amber-400 animate-ping'
                }`} />
                <div>
                  <span className="text-sm font-bold text-white block">
                    {waStatus?.isOnline
                      ? 'WhatsApp Conectado y Operativo'
                      : waStatus?.state === 'offline'
                      ? 'Servidor Docker Apagado'
                      : 'Sesión Desconectada (Requiere Escanear QR)'}
                  </span>
                  <span className="text-xs text-[#8BA088]">
                    {waStatus?.isOnline
                      ? 'Los pedidos web se despachan automáticamente a los números de teléfono.'
                      : waStatus?.state === 'offline'
                      ? 'Iniciá Docker Desktop para encender el servicio en segundo plano.'
                      : 'La sesión caducó o no fue vinculada aún. Escaneá el código con tu celular.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {!waStatus?.isOnline && waStatus?.state !== 'offline' && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleOpenQrModal}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md text-xs font-semibold"
                    leftIcon={<QrCode className="w-4 h-4" />}
                  >
                    Vincular WhatsApp (Escanear QR)
                  </Button>
                )}
                {waStatus?.isOnline && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenQrModal}
                    className="border-[#2B372C] text-[#98AC96] hover:text-white text-xs"
                    leftIcon={<QrCode className="w-3.5 h-3.5" />}
                  >
                    Ver QR / Cambiar Número
                  </Button>
                )}
                {waStatus?.state === 'offline' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={checkWhatsApp}
                    className="border-rose-800 text-rose-300 hover:bg-rose-900/40 text-xs"
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Reintentar
                  </Button>
                )}
              </div>
            </div>

            {/* Parámetros técnicos (visibles para superadmin o desarrollador) */}
            {(user?.role?.toLowerCase() === 'superadmin' || user?.permissions?.includes('developer') || user?.name?.toLowerCase() === 'dev') && (
              <div className="pt-2 border-t border-[#2C382D]/60 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E967B] block">
                  Ajustes Técnicos de Red (Desarrollador)
                </span>
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

      {/* Modal para Vincular WhatsApp escaneando el código QR */}
      <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} maxWidth="sm">
        <div className="text-center py-4 px-2 space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <QrCode className="w-8 h-8 text-emerald-600" />
          </div>

          <div>
            <h3 className="font-serif text-2xl font-bold text-[#222A21]">
              Vincular WhatsApp
            </h3>
            <p className="text-xs text-[#6F7B6D] mt-1.5 max-w-xs mx-auto">
              1. Abrí <strong>WhatsApp</strong> en tu celular.<br />
              2. Tocá <strong>Menú (⋮) o Configuración &gt; Dispositivos vinculados</strong>.<br />
              3. Tocá <strong>Vincular un dispositivo</strong> y apuntá tu cámara aquí:
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E5DFD4] shadow-inner inline-block">
            {isLoadingQr ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center gap-3 text-xs text-[#6F7B6D]">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                <span>Generando código QR...</span>
              </div>
            ) : qrData?.base64 ? (
              <img
                src={qrData.base64.startsWith('data:') ? qrData.base64 : `data:image/png;base64,${qrData.base64}`}
                alt="Código QR de WhatsApp"
                className="w-64 h-64 mx-auto rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 flex flex-col items-center justify-center gap-2 p-4 text-xs text-rose-600">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
                <span>No se pudo obtener el QR. Verificá que Docker esté activo.</span>
                <Button variant="outline" size="sm" onClick={handleOpenQrModal} className="mt-2 text-xs">
                  Reintentar
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Esperando escaneo en tiempo real...</span>
          </div>

          <Button variant="outline" size="sm" onClick={() => setIsQrModalOpen(false)} className="w-full">
            Cerrar ventana
          </Button>
        </div>
      </Modal>
    </div>
  );
};
