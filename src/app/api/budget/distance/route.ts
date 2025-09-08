import { NextRequest, NextResponse } from 'next/server';
import { PLANT_COORDINATES, roundDistance } from '@/lib/validations/budget-wizard';

// Función para calcular distancia usando fórmula Haversine (sin API externa)
function calculateHaversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Aplicar factor de corrección para considerar rutas reales (1.3x)
  return distance * 1.3;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plantId, constructionLat, constructionLng, useGoogleMaps = false } = body;

    // Obtener coordenadas de la planta
    const plantKey = plantId.toLowerCase().replace(/\s+/g, '');
    const plantCoords = PLANT_COORDINATES[plantKey as keyof typeof PLANT_COORDINATES];
    
    if (!plantCoords) {
      return NextResponse.json(
        { error: 'Planta no encontrada' },
        { status: 400 }
      );
    }

    let realDistance: number;
    let routePolyline: string | undefined;

    if (useGoogleMaps) {
      // Si se solicita usar Google Maps (requiere API key)
      const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
      
      if (!GOOGLE_MAPS_API_KEY) {
        // Fallback a cálculo Haversine si no hay API key
        realDistance = calculateHaversineDistance(
          plantCoords.lat, plantCoords.lng,
          constructionLat, constructionLng
        );
      } else {
        // Llamar a Google Directions API
        const origin = `${plantCoords.lat},${plantCoords.lng}`;
        const destination = `${constructionLat},${constructionLng}`;
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}`;
        
        try {
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.status === 'OK' && data.routes.length > 0) {
            const route = data.routes[0];
            realDistance = route.legs[0].distance.value / 1000; // Convertir a km
            routePolyline = route.overview_polyline.points;
          } else {
            // Fallback a Haversine si falla la API
            realDistance = calculateHaversineDistance(
              plantCoords.lat, plantCoords.lng,
              constructionLat, constructionLng
            );
          }
        } catch (error) {
          // Fallback a Haversine si hay error
          realDistance = calculateHaversineDistance(
            plantCoords.lat, plantCoords.lng,
            constructionLat, constructionLng
          );
        }
      }
    } else {
      // Usar cálculo Haversine por defecto
      realDistance = calculateHaversineDistance(
        plantCoords.lat, plantCoords.lng,
        constructionLat, constructionLng
      );
    }

    // Redondear distancia según reglas de negocio
    const billedDistance = roundDistance(realDistance);

    // Validaciones y alertas
    const alerts = [];
    if (billedDistance > 1000) {
      alerts.push({
        type: 'warning',
        message: 'Distancia mayor a 1000km. El costo de flete será elevado.'
      });
    }

    // Calcular tiempo estimado de viaje
    const estimatedHours = realDistance / 60; // Asumiendo velocidad promedio 60 km/h

    return NextResponse.json({
      plantCoordinates: plantCoords,
      constructionCoordinates: {
        lat: constructionLat,
        lng: constructionLng
      },
      realDistance: Math.round(realDistance * 10) / 10, // Redondear a 1 decimal
      billedDistance,
      routePolyline,
      estimatedHours: Math.round(estimatedHours * 10) / 10,
      alerts
    });
  } catch (error) {
    console.error('Error calculating distance:', error);
    return NextResponse.json(
      { error: 'Error al calcular distancia' },
      { status: 500 }
    );
  }
}
