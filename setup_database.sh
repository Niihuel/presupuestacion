#!/bin/bash

# Script de inicialización para el sistema de presupuestación con materiales
# Ejecuta todos los scripts de base de datos necesarios

echo "🚀 Iniciando configuración del sistema de presupuestación..."

# Configuración de base de datos
DB_HOST="localhost"
DB_USER="your_username"
DB_PASSWORD="your_password"
DB_NAME="presupuestacion"

# Función para ejecutar SQL
execute_sql() {
    local file=$1
    local description=$2
    
    echo "📄 Ejecutando: $description"
    
    if [ -f "$file" ]; then
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$file"
        
        if [ $? -eq 0 ]; then
            echo "✅ $description - Completado"
        else
            echo "❌ $description - Error"
            exit 1
        fi
    else
        echo "⚠️  Archivo no encontrado: $file"
    fi
    
    echo ""
}

# 1. Ejecutar script principal de base de datos
execute_sql "scriptbd.sql" "Estructura principal de la base de datos"

# 2. Ejecutar script de materiales
execute_sql "materials_schema.sql" "Esquema de módulo de materiales"

# 3. Aplicar correcciones
execute_sql "materials_schema_fix.sql" "Correcciones del esquema de materiales"

# 4. Datos iniciales de ejemplo (opcional)
read -p "¿Desea insertar datos de ejemplo? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Insertando datos de ejemplo..."
    
    # Crear archivo temporal con datos de ejemplo
    cat > temp_sample_data.sql << EOF
-- Datos de ejemplo para el sistema de presupuestación

-- Insertar algunos materiales adicionales
INSERT IGNORE INTO materials (name, code, category, unit, description, min_stock) VALUES
('Cemento Portland', 'CEM-PORT-50', 'Aditivos', 'toneladas', 'Cemento Portland tipo 50kg', 5),
('Arena fina', 'ARE-FIN-M3', 'Otros', 'm³', 'Arena fina para mezclas', 20),
('Piedra partida 6-20', 'PIE-6-20-M3', 'Otros', 'm³', 'Piedra partida granulometría 6-20mm', 15),
('Malla electrosoldada Q188', 'MAL-Q188', 'Acero', 'm²', 'Malla electrosoldada Q188 para losas', 100),
('Gancho de izaje 2.5t', 'GAN-IZ-2.5T', 'Insertos Metálicos', 'unidades', 'Gancho de izaje capacidad 2.5 toneladas', 20);

-- Insertar proveedores para estos materiales
INSERT IGNORE INTO material_suppliers (material_id, name, contact_info, is_default) VALUES
(7, 'Cementos Avellaneda', 'Tel: 351-4567896', TRUE),
(8, 'Áridos del Centro', 'Tel: 351-4567897', TRUE),
(9, 'Áridos del Centro', 'Tel: 351-4567897', TRUE),
(10, 'Hierros y Mallas SA', 'Tel: 351-4567898', TRUE),
(11, 'Ferretería Industrial', 'Tel: 351-4567899', TRUE);

-- Insertar precios por planta (usando IDs de zonas existentes)
INSERT IGNORE INTO material_plant_prices (material_id, plant_id, price, valid_from) VALUES
-- Córdoba (ID 1)
(1, 1, 25000.00, CURDATE()),
(2, 1, 950.00, CURDATE()),
(3, 1, 1200.00, CURDATE()),
(4, 1, 85.00, CURDATE()),
(5, 1, 450.00, CURDATE()),
(6, 1, 120.00, CURDATE()),
(7, 1, 8500.00, CURDATE()),
(8, 1, 15000.00, CURDATE()),
(9, 1, 18000.00, CURDATE()),
(10, 1, 2800.00, CURDATE()),
(11, 1, 45000.00, CURDATE()),

-- Buenos Aires (ID 2) - precios ligeramente diferentes
(1, 2, 26500.00, CURDATE()),
(2, 2, 1050.00, CURDATE()),
(3, 2, 1350.00, CURDATE()),
(4, 2, 95.00, CURDATE()),
(5, 2, 480.00, CURDATE()),
(6, 2, 135.00, CURDATE()),
(7, 2, 9200.00, CURDATE()),
(8, 2, 16500.00, CURDATE()),
(9, 2, 19500.00, CURDATE()),
(10, 2, 3100.00, CURDATE()),
(11, 2, 48000.00, CURDATE()),

-- Villa María (ID 3)
(1, 3, 24500.00, CURDATE()),
(2, 3, 920.00, CURDATE()),
(3, 3, 1150.00, CURDATE()),
(4, 3, 88.00, CURDATE()),
(5, 3, 440.00, CURDATE()),
(6, 3, 115.00, CURDATE()),
(7, 3, 8200.00, CURDATE()),
(8, 3, 14500.00, CURDATE()),
(9, 3, 17500.00, CURDATE()),
(10, 3, 2700.00, CURDATE()),
(11, 3, 43000.00, CURDATE());

