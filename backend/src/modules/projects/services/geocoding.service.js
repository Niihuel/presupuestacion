const fetchFn = (typeof fetch !== 'undefined') ? fetch : (...args) => import('node-fetch').then(({default: f}) => f(...args));

function parseLatLngFromIframe(iframeHtml) {
  if (!iframeHtml) return null;
  // Pattern 1: @LAT,LNG,
  let m = iframeHtml.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  // Pattern 2: !3dLAT!4dLNG
  m = iframeHtml.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  // Pattern 3: q=LAT,LNG
  m = iframeHtml.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  return null;
}

async function orsForwardGeocode(text) {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) throw new Error('ORS_API_KEY not configured');
  // Asegurar contexto país para evitar resultados fuera de Argentina
  const queryText = /argentina/i.test(text) ? text : `${text}, Argentina`;
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(queryText)}&size=1&boundary.country=AR`;
  const resp = await fetchFn(url);
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`ORS geocode error ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  const feat = data?.features?.[0];
  if (!feat?.geometry?.coordinates) return null;
  const [lng, lat] = feat.geometry.coordinates;
  return { lat: Number(lat), lng: Number(lng), raw: feat };
}

module.exports = { parseLatLngFromIframe, orsForwardGeocode };


