import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Camera, Images, Loader2, X } from 'lucide-react';
import { Product } from '../../types';
import { workService, workTitle } from '../../services/workService';
import { productService } from '../../services/productService';
import { uploadService } from '../../services/uploadService';
import { compressImageFile } from '../../utils/imageCompressor';
import { ImageUploader } from '../../components/common/ImageUploader';
import { useToast } from '../../contexts/ToastContext';
import { posicionFoco } from '../../utils/encuadre';
import { SelectorPieza } from '../../components/admin/SelectorPieza';

const MAX_IMAGES = 8;
const STEPS = ['Fotos', 'Orden', 'Datos'] as const;

const Toggle: React.FC<{ id: string; checked: boolean; onChange: (v: boolean) => void; label: string; help: string }> = ({
  id,
  checked,
  onChange,
  label,
  help,
}) => (
  <label htmlFor={id} className="flex items-start justify-between gap-4 cursor-pointer select-none p-3.5 rounded-xl border border-[#E5DFD4] bg-white">
    <span>
      <span className="block text-sm font-semibold text-[#2D3A2F]">{label}</span>
      <span className="block text-xs text-[#6E7B6C] mt-0.5">{help}</span>
    </span>
    <span className="relative mt-0.5 shrink-0">
      <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="block w-11 h-6 rounded-full bg-[#CFC8BA] peer-checked:bg-[#2D3A2F] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#2D3A2F] peer-focus-visible:ring-offset-2" />
      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
    </span>
  </label>
);

/**
 * Subir un trabajo en 3 pasos. En el celular se ve un paso por pantalla;
 * en tablet horizontal y computadora los 3 pasos se ven juntos.
 */
