'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { MapPin, Navigation, AlertTriangle, Info } from 'lucide-react';
import { PLANT_COORDINATES } from '@/lib/validations/budget-wizard';
import axios from 'axios';

interface Step3DistanceProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3Distance({ data, onUpdate, onNext, onBack }: Step3DistanceProps) {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(data.distance?.constructionAddress || '');
  const [lat, setLat] = useState(data.distance?.constructionLat || '');
  const [lng, setLng] = useState(data.distance?.constructionLng || '');
  const [realDistance, setRealDistance] = useState(data.distance?.realDistance || 0);
  const [billedDistance, setBilledDistance] = useState(data.distance?.billedDistance || 0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [mapUrl, setMapUrl] = useState('');

  const plantCoords = PLANT_COORDINATES[data.plantId?.toLowerCase() as keyof typeof PLANT_COORDINATES];

  useEffect(() => {
    if (lat && lng && plantCoords) {
      // Generar URL de mapa estático
      const origin = `${plantCoords.lat},${plantCoords.lng}`;
      const destination = `${lat},${lng}`;
      const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=600x400&markers=color:green|label:P|${origin}&markers=color:red|label:O|${destination}&path=color:0x0000ff|weight:3|${origin}|${destination}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`;
      setMapUrl(staticMapUrl);
    }
  }, [lat, lng, plantCoords]);

  const calculateDistance = async () => {
    if (!lat || !lng || !address) {
      setAlerts([{ type: 'error', message: 'Complete todos los campos de ubicación' }]);
      return;
    }

    setLoading(true);
    setAlerts([]);

    try {
      const response = await axios.post('/api/budget/distance', {
        plantId: data.plantId,
        constructionLat: parseFloat(lat),
        constructionLng: parseFloat(lng),
        useGoogleMaps: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      });

      const result = response.data;
      setRealDistance(result.realDistance);
      setBilledDistance(result.billedDistance);
      setAlerts(result.alerts || []);

      // Actualizar datos
      onUpdate({
        ...data,
        distance: {
          constructionLat: parseFloat(lat),
          constructionLng: parseFloat(lng),
          constructionAddress: address,
          realDistance: result.realDistance,
          billedDistance: result.billedDistance,
          routePolyline: result.routePolyline
        }
      });
    } catch (error) {
      console.error('Error calculating distance:', error);
      setAlerts([{ type: 'error', message: 'Error al calcular distancia' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!realDistance || !billedDistance) {
      setAlerts([{ type: 'error', message: 'Debe calcular la distancia antes de continuar' }]);
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Ubicación de la Obra
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Dirección de la obra</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Example 1234, Ciudad"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat">Latitud</Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="-31.4201"
                />
              </div>
              <div>
                <Label htmlFor="lng">Longitud</Label>
                <Input
                  id="lng"
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="-64.1888"
                />
              </div>
            </div>

            <Button 
              onClick={calculateDistance} 
              disabled={loading}
              className="w-full"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {loading ? 'Calculando...' : 'Calcular Distancia'}
            </Button>
          </div>

          <div className="space-y-4">
            {mapUrl && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 h-64 flex items-center justify-center">
                  <p className="text-gray-500">Mapa de ruta</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {realDistance > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Resultado del Cálculo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Planta Origen</p>
              <p className="font-semibold">{plantCoords?.address}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Distancia Real</p>
              <p className="text-2xl font-bold text-blue-600">{realDistance.toFixed(1)} km</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Distancia Facturada</p>
              <p className="text-2xl font-bold text-green-600">{billedDistance} km</p>
              {billedDistance > realDistance && (
                <p className="text-xs text-gray-500 mt-1">
                  Redondeado (+{(billedDistance - realDistance).toFixed(1)} km)
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-800">Regla de Redondeo</p>
                <p className="text-yellow-700">
                  Las distancias se redondean hacia arriba en intervalos de 50km para facturación.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {alerts.map((alert, index) => (
        <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
          {alert.message}
        </Alert>
      ))}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Anterior
        </Button>
        <Button onClick={handleNext} disabled={!realDistance}>
          Siguiente: Cálculo de Flete
        </Button>
      </div>
    </div>
  );
}
