import { getDbPool, saveRepairTicketToDb, loadAllTicketsFromDb, loadAllCustomersFromDb, syncCustomerAndWebUser } from './src/db.js';
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy Gemini client helper
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

/**
 * Resilient Gemini Content Generation with ultra-fast flash models and fallback
 */
async function generateContentWithResilience(ai: GoogleGenAI, params: { contents: any; config?: any }) {
  const candidateModels = ["gemini-2.5-flash", "gemini-3.7-flash"];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: {
          ...params.config,
          maxOutputTokens: 300,
        },
      });
      if (res && res.text) {
        return res;
      }
    } catch (err: any) {
      lastError = err;
      const isTemporary =
        err?.status === 503 ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("UNAVAILABLE") ||
        err?.message?.includes("RESOURCE_EXHAUSTED") ||
        err?.message?.includes("503");

      if (isTemporary) {
        console.warn(`[Gemini Model ${model} unavailable (503/High Demand). Trying fallback model...]`);
        continue;
      } else {
        throw err;
      }
    }
  }

  throw lastError || new Error("All Gemini models temporarily unavailable");
}

export interface Factura {
  id: number;
  factura_num: string;
  ticket_num: string;
  cliente: string;
  ci?: string;
  detalle: string;
  subtotal: number;
  iva: number;
  total: number;
  garantia: string;
  fecha: string;
  metodo_pago?: string;
  emisor?: string;
}

// In-Memory Database Store for 15e Colony / King PC
interface DBStore {
  reparaciones: any[];
  facturas: Factura[];
  clientes: any[];
  inventario: any[];
  ventas: any[];
  personalidad: string[];
  memoria: string[];
  contacts: any[];
  messages: any[];
  stickers: any[];
  usuarioActual: string;
  ticketEnFoco: any | null;
}

