import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ArrowRight, Camera, Eye, MessageCircle, Package, Plus, ShoppingBag, TrendingUp } from 'lucide-react';
import { dashboardService, DashboardStats } from '../../services/orderService';
import { workService } from '../../services/workService';
import { ClientWork, Order } from '../../types';
import { formatPrice } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminAccess } from '../../components/admin/AdminNav';
import { AdminHeader } from '../../components/admin/AdminHeader';

const isPending = (o: Order) => (o.status as string)?.trim().toLowerCase() === 'pendiente';

function greeting(date: Date) {
  const h = date.getHours();
  if (h < 12) return 'Buen día';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}

const pieces = (o: Order) => (o.items ?? []).reduce((n, it) => n + (it.quantity || 0), 0);

/** Inicio del panel: lo que hay que atender hoy primero, los números al final. */
export const HomeAdminPage: React.FC = () => {
  const { user } = useAuth();
  const { openMobileSidebar } = useOutletContext<{ openMobileSidebar: () => void }>();
  const can = useAdminAccess();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [works, setWorks] = useState<ClientWork[]>([]);

  useEffect(() => {
    let alive = true;
    const load = () => dashboardService.getStats().then((s) => alive && setStats(s)).catch(() => {});
    load();
    const t = window.setInterval(() => !document.hidden && load(), 30000);
    if (can(['products'])) workService.getAll().then((w) => alive && setWorks(w));
    return () => {
      alive = false;
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = new Date();
  const pending = (stats?.recentOrders ?? []).filter(isPending).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const oldest = pending[0];
  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title={`${greeting(now)}${firstName ? `, ${firstName}` : ''}`}
        subtitle={now.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' })}
        onOpenMobileSidebar={openMobileSidebar}
        actions={
          <a href="/" target="_blank" rel="noreferrer" className="hidden sm:inline-flex text-sm font-semibold text-[#2D3A2F] hover:underline items-center gap-1">
            Ver la tienda <ArrowRight className="w-4 h-4" />
          </a>
        }
      />
    <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
      {/* Tareas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/admin/pedidos?estado=pendientes"
          className="group rounded-2xl bg-[#2D3A2F] text-[#FAF8F5] p-5 sm:p-6 flex flex-col justify-between gap-6 min-h-[150px] hover:bg-[#33433A] transition-colors"
        >
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#C4D1B8] inline-flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" /> Para responder
          </span>
          <span className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">
            {stats === null ? '…' : pending.length === 0 ? 'Sin pedidos pendientes' : `${pending.length} ${pending.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'}`}
          </span>
          <span className="text-sm text-[#CAD6C6] inline-flex items-center gap-1.5">
            {oldest ? `El más viejo es de ${timeAgo(oldest.createdAt)}` : 'Ver todos los pedidos'}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

        {can(['products']) && (
          <Link
            to="/admin/trabajos/nuevo"
            className="group rounded-2xl bg-[#EDE7DC] p-5 sm:p-6 flex flex-col justify-between gap-6 min-h-[150px] hover:bg-[#E5DDCF] transition-colors"
          >
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#5E725F] inline-flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Trabajos realizados
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-semibold leading-tight text-[#222A21]">Subí las fotos de una instalación</span>
            <span className="text-sm font-semibold text-[#2D3A2F] inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Subir trabajo
            </span>
          </Link>
        )}

        {can(['products']) && (
          <Link
            to="/admin/productos"
            className="group rounded-2xl bg-white border border-[#E5DFD4] p-5 sm:p-6 flex flex-col justify-between gap-6 min-h-[150px] hover:border-[#2D3A2F]/30 transition-colors md:col-span-2 lg:col-span-1"
          >
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#5E725F] inline-flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Catálogo
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-semibold leading-tight text-[#222A21]">
              {stats ? `${stats.totalProducts} piezas en ${stats.totalLines} líneas` : '…'}
            </span>
            <span className="text-sm text-[#6F7B6D] inline-flex items-center gap-1.5">
              Administrar productos <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Pedidos pendientes */}
        <section className="lg:col-span-3 bg-white rounded-2xl border border-[#E5DFD4] p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-serif text-xl font-semibold text-[#222A21]">Pedidos para responder</h2>
            <Link to="/admin/pedidos" className="text-xs font-semibold text-[#2D3A2F] hover:underline">
              Ver todos
            </Link>
          </div>
          {stats === null ? (
            <div className="space-y-2 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-[#F3EFE7] animate-pulse" />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <p className="text-sm text-[#6F7B6D] py-6 text-center">No hay pedidos esperando respuesta.</p>
          ) : (
            <ul className="divide-y divide-[#F2ECE2]">
              {pending.slice(0, 5).map((o) => {
                const phone = o.customerPhone?.replace(/[^0-9]/g, '');
                return (
                  <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#222A21] truncate">{o.customerName || 'Cliente'}</p>
                      <p className="text-xs text-[#6F7B6D]">
                        {pieces(o)} {pieces(o) === 1 ? 'pieza' : 'piezas'} · <span className="tabular-nums">{formatPrice(o.total)}</span> · {timeAgo(o.createdAt)}
                      </p>
                    </div>
                    {phone && (
                      <a
                        href={`https://wa.me/${phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#25D366] text-[#10301A] text-xs font-bold px-3 py-2 hover:brightness-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Trabajos */}
        {can(['products']) && (
          <section className="lg:col-span-2 bg-white rounded-2xl border border-[#E5DFD4] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-xl font-semibold text-[#222A21]">Trabajos realizados</h2>
              <Link to="/admin/trabajos" className="text-xs font-semibold text-[#2D3A2F] hover:underline">
                {works.length > 0 ? `${works.length} cargados` : 'Ver'}
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {works.slice(0, 3).map((w) => (
                <Link key={w.id} to="/admin/trabajos" className="aspect-square rounded-xl overflow-hidden bg-[#F0ECE4]">
                  {w.images[0] && <img src={w.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />}
                </Link>
              ))}
              <Link
                to="/admin/trabajos/nuevo"
                className="aspect-square rounded-xl border-2 border-dashed border-[#C9C1B2] bg-[#F7F4EE] text-[#2D3A2F] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold hover:border-[#2D3A2F]"
              >
                <Plus className="w-5 h-5" /> Subir
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* Números */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5DFD4] p-5">
          <span className="text-xs text-[#6F7B6D] inline-flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Visitas hoy
          </span>
          <p className="font-serif text-3xl font-semibold text-[#222A21] tabular-nums mt-1">{stats ? stats.visitsToday.toLocaleString('es-PY') : '…'}</p>
          <p className="text-xs text-[#6F7B6D] mt-1">{stats ? `${stats.totalVisits.toLocaleString('es-PY')} en total` : ''}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5DFD4] p-5">
          <span className="text-xs text-[#6F7B6D] inline-flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" /> Pedidos
          </span>
          <p className="font-serif text-3xl font-semibold text-[#222A21] tabular-nums mt-1">{stats ? stats.totalOrders : '…'}</p>
          <p className="text-xs text-[#6F7B6D] mt-1">{stats ? `${stats.closedOrders} cerrados · ${stats.pendingOrders} pendientes` : ''}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5DFD4] p-5">
          <span className="text-xs text-[#6F7B6D] inline-flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Vendido (pedidos cerrados)
          </span>
          <p className="font-serif text-3xl font-semibold text-[#222A21] tabular-nums mt-1">{stats ? formatPrice(stats.totalRevenue) : '…'}</p>
          {can(['analytics']) && (
            <Link to="/admin/reportes" className="text-xs font-semibold text-[#2D3A2F] hover:underline mt-1 inline-block">
              Ver reportes
            </Link>
          )}
        </div>
      </div>
    </main>
    </div>
  );
};
