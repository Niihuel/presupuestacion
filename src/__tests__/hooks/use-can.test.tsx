/**
 * Tests para el hook useCan
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { useCan } from '@/hooks/use-can';
import { usePermissions } from '@/hooks/use-permissions';

// Mock del hook usePermissions
jest.mock('@/hooks/use-permissions');

describe('useCan Hook', () => {
  const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería retornar funciones de verificación de permisos', () => {
    mockUsePermissions.mockReturnValue({
      user: null,
      userPermissions: [],
      loading: false,
      hasPermission: jest.fn().mockReturnValue(false),
      canView: jest.fn().mockReturnValue(false),
      canCreate: jest.fn().mockReturnValue(false),
      canUpdate: jest.fn().mockReturnValue(false),
      canDelete: jest.fn().mockReturnValue(false),
      isApproved: false,
      isSuperAdmin: false,
    });

    const { result } = renderHook(() => useCan());

    expect(result.current.can).toBeDefined();
    expect(result.current.isApproved).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
    expect(typeof result.current.can.access).toBe('function');
    expect(typeof result.current.can.view).toBe('function');
    expect(typeof result.current.can.create).toBe('function');
    expect(typeof result.current.can.update).toBe('function');
    expect(typeof result.current.can.delete).toBe('function');
  });

  it('debería permitir acceso a super admin', () => {
    mockUsePermissions.mockReturnValue({
      user: { id: '1', email: 'admin@pretensa.com' } as any,
      userPermissions: [],
      loading: false,
      hasPermission: jest.fn().mockReturnValue(true),
      canView: jest.fn().mockReturnValue(true),
      canCreate: jest.fn().mockReturnValue(true),
      canUpdate: jest.fn().mockReturnValue(true),
      canDelete: jest.fn().mockReturnValue(true),
      isApproved: true,
      isSuperAdmin: true,
    });

    const { result } = renderHook(() => useCan());

    expect(result.current.can.access('customers', 'view')).toBe(true);
    expect(result.current.can.viewDashboard()).toBe(true);
    expect(result.current.can.manageUsers()).toBe(true);
    expect(result.current.isSuperAdmin).toBe(true);
  });

  it('debería denegar acceso a usuario no aprobado', () => {
    mockUsePermissions.mockReturnValue({
      user: { id: '2', email: 'user@pretensa.com' } as any,
      userPermissions: [],
      loading: false,
      hasPermission: jest.fn().mockReturnValue(false),
      canView: jest.fn().mockReturnValue(false),
      canCreate: jest.fn().mockReturnValue(false),
      canUpdate: jest.fn().mockReturnValue(false),
      canDelete: jest.fn().mockReturnValue(false),
      isApproved: false,
      isSuperAdmin: false,
    });

    const { result } = renderHook(() => useCan());

    expect(result.current.can.viewDashboard()).toBe(false);
    expect(result.current.isApproved).toBe(false);
  });

  it('debería verificar permisos específicos correctamente', () => {
    const mockHasPermission = jest.fn();
    mockHasPermission.mockImplementation((resource: string, action: string) => {
      return resource === 'customers' && action === 'view';
    });

    mockUsePermissions.mockReturnValue({
      user: { id: '3', email: 'user@pretensa.com' } as any,
      userPermissions: [{ id: '1', resource: 'customers', action: 'view' }] as any,
      loading: false,
      hasPermission: mockHasPermission,
      canView: jest.fn().mockImplementation((resource) => resource === 'customers'),
      canCreate: jest.fn().mockReturnValue(false),
      canUpdate: jest.fn().mockReturnValue(false),
      canDelete: jest.fn().mockReturnValue(false),
      isApproved: true,
      isSuperAdmin: false,
    });

    const { result } = renderHook(() => useCan());

    expect(result.current.can.access('customers', 'view')).toBe(true);
    expect(result.current.can.access('customers', 'create')).toBe(false);
    expect(result.current.can.view('customers')).toBe(true);
    expect(result.current.can.create('customers')).toBe(false);
  });

  describe('Permisos de negocio específicos', () => {
    it('debería verificar viewDashboard correctamente', () => {
      const mockCanView = jest.fn().mockReturnValue(true);
      
      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'user@pretensa.com' } as any,
        userPermissions: [],
        loading: false,
        hasPermission: jest.fn(),
        canView: mockCanView,
        canCreate: jest.fn(),
        canUpdate: jest.fn(),
        canDelete: jest.fn(),
        isApproved: true,
        isSuperAdmin: false,
      });

      const { result } = renderHook(() => useCan());
      expect(result.current.can.viewDashboard()).toBe(true);
    });

    it('debería verificar createBudgets correctamente', () => {
      const mockHasPermission = jest.fn();
      mockHasPermission.mockImplementation((resource, action) => 
        resource === 'budgets' && action === 'create'
      );

      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'user@pretensa.com' } as any,
        userPermissions: [],
        loading: false,
        hasPermission: mockHasPermission,
        canView: jest.fn(),
        canCreate: jest.fn().mockImplementation((resource) => resource === 'budgets'),
        canUpdate: jest.fn(),
        canDelete: jest.fn(),
        isApproved: true,
        isSuperAdmin: false,
      });

      const { result } = renderHook(() => useCan());
      expect(result.current.can.createBudgets()).toBe(true);
    });

    it('debería verificar manageUsers correctamente', () => {
      const mockHasPermission = jest.fn();
      mockHasPermission.mockImplementation((resource, action) => 
        resource === 'users' && action === 'update'
      );

      mockUsePermissions.mockReturnValue({
        user: { id: '1', email: 'user@pretensa.com' } as any,
        userPermissions: [],
        loading: false,
        hasPermission: mockHasPermission,
        canView: jest.fn(),
        canCreate: jest.fn(),
        canUpdate: jest.fn().mockImplementation((resource) => resource === 'users'),
        canDelete: jest.fn(),
        isApproved: true,
        isSuperAdmin: false,
      });

      const { result } = renderHook(() => useCan());
      expect(result.current.can.manageUsers()).toBe(true);
    });
  });
});
