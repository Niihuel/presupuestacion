# API de Configuración del Sistema

## Descripción General

Este módulo proporciona endpoints para gestionar la configuración global del sistema de presupuestación, incluyendo configuraciones generales, de cotización, precios, zonas, notificaciones y sistema.

## Base URL
```
/api/v1/system
```

## Autenticación

Todos los endpoints requieren autenticación JWT y permisos de administrador (`admin` o `superadmin`).

```bash
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Obtener Configuración Completa

**GET** `/config`

Obtiene toda la configuración del sistema.

**Permisos requeridos:** `admin`, `superadmin`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "general": {
      "company_name": "Mi Empresa",
      "timezone": "America/Argentina/Buenos_Aires",
      "currency": "ARS",
      "language": "es"
    },
    "quotation": {
      "default_validity_days": 30,
      "auto_numbering": true,
      "number_prefix": "PRES-"
    },
    "pricing": {
      "default_margin": 20,
      "allow_negative_margins": false
    },
    "zones": {
      "calculate_shipping": true,
      "default_shipping_rate": 0.05
    },
    "notifications": {
      "email_enabled": true,
      "sms_enabled": false
    },
    "system": {
      "maintenance_mode": false,
      "debug_mode": false
    }
  },
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "updatedBy": "admin@empresa.com"
  }
}
```

### 2. Obtener Configuración por Sección

**GET** `/config/:section`

Obtiene la configuración de una sección específica.

**Parámetros:**
- `section` (string): Nombre de la sección (`general`, `quotation`, `pricing`, `zones`, `notifications`, `system`)

**Permisos requeridos:** `admin`, `superadmin`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "company_name": "Mi Empresa",
    "timezone": "America/Argentina/Buenos_Aires",
    "currency": "ARS",
    "language": "es"
  }
}
```

### 3. Actualizar Configuración Completa

**PUT** `/config`

Actualiza toda la configuración del sistema.

**Permisos requeridos:** `admin`, `superadmin`

**Body:**
```json
{
  "general": {
    "company_name": "Nueva Empresa",
    "timezone": "America/Argentina/Buenos_Aires"
  },
  "quotation": {
    "default_validity_days": 45
  }
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Configuración actualizada exitosamente",
  "data": {
    // Configuración actualizada completa
  }
}
```

### 4. Actualizar Configuración por Sección

**PUT** `/config/:section`

Actualiza una sección específica de configuración.

**Parámetros:**
- `section` (string): Nombre de la sección

**Permisos requeridos:** `admin`, `superadmin`

**Body:**
```json
{
  "company_name": "Empresa Actualizada",
  "currency": "USD"
}
```

### 5. Obtener Configuraciones por Defecto

**GET** `/config/defaults`

Obtiene las configuraciones por defecto del sistema.

**Permisos requeridos:** `admin`, `superadmin`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    // Configuración por defecto completa
  }
}
```

### 6. Resetear Configuración

**POST** `/config/reset`

Resetea toda la configuración a valores por defecto.

**Permisos requeridos:** `superadmin`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Configuración reseteada a valores por defecto",
  "data": {
    // Configuración por defecto
  }
}
```

### 7. Resetear Sección de Configuración

**POST** `/config/:section/reset`

Resetea una sección específica a valores por defecto.

**Parámetros:**
- `section` (string): Nombre de la sección

**Permisos requeridos:** `admin`, `superadmin`

### 8. Exportar Configuración

**GET** `/config/export`

Exporta la configuración actual como archivo JSON.

**Permisos requeridos:** `admin`, `superadmin`

**Respuesta exitosa (200):**
```
Content-Type: application/json
Content-Disposition: attachment; filename="system-config-2024-01-01.json"

{
  // Configuración completa del sistema
}
```

### 9. Importar Configuración

**POST** `/config/import`

Importa configuración desde un archivo JSON.

**Permisos requeridos:** `superadmin`

**Content-Type:** `multipart/form-data`

**Body:**
- `config` (file): Archivo JSON con la configuración

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Configuración importada exitosamente",
  "data": {
    "imported_sections": ["general", "quotation", "pricing"],
    "skipped_sections": [],
    "validation_errors": []
  }
}
```

### 10. Validar Configuración

**POST** `/config/validate`

Valida la configuración actual del sistema.

**Permisos requeridos:** `admin`, `superadmin`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "sections_validated": 6
  }
}
```

## Códigos de Error

### 400 - Bad Request
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "La configuración no es válida",
  "details": [
    "El nombre de la empresa es requerido",
    "Los días de validez deben ser un número positivo"
  ]
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Token de acceso requerido"
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Permisos insuficientes para acceder a este recurso"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Sección de configuración no encontrada"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Error interno del servidor"
}
```

## Secciones de Configuración

### General
- `company_name`: Nombre de la empresa
- `timezone`: Zona horaria
- `currency`: Moneda
- `language`: Idioma
- `date_format`: Formato de fecha
- `time_format`: Formato de hora

### Quotation
- `default_validity_days`: Días de validez por defecto
- `auto_numbering`: Numeración automática
- `number_prefix`: Prefijo de numeración
- `include_taxes`: Incluir impuestos
- `default_tax_rate`: Tasa de impuesto por defecto

### Pricing
- `default_margin`: Margen por defecto
- `allow_negative_margins`: Permitir márgenes negativos
- `round_prices`: Redondear precios
- `price_calculation_method`: Método de cálculo de precios

### Zones
- `calculate_shipping`: Calcular envío
- `default_shipping_rate`: Tasa de envío por defecto
- `free_shipping_threshold`: Umbral de envío gratuito
- `zone_based_pricing`: Precios basados en zona

### Notifications
- `email_enabled`: Email habilitado
- `sms_enabled`: SMS habilitado
- `notification_types`: Tipos de notificación
- `admin_email`: Email del administrador

### System
- `maintenance_mode`: Modo mantenimiento
- `debug_mode`: Modo debug
- `backup_enabled`: Backup habilitado
- `session_timeout`: Timeout de sesión

## Ejemplos de Uso

### Actualizar configuración general
```bash
curl -X PUT http://localhost:3000/api/v1/system/config/general \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Mi Nueva Empresa",
    "currency": "USD"
  }'
```

### Exportar configuración
```bash
curl -X GET http://localhost:3000/api/v1/system/config/export \
  -H "Authorization: Bearer <token>" \
  -o system-config.json
```

### Resetear configuración de precios
```bash
curl -X POST http://localhost:3000/api/v1/system/config/pricing/reset \
  -H "Authorization: Bearer <token>"
```
