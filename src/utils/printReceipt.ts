import { Ticket, Factura } from "../types";
import { KING_PC_LOGO_SVG } from "../components/KingPcLogo";

/**
 * High-Density, High-Contrast Thermal CSS for 80mm & 58mm POS Printers.
 * Left Side: Solid, Intense Deep Black (#000000) with heavy font weight (900).
 * Right Side: Clear, highly readable text with balanced contrast to differentiate.
 */
const THERMAL_CSS = `
  @page {
    size: auto;
    margin: 0mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    width: 78mm;
    max-width: 78mm;
    margin: 0;
    padding: 2px 2px 4px 2px;
    color: #000000 !important;
    background: #ffffff;
    font-family: 'Courier New', 'Lucida Console', Monaco, monospace;
    font-size: 11.5px;
    font-weight: 800;
    line-height: 1.2;
    text-rendering: geometricPrecision;
    page-break-after: avoid !important;
    page-break-before: avoid !important;
  }
  .ticket-block {
    width: 100%;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    page-break-after: avoid !important;
    page-break-before: avoid !important;
    padding-bottom: 1px;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .font-black { font-weight: 900 !important; }
  .font-bold { font-weight: 800 !important; }
  .uppercase { text-transform: uppercase; }
  
  .logo-wrap {
    text-align: center;
    margin-bottom: 1px;
  }
  .logo-wrap svg {
    max-width: 125px !important;
    height: auto !important;
    margin: 0 auto !important;
  }
  .company-title {
    font-size: 15px;
    font-weight: 900;
    letter-spacing: 0.2px;
    margin-bottom: 0.5px;
    color: #000000 !important;
    font-family: 'Arial Black', Impact, 'Segoe UI Black', sans-serif;
  }
  .company-sub {
    font-size: 10px;
    font-weight: 900;
    margin-bottom: 0.5px;
    color: #000000 !important;
  }
  .company-contact {
    font-size: 10.5px;
    font-weight: 900;
    margin-bottom: 1px;
    color: #000000 !important;
  }
  .copy-banner {
    font-size: 11px;
    font-weight: 900;
    margin: 2px 0;
    letter-spacing: 0.2px;
    color: #000000 !important;
  }
  .divider-dashed {
    border-top: 1.2px dashed #000000;
    margin: 3px 0;
    width: 100%;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.5px 0;
  }
  .data-table td {
    padding: 1px 0;
    vertical-align: top;
    line-height: 1.15;
  }
  /* LEFT COLUMN: Ultra Bold, Intense Deep Solid Black */
  .data-table td.label-col {
    text-align: left;
    white-space: nowrap;
    width: 44%;
    color: #000000 !important;
    font-weight: 900 !important;
    font-family: 'Arial Black', Impact, 'Segoe UI Black', sans-serif !important;
    font-size: 11.5px;
    letter-spacing: 0.1px;
  }
  /* RIGHT COLUMN: Solid Deep Black Strong Text */
  .data-table td.val-col {
    text-align: right;
    width: 56%;
    word-break: break-word;
    color: #000000 !important;
    font-weight: 800 !important;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
  }
  .data-table td.val-col.highlight-val {
    color: #000000 !important;
    font-weight: 900 !important;
  }
  .total-row td.label-col {
    color: #000000 !important;
    font-size: 12.5px;
    font-weight: 900 !important;
    font-family: 'Arial Black', Impact, 'Segoe UI Black', sans-serif !important;
    padding-top: 1.5px;
  }
  .total-row td.val-col {
    font-size: 13px;
    font-weight: 900 !important;
    color: #000000 !important;
    padding-top: 1.5px;
  }
  .lab-footer {
    font-size: 10.5px;
    font-weight: 900;
    text-align: center;
    margin-top: 2.5px;
    letter-spacing: 0.2px;
    color: #000000;
  }
  .client-footer {
    font-size: 9.5px;
    font-weight: 800;
    text-align: center;
    line-height: 1.18;
    margin-top: 2px;
    color: #000000;
  }
  .client-footer .clause-important {
    font-size: 8.5px;
    font-weight: 900;
    margin-top: 2px;
    padding: 2px 2.5px;
    border: 1px solid #000000;
    text-align: center;
    line-height: 1.15;
    text-transform: uppercase;
  }
  .cut-marker {
    margin: 5px 0 4px 0;
    text-align: center;
    font-size: 10.5px;
    font-weight: 900;
    letter-spacing: 1px;
    color: #000000;
    user-select: none;
    page-break-before: avoid !important;
    page-break-after: avoid !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  @media screen {
    body {
      margin: 8px auto;
      padding: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      border: 1px solid #ddd;
    }
  }
  @media print {
    html, body {
      width: 78mm !important;
      max-width: 78mm !important;
      margin: 0 !important;
      padding: 1mm 1mm 2mm 1mm !important;
      page-break-after: avoid !important;
      page-break-before: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .ticket-block {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      page-break-before: avoid !important;
    }
    .cut-marker {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      page-break-before: avoid !important;
    }
  }
`;

function formatMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "$ 0.00";
  }
  return `$ ${Number(amount).toFixed(2)}`;
}

function formatTicketDate(fechaInput?: string | Date): string {
  const d = fechaInput ? new Date(fechaInput) : new Date();
  if (isNaN(d.getTime())) return new Date().toLocaleDateString("es-UY");

  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "p. m." : "a. m.";
  hours = hours % 12;
  hours = hours ? hours : 12; // 12-hour format

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Standardized Section Generator that renders BOTH copies with IDENTICAL size, layout and bold typography
 */
function renderThermalTicketBody(
  ticket: Ticket,
  fechaFormateada: string,
  type: "taller" | "cliente",
  options?: { includeLogo?: boolean }
): string {
  const isTaller = type === "taller";
  const copyTitle = isTaller ? "*** COPIA LOCAL (TALLER) ***" : "*** COPIA CLIENTE ***";
  const includeLogo = options?.includeLogo !== false;

  const totalNum = ticket.presupuesto !== null && ticket.presupuesto !== undefined ? Number(ticket.presupuesto) : 0;
  const abonoNum = ticket.abono !== null && ticket.abono !== undefined ? Number(ticket.abono) : 0;
  const saldoNum = ticket.saldo !== null && ticket.saldo !== undefined ? Number(ticket.saldo) : Math.max(0, totalNum - abonoNum);

  return `
  <div class="ticket-block">
    <div class="text-center">
      ${
        includeLogo
          ? `
      <div class="logo-wrap">
        ${KING_PC_LOGO_SVG}
      </div>`
          : ""
      }
      <div class="company-title">KING PC COLONIA</div>
      <div class="company-sub">Servicio Técnico & Reparaciones</div>
      <div class="company-sub">Av. Aparicio Saravia 884 • Colonia del Sacramento</div>
      <div class="company-contact">Tel: 091 606 108 / 4523 7187 • kingpccolonia.com</div>
      <div class="copy-banner">${copyTitle}</div>
    </div>

    <div class="divider-dashed"></div>

    <table class="data-table">
      <tr>
        <td class="label-col">Ticket:</td>
        <td class="val-col highlight-val font-black">${ticket.ticket_num || "REP-000000"}</td>
      </tr>
      <tr>
        <td class="label-col">Fecha:</td>
        <td class="val-col">${fechaFormateada}</td>
      </tr>
      <tr>
        <td class="label-col">Cliente:</td>
        <td class="val-col highlight-val">${ticket.cliente || "Particular"}</td>
      </tr>
      <tr>
        <td class="label-col">CI:</td>
        <td class="val-col">${ticket.ci || "S/N"}</td>
      </tr>
      <tr>
        <td class="label-col">Teléfono:</td>
        <td class="val-col">${ticket.telefono || "S/N"}</td>
      </tr>
    </table>

    <div class="divider-dashed"></div>

    <table class="data-table">
      <tr>
        <td class="label-col">Equipo:</td>
        <td class="val-col highlight-val uppercase">${ticket.dispositivo || "EQUIPO"}</td>
      </tr>
      <tr>
        <td class="label-col">Motivo:</td>
        <td class="val-col">${ticket.falla || "Revisión técnica"}</td>
      </tr>
    </table>

    <div class="divider-dashed"></div>

    <table class="data-table">
      <tr>
        <td class="label-col">Presupuesto Total:</td>
        <td class="val-col">${formatMoney(totalNum)}</td>
      </tr>
      <tr>
        <td class="label-col">Abonó / Seña:</td>
        <td class="val-col">${formatMoney(abonoNum)}</td>
      </tr>
      <tr class="total-row">
        <td class="label-col">Resta Pagar:</td>
        <td class="val-col font-black">${formatMoney(saldoNum)}</td>
      </tr>
    </table>

    ${
      isTaller
        ? `
      <div class="lab-footer">
        CONTROL INTERNO DE LABORATORIO
      </div>
    `
        : `
      <div class="divider-dashed"></div>
      <div class="client-footer">
        <div style="font-weight: 800;">• Presente este comprobante para retirar su equipo.</div>
        <div style="font-weight: 800; margin-top: 1.5px;">• Contáctenos al número: 091 606 108 / 4523 7187</div>
        <div style="font-weight: 800; margin-top: 1.5px;">• ¡Gracias por su preferencia!</div>
        <div class="clause-important">
          Después de 15 días de haberse dado presupuesto, la empresa no se hace responsable por equipos dejados en el taller.
        </div>
      </div>
    `
    }
  </div>
  `;
}

/**
 * 1. Generates Double Ticket (Workshop Copy + Customer Copy with identical sizes and cutting line)
 */
export function generateDoubleThermalReceiptHtml(ticket: Ticket, options?: { includeLogo?: boolean }): string {
  const fechaFormateada = formatTicketDate(ticket.fecha);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ticket_Doble_${ticket.ticket_num}_KingPC</title>
  <style>${THERMAL_CSS}</style>
</head>
<body>
  ${renderThermalTicketBody(ticket, fechaFormateada, "taller", options)}

  <div class="cut-marker">
    ✂ - - - - - - - - - - - - - - - - - - - - - -
  </div>

  ${renderThermalTicketBody(ticket, fechaFormateada, "cliente", options)}
</body>
</html>
  `.trim();
}

/**
 * 2. Generates Client Copy only
 */
export function generateClientOnlyThermalReceiptHtml(ticket: Ticket, options?: { includeLogo?: boolean }): string {
  const fechaFormateada = formatTicketDate(ticket.fecha);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ticket_Cliente_${ticket.ticket_num}_KingPC</title>
  <style>${THERMAL_CSS}</style>
</head>
<body>
  ${renderThermalTicketBody(ticket, fechaFormateada, "cliente", options)}
</body>
</html>
  `.trim();
}

/**
 * 3. Generates Workshop / Lab Copy only (for sticking on hardware)
 */
export function generateWorkshopOnlyThermalReceiptHtml(ticket: Ticket, options?: { includeLogo?: boolean }): string {
  const fechaFormateada = formatTicketDate(ticket.fecha);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ticket_Taller_${ticket.ticket_num}_KingPC</title>
  <style>${THERMAL_CSS}</style>
</head>
<body>
  ${renderThermalTicketBody(ticket, fechaFormateada, "taller", options)}
</body>
</html>
  `.trim();
}

/**
 * Backwards compatibility alias for default thermal ticket (double copy)
 */
export function generateThermalReceiptHtml(ticket: Ticket, options?: { includeLogo?: boolean }): string {
  return generateDoubleThermalReceiptHtml(ticket, options);
}

/**
 * Automatically determines the warranty statement according to King PC rules:
 * - Televisores, computadoras y consolas: Garantía de 3 meses en mano de obra y repuestos por servicio realizado
 * - Celulares: Sin garantía
 * - Accesorios y productos de catálogo: 3 meses de garantía oficial
 */
export function determineWarranty(deviceOrDetail: string): string {
  const norm = (deviceOrDetail || "").toLowerCase();
  
  // Celulares no llevan garantía
  if (
    norm.includes("celular") ||
    norm.includes("telefono") ||
    norm.includes("smartphone") ||
    norm.includes("iphone") ||
    norm.includes("samsung galaxy") ||
    norm.includes("xiaomi") ||
    norm.includes("motorola") ||
    norm.includes("redmi") ||
    norm.includes("huawei")
  ) {
    return ""; // No lleva garantía
  }

  // Televisores, computadoras y consolas de videojuegos llevan 3 meses por servicio realizado
  if (
    norm.includes("televisor") ||
    norm.includes("tele") ||
    norm.includes("tv") ||
    norm.includes("panavox") ||
    norm.includes("smart tv") ||
    norm.includes("computadora") ||
    norm.includes("pc") ||
    norm.includes("notebook") ||
    norm.includes("laptop") ||
    norm.includes("torre") ||
    norm.includes("consola") ||
    norm.includes("playstation") ||
    norm.includes("ps5") ||
    norm.includes("ps4") ||
    norm.includes("play 5") ||
    norm.includes("play 4") ||
    norm.includes("xbox") ||
    norm.includes("nintendo") ||
    norm.includes("control") ||
    norm.includes("mando")
  ) {
    return "Garantía de 3 meses en mano de obra y repuestos por servicio realizado";
  }

  return "3 meses de garantía oficial";
}

/**
 * High-Density & Elegant CSS for single invoices / payment vouchers.
 * Larger dimensions, comfortable font sizing, crisp contrast and borders.
 */
const INVOICE_CSS = `
  @page {
    size: auto;
    margin: 0mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    width: 88mm;
    max-width: 88mm;
    margin: 0;
    padding: 4px 4px 6px 4px;
    color: #000000 !important;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.35;
    text-rendering: geometricPrecision;
    page-break-after: avoid !important;
  }
  .invoice-block {
    width: 100%;
    page-break-inside: avoid !important;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .font-black { font-weight: 900 !important; }
  .font-bold { font-weight: 800 !important; }
  .uppercase { text-transform: uppercase; }
  
  .logo-wrap {
    text-align: center;
    margin-bottom: 3px;
  }
  .logo-wrap svg {
    max-width: 155px !important;
    height: auto !important;
    margin: 0 auto !important;
  }
  .company-title {
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 0.5px;
    margin-bottom: 1px;
    color: #000000 !important;
    font-family: 'Arial Black', Impact, sans-serif;
  }
  .company-sub {
    font-size: 11.5px;
    font-weight: 800;
    margin-bottom: 1px;
    color: #111111 !important;
  }
  .company-address {
    font-size: 11.5px;
    font-weight: 800;
    margin-bottom: 1px;
    color: #000000 !important;
  }
  .company-contact {
    font-size: 12px;
    font-weight: 900;
    margin-bottom: 2px;
    color: #000000 !important;
  }
  .copy-banner {
    font-size: 12.5px;
    font-weight: 900;
    margin: 4px 0;
    letter-spacing: 0.5px;
    background: #000000;
    color: #ffffff !important;
    padding: 3px 6px;
    border-radius: 4px;
  }
  .divider-dashed {
    border-top: 1.5px dashed #000000;
    margin: 5px 0;
    width: 100%;
  }
  .divider-solid {
    border-top: 2px solid #000000;
    margin: 6px 0;
    width: 100%;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 2px 0;
  }
  .data-table td {
    padding: 2.5px 0;
    vertical-align: top;
    line-height: 1.25;
  }
  .data-table td.label-col {
    text-align: left;
    white-space: nowrap;
    width: 38%;
    color: #000000 !important;
    font-weight: 900 !important;
    font-size: 12.5px;
  }
  .data-table td.val-col {
    text-align: right;
    width: 62%;
    word-break: break-word;
    color: #000000 !important;
    font-weight: 800 !important;
    font-size: 12.5px;
  }
  .detail-box {
    background: #f8fafc;
    border: 1.5px solid #000000;
    border-radius: 6px;
    padding: 6px 8px;
    margin: 4px 0;
    font-size: 12.5px;
    font-weight: 800;
    line-height: 1.35;
  }
  .total-row td.label-col {
    color: #000000 !important;
    font-size: 14px;
    font-weight: 900 !important;
    font-family: 'Arial Black', Impact, sans-serif !important;
    padding-top: 4px;
  }
  .total-row td.val-col {
    font-size: 16px;
    font-weight: 900 !important;
    color: #000000 !important;
    padding-top: 4px;
  }
  .warranty-badge {
    border: 1.5px solid #000000;
    background: #f0fdf4;
    padding: 5px 6px;
    border-radius: 6px;
    text-align: center;
    margin: 6px 0;
    font-weight: 900;
    font-size: 11px;
    line-height: 1.3;
  }
  .warranty-badge.no-warranty {
    background: #fef2f2;
    border: 1px dashed #666666;
    font-size: 10.5px;
    color: #333333;
  }
  .invoice-footer {
    font-size: 11px;
    font-weight: 800;
    text-align: center;
    line-height: 1.35;
    margin-top: 6px;
    color: #000000;
  }
  @media screen {
    body {
      margin: 10px auto;
      padding: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      border: 1px solid #ccc;
      border-radius: 8px;
    }
  }
  @media print {
    html, body {
      width: 88mm !important;
      max-width: 88mm !important;
      margin: 0 !important;
      padding: 2mm 2mm 3mm 2mm !important;
    }
  }
`;

/**
 * Generates an isolated HTML document string for Facturas / Sales Tickets.
 * Contains only job description, total amount (no seña, no plazo), contact info,
 * gratitude, and conditional warranty clause:
 * "Garantía de 3 meses en mano de obra y repuestos por servicio realizado".
 */
export function generateInvoiceReceiptHtml(factura: Factura, options?: { includeLogo?: boolean }): string {
  const fechaStr = formatTicketDate(factura.fecha);
  const includeLogo = options?.includeLogo !== false;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Comprobante_${factura.factura_num}_KingPC</title>
  <style>${INVOICE_CSS}</style>
</head>
<body>
  <div class="invoice-block">
    <div class="text-center">
      ${
        includeLogo
          ? `
      <div class="logo-wrap">
        ${KING_PC_LOGO_SVG}
      </div>`
          : ""
      }
      <div class="company-title">KING PC COLONIA</div>
      <div class="company-sub">Servicio Técnico & Soluciones Informáticas</div>
      <div class="company-address">Av. Aparicio Saravia 884 • Colonia del Sacramento</div>
      <div class="company-contact">Tel: 091 606 108 / 4523 7187 • kingpccolonia.com</div>
      <div class="copy-banner">*** COMPROBANTE DE PAGO ***</div>
    </div>

    <div class="divider-dashed"></div>

    <table class="data-table">
      <tr>
        <td class="label-col">Comprobante N°:</td>
        <td class="val-col font-black">${factura.factura_num}</td>
      </tr>
      <tr>
        <td class="label-col">Fecha / Hora:</td>
        <td class="val-col">${fechaStr}</td>
      </tr>
      <tr>
        <td class="label-col">Cliente:</td>
        <td class="val-col font-black">${factura.cliente}</td>
      </tr>
      <tr>
        <td class="label-col">C.I. / RUT:</td>
        <td class="val-col">${factura.ci || "S/N"}</td>
      </tr>
      ${
        factura.ticket_num && factura.ticket_num !== "S/N"
          ? `<tr>
        <td class="label-col">Orden Ref:</td>
        <td class="val-col font-bold">#${factura.ticket_num}</td>
      </tr>`
          : ""
      }
    </table>

    <div class="divider-dashed"></div>

    <div style="font-size: 11.5px; font-weight: 900; margin-bottom: 2px; color: #000000;">
      DETALLE DEL SERVICIO / ARTÍCULO:
    </div>
    <div class="detail-box">
      ${factura.detalle}
    </div>

    <div class="divider-solid"></div>

    <table class="data-table">
      <tr>
        <td class="label-col">Subtotal:</td>
        <td class="val-col font-bold">${formatMoney(factura.subtotal || factura.total)}</td>
      </tr>
      <tr>
        <td class="label-col">IVA (Incluido):</td>
        <td class="val-col font-bold">$ 0.00</td>
      </tr>
      <tr class="total-row">
        <td class="label-col">TOTAL ABONADO:</td>
        <td class="val-col font-black">${formatMoney(factura.total)}</td>
      </tr>
    </table>

    <div class="divider-dashed"></div>

    ${
      factura.garantia && factura.garantia.trim() !== ""
        ? `<div class="warranty-badge">
            <div style="font-size: 10px; color: #166534; font-weight: 900;">🛡️ CLÁUSULA DE GARANTÍA OFICIAL</div>
            <div style="font-size: 11.5px; margin-top: 2px; text-transform: uppercase;">
              ${factura.garantia}
            </div>
          </div>`
        : `<div class="warranty-badge no-warranty">
            [SERVICIO SIN GARANTÍA]
          </div>`
    }

    <div class="invoice-footer">
      <div style="font-weight: 900; font-size: 11.5px;">• Dirección: Av. Aparicio Saravia 884, Colonia del Sacramento</div>
      <div style="font-weight: 900; font-size: 11.5px; margin-top: 2px;">• Teléfono: 091 606 108 / 4523 7187</div>
      <div style="font-weight: 900; font-size: 12px; margin-top: 4px; color: #000000;">¡Muchas gracias por su preferencia!</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Universal print trigger that safely handles sandboxed iframes by opening a blob tab or data url if needed.
 */
export function printHtmlViaIframe(htmlContent: string): boolean {
  try {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    
    const printWindow = window.open(blobUrl, "_blank", "width=440,height=750,menubar=no,toolbar=no,location=no,status=no");
    if (printWindow) {
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (e) {
          console.warn("Print in new window caught:", e);
        }
      }, 400);
      return true;
    }
  } catch (e) {
    console.warn("Blob window open failed:", e);
  }

  // Fallback to iframe
  try {
    let printIframe = document.getElementById("print-job-iframe") as HTMLIFrameElement | null;
    if (!printIframe) {
      printIframe = document.createElement("iframe");
      printIframe.id = "print-job-iframe";
      printIframe.style.position = "fixed";
      printIframe.style.right = "0";
      printIframe.style.bottom = "0";
      printIframe.style.width = "10px";
      printIframe.style.height = "10px";
      printIframe.style.opacity = "0.01";
      printIframe.style.border = "none";
      printIframe.style.zIndex = "-999";
      document.body.appendChild(printIframe);
    }

    const doc = printIframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          printIframe?.contentWindow?.focus();
          printIframe?.contentWindow?.print();
        } catch (err) {
          console.warn("Iframe print caught error (likely sandboxed without allow-modals):", err);
        }
      }, 250);
    }
    return true;
  } catch (err) {
    console.error("Failed to print via iframe:", err);
    return false;
  }
}

/**
 * Opens receipt in a clean popup window or new tab and triggers print automatically.
 */
export function openReceiptInNewWindow(htmlContent: string): void {
  try {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, "_blank", "width=440,height=750");
    if (printWindow) {
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {}
      }, 400);
    }
  } catch (e) {
    console.warn("Failed to open receipt window:", e);
  }
}

/**
 * Direct file download for thermal receipt HTML
 */
export function downloadThermalReceiptHtml(htmlContent: string, fileName: string): void {
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Plain ASCII formatted ticket strings for clipboard / Bluetooth raw printing / WhatsApp.
 */
export function generateAsciiThermalTicket(ticket: Ticket, mode: "double" | "cliente" | "taller" = "double"): string {
  const fecha = formatTicketDate(ticket.fecha);
  const total = formatMoney(ticket.presupuesto);
  const abono = formatMoney(ticket.abono);
  const saldo = formatMoney(ticket.saldo);

  const tallerSection = `        KING PC COLONIA
Servicio Técnico & Reparaciones
       kingpccolonia.com
  Tel: 091 606 108 / 4523 7187
*** COPIA LOCAL (TALLER) ***
--------------------------------
Ticket:             ${ticket.ticket_num || "REP-000000"}
Fecha:   ${fecha}
Cliente:            ${ticket.cliente || "Particular"}
CI:                 ${ticket.ci || "S/N"}
Teléfono:           ${ticket.telefono || "S/N"}
--------------------------------
Equipo:             ${(ticket.dispositivo || "EQUIPO").toUpperCase()}
Motivo:             ${ticket.falla || "Revisión técnica"}
--------------------------------
Presupuesto Total:     ${total}
Abonó / Seña:          ${abono}
Resta Pagar:           ${saldo}
 CONTROL INTERNO DE LABORATORIO`;

  const clienteSection = `        KING PC COLONIA
Servicio Técnico & Reparaciones
       kingpccolonia.com
  Tel: 091 606 108 / 4523 7187
    *** COPIA CLIENTE ***
--------------------------------
Ticket:             ${ticket.ticket_num || "REP-000000"}
Fecha:   ${fecha}
Cliente:            ${ticket.cliente || "Particular"}
CI:                 ${ticket.ci || "S/N"}
Teléfono:           ${ticket.telefono || "S/N"}
--------------------------------
Equipo:             ${(ticket.dispositivo || "EQUIPO").toUpperCase()}
Motivo:             ${ticket.falla || "Revisión técnica"}
--------------------------------
Presupuesto Total:     ${total}
Abonó / Seña:          ${abono}
Resta Pagar:           ${saldo}
--------------------------------
• Presente este comprobante para retirar su equipo.
• Contáctenos al: 091 606 108 / 4523 7187
• ¡Gracias por su preferencia!
[Después de 15 días de haberse dado presupuesto, la empresa no se hace responsable por equipos dejados en el taller]`;

  if (mode === "cliente") return clienteSection.trim();
  if (mode === "taller") return tallerSection.trim();
  return `${tallerSection}\n\n✂ - - - - - - - - - - - - - - - -\n\n${clienteSection}`.trim();
}

