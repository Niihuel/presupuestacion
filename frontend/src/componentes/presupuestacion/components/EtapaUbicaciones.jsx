import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Navigation, Building2, DollarSign } from 'lucide-react';
import { zoneService, projectService, quotationService } from '@compartido/servicios';
import api from '@compartido/services/api';

const EtapaUbicaciones = ({ data, onChange }) => {
  const [distanceKm, setDistanceKm] = useState(data?.distance_km || data?.distance_from_cba || 0);
  const [project, setProject] = useState(null);
  const [plant, setPlant] = useState(null);
  const [originCoords, setOriginCoords] = useState(null); // planta
  const [destCoords, setDestCoords] = useState(null); // obra
  const [transportCost, setTransportCost] = useState(null);
  const [mountingCost, setMountingCost] = useState(null);

  useEffect(() => {
    onChange({ distance_km: Number(distanceKm) || 0 });
  }, [distanceKm]);

  useEffect(() => {
    const load = async () => {
      try {
        if (data?.project_id) {
          const res = await projectService.getProject(data.project_id);
          setProject(res?.data || res);
        }
        if (data?.production_zone_id) {
          const zr = await zoneService.getZone(data.production_zone_id);
          setPlant(zr?.data || zr);
        }
      } catch (_) {}
    };
    load();
  }, [data?.project_id, data?.production_zone_id]);

  const canAutoRoute = !!(((plant?.latitude && plant?.longitude) || plant?.address) &&
    ((project?.latitude && project?.longitude) || project?.location_iframe || project?.city));

  const autoRoute = async () => {
    try {
      let origin = originCoords;
      let destination = destCoords;
      // Resolver origen si falta
      if (!origin) {
        if (plant?.latitude && plant?.longitude) {
          origin = { lat: Number(plant.latitude), lng: Number(plant.longitude) };
        } else if (plant?.address) {
          const geoO = await api.post('/projects/geocode', { address: plant.address });
          const og = geoO?.data?.data;
          if (og?.lat && og?.lng) origin = { lat: Number(og.lat), lng: Number(og.lng) };
        }
      }
      // Resolver destino si falta
      if (!destination) {
        if (project?.latitude && project?.longitude) {
          destination = { lat: Number(project.latitude), lng: Number(project.longitude) };
        } else if (project?.location_iframe || project?.city) {
          const geo = await api.post('/projects/geocode', { iframe: project?.location_iframe, address: project?.city });
          const g = geo?.data?.data;
          if (g?.lat && g?.lng) destination = { lat: Number(g.lat), lng: Number(g.lng) };
        }
      }
      if (!origin?.lat || !origin?.lng || !destination) return;
      setOriginCoords(origin);
      setDestCoords(destination);
      const { data: resp } = await api.post('/zones/routing/distance', {
        origin,
        destination,
        vehicle: { height: 4.7, length: 28, width: 2.6, weight: 48000, axleload: 11000 }
      });
      setDistanceKm(Number(resp?.data?.distance_km || 0).toFixed(2));
      // Intentar obtener costo de transporte si existe id de cotización
      const quotationId = data?.quotation_id || data?.id;
      if (quotationId) {
        try {
          const calc = await quotationService.calculateQuotation(quotationId, { distanceKm: Number(resp?.data?.distance_km || 0) });
          const t = calc?.transport?.total;
          const m = calc?.mounting?.total;
          if (t != null) setTransportCost(Math.round(t));
          if (m != null) setMountingCost(Math.round(m));
        } catch (_) {}
      }
    } catch (e) {
      // silencioso
    }
  };

  // Intentar resolver coordenadas en segundo plano para vista previa
  useEffect(() => {
    const resolve = async () => {
      try {
        if (!originCoords) {
          if (plant?.latitude && plant?.longitude) {
            setOriginCoords({ lat: Number(plant.latitude), lng: Number(plant.longitude) });
          } else if (plant?.address) {
            const res = await api.post('/projects/geocode', { address: `${plant.address}, Argentina` });
            const g = res?.data?.data;
            if (g?.lat && g?.lng) setOriginCoords({ lat: Number(g.lat), lng: Number(g.lng) });
          }
        }
        if (!destCoords) {
          if (project?.latitude && project?.longitude) {
            setDestCoords({ lat: Number(project.latitude), lng: Number(project.longitude) });
          } else if (project?.location_iframe || project?.city) {
            const res = await api.post('/projects/geocode', { iframe: project?.location_iframe, address: `${project?.city || ''} Argentina` });
            const g = res?.data?.data;
            if (g?.lat && g?.lng) setDestCoords({ lat: Number(g.lat), lng: Number(g.lng) });
          }
        }
      } catch (_) {}
    };
    resolve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plant?.latitude, plant?.longitude, plant?.address, project?.latitude, project?.longitude, project?.location_iframe, project?.city]);

  const orsMapUrl = useMemo(() => {
    if (!originCoords || !destCoords) return '';
    const inRange = (x, min, max) => Number.isFinite(x) && x >= min && x <= max;
    const { lng: olon, lat: olat } = originCoords;
    const { lng: dlon, lat: dlat } = destCoords;
    if (!inRange(olat, -90, 90) || !inRange(olon, -180, 180) || !inRange(dlat, -90, 90) || !inRange(dlon, -180, 180)) {
      return '';
    }
    const o = `${olon},${olat}`;
    const d = `${dlon},${dlat}`;
    // Formato correcto para el visor ORS: /directions/<lon,lat>/<lon,lat>/<profile>
    return `https://maps.openrouteservice.org/#/directions/${o}/${d}/driving-hgv`;
  }, [originCoords, destCoords]);

  // Calcular distancia automáticamente cuando ya tenemos ambas coordenadas
  const lastComputedRef = useRef('');
  useEffect(() => {
    const key = originCoords && destCoords ? `${originCoords.lng},${originCoords.lat}|${destCoords.lng},${destCoords.lat}` : '';
    if (key && key !== lastComputedRef.current) {
      lastComputedRef.current = key;
      autoRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originCoords, destCoords]);

  // Sincronizar transporte estimado al formData
  useEffect(() => {
    if (transportCost != null) {
      onChange({ transport_cost: transportCost });
    }
  }, [transportCost]);

  // Sincronizar montaje estimado al formData
  useEffect(() => {
    if (mountingCost != null) {
      onChange({ mounting_cost: mountingCost });
    }
  }, [mountingCost]);

  // Si el usuario edita la distancia manualmente, recalcular transporte (si hay ID de presupuesto)
  useEffect(() => {
    const quotationId = data?.quotation_id || data?.id;
    const km = Number(distanceKm);
    if (!quotationId || !km || Number.isNaN(km)) return;
    const t = setTimeout(async () => {
      try {
        const calc = await quotationService.calculateQuotation(quotationId, { distanceKm: km });
        const tcost = calc?.transport?.total;
        const mcost = calc?.mounting?.total;
        if (tcost != null) setTransportCost(Math.round(tcost));
        if (mcost != null) setMountingCost(Math.round(mcost));
      } catch (_) {}
    }, 500);
    return () => clearTimeout(t);
  }, [distanceKm, data?.quotation_id, data?.id]);

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-2">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          Ubicaciones para cálculo de distancia
        </h3>
        <p className="text-sm text-gray-600">
          Se utilizará la distancia entre la planta y la obra para los cálculos de transporte y montaje.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-green-600" /> Obra
          </h4>
          <div className="text-sm text-gray-700">
            <div><span className="font-medium">Nombre:</span> {project?.name || '-'}</div>
            <div><span className="font-medium">Ciudad:</span> {project?.city || project?.locality || '-'}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-600" /> Planta/Producción
          </h4>
          <div className="text-sm text-gray-700">
            <div><span className="font-medium">Zona:</span> {plant?.name || '-'}</div>
            <div><span className="font-medium">Dirección:</span> {plant?.address || '-'}</div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-blue-900 mb-1">Distancia estimada (km)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={distanceKm}
          onChange={(e) => setDistanceKm(e.target.value)}
          className="w-48 px-3 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {canAutoRoute && (
          <button
            type="button"
            onClick={autoRoute}
            className="ml-3 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Calcular por carretera (camión)
          </button>
        )}
        <p className="text-xs text-blue-700 mt-2">
          Nota: puedes pegar aquí la distancia devuelta por Google Maps (ida). Para traslado de grúa se asume ida y vuelta.
        </p>

        {orsMapUrl ? (
          <div className="mt-4">
            <iframe
              title="Ruta camión"
              src={orsMapUrl}
              width="100%"
              height="540"
              frameBorder="0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
            {(transportCost != null || mountingCost != null) && (
              <div className="mt-3 flex flex-wrap gap-3">
                {transportCost != null && (
                  <div className="px-4 py-2 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded">
                    <DollarSign className="w-4 h-4 text-green-700" />
                    <span className="text-sm text-green-800">Transporte estimado:</span>
                    <span className="font-semibold text-green-900">${transportCost.toLocaleString()}</span>
                  </div>
                )}
                {mountingCost != null && (
                  <div className="px-4 py-2 inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded">
                    <DollarSign className="w-4 h-4 text-purple-700" />
                    <span className="text-sm text-purple-800">Montaje estimado:</span>
                    <span className="font-semibold text-purple-900">${mountingCost.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 text-xs text-gray-500">
            Vista previa de ruta no disponible. Complete la dirección o iframe de la obra y asegúrese de que la planta tenga coordenadas o dirección.
          </div>
        )}
      </div>
    </div>
  );
};

export default EtapaUbicaciones;


