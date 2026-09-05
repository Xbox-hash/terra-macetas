import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Layers,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Sparkles,
  Search,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/common/Button';
import { orderService } from '../../services/orderService';
import { lineService } from '../../services/lineService';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils';
import { Order, ProductLine, Product } from '../../types';
import { useCompany } from '../../contexts/CompanyContext';

const STATUS_COLORS: Record<string, string> = {
  'Pendiente': '#D97706',
  'Cerrado': '#15803D',
  'Cancelado': '#DC2626'
};

export const AnalyticsPage: React.FC = () => {
  const { openMobileSidebar } = useOutletContext<{ openMobileSidebar: () => void }>();
  const { config } = useCompany();

  // Raw data
  const [orders, setOrders] = useState<Order[]>([]);
  const [lines, setLines] = useState<ProductLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [presetPeriod, setPresetPeriod] = useState<'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'all' | 'custom'>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Initial Date Setup for "This Month"
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [ordersData, linesData, prodsData] = await Promise.all([
        orderService.getAll('all'),
        lineService.getAll(),
        productService.getAll()
      ]);
      setOrders(ordersData);
      setLines(linesData);
      setProducts(prodsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle Preset Period Change
  const handlePresetChange = (preset: typeof presetPeriod) => {
    setPresetPeriod(preset);
    const now = new Date();

    if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'last_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (preset === 'last_3_months') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'this_year') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filtered Orders Calculation
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Date Filter
      if (startDate) {
        const oDate = o.createdAt.split('T')[0];
        if (oDate < startDate) return false;
      }
      if (endDate) {
        const oDate = o.createdAt.split('T')[0];
        if (oDate > endDate) return false;
      }

      // 2. Status Filter
      if (selectedStatus !== 'all' && o.status.toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }

      // 3. Line Filter
      if (selectedLine !== 'all') {
        const hasLineItem = o.items.some((item) => {
          const prod = products.find((p) => p.id === item.product?.id || p.id === (item as any).productId);
          return prod && prod.lineId === selectedLine;
        });
        if (!hasLineItem) return false;
      }

      // 4. Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesCustomer = o.customerName?.toLowerCase().includes(term);
        const matchesId = o.id.toLowerCase().includes(term);
        const matchesPhone = o.customerPhone?.toLowerCase().includes(term);
        if (!matchesCustomer && !matchesId && !matchesPhone) return false;
      }

      return true;
    });
  }, [orders, startDate, endDate, selectedStatus, selectedLine, searchTerm, products]);

  // KPIs
  const kpis = useMemo(() => {
    const totalCount = filteredOrders.length;
    const closedOrders = filteredOrders.filter((o) => o.status.toLowerCase() === 'cerrado');
    const pendingOrders = filteredOrders.filter((o) => o.status.toLowerCase() === 'pendiente');
    const cancelledOrders = filteredOrders.filter((o) => o.status.toLowerCase() === 'cancelado');

    const totalRevenue = closedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const averageTicket = closedOrders.length > 0 ? totalRevenue / closedOrders.length : 0;
    const conversionRate = totalCount > 0 ? (closedOrders.length / totalCount) * 100 : 0;

    let totalItemsSold = 0;
    closedOrders.forEach((o) => {
      o.items?.forEach((item) => {
        totalItemsSold += (item.quantity || (item as any).Quantity || 1);
      });
    });

    return {
      totalCount,
      closedCount: closedOrders.length,
      pendingCount: pendingOrders.length,
      cancelledCount: cancelledOrders.length,
      totalRevenue,
      averageTicket,
      conversionRate,
      totalItemsSold
    };
  }, [filteredOrders]);

  // Chart 1: Daily Trend Data (Evolution over time)
  const timelineData = useMemo(() => {
    const map: Record<string, { date: string; facturacion: number; pedidos: number }> = {};

    filteredOrders.forEach((o) => {
      const dateKey = new Date(o.createdAt).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });
      if (!map[dateKey]) {
        map[dateKey] = { date: dateKey, facturacion: 0, pedidos: 0 };
      }
      map[dateKey].pedidos += 1;
      if (o.status.toLowerCase() === 'cerrado') {
        map[dateKey].facturacion += Number(o.total || 0);
      }
    });

    return Object.values(map);
  }, [filteredOrders]);

  // Chart 2: Revenue & Quantity by Product Line
  const lineStatsData = useMemo(() => {
    const map: Record<string, { name: string; total: number; cantidad: number }> = {};

    filteredOrders
      .filter((o) => o.status.toLowerCase() === 'cerrado')
      .forEach((o) => {
        o.items?.forEach((item) => {
          const prod = products.find((p) => p.id === item.product?.id || p.id === (item as any).productId);
          const line = lines.find((l) => l.id === prod?.lineId);
          const lineName = line?.name || 'Otras Piezas';

          if (!map[lineName]) {
            map[lineName] = { name: lineName, total: 0, cantidad: 0 };
          }
          map[lineName].total += (item.subtotal || (item as any).Subtotal || (item.quantity * (prod?.price || 0)));
          map[lineName].cantidad += (item.quantity || (item as any).Quantity || 1);
        });
      });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredOrders, products, lines]);

  // Chart 3: Status Distribution (Donut)
  const statusDistributionData = useMemo(() => {
    return [
      { name: 'Cerrados (Venta)', value: kpis.closedCount, color: '#15803D' },
      { name: 'Pendientes', value: kpis.pendingCount, color: '#D97706' },
      { name: 'Cancelados', value: kpis.cancelledCount, color: '#DC2626' }
    ].filter((item) => item.value > 0);
  }, [kpis]);

  // Chart 4: Top 5 Best Selling Products
  const topProductsData = useMemo(() => {
    const map: Record<string, { name: string; unidades: number; total: number }> = {};

    filteredOrders
      .filter((o) => o.status.toLowerCase() === 'cerrado')
      .forEach((o) => {
        o.items?.forEach((item) => {
          const pName = item.product?.name || (item as any).productName || (item as any).ProductName || 'Maceta';
          if (!map[pName]) {
            map[pName] = { name: pName, unidades: 0, total: 0 };
          }
          map[pName].unidades += (item.quantity || (item as any).Quantity || 1);
          map[pName].total += (item.subtotal || (item as any).Subtotal || 0);
        });
      });

    return Object.values(map).sort((a, b) => b.unidades - a.unidades).slice(0, 5);
  }, [filteredOrders]);

  // EXPORT TO EXCEL (.XLSX)
  const exportToExcel = () => {
    const rows = filteredOrders.map((o) => {
      const itemsStr = o.items?.map((i: any) => `${i.quantity || i.Quantity}x ${i.productName || i.product?.name || i.ProductName}`).join(', ') || '';
      return {
        'ID Pedido': o.id,
        'Fecha y Hora': new Date(o.createdAt).toLocaleString('es-PY'),
        'Cliente': o.customerName || 'Cliente WhatsApp',
        'Teléfono': o.customerPhone || '',
        'Detalles / Ciudad': o.notes || '',
        'Productos': itemsStr,
        'Monto Total (PYG)': o.total,
        'Estado': o.status,
        'Canal': o.channel
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    const sheetName = (config.storeName || 'Ventas').slice(0, 30);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    worksheet['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 22 }, { wch: 40 }, { wch: 16 }, { wch: 14 }, { wch: 12 }];

    const cleanStoreName = (config.storeName || 'Reporte').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(workbook, `${cleanStoreName}_Reporte_Ventas_${startDate || 'Historico'}_al_${endDate || 'Actual'}.xlsx`);
  };

  // EXPORT TO PDF
  const exportToPdf = () => {
    const doc = new jsPDF();

    // Header Membretado
    doc.setFillColor(45, 58, 47); // #2D3A2F
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(config.storeName || 'TERRA - MACETAS BOTÁNICAS', 14, 13);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('INFORME EJECUTIVO DE VENTAS Y GESTIÓN DE PEDIDOS', 14, 21);

    // Metadata
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.text(`Generado el: ${new Date().toLocaleString('es-PY')}`, 14, 36);
    doc.text(`Período de filtro: ${startDate || 'Inicio'} al ${endDate || 'Hoy'} | Estado: ${selectedStatus.toUpperCase()}`, 14, 42);

    // Resumen Ejecutivo en Cajas
    doc.setFillColor(244, 239, 230);
    doc.roundedRect(14, 48, 182, 22, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(45, 58, 47);
    doc.text(`Facturación Total: Gs. ${kpis.totalRevenue.toLocaleString('es-PY')}`, 20, 57);
    doc.text(`Pedidos Cerrados: ${kpis.closedCount} de ${kpis.totalCount}`, 20, 64);

    doc.text(`Ticket Promedio: Gs. ${Math.round(kpis.averageTicket).toLocaleString('es-PY')}`, 105, 57);
    doc.text(`Tasa de Cierre: ${kpis.conversionRate.toFixed(1)}%`, 105, 64);

    // Tabla de Pedidos
    const tableData = filteredOrders.map((o) => [
      o.id,
      new Date(o.createdAt).toLocaleDateString('es-PY'),
      o.customerName || 'Cliente',
      o.customerPhone || '-',
      o.items?.map((i: any) => `${i.quantity || i.Quantity}x ${i.productName || i.product?.name || i.ProductName}`).join(', ') || '-',
      `Gs. ${Number(o.total).toLocaleString('es-PY')}`,
      o.status
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['ID', 'Fecha', 'Cliente', 'Teléfono', 'Productos', 'Total', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [45, 58, 47],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 3,
        overflow: 'linebreak',
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 24, fontStyle: 'bold' },
        1: { cellWidth: 18 },
        2: { cellWidth: 26 },
        3: { cellWidth: 22 },
        4: { cellWidth: 46 },
        5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 20, halign: 'center' }
      }
    });

    const filename = `${(config.storeName || 'TERRA').replace(/[^a-zA-Z0-9]/g, '_')}_Informe_Ventas_${startDate || 'Historico'}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Business Intelligence & Reportes"
        subtitle="Analítica ejecutiva de ventas, evolución temporal, rendimiento de líneas y exportación en 1 clic"
        onOpenMobileSidebar={openMobileSidebar}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-700" />}
              className="text-xs"
            >
              Exportar Excel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={exportToPdf}
              leftIcon={<FileText className="w-4 h-4" />}
              className="text-xs shadow-xs"
            >
              Descargar PDF
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* SLICERS & FILTROS GLOBALES (POWER BI STYLE) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5DFD4] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EFE9DE] pb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4A5D4E]">
              <Filter className="w-4 h-4" />
              <span>Filtros Globales de Visualización</span>
            </div>

            {/* Quick Period Presets */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#F4EFE6] p-1 rounded-2xl">
              {[
                { id: 'this_month', label: 'Este Mes' },
                { id: 'last_month', label: 'Mes Pasado' },
                { id: 'last_3_months', label: 'Últimos 3 Meses' },
                { id: 'this_year', label: 'Año Actual' },
                { id: 'all', label: 'Todo' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    presetPeriod === p.id
                      ? 'bg-[#2D3A2F] text-white shadow-xs'
                      : 'text-[#5C6B5B] hover:text-[#222A21]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slicers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
            {/* Fechas Desde */}
            <div>
              <label className="block text-[11px] font-bold text-[#556353] uppercase tracking-wider mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPresetPeriod('custom');
                }}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD6C9] rounded-xl text-xs font-medium text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              />
            </div>

            {/* Fechas Hasta */}
            <div>
              <label className="block text-[11px] font-bold text-[#556353] uppercase tracking-wider mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPresetPeriod('custom');
                }}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD6C9] rounded-xl text-xs font-medium text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              />
            </div>

            {/* Filtro por Línea */}
            <div>
              <label className="block text-[11px] font-bold text-[#556353] uppercase tracking-wider mb-1">
                Línea de Macetas
              </label>
              <select
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD6C9] rounded-xl text-xs font-medium text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              >
                <option value="all">Todas las Líneas ({lines.length})</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Estado */}
            <div>
              <label className="block text-[11px] font-bold text-[#556353] uppercase tracking-wider mb-1">
                Estado del Pedido
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD6C9] rounded-xl text-xs font-medium text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
              >
                <option value="all">Todos los Estados</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Cerrado">Cerrados (Venta Concretada)</option>
                <option value="Cancelado">Cancelados</option>
              </select>
            </div>

            {/* Buscar por Cliente o ID */}
            <div>
              <label className="block text-[11px] font-bold text-[#556353] uppercase tracking-wider mb-1">
                Buscar Pedido
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#889786] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cliente, teléfono o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-[#FAF8F5] border border-[#DDD6C9] rounded-xl text-xs text-[#2D3A2F] focus:outline-none focus:ring-2 focus:ring-[#2D3A2F]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPI SCORECARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* 1. Facturación Cerrada */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5DFD4] shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D7B6C]">
                Facturación Efectiva
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                ₲
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl sm:text-3xl font-bold font-serif text-emerald-800">
                {formatPrice(kpis.totalRevenue)}
              </h3>
              <p className="text-xs text-[#5D6B5C] mt-1">
                Sobre {kpis.closedCount} pedidos cerrados
              </p>
            </div>
          </div>

          {/* 2. Total Pedidos Recibidos */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5DFD4] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D7B6C]">
                Volumen de Pedidos
              </span>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl sm:text-3xl font-bold font-serif text-[#222A21]">
                {kpis.totalCount} Pedidos
              </h3>
              <p className="text-xs text-[#5D6B5C] mt-1">
                Tasa de Cierre: <strong className="text-emerald-700 font-semibold">{kpis.conversionRate.toFixed(1)}%</strong>
              </p>
            </div>
          </div>

          {/* 3. Ticket Promedio */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5DFD4] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D7B6C]">
                Ticket Promedio
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl sm:text-3xl font-bold font-serif text-amber-800">
                {formatPrice(kpis.averageTicket)}
              </h3>
              <p className="text-xs text-[#5D6B5C] mt-1">
                Por cada venta concretada
              </p>
            </div>
          </div>

          {/* 4. Unidades Despachadas */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5DFD4] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D7B6C]">
                Macetas Vendidas
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#EFE9DF] text-[#3D4F3F] flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl sm:text-3xl font-bold font-serif text-[#2D3A2F]">
                {kpis.totalItemsSold} Piezas
              </h3>
              <p className="text-xs text-[#5D6B5C] mt-1">
                Unidades físicas despachadas
              </p>
            </div>
          </div>
        </div>

        {/* GRÁFICOS POWER BI SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. Evolución Temporal de Facturación & Pedidos (Area Chart) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#E5DFD4] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#222A21]">
                  Evolución de Ventas en el Tiempo
                </h3>
                <p className="text-xs text-[#6D7A6C]">Facturación (₲) acumulada por día</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A5D4E] bg-[#EAE4D7] px-3 py-1 rounded-full">
                Línea Temporal
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              {timelineData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                  No hay datos suficientes para el período seleccionado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorFacturacion" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2D3A2F" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2D3A2F" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFE9DF" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6D7A6C' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6D7A6C' }} tickFormatter={(val) => `₲${(val / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(val: any) => [formatPrice(Number(val)), 'Facturación']}
                      contentStyle={{ backgroundColor: '#FAF8F5', borderRadius: '12px', borderColor: '#E3DDD1', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="facturacion"
                      stroke="#2D3A2F"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorFacturacion)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 2. Distribución de Estados (Donut Chart) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E5DFD4] shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#222A21]">
                Distribución de Pedidos
              </h3>
              <p className="text-xs text-[#6D7A6C]">Estado de conversión del funnel</p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              {statusDistributionData.length === 0 ? (
                <span className="text-xs text-neutral-400">Sin pedidos</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#FAF8F5', borderRadius: '12px', borderColor: '#E3DDD1', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-[#EFE9DE]">
              {statusDistributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[#4E5C4E] font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-[#222A21]">{item.value} ({((item.value / kpis.totalCount) * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2nd Row Charts: Ranking por Líneas y Top Productos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Líneas más rentables */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#E5DFD4] shadow-xs space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#222A21]">
                Ventas por Línea de Producto
              </h3>
              <p className="text-xs text-[#6D7A6C]">Monto facturado en pedidos cerrados</p>
            </div>

            <div className="h-64 w-full">
              {lineStatsData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                  Sin ventas registradas en las líneas seleccionadas
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineStatsData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFE9DF" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#6D7A6C' }} tickFormatter={(val) => `₲${(val / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#2D3A2F' }} width={120} />
                    <Tooltip
                      formatter={(val: any) => [formatPrice(Number(val)), 'Facturación']}
                      contentStyle={{ backgroundColor: '#FAF8F5', borderRadius: '12px', borderColor: '#E3DDD1', fontSize: '12px' }}
                    />
                    <Bar dataKey="total" fill="#4A5D4E" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top 5 Macetas más pedidas */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#E5DFD4] shadow-xs space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#222A21]">
                Top 5 Piezas Más Vendidas
              </h3>
              <p className="text-xs text-[#6D7A6C]">Ranking por volumen de unidades</p>
            </div>

            <div className="space-y-3 pt-2">
              {topProductsData.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-10">No hay ventas cerradas en el período</p>
              ) : (
                topProductsData.map((p, idx) => (
                  <div key={p.name} className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F4] border border-[#EAE3D5]">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#2D3A2F] text-white text-xs font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="font-semibold text-xs text-[#222A21]">{p.name}</h4>
                        <span className="text-[10px] text-[#6E7B6C]">{p.unidades} unidades despachadas</span>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-[#2D3A2F]">
                      {formatPrice(p.total)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* TABLA DETALLADA DE PEDIDOS FILTRADOS */}
        <div className="bg-white rounded-3xl border border-[#E5DFD4] shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-[#EFE9DE] flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#222A21]">
                Registro Detallado de Pedidos ({filteredOrders.length})
              </h3>
              <p className="text-xs text-[#6F7B6D] mt-0.5">
                Listado filtrado listo para exportación o consulta de auditoría
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2D3A2F]">
              <thead className="bg-[#F8F5EE] text-[#556253] uppercase text-[10px] font-bold tracking-wider border-b border-[#EFE9DE]">
                <tr>
                  <th className="px-6 py-3.5">ID / Fecha</th>
                  <th className="px-6 py-3.5">Cliente</th>
                  <th className="px-6 py-3.5">Detalle / Piezas</th>
                  <th className="px-6 py-3.5 text-right">Total</th>
                  <th className="px-6 py-3.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE2]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#7E8B7D]">
                      No hay pedidos que coincidan con los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="px-6 py-3.5 align-top">
                        <span className="font-mono font-bold text-xs text-[#222A21] block">#{o.id}</span>
                        <span className="text-[10px] text-[#7A8678]">
                          {new Date(o.createdAt).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 align-top">
                        <span className="font-bold text-xs text-[#222A21] block">{o.customerName || 'Cliente'}</span>
                        {o.customerPhone && <span className="text-[11px] text-[#4A5D4E]">{o.customerPhone}</span>}
                      </td>
                      <td className="px-6 py-3.5 align-top max-w-sm">
                        <span className="text-xs text-[#4F5D4E] line-clamp-2">
                          {o.items?.map((i: any) => `${i.quantity || i.Quantity}x ${i.productName || i.product?.name || i.ProductName}`).join(', ') || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 align-top text-right">
                        <span className="font-bold text-sm text-[#222A21]">{formatPrice(o.total)}</span>
                      </td>
                      <td className="px-6 py-3.5 align-top text-center">
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: `${STATUS_COLORS[o.status] || '#888'}18`,
                            color: STATUS_COLORS[o.status] || '#333'
                          }}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
