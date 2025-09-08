const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Permisos que usa el navbar según el código analizado
// Nota: Algunos permisos pueden no ser requeridos por todos los roles
const requiredPermissions = [
  // Dashboard
  { resource: 'dashboard', action: 'view' },

  // Gestión
  { resource: 'customers', action: 'view' },
  { resource: 'projects', action: 'view' },
  { resource: 'plants', action: 'view' },
  { resource: 'materials', action: 'view' },
  { resource: 'pieces', action: 'view' },
  { resource: 'piece-families', action: 'view' },
  { resource: 'trucks', action: 'view' },

  // Presupuestación
  { resource: 'budgets', action: 'view' },
  { resource: 'projects', action: 'view' }, // Para seguimientos

  // Administración
  { resource: 'users', action: 'view' },
  { resource: 'roles', action: 'view' },
  { resource: 'parameters', action: 'view' },
  { resource: 'designers', action: 'view' },

  // Sistema (para notificaciones)
  { resource: 'system', action: 'view' },
];

// Permisos específicos que pueden no estar en todos los roles
const roleSpecificPermissions = {
  'Super Admin': ['audit:view', 'budgets:create'],
  'Admin': ['audit:view', 'budgets:create'],
  'Manager': ['audit:view'],
  'User': ['budgets:create'], // User puede crear pero no ver audit
  'Viewer': [] // Viewer no tiene permisos especiales
};

async function verifyPermissions() {
  console.log('🔍 Verificando permisos requeridos por el navbar...\n');

  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  let totalMissing = 0;

  for (const role of roles) {
    console.log(`👤 Rol: ${role.name}`);
    const rolePermissions = role.permissions.map(rp => ({
      resource: rp.permission.resource,
      action: rp.permission.action,
    }));

    let missingCount = 0;
    const missing = [];

    // Verificar permisos base requeridos por todos los roles
    for (const required of requiredPermissions) {
      const hasPermission = rolePermissions.some(rp =>
        rp.resource === required.resource && rp.action === required.action
      );

      if (!hasPermission) {
        missing.push(`${required.resource}:${required.action}`);
        missingCount++;
      }
    }

    // Verificar permisos específicos del rol (opcionales)
    const specificPermissions = roleSpecificPermissions[role.name] || [];
    for (const permString of specificPermissions) {
      const [resource, action] = permString.split(':');
      const hasPermission = rolePermissions.some(rp =>
        rp.resource === resource && rp.action === action
      );

      if (!hasPermission) {
        missing.push(`${resource}:${action} (específico del rol)`);
        missingCount++;
      }
    }

    if (missingCount > 0) {
      console.log(`   ❌ Faltan ${missingCount} permisos:`);
      missing.forEach(perm => console.log(`      - ${perm}`));
    } else {
      console.log(`   ✅ Tiene todos los permisos requeridos`);
    }

    totalMissing += missingCount;
    console.log('');
  }

  // Verificar permisos existentes en la base de datos
  console.log('📋 Permisos existentes en la base de datos:');
  const allPermissions = await prisma.permission.findMany({
    orderBy: [
      { resource: 'asc' },
      { action: 'asc' },
    ],
  });

  const groupedPermissions = {};
  allPermissions.forEach(perm => {
    if (!groupedPermissions[perm.resource]) {
      groupedPermissions[perm.resource] = [];
    }
    groupedPermissions[perm.resource].push(perm.action);
  });

  Object.keys(groupedPermissions).sort().forEach(resource => {
    console.log(`   ${resource}: [${groupedPermissions[resource].join(', ')}]`);
  });

  console.log(`\n📊 Resumen:`);
  console.log(`   - Total de roles verificados: ${roles.length}`);
  console.log(`   - Permisos requeridos por navbar: ${requiredPermissions.length}`);
  console.log(`   - Permisos existentes: ${allPermissions.length}`);

  if (totalMissing > 0) {
    console.log(`   - ⚠️  Faltan ${totalMissing} asignaciones de permisos`);
    console.log(`\n💡 Recomendación: Ejecuta 'npm run update-permissions' para agregar los permisos faltantes`);
  } else {
    console.log(`   - ✅ Todos los permisos están correctamente asignados`);
  }
}

verifyPermissions()
  .catch((e) => {
    console.error('❌ Error verificando permisos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
