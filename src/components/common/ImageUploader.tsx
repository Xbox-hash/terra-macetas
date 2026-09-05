import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Link as LinkIcon, FolderOpen, Check } from 'lucide-react';

interface ImageUploaderProps {
  value: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value = [],
  onChange,
  maxImages = 4,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    
    if (!urlInput.trim()) {
      setErrorMessage('Por favor ingresá un enlace.');
      return;
    }

    if (value.length >= maxImages) {
      setErrorMessage(`Máximo ${maxImages} imágenes permitidas.`);
      return;
    }

    // Agregar la url directamente
    onChange([...value, urlInput.trim()]);
    setUrlInput('');
    setIsAddingUrl(false);
  };

  // Selector de archivos locales desde tu PC / Teléfono
  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = maxImages - value.length;
    const filesToRead = Array.from(files).slice(0, availableSlots);

    filesToRead.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64 = loadEvent.target?.result as string;
        if (base64) {
          onChange([...value, base64]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsAddingUrl(false);
  };

  const handleSampleAdd = (sampleUrl: string) => {
    if (value.length < maxImages) {
      onChange([...value, sampleUrl]);
    }
  };

  const sampleImages = [
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=1000&q=80',
  ];

  return (
    <div className="space-y-3">
      {/* Hidden file input for native file browsing */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLocalFileSelect}
        accept="image/*"
        multiple={maxImages > 1}
        className="hidden"
      />

      {/* Grid of uploaded images */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {value.map((img, idx) => (
          <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-[#D5CEC2] bg-[#EFECE6] shadow-xs">
            <img
              src={img}
              alt={`Preview ${idx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback si la url no carga
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80';
              }}
            />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1.5 right-1.5 p-1 bg-black/70 text-white rounded-full hover:bg-rose-600 transition-colors"
              title="Eliminar imagen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {idx === 0 && (
              <span className="absolute bottom-1.5 left-1.5 text-[10px] uppercase font-semibold tracking-wider bg-[#2D3A2F]/90 text-white px-2 py-0.5 rounded shadow-xs">
                Principal
              </span>
            )}
          </div>
        ))}

        {value.length < maxImages && (
          <div
            onClick={() => setIsAddingUrl(true)}
            className="flex flex-col items-center justify-center border-2 border-dashed border-[#D5CEC2] hover:border-[#4A5D4E] bg-white/50 hover:bg-white/90 rounded-xl aspect-square cursor-pointer transition-all p-3 text-center group"
          >
            <UploadCloud className="w-7 h-7 text-[#6A7868] mb-1.5 group-hover:text-[#2D3A2F] transition-colors" />
            <span className="text-xs font-semibold text-[#2D3A2F]">Cargar Imagen</span>
            <span className="text-[10px] text-[#7A8677] mt-0.5">Archivo o URL</span>
          </div>
        )}
      </div>

      {/* Upload/Add Modal or Dropdown */}
      {isAddingUrl && (
        <div className="p-4 bg-[#F2EDE4] rounded-2xl border border-[#DCD5C9] space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-[#E2DBD0] pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4A5748]">
              Opciones para añadir imagen
            </span>
            <button
              type="button"
              onClick={() => setIsAddingUrl(false)}
              className="text-[#6A7768] hover:text-[#2D3A2F]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Option A: Direct local file upload */}
          <div>
            <span className="text-xs font-semibold text-[#2D3A2F] block mb-1.5">
              1. Seleccionar desde tu dispositivo:
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#C5BDB0] bg-white hover:bg-[#F9F7F4] text-xs font-semibold text-[#2D3A2F] transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-[#4A5D4E]" />
              Examinar fotos de mi computadora / celular
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#DED7CB]" />
            <span className="flex-shrink mx-3 text-[11px] uppercase font-bold text-[#8C988A]">o por enlace</span>
            <div className="flex-grow border-t border-[#DED7CB]" />
          </div>

          {/* Option B: Direct URL */}
          <div>
            <span className="text-xs font-semibold text-[#2D3A2F] block mb-1.5">
              2. Pegar link web (Unsplash, Pinterest, etc.):
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUrl();
                  }
                }}
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#CCC4B5] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              />
              <button
                type="button"
                onClick={() => handleAddUrl()}
                className="px-4 py-2 bg-[#2D3A2F] text-white text-xs font-semibold rounded-xl hover:bg-[#3E4E40] transition-colors cursor-pointer"
              >
                Añadir
              </button>
            </div>
            {errorMessage && <p className="text-xs text-rose-600 font-medium mt-1">{errorMessage}</p>}
          </div>

          {/* Option C: Sample presets */}
          <div className="pt-2 border-t border-[#E2DBD0]">
            <span className="text-[11px] font-semibold text-[#5A6557] block mb-2">
              3. O elegí una imagen de muestra botánica:
            </span>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {sampleImages.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSampleAdd(s)}
                  className="w-12 h-12 shrink-0 rounded-xl overflow-hidden border-2 border-transparent hover:border-[#2D3A2F] transition-all relative group"
                  title="Usar esta foto"
                >
                  <img src={s} alt="Muestra" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
