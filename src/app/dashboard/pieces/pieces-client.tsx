'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface Material {
  id: string;
  name: string;
  unit: string;
  category: string;
}

interface PieceFamily {
  id: string;
  description: string;
}

interface Plant {
  id: string;
  name: string;
}

interface PieceMaterial {
  id: string;
  materialId: string;
  quantity: number;
  scrap: number;
  material: Material;
}

interface Piece {
  id: string;
  description: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  volume?: number;
  unitMeasure?: string;
  family: {
    id: string;
    description: string;
  };
  plant?: {
    id: string;
    name: string;
  };
  materials: PieceMaterial[];
}

interface MaterialFormRow {
  materialId: string;
  quantity: number;
  scrap: number;
}

export default function PiecesClient() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [families, setFamilies] = useState<PieceFamily[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [editingPiece, setEditingPiece] = useState<Piece | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    familyId: '',
    plantId: '',
    description: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    volume: '',
    unitMeasure: '',
    concreteType: '',
    steelQuantity: '',
    productionTime: '',
    requiresEscort: false,
    allowsOptional: false,
    individualTransport: false,
    piecesPerTruck: '',
    maxStackable: '',
    specialHandling: '',
  });

  const [materialRows, setMaterialRows] = useState<MaterialFormRow[]>([
    { materialId: '', quantity: 0, scrap: 0 }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [piecesRes, materialsRes, familiesRes, plantsRes] = await Promise.all([
        fetch('/api/pieces'),
        fetch('/api/materials'),
        fetch('/api/piece-families'),
        fetch('/api/plants')
      ]);

      if (piecesRes.ok && materialsRes.ok && familiesRes.ok && plantsRes.ok) {
        const [piecesData, materialsData, familiesData, plantsData] = await Promise.all([
          piecesRes.json(),
          materialsRes.json(),
          familiesRes.json(),
          plantsRes.json()
        ]);

        setPieces(piecesData);
        setMaterials(materialsData);
        setFamilies(familiesData);
        setPlants(plantsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Filter out empty material rows
    const validMaterials = materialRows.filter(row => 
      row.materialId && row.quantity > 0
    );

    if (validMaterials.length === 0) {
      toast.error('Debe agregar al menos un material');
      setLoading(false);
      return;
    }

    try {
      const pieceData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        length: formData.length ? parseFloat(formData.length) : null,
        width: formData.width ? parseFloat(formData.width) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        volume: formData.volume ? parseFloat(formData.volume) : null,
        steelQuantity: formData.steelQuantity ? parseFloat(formData.steelQuantity) : null,
        productionTime: formData.productionTime ? parseInt(formData.productionTime) : null,
        piecesPerTruck: formData.piecesPerTruck ? parseInt(formData.piecesPerTruck) : null,
        maxStackable: formData.maxStackable ? parseInt(formData.maxStackable) : null,
        materials: validMaterials
      };

      const url = editingPiece ? `/api/pieces/${editingPiece.id}` : '/api/pieces';
      const method = editingPiece ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pieceData),
      });

      if (response.ok) {
        toast.success(editingPiece ? 'Pieza actualizada' : 'Pieza creada');
        loadData();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (piece: Piece) => {
    setEditingPiece(piece);
    setFormData({
      familyId: piece.family.id,
      plantId: piece.plant?.id || '',
      description: piece.description,
      weight: piece.weight?.toString() || '',
      length: piece.length?.toString() || '',
      width: piece.width?.toString() || '',
      height: piece.height?.toString() || '',
      volume: piece.volume?.toString() || '',
      unitMeasure: piece.unitMeasure || '',
      concreteType: '',
      steelQuantity: '',
      productionTime: '',
      requiresEscort: false,
      allowsOptional: false,
      individualTransport: false,
      piecesPerTruck: '',
      maxStackable: '',
      specialHandling: '',
    });

    // Load existing materials
    setMaterialRows(
      piece.materials.length > 0 
        ? piece.materials.map(pm => ({
            materialId: pm.materialId,
            quantity: pm.quantity,
            scrap: pm.scrap
          }))
        : [{ materialId: '', quantity: 0, scrap: 0 }]
    );

    setShowModal(true);
  };

  const resetForm = () => {
    setEditingPiece(null);
    setShowModal(false);
    setFormData({
      familyId: '',
      plantId: '',
      description: '',
      weight: '',
      length: '',
      width: '',
      height: '',
      volume: '',
      unitMeasure: '',
      concreteType: '',
      steelQuantity: '',
      productionTime: '',
      requiresEscort: false,
      allowsOptional: false,
      individualTransport: false,
      piecesPerTruck: '',
      maxStackable: '',
      specialHandling: '',
    });
    setMaterialRows([{ materialId: '', quantity: 0, scrap: 0 }]);
  };

  const addMaterialRow = () => {
    setMaterialRows([...materialRows, { materialId: '', quantity: 0, scrap: 0 }]);
  };

  const removeMaterialRow = (index: number) => {
    if (materialRows.length > 1) {
      setMaterialRows(materialRows.filter((_, i) => i !== index));
    }
  };

  const updateMaterialRow = (index: number, field: keyof MaterialFormRow, value: string | number) => {
    const updated = [...materialRows];
    updated[index] = { ...updated[index], [field]: value };
    setMaterialRows(updated);
  };

  const filteredPieces = pieces.filter(piece =>
    piece.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    piece.family.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && pieces.length === 0) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Piezas</h1>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Pieza
        </Button>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPiece ? 'Editar Pieza' : 'Nueva Pieza'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="familyId">Familia de Pieza *</Label>
                  <Select value={formData.familyId} onValueChange={(value) => setFormData({ ...formData, familyId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar familia" />
                    </SelectTrigger>
                    <SelectContent>
                      {families.map((family) => (
                        <SelectItem key={family.id} value={family.id}>
                          {family.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="plantId">Planta</Label>
                  <Select value={formData.plantId} onValueChange={(value) => setFormData({ ...formData, plantId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar planta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      {plants.map((plant) => (
                        <SelectItem key={plant.id} value={plant.id}>
                          {plant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Descripción *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="unitMeasure">Unidad de Medida</Label>
                  <Select value={formData.unitMeasure} onValueChange={(value) => setFormData({ ...formData, unitMeasure: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">Metro</SelectItem>
                      <SelectItem value="m2">Metro Cuadrado</SelectItem>
                      <SelectItem value="m3">Metro Cúbico</SelectItem>
                      <SelectItem value="un">Unidad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="length">Longitud (m)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.01"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="width">Ancho (m)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.01"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="height">Alto (m)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.01"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="volume">Volumen (m³)</Label>
                  <Input
                    id="volume"
                    type="number"
                    step="0.001"
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                  />
                </div>
              </div>

              {/* Material Formula Section */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Fórmula de Materiales (BOM)</h3>
                  <Button type="button" onClick={addMaterialRow} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Material
                  </Button>
                </div>

                <div className="space-y-3">
                  {materialRows.map((row, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6">
                        <Label>Material</Label>
                        <Select 
                          value={row.materialId} 
                          onValueChange={(value) => updateMaterialRow(index, 'materialId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((material) => (
                              <SelectItem key={material.id} value={material.id}>
                                {material.name} ({material.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-2">
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          value={row.quantity}
                          onChange={(e) => updateMaterialRow(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="col-span-2">
                        <Label>Scrap %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={row.scrap}
                          onChange={(e) => updateMaterialRow(index, 'scrap', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="col-span-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeMaterialRow(index)}
                          disabled={materialRows.length === 1}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingPiece ? 'Actualizar' : 'Crear'} Pieza
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Buscar piezas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Pieces List */}
      <div className="grid gap-4">
        {filteredPieces.map((piece) => (
          <Card key={piece.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  <div>
                    <h3 className="font-semibold">{piece.description}</h3>
                    <p className="text-sm text-muted-foreground">
                      Familia: {piece.family.description}
                    </p>
                    {piece.plant && (
                      <p className="text-sm text-muted-foreground">
                        Planta: {piece.plant.name}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    {piece.weight && (
                      <p className="text-sm">
                        <span className="font-medium">Peso:</span> {piece.weight} kg
                      </p>
                    )}
                    {piece.length && (
                      <p className="text-sm">
                        <span className="font-medium">Dimensiones:</span> {piece.length}m
                        {piece.width && ` × ${piece.width}m`}
                        {piece.height && ` × ${piece.height}m`}
                      </p>
                    )}
                    {piece.volume && (
                      <p className="text-sm">
                        <span className="font-medium">Volumen:</span> {piece.volume} m³
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Materiales ({piece.materials.length}):</p>
                    <div className="space-y-1">
                      {piece.materials.slice(0, 3).map((pm) => (
                        <Badge key={pm.id} variant="secondary" className="text-xs">
                          {pm.material.name}: {pm.quantity}{pm.material.unit}
                        </Badge>
                      ))}
                      {piece.materials.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{piece.materials.length - 3} más
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(piece)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPieces.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? 'No se encontraron piezas que coincidan con la búsqueda' : 'No hay piezas registradas'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}