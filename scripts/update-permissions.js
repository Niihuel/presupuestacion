const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function updatePermissions() {
  console.log('🔄 Actualizando permisos en la base de datos...');

  // Nuevos permisos que faltaban
  const newPermissions = [
    // Permisos faltantes que usa el navbar
    { resource: 'piece-families', action: 'view', description: 'Ver familias de piezas' },
    { resource: 'piece-families', action: 'create', description: 'Crear familias de piezas' },
    { resource: 'piece-families', action: 'edit', description: 'Editar familias de piezas' },
    { resource: 'piece-families', action: 'delete', description: 'Eliminar familias de piezas' },

    { resource: 'parameters', action: 'view', description: 'Ver parámetros del sistema' },
    { resource: 'parameters', action: 'edit', description: 'Editar parámetros del sistema' },

    { resource: 'designers', action: 'view', description: 'Ver diseñadores' },
    { resource: 'designers', action: 'create', description: 'Crear diseñadores' },
    { resource: 'designers', action: 'edit', description: 'Editar diseñadores' },
    { resource: 'designers', action: 'delete', description: 'Eliminar diseñadores' },

    { resource: 'audit', action: 'view', description: 'Ver registros de auditoría' },

    { resource: 'plants', action: 'view', description: 'Ver plantas' },
    { resource: 'plants', action: 'create', description: 'Crear plantas' },
    { resource: 'plants', action: 'edit', description: 'Editar plantas' },
    { resource: 'plants', action: 'delete', description: 'Eliminar plantas' },

    { resource: 'trucks', action: 'view', description: 'Ver camiones' },
    { resource: 'trucks', action: 'create', description: 'Crear camiones' },
    { resource: 'trucks', action: 'edit', description: 'Editar camiones' },
    { resource: 'trucks', action: 'delete', description: 'Eliminar camiones' },
  ];

  let createdCount = 0;
  let updatedCount = 0;

  for (const perm of newPermissions) {
    try {
      const existing = await prisma.permission.findFirst({
        where: {
          resource: perm.resource,
          action: perm.action,
        },
      });

      if (!existing) {
        await prisma.permission.create({
          data: perm,
        });
        createdCount++;
        console.log(`✅ Creado: ${perm.resource}:${perm.action}`);
      } else if (existing.description !== perm.description) {
        await prisma.permission.update({
          where: { id: existing.id },
          data: { description: perm.description },
        });
        updatedCount++;
        console.log(`🔄 Actualizado: ${perm.resource}:${perm.action}`);
      }
    } catch (error) {
      console.error(`❌ Error con ${perm.resource}:${perm.action}:`, error.message);
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   - ${createdCount} permisos creados`);
  console.log(`   - ${updatedCount} permisos actualizados`);
  console.log(`\n🎉 Actualización de permisos completada!`);
}

updatePermissions()
  .catch((e) => {
    console.error('❌ Error actualizando permisos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
