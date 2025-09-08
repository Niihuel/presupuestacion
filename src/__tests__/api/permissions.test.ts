/**
 * Tests de integración para endpoints con verificación de permisos
 */

import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';

// Mock de las dependencias
jest.mock('@/lib/prisma');
jest.mock('@/lib/authz');

describe('API Endpoints - Verificación de Permisos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/customers', () => {
    it('debería requerir permisos para GET', async () => {
      const { requirePermission } = require('@/lib/authz');
      requirePermission.mockRejectedValue(new Error('Insufficient permissions: customers:view'));

      // Importar dinámicamente para evitar problemas de hoisting
      const { GET } = await import('@/app/api/customers/route');

      const { req } = createMocks({
        method: 'GET',
        url: '/api/customers',
      });

      const response = await GET(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(requirePermission).toHaveBeenCalledWith('customers', 'view');
    });

    it('debería requerir permisos para POST', async () => {
      const { requirePermission } = require('@/lib/authz');
      requirePermission.mockRejectedValue(new Error('Insufficient permissions: customers:create'));

      const { POST } = await import('@/app/api/customers/route');

      const { req } = createMocks({
        method: 'POST',
        url: '/api/customers',
        body: {
          companyName: 'Test Company',
          displayName: 'Test Company',
          email: 'test@example.com',
        },
      });

      const response = await POST(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(requirePermission).toHaveBeenCalledWith('customers', 'create');
    });
  });

  describe('/api/budgets', () => {
    it('debería requerir permisos para ver presupuestos', async () => {
      const { requirePermission } = require('@/lib/authz');
      requirePermission.mockRejectedValue(new Error('Insufficient permissions: budgets:view'));

      const { GET } = await import('@/app/api/budgets/route');

      const { req } = createMocks({
        method: 'GET',
        url: '/api/budgets',
      });

      const response = await GET(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(requirePermission).toHaveBeenCalledWith('budgets', 'view');
    });
  });

  describe('/api/dashboard/alerts', () => {
    it('debería requerir permisos de sistema para ver alertas', async () => {
      const { requirePermission } = require('@/lib/authz');
      requirePermission.mockRejectedValue(new Error('Insufficient permissions: system:view'));

      const { GET } = await import('@/app/api/dashboard/alerts/route');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(requirePermission).toHaveBeenCalledWith('system', 'view');
    });

    it('debería requerir permisos de sistema para actualizar alertas', async () => {
      const { requirePermission } = require('@/lib/authz');
      requirePermission.mockRejectedValue(new Error('Insufficient permissions: system:update'));

      const { POST } = await import('@/app/api/dashboard/alerts/route');

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(requirePermission).toHaveBeenCalledWith('system', 'update');
    });
  });

  describe('/api/dashboard/changes', () => {
    it('debería requerir permisos de sistema para ver logs de auditoría', async () => {
      const { requirePermission } = require('@/lib/authz');
      requirePermission.mockRejectedValue(new Error('Insufficient permissions: system:view'));

      const { GET } = await import('@/app/api/dashboard/changes/route');

      const { req } = createMocks({
        method: 'GET',
        url: '/api/dashboard/changes?page=1&pageSize=10',
      });

      const response = await GET(req as Request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('No tienes permisos para ver los registros de auditoría');
      expect(requirePermission).toHaveBeenCalledWith('system', 'view');
    });
  });

  describe('/api/stock', () => {
    it('debería requerir permisos para ver stock', async () => {
      const { requirePermission } = require('@/lib/authz');
      requirePermission.mockRejectedValue(new Error('Insufficient permissions: stock:view'));

      const { GET } = await import('@/app/api/stock/route');

      const { req } = createMocks({
        method: 'GET',
        url: '/api/stock',
      });

      const response = await GET(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(requirePermission).toHaveBeenCalledWith('stock', 'view');
    });
  });

  describe('/api/reports/monthly-comparison', () => {
    it('debería requerir permisos para ver reportes', async () => {
      const { requirePermission } = require('@/lib/authz');
      requirePermission.mockRejectedValue(new Error('Insufficient permissions: reports:view'));

      const { GET } = await import('@/app/api/reports/monthly-comparison/route');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(requirePermission).toHaveBeenCalledWith('reports', 'view');
    });
  });

  describe('/api/calendar/events', () => {
    it('debería requerir permisos para ver eventos', async () => {
      const { requirePermission } = require('@/lib/authz');
      requirePermission.mockRejectedValue(new Error('Insufficient permissions: tracking:view'));

      const { GET } = await import('@/app/api/calendar/events/route');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(requirePermission).toHaveBeenCalledWith('tracking', 'view');
    });

    it('debería requerir permisos para crear eventos', async () => {
      const { requirePermission } = require('@/lib/authz');
      requirePermission.mockRejectedValue(new Error('Insufficient permissions: tracking:create'));

      const { POST } = await import('@/app/api/calendar/events/route');

      const { req } = createMocks({
        method: 'POST',
        url: '/api/calendar/events',
        body: {
          title: 'Test Event',
          date: '2024-01-01',
          startTime: '09:00',
          endTime: '10:00',
        },
      });

      const response = await POST(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(requirePermission).toHaveBeenCalledWith('tracking', 'create');
    });
  });
});

describe('Manejo de Errores de Autenticación', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería manejar usuario no autenticado', async () => {
    const { requirePermission } = require('@/lib/authz');
    requirePermission.mockRejectedValue(new Error('Unauthorized'));

    const { GET } = await import('@/app/api/customers/route');

    const { req } = createMocks({
      method: 'GET',
      url: '/api/customers',
    });

    const response = await GET(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('debería manejar cuenta no aprobada', async () => {
    const { requirePermission } = require('@/lib/authz');
    requirePermission.mockRejectedValue(new Error('User account is not approved'));

    const { GET } = await import('@/app/api/customers/route');

    const { req } = createMocks({
      method: 'GET',
      url: '/api/customers',
    });

    const response = await GET(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe('ACCOUNT_NOT_APPROVED');
  });

  it('debería manejar usuario sin rol asignado', async () => {
    const { requirePermission } = require('@/lib/authz');
    requirePermission.mockRejectedValue(new Error('User has no role assigned'));

    const { POST } = await import('@/app/api/customers/route');

    const { req } = createMocks({
      method: 'POST',
      url: '/api/customers',
      body: { companyName: 'Test' },
    });

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe('NO_ROLE_ASSIGNED');
  });
});
