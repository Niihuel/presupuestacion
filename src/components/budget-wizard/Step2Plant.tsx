'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Building2, Package, Plus, Minus, Search, Info } from 'lucide-react';
import axios from 'axios';

interface Step2PlantProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

interface SelectedPiece {
  pieceId: string;
  piece?: any;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  calculationBreakdown?: any;
}

export default function Step2Plant({ data, onUpdate, onNext, onBack }: Step2PlantProps) {
  const [plants, setPlants] = useState<any[]>([]);
  const [pieces, setPieces] = useState<any[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState(data.plantId || '');
  const [selectedPieces, setSelectedPieces] = useState<SelectedPiece[]>(data.pieces || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('all');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [calculatingCosts, setCalculatingCosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPlants();
    loadPieces();
  }, []);

  const loadPlants = async () => {
    try {
      // Simulación de plantas disponibles
      setPlants([
        { 
          id: 'cordoba', 
          name: 'Planta Córdoba', 
          address: 'Ruta 9 Km 695, Córdoba',
          capacity: 'Alta',
          specialties: ['Estructuras pesadas', 'Naves industriales']
        },
        { 
          id: 'buenosaires', 
          name: 'Planta Buenos Aires', 
          address: 'Parque Industrial Pilar, Buenos Aires',
          capacity: 'Media',
          specialties: ['Estructuras livianas', 'Galpones']
        },
        { 
          id: 'rosario', 
          name: 'Planta Rosario', 
          address: 'Zona Franca, Rosario',
          capacity: 'Alta',
          specialties: ['Puentes', 'Torres']
        }
      ]);
    } catch (error) {
      console.error('Error loading plants:', error);
    }
  };

  const loadPieces = async () => {
    try {
      const response = await axios.get('/api/pieces');
      const piecesData = response.data || [];
      
      // Transform pieces data to match expected format
      const transformedPieces = piecesData.map((piece: any) => ({
        id: piece.id,
        name: piece.description,
        family: piece.family?.description || 'general',
        weight: piece.weight || 0,
        length: piece.length || 0,
        height: piece.height || 0,
        width: piece.width || 0,
        volume: piece.volume || 0,
        cost: 0, // Will be calculated dynamically
        description: piece.description,
        individualTransport: piece.individualTransport || false,
        piecesPerTruck: piece.piecesPerTruck || null,
        materials: piece.materials || [],
        familyId: piece.familyId
      }));
      
      setPieces(transformedPieces);
    } catch (error) {
      console.error('Error loading pieces:', error);
      setPieces([]);
    }
  };

  const filteredPieces = pieces.filter(piece => {
    const matchesSearch = piece.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          piece.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFamily = selectedFamily === 'all' || piece.family === selectedFamily;
    return matchesSearch && matchesFamily;
  });

  const families = Array.from(new Set(pieces.map(p => p.family))).filter(Boolean);

  const calculatePieceRealCost = async (pieceId: string, quantity: number = 1) => {
    try {
      setCalculatingCosts(prev => new Set(prev).add(pieceId));
      
      const response = await axios.post('/api/cost-calculation', {
        pieceId,
        quantity,
        baseMonth: 7,
        baseYear: 2025,
        targetMonth: 8,
        targetYear: 2025
      });
      
      if (response.data) {
        return {
          unitCost: response.data.finalCostPerUnit || 0,
          totalCost: response.data.finalTotal || 0,
          breakdown: response.data
        };
      }
    } catch (error) {
      console.error(`Error calculating cost for piece ${pieceId}:`, error);
      return { unitCost: 0, totalCost: 0, breakdown: null };
    } finally {
      setCalculatingCosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(pieceId);
        return newSet;
      });
    }
    return { unitCost: 0, totalCost: 0, breakdown: null };
  };

  const addPiece = async (piece: any) => {
    const existing = selectedPieces.find(p => p.pieceId === piece.id);
    if (existing) {
      await updateQuantity(piece.id, existing.quantity + 1);
    } else {
      // Calculate real cost for new piece
      const costData = await calculatePieceRealCost(piece.id, 1);
      
      setSelectedPieces([...selectedPieces, { 
        pieceId: piece.id, 
        piece,
        quantity: 1,
        unitCost: costData.unitCost,
        totalCost: costData.totalCost,
        calculationBreakdown: costData.breakdown
      }]);
    }
  };

  const updateQuantity = async (pieceId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedPieces(selectedPieces.filter(p => p.pieceId !== pieceId));
    } else {
      // Recalculate cost for new quantity
      const costData = await calculatePieceRealCost(pieceId, quantity);
      
      setSelectedPieces(selectedPieces.map(p => 
        p.pieceId === pieceId ? { 
          ...p, 
          quantity,
          unitCost: costData.unitCost,
          totalCost: costData.totalCost,
          calculationBreakdown: costData.breakdown
        } : p
      ));
    }
  };

  const removePiece = (pieceId: string) => {
    setSelectedPieces(selectedPieces.filter(p => p.pieceId !== pieceId));
  };

  const getTotalWeight = () => {
    return selectedPieces.reduce((sum, item) => 
      sum + (item.piece?.weight || 0) * item.quantity, 0
    );
  };

  const getTotalCost = () => {
    return selectedPieces.reduce((sum, item) => 
      sum + (item.totalCost || 0), 0
    );
  };

  const getTotalPieces = () => {
    return selectedPieces.reduce((sum, item) => sum + item.quantity, 0);
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!selectedPlantId) {
      newErrors.plant = 'Debe seleccionar una planta';
    }

    if (selectedPieces.length === 0) {
      newErrors.pieces = 'Debe seleccionar al menos una pieza';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) return;

    onUpdate({
      plantId: selectedPlantId,
      plant: plants.find(p => p.id === selectedPlantId),
      pieces: selectedPieces
    });

    onNext();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Selección de Planta */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Planta de Producción
        </h3>

        <div className="space-y-4">
          <div>
            <Label>Seleccione la planta</Label>
            <Select value={selectedPlantId} onValueChange={setSelectedPlantId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una planta" />
              </SelectTrigger>
              <SelectContent>
                {plants.map(plant => (
                  <SelectItem key={plant.id} value={plant.id}>
                    <div>
                      <p className="font-medium">{plant.name}</p>
                      <p className="text-sm text-gray-600">{plant.address}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.plant && (
              <p className="text-sm text-red-500 mt-1">{errors.plant}</p>
            )}
          </div>

          {selectedPlantId && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">
                    {plants.find(p => p.id === selectedPlantId)?.name}
                  </p>
                  <p className="text-sm text-blue-700">
                    Capacidad: {plants.find(p => p.id === selectedPlantId)?.capacity}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {plants.find(p => p.id === selectedPlantId)?.specialties.map((specialty: string) => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Selección de Piezas */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Selección de Piezas
        </h3>

        {/* Filtros */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar piezas..."
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedFamily} onValueChange={setSelectedFamily}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las familias</SelectItem>
              {families.map(family => (
                <SelectItem key={family} value={family}>
                  {family.charAt(0).toUpperCase() + family.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de piezas disponibles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {filteredPieces.map(piece => {
            const selected = selectedPieces.find(p => p.pieceId === piece.id);
            return (
              <div 
                key={piece.id} 
                className={`border rounded-lg p-4 transition-all ${
                  selected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{piece.name}</h4>
                    <p className="text-sm text-gray-600">{piece.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Peso: {piece.weight}t</span>
                      <span>Largo: {piece.length}m</span>
                      {calculatingCosts.has(piece.id) ? (
                        <span className="text-blue-600">Calculando...</span>
                      ) : (
                        <span className="text-green-600 font-semibold">
                          {selectedPieces.find(p => p.pieceId === piece.id)?.unitCost 
                            ? formatCurrency(selectedPieces.find(p => p.pieceId === piece.id)?.unitCost || 0)
                            : 'Costo real'
                          }
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selected ? (
                      <>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(piece.id, selected.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center font-semibold">
                          {selected.quantity}
                        </span>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(piece.id, selected.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="h-8 px-3"
                        onClick={() => addPiece(piece)}
                        disabled={calculatingCosts.has(piece.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {calculatingCosts.has(piece.id) ? 'Calculando...' : 'Agregar'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {errors.pieces && (
          <Alert variant="destructive" className="mt-4">
            {errors.pieces}
          </Alert>
        )}
      </Card>

      {/* Resumen de selección */}
      {selectedPieces.length > 0 && (
        <Card className="p-6 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Resumen de Selección</h3>
          
          <div className="space-y-2 mb-4">
            {selectedPieces.map(item => (
              <div key={item.pieceId} className="flex justify-between items-center p-2 bg-white rounded">
                <div className="flex-1">
                  <span className="font-medium">{item.piece?.name}</span>
                  <span className="text-sm text-gray-600 ml-2">x{item.quantity}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(item.totalCost || 0)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(item.unitCost || 0)} c/u
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => removePiece(item.pieceId)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Total de piezas:</span>
              <span className="font-semibold">{getTotalPieces()}</span>
            </div>
            <div className="flex justify-between">
              <span>Peso total:</span>
              <span className="font-semibold">{getTotalWeight().toFixed(2)} toneladas</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Costo total estimado:</span>
              <span className="text-green-600">{formatCurrency(getTotalCost())}</span>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              * Cálculo con sistema PRETENSA (3 capas + flete)
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Anterior
        </Button>
        <Button 
          onClick={handleNext}
          disabled={selectedPieces.length === 0}
        >
          Siguiente: Cálculo de Distancia
        </Button>
      </div>
    </div>
  );
}
