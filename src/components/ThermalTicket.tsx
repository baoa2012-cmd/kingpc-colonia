import React, { useState } from "react";
import {
  Printer,
  Smartphone,
  Layers,
  User,
  Wrench,
  Receipt,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Edit,
} from "lucide-react";
import { Ticket, Factura } from "../types";
import {
  generateDoubleThermalReceiptHtml,
  generateClientOnlyThermalReceiptHtml,
  generateWorkshopOnlyThermalReceiptHtml,
  printHtmlViaIframe,
  openReceiptInNewWindow,
  downloadThermalReceiptHtml,
  generateAsciiThermalTicket,
} from "../utils/printReceipt";
import { KingPcLogo } from "./KingPcLogo";

interface ThermalTicketProps {
  ticket: Ticket;
  onClose?: () => void;
  onEdit?: (ticket: Ticket) => void;
  onGenerateInvoice?: (factura: Factura) => void;
}

export type TicketPrintMode = "double" | "cliente" | "taller";

export const ThermalTicket: React.FC<ThermalTicketProps> = ({
  ticket,
  onClose,
  onEdit,
  onGenerateInvoice,
}) => {
  const [printMode, setPrintMode] = useState<TicketPrintMode>("double");
  const [includeLogo, setIncludeLogo] = useState(true);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [remotePrintStatus, setRemotePrintStatus] = useState<string | null>(null);

  const handlePrintOnWorkshopDesktop = async () => {
    setRemotePrintStatus("Enviando...");
    try {
      const res = await fetch("/api/print/job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, mode: printMode, source: "mobile-button" }),
      });
      if (res.ok) {
        setRemotePrintStatus("¡Enviado a tu PC!");
        setTimeout(() => setRemotePrintStatus(null), 4000);
      } else {
        setRemotePrintStatus("Error al enviar");
        setTimeout(() => setRemotePrintStatus(null), 3000);
      }
    } catch (e) {
      setRemotePrintStatus("Error de red");
      setTimeout(() => setRemotePrintStatus(null), 3000);
    }
  };

  const handleCreateInvoiceFromTicket = async () => {
    setIsGeneratingInvoice(true);
    try {
      const res = await fetch("/api/facturas/from-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_num: ticket.ticket_num }),
      });

      if (res.ok) {
        const data = await res.json();
        const fac: Factura = data.factura;
        setPrintStatus(`¡Comprobante ${fac.factura_num} generado por $${fac.total}!`);
        if (onGenerateInvoice) {
          onGenerateInvoice(fac);
        }
      }
    } catch (e) {
      console.error("Error generando factura:", e);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const getHtmlForCurrentMode = (mode: TicketPrintMode) => {
    switch (mode) {
      case "cliente":
        return generateClientOnlyThermalReceiptHtml(ticket, { includeLogo });
      case "taller":
        return generateWorkshopOnlyThermalReceiptHtml(ticket, { includeLogo });
      case "double":
      default:
        return generateDoubleThermalReceiptHtml(ticket, { includeLogo });
    }
  };

  const handlePrint = (mode: TicketPrintMode = printMode) => {
    const modeLabel =
      mode === "double"
        ? "Doble Ticket (Cliente + Taller)"
        : mode === "cliente"
        ? "Ticket Cliente"
        : "Ticket Taller (Equipo)";

    setPrintStatus(`Enviando a impresora térmica: ${modeLabel}...`);
    const html = getHtmlForCurrentMode(mode);
    const success = printHtmlViaIframe(html);

    if (success) {
      setTimeout(() => {
        setPrintStatus(`¡Impresión enviada con éxito (${modeLabel})!`);
        setTimeout(() => setPrintStatus(null), 3500);
      }, 400);
    } else {
      openReceiptInNewWindow(html);
      setPrintStatus(null);
    }
  };

  const handleOpenNewWindow = () => {
    const html = getHtmlForCurrentMode(printMode);
    openReceiptInNewWindow(html);
  };

  const handleDownloadHtml = () => {
    const html = getHtmlForCurrentMode(printMode);
    downloadThermalReceiptHtml(html, `ticket_${ticket.ticket_num}_${printMode}.html`);
  };

  const handleCopyAscii = () => {
    const text = generateAsciiThermalTicket(ticket, printMode);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = generateAsciiThermalTicket(ticket, printMode);
    const encoded = encodeURIComponent(text);
    const cleanPhone = (ticket.telefono || "").replace(/[^0-9]/g, "");
    const waUrl =
      cleanPhone.length >= 8
        ? `https://wa.me/${cleanPhone.startsWith("0") ? "598" + cleanPhone.slice(1) : cleanPhone}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, "_blank");
  };

  const fechaFormateada = ticket.fecha
    ? new Date(ticket.fecha).toLocaleString("es-UY", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("es-UY");

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col text-slate-900">
      {/* Header & Modes Selector */}
      <div className="flex flex-col gap-3 pb-4 mb-4 border-b border-slate-200 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                Orden de Servicio #{ticket.ticket_num}
              </h3>
              <span className="text-[11px] text-blue-700 font-mono font-bold">
                {ticket.cliente} • {ticket.dispositivo}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
            <button
              onClick={handleCreateInvoiceFromTicket}
              disabled={isGeneratingInvoice}
              className="px-3 py-1.5 text-xs font-black rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0026e6] border border-blue-200 flex items-center gap-1 transition shadow-sm cursor-pointer"
              title="Generar factura con cláusula de garantía"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{isGeneratingInvoice ? "Generando..." : "🧾 Emitir Factura"}</span>
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(ticket)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition cursor-pointer"
              >
                ✏️ Editar
              </button>
            )}
            <button
              onClick={handleCopyAscii}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center gap-1 transition cursor-pointer"
              title="Copiar texto del ticket"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copiado" : "Copiar"}</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 transition cursor-pointer"
              title="Enviar por WhatsApp"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              id="btn-print-remote-desktop"
              onClick={handlePrintOnWorkshopDesktop}
              className="px-3 py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95"
              title="Manda a imprimir este ticket inmediatamente a la impresora térmica conectada a la PC de tu taller"
            >
              <Printer className="w-3.5 h-3.5 text-slate-950" />
              <span>{remotePrintStatus || "🖨️ Imprimir en PC Taller"}</span>
            </button>
          </div>
        </div>

        {/* PRINT MODE SELECTOR TABS */}
        <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPrintMode("double")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                printMode === "double"
                  ? "bg-[#0026e6] text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Doble Ticket (Cliente + Taller)</span>
            </button>
            <button
              onClick={() => setPrintMode("cliente")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                printMode === "cliente"
                  ? "bg-[#0026e6] text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>2. Solo Copia Cliente</span>
            </button>
            <button
              onClick={() => setPrintMode("taller")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                printMode === "taller"
                  ? "bg-[#0026e6] text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>3. Solo Copia Taller</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            <label className="flex items-center gap-1.5 text-xs text-slate-700 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeLogo}
                onChange={(e) => setIncludeLogo(e.target.checked)}
                className="rounded text-[#0026e6] focus:ring-[#0026e6] w-3.5 h-3.5 cursor-pointer"
              />
              <span className="font-bold text-[11px]">Logo Monocromático</span>
            </label>

            <button
              onClick={() => handleDownloadHtml()}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 transition cursor-pointer"
              title="Descargar archivo HTML"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>HTML</span>
            </button>

            <button
              onClick={() => handleOpenNewWindow()}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 transition cursor-pointer"
              title="Abrir en ventana"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ventana</span>
            </button>

            <button
              onClick={() => handlePrint()}
              className="px-4 py-1.5 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                Imprimir {printMode === "double" ? "Ambos Tickets (80mm)" : printMode === "cliente" ? "Copia Cliente" : "Copia Taller"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Printing Status Notification */}
      {printStatus && (
        <div className="mb-4 p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between animate-fade-in print:hidden shadow-sm">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
            <strong>{printStatus}</strong>
          </span>
          <button
            onClick={() => handleOpenNewWindow()}
            className="text-[11px] underline text-blue-700 hover:text-blue-900 font-bold"
          >
            Abrir ventana de diálogo directo
          </button>
        </div>
      )}

      {/* PREVIEW CONTAINER - WYSIWYG THERMAL OUTPUT */}
      <div
        id="thermal-receipt"
        className="bg-white text-black font-mono p-4 rounded-2xl shadow-md border-2 border-slate-300 max-w-[360px] mx-auto w-full print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-full font-bold select-text text-[11.5px] leading-tight"
      >
        {/* ================= COPIA TALLER (LOCAL) ================= */}
        {(printMode === "double" || printMode === "taller") && (
          <div className="pb-1 text-black">
            {/* Header */}
            <div className="text-center mb-1">
              {includeLogo && <KingPcLogo className="mx-auto mb-0.5" theme="monochrome" width={135} height={42} />}
              <h1 className="text-[15px] font-black tracking-tight uppercase text-black font-sans leading-none mb-0.5">
                KING PC COLONIA
              </h1>
              <p className="text-[10px] font-black text-black leading-tight">Servicio Técnico & Reparaciones</p>
              <p className="text-[10px] font-black text-black leading-tight">Av. Aparicio Saravia 884 • Colonia del Sacramento</p>
              <p className="text-[10.5px] font-black text-black leading-tight">Tel: 091 606 108 / 4523 7187 • kingpccolonia.com</p>
              <div className="text-[11px] font-black text-black my-1 uppercase tracking-wide">
                *** COPIA LOCAL (TALLER) ***
              </div>
            </div>

            <div className="border-t-[1.2px] border-dashed border-black my-1.5"></div>

            {/* Data Table */}
            <div className="space-y-0.5 my-1 text-[11px]">
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Ticket:</span>
                <span className="font-bold text-black text-[11.5px]">{ticket.ticket_num || "REP-000000"}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Fecha:</span>
                <span className="text-black font-bold text-[11px]">{fechaFormateada}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Cliente:</span>
                <span className="font-bold text-black text-[11.5px]">{ticket.cliente || "Particular"}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">CI:</span>
                <span className="text-black font-bold text-[11px]">{ticket.ci || "S/N"}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Teléfono:</span>
                <span className="text-black font-bold text-[11px]">{ticket.telefono || "Sin teléfono"}</span>
              </div>
            </div>

            <div className="border-t-[1.2px] border-dashed border-black my-1.5"></div>

            <div className="space-y-0.5 my-1 text-[11px]">
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Equipo:</span>
                <span className="font-bold uppercase text-black text-[11.5px]">{ticket.dispositivo || "EQUIPO"}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Motivo:</span>
                <span className="font-bold text-black text-right max-w-[65%] text-[10.5px]">{ticket.falla || "Revisión técnica"}</span>
              </div>
            </div>

            <div className="border-t-[1.2px] border-dashed border-black my-1.5"></div>

            <div className="space-y-0.5 my-1 text-[11px]">
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Presupuesto Total:</span>
                <span className="font-bold text-black text-[11.5px]">
                  $ {Number(ticket.presupuesto || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Abonó / Seña:</span>
                <span className="font-bold text-black text-[11.5px]">
                  $ {Number(ticket.abono || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-baseline font-black text-black pt-0.5">
                <span className="font-black text-black text-[12.5px] tracking-wide font-sans">Resta Pagar:</span>
                <span className="font-black text-black text-[13px]">
                  $ {Number(ticket.saldo !== null && ticket.saldo !== undefined ? ticket.saldo : Math.max(0, (ticket.presupuesto || 0) - (ticket.abono || 0))).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="border-t-[1.2px] border-dashed border-black my-1.5"></div>

            <div className="text-center text-[9.5px] font-bold text-black leading-tight pt-0.5 space-y-0.5">
              <div className="font-black text-[10px]">COPIA TALLER • ADHERIR AL EQUIPO</div>
            </div>
          </div>
        )}

        {/* Separator if double */}
        {printMode === "double" && (
          <div className="my-3 py-2 border-y-2 border-dashed border-black text-center text-[10px] font-black uppercase tracking-wider">
            - - - - CORTE AQUÍ (ENTREGAR AL CLIENTE) - - - -
          </div>
        )}

        {/* ================= COPIA CLIENTE ================= */}
        {(printMode === "double" || printMode === "cliente") && (
          <div className="pb-1 text-black">
            {/* Header */}
            <div className="text-center mb-1">
              {includeLogo && <KingPcLogo className="mx-auto mb-0.5" theme="monochrome" width={135} height={42} />}
              <h1 className="text-[15px] font-black tracking-tight uppercase text-black font-sans leading-none mb-0.5">
                KING PC COLONIA
              </h1>
              <p className="text-[10px] font-black text-black leading-tight">Servicio Técnico & Reparaciones</p>
              <p className="text-[10px] font-black text-black leading-tight">Av. Aparicio Saravia 884 • Colonia del Sacramento</p>
              <p className="text-[10.5px] font-black text-black leading-tight">Tel: 091 606 108 / 4523 7187 • kingpccolonia.com</p>
              <div className="text-[11px] font-black text-black my-1 uppercase tracking-wide">
                *** COMPROBANTE DE INGRESO (CLIENTE) ***
              </div>
            </div>

            <div className="border-t-[1.2px] border-dashed border-black my-1.5"></div>

            {/* Data Table */}
            <div className="space-y-0.5 my-1 text-[11px]">
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Ticket:</span>
                <span className="font-bold text-black text-[11.5px]">{ticket.ticket_num || "REP-000000"}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Fecha:</span>
                <span className="text-black font-bold text-[11px]">{fechaFormateada}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Cliente:</span>
                <span className="font-bold text-black text-[11.5px]">{ticket.cliente || "Particular"}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">CI:</span>
                <span className="text-black font-bold text-[11px]">{ticket.ci || "S/N"}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Teléfono:</span>
                <span className="text-black font-bold text-[11px]">{ticket.telefono || "Sin teléfono"}</span>
              </div>
            </div>

            <div className="border-t-[1.2px] border-dashed border-black my-1.5"></div>

            <div className="space-y-0.5 my-1 text-[11px]">
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Equipo:</span>
                <span className="font-bold uppercase text-black text-[11.5px]">{ticket.dispositivo || "EQUIPO"}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Motivo:</span>
                <span className="font-bold text-black text-right max-w-[65%] text-[10.5px]">{ticket.falla || "Revisión técnica"}</span>
              </div>
            </div>

            <div className="border-t-[1.2px] border-dashed border-black my-1.5"></div>

            <div className="space-y-0.5 my-1 text-[11px]">
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Presupuesto Total:</span>
                <span className="font-bold text-black text-[11.5px]">
                  $ {Number(ticket.presupuesto || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-black text-black text-[11.5px] tracking-wide font-sans">Abonó / Seña:</span>
                <span className="font-bold text-black text-[11.5px]">
                  $ {Number(ticket.abono || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-baseline font-black text-black pt-0.5">
                <span className="font-black text-black text-[12.5px] tracking-wide font-sans">Resta Pagar:</span>
                <span className="font-black text-black text-[13px]">
                  $ {Number(ticket.saldo !== null && ticket.saldo !== undefined ? ticket.saldo : Math.max(0, (ticket.presupuesto || 0) - (ticket.abono || 0))).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="border-t-[1.2px] border-dashed border-black my-1.5"></div>

            <div className="text-center text-[9.5px] font-bold text-black leading-tight pt-0.5 space-y-0.5">
              <div className="font-extrabold text-[10px]">• Presente este comprobante para retirar su equipo.</div>
              <div className="font-black text-[10px]">• Contáctenos al número: 091 606 108 / 4523 7187</div>
              <div className="font-black text-[10px]">• ¡Gracias por su preferencia!</div>
              <div className="mt-1 p-1 border-[1px] border-black text-[8.5px] font-black uppercase leading-tight">
                Después de 15 días de haberse dado presupuesto, la empresa no se hace responsable por equipos dejados en el taller.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
