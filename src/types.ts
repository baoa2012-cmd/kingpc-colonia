export interface TecnicoUsuario {
  id: number;
  nombre: string;
  usuario: string;
  pin: string;
  telefono: string;
  sucursal: "King PC Colonia" | "King PC Algodón" | "Sucursal 2" | string;
  rol: "tecnico" | "encargado";
  activo: boolean;
  ultimo_acceso?: string;
  equipos_en_cola?: number;
}

export interface Ticket {
  id?: number;
  ticket_num: string;
  fecha: string;
  cliente: string;
  ci: string;
  telefono: string;
  dispositivo: string;
  falla: string;
  presupuesto: number | null;
  abono: number;
  saldo: number | null;
  revision_pagada: "SI" | "NO";
  estado?: "recibido" | "en_revision" | "esperando_repuesto" | "reparado" | "entregado" | "cancelado";
  metodo_pago?: string;
  modal_html?: string;
  tecnico_asignado?: string;
  sucursal?: string;
  notas_taller?: string;
}

export interface Factura {
  id?: number;
  factura_num: string;
  ticket_num: string;
  cliente: string;
  ci: string;
  detalle: string;
  subtotal: number;
  iva: number;
  total: number;
  garantia: string;
  fecha: string;
  metodo_pago?: string;
  emisor?: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  ci: string;
  telefono: string;
  email?: string;
  direccion?: string;
  fecha_registro: string;
  total_reparaciones: number;
  saldo_pendiente: number;
  notas?: string;
}

export interface InventarioItem {
  id: number;
  codigo?: string;
  sku: string;
  nombre: string;
  categoria: string;
  subcategoria?: string;
  modelo?: string;
  n_serie?: string;
  stock: number;
  stock_minimo?: number;
  precio_costo?: number;
  precio: number;
  detalles?: string;
  imagen_frontal?: string;
  imagen_posterior?: string;
  imagen_otro1?: string;
  imagen_otro2?: string;
  ubicacion?: string;
  compatibilidad?: string;
}

export interface VentaItem {
  id: number;
  venta_num: string;
  fecha: string;
  cliente: string;
  items: { producto: string; cantidad: number; precio_unit: number; subtotal: number }[];
  total: number;
  metodo_pago: string;
  vendedor: string;
}

export interface Contacto {
  id: number;
  contact_id: number;
  alias: string;
  nombre: string;
  telefono: string;
  online: boolean;
  avatar?: string;
}

export interface MensajeChat {
  id: number;
  remitente_id: number;
  destinatario_id: number;
  remitente: string;
  tipo: "texto" | "imagen" | "audio" | "sticker" | "zumbido";
  mensaje: string;
  fecha: string;
  speak?: string;
}

export interface StickerItem {
  id: number;
  user_id?: number;
  sticker_url: string;
  fecha?: string;
  nombre?: string;
}

export interface VoiceCommandResponse {
  success: boolean;
  intent: string;
  speak: string;
  ticket?: Ticket | null;
  factura?: Factura | null;
  servicios?: Ticket[];
  cliente?: Cliente | null;
  inventario?: InventarioItem[];
  texto_escrito?: string | null;
  audioBase64?: string | null;
}
