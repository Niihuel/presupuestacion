// src/services/cache.service.js
// Servicio simple de cache y utilidades de limpieza

const caches = new Map();

/**
 * Registra un cache con un nombre y una función de limpieza
 * @param {string} name
 * @param {() => Promise<void>|void} clearFn
 */
function registerCache(name, clearFn) {
  if (!name || typeof clearFn !== 'function') return;
  caches.set(name, clearFn);
}

/**
 * Limpia un cache por nombre
 */
async function clearNamedCache(name) {
  const fn = caches.get(name);
  if (!fn) return { name, cleared: false, error: 'Cache no registrado' };
  try {
    await fn();
    return { name, cleared: true };
  } catch (error) {
    return { name, cleared: false, error: error.message };
  }
}

/**
 * Limpia todos los caches registrados
 */
async function clearAllCaches() {
  const results = [];
  for (const [name, fn] of caches.entries()) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await fn();
      results.push({ name, cleared: true });
    } catch (error) {
      results.push({ name, cleared: false, error: error.message });
    }
  }
  return results;
}

// Cache en memoria básico de ejemplo
const memoryCache = new Map();
registerCache('memory', async () => memoryCache.clear());

module.exports = {
  registerCache,
  clearNamedCache,
  clearAllCaches,
  memoryCache
};


