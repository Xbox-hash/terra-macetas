import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Save,
  MessageCircle,
  QrCode,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  WifiOff,
  ShoppingBag,
  Send,
  Smartphone,
  ChevronDown,
  X,
} from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/common/Button';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { StoreConfig } from '../../types';
import { formatPhoneNumber } from '../../utils';
import { whatsappService, WhatsAppStatus, WhatsAppQrResponse } from '../../services/whatsappService';

type ConnectionKind = 'checking' | 'online' | 'disconnected' | 'offline';

const STATUS_UI: Record<ConnectionKind, {
  title: string;
  body: string;
  panel: string;
  iconWrap: string;
  dot: string;
  Icon: React.ElementType;
}> = {
  checking: {
    title: 'Verificando conexión…',
    body: 'Consultando el estado del servidor de WhatsApp.',
    panel: 'bg-white border-[#E5DFD4]',
    iconWrap: 'bg-[#F0EBE1] text-[#4A5D4E]',
    dot: 'bg-[#B8B2A6]',
    Icon: RefreshCw,
  },
  online: {
    title: 'WhatsApp conectado',
    body: 'Los pedidos de la tienda se envían automáticamente al número del negocio.',
    panel: 'bg-[#EEF5EA] border-[#CFDCC8]',
    iconWrap: 'bg-[#1F4D35] text-white',
    dot: 'bg-emerald-500',
    Icon: CheckCircle2,
  },
  disconnected: {
    title: 'Sesión desconectada',
    body: 'La sesión caducó o todavía no se vinculó. Escaneá el código QR con el celular del negocio.',
    panel: 'bg-[#FBF3E2] border-[#EAD7AE]',
    iconWrap: 'bg-[#8A5A0B] text-white',
    dot: 'bg-amber-500',
    Icon: AlertTriangle,
  },
  offline: {
    title: 'Servidor apagado',
    body: 'El servicio de envío no responde. Iniciá Docker y volvé a verificar.',
    panel: 'bg-[#FBEDEB] border-[#EBC5BF]',
    iconWrap: 'bg-[#9B2C1C] text-white',
    dot: 'bg-rose-500',
    Icon: WifiOff,
  },
};