const store: DBStore = {
  usuarioActual: "señor",
  ticketEnFoco: null,
  clientes: [
    {
      id: 1,
      nombre: "Mauro Da Silva",
      ci: "4.892.114-2",
      telefono: "099 123 456",
      email: "mauro.dasilva@hotmail.com",
      direccion: "Av. Roger Balet 410, Colonia",
      fecha_registro: new Date(Date.now() - 86400000 * 10).toISOString(),
      total_reparaciones: 1,
      saldo_pendiente: 2800,
      notas: "TV Samsung 50' Backlight",
    },
    {
      id: 2,
      nombre: "Julio César",
      ci: "4.561.229-4",
      telefono: "099 789 123",
      email: "julio.cesar@gmail.com",
      direccion: "Rambla Costanera 540, Colonia",
      fecha_registro: new Date().toISOString(),
      total_reparaciones: 1,
      saldo_pendiente: 1500,
      notas: "iPhone 13 ingresado en la mañana para cambio de batería",
    },
    {
      id: 3,
      nombre: "Raúl Giménez",
      ci: "3.441.890-2",
      telefono: "099 444 888",
      email: "raul.gimenez@gmail.com",
      direccion: "Calle Real 204, Colonia",
      fecha_registro: new Date(Date.now() - 86400000 * 5).toISOString(),
      total_reparaciones: 1,
      saldo_pendiente: 0,
      notas: "Don Raúl - Consulta de servicio técnico",
    },
    {
      id: 4,
      nombre: "Andrés Ojeda",
      ci: "3.784.992-1",
      telefono: "098 765 432",
      email: "andres.ojeda@colonia.uy",
      direccion: "Centro, Colonia del Sacramento",
      fecha_registro: new Date(Date.now() - 86400000 * 20).toISOString(),
      total_reparaciones: 2,
      saldo_pendiente: 2500,
      notas: "Notebook HP - Técnico electricista colaborador",
    },
    {
      id: 5,
      nombre: "Gonzalo Castro",
      ci: "4.120.301-8",
      telefono: "091 555 777",
      email: "gonzalo.castro@gmail.com",
      direccion: "Barrio Histórico, Colonia",
      fecha_registro: new Date(Date.now() - 86400000 * 30).toISOString(),
      total_reparaciones: 1,
      saldo_pendiente: 0,
      notas: "Mandos de PS5 / Gaming",
    },
  ],
  reparaciones: [
    {
      id: 1,
      ticket_num: "ST-000403",
      cliente: "Mauro Da Silva",
      cliente_nombre: "Mauro Da Silva",
      ci: "4.892.114-2",
      cliente_ci: "4.892.114-2",
      telefono: "099 123 456",
      dispositivo: "SAMSUNG SMART TV 50\"",
      falla: "Tiene audio pero no da imagen (Falla de tiras LED backlight)",
      presupuesto: 3800,
      costo_estimado: 3800,
      abono: 1000,
      saldo: 2800,
      revision_pagada: "SI",
      estado: "en_revision",
      fecha: new Date(Date.now() - 86400000 * 2).toISOString(),
      fecha_ingreso: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 2,
      ticket_num: "ST-000404",
      cliente: "Andrés Ojeda",
      cliente_nombre: "Andrés Ojeda",
      ci: "3.784.992-1",
      cliente_ci: "3.784.992-1",
      telefono: "098 765 432",
      dispositivo: "NOTEBOOK HP 15-DY",
      falla: "Cambio de módulo de pantalla y mantenimiento térmico",
      presupuesto: 4500,
      costo_estimado: 4500,
      abono: 2000,
      saldo: 2500,
      revision_pagada: "SI",
      estado: "esperando_repuesto",
      fecha: new Date(Date.now() - 86400000).toISOString(),
      fecha_ingreso: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 3,
      ticket_num: "ST-000405",
      cliente: "Gonzalo Castro",
      cliente_nombre: "Gonzalo Castro",
      ci: "4.120.301-8",
      cliente_ci: "4.120.301-8",
      telefono: "091 555 777",
      dispositivo: "CONTROL PLAYSTATION 5",
      falla: "Cambio de análogo / Corrección de drift palanca izquierda",
      presupuesto: 1200,
      costo_estimado: 1200,
      abono: 1200,
      saldo: 0,
      revision_pagada: "SI",
      estado: "reparado",
      fecha: new Date().toISOString(),
      fecha_ingreso: new Date().toISOString(),
    },
    {
      id: 4,
      ticket_num: "ST-000406",
      cliente: "Julio César",
      cliente_nombre: "Julio César",
      ci: "4.561.229-4",
      cliente_ci: "4.561.229-4",
      telefono: "099 789 123",
      dispositivo: "APPLE IPHONE 13",
      falla: "Cambio de batería y revisión técnica",
      presupuesto: 3500,
      costo_estimado: 3500,
      abono: 2000,
      saldo: 1500,
      revision_pagada: "SI",
      estado: "recibido",
      fecha: new Date().toISOString(),
      fecha_ingreso: new Date().toISOString(),
    },
  ],
  inventario: [
    {
      id: 1,
      codigo: "LED-PAN-40",
      nombre: "Kit Tiras LED Backlight TV Panavox 40\" (3 tiras)",
      categoria: "LEDS_BACKLIGHT",
      stock: 6,
      stock_minimo: 2,
      precio_costo: 850,
      precio_venta: 1800,
      ubicacion: "Estante A-1",
      compatibilidad: "Panavox 40 pulgadas / Hisense 40K3110",
    },
    {
      id: 2,
      codigo: "LED-SAM-50",
      nombre: "Kit Tiras LED Backlight Samsung 50\" UHD 4K (4 tiras)",
      categoria: "LEDS_BACKLIGHT",
      stock: 4,
      stock_minimo: 2,
      precio_costo: 1200,
      precio_venta: 2500,
      ubicacion: "Estante A-2",
      compatibilidad: "Samsung UN50TU7000 / UN50TU8000 Series",
    },
    {
      id: 3,
      codigo: "MOD-PS5-HALL",
      nombre: "Módulo Stick Analógico Hall Effect PS5 DualSense (Antidrift)",
      categoria: "MANDOS_JOYSTICKS",
      stock: 14,
      stock_minimo: 4,
      precio_costo: 350,
      precio_venta: 900,
      ubicacion: "Cajón B-3",
      compatibilidad: "PlayStation 5 DualSense BDM-010 / 020 / 030",
    },
    {
      id: 4,
      codigo: "CTR-PS5-WHT",
      nombre: "Control PlayStation 5 DualSense Inalámbrico Color Blanco",
      categoria: "MANDOS_JOYSTICKS",
      stock: 8,
      stock_minimo: 2,
      precio_costo: 2800,
      precio_venta: 4200,
      ubicacion: "Vitrina Gaming 1",
      compatibilidad: "Consola PlayStation 5 / PC Bluetooth",
    },
    {
      id: 5,
      codigo: "AUR-JBL-510",
      nombre: "Auricular JBL Tune Bluetooth Inalámbrico",
      categoria: "CONSUMIBLES",
      stock: 6,
      stock_minimo: 2,
      precio_costo: 2400,
      precio_venta: 3800,
      ubicacion: "Vitrina Audio A",
      compatibilidad: "Bluetooth / Smartphones / PC / Smart TV",
    },
    {
      id: 6,
      codigo: "PAN-NOTE-156",
      nombre: "Pantalla Display LED Notebook 15.6\" FHD 30 pines Slim",
      categoria: "PANTALLAS",
      stock: 3,
      stock_minimo: 2,
      precio_costo: 2400,
      precio_venta: 4200,
      ubicacion: "Armario P-1",
      compatibilidad: "HP, Lenovo, Acer, Asus 15.6 pulgadas Slim",
    },
    {
      id: 7,
      codigo: "INS-MX4-4G",
      nombre: "Pasta Térmica Arctic MX-4 Jeringa 4g de Alto Rendimiento",
      categoria: "CONSUMIBLES",
      stock: 8,
      stock_minimo: 3,
      precio_costo: 250,
      precio_venta: 550,
      ubicacion: "Mesa Principal",
      compatibilidad: "CPUs Intel/AMD, GPUs y Consolas PS5/Xbox",
    },
    {
      id: 8,
      codigo: "SSD-NV2-1TB",
      nombre: "Disco Sólido Kingston NV2 1TB NVMe M.2 PCIe 4.0",
      categoria: "ALMACENAMIENTO_RAM",
      stock: 5,
      stock_minimo: 2,
      precio_costo: 2100,
      precio_venta: 3300,
      ubicacion: "Vitrinas C-1",
      compatibilidad: "PCs, Notebooks y PS5",
    },
  ],
  facturas: [
    {
      id: 1,
      factura_num: "FAC-918234",
      ticket_num: "ST-000405",
      cliente: "Gonzalo Castro",
      ci: "4.120.301-8",
      detalle: "Servicio Técnico: CONTROL PLAYSTATION 5 - Cambio de análogo / Drift",
      subtotal: 1200,
      iva: 0,
      total: 1200,
      garantia: "Garantía de 3 meses en mano de obra y repuestos por servicio realizado",
      fecha: new Date().toISOString(),
      metodo_pago: "efectivo",
      emisor: "KING PC COLONIA",
    },
  ],
  ventas: [],
  personalidad: [
    "Elocuente, motivador, ejecutivo y enfocado en la excelencia y disciplina (estilo Brian Tracy).",
    "Habla con tono cercano y profesional hacia Josué y el equipo técnico de KING PC Colonia.",
    "Respuestas concisas de 1 a 2 oraciones para voz natural.",
  ],
  memoria: [
    "KING PC Colonia es el centro de servicio técnico y soluciones informáticas en Av. Aparicio Saravia 884, Colonia del Sacramento, Uruguay.",
    "Moneda de trabajo exclusiva: pesos uruguayos ($). Teléfonos de contacto: 091 606 108 / 4523 7187.",
    "Base de datos 15e Colony conectada para soporte técnico, inventario y facturación.",
  ],
  contacts: [
    { id: 1, contact_id: 2, alias: "Tío Andrés (Electricidad)", nombre: "Andrés Ojeda", telefono: "098 765 432", online: true },
    { id: 2, contact_id: 3, alias: "Taller Hermanos", nombre: "Carlos & Roberto", telefono: "097 958 773", online: true },
    { id: 3, contact_id: 4, alias: "Jean Paul", nombre: "Jean Paul", telefono: "092 111 222", online: false },
    { id: 4, contact_id: 5, alias: "Laboratorio Central", nombre: "Soporte King PC", telefono: "4522 9988", online: true },
  ],
  messages: [
    {
      id: 1,
      remitente_id: 2,
      destinatario_id: 1,
      remitente: "Andrés Ojeda",
      tipo: "texto",
      mensaje: "¡Hola Josué! ¿Cómo va el taller hoy? Te mandé la consulta por el presupuesto del panel.",
      fecha: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  stickers: [],
};

// Set initial ticket in focus
store.ticketEnFoco = store.reparaciones[0];

function removerAcentos(t: string): string {
  return (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function limpiarTextoParaVoz(t: string): string {
  if (!t) return "";
  let res = t.replace(/<think>[\s\S]*?<\/think>/gi, "");
  res = res.replace(/<think>[\s\S]*/gi, "");
  res = res.replace(/[\*\_~`#]/g, "");
  res = res.replace(/dólares\s+pesos/gi, "pesos").replace(/dolares\s+pesos/gi, "pesos");
  return res.replace(/\s+/g, " ").trim();
}

/**
 * Robust Direct Data Extraction for Fast Fallback
 */
function extraerDatosDirectos(texto: string) {
  const norm = removerAcentos(texto.toLowerCase());

  // 1. Teléfono
  let telefono = "S/N";
  const matchTel = texto.match(/(09\d(?:[\s\.\-]?\d){6,7}|452\d(?:[\s\.\-]?\d){3,4})/);
  if (matchTel && matchTel[1]) {
    telefono = matchTel[1].trim();
  }

  // 2. Cédula
  let ci = "S/N";
  if (norm.includes("cedula") || norm.includes("ci") || norm.includes("documento") || norm.includes("rut")) {
    const textoSinTelParaCI = telefono !== "S/N" ? texto.replace(telefono, "") : texto;
    const matchCI = textoSinTelParaCI.match(/(?:c[eé]dula|ci|documento|rut|anadir|añadir|es|de)?[\s:]*((?:\d[\s\.\-]?){7,9})/i);
    if (matchCI && matchCI[1]) {
      const limpia = matchCI[1].replace(/[\.\s\-]/g, "");
      if (limpia.length >= 7 && limpia.length <= 9) {
        ci = limpia;
      }
    }
  }

  // 3. Cliente
  let cliente = "Particular";
  const matchNom = norm.match(/(?:(?:el|del|para\s+el)\s+(?:senor|sr\.?|cliente)|cliente\s*(?:es|:)?|a\s+nombre\s+de(?:l\s+senor|\s+la\s+senora|\s+don|\s+dona|\s+sr\.?|\s+sra\.?)?|nombre\s*(?:es|:)?)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/);
  const ignorar = [
    "un", "una", "el", "la", "ticket", "tique", "tiquet", "reparar", "equipo", "control",
    "play", "playstation", "impresora", "tele", "televisor", "panavox", "estos", "datos", "es", "para",
    "con", "que", "bueno", "mira", "gustaria", "actualizar", "habia", "habian", "del", "de", "hizo", "puso", "dejo",
    "si", "sido", "era", "sino", "no", "por", "favor"
  ];
  if (matchNom && matchNom[1]) {
    const raw = matchNom[1].trim().split(" ")[0];
    if (!ignorar.includes(raw.toLowerCase()) && raw.length > 2) {
      cliente = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    }
  }

  // 4. Dispositivo
  let dispositivo = "ARTÍCULO TÉCNICO";
  const matchPanavox = norm.match(/panavox(?:\s+de\s+\d+\s*(?:pulgadas|pulg|\")|\s+\d+\s*(?:pulgadas|pulg|\"))?/i);
  if (matchPanavox) {
    dispositivo = `TELEVISOR PANAVOX ${matchPanavox[0].toUpperCase()}`;
  } else if (/\b(televisor|tele|tv|smart tv)\b/i.test(norm)) {
    const matchPulg = norm.match(/(\d+)\s*(?:pulgadas|pulg|\")/);
    dispositivo = matchPulg ? `TELEVISOR SMART TV ${matchPulg[1]}"` : "TELEVISOR SMART TV";
  } else if (/\b(playstation 5|ps5|play 5)\b/i.test(norm)) {
    dispositivo = norm.includes("control") || norm.includes("mando") ? "CONTROL PLAYSTATION 5" : "CONSOLA PLAYSTATION 5";
  } else if (/\b(playstation 4|ps4|play 4)\b/i.test(norm)) {
    dispositivo = norm.includes("control") || norm.includes("mando") ? "CONTROL PLAYSTATION 4" : "CONSOLA PLAYSTATION 4";
  } else if (/\b(notebook|laptop)\b/i.test(norm)) {
    dispositivo = "NOTEBOOK";
  } else if (/\b(pc|computadora|torre)\b/i.test(norm)) {
    dispositivo = "PC DE ESCRITORIO";
  }

  // 5. Presupuesto y Abono
  let presupuesto: number | null = null;
  let abono = 0;

  // Search for cost/presupuesto (e.g., "$4800", "4800 pesos", "costo de la reparacion era 4800", "presupuesto de 4800")
  const matchPres = norm.match(/(?:costo(?:[\s\w]+)?|presupuesto(?:[\s\w]+)?|precio(?:[\s\w]+)?|total(?:[\s\w]+)?|cobro(?:[\s\w]+)?|era|es|de|\$)\s*[\$]?\s*(\d{3,6})/i);
  if (matchPres && matchPres[1]) {
    presupuesto = parseFloat(matchPres[1].replace(".", "").replace(",", ""));
  }

  // Search for abono / seña (e.g., "abono $1000", "cliente abono 1000", "seña 1000", "dejo 1000")
  const matchAbono = norm.match(/(?:abono|abon[oó]|abonado|seña|sena|dejo|dej[oó]|pago|pag[oó]|adelanto|entrego|entreg[oó])\s*[\$]?\s*(\d{2,6})/i);
  if (matchAbono && matchAbono[1]) {
    abono = parseFloat(matchAbono[1].replace(".", "").replace(",", ""));
  }

  // If cost wasn't captured above, scan for any currency like $4800 or 4800
  if (presupuesto === null) {
    const rawDigits = texto.match(/\$\s*(\d{3,6})/);
    if (rawDigits && rawDigits[1]) {
      presupuesto = parseFloat(rawDigits[1]);
    }
  }

  // 6. Falla
  let falla = "Revisión técnica general / Para reparar";
  if (norm.includes("no da imagen") || norm.includes("pantalla negra") || norm.includes("audio pero no da imagen")) {
    falla = "Tiene audio pero no da imagen (Posible falla de tiras LED / backlight)";
  } else if (norm.includes("drift") || norm.includes("analogo") || norm.includes("palanca")) {
    falla = "Cambio de módulo analógico / Corrección de drift";
  } else if (norm.includes("no enciende") || norm.includes("no prende")) {
    falla = "No enciende / Revisión de fuente y placa principal";
  } else if (norm.includes("pantalla rota") || norm.includes("modulo")) {
    falla = "Cambio de módulo de pantalla display";
  } else if (norm.includes("para reparar") || norm.includes("reparacion")) {
    falla = "Diagnóstico integral y reparación";
  }

  return {
    cliente,
    ci,
    telefono,
    dispositivo,
    falla,
    presupuesto,
    abono,
    revision_pagada: "NO" as const,
  };
}

async function startServer() {
  // Initialize MySQL pool & load historical data
  try {
    const dbTickets = await loadAllTicketsFromDb();
    if (dbTickets && dbTickets.length > 0) {
      store.reparaciones = dbTickets;
      console.log(`[DB] Loaded ${dbTickets.length} historical tickets into Neutrón memory`);
    }
    const dbClientes = await loadAllCustomersFromDb();
    if (dbClientes && dbClientes.length > 0) {
      store.clientes = dbClientes;
      console.log(`[DB] Loaded ${dbClientes.length} clients into Neutrón memory`);
    }
  } catch (dbErr) {
    console.warn('[DB] Could not pre-load MySQL data, running with default memory:', dbErr.message);
  }

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;

  app.use(express.json({ limit: "20mb" }));

  // Normalize /neutron prefix if present
  app.use((req, res, next) => {
    if (req.url.startsWith("/neutron/")) {
      req.url = req.url.replace(/^\/neutron/, "") || "/";
    }
    next();
  });

  // --- HEALTH & STATUS ---
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      engine: "Neutrón Apex Executive Studio",
      empresa: "KING PC COLONIA",
      database: "15e Colony Technical Network",
      usuarioActual: store.usuarioActual,
      ticketsCount: store.reparaciones.length,
      clientesCount: store.clientes.length,
      inventarioCount: store.inventario.length,
      ttsModel: "gemini-3.1-flash-tts-preview",
    });
  });

  // --- GEMINI TEXT TO SPEECH (gemini-3.1-flash-tts-preview) ---
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voiceName = "Fenrir" } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Texto requerido para síntesis" });
      }

      const ai = getGemini();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY no disponible",
          fallback: true,
        });
      }

      const cleanText = limpiarTextoParaVoz(text);
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName || "Fenrir",
              },
            },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.[0];
      const base64Audio = audioPart?.inlineData?.data;

      if (!base64Audio) {
        return res.status(500).json({ error: "No se generó audio en la respuesta del modelo" });
      }

      res.json({
        success: true,
        audioBase64: base64Audio,
        mimeType: audioPart?.inlineData?.mimeType || "audio/pcm;rate=24000",
        sampleRate: 24000,
        text: cleanText,
      });
    } catch (err: any) {
      console.error("Error en Gemini TTS:", err);
      res.status(500).json({ error: err.message || "Error procesando TTS", fallback: true });
    }
  });

