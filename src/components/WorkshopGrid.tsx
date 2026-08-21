import React, { useState } from "react";
import {
  Search,
  Plus,
  Printer,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Layers,
  User,
  Wrench,
  Smartphone,
} from "lucide-react";
import { Ticket } from "../types";
import {
  generateDoubleThermalReceiptHtml,
  generateClientOnlyThermalReceiptHtml,
  generateWorkshopOnlyThermalReceiptHtml,
  printHtmlViaIframe,
  openReceiptInNewWindow,
} from "../utils/printReceipt";

interface WorkshopGridProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onEditTicket: (ticket: Ticket) => void;
  onNewTicket: () => void;
  onDeleteTicket: (ticketNum: string) => void;
  onSaveInline: (updated: Ticket) => void;
}

export const WorkshopGrid: React.FC<WorkshopGridProps> = ({
  tickets,
  onSelectTicket,
  onEditTicket,
  onNewTicket,
  onDeleteTicket,
  onSaveInline,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [printMenuTicket, setPrintMenuTicket] = useState<string | null>(null);

  const filteredTickets = tickets.filter((t) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      t.ticket_num.toLowerCase().includes(term) ||
      (t.cliente || "").toLowerCase().includes(term) ||
      (t.telefono || "").toLowerCase().includes(term) ||
      (t.ci || "").toLowerCase().includes(term) ||
      (t.dispositivo || "").toLowerCase().includes(term) ||
      (t.falla || "").toLowerCase().includes(term);

    const matchesStatus = statusFilter === "all" || t.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (estado?: string) => {
    switch (estado) {
      case "reparado":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            Reparado
          </span>
        );
      case "en_revision":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
            En Revisión
          </span>
        );
      case "esperando_repuesto":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
            Esperando Repuesto
          </span>
        );
      case "entregado":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300">
            Entregado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-300">
            Recibido
          </span>
        );
    }
  };

  const handlePrintTicket = (t: Ticket, mode: "double" | "cliente" | "taller") => {
    setPrintMenuTicket(null);
    let html = "";
    if (mode === "cliente") html = generateClientOnlyThermalReceiptHtml(t);
    else if (mode === "taller") html = generateWorkshopOnlyThermalReceiptHtml(t);
    else html = generateDoubleThermalReceiptHtml(t);

    const success = printHtmlViaIframe(html);
    if (!success) {
      openReceiptInNewWindow(html);
    }
  };

  const handleWhatsApp = (t: Ticket) => {
    const clean = (t.telefono || "").replace(/[^0-9]/g, "");
    if (!clean) return;
    const msg = `Hola ${t.cliente}, le escribimos de KING PC Colonia sobre su orden ${t.ticket_num} (${t.dispositivo}). Estado: ${t.estado || "en revisión"}. Saldo a pagar: $${t.saldo ?? 0} UYU.`;
    const waUrl = `https://wa.me/${clean.startsWith("0") ? "598" + clean.slice(1) : clean}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
      {/* Header with Search and New Ticket button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>📋 Registro de Órdenes & Servicios Técnicos</span>
            <span className="px-2.5 py-0.5 text-xs rounded-full bg-blue-50 text-[#0026e6] border border-blue-200 font-mono font-bold">
              {filteredTickets.length} órdenes
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Base de datos de reparaciones • Comprobantes térmicos dobles (Cliente y Taller) King PC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewTicket}
            className="px-4 py-2 text-xs font-black rounded-xl bg-[#0026e6] hover:bg-[#001ec2] text-white flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#f6c90e]" />
            <span>+ Nueva Orden</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ticket (ej: ST-00010), cliente (Gustavo...), teléfono (099...), CI o equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0026e6]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-[#0026e6]"
        >
          <option value="all">Todos los Estados</option>
          <option value="recibido">Recibidos</option>
          <option value="en_revision">En Revisión</option>
          <option value="esperando_repuesto">Esperando Repuesto</option>
          <option value="reparado">Reparados</option>
          <option value="entregado">Entregados</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
              <th className="py-3 px-3">Ticket</th>
              <th className="py-3 px-3">Cliente</th>
              <th className="py-3 px-3">Teléfono</th>
              <th className="py-3 px-3">Equipo / Dispositivo</th>
              <th className="py-3 px-3">Falla Reportada</th>
              <th className="py-3 px-3 text-right">Presupuesto</th>
              <th className="py-3 px-3 text-right">Saldo</th>
              <th className="py-3 px-3 text-center">Estado</th>
              <th className="py-3 px-3 text-center">Impresión & Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 text-xs font-sans">
                  No se encontraron tickets con los filtros actuales.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => (
                <tr
                  key={t.ticket_num}
                  className="hover:bg-blue-50/40 transition-colors group relative"
                >
                  <td className="py-2.5 px-3 font-black text-[#0026e6] whitespace-nowrap">
                    {t.ticket_num}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-900 font-bold">
                    {t.cliente}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-sans">
                    {t.telefono}
                  </td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                    {t.dispositivo}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600 max-w-[200px] truncate" title={t.falla}>
                    {t.falla}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {t.presupuesto !== null ? `$${t.presupuesto}` : "-"}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-amber-700">
                    {t.saldo !== null ? `$${t.saldo}` : "-"}
                  </td>
                  <td className="py-2.5 px-3 text-center font-sans">
                    {getStatusBadge(t.estado)}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap relative">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onSelectTicket(t)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0026e6] transition"
                        title="Ver orden en pantalla principal"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* PRINT BUTTON WITH DROPDOWN TRIGGER */}
                      <div className="relative inline-block">
                        <button
                          onClick={() =>
                            setPrintMenuTicket(
                              printMenuTicket === t.ticket_num ? null : t.ticket_num
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-[#0026e6] hover:bg-[#001ec2] text-white flex items-center gap-1 font-bold text-[11px] transition shadow-sm cursor-pointer"
                          title="Imprimir ticket térmico"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#f6c90e]" />
                          <span>Imprimir</span>
                        </button>

                        {printMenuTicket === t.ticket_num && (
                          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xl w-48 text-left space-y-1">
                            <button
                              onClick={() => handlePrintTicket(t, "double")}
                              className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-50 rounded-xl flex items-center gap-1.5"
                            >
                              <Layers className="w-3.5 h-3.5 text-blue-600" />
                              <span>1. Ambos Tickets (Doble)</span>
                            </button>
                            <button
                              onClick={() => handlePrintTicket(t, "cliente")}
                              className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1.5"
                            >
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              <span>2. Solo Copia Cliente</span>
                            </button>
                            <button
                              onClick={() => handlePrintTicket(t, "taller")}
                              className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1.5"
                            >
                              <Wrench className="w-3.5 h-3.5 text-amber-600" />
                              <span>3. Solo Copia Taller</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleWhatsApp(t)}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                        title="Enviar estado por WhatsApp"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onEditTicket(t)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Modificar ticket"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTicket(t.ticket_num)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                        title="Eliminar ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
