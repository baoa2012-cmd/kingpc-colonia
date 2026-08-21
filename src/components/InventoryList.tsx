import React, { useState } from "react";
import {
  Package,
  Search,
  Plus,
  Receipt,
  X,
  Sparkles,
} from "lucide-react";
import { InventarioItem, Factura } from "../types";

interface InventoryListProps {
  items: InventarioItem[];
  onRefresh?: () => void;
  onEmitInvoice?: (fac: Factura) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({ items, onRefresh, onEmitInvoice }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [sellingItem, setSellingItem] = useState<InventarioItem | null>(null);
  const [sellCliente, setSellCliente] = useState("Gustavo Pérez");
  const [sellTelefono, setSellTelefono] = useState("099 520 073");
  const [sellCi, setSellCi] = useState("4.520.123-4");
  const [sellPrecio, setSellPrecio] = useState<number>(0);
  const [sellMessage, setSellMessage] = useState<string | null>(null);

  // New Product Form matching kingpccolonia.com/admin/index.php?menu=7
  const [newSku, setNewSku] = useState(`KPC-${Math.floor(10000 + Math.random() * 90000)}`);
  const [newNombre, setNewNombre] = useState("");
  const [newCategoria, setNewCategoria] = useState("Consolas y Accesorios");
  const [newSubcategoria, setNewSubcategoria] = useState("Cargadores y Fuentes");
  const [newModelo, setNewModelo] = useState("Universal");
  const [newNSerie, setNewNSerie] = useState("");
  const [newStock, setNewStock] = useState(5);
  const [newStockMin, setNewStockMin] = useState(2);
  const [newPrecioCosto, setNewPrecioCosto] = useState(150);
  const [newPrecio, setNewPrecio] = useState(280);
  const [newDetalles, setNewDetalles] = useState("");

  const categories = [
    { id: "ALL", label: "Todo el Catálogo" },
    { id: "Consolas y Accesorios", label: "🎮 Consolas & Mandos" },
    { id: "Televisores y Audio", label: "📺 Televisores & LED" },
    { id: "Computación & PC", label: "💻 Computadoras & Notebooks" },
    { id: "Repuestos Taller", label: "🛠️ Repuestos de Taller" },
    { id: "Cables y Adaptadores", label: "🔌 Cables & Conectividad" },
  ];

  const filteredItems = items.filter((item) => {
    const matchCat = selectedCategory === "ALL" || item.categoria === selectedCategory;
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (item.nombre || "").toLowerCase().includes(q) ||
      (item.sku || "").toLowerCase().includes(q) ||
      (item.codigo || "").toLowerCase().includes(q) ||
      (item.modelo || "").toLowerCase().includes(q) ||
      (item.n_serie || "").toLowerCase().includes(q) ||
      (item.detalles || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const lowStockCount = items.filter((i) => (i.stock || 0) <= (i.stock_minimo || 2)).length;
  const totalStockUnits = items.reduce((acc, i) => acc + (i.stock || 0), 0);
  const totalValuation = items.reduce((acc, i) => acc + (i.stock || 0) * (i.precio || 0), 0);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim()) return;

    try {
      const res = await fetch("/api/inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: newSku.trim(),
          codigo: newSku.trim(),
          nombre: newNombre.trim(),
          categoria: newCategoria,
          subcategoria: newSubcategoria,
          modelo: newModelo,
          n_serie: newNSerie,
          stock: Number(newStock),
          stock_minimo: Number(newStockMin),
          precio_costo: Number(newPrecioCosto),
          precio: Number(newPrecio),
          detalles: newDetalles,
          ubicacion: "Sucursal Colonia",
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewNombre("");
        setNewSku(`KPC-${Math.floor(10000 + Math.random() * 90000)}`);
        setNewNSerie("");
        setNewDetalles("");
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Error guardando producto:", err);
    }
  };

  const handleConfirmSale = async () => {
    if (!sellingItem) return;

    try {
      const res = await fetch("/api/inventario/vender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: sellingItem.id,
          cliente: sellCliente,
          ci: sellCi,
          telefono: sellTelefono,
          precio: sellPrecio,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSellMessage("¡Venta realizada y factura generada con éxito!");
        setTimeout(() => {
          setSellingItem(null);
          setSellMessage(null);
          if (onRefresh) onRefresh();
          if (onEmitInvoice && data.factura) {
            onEmitInvoice(data.factura);
          }
        }, 1200);
      }
    } catch (e) {
      setSellMessage("Error al procesar la venta.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">
            Total de Productos
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{items.length} artículos</span>
          <span className="text-[11px] text-blue-700 font-semibold mt-0.5 block">
            {totalStockUnits} unidades físicas
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">
            Valoración Total
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            ${totalValuation.toLocaleString("es-UY")} UYU
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Precios al público</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">
            Alertas Stock Crítico
          </span>
          <span
            className={`text-2xl font-black mt-1 block ${
              lowStockCount > 0 ? "text-amber-600" : "text-slate-800"
            }`}
          >
            {lowStockCount} artículos
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Por debajo del mínimo</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">
              King PC Catálogo
            </span>
            <span className="text-sm font-black text-[#0026e6] mt-1 block">CRUD / MySQL Sync</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#0026e6] hover:bg-[#001ec2] text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#f6c90e]" />
            <span>+ Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-[#f6c90e] text-slate-950 shadow-sm"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por SKU, nombre, serie o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0026e6]"
          />
        </div>
      </div>

      {/* Products & Repuestos Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">SKU / Código</th>
                <th className="py-3 px-4">Producto & Modelo</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">N° Serie / Parte</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-right">Precio Venta</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isLow = (item.stock || 0) <= (item.stock_minimo || 2);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {item.sku || item.codigo}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.nombre}</div>
                      {item.modelo && (
                        <div className="text-[10px] text-slate-500">Modelo: {item.modelo}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-medium">
                        {item.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {item.n_serie || "S/N"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-black text-xs ${
                          isLow
                            ? "bg-red-100 text-red-700 border border-red-300"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        {item.stock} u.
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                      ${item.precio || item.precio_costo} UYU
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSellingItem(item);
                          setSellPrecio(item.precio || 0);
                          setSellMessage(null);
                        }}
                        disabled={item.stock <= 0}
                        className="px-3 py-1 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 mx-auto transition shadow-sm cursor-pointer"
                        title="Vender este artículo y emitir factura"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Vender</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Product Modal matching kingpccolonia.com/admin/index.php?menu=7 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#0026e6]" />
                  Agregar Nuevo Producto al Catálogo King PC
                </h3>
                <p className="text-xs text-slate-500">
                  Formulario sincronizado con la base de datos MySQL de kingpccolonia.com
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU:</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#0026e6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría:</label>
                  <select
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                  >
                    <option value="Consolas y Accesorios">Consolas y Accesorios</option>
                    <option value="Televisores y Audio">Televisores y Audio</option>
                    <option value="Computación & PC">Computación & PC</option>
                    <option value="Repuestos Taller">Repuestos Taller</option>
                    <option value="Cables y Adaptadores">Cables y Adaptadores</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subcategoría:</label>
                  <input
                    type="text"
                    value={newSubcategoria}
                    onChange={(e) => setNewSubcategoria(e.target.value)}
                    placeholder="Ej: Cargadores, Placas..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Producto:</label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej: CARGADOR DE AUTO VIP PARA GPS MINI USB 2A"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-[#0026e6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Modelo:</label>
                  <input
                    type="text"
                    value={newModelo}
                    onChange={(e) => setNewModelo(e.target.value)}
                    placeholder="Ej: VIP-GPS-2A"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">N° Serie / Parte:</label>
                  <input
                    type="text"
                    value={newNSerie}
                    onChange={(e) => setNewNSerie(e.target.value)}
                    placeholder="Ej: CAR0024"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Actual:</label>
                  <input
                    type="number"
                    min={0}
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-[#0026e6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Mínimo:</label>
                  <input
                    type="number"
                    min={0}
                    value={newStockMin}
                    onChange={(e) => setNewStockMin(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Precio Costo ($):</label>
                  <input
                    type="number"
                    value={newPrecioCosto}
                    onChange={(e) => setNewPrecioCosto(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Precio Venta ($):</label>
                  <input
                    type="number"
                    value={newPrecio}
                    onChange={(e) => setNewPrecio(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-black text-emerald-700 focus:outline-none focus:border-[#0026e6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detalles & Especificaciones:</label>
                <textarea
                  rows={2}
                  value={newDetalles}
                  onChange={(e) => setNewDetalles(e.target.value)}
                  placeholder="Detalles técnicos, voltaje, compatibilidades..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black rounded-xl bg-[#0026e6] hover:bg-[#001ec2] text-white shadow-md"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {sellingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-black text-base flex items-center gap-2 text-slate-900">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Venta y Emisión de Factura
              </h3>
              <button
                onClick={() => setSellingItem(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sellMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold text-xs rounded-xl animate-pulse">
                {sellMessage}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-900">{sellingItem.nombre}</div>
                  <div className="text-[11px] text-slate-500">
                    SKU: {sellingItem.sku} • Stock disponible: {sellingItem.stock}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Cliente:</label>
                  <input
                    type="text"
                    value={sellCliente}
                    onChange={(e) => setSellCliente(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">C.I. / R.U.T.:</label>
                    <input
                      type="text"
                      value={sellCi}
                      onChange={(e) => setSellCi(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0026e6]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Precio Cobrado ($):</label>
                    <input
                      type="number"
                      value={sellPrecio}
                      onChange={(e) => setSellPrecio(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-emerald-700 focus:outline-none focus:border-[#0026e6]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    onClick={() => setSellingItem(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmSale}
                    className="px-4 py-2 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer"
                  >
                    Emitir Factura de Venta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
