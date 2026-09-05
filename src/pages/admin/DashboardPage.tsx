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
  AlertCircle,
  Ban
} from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
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

  const [filterStatus, setFilterStatus] = useState<'all' | 'Pendiente' | 'Cerrado' | 'Cancelado'>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<any | null>(null);

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

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    const orderId = orderToCancel.id;
    setActionLoadingId(orderId);
    try {
      await orderService.cancelOrder(orderId);
      showToast(`Pedido #${orderId.substring(0, 8)} CANCELADO (saldrá en 7 días).`, 'info');
      setOrderToCancel(null);
      loadDashboardData();
    } catch (err: any) {
      showToast('Error al cancelar pedido', 'error');
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
              <button
                onClick={() => setFilterStatus('Cancelado')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === 'Cancelado'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-[#586656] hover:text-rose-700'
                }`}
              >
                Cancelados ({stats.recentOrders.filter(o => o.status.toLowerCase() === 'cancelado').length})
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
                  <th className="px-6 py-4 text-right">Acciones</th>
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
                          Cuando los clientes agreguen macetas al carrito y confirmen, aparecerán automáticamente aquí.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isClosed = order.status.toLowerCase() === 'cerrado';
                    const isCancelled = order.status.toLowerCase() === 'cancelado';

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
                          {order.customerPhone && (
                            <span className="text-xs text-[#4A5D4E] font-medium block">
                              📱 {order.customerPhone}
                            </span>
                          )}
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
                          ) : isCancelled ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <Ban className="w-3.5 h-3.5 text-rose-600" />
                                Cancelado
                              </span>
                              <span className="text-[10px] text-rose-600 block mt-1 font-medium">
                                Purga en 7 días
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              Pendiente
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isClosed ? (
                              <button
                                onClick={() => handleReopenOrder(order.id)}
                                disabled={actionLoadingId === order.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#D5CEC2] hover:bg-[#EAE4D7] text-xs font-semibold text-[#5A6858] transition-colors cursor-pointer"
                                title="Reabrir a estado pendiente"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Reabrir
                              </button>
                            ) : isCancelled ? (
                              <button
                                onClick={() => handleReopenOrder(order.id)}
                                disabled={actionLoadingId === order.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#D5CEC2] hover:bg-[#EAE4D7] text-xs font-semibold text-[#5A6858] transition-colors cursor-pointer"
                                title="Restaurar a estado pendiente"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleCloseOrder(order.id)}
                                  disabled={actionLoadingId === order.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                                  title="Marcar pedido como completado/cerrado"
                                >
                                  <Check className="w-3.5 h-3.5" /> Cerrar
                                </button>
                                <button
                                  onClick={() => setOrderToCancel(order)}
                                  disabled={actionLoadingId === order.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                                  title="Cancelar pedido (se eliminará automáticamente pasados 7 días)"
                                >
                                  <Ban className="w-3.5 h-3.5" /> Cancelar
                                </button>
                              </>
                            )}
                          </div>
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

      {/* Modal Elegante de Confirmación de Cancelación */}
      <Modal
        isOpen={Boolean(orderToCancel)}
        onClose={() => setOrderToCancel(null)}
        maxWidth="md"
      >
        {orderToCancel && (
          <div className="text-center py-4 px-2 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                Confirmar Cancelación
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#222A21] pt-1">
                ¿Desea cancelar este pedido?
              </h3>
              <p className="text-sm text-[#5C6A5A] max-w-sm mx-auto leading-relaxed">
                El pedido <strong>#{orderToCancel.id}</strong> de <strong>{orderToCancel.customerName || 'Cliente'}</strong> pasará a estado cancelado.
              </p>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D6] text-xs text-[#5D6B5C] text-left space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span><strong>Retención de 7 días:</strong> Permanecerá en tu lista para revisión o posible restauración.</span>
              </div>
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                <span><strong>Purga automática:</strong> Transcurridos los 7 días, saldrá automáticamente del sistema.</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                className="w-full justify-center text-xs"
                onClick={() => setOrderToCancel(null)}
              >
                Volver
              </Button>
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center bg-rose-700 hover:bg-rose-800 text-white text-xs border-transparent shadow-md"
                isLoading={actionLoadingId === orderToCancel.id}
                onClick={confirmCancelOrder}
              >
                Sí, Cancelar Pedido
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
