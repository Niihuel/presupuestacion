import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 PRETENSA - Iniciando seed completo de la base de datos...');

  // ==================== SEED 1: ROLES Y PERMISOS ====================
  console.log('\n🔐 SEED 1: Creando roles y permisos...');
  
  // Crear permisos básicos
  const basePermissions = [
    // Dashboard y sistema
    ['dashboard', ['view', 'export']],
    ['system', ['view', 'edit', 'backup', 'restore']],
    ['audit', ['view']], // Auditoría del sistema

    // Gestión de presupuestos y proyectos
    ['budgets', ['view', 'create', 'edit', 'delete', 'approve']],
    ['projects', ['view', 'create', 'edit', 'delete']],

    // Clientes y proveedores
    ['customers', ['view', 'create', 'edit', 'delete']],
    ['designers', ['view', 'create', 'edit', 'delete']],

    // Inventario y producción
    ['materials', ['view', 'create', 'edit', 'delete']],
    ['pieces', ['view', 'create', 'edit', 'delete']],
    ['piece-families', ['view', 'create', 'edit', 'delete']],
    ['plants', ['view', 'create', 'edit', 'delete']],
    ['molds', ['view', 'create', 'edit', 'delete']],
    ['trucks', ['view', 'create', 'edit', 'delete']],

    // Administración del sistema
    ['users', ['view', 'create', 'edit', 'delete', 'approve']],
    ['roles', ['view', 'create', 'edit', 'delete']],
    ['parameters', ['view', 'edit']],
    ['calendar', ['view', 'create', 'edit', 'delete']],
  ] as const;

  console.log('📝 Creando permisos base...');
  const permissions = await Promise.all(
    basePermissions.flatMap(([resource, actions]) =>
      actions.map((action) =>
        prisma.permission.upsert({
          where: { resource_action: { resource, action } },
          update: { description: `${action} ${resource}` },
          create: { resource, action, description: `${action} ${resource}` },
        }),
      ),
    ),
  );

  console.log(`✅ ${permissions.length} permisos creados/actualizados`);

  // Crear roles
  const roles = [
    {
      name: 'Super Admin',
      description: 'Administrador con acceso total al sistema',
    },
    {
      name: 'Admin',
      description: 'Administrador con permisos avanzados',
    },
    {
      name: 'Manager',
      description: 'Gerente con permisos de gestión',
    },
    {
      name: 'User',
      description: 'Usuario estándar con permisos básicos',
    },
    {
      name: 'Viewer',
      description: 'Usuario con permisos de solo lectura',
    },
  ];

  const createdRoles: { [key: string]: string } = {};
  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
      },
      create: role,
    });
    createdRoles[role.name] = created.id;
  }

  console.log(`✅ ${roles.length} roles creados/actualizados`);

  // Asignar permisos a roles
  const rolePermissions = {
    'Admin': permissions.filter((p: any) => {
      // Admin tiene todos los permisos excepto algunos del sistema
      if (p.resource === 'system' && ['backup', 'restore'].includes(p.action)) return false;
      return true;
    }),
    'Manager': permissions.filter((p: any) => {
      // Manager tiene permisos de gestión pero no de administración completa
      if (['system', 'audit', 'users', 'roles'].includes(p.resource) && p.action !== 'view') return false;
      if (['delete'].includes(p.action)) return false; // No puede eliminar
      return ['view', 'create', 'edit'].includes(p.action);
    }),
    'User': permissions.filter((p: any) => {
      // User tiene permisos básicos de trabajo diario
      if (['system', 'audit', 'users', 'roles', 'parameters', 'designers', 'plants', 'molds', 'trucks', 'calendar'].includes(p.resource)) return false;
      if (['edit', 'delete', 'approve'].includes(p.action)) return false;
      return p.action === 'view' || (p.resource === 'budgets' && ['view', 'create'].includes(p.action));
    }),
    'Viewer': permissions.filter((p: any) => {
      // Viewer solo tiene permisos de lectura
      return p.action === 'view';
    }),
  };

  for (const [roleName, perms] of Object.entries(rolePermissions)) {
    const roleId = createdRoles[roleName];
    if (!roleId) continue;

    await prisma.rolePermission.deleteMany({ where: { roleId } });

    await Promise.all(
      perms.map((permission: any) =>
        prisma.rolePermission.create({
          data: {
            roleId,
            permissionId: permission.id,
            description: `${roleName} can ${permission.action} ${permission.resource}`,
            assignedBy: 'system',
          },
        })
      )
    );
  }

  console.log('✅ Permisos asignados a roles');

  // Crear usuario super admin
  const superAdminEmail = 'admin@pretensa.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        roleId: createdRoles['Super Admin'],
        isSuperAdmin: true,
        isApproved: true,
        active: true,
        provider: 'credentials',
      },
    });
    console.log('✅ Super Admin creado - Email: admin@pretensa.com, Password: Admin123!');
  } else {
    await prisma.user.update({
      where: { email: superAdminEmail },
      data: {
        roleId: createdRoles['Super Admin'],
        isSuperAdmin: true,
        isApproved: true,
        active: true,
      },
    });
    console.log('✅ Super Admin actualizado');
  }

  // ==================== SEED 2: MATERIALES ====================
  console.log('\n🧱 SEED 2: Creando materiales...');
  
  const materials = [
    // Aceros
    { code: 'STEEL001', name: 'Acero corrugado 12mm', category: 'acero', unit: 'kg', currentPrice: 1250.50, lastPriceUpdate: new Date(), supplier: 'Acindar', minimumStock: 1000 },
    { code: 'STEEL002', name: 'Acero corrugado 8mm', category: 'acero', unit: 'kg', currentPrice: 1180.00, lastPriceUpdate: new Date(), supplier: 'Acindar', minimumStock: 800 },
    { code: 'STEEL003', name: 'Acero liso 6mm', category: 'acero', unit: 'kg', currentPrice: 1100.00, lastPriceUpdate: new Date(), supplier: 'Siderar', minimumStock: 500 },
    // Hormigones
    { code: 'CONC001', name: 'Hormigón H30', category: 'hormigon', unit: 'm3', currentPrice: 18500.00, lastPriceUpdate: new Date(), supplier: 'Loma Negra', minimumStock: 50 },
    { code: 'CONC002', name: 'Hormigón H21', category: 'hormigon', unit: 'm3', currentPrice: 16800.00, lastPriceUpdate: new Date(), supplier: 'Loma Negra', minimumStock: 50 },
    { code: 'CONC003', name: 'Hormigón H17', category: 'hormigon', unit: 'm3', currentPrice: 15200.00, lastPriceUpdate: new Date(), supplier: 'Holcim', minimumStock: 30 },
    // Aditivos
    { code: 'ADD001', name: 'Plastificante para hormigón', category: 'aditivo', unit: 'lt', currentPrice: 450.00, lastPriceUpdate: new Date(), supplier: 'Sika', minimumStock: 50 },
    { code: 'ADD002', name: 'Acelerante de fragüe', category: 'aditivo', unit: 'kg', currentPrice: 680.00, lastPriceUpdate: new Date(), supplier: 'Sika', minimumStock: 30 },
    // Desmoldantes
    { code: 'RELEASE001', name: 'Desmoldante base aceite', category: 'accesorio', unit: 'lt', currentPrice: 320.00, lastPriceUpdate: new Date(), supplier: 'Weber', minimumStock: 100 },
    { code: 'RELEASE002', name: 'Desmoldante base agua', category: 'accesorio', unit: 'lt', currentPrice: 280.00, lastPriceUpdate: new Date(), supplier: 'Weber', minimumStock: 80 },
    // Cables
    { code: 'CBL159', name: 'Cable 15.9mm', category: 'acero', unit: 'ml', currentPrice: 2500, lastPriceUpdate: new Date() },
    // Energía
    { code: 'ENERG01', name: 'Energía Vapor', category: 'energia', unit: 'kWh', currentPrice: 45, lastPriceUpdate: new Date() },
    { code: 'GAS01', name: 'Gas Natural', category: 'energia', unit: 'm3', currentPrice: 120, lastPriceUpdate: new Date() },
  ];

  for (const material of materials) {
    const created = await prisma.material.upsert({
      where: { code: material.code },
      update: {
        name: material.name,
        category: material.category,
        unit: material.unit,
        currentPrice: material.currentPrice,
        lastPriceUpdate: material.lastPriceUpdate,
        supplier: material.supplier,
        minimumStock: material.minimumStock,
      },
      create: material,
    });
    
    // Crear registro inicial de precio
    await prisma.materialPriceHistory.create({
      data: {
        materialId: created.id,
        price: material.currentPrice,
        effectiveDate: new Date(),
      },
    });
    
    console.log(`Material ${material.code} - ${material.name}`);
  }

  console.log(`✅ ${materials.length} materiales creados`);

  // ==================== SEED 3: PARÁMETROS DE COSTO ====================
  console.log('\n💰 SEED 3: Creando parámetros de costo...');
  
  const costParams = [
    { name: 'ENERGIA_Y_CURADO', category: 'ENERGY', unit: '$/tn', value: 15658, description: 'Energía y curado por tonelada' },
    { name: 'GASTOS_GRALES_FABRICA', category: 'OVERHEAD', unit: '$/tn', value: 45183, description: 'Gastos generales de fábrica' },
    { name: 'GASTOS_GRALES_EMPRESA', category: 'OVERHEAD', unit: '$/tn', value: 41000, description: 'Gastos generales de empresa' },
    { name: 'UTILIDAD', category: 'OVERHEAD', unit: '$/tn', value: 34693, description: 'Utilidad' },
    { name: 'MANO_OBRA_LLENADO', category: 'LABOR', unit: '$/m³', value: 188850, description: 'Mano de obra de llenado promedio' },
    { name: 'HORA_MANO_OBRA', category: 'LABOR', unit: '$/hora', value: 3000, description: 'Costo hora de mano de obra' },
    { name: 'INGENIERIA', category: 'OVERHEAD', unit: '$/tn', value: 12969, description: 'Ingeniería' }
  ];

  for (const param of costParams) {
    await prisma.costParameter.upsert({
      where: { name: param.name },
      update: { value: param.value },
      create: {
        ...param,
        effectiveDate: new Date(),
        isActive: true
      }
    });
  }

  console.log(`✅ ${costParams.length} parámetros de costo creados`);

  // ==================== SEED 4: DISEÑADORES ====================
  console.log('\n🎨 SEED 4: Creando diseñadores...');
  
  const designers = [
    { name: 'Estudio AFT', email: 'contacto@aft.com', phone: '123456789' },
    { name: 'Arq. Bóveda', email: 'info@bovedaarq.com', phone: '987654321' },
    { name: 'Diseños Modernos S.A.', email: 'proyectos@dmsa.com', phone: '555123456' },
  ];

  await Promise.all(
    designers.map(designer => 
      prisma.designer.upsert({
        where: { name: designer.name },
        update: {},
        create: designer,
      })
    )
  );
  
  console.log(`✅ ${designers.length} diseñadores creados`);

  // ==================== SEED 5: PLANTAS, FAMILIAS Y MOLDES ====================
  console.log('\n🏭 SEED 5: Creando plantas, familias y moldes...');
  
  // Crear plantas
  const plants = [
    { name: 'Planta Córdoba', location: 'Córdoba', address: 'Ruta 36 Km 42, Córdoba', active: true },
    { name: 'Planta Buenos Aires', location: 'Buenos Aires', address: 'Panamericana Km 78, Buenos Aires', active: true },
  ];

  const createdPlants = [];
  for (const plant of plants) {
    const existing = await prisma.plant.findFirst({
      where: { name: plant.name },
    });
    
    if (existing) {
      createdPlants.push(existing);
    } else {
      const created = await prisma.plant.create({
        data: plant,
      });
      createdPlants.push(created);
    }
  }

  console.log(`✅ ${plants.length} plantas creadas`);

  // Crear familias de piezas
  const families = [
    { code: 'VIGAS', description: 'Vigas pretensadas y armadas' },
    { code: 'COLUMNAS', description: 'Columnas prefabricadas' },
    { code: 'LOSAS', description: 'Losas alveolares y TT' },
    { code: 'MUROS', description: 'Paneles de muro' },
    { code: 'ALCANTARILLAS', description: 'Conductos de alcantarilla' },
  ];

  const createdFamilies = [];
  for (const family of families) {
    const created = await prisma.pieceFamily.upsert({
      where: { code: family.code },
      update: {},
      create: family,
    });
    createdFamilies.push(created);
  }

  console.log(`✅ ${families.length} familias de piezas creadas`);

  // Crear moldes
  if (createdFamilies.length > 0 && createdPlants.length > 0) {
    const molds = [
      { code: 'MLD-VIG-01', description: 'Molde Viga T 12m', familyCode: 'VIGAS' },
      { code: 'MLD-COL-01', description: 'Molde Columna 40x40', familyCode: 'COLUMNAS' },
      { code: 'MLD-LOS-01', description: 'Molde Losa Alveolar 1.20m', familyCode: 'LOSAS' },
    ];
    
    for (const mold of molds) {
      const family = createdFamilies.find((f: any) => f.code === mold.familyCode);
      if (!family) continue;
      
      await prisma.mold.upsert({
        where: { code: mold.code },
        update: {
          description: mold.description,
        },
        create: {
          code: mold.code,
          description: mold.description,
          familyId: family.id,
          plantId: createdPlants[0].id,
          active: true,
        },
      });
      
      console.log(`Molde ${mold.code} - ${mold.description}`);
    }

    console.log(`✅ Moldes creados`);
  }

  console.log('\n🎯 SEED COMPLETO - Base de datos inicializada correctamente!');
  console.log('\n📋 RESUMEN:');
  console.log(`   - ${permissions.length} permisos`);
  console.log(`   - ${roles.length} roles`);
  console.log(`   - 1 usuario super admin`);
  console.log(`   - ${materials.length} materiales`);
  console.log(`   - ${costParams.length} parámetros de costo`);
  console.log(`   - ${designers.length} diseñadores`);
  console.log(`   - ${plants.length} plantas`);
  console.log(`   - ${families.length} familias de piezas`);
  console.log(`   - Moldes asociados`);
  console.log('\n🔑 CREDENCIALES DE ACCESO:');
  console.log('   Email: admin@pretensa.com');
  console.log('   Password: Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
