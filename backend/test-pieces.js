/**
 * Script de prueba para el módulo de piezas
 * Para verificar que la base de datos y modelos funcionan correctamente
 */

const { Piece, PiecePrice, Zone } = require('./src/shared/database/models');
const { sequelize } = require('./src/shared/database/database');

async function testPieceCRUD() {
  try {
    console.log('🚀 Iniciando test del módulo de piezas...');

    // Verificar conexión a BD
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos exitosa');

    // 1. Crear una pieza de prueba
    console.log('\n📝 Creando pieza de prueba...');
    const testPiece = await Piece.create({
      name: 'Viga Test 30x40',
      code: 'VT-30-40-TEST',
      description: 'Viga de prueba para testing',
      family_id: 1,
      unit_id: 2,
      length: 400,
      width: 30,
      height: 40,
      volume: 0.48
    });
    console.log('✅ Pieza creada:', testPiece.toJSON());

    // 2. Buscar zonas disponibles
    console.log('\n🌎 Buscando zonas disponibles...');
    const zones = await Zone.findAll({ limit: 3 });
    console.log(`✅ Encontradas ${zones.length} zonas`);

    // 3. Agregar precios por zona
    if (zones.length > 0) {
      console.log('\n💰 Agregando precios por zona...');
      const pricePromises = zones.map((zone, index) => 
        PiecePrice.create({
          piece_id: testPiece.id,
          zone_id: zone.id,
          base_price: 150000 + (index * 10000),
          adjustment: 0
        })
      );
      await Promise.all(pricePromises);
      console.log('✅ Precios agregados');
    }

    // 4. Obtener pieza con precios (como lo haría el frontend)
    console.log('\n📊 Obteniendo pieza con precios...');
    const pieceWithPrices = await Piece.findByPk(testPiece.id, {
      include: [
        {
          model: PiecePrice,
          as: 'prices',
          include: [
            {
              model: Zone,
              as: 'zone',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });
    console.log('✅ Pieza con precios:', JSON.stringify(pieceWithPrices, null, 2));

    // 5. Actualizar pieza
    console.log('\n✏️ Actualizando pieza...');
    await testPiece.update({
      description: 'Viga de prueba ACTUALIZADA'
    });
    console.log('✅ Pieza actualizada');

    // 6. Listar piezas con paginación (como lo hace el frontend)
    console.log('\n📋 Listando piezas con paginación...');
    const { count, rows: pieces } = await Piece.findAndCountAll({
      where: { is_active: true },
      include: [
        {
          model: PiecePrice,
          as: 'prices',
          required: false,
          include: [
            {
              model: Zone,
              as: 'zone',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      limit: 10,
      offset: 0,
      order: [['created_at', 'DESC']],
      distinct: true
    });
    console.log(`✅ Encontradas ${count} piezas, mostrando ${pieces.length}`);

    // 7. Eliminar pieza de prueba (soft delete)
    console.log('\n🗑️ Eliminando pieza de prueba...');
    await testPiece.destroy();
    console.log('✅ Pieza eliminada (soft delete)');

    console.log('\n🎉 Todos los tests pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
  } finally {
    await sequelize.close();
    console.log('🔐 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar test
testPieceCRUD();
