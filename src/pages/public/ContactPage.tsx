import React, { useState } from 'react';
import { Phone, MessageCircle, Mail, MapPin, Clock, Camera, Send, CheckCircle2 } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';

export const ContactPage: React.FC = () => {
  const { config } = useCompany();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('¡Gracias por tu mensaje! Te responderemos a la brevedad.');
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(`¡Hola ${config.storeName}! Quisiera hacer una consulta sobre sus macetas y disponibilidad.`);
    window.open(`https://wa.me/${config.whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[#5E725F]">
          Atención Personalizada
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-medium text-[#222A21]">
          Estamos para asesorarte
        </h1>
        <p className="text-sm sm:text-base text-[#657363] leading-relaxed">
          Ya sea para saber qué tamaño de maceta necesita tu planta, solicitar medidas especiales o consultar costos de envío a tu zona.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left: Contact Information Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#E6E0D5] shadow-xs space-y-6">
            <h2 className="font-serif text-2xl font-bold text-[#222A21]">Canales de Contacto</h2>

            <div className="space-y-5">
              {/* WhatsApp Direct */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#25D366]/15 text-[#1EA851] flex items-center justify-center shrink-0">
                  <MessageCircle className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-xs uppercase font-bold tracking-wider text-[#576455]">WhatsApp Oficial</h3>
                  <p className="text-sm font-semibold text-[#222A21] mt-0.5">{config.whatsappDisplay || config.whatsappNumber}</p>
                  <p className="text-xs text-[#6F7B6D] mt-0.5">Respuesta inmediata en horario comercial</p>
                </div>
              </div>

              {/* Taller / Showroom */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#2D3A2F]/10 text-[#2D3A2F] flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs uppercase font-bold tracking-wider text-[#576455]">Taller & Showroom</h3>
                  <p className="text-sm font-semibold text-[#222A21] mt-0.5">{config.address}</p>
                  <p className="text-xs text-[#6F7B6D] mt-0.5">{config.city}, {config.country}</p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#2D3A2F]/10 text-[#2D3A2F] flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs uppercase font-bold tracking-wider text-[#576455]">Horarios de Atención</h3>
                  <p className="text-sm font-semibold text-[#222A21] mt-0.5">{config.businessHours}</p>
                </div>
              </div>

              {/* Social */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#2D3A2F]/10 text-[#2D3A2F] flex items-center justify-center shrink-0">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs uppercase font-bold tracking-wider text-[#576455]">Instagram</h3>
                  <a
                    href={`https://instagram.com/${config.instagram?.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-[#2D3A2F] hover:underline mt-0.5 block"
                  >
                    {config.instagram}
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E2D6]">
              <Button
                variant="whatsapp"
                size="md"
                className="w-full justify-center"
                onClick={handleOpenWhatsApp}
                leftIcon={<MessageCircle className="w-5 h-5 fill-current" />}
              >
                Abrir chat en WhatsApp
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Message Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-[#E9E4DB] shadow-xs space-y-6">
          <div className="border-b border-[#F0EAE0] pb-4">
            <h2 className="font-serif text-2xl font-bold text-[#222A21]">Envianos tu consulta</h2>
            <p className="text-xs text-[#6F7B6D] mt-1">
              Completá el formulario y nuestro equipo te responderá a tu email o WhatsApp.
            </p>
          </div>

          {submitted ? (
            <div className="py-12 text-center space-y-3 bg-[#F5F2EB] rounded-2xl p-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-serif text-xl font-bold text-[#222A21]">¡Consulta enviada con éxito!</h3>
              <p className="text-xs text-[#627060] max-w-sm mx-auto">
                Recibimos tu mensaje. Si necesitás una respuesta urgente, recordá que también podés escribirnos directo por WhatsApp.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: '', phone: '', email: '', message: '' });
                }}
                className="text-xs font-semibold text-[#2D3A2F] underline pt-2 cursor-pointer"
              >
                Enviar otra consulta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#546252] mb-1.5">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full text-xs px-3.5 py-3 bg-[#FAF8F5] border border-[#D9D2C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#546252] mb-1.5">
                    WhatsApp / Teléfono
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0981 000 000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full text-xs px-3.5 py-3 bg-[#FAF8F5] border border-[#D9D2C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#546252] mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full text-xs px-3.5 py-3 bg-[#FAF8F5] border border-[#D9D2C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#546252] mb-1.5">
                  Mensaje o consulta
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Contanos sobre las macetas que te interesan, medidas o dudas de envío..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full text-xs px-3.5 py-3 bg-[#FAF8F5] border border-[#D9D2C5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto" rightIcon={<Send className="w-4 h-4" />}>
                  Enviar mensaje
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
