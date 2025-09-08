/**
 * Tests automatizados para el sistema de permisos
 */

import { requirePermission, hasPermission, getUserPermissions } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

// Mock de prisma para tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    rolePermission: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
    },
  },
}));

// Mock de NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('Sistema de Permisos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requirePermission', () => {
    it('debería permitir acceso a super admin', async () => {
      const mockUser = {
        id: '1',
        email: 'admin@pretensa.com',
        isSuperAdmin: true,
        isApproved: true,
        active: true,
        roleId: null,
      };

      // Mock getServerSession to return super admin user
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue({ user: mockUser });

      const result = await requirePermission('customers', 'view');
      expect(result).toEqual(mockUser);
    });

    it('debería denegar acceso a usuario no aprobado', async () => {
      const mockUser = {
        id: '2',
        email: 'user@pretensa.com',
        isSuperAdmin: false,
        isApproved: false,
        active: true,
        roleId: 'role1',
      };

      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue({ user: mockUser });

      await expect(requirePermission('customers', 'view'))
        .rejects
        .toThrow('User account is not approved');
    });

    it('debería permitir permisos básicos de vista a usuarios aprobados sin rol', async () => {
      const mockUser = {
        id: '3',
        email: 'user@pretensa.com',
        isSuperAdmin: false,
        isApproved: true,
        active: true,
        roleId: null,
      };

      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue({ user: mockUser });

      const result = await requirePermission('dashboard', 'view');
      expect(result).toEqual(mockUser);
    });

    it('debería verificar permisos específicos del rol', async () => {
      const mockUser = {
        id: '4',
        email: 'user@pretensa.com',
        isSuperAdmin: false,
        isApproved: true,
        active: true,
        roleId: 'role1',
      };

      const mockPermission = {
        id: 'perm1',
        roleId: 'role1',
        permission: {
          resource: 'customers',
          action: 'view',
        },
      };

      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue({ user: mockUser });
      
      const mockPrisma = prisma as any;
      mockPrisma.rolePermission.findFirst.mockResolvedValue(mockPermission);

      const result = await requirePermission('customers', 'view');
      expect(result).toEqual(mockUser);
      expect(mockPrisma.rolePermission.findFirst).toHaveBeenCalledWith({
        where: {
          roleId: 'role1',
          permission: {
            resource: 'customers',
            action: 'view',
          },
        },
        include: {
          permission: true,
        },
      });
    });
  });

  describe('hasPermission', () => {
    it('debería retornar true si el usuario tiene permisos', async () => {
      const mockUser = {
        id: '1',
        email: 'admin@pretensa.com',
        isSuperAdmin: true,
        isApproved: true,
        active: true,
      };

      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue({ user: mockUser });

      const result = await hasPermission('customers', 'view');
      expect(result).toBe(true);
    });

    it('debería retornar false si el usuario no tiene permisos', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue(null);

      const result = await hasPermission('customers', 'view');
      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('debería retornar todos los permisos para super admin', async () => {
      const mockUser = {
        id: '1',
        email: 'admin@pretensa.com',
        isSuperAdmin: true,
        isApproved: true,
        active: true,
      };

      const mockPermissions = [
        { id: '1', resource: 'customers', action: 'view' },
        { id: '2', resource: 'customers', action: 'create' },
      ];

      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue({ user: mockUser });

      const mockPrisma = prisma as any;
      mockPrisma.permission.findMany.mockResolvedValue(mockPermissions);

      const result = await getUserPermissions();
      expect(result).toEqual(mockPermissions);
    });

    it('debería retornar permisos del rol para usuario normal', async () => {
      const mockUser = {
        id: '2',
        email: 'user@pretensa.com',
        isSuperAdmin: false,
        isApproved: true,
        active: true,
        roleId: 'role1',
      };

      const mockRolePermissions = [
        {
          permission: { id: '1', resource: 'customers', action: 'view' },
        },
      ];

      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue({ user: mockUser });

      const mockPrisma = prisma as any;
      mockPrisma.rolePermission.findMany.mockResolvedValue(mockRolePermissions);

      const result = await getUserPermissions();
      expect(result).toEqual([{ id: '1', resource: 'customers', action: 'view' }]);
    });
  });
});

describe('Recursos de Permisos', () => {
  const recursos = [
    'customers',
    'budgets',
    'projects',
    'parameters',
    'system',
    'users',
    'roles',
    'reports',
    'tracking',
    'stock',
  ];

  const acciones = ['view', 'create', 'update', 'delete'];

  recursos.forEach((recurso) => {
    describe(`Recurso: ${recurso}`, () => {
      acciones.forEach((accion) => {
        it(`debería manejar permiso ${recurso}:${accion}`, async () => {
          const mockUser = {
            id: '1',
            email: 'test@pretensa.com',
            isSuperAdmin: true,
            isApproved: true,
            active: true,
          };

          const { getServerSession } = require('next-auth');
          getServerSession.mockResolvedValue({ user: mockUser });

          const result = await hasPermission(recurso, accion);
          expect(result).toBe(true);
        });
      });
    });
  });
});