-- Insertar stock inicial por planta
INSERT IGNORE INTO material_plant_stock (material_id, plant_id, current_stock, last_inventory_date) VALUES
-- Córdoba
(1, 1, 50.0, CURDATE()),
(2, 1, 2000.0, CURDATE()),
(3, 1, 800.0, CURDATE()),
(4, 1, 150.0, CURDATE()),
(5, 1, 300.0, CURDATE()),
(6, 1, 80.0, CURDATE()),
(7, 1, 10.0, CURDATE()),
(8, 1, 100.0, CURDATE()),
(9, 1, 80.0, CURDATE()),
(10, 1, 200.0, CURDATE()),
(11, 1, 50.0, CURDATE()),

-- Buenos Aires
(1, 2, 35.0, CURDATE()),
(2, 2, 1500.0, CURDATE()),
(3, 2, 600.0, CURDATE()),
(4, 2, 120.0, CURDATE()),
(5, 2, 250.0, CURDATE()),
(6, 2, 60.0, CURDATE()),
(7, 2, 8.0, CURDATE()),
(8, 2, 80.0, CURDATE()),
(9, 2, 60.0, CURDATE()),
(10, 2, 150.0, CURDATE()),
(11, 2, 30.0, CURDATE()),

-- Villa María
(1, 3, 45.0, CURDATE()),
(2, 3, 1800.0, CURDATE()),
(3, 3, 750.0, CURDATE()),
(4, 3, 140.0, CURDATE()),
(5, 3, 280.0, CURDATE()),
(6, 3, 70.0, CURDATE()),
(7, 3, 12.0, CURDATE()),
(8, 3, 90.0, CURDATE()),
(9, 3, 70.0, CURDATE()),
(10, 3, 180.0, CURDATE()),
(11, 3, 40.0, CURDATE());

-- Fórmulas de ejemplo para piezas (asumiendo que existen piezas con IDs 1, 2, 3)
-- Fórmula para Viga I 80 (supongamos ID 1)
INSERT IGNORE INTO piece_material_formulas (piece_id, material_id, quantity_per_unit, waste_factor, notes) VALUES
(1, 1, 0.85, 1.05, 'Hormigón estructural para viga'),
(1, 2, 65.0, 1.02, 'Acero principal de pretensado'),
(1, 4, 4.0, 1.10, 'Insertos para conexiones'),
(1, 7, 0.12, 1.00, 'Cemento adicional para acabados');

-- Fórmula para Panel TT 30 (supongamos ID 2)
INSERT IGNORE INTO piece_material_formulas (piece_id, material_id, quantity_per_unit, waste_factor, notes) VALUES
(2, 1, 1.20, 1.05, 'Hormigón para panel prefabricado'),
(2, 2, 45.0, 1.02, 'Acero de refuerzo longitudinal'),
(2, 3, 12.0, 1.03, 'Alambre de pretensado transversal'),
(2, 10, 8.5, 1.00, 'Malla de distribución');

-- Fórmula para Columna 40x50 (supongamos ID 3)
INSERT IGNORE INTO piece_material_formulas (piece_id, material_id, quantity_per_unit, waste_factor, notes) VALUES
(3, 1, 0.95, 1.05, 'Hormigón estructural H30'),
(3, 2, 85.0, 1.02, 'Acero longitudinal ADN 420'),
(3, 4, 6.0, 1.10, 'Insertos de conexión superior e inferior'),
(3, 11, 2.0, 1.00, 'Ganchos de montaje');
EOF

    execute_sql "temp_sample_data.sql" "Datos de ejemplo"
    rm temp_sample_data.sql
fi

echo ""
echo "🎉 ¡Configuración completada exitosamente!"
echo ""
echo "📋 Resumen de lo que se configuró:"
echo "   ✅ Estructura principal de base de datos"
echo "   ✅ Módulo de materiales con stock y precios por planta"
echo "   ✅ Fórmulas de materiales por pieza"
echo "   ✅ Vistas optimizadas para consultas"
echo "   ✅ Triggers automáticos para historial"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   ✅ Datos de ejemplo insertados"
fi
echo ""
echo "🚀 El sistema está listo para usar!"
echo ""
echo "📌 Próximos pasos:"
echo "   1. Configurar las variables de entorno del backend"
echo "   2. Instalar dependencias: npm install"
echo "   3. Iniciar el servidor: npm run dev"
echo "   4. Acceder a la aplicación y verificar el funcionamiento"
echo ""
echo "💡 Consejos importantes:"
echo "   - Revisar y ajustar los precios de materiales según tu región"
echo "   - Configurar las fórmulas de materiales para tus piezas específicas"
echo "   - Verificar que las plantas/zonas correspondan a tu configuración"
echo ""
