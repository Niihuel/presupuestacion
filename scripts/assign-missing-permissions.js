const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function assignMissingPermissions() {
  console.log('🔗 Asignando permisos faltantes a los roles...\n');

  // Obtener todos los roles con sus permisos actuales
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  // Permisos que cada rol debería tener según la lógica del navbar
  const rolePermissionsMap = {
    'Super Admin': [
      // Todos los permisos
      'dashboard:view', 'dashboard:export',
      'budgets:view', 'budgets:create', 'budgets:edit', 'budgets:delete', 'budgets:approve',
      'projects:view', 'projects:create', 'projects:edit', 'projects:delete',
      'customers:view', 'customers:create', 'customers:edit', 'customers:delete',
      'materials:view', 'materials:create', 'materials:edit', 'materials:delete',
      'pieces:view', 'pieces:create', 'pieces:edit', 'pieces:delete',
      'piece-families:view', 'piece-families:create', 'piece-families:edit', 'piece-families:delete',
      'users:view', 'users:create', 'users:edit', 'users:delete', 'users:approve',
      'roles:view', 'roles:create', 'roles:edit', 'roles:delete',
      'system:view', 'system:edit', 'system:backup', 'system:restore',
      'plants:view', 'plants:create', 'plants:edit', 'plants:delete',
      'molds:view', 'molds:create', 'molds:edit', 'molds:delete',
      'designers:view', 'designers:create', 'designers:edit', 'designers:delete',
      'trucks:view', 'trucks:create', 'trucks:edit', 'trucks:delete',
      'calendar:view', 'calendar:create', 'calendar:edit', 'calendar:delete',
      'parameters:view', 'parameters:edit',
      'audit:view'
    ],
    'Admin': [
      // Casi todos los permisos excepto algunos críticos del sistema
      'dashboard:view', 'dashboard:export',
      'budgets:view', 'budgets:create', 'budgets:edit', 'budgets:delete', 'budgets:approve',
      'projects:view', 'projects:create', 'projects:edit', 'projects:delete',
      'customers:view', 'customers:create', 'customers:edit', 'customers:delete',
      'materials:view', 'materials:create', 'materials:edit', 'materials:delete',
      'pieces:view', 'pieces:create', 'pieces:edit', 'pieces:delete',
      'piece-families:view', 'piece-families:create', 'piece-families:edit', 'piece-families:delete',
      'users:view', 'users:create', 'users:edit', 'users:approve',
      'roles:view', 'roles:create', 'roles:edit',
      'system:view',
      'plants:view', 'plants:create', 'plants:edit', 'plants:delete',
      'molds:view', 'molds:create', 'molds:edit', 'molds:delete',
      'designers:view', 'designers:create', 'designers:edit', 'designers:delete',
      'trucks:view', 'trucks:create', 'trucks:edit', 'trucks:delete',
      'calendar:view', 'calendar:create', 'calendar:edit', 'calendar:delete',
      'parameters:view', 'parameters:edit',
      'audit:view'
    ],
    'Manager': [
      // Permisos de gestión pero no de eliminación o administración
      'dashboard:view', 'dashboard:export',
      'budgets:view', 'budgets:create', 'budgets:edit', 'budgets:approve',
      'projects:view', 'projects:create', 'projects:edit',
      'customers:view', 'customers:create', 'customers:edit',
      'materials:view', 'materials:edit',
      'pieces:view', 'pieces:edit',
      'piece-families:view',
      'users:view',
      'plants:view',
      'designers:view',
      'trucks:view',
      'calendar:view', 'calendar:create', 'calendar:edit',
      'parameters:view',
      'system:view',
      'audit:view'
    ],
    'User': [
      // Permisos básicos para trabajo diario (sin audit)
      'dashboard:view',
      'budgets:view', 'budgets:create',
      'projects:view',
      'customers:view',
      'materials:view',
      'pieces:view',
      'piece-families:view'
    ],
    'Viewer': [
      // Solo permisos de lectura (sin crear budgets ni audit)
      'dashboard:view',
      'budgets:view',
      'projects:view',
      'customers:view',
      'materials:view',
      'pieces:view',
      'piece-families:view',
      'users:view',
      'plants:view',
      'designers:view',
      'trucks:view',
      'calendar:view'
    ]
  };

  let totalAssigned = 0;

  for (const role of roles) {
    console.log(`👤 Procesando rol: ${role.name}`);

    // Obtener permisos actuales del rol
    const currentPermissions = role.permissions.map(rp => `${rp.permission.resource}:${rp.permission.action}`);

    // Permisos que debería tener este rol
    const requiredPermissions = rolePermissionsMap[role.name] || [];

    let assignedCount = 0;

    for (const permString of requiredPermissions) {
      const [resource, action] = permString.split(':');

      // Verificar si ya tiene este permiso
      if (!currentPermissions.includes(permString)) {
        try {
          // Buscar el permiso en la base de datos
          const permission = await prisma.permission.findFirst({
            where: { resource, action }
          });

          if (permission) {
            // Asignar el permiso al rol
            await prisma.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId: permission.id,
                description: `${role.name} can ${action} ${resource}`,
                assignedBy: 'system'
              }
            });

            assignedCount++;
            console.log(`   ✅ Asignado: ${permString}`);
          } else {
            console.log(`   ⚠️  Permiso no encontrado: ${permString}`);
          }
        } catch (error) {
          console.error(`   ❌ Error asignando ${permString}:`, error.message);
        }
      }
    }

    if (assignedCount > 0) {
      console.log(`   📊 ${assignedCount} permisos asignados a ${role.name}`);
    } else {
      console.log(`   ✅ ${role.name} ya tiene todos los permisos necesarios`);
    }

    console.log('');
    totalAssigned += assignedCount;
  }

  console.log(`🎉 Proceso completado!`);
  console.log(`📊 Total de permisos asignados: ${totalAssigned}`);
}

assignMissingPermissions()
  .catch((e) => {
    console.error('❌ Error asignando permisos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
