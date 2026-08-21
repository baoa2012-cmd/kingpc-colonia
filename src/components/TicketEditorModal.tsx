import React, { useState } from "react";
import { X, Save, AlertCircle, Phone, User, Monitor, DollarSign, Wrench } from "lucide-react";
import { Ticket } from "../types";

interface TicketEditorModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Ticket) => void;
}

export const TicketEditorModal: React.FC<TicketEditorModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !ticket) return null;

  const [cliente, setCliente] = useState(ticket.cliente);
  const [ci, setCi] = useState(ticket.ci || "S/N");
  const [telefono, setTelefono] = useState(ticket.telefono);
  const [dispositivo, setDispositivo] = useState(ticket.dispositivo);
  const [falla, setFalla] = useState(ticket.falla);
  const [presupuesto, setPresupuesto] = useState<string>(
    ticket.presupuesto !== null ? String(ticket.presupuesto) : ""
  );
  const [abono, setAbono] = useState<string>(String(ticket.abono || 0));
  const [revisionPagada, setRevisionPagada] = useState<"SI" | "NO">(ticket.revision_pagada || "NO");
  const [estado, setEstado] = useState<string>(ticket.estado || "recibido");

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const presNum = presupuesto.trim() !== "" ? parseFloat(presupuesto) : null;
    const aboNum = abono.trim() !== "" ? parseFloat(abono) : 0;
    const salNum = presNum !== null ? Math.max(0, presNum - aboNum) : null;

    const updated: Ticket = {
      ...ticket,
      cliente,
      ci,
      telefono,
      dispositivo,
      falla,
      presupuesto: presNum,
      abono: aboNum,
      saldo: salNum,
      revision_pagada: revisionPagada,
      estado: estado as any,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Edición de Orden #{ticket.ticket_num}
              </h3>
              <p className="text-xs text-slate-400">Actualiza los datos del cliente, equipo o presupuesto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cliente */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Nombre del Cliente
              </label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                Teléfono / Celular
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CI / RUT */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Cédula / RUT
              </label>
              <input
                type="text"
                value={ci}
                onChange={(e) => setCi(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Estado de Reparación
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="recibido">🟡 Recibido en Mesa</option>
                <option value="en_revision">🔵 En Revisión Técnica</option>
                <option value="esperando_repuesto">🟠 Esperando Repuesto</option>
                <option value="reparado">🟢 Reparado / Listo</option>
                <option value="entregado">✅ Entregado a Cliente</option>
                <option value="cancelado">🔴 Cancelado / Devuelto</option>
              </select>
            </div>
          </div>

          {/* Dispositivo */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              Equipo / Dispositivo / Marca
            </label>
            <input
              type="text"
              value={dispositivo}
              onChange={(e) => setDispositivo(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400 uppercase font-semibold"
            />
          </div>

          {/* Falla */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">
              Motivo de Ingreso / Falla Reportada
            </label>
            <textarea
              rows={2}
              value={falla}
              onChange={(e) => setFalla(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Costos y Abonos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Presupuesto ($)
              </label>
              <input
                type="number"
                placeholder="Sin definir"
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-bold focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Seña / Abono ($)
              </label>
              <input
                type="number"
                value={abono}
                onChange={(e) => setAbono(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Revisión Abonada
              </label>
              <select
                value={revisionPagada}
                onChange={(e) => setRevisionPagada(e.target.value as "SI" | "NO")}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="SI">SI ($500)</option>
                <option value="NO">NO</option>
              </select>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shadow-lg shadow-cyan-900/40 transition"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
