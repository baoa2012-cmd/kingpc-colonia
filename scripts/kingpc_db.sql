-- ==============================================================================
-- KING PC COLONIA - Base de Datos MySQL / MariaDB (kingpc_db)
-- Esquema para Taller, Inventario, Facturación y Asistente Neutrón
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS kingpc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kingpc_db;

-- 1. Tabla de Clientes (tavl_clientes)
CREATE TABLE IF NOT EXISTS tavl_clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    ci VARCHAR(30) DEFAULT 'S/N',
    telefono VARCHAR(50) DEFAULT 'S/N',
    email VARCHAR(100) DEFAULT '',
    direccion VARCHAR(200) DEFAULT 'Colonia del Sacramento',
    total_reparaciones INT DEFAULT 0,
    saldo_pendiente DECIMAL(10,2) DEFAULT 0.00,
    notas TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabla de Órdenes y Reparaciones de Servicio (tavl_reparaciones)
CREATE TABLE IF NOT EXISTS tavl_reparaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_num VARCHAR(30) UNIQUE NOT NULL,
    cliente VARCHAR(150) NOT NULL,
    ci VARCHAR(30) DEFAULT 'S/N',
    telefono VARCHAR(50) DEFAULT 'S/N',
    dispositivo VARCHAR(150) NOT NULL,
    modelo VARCHAR(100) DEFAULT '',
    n_serie VARCHAR(100) DEFAULT '',
    falla TEXT NOT NULL,
    presupuesto DECIMAL(10,2) DEFAULT NULL,
    abono DECIMAL(10,2) DEFAULT 0.00,
    saldo DECIMAL(10,2) DEFAULT NULL,
    revision_pagada ENUM('SI', 'NO') DEFAULT 'NO',
    estado ENUM('recibido', 'en_revision', 'en_espera_repuesto', 'reparado', 'entregado', 'no_reparable') DEFAULT 'recibido',
    tecnico_asignado VARCHAR(100) DEFAULT 'Josué',
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_ticket (ticket_num),
    INDEX idx_cliente (cliente),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- 3. Tabla de Artículos e Inventario (articulos)
CREATE TABLE IF NOT EXISTS articulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    subcategoria VARCHAR(100) DEFAULT '',
    modelo VARCHAR(100) DEFAULT '',
    n_serie VARCHAR(100) DEFAULT '',
    stock INT DEFAULT 0,
    stock_minimo INT DEFAULT 2,
    precio DECIMAL(10,2) NOT NULL,
    precio_costo DECIMAL(10,2) DEFAULT 0.00,
    detalles TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sku (sku),
    INDEX idx_categoria (categoria)
) ENGINE=InnoDB;

-- 4. Tabla de Facturas y Comprobantes Emitidos (tavl_facturas)
CREATE TABLE IF NOT EXISTS tavl_facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    factura_num VARCHAR(50) UNIQUE NOT NULL,
    ticket_num VARCHAR(30) DEFAULT 'S/N',
    cliente VARCHAR(150) NOT NULL,
    ci VARCHAR(30) DEFAULT 'S/N',
    detalle TEXT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    iva DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    garantia VARCHAR(255) DEFAULT '',
    metodo_pago VARCHAR(50) DEFAULT 'efectivo',
    emisor VARCHAR(100) DEFAULT 'KING PC COLONIA',
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_factura (factura_num)
) ENGINE=InnoDB;

-- 5. Tabla de Reglas de Memoria y Personalidad de Neutrón
CREATE TABLE IF NOT EXISTS neutron_memoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('personalidad', 'memoria_largo_plazo', 'directriz') NOT NULL,
    contenido TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==============================================================================
-- Datos Semilla (Seeds)
-- ==============================================================================

INSERT INTO tavl_clientes (nombre, ci, telefono, direccion, notas) VALUES
('Gustavo Pérez', '4.520.123-4', '099 520 0737', 'Real de San Carlos, Colonia', 'Cliente particular frecuente'),
('Mauro Da Silva', '4.112.334-1', '098 776 543', 'Av. Buenos Aires 320, Colonia', 'Empresa de Transporte'),
('Carolina Méndez', '5.012.984-2', '091 234 567', 'Barrio Histórico, Colonia', 'Estudio Contable');

INSERT INTO tavl_reparaciones (ticket_num, cliente, ci, telefono, dispositivo, falla, presupuesto, abono, saldo, estado) VALUES
('REP-000406', 'Gustavo', 'S/N', '099 520 073', 'TELEVISOR PANAVOX 40 PULGADAS', 'Cambio de tiras LED, sin imagen con audio', 3800.00, 0.00, 3800.00, 'recibido'),
('REP-000405', 'Mauro Da Silva', '4.112.334-1', '098 776 543', 'NOTEBOOK HP G7', 'Mantenimiento térmico y reinstalación Windows 11', 2400.00, 1000.00, 1400.00, 'en_revision'),
('REP-000404', 'Carolina Méndez', '5.012.984-2', '091 234 567', 'PC TORRE CORE I7 GAMER', 'Falla de encendido, fuente quemada', 4900.00, 2000.00, 2900.00, 'en_espera_repuesto');

INSERT INTO articulos (sku, nombre, categoria, subcategoria, modelo, stock, stock_minimo, precio, precio_costo, detalles) VALUES
('LED-PANA-40', 'Kit Tiras LED Panavox 40 Pulgadas (Juego 3 tiras)', 'REPUESTOS_TV', 'TIRAS_LED', '40D3503V1W6C1B561017M', 6, 2, 1850.00, 950.00, 'Tiras de aluminio disipador 6V por LED'),
('SSD-512-NVME', 'Disco Sólido Kingston NV2 512GB M.2 NVMe PCIe 4.0', 'ALMACENAMIENTO', 'SSD_M2', 'SNV2S/512G', 12, 4, 1950.00, 1320.00, 'Lectura 3500MB/s, garantía 12 meses'),
('RAM-16-DDR4', 'Memoria RAM Kingston Fury Beast 16GB DDR4 3200MHz', 'MEMORIAS', 'DDR4_DESKTOP', 'KF432C16BB/16', 8, 3, 2200.00, 1450.00, 'Con disipador térmico negro');
