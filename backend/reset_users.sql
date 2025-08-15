-- Script para resetear tabla de usuarios
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;

-- Eliminar todos los usuarios (usando DELETE para evitar problemas con FK)
DELETE FROM users;

-- Resetear el contador de identidad
DBCC CHECKIDENT ('users', RESEED, 0);

-- Verificar que la tabla esté vacía
SELECT COUNT(*) as total_users FROM users;

PRINT 'Tabla de usuarios limpiada exitosamente';
