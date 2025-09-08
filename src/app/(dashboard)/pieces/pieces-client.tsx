"use client";

import React, { useState } from "react";
import useSWR from "swr";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Select } from "@/components/ui/select";
import { RowActions } from "@/components/ui/row-actions";
import { Pagination } from "@/components/ui/pagination";
import { 
  Search, 
  Plus, 
  Package, 
  Calculator, 
  Truck, 
  AlertCircle,
  Factory,
  Layers,
  DollarSign 
} from "lucide-react";
import { toast } from "sonner";
import { useUnifiedPermissionError } from "@/hooks/use-unified-permission-error";
import { useCan } from "@/hooks/use-can";
import { usePermissionGuard } from "@/hooks/use-permission-guard";
import { PieceForm } from "./PieceForm";
import { PageTransition, SectionTransition, CardTransition } from "@/components/ui/page-transition";
import { motion } from "framer-motion";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

// Add CSS for hiding scrollbars
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Inject CSS styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = scrollbarHideStyles;
  if (!document.head.querySelector('[data-scrollbar-hide]')) {
    styleSheet.setAttribute('data-scrollbar-hide', 'true');
    document.head.appendChild(styleSheet);
  }
}

export default function PiecesClient() {
  const { handlePermissionError, PermissionErrorModal } = useUnifiedPermissionError();
  const { guardAction } = usePermissionGuard();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [familyFilter, setFamilyFilter] = useState("");
  const [plantFilter, setPlantFilter] = useState("");
  const [openUnifiedModal, setOpenUnifiedModal] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<any>(null);
  const [viewDetails, setViewDetails] = useState<any>(null);
  
  const { data, mutate, isLoading } = useSWR(
    `/api/pieces?page=${page}&pageSize=10&q=${encodeURIComponent(q)}&familyId=${familyFilter}&plantId=${plantFilter}`, 
    fetcher
  );
  const { data: plants } = useSWR("/api/plants", fetcher);
  const { data: families } = useSWR("/api/piece-families", fetcher);
  const { data: materials } = useSWR("/api/materials", fetcher);
  const { data: molds } = useSWR("/api/molds", fetcher);

  const handleSavePiece = async (pieceData: any) => {
    try {
      if (selectedPiece) {
        // Actualizar pieza existente
        await axios.put(`/api/pieces/${selectedPiece.id}`, pieceData, { timeout: 15000 });
        toast.success("Pieza actualizada correctamente");
      } else {
        // Crear nueva pieza
        await axios.post("/api/pieces", pieceData, { timeout: 15000 });
        toast.success("Pieza creada correctamente");
      }
      mutate();
      setOpenUnifiedModal(false);
      setSelectedPiece(null);
    } catch (error: any) {
      if (axios.isAxiosError(error) && (error.code === "ECONNABORTED" || /timeout/i.test(error.message))) {
        toast.error("Tiempo de espera agotado al guardar la pieza. Intente nuevamente.");
      } else {
        handlePermissionError(error, selectedPiece ? "Actualizar pieza" : "Crear pieza");
      }
    }
  };

  const handleDelete = async (piece: any) => {
    if (!confirm(`¿Eliminar la pieza "${piece.description}"?`)) return;
    
    try {
      await axios.delete(`/api/pieces/${piece.id}`);
      toast.success("Pieza eliminada");
      mutate();
    } catch (error: any) {
      handlePermissionError(error, "Eliminar pieza");
    }
  };

  const handleViewDetails = (piece: any) => {
    setViewDetails(piece);
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const pageCount = Math.ceil(total / 10);

  return (
    <PageTransition>
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
              <Layers className="h-6 w-6 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Gestión de Piezas</h1>
              <p className="text-[var(--text-secondary)] mt-1">
                Administra las piezas, sus configuraciones y costos de producción
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filtros y búsqueda */}
      <SectionTransition delay={0.1} className="mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar piezas..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select
                  value={familyFilter}
                  onChange={(e) => setFamilyFilter(e.target.value)}
                >
                  <option value="">Todas las familias</option>
                  {families?.items?.map((family: any) => (
                    <option key={family.id} value={family.id}>
                      {family.code}
                    </option>
                  ))}
                </Select>
                
                <Select
                  value={plantFilter}
                  onChange={(e) => setPlantFilter(e.target.value)}
                >
                  <option value="">Todas las plantas</option>
                  {plants?.items?.map((plant: any) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.name}
                    </option>
                  ))}
                </Select>
              </div>
              
              <div className="flex gap-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" onClick={() => {
                    setQ("");
                    setFamilyFilter("");
                    setPlantFilter("");
                  }}
                  className="transition-all duration-200">
                    Limpiar filtros
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={guardAction("pieces", "create", () => {
                    setSelectedPiece(null);
                    setOpenUnifiedModal(true);
                  }, {
                    customMessage: "Necesitas permisos para crear piezas. Contacta al administrador del sistema."
                  })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Pieza
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SectionTransition>

      {/* Lista de piezas */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando piezas...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No se encontraron piezas</p>
              <Button onClick={guardAction("pieces", "create", () => {
                setSelectedPiece(null);
                setOpenUnifiedModal(true);
              }, {
                customMessage: "Necesitas permisos para crear piezas. Contacta al administrador del sistema."
              })}>
                <Plus className="w-4 h-4 mr-2" />
                Crear primera pieza
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Código</th>
                    <th className="text-left p-4 font-medium">Descripción</th>
                    <th className="text-left p-4 font-medium">Familia</th>
                    <th className="text-left p-4 font-medium">Planta</th>
                    <th className="text-left p-4 font-medium">Dimensiones</th>
                    <th className="text-left p-4 font-medium">Peso</th>
                    <th className="text-right p-4 font-medium">Precio</th>
                    <th className="text-left p-4 font-medium">Estado</th>
                    <th className="text-right p-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((piece: any, index: number) => (
                    <motion.tr 
                      key={piece.id} 
                      className="border-b hover:bg-muted/30 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="p-4">
                        <span className="font-mono text-sm">{piece.code}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{piece.description}</p>
                          {piece.section && (
                            <p className="text-sm text-muted-foreground">Sección: {piece.section}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {piece.family?.code || "-"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Factory className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{piece.plant?.name || "-"}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {piece.length && <div>L: {piece.length}m</div>}
                          {piece.width && <div>A: {piece.width}m</div>}
                          {piece.height && <div>H: {piece.height}m</div>}
                        </div>
                      </td>
                      <td className="p-4">
                        {piece.weight ? `${piece.weight} kg` : "-"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-sm">
                          {piece.priceCordoba && (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-muted-foreground">CBA:</span>
                              <span className="font-medium">${piece.priceCordoba}</span>
                            </div>
                          )}
                          {piece.priceBuenosAires && (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-muted-foreground">BS AS:</span>
                              <span className="font-medium">${piece.priceBuenosAires}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {piece.requiresEscort && (
                            <Badge variant="secondary" className="text-xs">
                              <Truck className="w-3 h-3 mr-1" />
                              Escolta
                            </Badge>
                          )}
                          {piece.individualTransport && (
                            <Badge variant="secondary" className="text-xs">
                              Individual
                            </Badge>
                          )}
                          {piece.moldId && (
                            <Badge variant="outline" className="text-xs">
                              <Layers className="w-3 h-3 mr-1" />
                              Molde
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <RowActions
                          actions={[
                            {
                              label: "Ver detalles",
                              onClick: guardAction("pieces", "view", () => handleViewDetails(piece), {
                                customMessage: "Necesitas permisos para ver detalles de piezas."
                              }),
                            },
                            {
                              label: "Editar",
                              onClick: guardAction("pieces", "edit", () => {
                                setSelectedPiece(piece);
                                setOpenUnifiedModal(true);
                              }, {
                                customMessage: "Necesitas permisos para editar piezas."
                              }),
                            },
                            {
                              label: "Eliminar",
                              onClick: guardAction("pieces", "delete", () => handleDelete(piece), {
                                customMessage: "Necesitas permisos para eliminar piezas."
                              }),
                              variant: "destructive",
                            },
                          ]}
                        />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {pageCount > 1 && (
        <Pagination
          currentPage={page}
          hasNextPage={page < pageCount}
          onPageChange={setPage}
        />
      )}

      {/* UnifiedModal para crear/editar pieza */}
      <UnifiedModal
        open={openUnifiedModal}
        onClose={() => {
          setOpenUnifiedModal(false);
          setSelectedPiece(null);
        }}
        title={selectedPiece ? "Editar Pieza" : "Nueva Pieza"}
      >
        <div className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide mx-auto">
          <div className="p-6">
            <PieceForm
              piece={selectedPiece}
              onSave={handleSavePiece}
              onCancel={() => {
                setOpenUnifiedModal(false);
                setSelectedPiece(null);
              }}
            />
          </div>
        </div>
      </UnifiedModal>

      {/* UnifiedModal de detalles */}
      {viewDetails && (
        <UnifiedModal
          open={!!viewDetails}
          onClose={() => setViewDetails(null)}
          title="Detalles de la Pieza"
        >
          <div className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide mx-auto">
            <div className="p-6">
              <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Código</p>
                <p className="font-medium">{viewDetails.code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="font-medium">{viewDetails.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Familia</p>
                <p className="font-medium">{viewDetails.family?.code || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Planta</p>
                <p className="font-medium">{viewDetails.plant?.name || "-"}</p>
              </div>
            </div>
            
            {viewDetails.moldId && (
              <div>
                <p className="text-sm text-muted-foreground">Molde</p>
                <p className="font-medium">
                  {molds?.items?.find((m: any) => m.id === viewDetails.moldId)?.code || viewDetails.moldId}
                </p>
              </div>
            )}
            
            <div>
              <h4 className="font-medium mb-2">Dimensiones</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {viewDetails.length && <div>Largo: {viewDetails.length}m</div>}
                {viewDetails.width && <div>Ancho: {viewDetails.width}m</div>}
                {viewDetails.height && <div>Alto: {viewDetails.height}m</div>}
                {viewDetails.thickness && <div>Espesor: {viewDetails.thickness}m</div>}
                {viewDetails.volume && <div>Volumen: {viewDetails.volume}m³</div>}
                {viewDetails.weight && <div>Peso: {viewDetails.weight}kg</div>}
              </div>
            </div>
            
            {(viewDetails.cableCount || viewDetails.meshLayers) && (
              <div>
                <h4 className="font-medium mb-2">Configuración Específica</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {viewDetails.cableCount && <div>Cables: {viewDetails.cableCount}</div>}
                  {viewDetails.meshLayers && <div>Capas de malla: {viewDetails.meshLayers}</div>}
                  {viewDetails.hasAntiseismic && <div>✓ Antisísmico</div>}
                  {viewDetails.hasInsulation && <div>✓ Aislación</div>}
                  {viewDetails.hasTelgopor && <div>✓ Telgopor</div>}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="font-medium mb-2">Precios por Planta</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Córdoba:</span>
                  <span className="ml-2 font-medium">
                    {viewDetails.priceCordoba ? `$${viewDetails.priceCordoba}` : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Buenos Aires:</span>
                  <span className="ml-2 font-medium">
                    {viewDetails.priceBuenosAires ? `$${viewDetails.priceBuenosAires}` : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Villa María:</span>
                  <span className="ml-2 font-medium">
                    {viewDetails.priceVillaMaria ? `$${viewDetails.priceVillaMaria}` : "-"}
                  </span>
                </div>
              </div>
            </div>
            
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewDetails(null)}>
                  Cerrar
                </Button>
                <Button onClick={guardAction("pieces", "edit", () => {
                  setSelectedPiece(viewDetails);
                  setViewDetails(null);
                  setOpenUnifiedModal(true);
                }, {
                  customMessage: "Necesitas permisos para editar piezas."
                })}>
                  Editar
                </Button>
              </div>
            </div>
          </div>
        </div>
        </UnifiedModal>
      )}

      <PermissionErrorModal />
    </PageTransition>
  );
}