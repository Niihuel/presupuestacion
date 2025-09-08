import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const autosaveSchema = z.object({
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  plantId: z.string().optional(),
  pieces: z.array(z.any()).optional(),
  distance: z.any().optional(),
  freight: z.any().optional(),
  additionals: z.any().optional(),
  summary: z.any().optional(),
  currentStep: z.number(),
  resumeToken: z.string().optional()
});

// Almacenamiento temporal en memoria (en producción usar Redis o DB)
const tempStorage = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = autosaveSchema.parse(body);

    // Generar o usar token existente
    const resumeToken = data.resumeToken || nanoid(12);
    
    // Agregar timestamp
    const savedData = {
      ...data,
      resumeToken,
      lastSaved: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };

    // Guardar en almacenamiento temporal
    tempStorage.set(resumeToken, savedData);

    return NextResponse.json({
      success: true,
      resumeToken,
      lastSaved: savedData.lastSaved,
      message: 'Presupuesto guardado automáticamente'
    });

  } catch (error) {
    console.error('Error in autosave:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resumeToken = searchParams.get('resumeToken');

    if (!resumeToken) {
      return NextResponse.json(
        { error: 'Token de recuperación requerido' },
        { status: 400 }
      );
    }

    const savedData = tempStorage.get(resumeToken);
    
    if (!savedData) {
      return NextResponse.json(
        { error: 'Sesión no encontrada o expirada' },
        { status: 404 }
      );
    }

    // Verificar si no ha expirado
    if (new Date() > new Date(savedData.expiresAt)) {
      tempStorage.delete(resumeToken);
      return NextResponse.json(
        { error: 'Sesión expirada' },
        { status: 410 }
      );
    }

    return NextResponse.json(savedData);

  } catch (error) {
    console.error('Error retrieving autosave:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
