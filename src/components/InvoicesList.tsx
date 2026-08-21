import React, { useState } from "react";
import { Receipt, Printer, ExternalLink, ShieldCheck } from "lucide-react";
import { Factura } from "../types";
import { KingPcLogo } from "./KingPcLogo";
import {
  generateInvoiceReceiptHtml,
  printHtmlViaIframe,
  openReceiptInNewWindow,
} from "../utils/printReceipt";

interface InvoicesListProps {
  facturas: Factura[];
  activeFactura?: Factura | null;
  onSelectFactura?: (fac: Factura) => void;
}

export const InvoicesList: React.FC<InvoicesListProps> = ({
  facturas,
  activeFactura,
  onSelectFactura,
}) => {
  const current = activeFactura || facturas[0];
  const [includeLogo, setIncludeLogo] = useState(true);
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  const handlePrint = () => {
    if (!current) return;
    setPrintStatus("Enviando comprobante a la impresora...");
    const html = generateInvoiceReceiptHtml(current, { includeLogo });
    const success = printHtmlViaIframe(html);
    if (success) {
      setTimeout(() => {
        setPrintStatus("¡Impresión enviada correctamente!");
        setTimeout(() => setPrintStatus(null), 3000);
      }, 500);
    } else {
      openReceiptInNewWindow(html);
      setPrintStatus(null);
    }
  };

  const handleOpenWindow = () => {
    if (!current) return;
    const html = generateInvoiceReceiptHtml(current, { includeLogo });
    openReceiptInNewWindow(html);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* List of Facturas */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#0026e6]" />
            <h3 className="font-black text-slate-900 text-sm">Facturas & Recibos Emitidos</h3>
          </div>
          <span className="text-xs font-mono font-bold text-[#0026e6] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            {facturas.length} emitidas
          </span>
        </div>

        <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
          {facturas.map((f) => (
            <div
              key={f.factura_num}
              onClick={() => onSelectFactura && onSelectFactura(f)}
              className={`p-3 rounded-xl border cursor-pointer transition ${
                current?.factura_num === f.factura_num
                  ? "bg-blue-50/80 border-[#0026e6] shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-black font-mono text-[#0026e6]">{f.factura_num}</span>
                <span className="font-black text-slate-900 font-mono">${f.total} UYU</span>
              </div>
              <div className="text-xs text-slate-900 font-bold mt-1">{f.cliente}</div>
              <div className="text-[11px] text-slate-500 truncate">{f.detalle}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Printable Invoice Display */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-3 mb-4 border-b border-slate-200 gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">
              Vista de Factura:{" "}
              <span className="font-mono text-[#0026e6] font-black">
                {current?.factura_num || "Ninguna seleccionada"}
              </span>
            </span>
          </div>
          {current && (
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeLogo}
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                  className="rounded text-[#0026e6] focus:ring-[#0026e6] w-3.5 h-3.5 cursor-pointer"
                />
                <span className="font-bold text-[11px] text-slate-800">Logo Monocromático</span>
              </label>

              <button
                onClick={handleOpenWindow}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition"
                title="Abrir en ventana para imprimir"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Ventana</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-black rounded-xl bg-[#0026e6] hover:bg-[#001ec2] active:scale-95 text-white flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#f6c90e]" />
                Imprimir Factura
              </button>
            </div>
          )}
        </div>

        {printStatus && (
          <div className="mb-3 p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-between print:hidden">
            <span>{printStatus}</span>
            <button onClick={handleOpenWindow} className="underline text-blue-700 text-[11px] font-bold">
              Abrir ventana emergente
            </button>
          </div>
        )}

        {current ? (
          <div
            id="invoice-receipt"
            className="bg-white text-slate-950 p-8 rounded-2xl border-2 border-slate-300 max-w-[540px] mx-auto w-full shadow-lg print:border-none print:shadow-none print:max-w-full font-sans transition-all"
          >
            {/* Header with Logo and Info */}
            <div className="text-center pb-4 border-b-2 border-slate-900 mb-4 space-y-1">
              {includeLogo && <KingPcLogo className="mx-auto mb-1" theme="monochrome" width={160} height={50} />}
              <h2 className="text-xl font-black font-sans uppercase tracking-tight text-black">KING PC COLONIA</h2>
              <p className="text-xs font-bold text-slate-800">Servicio Técnico & Soluciones Informáticas</p>
              <p className="text-xs font-bold text-slate-800">Av. Aparicio Saravia 884 • Colonia del Sacramento</p>
              <p className="text-xs font-bold text-slate-800">Tel: 091 606 108 / 4523 7187 • kingpccolonia.com</p>
              <div className="mt-2 inline-block bg-black text-white font-black text-xs px-4 py-1 rounded-md uppercase tracking-wider">
                COMPROBANTE N° {current.factura_num}
              </div>
            </div>

            {/* Customer & Document Information */}
            <div className="space-y-1.5 my-3 border-b border-slate-300 pb-3 text-xs sm:text-sm">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-slate-600">Fecha / Hora:</span>
                <span className="font-medium text-slate-950 font-mono">{new Date(current.fecha).toLocaleString("es-UY")}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-slate-600">Cliente:</span>
                <span className="font-black text-slate-950 uppercase">{current.cliente}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-slate-600">C.I. / RUT:</span>
                <span className="font-mono font-bold text-slate-950">{current.ci || "S/N"}</span>
              </div>
              {current.ticket_num && current.ticket_num !== "S/N" && (
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-600">Orden de Servicio Ref:</span>
                  <span className="font-mono font-black text-slate-950">#{current.ticket_num}</span>
                </div>
              )}
            </div>

            {/* Service & Product Concept Detail */}
            <div className="my-3 border-b border-slate-300 pb-3">
              <span className="text-xs font-black uppercase text-slate-800 block mb-1">
                Detalle del Servicio / Artículo:
              </span>
              <div className="text-sm font-semibold bg-slate-50 p-3 rounded-lg border border-slate-300 text-slate-900 leading-relaxed">
                {current.detalle}
              </div>
            </div>

            {/* Totals Section */}
            <div className="space-y-1.5 text-xs sm:text-sm my-3">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Subtotal:</span>
                <span className="font-mono font-bold">${(current.subtotal || current.total).toLocaleString("es-UY")} UYU</span>
              </div>
              <div className="flex justify-between text-slate-600 text-xs">
                <span>IVA (Incluido):</span>
                <span className="font-mono">$0 UYU</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-black border-t-2 border-slate-950 pt-2 text-slate-950">
                <span className="font-black">TOTAL ABONADO:</span>
                <span className="font-black font-mono">${current.total.toLocaleString("es-UY")} UYU</span>
              </div>
            </div>

            {/* Dynamic Warranty Box */}
            {current.garantia && current.garantia.trim() !== "" ? (
              <div className="bg-emerald-50 border-2 border-emerald-600 p-3 rounded-xl my-4 text-center">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 block mb-0.5">
                  🛡️ Cláusula de Garantía Oficial
                </span>
                <span className="font-bold text-xs sm:text-sm text-emerald-950 uppercase leading-snug block">
                  {current.garantia}
                </span>
              </div>
            ) : (
              <div className="bg-slate-100 border border-slate-300 p-2 rounded-lg my-3 text-center text-xs text-slate-600 font-bold">
                [SERVICIO SIN GARANTÍA]
              </div>
            )}

            {/* Footer Note */}
            <div className="text-center mt-4 pt-3 border-t border-slate-300 text-xs space-y-0.5 text-slate-800 font-medium">
              <div className="font-bold text-black">Av. Aparicio Saravia 884 • Colonia del Sacramento</div>
              <div>Tel: 091 606 108 / 4523 7187 • kingpccolonia.com</div>
              <div className="font-black text-black pt-1">¡Muchas gracias por su preferencia!</div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            Selecciona una factura de la lista para verla e imprimirla.
          </div>
        )}
      </div>
    </div>
  );
};
