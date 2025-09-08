"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Truck, 
  PackageOpen, 
  Plus, 
  Trash2, 
  Calculator,
  FileDown
} from "lucide-react";
import axios from "axios";
import { PageTransition, SectionTransition } from "@/components/ui/page-transition";
import { motion } from "framer-motion";
import { PageHeader } from '@/components/ui/page-header';

export default function FreightCalculatorTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [distanceKm, setDistanceKm] = useState("100");
  const [destination, setDestination] = useState("Córdoba Capital");
  const [pieces, setPieces] = useState([
    { id: "1", description: "Viga I 60cm", weight: "15", length: "10", quantity: "5", plantId: "CO", requiresEscort: false },
    { id: "2", description: "Viga mediana 18m", weight: "20", length: "18", quantity: "2", plantId: "CO", requiresEscort: false },
    { id: "3", description: "Viga especial 25m", weight: "30", length: "25", quantity: "1", plantId: "CO", requiresEscort: true },
    { id: "4", description: "Placa 3x4", weight: "8", length: "4", quantity: "10", plantId: "BA", requiresEscort: false }
  ]);
  const [result, setResult] = useState<any>(null);

  const addPiece = () => {
    setPieces([
      ...pieces,
      { id: Date.now().toString(), description: "", weight: "1", length: "1", quantity: "1", plantId: "CO", requiresEscort: false }
    ]);
  };

  const removePiece = (index: number) => {
    setPieces(pieces.filter((_, i) => i !== index));
  };

  const updatePiece = (index: number, field: string, value: string | boolean) => {
    const newPieces = [...pieces];
    newPieces[index] = { ...newPieces[index], [field]: value };
    setPieces(newPieces);
  };

  const calculateFreight = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/freight-calculation", {
        pieces,
        distanceKm: Number(distanceKm),
        destinationCity: destination
      });
      
      setResult(response.data);
      toast.success("Cálculo de flete completado");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al calcular el flete");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJson = () => {
    if (!result) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "freight-calculation.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <PageTransition>
      <div className="container mx-auto p-6 max-w-7xl">
        <PageHeader
          title="Calculadora de Fletes"
          description="Prueba del algoritmo de cálculo de fletes para camiones"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <SectionTransition delay={0.1}>
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Datos del Cálculo</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label htmlFor="distanceKm">Distancia (km)</Label>
                      <Input
                        id="distanceKm"
                        type="number"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="destination">Destino</Label>
                      <Input
                        id="destination"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-medium">Piezas</h3>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button onClick={addPiece} variant="outline" size="sm" className="transition-all duration-200">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Pieza
                      </Button>
                    </motion.div>
                  </div>

                  <div className="space-y-4">
                    {pieces.map((piece, index) => (
                      <motion.div
                        key={piece.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="border rounded-lg p-4">
                          <div className="flex justify-between mb-3">
                            <h4 className="font-medium flex items-center">
                              <PackageOpen className="w-4 h-4 mr-2" />
                              {piece.description || `Pieza ${index + 1}`}
                            </h4>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePiece(index)}
                                className="transition-all duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                              <Label htmlFor={`piece-${index}-description`}>Descripción</Label>
                              <Input
                                id={`piece-${index}-description`}
                                value={piece.description}
                                onChange={(e) => updatePiece(index, "description", e.target.value)}
                                placeholder="Descripción de la pieza"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`piece-${index}-weight`}>Peso (tn)</Label>
                              <Input
                                id={`piece-${index}-weight`}
                                type="number"
                                step="0.01"
                                value={piece.weight}
                                onChange={(e) => updatePiece(index, "weight", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`piece-${index}-length`}>Longitud (m)</Label>
                              <Input
                                id={`piece-${index}-length`}
                                type="number"
                                step="0.1"
                                value={piece.length}
                                onChange={(e) => updatePiece(index, "length", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`piece-${index}-quantity`}>Cantidad</Label>
                              <Input
                                id={`piece-${index}-quantity`}
                                type="number"
                                value={piece.quantity}
                                onChange={(e) => updatePiece(index, "quantity", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`piece-${index}-plant`}>Planta de Origen</Label>
                              <Select
                                id={`piece-${index}-plant`}
                                value={piece.plantId}
                                onChange={(e) => updatePiece(index, "plantId", e.target.value)}
                              >
                                <option value="CO">Córdoba (CO)</option>
                                <option value="BA">Buenos Aires (BA)</option>
                                <option value="VM">Villa Mercedes (VM)</option>
                              </Select>
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                              <input
                                type="checkbox"
                                id={`piece-${index}-escort`}
                                checked={piece.requiresEscort}
                                onChange={(e) => updatePiece(index, "requiresEscort", e.target.checked)}
                                className="h-4 w-4"
                              />
                              <Label htmlFor={`piece-${index}-escort`}>Requiere escolta</Label>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={calculateFreight} 
                        disabled={isLoading}
                        className="w-full transition-all duration-200"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Calculando...
                          </>
                        ) : (
                          <>
                            <Calculator className="w-4 h-4 mr-2" />
                            Calcular Flete
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </SectionTransition>
          </div>

          <div>
            <SectionTransition delay={0.2}>
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Resultado</h2>
                </CardHeader>
                <CardContent>
                  {result ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <p className="text-sm text-blue-600 dark:text-blue-400">Costo Total</p>
                          <p className="font-bold text-lg">${result.totalCost?.toLocaleString()}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <p className="text-sm text-green-600 dark:text-green-400">Camiones</p>
                          <p className="font-bold text-lg">{result.trucksNeeded}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="font-medium">Detalles por Camión</h3>
                        {result.truckDetails?.map((detail: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border rounded-lg p-3"
                          >
                            <div className="flex justify-between">
                              <span className="font-medium">Camión {index + 1}</span>
                              <span className="text-sm">${detail.cost?.toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {detail.type} • {detail.pieces} piezas
                            </p>
                          </motion.div>
                        ))}
                      </div>
                      
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          variant="outline" 
                          onClick={downloadJson}
                          className="w-full transition-all duration-200"
                        >
                          <FileDown className="w-4 h-4 mr-2" />
                          Descargar JSON
                        </Button>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Truck className="mx-auto h-12 w-12 mb-3 opacity-50" />
                      <p>Completa los datos y calcula el flete</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </SectionTransition>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}