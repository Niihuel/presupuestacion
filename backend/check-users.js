const { sequelize } = require('./src/shared/database/database');

async function checkUsers() {
  try {
    console.log('🔍 Consultando usuarios...');
    
    // Consulta directa usando executeQuery
    const result = await sequelize.query(`
      SELECT id, email, username, is_active, role, oauth_id
      FROM users 
      ORDER BY created_at DESC
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('👥 Usuarios encontrados:', result.length);
    console.table(result);
    
    // Si hay usuarios inactivos, activarlos
    if (result.length > 0) {
      const inactiveUsers = result.filter(u => !u.is_active);
      if (inactiveUsers.length > 0) {
        console.log(`⚠️  Encontrados ${inactiveUsers.length} usuarios inactivos`);
        
        // Activar usuarios
        await sequelize.query(`
          UPDATE users 
          SET is_active = 1 
          WHERE is_active = 0
        `);
        
        console.log('✅ Usuarios activados');
      } else {
        console.log('✅ Todos los usuarios están activos');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkUsers();
