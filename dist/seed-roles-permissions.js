"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed de roles y permisos...');
    // Crear permisos básicos
    const permissions = [
        // Dashboard
        { resource: 'dashboard', action: 'view', description: 'Ver dashboard' },
        { resource: 'dashboard', action: 'export', description: 'Exportar datos del dashboard' },
        // Presupuestos
        { resource: 'budgets', action: 'view', description: 'Ver presupuestos' },
        { resource: 'budgets', action: 'create', description: 'Crear presupuestos' },
        { resource: 'budgets', action: 'edit', description: 'Editar presupuestos' },
        { resource: 'budgets', action: 'delete', description: 'Eliminar presupuestos' },
        { resource: 'budgets', action: 'approve', description: 'Aprobar presupuestos' },
        // Proyectos
        { resource: 'projects', action: 'view', description: 'Ver proyectos' },
        { resource: 'projects', action: 'create', description: 'Crear proyectos' },
        { resource: 'projects', action: 'edit', description: 'Editar proyectos' },
        { resource: 'projects', action: 'delete', description: 'Eliminar proyectos' },
        // Clientes
        { resource: 'customers', action: 'view', description: 'Ver clientes' },
        { resource: 'customers', action: 'create', description: 'Crear clientes' },
        { resource: 'customers', action: 'edit', description: 'Editar clientes' },
        { resource: 'customers', action: 'delete', description: 'Eliminar clientes' },
        // Materiales
        { resource: 'materials', action: 'view', description: 'Ver materiales' },
        { resource: 'materials', action: 'create', description: 'Crear materiales' },
        { resource: 'materials', action: 'edit', description: 'Editar materiales' },
        { resource: 'materials', action: 'delete', description: 'Eliminar materiales' },
        // Piezas
        { resource: 'pieces', action: 'view', description: 'Ver piezas' },
        { resource: 'pieces', action: 'create', description: 'Crear piezas' },
        { resource: 'pieces', action: 'edit', description: 'Editar piezas' },
        { resource: 'pieces', action: 'delete', description: 'Eliminar piezas' },
        // Usuarios
        { resource: 'users', action: 'view', description: 'Ver usuarios' },
        { resource: 'users', action: 'create', description: 'Crear usuarios' },
        { resource: 'users', action: 'edit', description: 'Editar usuarios' },
        { resource: 'users', action: 'delete', description: 'Eliminar usuarios' },
        { resource: 'users', action: 'approve', description: 'Aprobar usuarios' },
        // Sistema
        { resource: 'system', action: 'view', description: 'Ver configuración del sistema' },
        { resource: 'system', action: 'edit', description: 'Editar configuración del sistema' },
        { resource: 'system', action: 'backup', description: 'Realizar backups' },
        { resource: 'system', action: 'restore', description: 'Restaurar backups' },
    ];
    // Crear permisos
    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: {
                resource_action: {
                    resource: perm.resource,
                    action: perm.action,
                },
            },
            update: {
                description: perm.description,
            },
            create: perm,
        });
    }
    console.log(`✅ ${permissions.length} permisos creados/actualizados`);
    // Crear roles básicos
    const roles = [
        {
            name: 'Super Admin',
            description: 'Administrador con acceso total al sistema',
            isSystem: true,
        },
        {
            name: 'Admin',
            description: 'Administrador con permisos avanzados',
            isSystem: true,
        },
        {
            name: 'Manager',
            description: 'Gerente con permisos de gestión',
            isSystem: false,
        },
        {
            name: 'User',
            description: 'Usuario estándar con permisos básicos',
            isSystem: false,
        },
        {
            name: 'Viewer',
            description: 'Usuario con permisos de solo lectura',
            isSystem: false,
        },
    ];
    // Crear roles
    const createdRoles = {};
    for (const role of roles) {
        const created = await prisma.role.upsert({
            where: { name: role.name },
            update: {
                description: role.description,
                isSystem: role.isSystem,
            },
            create: role,
        });
        createdRoles[role.name] = created.id;
    }
    console.log(`✅ ${roles.length} roles creados/actualizados`);
    // Asignar permisos a roles
    const rolePermissions = {
        'Admin': [
            // Dashboard
            { resource: 'dashboard', action: 'view' },
            { resource: 'dashboard', action: 'export' },
            // Presupuestos - todos
            { resource: 'budgets', action: 'view' },
            { resource: 'budgets', action: 'create' },
            { resource: 'budgets', action: 'edit' },
            { resource: 'budgets', action: 'delete' },
            { resource: 'budgets', action: 'approve' },
            // Proyectos - todos
            { resource: 'projects', action: 'view' },
            { resource: 'projects', action: 'create' },
            { resource: 'projects', action: 'edit' },
            { resource: 'projects', action: 'delete' },
            // Clientes - todos
            { resource: 'customers', action: 'view' },
            { resource: 'customers', action: 'create' },
            { resource: 'customers', action: 'edit' },
            { resource: 'customers', action: 'delete' },
            // Materiales - todos
            { resource: 'materials', action: 'view' },
            { resource: 'materials', action: 'create' },
            { resource: 'materials', action: 'edit' },
            { resource: 'materials', action: 'delete' },
            // Piezas - todos
            { resource: 'pieces', action: 'view' },
            { resource: 'pieces', action: 'create' },
            { resource: 'pieces', action: 'edit' },
            { resource: 'pieces', action: 'delete' },
            // Usuarios - gestión
            { resource: 'users', action: 'view' },
            { resource: 'users', action: 'create' },
            { resource: 'users', action: 'edit' },
            { resource: 'users', action: 'approve' },
            // Sistema - vista
            { resource: 'system', action: 'view' },
        ],
        'Manager': [
            // Dashboard
            { resource: 'dashboard', action: 'view' },
            { resource: 'dashboard', action: 'export' },
            // Presupuestos
            { resource: 'budgets', action: 'view' },
            { resource: 'budgets', action: 'create' },
            { resource: 'budgets', action: 'edit' },
            // Proyectos
            { resource: 'projects', action: 'view' },
            { resource: 'projects', action: 'create' },
            { resource: 'projects', action: 'edit' },
            // Clientes
            { resource: 'customers', action: 'view' },
            { resource: 'customers', action: 'create' },
            { resource: 'customers', action: 'edit' },
            // Materiales
            { resource: 'materials', action: 'view' },
            { resource: 'materials', action: 'edit' },
            // Piezas
            { resource: 'pieces', action: 'view' },
            { resource: 'pieces', action: 'edit' },
            // Usuarios - solo vista
            { resource: 'users', action: 'view' },
        ],
        'User': [
            // Dashboard
            { resource: 'dashboard', action: 'view' },
            // Presupuestos
            { resource: 'budgets', action: 'view' },
            { resource: 'budgets', action: 'create' },
            // Proyectos
            { resource: 'projects', action: 'view' },
            // Clientes
            { resource: 'customers', action: 'view' },
            // Materiales
            { resource: 'materials', action: 'view' },
            // Piezas
            { resource: 'pieces', action: 'view' },
        ],
        'Viewer': [
            // Solo permisos de vista
            { resource: 'dashboard', action: 'view' },
            { resource: 'budgets', action: 'view' },
            { resource: 'projects', action: 'view' },
            { resource: 'customers', action: 'view' },
            { resource: 'materials', action: 'view' },
            { resource: 'pieces', action: 'view' },
        ],
    };
    // Asignar permisos a cada rol
    for (const [roleName, perms] of Object.entries(rolePermissions)) {
        const roleId = createdRoles[roleName];
        if (!roleId)
            continue;
        // Eliminar permisos existentes del rol
        await prisma.rolePermission.deleteMany({
            where: { roleId },
        });
        // Asignar nuevos permisos
        for (const perm of perms) {
            const permission = await prisma.permission.findFirst({
                where: {
                    resource: perm.resource,
                    action: perm.action,
                },
            });
            if (permission) {
                await prisma.rolePermission.create({
                    data: {
                        roleId,
                        permissionId: permission.id,
                    },
                });
            }
        }
    }
    console.log('✅ Permisos asignados a roles');
    // Crear usuario super admin si no existe
    const superAdminEmail = 'admin@pretensa.com';
    const existingAdmin = await prisma.user.findUnique({
        where: { email: superAdminEmail },
    });
    if (!existingAdmin) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('Admin123!', 10);
        await prisma.user.create({
            data: {
                email: superAdminEmail,
                password: hashedPassword,
                firstName: 'Super',
                lastName: 'Admin',
                roleId: createdRoles['Super Admin'],
                isSuperAdmin: true,
                isApproved: true,
                active: true,
                provider: 'credentials',
            },
        });
        console.log('✅ Usuario Super Admin creado');
        console.log('   Email: admin@pretensa.com');
        console.log('   Password: Admin123!');
    }
    else {
        // Actualizar el usuario existente para asegurar que es super admin
        await prisma.user.update({
            where: { email: superAdminEmail },
            data: {
                roleId: createdRoles['Super Admin'],
                isSuperAdmin: true,
                isApproved: true,
                active: true,
            },
        });
        console.log('✅ Usuario Super Admin actualizado');
    }
    console.log('🎉 Seed de roles y permisos completado');
}
main()
    .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
