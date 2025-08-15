const { sequelize } = require('./src/shared/database/database');

async function updateUserToAdmin() {
  try {
    console.log('🔧 Actualizando permisos de usuario...');
    
    // Buscar el usuario específico
    const user = await sequelize.query(`
      SELECT id, email, username, role
      FROM users 
      WHERE username = 'nihuelprietorellan_1753829440616'
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (user.length === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('👤 Usuario encontrado:', user[0]);
    
    // Actualizar el usuario como administrador
    await sequelize.query(`
      UPDATE users 
      SET role = 'admin',
          is_active = 1
      WHERE username = 'nihuelprietorellan_1753829440616'
    `);
    
    console.log('✅ Usuario actualizado como administrador');
    
    // Verificar el cambio
    const updatedUser = await sequelize.query(`
      SELECT id, email, username, role, is_active
      FROM users 
      WHERE username = 'nihuelprietorellan_1753829440616'
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('🔍 Usuario después de actualización:', updatedUser[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

updateUserToAdmin();
