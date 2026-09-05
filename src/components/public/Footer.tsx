import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Phone, MapPin, Mail, ArrowUpRight, Camera } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';

export const Footer: React.FC = () => {
  const { config } = useCompany();

  return (
    <footer className="bg-[#232A22] text-[#EDE7DC] pt-16 pb-12 border-t border-[#343F33]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 pb-14 border-b border-[#364235]">
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt={config.storeName} className="w-9 h-9 rounded-full object-cover border border-[#4A5D4E]" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#4A5D4E] flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-[#D4DEC9]" />
                </div>
              )}
              <span className="font-serif text-2xl font-bold tracking-wider text-white">
                {config.storeName || 'TERRA'}
              </span>
            </div>
            <p className="text-sm text-[#B4BFB2] leading-relaxed">
              {config.tagline || 'Diseño, materialidad y naturaleza. Creemos que una maceta no es solo un contenedor, sino la extensión viva del diseño de tu hogar.'}
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 rounded-full bg-[#323D31] text-[#CAD6C6] text-xs font-medium">
                Envíos a todo el país
              </span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-semibold text-white/90 mb-4">
              Explorar
            </h4>
            <ul className="space-y-2.5 text-sm text-[#B4BFB2]">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/catalogo" className="hover:text-white transition-colors">
                  Catálogo Completo
                </Link>
              </li>
              <li>
                <Link to="/#lineas" className="hover:text-white transition-colors">
                  Líneas Exclusivas
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="hover:text-white transition-colors">
                  Atención & Asesoramiento
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Store */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-semibold text-white/90 mb-4">
              Contacto & Taller
            </h4>
            <ul className="space-y-3 text-sm text-[#B4BFB2]">
              {config.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#A1B39D] shrink-0 mt-0.5" />
                  <span>{config.address}, {config.city}</span>
                </li>
              )}
              {config.whatsappDisplay && (
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#A1B39D] shrink-0" />
                  <a href={`https://wa.me/${config.whatsappNumber}`} target="_blank" rel="noreferrer" className="hover:text-white underline-offset-4 hover:underline">
                    {config.whatsappDisplay}
                  </a>
                </li>
              )}
              {config.email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#A1B39D] shrink-0" />
                  <span>{config.email}</span>
                </li>
              )}
              {config.instagram && (
                <li className="flex items-center gap-2.5">
                  <Camera className="w-4 h-4 text-[#A1B39D] shrink-0" />
                  <span>{config.instagram}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Col 4: Botanical note */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-semibold text-white/90 mb-4">
              Asesoramiento Botánico
            </h4>
            <p className="text-sm text-[#B4BFB2] mb-4 leading-relaxed">
              ¿No sabés qué maceta elegir para tu planta? Escribinos por WhatsApp con una foto y te guiamos en la elección.
            </p>
            <a
              href={`https://wa.me/${config.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#8FD9A8] hover:text-white transition-colors"
            >
              Consultar a un especialista <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A9688] gap-4">
          <p>© {new Date().getFullYear()} {config.storeName || 'TERRA'} Macetas. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <Link to="/contacto" className="hover:text-white transition-colors">Términos y Envíos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