export const WhatsAppAdminPage: React.FC = () => {
  const { openMobileSidebar } = useOutletContext<{ openMobileSidebar: () => void }>();
  const { config, updateConfig } = useCompany();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState<StoreConfig>(config);
  const [isSaving, setIsSaving] = useState(false);

  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>(null);
  const [isCheckingWa, setIsCheckingWa] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrData, setQrData] = useState<WhatsAppQrResponse | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  const isDeveloper =
    user?.role?.toLowerCase() === 'superadmin' ||
    user?.permissions?.includes('developer') ||
    user?.name?.toLowerCase() === 'dev';

  const connection: ConnectionKind = !waStatus
    ? 'checking'
    : waStatus.isOnline
    ? 'online'
    : waStatus.state === 'offline'
    ? 'offline'
    : 'disconnected';
  const ui = STATUS_UI[connection];
  const gatewayEnabled = form.whatsappGatewayEnabled ?? true;

  const checkWhatsApp = async () => {
    setIsCheckingWa(true);
    try {
      const st = await whatsappService.getStatus();
      setWaStatus(st);
    } catch {
      setWaStatus({ isOnline: false, state: 'offline' });
    } finally {
      setIsCheckingWa(false);
      setLastCheck(new Date());
    }
  };

  const loadQr = async () => {
    setIsQrOpen(true);
    setIsLoadingQr(true);
    try {
      const data = await whatsappService.getQr();
      setQrData(data);
    } catch (err: any) {
      setQrData(null);
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

  // Con el QR abierto, revisar cada 3s y cerrarlo cuando se vincule
  useEffect(() => {
    if (!isQrOpen) return;
    const interval = setInterval(async () => {
      try {
        const st = await whatsappService.getStatus();
        setWaStatus(st);
        setLastCheck(new Date());
        if (st.isOnline) {
          showToast('¡WhatsApp vinculado exitosamente!');
          setIsQrOpen(false);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [isQrOpen]);

  useEffect(() => {
    setForm(config);
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.whatsappNumber.trim()) {
      showToast('El número de WhatsApp es obligatorio.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateConfig({
        ...form,
        whatsappDisplay: formatPhoneNumber(form.whatsappNumber),
      });
      showToast('¡Configuración de WhatsApp actualizada con éxito!');
    } catch (err: any) {
      showToast(err.message || 'Error al guardar la configuración.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const qrSrc = qrData?.base64
    ? qrData.base64.startsWith('data:')
      ? qrData.base64
      : `data:image/png;base64,${qrData.base64}`
    : null;

  const inputClass =
    'w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D9D1C2] rounded-xl text-sm text-[#222A21] focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-[#475446] mb-1.5';

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="WhatsApp y Pedidos"
        subtitle="Conexión, número de pedidos y envío automático"
        onOpenMobileSidebar={openMobileSidebar}
        actions={
          <Button
            type="submit"
            form="whatsapp-form"
            variant="primary"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Guardar
          </Button>
        }
      />

      <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
        {/* 1. Estado de la conexión: lo primero que se ve */}
        <section className={`rounded-3xl border p-6 sm:p-8 ${ui.panel}`} aria-live="polite">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-start gap-5 flex-1 min-w-0">
              <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center ${ui.iconWrap}`}>
                <ui.Icon className={`w-8 h-8 ${connection === 'checking' ? 'animate-spin' : ''}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${ui.dot} ${connection === 'online' ? 'animate-pulse' : ''}`} />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#4F5A4D]">
                    Estado de la conexión
                  </span>
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#222A21] leading-tight">
                  {ui.title}
                </h2>
                <p className="text-sm text-[#47524A] mt-1.5 max-w-xl">{ui.body}</p>
                <p className="text-xs text-[#5A6757] mt-3">
                  {waStatus?.instanceName && <>Instancia <strong>{waStatus.instanceName}</strong> · </>}
                  {lastCheck ? `Última verificación ${lastCheck.toLocaleTimeString('es-PY')}` : 'Sin verificar aún'}
                  {!gatewayEnabled && ' · Envío automático pausado'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={checkWhatsApp}
                disabled={isCheckingWa}
                leftIcon={<RefreshCw className={`w-4 h-4 ${isCheckingWa ? 'animate-spin' : ''}`} />}
              >
                Verificar
              </Button>
              {connection === 'disconnected' && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={loadQr}
                  className="bg-[#1F4D35] hover:bg-[#1A3F2C]"
                  leftIcon={<QrCode className="w-4 h-4" />}
                >
                  Vincular WhatsApp
                </Button>
              )}
              {connection === 'online' && (
                <Button type="button" variant="outline" onClick={loadQr} leftIcon={<QrCode className="w-4 h-4" />}>
                  Cambiar número vinculado
                </Button>
              )}
            </div>
          </div>

          {/* QR dentro de la misma página */}
          {isQrOpen && (
            <div className="mt-6 pt-6 border-t border-black/10 flex flex-col md:flex-row gap-8 items-center">
              <div className="w-64 h-64 shrink-0 bg-white rounded-2xl border border-[#E5DFD4] p-3 flex items-center justify-center">
                {isLoadingQr ? (
                  <div className="flex flex-col items-center gap-3 text-xs text-[#5A6757]">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#1F4D35]" />
                    Generando código QR…
                  </div>
                ) : qrSrc ? (
                  <img src={qrSrc} alt="Código QR para vincular WhatsApp" className="w-full h-full rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center text-xs text-rose-700">
                    <AlertTriangle className="w-8 h-8" />
                    No se pudo obtener el QR.
                    <Button type="button" variant="outline" size="sm" onClick={loadQr}>
                      Reintentar
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <ol className="space-y-3">
                  {[
                    <>Abrí <strong>WhatsApp</strong> en el celular del negocio.</>,
                    <>Tocá <strong>Menú (⋮) › Dispositivos vinculados</strong>.</>,
                    <>Tocá <strong>Vincular un dispositivo</strong> y escaneá el código.</>,
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 items-start text-sm text-[#3B463C]">
                      <span className="w-7 h-7 shrink-0 rounded-full bg-[#1F4D35] text-white text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 text-xs text-[#1F4D35] bg-white/70 py-2 px-3 rounded-xl border border-[#CFDCC8]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Esperando escaneo…
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsQrOpen(false)} leftIcon={<X className="w-4 h-4" />}>
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2. Cómo viaja un pedido */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { Icon: ShoppingBag, title: 'El cliente arma su pedido', text: 'Desde el carrito de la tienda.' },
            { Icon: MessageCircle, title: 'Llega a tu WhatsApp', text: form.whatsappNumber ? formatPhoneNumber(form.whatsappNumber) : 'Configurá el número abajo.' },
            { Icon: Send, title: 'El cliente recibe confirmación', text: gatewayEnabled ? 'Automática, sin intervención.' : 'Pausado: hay que responder a mano.' },
          ].map(({ Icon, title, text }, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-[#F2EDE4] border border-[#E2DBD0]">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-white text-[#2D3A2F] flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#222A21]">{title}</p>
                <p className="text-xs text-[#5A6757] truncate">{text}</p>
              </div>
            </div>
          ))}
        </section>

        {/* 3. Ajustes */}
        <form id="whatsapp-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Número */}
          <section className="lg:col-span-3 bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD4] space-y-5">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#2D3A2F]" />
              <h3 className="font-serif text-xl font-bold text-[#222A21]">Número de pedidos</h3>
            </div>
            <div>
              <label htmlFor="wa-number" className={labelClass}>
                Número de WhatsApp *
              </label>
              <input
                id="wa-number"
                type="tel"
                inputMode="numeric"
                required
                placeholder="595981234567"
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value.replace(/[^0-9]/g, '') })}
                className={`${inputClass} text-lg font-semibold tracking-wide`}
              />
              <p className="text-xs text-[#5A6757] mt-1.5">
                Con código de país, sin signos. Ej: 595981234567 (Paraguay) o 5545999887766 (Brasil).
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE7DC]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5A6757]">Así se ve en la tienda</span>
              <span className="text-base font-bold text-[#222A21]">
                {form.whatsappNumber ? formatPhoneNumber(form.whatsappNumber) : '—'}
              </span>
            </div>
            <p className="text-xs text-[#5A6757]">
              El nombre, logo, fotos y dirección se editan en{' '}
              <Link to="/admin/empresa" className="font-semibold text-[#2D3A2F] underline">
                Datos de la Empresa
              </Link>
              .
            </p>
          </section>

          {/* Envío automático + técnicos */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-3xl p-6 border border-[#E5DFD4] space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#222A21]">Envío automático</h3>
                  <p className="text-xs text-[#5A6757] mt-1">
                    Reenvía cada pedido al negocio y confirma al cliente. Usa Evolution API v2.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={gatewayEnabled}
                  aria-label="Envío automático"
                  onClick={() => setForm({ ...form, whatsappGatewayEnabled: !gatewayEnabled })}
                  className={`relative w-12 h-7 shrink-0 rounded-full transition-colors cursor-pointer ${
                    gatewayEnabled ? 'bg-[#1F4D35]' : 'bg-[#B8B2A6]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      gatewayEnabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
              <p className={`text-sm font-semibold ${gatewayEnabled ? 'text-[#1F4D35]' : 'text-[#6B5F4F]'}`}>
                {gatewayEnabled ? 'Activo' : 'Pausado'}
              </p>
            </section>

            {isDeveloper && (
              <section className="bg-white rounded-3xl border border-[#E5DFD4] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTechnical(!showTechnical)}
                  aria-expanded={showTechnical}
                  className="w-full flex items-center justify-between gap-3 p-6 text-left cursor-pointer hover:bg-[#FAF8F5]"
                >
                  <span>
                    <span className="block font-serif text-xl font-bold text-[#222A21]">Ajustes técnicos</span>
                    <span className="block text-xs text-[#5A6757]">Solo superadmin / desarrollador</span>
                  </span>
                  <ChevronDown className={`w-5 h-5 text-[#2D3A2F] transition-transform ${showTechnical ? 'rotate-180' : ''}`} />
                </button>
                {showTechnical && (
                  <div className="px-6 pb-6 space-y-4 border-t border-[#EFE9DE] pt-5">
                    <div>
                      <label htmlFor="wa-url" className={labelClass}>URL servidor Evolution API</label>
                      <input
                        id="wa-url"
                        type="text"
                        value={form.whatsappApiUrl || 'http://localhost:8080'}
                        onChange={(e) => setForm({ ...form, whatsappApiUrl: e.target.value })}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                    <div>
                      <label htmlFor="wa-instance" className={labelClass}>Nombre de instancia</label>
                      <input
                        id="wa-instance"
                        type="text"
                        value={form.whatsappInstanceName || 'terra_bot'}
                        onChange={(e) => setForm({ ...form, whatsappInstanceName: e.target.value })}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                    <div>
                      <label htmlFor="wa-key" className={labelClass}>API key</label>
                      <input
                        id="wa-key"
                        type="password"
                        autoComplete="new-password"
                        value={form.whatsappApiKey || ''}
                        onChange={(e) => setForm({ ...form, whatsappApiKey: e.target.value })}
                        placeholder={form.whatsappApiKeyConfigured ? 'Guardada · dejar vacío para mantenerla' : 'Sin configurar'}
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        </form>
      </main>
    </div>
  );
};
