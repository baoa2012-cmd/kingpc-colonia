#!/bin/bash
# ==============================================================================
# KING PC COLONIA - Script de Impresión Térmica Directa ESC/POS
# Av. Aparicio Saravia 884 • Colonia del Sacramento • Tel: 091 606 108 / 4523 7187
# ==============================================================================

DEVICE_PORT="${1:-/dev/usb/lp0}"
TICKET_FILE="${2:-/tmp/ticket_temp.txt}"
LOGO_FILE="${3:-/tmp/kingpc_logo_mono.bmp}"

echo "=================================================="
echo " [KING PC NEUTRÓN] Inicializando Impresora Térmica"
echo " Puerto: $DEVICE_PORT"
echo " Archivo de Ticket: $TICKET_FILE"
echo "=================================================="

# Verificar si el dispositivo de impresión está disponible
if [ ! -e "$DEVICE_PORT" ] && [ "$DEVICE_PORT" != "/dev/stdout" ]; then
    echo "⚠️ Dispositivo $DEVICE_PORT no detectado directamente. Modo emulación / red activo."
fi

# Inicializar comandos ESC/POS
ESC="\x1B"
GS="\x1D"
INIT_PRINTER="${ESC}@"
ALIGN_CENTER="${ESC}a\x01"
ALIGN_LEFT="${ESC}a\x00"
ALIGN_RIGHT="${ESC}a\x02"
BOLD_ON="${ESC}E\x01"
BOLD_OFF="${ESC}E\x00"
DOUBLE_HEIGHT="${GS}!\x10"
DOUBLE_WIDTH="${GS}!\x20"
NORMAL_TEXT="${GS}!\x00"
PAPER_CUT="${GS}V\x41\x03"

# Función para enviar texto formateado a la impresora
print_raw() {
    if [ -e "$DEVICE_PORT" ]; then
        printf "$1" > "$DEVICE_PORT"
    else
        printf "$1"
    fi
}

# 1. Resetear e inicializar impresora
print_raw "${INIT_PRINTER}"

# 2. Imprimir Encabezado King PC Colonia
print_raw "${ALIGN_CENTER}${BOLD_ON}${DOUBLE_HEIGHT}KING PC COLONIA\n${NORMAL_TEXT}${BOLD_OFF}"
print_raw "${ALIGN_CENTER}Servicio Tecnico & Soluciones Informaticas\n"
print_raw "${ALIGN_CENTER}Av. Aparicio Saravia 884 - Colonia del Sacramento\n"
print_raw "${ALIGN_CENTER}Tel: 091 606 108 / 4523 7187\n"
print_raw "${ALIGN_CENTER}kingpccolonia.com/neutron\n"
print_raw "${ALIGN_CENTER}------------------------------------------------\n"

# 3. Imprimir contenido del ticket si existe
if [ -f "$TICKET_FILE" ]; then
    print_raw "${ALIGN_LEFT}"
    if [ -e "$DEVICE_PORT" ]; then
        cat "$TICKET_FILE" > "$DEVICE_PORT"
    else
        cat "$TICKET_FILE"
    fi
else
    print_raw "${ALIGN_LEFT}${BOLD_ON}COMPROBANTE GENERAL DE TALLER\n${BOLD_OFF}"
    print_raw "Fecha: $(date '+%d/%m/%Y %H:%M:%S')\n"
fi

# 4. Pie y corte de papel térmico (80mm)
print_raw "\n${ALIGN_CENTER}------------------------------------------------\n"
print_raw "${ALIGN_CENTER}${BOLD_ON}!Muchas gracias por su preferencia!\n${BOLD_OFF}"
print_raw "\n\n\n\n"
print_raw "${PAPER_CUT}"

echo "✅ Ticket enviado satisfactoriamente al búfer térmico."
exit 0