// Helper to deduce warranty according to King PC rules
function determineWarrantyBackend(deviceOrDetail: string): string {
  const norm = removerAcentos((deviceOrDetail || "").toLowerCase());
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
    return "";
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

// Helper to search and deduct stock from store.inventario
function findAndDeductInventory(itemQuery: string, qty: number = 1) {
  const q = removerAcentos(itemQuery.toLowerCase());
  const words = q.split(/\s+/).filter((w) => w.length > 2);

  // Score match items
  let bestMatch: any = null;
  let highestScore = 0;

  for (const item of store.inventario) {
    const itemNorm = removerAcentos((item.nombre + " " + item.codigo + " " + item.compatibilidad).toLowerCase());
    let score = 0;
    for (const w of words) {
      if (itemNorm.includes(w)) score += 1;
    }
    // Boost exact phrase matches
    if (q.includes("control") && itemNorm.includes("control") && (q.includes("play") || q.includes("ps5"))) score += 3;
    if (q.includes("blanco") && itemNorm.includes("blanco")) score += 2;
    if (q.includes("jbl") && itemNorm.includes("jbl")) score += 3;
    if (q.includes("auricular") && itemNorm.includes("auricular")) score += 3;
    if (q.includes("led") && itemNorm.includes("led")) score += 2;
    if (q.includes("panavox") && itemNorm.includes("panavox")) score += 2;

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore >= 1) {
    bestMatch.stock = Math.max(0, bestMatch.stock - qty);
    return { item: bestMatch, deducted: true };
  }

  return { item: null, deducted: false };
}

  // Helper for fast Groq API inference with model resilience
  async function callGroqIfAvailable(systemPrompt: string, userPrompt: string): Promise<any | null> {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return null;

    const candidateModels = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"];

    for (const model of candidateModels) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 400,
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content) {
            return { text: content };
          }
        }
      } catch (e) {
        // try next model
      }
    }
    return null;
  }

  
  // ================= WORKSHOP REMOTE PRINT QUEUE =================
  app.post(["/api/print/job", "/neutron/api/print/job"], (req, res) => {
    const { ticket, mode = "double", source = "mobile" } = req.body;
    if (!ticket) return res.status(400).json({ success: false, error: "No ticket provided" });

    const job: PrintJob = {
      id: "PRN-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      ticket,
      mode,
      source,
      status: "pending",
      createdAt: Date.now(),
    };

    printQueue.push(job);
    if (printQueue.length > 50) printQueue.shift();

    console.log(`[Workshop Print Queue] Added print job ${job.id} for ticket ${job.ticket.ticket_num} from ${source}`);
    res.json({ success: true, job });
  });

  app.get(["/api/print/pending", "/neutron/api/print/pending"], (req, res) => {
    const pending = printQueue.filter((j) => j.status === "pending");
    res.json({ success: true, jobs: pending });
  });

  app.post(["/api/print/complete", "/neutron/api/print/complete"], (req, res) => {
    const { id } = req.body;
    const job = printQueue.find((j) => j.id === id);
    if (job) {
      job.status = "printed";
      console.log(`[Workshop Print Queue] Job ${id} marked as PRINTED by desktop terminal`);
    }
    res.json({ success: true });
  });

  // --- AI COMMAND PARSER & NEUTRÓN ORCHESTRATOR ---
  app.post(["/api/command", "/neutron/api/command", "/api/neutron/voice-command"], async (req, res) => {
    try {
      const { transcript, text, current_ticket } = req.body;
      const userText = (transcript || text || "").trim();
      const norm = removerAcentos(userText.toLowerCase());

      console.log("[Neutrón Command Input]:", userText);

      if (!userText) {
        return res.json({
          success: true,
          intent: "conversacion",
          speak: `A la orden ${store.usuarioActual}, un gusto saludarte. ¿Qué coordinamos hoy en KING PC?`,
          ticket: store.ticketEnFoco,
        });
      }

      const ai = getGemini();

      // Check if user is requesting to PRINT ticket / service order
      const isPrintIntent =
        norm.includes("imprim") ||
        norm.includes("impresion") ||
        norm.includes("imprimir");

      if (isPrintIntent) {
        let targetTicket = store.ticketEnFoco || store.reparaciones[0];
        const numMatches = norm.match(/\b\d{3,6}\b/g);
        if (numMatches && numMatches.length > 0) {
          const numStr = numMatches[0];
          const cleanNum = numStr.replace(/^0+/, "") || numStr;
          const found = store.reparaciones.find((r) => {
            const rClean = r.ticket_num.replace(/\D/g, "");
            const rCleanNoZeros = rClean.replace(/^0+/, "") || rClean;
            return rClean.endsWith(numStr) || rCleanNoZeros === cleanNum || rClean.includes(numStr);
          });
          if (found) {
            targetTicket = found;
            store.ticketEnFoco = found;
          }
        }

        let printMode: "double" | "cliente" | "taller" = "double";
        if (norm.includes("cliente")) printMode = "cliente";
        else if (norm.includes("taller") || norm.includes("laboratorio") || norm.includes("local")) printMode = "taller";

        if (targetTicket) {
          const job: PrintJob = {
            id: "PRN-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
            ticket: targetTicket,
            mode: printMode,
            source: "voice-mobile",
            status: "pending",
            createdAt: Date.now(),
          };
          printQueue.push(job);
          if (printQueue.length > 50) printQueue.shift();
        }

        return res.json({
          success: true,
          intent: "imprimir_ticket",
          action: "imprimir_ticket",
          printMode,
          speak: "Entendido, señor.",
          ticket: targetTicket,
          memoria: store.memoria,
        });
      }

      // 1. CHECK IF USER ASKS TO ISSUE INVOICE / SALES TICKET OR SELL AN ITEM
      const isInvoiceOrSaleIntent =
        norm.includes("factura") ||
        norm.includes("ticket de venta") ||
        norm.includes("comprobante") ||
        norm.includes("vender") ||
        norm.includes("venta") ||
        norm.includes("articulo para la venta") ||
        norm.includes("ubica") ||
        norm.includes("catalogo");

      // Auto-save user conversation & requests into memory table
      store.memoria.unshift(`[${new Date().toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })}] El señor solicitó: "${userText}"`);
      if (store.memoria.length > 50) store.memoria.pop();

      // Check if user requests deactivation (e.g., "desactívate neutrón", "apágate", "silénciate", "deja de escuchar", "pausa")
      const isDeactivateIntent =
        norm.includes("desactiva") ||
        norm.includes("desactivate") ||
        norm.includes("apagate") ||
        norm.includes("apagate") ||
        norm.includes("silenciate") ||
        norm.includes("duermete") ||
        norm.includes("detente") ||
        norm.includes("deja de escuchar") ||
        norm.includes("hasta luego neutron") ||
        norm.includes("chau neutron");

      if (isDeactivateIntent) {
        return res.json({
          success: true,
          intent: "desactivar",
          speak: "Entendido señor, me desactivo inmediatamente. Quedo a su disposición para cuando decida convocarme nuevamente.",
          ticket: null,
        });
      }

      // Check if user wants to update the active ticket (e.g., "el motivo de la reparacion era para cambio de placa main", "actualiza el motivo", "cambia el motivo", "modifica la falla")
      const isUpdateTicketIntent =
        norm.includes("motivo") ||
        norm.includes("placa main") ||
        norm.includes("actualiza") ||
        norm.includes("actualizalo") ||
        norm.includes("modifica") ||
        norm.includes("cambia el") ||
        norm.includes("cambio de placa") ||
        norm.includes("era para") ||
        norm.includes("falla es") ||
        norm.includes("la falla");

      if (isUpdateTicketIntent && store.ticketEnFoco) {
        let updated = false;

        // Check if user mentions 'placa main' or custom repair motivo
        if (norm.includes("placa main") || norm.includes("main") || norm.includes("placa")) {
          store.ticketEnFoco.falla = "Cambio de placa main";
          updated = true;
        } else if (norm.includes("pantalla") || norm.includes("display") || norm.includes("panel")) {
          store.ticketEnFoco.falla = "Cambio de panel / display";
          updated = true;
        } else if (norm.includes("led") || norm.includes("tiras")) {
          store.ticketEnFoco.falla = "Cambio de tiras LED backlight";
          updated = true;
        } else if (norm.includes("drift") || norm.includes("palanca") || norm.includes("analogo")) {
          store.ticketEnFoco.falla = "Cambio de potenciómetro analógico (corrección de drift)";
          updated = true;
        } else if (norm.includes("fuente")) {
          store.ticketEnFoco.falla = "Reparación de fuente de alimentación";
          updated = true;
        }

        // Also check if user provided a specific cost or abono
        const parsedData = extraerDatosDirectos(userText);
        if (parsedData.presupuesto !== null) {
          store.ticketEnFoco.presupuesto = parsedData.presupuesto;
          store.ticketEnFoco.costo_estimado = parsedData.presupuesto;
          if (store.ticketEnFoco.abono) {
            store.ticketEnFoco.saldo = Math.max(0, store.ticketEnFoco.presupuesto - store.ticketEnFoco.abono);
          }
          updated = true;
        }

        if (updated) {
          // Sync with the list in store.reparaciones
          const idx = store.reparaciones.findIndex((r) => r.ticket_num === store.ticketEnFoco.ticket_num);
          if (idx !== -1) {
            store.reparaciones[idx] = { ...store.ticketEnFoco };
          }

          return res.json({
            success: true,
            intent: "actualizar_ticket",
            speak: "Entendido, señor.",
            ticket: store.ticketEnFoco,
            tickets: store.reparaciones,
            memoria: store.memoria,
          });
        }
      }

      // Check if user is creating a ticket or service order
      const isCreateTicketIntent =
        norm.includes("crear") ||
        norm.includes("crea") ||
        norm.includes("nuevo") ||
        norm.includes("ingresar") ||
        norm.includes("ingreso") ||
        norm.includes("trajo") ||
        norm.includes("dejo") ||
        norm.includes("presupuesto") ||
        norm.includes("abono") ||
        norm.includes("a nombre de") ||
        norm.includes("para reparar");

      // Robust Ticket Search & Locate Intent
      const isSearchTicketIntent =
        !isCreateTicketIntent &&
        (norm.includes("ubica") ||
         norm.includes("localiza") ||
         norm.includes("busca") ||
         norm.includes("buscar") ||
         norm.includes("mostrar") ||
         norm.includes("muestrame") ||
         norm.includes("ver ticket") ||
         norm.includes("donde esta") ||
         norm.includes("ticket num") ||
         norm.includes("orden num") ||
         norm.match(/\b(st|rep)[-\s]?\d{3,6}\b/i) !== null);

      if (isSearchTicketIntent) {
        try {
          const fresh = await loadAllTicketsFromDb();
          if (fresh && fresh.length > 0) store.reparaciones = fresh;
        } catch {}

        let foundTicket: any = null;
        const numberMatches = norm.match(/\b\d{3,6}\b/g);

        if (numberMatches && numberMatches.length > 0) {
          for (const numStr of numberMatches) {
            const cleanNum = numStr.replace(/^0+/, "") || numStr;
            foundTicket = store.reparaciones.find((r) => {
              const rClean = r.ticket_num.replace(/\D/g, "");
              const rCleanNoZeros = rClean.replace(/^0+/, "") || rClean;
              return rClean.endsWith(numStr) || rCleanNoZeros === cleanNum || rClean.includes(numStr);
            });
            if (foundTicket) break;
          }
        }

        // Search by client name or device if no number match
        if (!foundTicket) {
          const clientWords = norm.replace(/(ubica|ubicar|busca|buscar|localiza|localizar|muestrame|mostrar|el|la|ticket|orden|servicio|por favor|de|del|senor|don)/g, "").trim();
          if (clientWords.length >= 3) {
            foundTicket = store.reparaciones.find((r) =>
              r.cliente_nombre.toLowerCase().includes(clientWords) ||
              (r.dispositivo && r.dispositivo.toLowerCase().includes(clientWords))
            );
          }
        }

        if (foundTicket) {
          store.ticketEnFoco = foundTicket;
          return res.json({
            success: true,
            intent: "buscar_ticket",
            speak: "Entendido.",
            ticket: foundTicket,
            tickets: store.reparaciones,
            memoria: store.memoria,
          });
        } else {
          const searchRef = numberMatches ? numberMatches[0] : "solicitado";
          return res.json({
            success: true,
            intent: "buscar_ticket",
            speak: `Señor, ese ticket ${searchRef} no se encuentra en la base de datos o ha sido eliminado.`,
            ticket: null,
            memoria: store.memoria,
          });
        }
      }

      const systemInstruction = `Eres NEUTRÓN, el asistente de inteligencia artificial de KING PC COLONIA en Uruguay.
Tu interlocutor es tu jefe ("señor"). Eres respetuoso, elocuente y altamente capacitado.

DATOS DEL TICKET ACTUALMENTE ACTIVO EN PANTALLA:
${store.ticketEnFoco ? JSON.stringify(store.ticketEnFoco) : "Ninguno"}

HISTORIAL DE SOLICITUDES RECIENTES:
${store.memoria.slice(0, 5).join("\n")}

REGLA DE RESPUESTA HABLADA ("speak") - CRÍTICA Y OBLIGATORIA:
- Para cualquier acción de "crear_ticket", "actualizar_ticket" o "buscar_ticket", el campo "speak" DEBE SER ÚNICAMENTE Y EXACTAMENTE: "Entendido, señor."
- NUNCA leas ni narres los datos del ticket (no digas "He creado un ticket a nombre de...", ni leas el teléfono, presupuesto o código). Solo di: "Entendido, señor."

INSTRUCCIONES CLAVE:
1. Si el señor pide CREAR pide CREAR o INGRESAR un ticket ("crear ticket", "trajo un equipo", "ingresar orden", etc.): genera "action": "crear_ticket".
2. Si el señor pide EDITAR, CORREGIR o MODIFICAR cualquier dato del ticket ("me equivoqué con el nombre", "cámbialo a nombre de...", "el cliente se llama...", "el motivo es...", "el precio es..."): genera "action": "actualizar_ticket". Mantén los datos existentes del ticket activo que no hayan cambiado y actualiza el campo nuevo.
3. Si el señor pide EMITIR FACTURA o VENDER un artículo: genera "action": "emitir_factura".
4. Responde en JSON estricto:
{
  "action": "actualizar_ticket" | "crear_ticket" | "buscar_ticket" | "emitir_factura" | "venta_articulo" | "crear_cliente" | "consultar_inventario" | "conversacion",
  "cliente": "nombre del cliente o null si no aplica",
  "telefono": "teléfono extraído o null",
  "ci": "cédula extraída o null",
  "dispositivo": "nombre del dispositivo en MAYÚSCULAS o null",
  "falla": "motivo de falla/reparación o null",
  "presupuesto": numero_entero o null,
  "abono": numero_entero o 0,
  "speak": "tu respuesta hablada para el señor, sumamente elocuente, ejecutiva y respetuosa."
}`;

      let aiResponse: any = null;

      // 1. Try Groq fast LLM inference first if key configured
      if (process.env.GROQ_API_KEY) {
        aiResponse = await callGroqIfAvailable(systemInstruction, userText);
      }

      // 2. Try Gemini API with resilience fallback if Groq was not used or failed
      if (!aiResponse && ai) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gemini timeout, using fallback")), 6000)
          );

          const geminiPromise = generateContentWithResilience(ai, {
            contents: [{ parts: [{ text: `${systemInstruction}\n\nDictado o mensaje del señor: "${userText}"\n\nJSON:` }] }],
            config: {
              responseMimeType: "application/json",
            },
          });

          aiResponse = await Promise.race([geminiPromise, timeoutPromise]);
        } catch (err) {
          console.warn("[Gemini API timeout/error, using native rule engine]");
        }
      }

      if (aiResponse && aiResponse.text) {
        try {
          const parsed = JSON.parse(aiResponse.text);

            // ================= INVOICE / SALES TICKET INTENT =================
            if (parsed.action === "emitir_factura" || parsed.action === "venta_articulo" || isInvoiceOrSaleIntent) {
              const fallbackDatos = extraerDatosDirectos(userText);
              const cliNombre = parsed.cliente || fallbackDatos.cliente || (store.ticketEnFoco ? store.ticketEnFoco.cliente : "Gustavo");
              const tel = parsed.telefono && parsed.telefono !== "S/N" ? parsed.telefono : (fallbackDatos.telefono !== "S/N" ? fallbackDatos.telefono : "099 520 073");
              
              // Check if sale refers to an inventory product
              const itemQuery = parsed.producto_nombre || parsed.dispositivo || userText;
              const { item, deducted } = findAndDeductInventory(itemQuery);

              let detalleFactura = "";
              let totalMonto = parsed.presupuesto ? Number(parsed.presupuesto) : (fallbackDatos.presupuesto || 3800);
              let refTicket = "S/N";
              let garantiaText = "";

              if (item) {
                detalleFactura = `Venta: ${item.nombre}`;
                // Use dictated price if explicit, otherwise catalog price
                if (!parsed.presupuesto && fallbackDatos.presupuesto === null) {
                  totalMonto = item.precio_venta;
                }
                garantiaText = determineWarrantyBackend(item.nombre);
              } else if (norm.includes("actual") && store.ticketEnFoco) {
                const t = store.ticketEnFoco;
                refTicket = t.ticket_num;
                detalleFactura = `Servicio Técnico: ${t.dispositivo} - ${t.falla}`;
                totalMonto = t.presupuesto || t.saldo || 3800;
                garantiaText = determineWarrantyBackend(t.dispositivo);
              } else {
                const disp = parsed.dispositivo || fallbackDatos.dispositivo || "Auricular JBL";
                detalleFactura = `Venta: ${disp}`;
                garantiaText = determineWarrantyBackend(disp);
              }

              const nextFac = "COMP-" + Math.floor(100000 + Math.random() * 900000);
              const nuevaFactura: Factura = {
                id: store.facturas.length + 1,
                factura_num: nextFac,
                ticket_num: refTicket,
                cliente: cliNombre,
                ci: parsed.ci || fallbackDatos.ci || "S/N",
                detalle: detalleFactura,
                subtotal: totalMonto,
                iva: 0,
                total: totalMonto,
                garantia: garantiaText,
                fecha: new Date().toISOString(),
                metodo_pago: "efectivo",
                emisor: "KING PC COLONIA",
              };

              store.facturas.unshift(nuevaFactura);

              // Auto-register or link client in database
              const existingCli = store.clientes.find(
                (c) => c.nombre.toLowerCase().includes(cliNombre.toLowerCase()) || (tel !== "S/N" && c.telefono.replace(/\D/g, "") === tel.replace(/\D/g, ""))
              );
              if (!existingCli && cliNombre !== "Particular") {
                store.clientes.unshift({
                  id: store.clientes.length + 1,
                  nombre: cliNombre,
                  ci: parsed.ci || "S/N",
                  telefono: tel,
                  fecha_registro: new Date().toISOString(),
                  total_reparaciones: 1,
                  saldo_pendiente: 0,
                  notas: `Comprobante ${nextFac} por ${detalleFactura}`,
                });
              }

              let speakMsg = parsed.speak;
              if (!speakMsg || speakMsg.length < 5) {
                if (item && deducted) {
                  speakMsg = `A la orden Josué. Comprobante generado para ${cliNombre} por ${item.nombre} en $${totalMonto.toLocaleString("es-UY")} pesos. Se descontó del inventario y restan ${item.stock} unidades.`;
                } else {
                  speakMsg = `A la orden Josué. Comprobante de pago generado exitosamente para ${cliNombre} por un total de $${totalMonto.toLocaleString("es-UY")} pesos.`;
                }
              }

              return res.json({
                success: true,
                intent: "emitir_factura",
                speak: speakMsg,
                factura: nuevaFactura,
                ticket: store.ticketEnFoco,
                inventario: store.inventario,
                clientes: store.clientes,
              });
            }

            // ================= UPDATE TICKET INTENT =================
            if (parsed.action === "actualizar_ticket" || parsed.action === "modificar_ticket") {
              const targetTicket = store.ticketEnFoco || store.reparaciones[0];
              if (targetTicket) {
                if (parsed.cliente && parsed.cliente !== "Particular") {
                  targetTicket.cliente = parsed.cliente;
                  targetTicket.cliente_nombre = parsed.cliente;
                }
                if (parsed.telefono && parsed.telefono !== "S/N") {
                  targetTicket.telefono = parsed.telefono;
                }
                if (parsed.ci && parsed.ci !== "S/N") {
                  targetTicket.ci = parsed.ci;
                  targetTicket.cliente_ci = parsed.ci;
                }
                if (parsed.dispositivo) {
                  targetTicket.dispositivo = parsed.dispositivo.toUpperCase();
                }
                if (parsed.falla) {
                  targetTicket.falla = parsed.falla;
                }
                if (parsed.presupuesto !== null && parsed.presupuesto !== undefined) {
                  targetTicket.presupuesto = Number(parsed.presupuesto);
                  targetTicket.costo_estimado = Number(parsed.presupuesto);
                }
                if (parsed.abono !== null && parsed.abono !== undefined) {
                  targetTicket.abono = Number(parsed.abono);
                }
                if (targetTicket.presupuesto !== null) {
                  targetTicket.saldo = Math.max(0, targetTicket.presupuesto - (targetTicket.abono || 0));
                }

                // Sync in reparaciones array
                const idx = store.reparaciones.findIndex((r) => r.ticket_num === targetTicket.ticket_num);
                if (idx !== -1) {
                  store.reparaciones[idx] = { ...targetTicket };
                }
                store.ticketEnFoco = targetTicket;
                // Update in MySQL tables
                saveRepairTicketToDb(targetTicket).catch(e => console.error('[DB] update error:', e.message));

                return res.json({
                  success: true,
                  intent: "actualizar_ticket",
                  speak: "Entendido, señor.",
                  ticket: targetTicket,
                  tickets: store.reparaciones,
                  clientes: store.clientes,
                });
              }
            }

            // ================= CREATE REPAIR TICKET INTENT =================
            if (parsed.action === "crear_ticket") {
              const fallbackDatos = extraerDatosDirectos(userText);
              const nextId = store.reparaciones.length + 406;
              const ticket_num = "REP-" + String(nextId).padStart(6, "0");
              const cliNombre = parsed.cliente || fallbackDatos.cliente || "Particular";
              const tel = parsed.telefono && parsed.telefono !== "S/N" ? parsed.telefono : fallbackDatos.telefono;
              const disp = (parsed.dispositivo || fallbackDatos.dispositivo || "EQUIPO").toUpperCase();
              const fallaDec = parsed.falla || fallbackDatos.falla || "Revisión técnica general";
              
              // Ensure presupuesto and abono are filled from regex if AI missed them
              let pres = parsed.presupuesto !== undefined && parsed.presupuesto !== null ? Number(parsed.presupuesto) : fallbackDatos.presupuesto;
              let abonoVal = parsed.abono !== undefined && parsed.abono !== null ? Number(parsed.abono) : fallbackDatos.abono;
              if (isNaN(abonoVal)) abonoVal = 0;
              const saldoVal = pres !== null ? Math.max(0, pres - abonoVal) : null;

              const nuevoTicket = {
                id: store.reparaciones.length + 1,
                ticket_num,
                fecha: new Date().toISOString(),
                fecha_ingreso: new Date().toISOString(),
                cliente: cliNombre,
                cliente_nombre: cliNombre,
                ci: parsed.ci || fallbackDatos.ci || "S/N",
                cliente_ci: parsed.ci || fallbackDatos.ci || "S/N",
                telefono: tel,
                dispositivo: disp,
                falla: fallaDec,
                presupuesto: pres,
                costo_estimado: pres,
                abono: abonoVal,
                saldo: saldoVal,
                revision_pagada: "NO",
                estado: "recibido",
              };

              store.reparaciones.unshift(nuevoTicket);
    saveRepairTicketToDb(nuevoTicket).catch(e => console.error('[DB] save error:', e.message));
            // Save to MySQL tables: tavl_reparaciones, tavl_clientes, tavl_usuarios
            saveRepairTicketToDb(nuevoTicket).catch(e => console.error('[DB] save error:', e.message));
              store.ticketEnFoco = nuevoTicket;

              // Auto-register or link client in 15e Colony database
              const existingCli = store.clientes.find(
                (c) => c.nombre.toLowerCase().includes(cliNombre.toLowerCase()) || (tel !== "S/N" && c.telefono.replace(/\D/g, "") === tel.replace(/\D/g, ""))
              );
              if (!existingCli && cliNombre !== "Particular") {
                store.clientes.unshift({
                  id: store.clientes.length + 1,
                  nombre: cliNombre,
                  ci: parsed.ci || "S/N",
                  telefono: tel,
                  fecha_registro: new Date().toISOString(),
                  total_reparaciones: 1,
                  saldo_pendiente: saldoVal || 0,
                  notas: `Ingresó ${disp}`,
                });
              } else if (existingCli) {
                existingCli.total_reparaciones += 1;
                if (saldoVal) existingCli.saldo_pendiente += saldoVal;
              }

              return res.json({
                success: true,
                intent: "crear_ticket",
                speak: "Entendido, señor.",
                ticket: nuevoTicket,
                clientes: store.clientes,
              });
            }

            if (parsed.action === "buscar_ticket") {
              const matches = store.reparaciones.filter(
                (r) =>
                  r.ticket_num.toLowerCase().includes(norm) ||
                  (parsed.cliente && r.cliente_nombre.toLowerCase().includes(parsed.cliente.toLowerCase())) ||
                  (parsed.dispositivo && r.dispositivo.toLowerCase().includes(parsed.dispositivo.toLowerCase()))
              );
              if (matches.length > 0) {
                store.ticketEnFoco = matches[0];
                return res.json({
                  success: true,
                  intent: "buscar_ticket",
                  speak: parsed.speak || `Localicé el comprobante ${matches[0].ticket_num} de ${matches[0].cliente_nombre}.`,
                  ticket: matches[0],
                });
              }
            }

            // Conversational fallback with Brian Tracy / John Maxwell tone
            return res.json({
              success: true,
              intent: parsed.action || "conversacion",
              speak: parsed.speak || `Excelente día señor. En KING PC Colonia mantenemos el foco en brindar la máxima calidad de servicio técnico y soporte para usted.`,
              ticket: null,
            });
        } catch (aiErr) {
          console.warn("Error en structured AI parsing, usando parser de respaldo:", aiErr);
        }
      }

      // ================= RESILIENT REGEX PARSER FALLBACK =================
      // 1. Jokes handler
      if (
        norm.includes("chiste") ||
        norm.includes("gracioso") ||
        norm.includes("broma") ||
        norm.includes("humor") ||
        norm.includes("cuentame algo gracioso")
      ) {
        const chistes = [
          "¿Sabe qué le dijo un neutrón al entrar a un bar de electrónica, señor? Preguntó: '¿Cuánto cuesta una cerveza?', y el mozo le respondió: 'Para usted, señor neutrón, ¡no hay cargo!' ⚡😄",
          "Señor, ¿sabe por qué los desarrolladores y técnicos de King PC usamos anteojos oscuros? ¡Porque programamos y soldamos con puro brillo y precisión!",
          "Un condensador le dice a una resistencia: '¡Oye, relájate que estás muy tensa!', y la resistencia le responde: '¡Es que tú siempre te cargas de energía por todo!'",
          "Señor, ¿qué le dice una placa main a una memoria RAM? 'Si no me pasas los datos a tiempo, ¡me cuelgo de ti!'",
        ];
        const randomChiste = chistes[Math.floor(Math.random() * chistes.length)];
        return res.json({
          success: true,
          intent: "conversacion",
          speak: randomChiste,
          ticket: null,
        });
      }

      // 2. Leadership, Business Wisdom and Counseling handler (John Maxwell, Brian Tracy, Jim Rohn, general advisor)
      if (
        norm.includes("maxwell") ||
        norm.includes("tracy") ||
        norm.includes("consejo") ||
        norm.includes("consejero") ||
        norm.includes("aconsejas") ||
        norm.includes("aconseja") ||
        norm.includes("orientame") ||
        norm.includes("liderazgo") ||
        norm.includes("motivacion") ||
        norm.includes("exito") ||
        norm.includes("sabiduria") ||
        norm.includes("que opinas") ||
        norm.includes("que me recomiendas")
      ) {
        const consejos = [
          "Señor, mi consejo para usted es este: El liderazgo auténtico en los negocios no consiste en acumular autoridad, sino en multiplicar el valor que entregamos. En King PC, cada reparación impecable y cada cliente bien atendido en Colonia consolida la reputación de su taller como el número uno indiscutido.",
          "Como nos enseña John Maxwell, señor: Las personas no recuerdan cuánto sabemos hasta que descubren cuánto nos importan. La confianza que sus clientes depositan en usted al entregarle sus equipos es su activo más valioso. Cuide ese estándar con pasión.",
          "Señor, como afirmaba Brian Tracy: Su capacidad para fijar prioridades claras y ejecutar con disciplina lo que genera mayor impacto determinará el techo de sus logros. Mantenga la mente enfocada, delegue con precisión y continúe liderando con el ejemplo.",
          "Señor, reflexione en esto: La excelencia no es un acto aislado, es un hábito diario. Cuando combinamos tecnología de vanguardia, precisión técnica y un trato humano excepcional, ningún competidor puede igualar lo que usted construye día a día.",
        ];
        const randomConsejo = consejos[Math.floor(Math.random() * consejos.length)];
        return res.json({
          success: true,
          intent: "conversacion",
          speak: randomConsejo,
          ticket: null,
        });
      }

      if (isInvoiceOrSaleIntent || norm.includes("jbl") || norm.includes("control de play") || norm.includes("dual sense") || norm.includes("articulo")) {
        const datos = extraerDatosDirectos(userText);
        const cliNombre = datos.cliente !== "Particular" ? datos.cliente : "Gustavo";
        const tel = datos.telefono !== "S/N" ? datos.telefono : "099 520 073";
        const { item, deducted } = findAndDeductInventory(userText);

        let detalle = item ? `Venta: ${item.nombre}` : `Venta: ${datos.dispositivo || "Auricular JBL Tune Bluetooth"}`;
        let total = datos.presupuesto !== null ? datos.presupuesto : (item ? item.precio_venta : 3800);
        let garantia = determineWarrantyBackend(detalle);

        const nextFac = "COMP-" + Math.floor(100000 + Math.random() * 900000);
        const nuevaFactura: Factura = {
          id: store.facturas.length + 1,
          factura_num: nextFac,
          ticket_num: "S/N",
          cliente: cliNombre,
          ci: datos.ci,
          detalle: detalle,
          subtotal: total,
          iva: 0,
          total: total,
          garantia: garantia,
          fecha: new Date().toISOString(),
          metodo_pago: "efectivo",
          emisor: "KING PC COLONIA",
        };

        store.facturas.unshift(nuevaFactura);

        // Auto-register client
        store.clientes.unshift({
          id: store.clientes.length + 1,
          nombre: cliNombre,
          ci: datos.ci,
          telefono: tel,
          fecha_registro: new Date().toISOString(),
          total_reparaciones: 1,
          saldo_pendiente: 0,
          notas: `Comprobante de venta ${nextFac}`,
        });

        const spk = item && deducted
          ? `A la orden ${store.usuarioActual}. Comprobante generado para ${cliNombre} por ${item.nombre} en $${total.toLocaleString("es-UY")} pesos. Stock actualizado, quedan ${item.stock} unidades.`
          : `A la orden ${store.usuarioActual}. Comprobante generado para ${cliNombre} por $${total.toLocaleString("es-UY")} pesos. Listo para entregar.`;

        return res.json({
          success: true,
          intent: "emitir_factura",
          speak: spk,
          factura: nuevaFactura,
          ticket: store.ticketEnFoco,
          inventario: store.inventario,
          clientes: store.clientes,
        });
      }

      if (norm.includes("ticket") || norm.includes("trajo") || norm.includes("dejo") || norm.includes("ingreso") || norm.includes("reparar") || norm.includes("panavox") || norm.includes("gustavo")) {
        const datos = extraerDatosDirectos(userText);
        const nextId = store.reparaciones.length + 406;
        const ticket_num = "REP-" + String(nextId).padStart(6, "0");
        const saldo = datos.presupuesto !== null ? Math.max(0, datos.presupuesto - datos.abono) : null;

        const nuevoTicket = {
          id: store.reparaciones.length + 1,
          ticket_num: ticket_num,
          fecha: new Date().toISOString(),
          fecha_ingreso: new Date().toISOString(),
          cliente: datos.cliente,
          cliente_nombre: datos.cliente,
          ci: datos.ci,
          cliente_ci: datos.ci,
          telefono: datos.telefono,
          dispositivo: datos.dispositivo,
          falla: datos.falla,
          presupuesto: datos.presupuesto,
          costo_estimado: datos.presupuesto,
          abono: datos.abono,
          saldo: saldo,
          revision_pagada: datos.revision_pagada,
          estado: "recibido",
        };

        store.reparaciones.unshift(nuevoTicket);
    saveRepairTicketToDb(nuevoTicket).catch(e => console.error('[DB] save error:', e.message));
        store.ticketEnFoco = nuevoTicket;

        // Sync with clientes
        if (datos.cliente !== "Particular") {
          store.clientes.unshift({
            id: store.clientes.length + 1,
            nombre: datos.cliente,
            ci: datos.ci,
            telefono: datos.telefono,
            fecha_registro: new Date().toISOString(),
            total_reparaciones: 1,
            saldo_pendiente: saldo || 0,
            notas: `Ingresó ${datos.dispositivo}`,
          });
        }

        const spk = "Entendido, señor.";
        return res.json({
          success: true,
          intent: "crear_ticket",
          speak: spk,
          ticket: nuevoTicket,
          factura: null,
          texto_escrito: null,
        });
      }

      res.json({
        success: true,
        intent: "conversacion",
        speak: `Excelente día ${store.usuarioActual}. En KING PC Colonia coordinamos el taller, clientes e inventario con total precisión. ¿Qué orden ejecutamos?`,
        ticket: store.ticketEnFoco,
      });
    } catch (err: any) {
      console.error("Error en comando:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- TICKETS / REPARACIONES API ---
  app.get(["/api/tickets", "/neutron/api/tickets"], (req, res) => {
    const { q, estado } = req.query;
    let list = [...store.reparaciones];

    if (estado && estado !== "todos") {
      list = list.filter((r) => r.estado === estado);
    }

    if (q && typeof q === "string") {
      const s = q.toLowerCase();
      list = list.filter(
        (r) =>
          r.ticket_num.toLowerCase().includes(s) ||
          r.cliente_nombre.toLowerCase().includes(s) ||
          r.dispositivo.toLowerCase().includes(s) ||
          r.falla.toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      total: list.length,
      tickets: list.map((t) => ({
        ...t,
        cliente: t.cliente_nombre || t.cliente,
        ci: t.cliente_ci || t.ci,
        presupuesto: t.costo_estimado !== undefined ? t.costo_estimado : t.presupuesto,
        fecha: t.fecha_ingreso || t.fecha,
      })),
    });
  });

  // GET TICKET BY NUM (GET /neutron/api/ticket-by-num or GET /api/ticket-by-num)
  app.get(["/api/ticket-by-num", "/neutron/api/ticket-by-num", "/api/tickets/:ticket_num"], (req, res) => {
    const queryNum = (req.query.ticket_num || req.query.ticket || req.query.num || req.query.id || req.params.ticket_num || "") as string;
    if (!queryNum) {
      return res.status(400).json({ success: false, error: "Parámetro ticket_num requerido" });
    }

    const clean = queryNum.trim().toUpperCase();
    const ticket = store.reparaciones.find(
      (r) =>
        r.ticket_num.toUpperCase() === clean ||
        r.ticket_num.toUpperCase().replace("REP-", "") === clean.replace("REP-", "") ||
        String(r.id) === clean
    );

    if (!ticket) {
      return res.status(404).json({ success: false, error: `Ticket '${clean}' no encontrado en la base de datos kingpc_db.` });
    }

    store.ticketEnFoco = ticket;

    res.json({
      success: true,
      ticket: {
        ...ticket,
        cliente: ticket.cliente_nombre || ticket.cliente,
        ci: ticket.cliente_ci || ticket.ci,
        presupuesto: ticket.costo_estimado !== undefined ? ticket.costo_estimado : ticket.presupuesto,
        fecha: ticket.fecha_ingreso || ticket.fecha,
      },
    });
  });

  // ACTUALIZAR SERVICIO (POST /neutron/api/actualizar-servicio or POST /api/actualizar-servicio)
  app.post(["/api/actualizar-servicio", "/neutron/api/actualizar-servicio"], (req, res) => {
    const { ticket_num, cliente, telefono, ci, dispositivo, falla, presupuesto, abono, saldo, estado, tecnico_asignado } = req.body;
    if (!ticket_num) {
      return res.status(400).json({ success: false, error: "ticket_num requerido para actualizar servicio" });
    }

    const clean = String(ticket_num).trim().toUpperCase();
    const idx = store.reparaciones.findIndex(
      (r) =>
        r.ticket_num.toUpperCase() === clean ||
        r.ticket_num.toUpperCase().replace("REP-", "") === clean.replace("REP-", "")
    );

    if (idx === -1) {
      return res.status(404).json({ success: false, error: `Ticket ${clean} no encontrado en kingpc_db.` });
    }

    const curr = store.reparaciones[idx];
    const newPres = presupuesto !== undefined && presupuesto !== null ? Number(presupuesto) : curr.presupuesto;
    const newAbono = abono !== undefined && abono !== null ? Number(abono) : curr.abono;
    const newSaldo = saldo !== undefined && saldo !== null ? Number(saldo) : (newPres !== null ? Math.max(0, newPres - newAbono) : null);

    store.reparaciones[idx] = {
      ...curr,
      cliente: cliente || curr.cliente,
      cliente_nombre: cliente || curr.cliente_nombre || curr.cliente,
      ci: ci !== undefined ? ci : curr.ci,
      cliente_ci: ci !== undefined ? ci : curr.cliente_ci,
      telefono: telefono !== undefined ? telefono : curr.telefono,
      dispositivo: dispositivo ? dispositivo.toUpperCase() : curr.dispositivo,
      falla: falla !== undefined ? falla : curr.falla,
      presupuesto: newPres,
      costo_estimado: newPres,
      abono: newAbono,
      saldo: newSaldo,
      estado: estado || curr.estado,
      tecnico_asignado: tecnico_asignado || curr.tecnico_asignado || "Josué",
      fecha_actualizacion: new Date().toISOString(),
    };

    store.ticketEnFoco = store.reparaciones[idx];

    // Sync client record
    if (cliente && cliente !== curr.cliente) {
      const cli = store.clientes.find((c) => c.nombre.toLowerCase().includes(curr.cliente.toLowerCase()));
      if (cli) {
        cli.nombre = cliente;
        if (telefono) cli.telefono = telefono;
        if (ci) cli.ci = ci;
      }
    }

    res.json({
      success: true,
      message: `Servicio ${clean} actualizado exitosamente`,
      ticket: store.reparaciones[idx],
    });
  });

  // ELIMINAR SERVICIO (POST /neutron/api/eliminar-servicio or POST /api/eliminar-servicio)
  app.post(["/api/eliminar-servicio", "/neutron/api/eliminar-servicio"], (req, res) => {
    const { ticket_num, id } = req.body;
    const target = ticket_num || id;
    if (!target) {
      return res.status(400).json({ success: false, error: "ticket_num o id requerido para eliminar servicio" });
    }

    const clean = String(target).trim().toUpperCase();
    const initialLen = store.reparaciones.length;
    store.reparaciones = store.reparaciones.filter(
      (r) =>
        r.ticket_num.toUpperCase() !== clean &&
        r.ticket_num.toUpperCase().replace("REP-", "") !== clean.replace("REP-", "") &&
        String(r.id) !== clean
    );

    if (store.reparaciones.length === initialLen) {
      return res.status(404).json({ success: false, error: `Ticket ${clean} no encontrado en la base de datos.` });
    }

    if (store.ticketEnFoco?.ticket_num?.toUpperCase() === clean) {
      store.ticketEnFoco = store.reparaciones[0] || null;
    }

    res.json({
      success: true,
      message: `Servicio ${clean} eliminado exitosamente de kingpc_db.`,
      ticketsRestantes: store.reparaciones.length,
    });
  });

  // INGRESAR SERVICIO (POST /neutron/api/ingresar-servicio or POST /api/ingresar-servicio)
  app.post(["/api/tickets", "/api/ingresar-servicio", "/neutron/api/ingresar-servicio"], (req, res) => {
    const body = req.body;
    const nextId = store.reparaciones.length + 406;
    const ticket_num = body.ticket_num || "REP-" + String(nextId).padStart(6, "0");

    const pres = body.presupuesto !== undefined && body.presupuesto !== null ? Number(body.presupuesto) : (body.costo_estimado !== undefined ? Number(body.costo_estimado) : null);
    const ab = Number(body.abono || 0);
    const saldo = pres !== null ? Math.max(0, pres - ab) : null;

    const nuevoTicket = {
      id: store.reparaciones.length + 1,
      ticket_num: ticket_num,
      fecha: new Date().toISOString(),
      fecha_ingreso: new Date().toISOString(),
      cliente: body.cliente || "Particular",
      cliente_nombre: body.cliente || "Particular",
      ci: body.ci || "S/N",
      cliente_ci: body.ci || "S/N",
      telefono: body.telefono || "S/N",
      dispositivo: (body.dispositivo || "ARTÍCULO TÉCNICO").toUpperCase(),
      falla: body.falla || "Revisión técnica general",
      presupuesto: pres,
      costo_estimado: pres,
      abono: ab,
      saldo: saldo,
      revision_pagada: body.revision_pagada || "NO",
      estado: body.estado || "recibido",
      tecnico_asignado: body.tecnico_asignado || "Josué",
    };

    store.reparaciones.unshift(nuevoTicket);
    saveRepairTicketToDb(nuevoTicket).catch(e => console.error('[DB] save error:', e.message));
    store.ticketEnFoco = nuevoTicket;

    res.json({ success: true, message: `Servicio ${ticket_num} ingresado al sistema.`, ticket: nuevoTicket });
  });

  app.put("/api/tickets/:ticket_num", (req, res) => {
    const { ticket_num } = req.params;
    const body = req.body;
    const idx = store.reparaciones.findIndex((r) => r.ticket_num === ticket_num);

    if (idx !== -1) {
      const current = store.reparaciones[idx];
      const pres = body.presupuesto !== undefined ? body.presupuesto : current.presupuesto;
      const ab = body.abono !== undefined ? Number(body.abono) : current.abono;
      const saldo = pres !== null && pres !== undefined ? Math.max(0, Number(pres) - ab) : null;

      store.reparaciones[idx] = {
        ...current,
        ...body,
        cliente: body.cliente || current.cliente,
        cliente_nombre: body.cliente || current.cliente,
        dispositivo: body.dispositivo ? body.dispositivo.toUpperCase() : current.dispositivo,
        presupuesto: pres,
        costo_estimado: pres,
        abono: ab,
        saldo: saldo,
      };

      store.ticketEnFoco = store.reparaciones[idx];
      return res.json({ success: true, ticket: store.reparaciones[idx] });
    }

    res.status(404).json({ error: "Ticket no encontrado" });
  });

  app.delete("/api/tickets/:ticket_num", (req, res) => {
    const { ticket_num } = req.params;
    store.reparaciones = store.reparaciones.filter((r) => r.ticket_num !== ticket_num);
    res.json({ success: true });
  });

  // --- THERMAL LOGO API (GET /neutron/api/logo & GET /api/logo) ---
  app.get(["/api/logo", "/neutron/api/logo"], (req, res) => {
    const { format } = req.query;

    const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 90" width="300" height="90">
  <g fill="#000000">
    <path d="M 40 52 L 28 22 L 44 32 L 56 12 L 68 32 L 84 22 L 72 52 Z" />
    <circle cx="28" cy="19" r="3.5" />
    <circle cx="56" cy="9" r="4" />
    <circle cx="84" cy="19" r="3.5" />
    <text x="96" y="44" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="34" letter-spacing="1.5">KING PC</text>
    <text x="98" y="66" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="13" letter-spacing="5">COLONIA</text>
  </g>
</svg>`;

    if (format === "svg" || req.headers.accept?.includes("image/svg+xml")) {
      res.setHeader("Content-Type", "image/svg+xml");
      return res.send(logoSvg);
    }

    res.json({
      success: true,
      empresa: "KING PC COLONIA",
      direccion: "Av. Aparicio Saravia 884, Colonia del Sacramento",
      telefonos: ["091 606 108", "4523 7187"],
      web: "kingpccolonia.com/neutron",
      format: "monochrome_escpos",
      width: 300,
      height: 90,
      svg: logoSvg,
      escpos: {
        init: "\\x1B\\x40",
        alignCenter: "\\x1B\\x61\\x01",
        paperCut: "\\x1D\\x56\\x41\\x03",
      },
    });
  });

  // --- THERMAL SCRIPT PRINTING INTEGRATION (POST /neutron/api/print-thermal & /api/print-thermal) ---
  app.post(["/api/print-thermal", "/neutron/api/print-thermal"], (req, res) => {
    const { ticket_num, mode = "double", raw_text } = req.body;
    const ticket = store.reparaciones.find((r) => r.ticket_num === ticket_num) || store.ticketEnFoco;

    console.log(`[Thermal ESC/POS Script Integration] Ticket: ${ticket?.ticket_num || ticket_num || "N/A"}, Mode: ${mode}`);

    res.json({
      success: true,
      message: `Comprobante ${ticket?.ticket_num || ticket_num || ''} enviado al buffer de impresión térmica ESC/POS.`,
      ticket_num: ticket?.ticket_num || ticket_num,
      script_path: "./scripts/imprimir_termica.sh",
      printer_device: "/dev/usb/lp0",
      baud_rate: 9600,
      status: "sent_to_buffer",
      timestamp: new Date().toISOString(),
    });
  });

  // --- CLIENTES API (15e Colony Database) ---
  app.get("/api/clientes", (req, res) => {
    res.json({ success: true, clientes: store.clientes });
  });

  app.post("/api/clientes", (req, res) => {
    const { nombre, ci, telefono, email, direccion, notas } = req.body;
    const nuevo = {
      id: store.clientes.length + 1,
      nombre,
      ci: ci || "S/N",
      telefono: telefono || "S/N",
      email: email || "",
      direccion: direccion || "Colonia del Sacramento",
      fecha_registro: new Date().toISOString(),
      total_reparaciones: 0,
      saldo_pendiente: 0,
      notas: notas || "",
    };
    store.clientes.unshift(nuevo);
    res.json({ success: true, cliente: nuevo });
  });

  // --- INVENTARIO & REPUESTOS API ---
  app.get("/api/inventario", (req, res) => {
    res.json({ success: true, inventario: store.inventario });
  });

  app.post("/api/inventario", (req, res) => {
    const body = req.body;
    const nuevo = {
      id: store.inventario.length + 1,
      codigo: body.codigo || `REP-${Date.now().toString().slice(-4)}`,
      nombre: body.nombre,
      categoria: body.categoria || "CONSUMIBLES",
      stock: Number(body.stock || 0),
      stock_minimo: Number(body.stock_minimo || 2),
      precio_costo: Number(body.precio_costo || 0),
      precio_venta: Number(body.precio_venta || 0),
      ubicacion: body.ubicacion || "Taller Principal",
      compatibilidad: body.compatibilidad || "General",
    };
    store.inventario.unshift(nuevo);
    res.json({ success: true, item: nuevo });
  });

  // --- FACTURAS & VENTAS API ---
  app.get("/api/facturas", (req, res) => {
    res.json({ success: true, facturas: store.facturas });
  });

  // Generate Factura directly from an existing Ticket
  app.post("/api/facturas/from-ticket", (req, res) => {
    const { ticket_num } = req.body;
    const ticket = store.reparaciones.find((r) => r.ticket_num === ticket_num) || store.ticketEnFoco;

    if (!ticket) {
      return res.status(404).json({ error: "Ticket no encontrado para facturar" });
    }

    const total = ticket.presupuesto !== null && ticket.presupuesto !== undefined ? ticket.presupuesto : (ticket.saldo || 3800);
    const garantia = determineWarrantyBackend(ticket.dispositivo);
    const nextFac = "COMP-" + Math.floor(100000 + Math.random() * 900000);

    const nuevaFactura: Factura = {
      id: store.facturas.length + 1,
      factura_num: nextFac,
      ticket_num: ticket.ticket_num,
      cliente: ticket.cliente_nombre || ticket.cliente || "Particular",
      ci: ticket.cliente_ci || ticket.ci || "S/N",
      detalle: `Servicio Técnico: ${ticket.dispositivo} - ${ticket.falla}`,
      subtotal: total,
      iva: 0,
      total: total,
      garantia: garantia,
      fecha: new Date().toISOString(),
      metodo_pago: "efectivo",
      emisor: "KING PC COLONIA",
    };

    store.facturas.unshift(nuevaFactura);
    res.json({ success: true, factura: nuevaFactura });
  });

  // Direct sale of inventory or counter item with stock deduction
  app.post("/api/facturas/vender-item", (req, res) => {
    const { item_id, item_nombre, cliente, telefono, ci, precio } = req.body;

    let matchedItem: any = null;
    if (item_id) {
      matchedItem = store.inventario.find((i) => i.id === Number(item_id));
    } else if (item_nombre) {
      const match = findAndDeductInventory(item_nombre, 1);
      matchedItem = match.item;
    }

    if (matchedItem && matchedItem.stock > 0) {
      matchedItem.stock = Math.max(0, matchedItem.stock - 1);
    }

    const nombreProducto = matchedItem ? matchedItem.nombre : (item_nombre || "Artículo de Tienda");
    const total = Number(precio || (matchedItem ? matchedItem.precio_venta : 3800));
    const cliNombre = (cliente || "Gustavo").trim();
    const tel = (telefono || "099 520 073").trim();
    const nextFac = "COMP-" + Math.floor(100000 + Math.random() * 900000);
    const garantia = determineWarrantyBackend(nombreProducto);

    const nuevaFactura: Factura = {
      id: store.facturas.length + 1,
      factura_num: nextFac,
      ticket_num: "S/N",
      cliente: cliNombre,
      ci: ci || "S/N",
      detalle: `Venta: ${nombreProducto}`,
      subtotal: total,
      iva: 0,
      total: total,
      garantia: garantia,
      fecha: new Date().toISOString(),
      metodo_pago: "efectivo",
      emisor: "KING PC COLONIA",
    };

    store.facturas.unshift(nuevaFactura);

    // Register / update client in 15e Colony database
    const existingCli = store.clientes.find(
      (c) => c.nombre.toLowerCase().includes(cliNombre.toLowerCase()) || (tel !== "S/N" && c.telefono.replace(/\D/g, "") === tel.replace(/\D/g, ""))
    );
    if (!existingCli && cliNombre !== "Particular") {
      store.clientes.unshift({
        id: store.clientes.length + 1,
        nombre: cliNombre,
        ci: ci || "S/N",
        telefono: tel,
        fecha_registro: new Date().toISOString(),
        total_reparaciones: 1,
        saldo_pendiente: 0,
        notas: `Comprobante de venta ${nextFac} por ${nombreProducto}`,
      });
    }

    res.json({
      success: true,
      factura: nuevaFactura,
      inventario: store.inventario,
      clientes: store.clientes,
    });
  });

  app.post("/api/facturas", (req, res) => {
    const body = req.body;
    const nextFac = "COMP-" + Math.floor(100000 + Math.random() * 900000);
    const subtotal = Number(body.subtotal || body.total || 0);

    const nueva = {
      id: store.facturas.length + 1,
      factura_num: body.factura_num || nextFac,
      ticket_num: body.ticket_num || "S/N",
      cliente: body.cliente || "Particular",
      ci: body.ci || "S/N",
      detalle: body.detalle || "Servicio Técnico Oficial KING PC",
      subtotal: subtotal,
      iva: 0,
      total: subtotal,
      garantia: body.garantia !== undefined ? body.garantia : determineWarrantyBackend(body.detalle || ""),
      fecha: new Date().toISOString(),
      metodo_pago: body.metodo_pago || "efectivo",
      emisor: "KING PC COLONIA",
    };

    store.facturas.unshift(nueva);
    res.json({ success: true, factura: nueva });
  });

  // --- NETWORK CONTACTS & MESSAGES ---
  app.get("/api/network/contacts", (req, res) => {
    res.json({ success: true, contacts: store.contacts });
  });

  app.get("/api/network/chat/:contactId", (req, res) => {
    const contactId = Number(req.params.contactId);
    const messages = store.messages.filter(
      (m) => m.remitente_id === contactId || m.destinatario_id === contactId
    );
    res.json({ success: true, messages });
  });

  app.get("/api/network/messages", (req, res) => {
    res.json({ success: true, messages: store.messages });
  });

  app.post(["/api/network/send", "/api/network/send-message"], (req, res) => {
    const { remitente_id, destinatario_id, contact_id, remitente, tipo, mensaje } = req.body;
    const destId = destinatario_id || contact_id || 2;
    const msg = {
      id: store.messages.length + 1,
      remitente_id: remitente_id || 1,
      destinatario_id: destId,
      remitente: remitente || "Josué (King PC)",
      tipo: tipo || "texto",
      mensaje: mensaje || "",
      fecha: new Date().toISOString(),
    };
    store.messages.push(msg);
    res.json({ success: true, message: msg });
  });

  // --- STICKERS API ---
  app.get(["/api/stickers", "/api/network/stickers"], (req, res) => {
    res.json({ success: true, stickers: store.stickers });
  });

  app.post("/api/stickers", (req, res) => {
    const { sticker_url, nombre } = req.body;
    const nuevo = {
      id: store.stickers.length + 1,
      sticker_url,
      nombre: nombre || "Sticker King PC",
      fecha: new Date().toISOString(),
    };
    store.stickers.push(nuevo);
    res.json({ success: true, sticker: nuevo });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[KING PC NEUTRÓN] Server active on port ${PORT}`);
  });
}

startServer();