export const WorksNewPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientName: '',
    city: '',
    description: '',
    productId: '',
    showClientName: false,
    featured: false,
  });

  useEffect(() => {
    productService.getAll().then(setProducts).catch(() => setProducts([]));
  }, []);

  const preview = workTitle(form);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slots = MAX_IMAGES - images.length;
    const list = Array.from(files).slice(0, slots);
    if (files.length > slots) showToast(`Se pueden cargar hasta ${MAX_IMAGES} fotos por trabajo.`, 'info');
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        const compressed = await compressImageFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
        const url = await uploadService.uploadBase64(compressed, 'works');
        setImages((prev) => (prev.length < MAX_IMAGES ? [...prev, url] : prev));
      } catch {
        showToast(`No se pudo subir "${file.name}". Probá de nuevo.`, 'error');
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const save = async (active: boolean) => {
    if (images.length === 0) {
      showToast('Subí al menos una foto del trabajo.', 'error');
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      await workService.create({
        images,
        clientName: form.clientName,
        showClientName: form.showClientName,
        city: form.city,
        description: form.description,
        productId: form.productId || null,
        active,
        featured: form.featured,
        sortOrder: 0,
      });
      showToast(active ? 'Trabajo publicado.' : 'Trabajo guardado sin publicar.');
      navigate('/admin/trabajos');
    } catch (err: any) {
      showToast(err.message || 'No se pudo guardar el trabajo', 'error');
    } finally {
      setSaving(false);
    }
  };

  // En pantallas chicas solo se ve el paso actual; desde lg se ven todos
  const stepClass = (i: number) => `${step === i ? 'block' : 'hidden'} lg:block`;
  const canNext = step === 0 ? images.length > 0 && uploading === 0 : true;

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 sm:py-8">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => (step > 0 && window.innerWidth < 1024 ? setStep(step - 1) : navigate('/admin/trabajos'))}
            className="p-2 -ml-2 rounded-full hover:bg-[#EDE7DC] text-[#2D3A2F] cursor-pointer"
            aria-label={step > 0 ? 'Paso anterior' : 'Volver a trabajos'}
          >
            {step > 0 ? <ArrowLeft className="w-5 h-5 lg:hidden" /> : null}
            <X className={`w-5 h-5 ${step > 0 ? 'hidden lg:block' : ''}`} />
          </button>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#222A21] truncate">Nuevo trabajo</h1>
        </div>
        <span className="lg:hidden text-sm font-semibold text-[#6F7B6D] tabular-nums">
          {step + 1}/{STEPS.length}
        </span>
      </div>

      {/* Progreso (celular y tablet) */}
      <div className="lg:hidden flex gap-1.5 mb-5" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-[#2D3A2F]' : 'bg-[#E2DBD0]'}`} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Paso 1: fotos */}
        <section className={stepClass(0)} aria-labelledby="paso-1">
          <h2 id="paso-1" className="text-[11px] font-bold uppercase tracking-widest text-[#5E725F] mb-3">
            1 · Elegí las fotos
          </h2>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div
            className="rounded-2xl border-2 border-dashed border-[#C9C1B2] bg-white p-5 space-y-4 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                disabled={images.length >= MAX_IMAGES}
                className="h-24 rounded-xl bg-[#2D3A2F] text-white flex flex-col items-center justify-center gap-1.5 text-sm font-semibold hover:bg-[#3E4E40] disabled:opacity-40 cursor-pointer"
              >
                <Camera className="w-6 h-6" /> Sacar foto
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={images.length >= MAX_IMAGES}
                className="h-24 rounded-xl bg-[#EDE7DC] text-[#2D3A2F] flex flex-col items-center justify-center gap-1.5 text-sm font-semibold hover:bg-[#E5DDCF] disabled:opacity-40 cursor-pointer"
              >
                <Images className="w-6 h-6" /> Galería
              </button>
            </div>
            <p className="text-xs text-[#6F7B6D]">
              <span className="hidden lg:inline">O arrastrá las fotos acá. </span>Hasta {MAX_IMAGES} fotos; se comprimen solas antes de subirse.
            </p>
            {(images.length > 0 || uploading > 0) && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((src, i) => (
                  <div key={src} className="relative aspect-square rounded-lg overflow-hidden bg-[#F0ECE4]">
                    <img src={src} alt="" className="w-full h-full object-cover" style={posicionFoco(src)} />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold uppercase bg-[#2D3A2F]/90 text-white px-1.5 py-0.5 rounded">Portada</span>
                    )}
                  </div>
                ))}
                {Array.from({ length: uploading }, (_, i) => (
                  <div key={`up-${i}`} className="aspect-square rounded-lg bg-[#F0ECE4] grid place-items-center text-[#4A5D4E]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Paso 2: orden */}
        <section className={stepClass(1)} aria-labelledby="paso-2">
          <h2 id="paso-2" className="text-[11px] font-bold uppercase tracking-widest text-[#5E725F] mb-3">
            2 · Ordená
          </h2>
          <p className="text-xs text-[#6F7B6D] mb-3">
            La primera es la portada. Arrastrá las fotos, usá las flechas o tocá "Hacer principal". Con el ícono de la mira elegís qué parte de la foto se ve cuando se recorta (por ejemplo, para que la maceta no quede cortada).
          </p>
          {images.length === 0 ? (
            <div className="rounded-2xl border border-[#E5DFD4] bg-white p-8 text-center text-sm text-[#6F7B6D]">Primero subí las fotos del trabajo.</div>
          ) : (
            <ImageUploader maxImages={MAX_IMAGES} folder="works" value={images} onChange={setImages} />
          )}
        </section>

        {/* Paso 3: datos */}
        <section className={`${stepClass(2)} space-y-4`} aria-labelledby="paso-3">
          <h2 id="paso-3" className="text-[11px] font-bold uppercase tracking-widest text-[#5E725F]">
            3 · Datos y publicar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="nw-client" className="block text-xs font-semibold text-[#475446]">
                Para quién <span className="font-normal text-[#7E8B7D]">(opcional)</span>
              </label>
              <input
                id="nw-client"
                maxLength={150}
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                placeholder="Ej: Familia B."
                className="w-full px-3.5 py-3 bg-white border border-[#D9D3C7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="nw-city" className="block text-xs font-semibold text-[#475446]">
                Ciudad <span className="font-normal text-[#7E8B7D]">(opcional)</span>
              </label>
              <input
                id="nw-city"
                maxLength={120}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ej: Luque"
                className="w-full px-3.5 py-3 bg-white border border-[#D9D3C7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="nw-desc" className="block text-xs font-semibold text-[#475446]">
              Descripción <span className="font-normal text-[#7E8B7D]">(opcional)</span>
            </label>
            <textarea
              id="nw-desc"
              rows={3}
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Qué se hizo y dónde quedó."
              className="w-full px-3.5 py-3 bg-white border border-[#D9D3C7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="nw-product" className="block text-xs font-semibold text-[#475446]">
              Pieza usada <span className="font-normal text-[#7E8B7D]">(opcional)</span>
            </label>
            <SelectorPieza id="nw-product" products={products} value={form.productId} onChange={(id) => setForm({ ...form, productId: id })} />
          </div>
          <Toggle
            id="nw-show-name"
            checked={form.showClientName}
            onChange={(v) => setForm({ ...form, showClientName: v })}
            label="Mostrar el nombre del cliente"
            help="Solo si dio permiso. Si no, se muestra la ciudad."
          />
          <Toggle
            id="nw-featured"
            checked={form.featured}
            onChange={(v) => setForm({ ...form, featured: v })}
            label="Destacado en el inicio"
            help="Aparece en el carrusel de la página principal."
          />

          {/* Así se ve */}
          {images[0] && (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#1F2720]">
              <img src={images[0]} alt="" className="absolute inset-0 w-full h-full object-cover" style={posicionFoco(images[0])} />
              <div className="absolute inset-x-0 bottom-0 p-4 pt-12 bg-gradient-to-t from-[#1A221B]/90 to-transparent text-white">
                <span className="block text-[9px] uppercase tracking-widest opacity-80">{preview.eyebrow}</span>
                <span className="block font-serif text-lg font-semibold leading-tight">{preview.title}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => save(true)}
              disabled={saving || uploading > 0}
              className="h-12 rounded-xl bg-[#2D3A2F] text-white text-sm font-semibold hover:bg-[#3E4E40] disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Publicar trabajo
            </button>
            <button
              type="button"
              onClick={() => save(false)}
              disabled={saving || uploading > 0}
              className="h-11 rounded-xl text-sm font-semibold text-[#2D3A2F] hover:bg-[#EDE7DC] disabled:opacity-50 cursor-pointer"
            >
              Guardar sin publicar
            </button>
          </div>
        </section>
      </div>

      {/* Siguiente (celular y tablet) */}
      {step < 2 && (
        <div className="lg:hidden mt-6">
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
            className="w-full h-12 rounded-xl bg-[#2D3A2F] text-white text-sm font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {step === 0
              ? uploading > 0
                ? 'Subiendo fotos…'
                : images.length > 0
                ? `Siguiente · ${images.length} ${images.length === 1 ? 'foto' : 'fotos'}`
                : 'Elegí al menos una foto'
              : 'Siguiente'}
            {canNext && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      )}

      <p className="hidden lg:block text-xs text-[#7E8B7D] mt-6">
        <Link to="/admin/trabajos" className="underline">
          Volver a trabajos
        </Link>{' '}
        sin guardar.
      </p>
    </main>
  );
};
