import React, { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Phone,
  Wrench,
  Smartphone,
  UserCheck,
  X,
} from "lucide-react";
import { Cliente, Ticket } from "../types";

interface CustomersListProps {
  clientes: Cliente[];
  tickets: Ticket[];
  onSelectCustomer?: (cliente: Cliente) => void;
  onNewTicketForCustomer?: (cliente: Cliente) => void;
  onRefresh?: () => void;
}

export const CustomersList: React.FC<CustomersListProps> = ({
  clientes,
  tickets,
  onSelectCustomer,
  onNewTicketForCustomer,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(
    clientes.length > 0 ? clientes[0] : null
  );

  const [newNombre, setNewNombre] = useState("");
  const [newCI, setNewCI] = useState("");
  const [newTelefono, setNewTelefono] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDireccion, setNewDireccion] = useState("");
  const [newNotas, setNewNotas] = useState("");

  const filteredClientes = clientes.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.ci.toLowerCase().includes(q) ||
      c.telefono.toLowerCase().includes(q) ||
      (c.direccion && c.direccion.toLowerCase().includes(q))
    );
  });

  const active = selectedCliente || (filteredClientes.length > 0 ? filteredClientes[0] : null);

  // Tickets belonging to the active client
  const activeTickets = active
    ? tickets.filter(
        (t) =>
          (t.cliente && t.cliente.toLowerCase().includes(active.nombre.toLowerCase())) ||
          (t.telefono && active.telefono && t.telefono.replace(/\D/g, "") === active.telefono.replace(/\D/g, ""))
      )
    : [];

  const handleSaveNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim()) return;

    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: newNombre.trim(),
          ci: newCI.trim() || "S/N",
          telefono: newTelefono.trim() || "S/N",
          email: newEmail.trim(),
          direccion: newDireccion.trim(),
          notas: newNotas.trim(),
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewNombre("");
        setNewCI("");
        setNewTelefono("");
        setNewEmail("");
        setNewDireccion("");
        setNewNotas("");
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Error guardando cliente:", err);
    }
  };

  const handleOpenWhatsApp = (tel: string) => {
    const clean = tel.replace(/[^0-9]/g, "");
    if (!clean) return;
    const waUrl = `https://wa.me/${clean.startsWith("0") ? "598" + clean.slice(1) : clean}?text=Hola%2C%20le%20escribimos%20desde%20KING%20PC%20COLONIA%20sobre%20su%20servicio%20t%C3%A9cnico`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0026e6]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              Directorio de Clientes King PC
            </h2>
            <p className="text-xs text-slate-500">
              {clientes.length} clientes registrados en Colonia y alrededores
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, CI o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0026e6]"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#0026e6] hover:bg-[#001ec2] text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#f6c90e]" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Directory List & Customer Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customers List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 space-y-2 max-h-[600px] overflow-y-auto shadow-sm">
          {filteredClientes.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No se encontraron clientes con "{searchTerm}".
            </div>
          ) : (
            filteredClientes.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedCliente(c);
                  if (onSelectCustomer) onSelectCustomer(c);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  active?.id === c.id
                    ? "bg-blue-50/70 border-[#0026e6] shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{c.nombre}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      CI: {c.ci || "S/N"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#0026e6]" />
                    <span>{c.telefono || "Sin teléfono"}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-blue-700 block">
                    {c.total_reparaciones} {c.total_reparaciones === 1 ? "reparación" : "reparaciones"}
                  </span>
                  {c.saldo_pendiente > 0 && (
                    <span className="text-[10px] text-amber-700 font-mono font-bold">
                      Saldo: ${c.saldo_pendiente}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Customer Details & History */}
        <div className="lg:col-span-7 space-y-4">
          {active ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm">
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#0026e6] font-black text-lg">
                    {active.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{active.nombre}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span>C.I.: <strong className="text-slate-800">{active.ci}</strong></span>
                      <span>•</span>
                      <span>Cliente desde: {new Date(active.fecha_registro).toLocaleDateString("es-UY")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenWhatsApp(active.telefono)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {onNewTicketForCustomer && (
                    <button
                      onClick={() => onNewTicketForCustomer(active)}
                      className="px-3 py-1.5 rounded-xl bg-[#0026e6] hover:bg-[#001ec2] text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5 text-[#f6c90e]" />
                      <span>Crear Ticket</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Info Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Teléfono Directo</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{active.telefono}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Ubicación</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{active.direccion || "Colonia del Sacramento"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Total Servicios</span>
                  <span className="font-black text-blue-700 mt-0.5 block">{active.total_reparaciones} órdenes</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Saldo Pendiente</span>
                  <span className={`font-black mt-0.5 block ${active.saldo_pendiente > 0 ? "text-amber-700" : "text-slate-600"}`}>
                    ${active.saldo_pendiente} UYU
                  </span>
                </div>
              </div>

              {/* Repair History for this Customer */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#0026e6]" />
                  Historial de Equipos y Reparaciones ({activeTickets.length})
                </h4>

                {activeTickets.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    No hay registros de reparaciones para este cliente aún.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {activeTickets.map((t) => (
                      <div
                        key={t.ticket_num}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#0026e6]">{t.ticket_num}</span>
                            <span className="font-bold text-slate-900 uppercase">{t.dispositivo}</span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5 truncate max-w-md">{t.falla}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 block">
                            ${t.presupuesto ?? t.abono} UYU
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                              t.estado === "entregado"
                                ? "bg-slate-200 text-slate-700"
                                : t.estado === "reparado"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-blue-100 text-blue-800 border border-blue-300"
                            }`}
                          >
                            {t.estado}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-xs">
              Selecciona un cliente de la lista para ver su ficha técnica e historial.
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Client */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-black text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0026e6]" />
                Registrar Cliente en King PC
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Gustavo Pérez"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">C.I. / RUT</label>
                  <input
                    type="text"
                    placeholder="Ej. 4.520.123-4"
                    value={newCI}
                    onChange={(e) => setNewCI(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Teléfono / Celular *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 099 520 073"
                    value={newTelefono}
                    onChange={(e) => setNewTelefono(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Dirección (Barrio / Ciudad)</label>
                <input
                  type="text"
                  placeholder="Ej. Real de San Carlos, Colonia"
                  value={newDireccion}
                  onChange={(e) => setNewDireccion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notas / Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Notas adicionales..."
                  value={newNotas}
                  onChange={(e) => setNewNotas(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0026e6] hover:bg-[#001ec2] text-white font-bold shadow-md"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
