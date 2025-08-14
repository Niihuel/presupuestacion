#!/bin/bash

# Script para remover líneas @author y @version de archivos JavaScript/JSX

echo "Iniciando limpieza de líneas @author y @version..."

# Encontrar todos los archivos .js y .jsx
find /c/Users/AuxSistemas/Presupuestacion/frontend/src -name "*.js" -o -name "*.jsx" | while read file; do
    if grep -q "@author\|@version" "$file"; then
        echo "Limpiando: $file"
        
        # Remover líneas que contienen @author y @version
        sed -i '/@author/d' "$file"
        sed -i '/@version/d' "$file"
        
        # Remover líneas vacías adicionales que puedan quedar después de los comentarios
        # Solo si están dentro de un bloque de comentarios JSDoc
        sed -i '/^\s*\*\s*$/N; /^\s*\*\s*\n\s*\*\//d' "$file"
    fi
done

echo "Limpieza completada."
echo "Verificando si quedan archivos con @author o @version..."

remaining=$(find /c/Users/AuxSistemas/Presupuestacion/frontend/src -name "*.js" -o -name "*.jsx" | xargs grep -l "@author\|@version" 2>/dev/null | wc -l)
echo "Archivos restantes con @author/@version: $remaining"
