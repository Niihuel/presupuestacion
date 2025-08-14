const fetchFn = (typeof fetch !== 'undefined') ? fetch : (...args) => import('node-fetch').then(({default: f}) => f(...args));

/**
 * Calcula la distancia por carretera usando OpenRouteService
 * Admite perfiles de camión para exceso de altura/longitud via parámetros
 * @param {{lat:number,lng:number}} origin
 * @param {{lat:number,lng:number}} destination
 * @param {{height?:number,width?:number,length?:number,weight?:number,axleload?:number}} vehicle
 * @returns {Promise<{distance_km:number,duration_min:number,raw:any}>}
 */
async function orsDistance(origin, destination, vehicle = {}) {
  const apiKey = process.env.ORS_API_KEY || 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijk2NjI5MDg4ZDQxNDQ5YTA4ZDMwZGZiNTUyN2I3ZDY2IiwiaCI6Im11cm11cjY0In0=';
  if (!apiKey) throw new Error('ORS_API_KEY not configured');

  // Usamos el perfil driving-hgv (camión pesado) en ORS v9+
  const url = 'https://api.openrouteservice.org/v2/directions/driving-hgv/json';
  const body = {
    coordinates: [
      [origin.lng, origin.lat],
      [destination.lng, destination.lat]
    ],
    preference: 'fastest',
    extra_info: ['waycategory', 'surface'],
    options: {
      profile_params: {
        restrictions: {
          height: vehicle.height || 4.5,
          width: vehicle.width || 2.6,
          length: vehicle.length || 25.5,
          weight: vehicle.weight || 42000,
          axleload: vehicle.axleload || 10000
        }
      }
    }
  };

  const resp = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`ORS error ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  const summary = data?.routes?.[0]?.summary;
  const distance_km = summary ? (summary.distance / 1000) : 0;
  const duration_min = summary ? (summary.duration / 60) : 0;
  return { distance_km, duration_min, raw: data };
}

module.exports = { orsDistance };


