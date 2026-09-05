import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { 
  Eye, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  Package, 
  ArrowUpRight, 
  Check, 
  RotateCcw, 
  Trash2, 
  Phone, 
  MessageCircle, 
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/common/Button';
import { formatPrice } from '../../utils';
import { dashboardService, orderService, DashboardStats } from '../../services/orderService';
import { useToast } from '../../contexts/ToastContext';
import { Order } from '../../types';

export const DashboardPage: React.FC = () => {
  const { openMobileSidebar } = useOutletContext<{ openMobileSidebar: () => void }>();
  const { showToast } = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    totalVisits: 0,
    visitsToday: 0,
    totalOrders: 0,
    pendingOrders: 0,
    closedOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalLines: 0,
    recentOrders: [],
  });

  const [filterStatus, setFilterStatus] = useState<'all' | 'Pendiente' | 'Cerrado'>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCloseOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      await orderService.closeOrder(orderId);
      showToast(`Pedido #${orderId.substring(0, 8)} marcado como CERRADO.`);
      loadDashboardData();
    } catch (err: any) {
      showToast('Error al cerrar pedido', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReopenOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      await orderService.reopenOrder(orderId);
      showToast(`Pedido #${orderId.substring(0, 8)} reabierto a PENDIENTE.`);
      loadDashboardData();
    } catch (err: any) {
      showToast('Error al reabrir pedido', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrders = stats.recentOrders.filter((o) => {
    if (filterStatus === 'all') return true;
    return o.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Dashboard de Métricas & Pedidos"
        subtitle="Monitoreo en tiempo real de visitas a la tienda, pedidos por WhatsApp y estado de ventas"
        onOpenMobileSidebar={openMobileSidebar}
        actions={
          <Button variant="outline" size="sm" onClick={loadDashboardData} isLoading={loading}>
            Actualizar datos
          </Button>
        }
      />

      <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* 1. Visitas a la web */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5DFD4] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6D7B6C]">
                Visitas a la Tienda
              </span>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold font-serif text-[#222A21]">
                {stats.totalVisits.toLocaleString()}
              </h3>
              <p className="text-xs text-[#586656] mt-1 flex items-center gap-1">
                <span className="font-semibold text-emerald-700">+{stats.visitsToday}</span> visitas hoy
              </p>
            </div>
          </div>

          {/* 2. Total Pedidos Realizados */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5DFD4] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6D7B6C]">
                Pedidos Realizados
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold font-serif text-[#222A21]">
                {stats.totalOrders}
              </h3>
              <p className="text-xs text-[#586656] mt-1">
                Enviados desde el carrito vía WhatsApp
              </p>
            </div>
          </div>

          {/* 3. Pedidos Pendientes */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5DFD4] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6D7B6C]">
                Pedidos Pendientes
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold font-serif text-amber-800">
                {stats.pendingOrders}
              </h3>
              <p className="text-xs text-amber-700 font-medium mt-1">
                Requieren confirmación / entrega
              </p>
            </div>
          </div>

          {/* 4. Pedidos Cerrados / Facturación */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5DFD4] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6D7B6C]">
                Pedidos Cerrados
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold font-serif text-emerald-900">
                {stats.closedOrders}
              </h3>
              <p className="text-xs text-[#4A5D4E] font-bold mt-1">
                Total: {formatPrice(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Section: Gestor de Pedidos con Acción de Cierre */}
        <div className="bg-white rounded-3xl border border-[#E5DFD4] shadow-xs overflow-hidden">
          <div className="p-5 sm:p-7 border-b border-[#EFE9DE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#222A21]">
                Gestión de Pedidos & Estado
              </h2>
              <p className="text-xs text-[#6F7B6D] mt-0.5">
                Revisá los pedidos recibidos y marcá como <strong>Cerrado</strong> cuando se haya completado el pago o la entrega.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 bg-[#F2EDE4] p-1 rounded-2xl">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === 'all'
                    ? 'bg-[#2D3A2F] text-white shadow-xs'
                    : 'text-[#586656] hover:text-[#222A21]'
                }`}
              >
                Todos ({stats.recentOrders.length})
              </button>
              <button
                onClick={() => setFilterStatus('Pendiente')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === 'Pendiente'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'text-[#586656] hover:text-amber-800'
                }`}
              >
                Pendientes ({stats.pendingOrders})
              </button>
              <button
                onClick={() => setFilterStatus('Cerrado')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === 'Cerrado'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-[#586656] hover:text-emerald-800'
                }`}
              >
                Cerrados ({stats.closedOrders})
              </button>
            </div>
          </div>

          {/* Table of Orders */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2D3A2F]">
              <thead className="bg-[#F8F5EE] text-[#556253] uppercase text-[10px] font-bold tracking-wider border-b border-[#EFE9DE]">
                <tr>
                  <th className="px-6 py-4">ID Pedido / Fecha</th>
                  <th className="px-6 py-4">Cliente / Notas</th>
                  <th className="px-6 py-4">Productos</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE2]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#7E8B7D]">
                      Cargando pedidos de SQL Server...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#7E8B7D]">
                      <div className="max-w-sm mx-auto space-y-2">
                        <ShoppingBag className="w-8 h-8 opacity-40 mx-auto text-[#4A5D4E]" />
                        <p className="font-semibold text-sm text-[#222A21]">No hay pedidos con este filtro</p>
                        <p className="text-xs text-[#7A8877]">
                          Cuando los clientes agreguen macetas al carrito y presionen "Enviar por WhatsApp", aparecerán automáticamente aquí.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isClosed = order.status.toLowerCase() === 'cerrado';

                    return (
                      <tr key={order.id} className="hover:bg-[#FAF8F4] transition-colors">
                        <td className="px-6 py-4 align-top">
                          <span className="font-mono font-bold text-sm text-[#222A21] block">
                            #{order.id}
                          </span>
                          <span className="text-[11px] text-[#7A8678] flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleDateString('es-PY', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-top max-w-xs">
                          <span className="font-bold text-sm text-[#222A21] block">
                            {order.customerName || 'Cliente WhatsApp'}
                          </span>
                          {order.notes && (
                            <p className="text-xs text-[#5D6B5C] bg-[#F2EDE4] p-2 rounded-lg mt-1 leading-snug">
                              {order.notes}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 align-top">
                          <div className="space-y-1 max-w-xs">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-xs">
                                  <span className="font-medium text-[#222A21] line-clamp-1">
                                    {item.quantity || item.Quantity}x {item.productName || item.product?.name || item.ProductName}
                                  </span>
                                  <span className="text-[#6F7B6D] ml-2">
                                    {formatPrice(item.subtotal || item.Subtotal || 0)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-neutral-400 italic">Detalle en WhatsApp</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 align-top">
                          <span className="text-base font-bold text-[#222A21] block">
                            {formatPrice(order.total)}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-[#4A5D4E] font-semibold">
                            {order.channel}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-top">
                          {isClosed ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Cerrado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              Pendiente
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 align-top text-right">
                          {isClosed ? (
                            <button
                              onClick={() => handleReopenOrder(order.id)}
                              disabled={actionLoadingId === order.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D5CEC2] hover:bg-[#EAE4D7] text-xs font-semibold text-[#5A6858] transition-colors cursor-pointer"
                              title="Reabrir a estado pendiente"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Reabrir
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCloseOrder(order.id)}
                              disabled={actionLoadingId === order.id}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                            >
                              <Check className="w-4 h-4" /> Dar por Cerrado
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
