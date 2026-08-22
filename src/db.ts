import mysql from 'mysql2/promise';
import { execSync } from 'child_process';

export let dbPool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool | null {
  if (dbPool) return dbPool;
  try {
    const host = process.env.DB_HOST || '127.0.0.1';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || 'ebgd85lmbffbtanu';
    const database = process.env.DB_NAME || 'kingpc_db';
    const port = Number(process.env.DB_PORT) || 3306;

    dbPool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log(`[DB] MySQL Pool initialized for ${database}@${host}:${port}`);
    return dbPool;
  } catch (err: any) {
    console.warn(`[DB] MySQL initialization error:`, err.message);
    return null;
  }
}

export function phpCrypt(password: string, salt: string): string {
  try {
    const cleanPass = password.replace(/['"\\]/g, '');
    const cleanSalt = (salt || 'kp').substring(0, 2).replace(/['"\\]/g, '');
    const res = execSync(`php -r "echo crypt('${cleanPass}', '${cleanSalt}');"`).toString().trim();
    return res;
  } catch {
    // Fallback: standard 2-char salt representation
    return `${salt.substring(0, 2)}${Buffer.from(password).toString('base64').substring(0, 11)}`;
  }
}

export async function syncCustomerAndWebUser(cliente: {
  nombre: string;
  ci?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  email?: string | null;
}) {
  const pool = getDbPool();
  if (!pool) return;

  try {
    const ciClean = (cliente.ci && cliente.ci !== 'S/N' && cliente.ci.trim() !== '') ? cliente.ci.trim() : null;
    const nombreClean = (cliente.nombre || 'Particular').toUpperCase().trim();
    const telClean = (cliente.telefono && cliente.telefono !== 'S/N') ? cliente.telefono.trim() : 'S/N';
    const dirClean = (cliente.direccion && cliente.direccion.trim() !== '') ? cliente.direccion.trim().toUpperCase() : 'COLONIA DEL SACRAMENTO';
    const emailClean = cliente.email || (ciClean ? `${ciClean.replace(/\D/g, '')}@kingpccolonia.com` : 'cliente@kingpccolonia.com');

    // 1. Sync in tavl_clientes
    if (ciClean) {
      const [rows]: any = await pool.query('SELECT * FROM tavl_clientes WHERE cli_numdocu = ?', [ciClean]);
      if (rows.length === 0) {
        await pool.query(
          'INSERT INTO tavl_clientes (cli_tdoc, cli_numdocu, cli_razonsocial, cli_direccion, cli_telefono1, cli_email, emp_id) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [1, ciClean, nombreClean, dirClean, telClean, emailClean]
        );
        console.log(`[DB] Nuevo cliente registrado en tavl_clientes: ${nombreClean} (CI: ${ciClean})`);
      } else {
        await pool.query(
          'UPDATE tavl_clientes SET cli_razonsocial = ?, cli_telefono1 = ?, cli_direccion = ? WHERE cli_numdocu = ?',
          [nombreClean, telClean, dirClean, ciClean]
        );
      }
    } else if (nombreClean !== 'PARTICULAR') {
      const [rows]: any = await pool.query('SELECT * FROM tavl_clientes WHERE cli_razonsocial = ? LIMIT 1', [nombreClean]);
      if (rows.length === 0) {
        await pool.query(
          'INSERT INTO tavl_clientes (cli_tdoc, cli_numdocu, cli_razonsocial, cli_direccion, cli_telefono1, cli_email, emp_id) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [1, 'S/N', nombreClean, dirClean, telClean, emailClean]
        );
      }
    }

    // 2. Sync Web User in tavl_usuarios (for login on kingpccolonia.com)
    const userLogin = ciClean ? ciClean.replace(/\D/g, '') || ciClean : nombreClean.toLowerCase().replace(/\s+/g, '');
    const userPass = ciClean ? ciClean.replace(/\D/g, '') || ciClean : telClean.replace(/\D/g, '') || '123456';
    const salt = userLogin.substring(0, 2) || 'kp';
    const passCrypt = phpCrypt(userPass, salt);

    const [usuRows]: any = await pool.query('SELECT * FROM tavl_usuarios WHERE usu_iden = ? OR usu_nomusu = ?', [userLogin, userLogin]);
    if (usuRows.length === 0) {
      await pool.query(
        'INSERT INTO tavl_usuarios (usu_iden, usu_nombres_apellidos, usu_nomusu, usu_password, gru_id, usu_estatus, emp_id, usu_email) VALUES (?, ?, ?, ?, 3, 1, 1, ?)',
        [userLogin, nombreClean, userLogin, passCrypt, emailClean]
      );
      console.log(`[DB] Usuario web creado en tavl_usuarios: Login=${userLogin}, Clave=${userPass} (crypt=${passCrypt})`);
    } else {
      await pool.query(
        'UPDATE tavl_usuarios SET usu_password = ?, usu_nombres_apellidos = ?, usu_estatus = 1 WHERE usu_iden = ? OR usu_nomusu = ?',
        [passCrypt, nombreClean, userLogin, userLogin]
      );
    }
  } catch (err: any) {
    console.error('[DB] Error syncCustomerAndWebUser:', err.message);
  }
}

export async function saveRepairTicketToDb(ticket: any) {
  const pool = getDbPool();
  if (!pool) return;

  try {
    const ticketNum = ticket.ticket_num;
    const [existing]: any = await pool.query('SELECT id FROM tavl_reparaciones WHERE ticket_num = ?', [ticketNum]);

    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO tavl_reparaciones 
        (ticket_num, cliente_ci, cliente_nombre, telefono, dispositivo, falla, costo_estimado, abono, saldo, revision_pagada, estado, fecha_ingreso) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          ticketNum,
          ticket.ci || ticket.cliente_ci || 'S/N',
          ticket.cliente || ticket.cliente_nombre || 'Particular',
          ticket.telefono || 'S/N',
          (ticket.dispositivo || 'EQUIPO').toUpperCase(),
          ticket.falla || 'Revisión técnica general',
          ticket.presupuesto || ticket.costo_estimado || 0,
          ticket.abono || 0,
          ticket.saldo || 0,
          ticket.revision_pagada || 'NO',
          ticket.estado || 'recibido',
        ]
      );
      console.log(`[DB] Ticket guardado en tavl_reparaciones: ${ticketNum}`);
    } else {
      await pool.query(
        `UPDATE tavl_reparaciones SET 
        cliente_ci = ?, cliente_nombre = ?, telefono = ?, dispositivo = ?, falla = ?, costo_estimado = ?, abono = ?, saldo = ?, estado = ?
        WHERE ticket_num = ?`,
        [
          ticket.ci || ticket.cliente_ci || 'S/N',
          ticket.cliente || ticket.cliente_nombre || 'Particular',
          ticket.telefono || 'S/N',
          (ticket.dispositivo || 'EQUIPO').toUpperCase(),
          ticket.falla || 'Revisión técnica general',
          ticket.presupuesto || ticket.costo_estimado || 0,
          ticket.abono || 0,
          ticket.saldo || 0,
          ticket.estado || 'recibido',
          ticketNum,
        ]
      );
      console.log(`[DB] Ticket actualizado en tavl_reparaciones: ${ticketNum}`);
    }

    // Auto-sync customer and web login
    await syncCustomerAndWebUser({
      nombre: ticket.cliente || ticket.cliente_nombre,
      ci: ticket.ci || ticket.cliente_ci,
      telefono: ticket.telefono,
    });
  } catch (err: any) {
    console.error('[DB] Error saveRepairTicketToDb:', err.message);
  }
}

export async function loadAllTicketsFromDb(): Promise<any[]> {
  const pool = getDbPool();
  if (!pool) return [];

  try {
    // 1. Load active repairs from tavl_reparaciones
    const [reps]: any = await pool.query('SELECT * FROM tavl_reparaciones ORDER BY id DESC');
    const tickets = reps.map((r: any) => ({
      id: r.id,
      ticket_num: r.ticket_num,
      fecha: r.fecha_ingreso ? new Date(r.fecha_ingreso).toISOString() : new Date().toISOString(),
      fecha_ingreso: r.fecha_ingreso ? new Date(r.fecha_ingreso).toISOString() : new Date().toISOString(),
      cliente: r.cliente_nombre || 'Particular',
      cliente_nombre: r.cliente_nombre || 'Particular',
      ci: r.cliente_ci || 'S/N',
      cliente_ci: r.cliente_ci || 'S/N',
      telefono: r.telefono || 'S/N',
      dispositivo: r.dispositivo,
      falla: r.falla,
      presupuesto: r.costo_estimado ? Number(r.costo_estimado) : null,
      costo_estimado: r.costo_estimado ? Number(r.costo_estimado) : null,
      abono: Number(r.abono) || 0,
      saldo: Number(r.saldo) || 0,
      revision_pagada: r.revision_pagada || 'NO',
      estado: (r.estado || 'recibido').toLowerCase(),
    }));

    // 2. Load historical services from tavl_servicios + tavl_servicios_detalle + tavl_clientes
    const [servs]: any = await pool.query(`
      SELECT 
        s.ser_id, s.ser_tiket, s.ser_fechar, s.ser_estatus,
        c.cli_razonsocial, c.cli_numdocu, c.cli_telefono1,
        d.serd_equipo, d.serd_descripcion, d.serd_presupuesto, d.serd_abono
      FROM tavl_servicios s
      LEFT JOIN tavl_clientes c ON s.cli_id = c.cli_id
      LEFT JOIN tavl_servicios_detalle d ON s.ser_id = d.ser_id
      ORDER BY s.ser_id DESC
    `);

    const existingNums = new Set(tickets.map((t: any) => t.ticket_num));

    for (const s of servs) {
      const ticketNum = s.ser_tiket || `ST-${String(s.ser_id).padStart(6, '0')}`;
      if (!existingNums.has(ticketNum)) {
        const pres = s.serd_presupuesto ? Number(s.serd_presupuesto) : 0;
        const abono = s.serd_abono ? Number(s.serd_abono) : 0;
        tickets.push({
          id: 10000 + s.ser_id,
          ticket_num: ticketNum,
          fecha: s.ser_fechar ? new Date(s.ser_fechar).toISOString() : new Date().toISOString(),
          fecha_ingreso: s.ser_fechar ? new Date(s.ser_fechar).toISOString() : new Date().toISOString(),
          cliente: s.cli_razonsocial || 'Particular',
          cliente_nombre: s.cli_razonsocial || 'Particular',
          ci: s.cli_numdocu || 'S/N',
          cliente_ci: s.cli_numdocu || 'S/N',
          telefono: s.cli_telefono1 || 'S/N',
          dispositivo: (s.serd_equipo || 'EQUIPO TÉCNICO').toUpperCase(),
          falla: s.serd_descripcion || 'Revisión y servicio técnico',
          presupuesto: pres || null,
          costo_estimado: pres || null,
          abono: abono,
          saldo: Math.max(0, pres - abono),
          revision_pagada: 'SI',
          estado: (s.ser_estatus || 'recibido').toLowerCase(),
        });
        existingNums.add(ticketNum);
      }
    }

    return tickets;
  } catch (err: any) {
    console.error('[DB] Error loadAllTicketsFromDb:', err.message);
    return [];
  }
}

export async function loadAllCustomersFromDb(): Promise<any[]> {
  const pool = getDbPool();
  if (!pool) return [];

  try {
    const [rows]: any = await pool.query('SELECT * FROM tavl_clientes ORDER BY cli_id DESC');
    return rows.map((c: any) => ({
      id: c.cli_id,
      nombre: c.cli_razonsocial || 'Particular',
      ci: c.cli_numdocu || 'S/N',
      telefono: c.cli_telefono1 || 'S/N',
      email: c.cli_email || '',
      direccion: c.cli_direccion || 'Colonia del Sacramento',
      fecha_registro: new Date().toISOString(),
      total_reparaciones: 1,
      saldo_pendiente: 0,
      notas: `Cliente registrado en base de datos King PC (ID: ${c.cli_id})`,
    }));
  } catch (err: any) {
    console.error('[DB] Error loadAllCustomersFromDb:', err.message);
    return [];
  }
}
