"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Pagination } from "@/components/ui/pagination";
import { RowActions } from "@/components/ui/row-actions";
import { Plus, Search, Package, Settings, Tag, Users, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useCan } from "@/hooks/use-can";
import { usePermissionGuard } from "@/hooks/use-permission-guard";
import { useUnifiedPermissionError } from "@/hooks/use-unified-permission-error";
import { PieceFamilyForm } from "./piece-family-form";
import { PageTransition, SectionTransition, CardTransition } from "@/components/ui/page-transition";
import { motion } from "framer-motion";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PieceFamiliesClient() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [openUnifiedModal, setOpenUnifiedModal] = useState(false);
  const [viewDetails, setViewDetails] = useState<any>(null);

  // Permission hooks
  const { handlePermissionError, PermissionErrorModal } = useUnifiedPermissionError();
  const { guardAction } = usePermissionGuard();

  // Fetch families data
  const { data, error, mutate } = useSWR(
    `/api/piece-families?page=${page}&search=${encodeURIComponent(search)}`,
    fetcher
  );

  // Inject scrollbar-hide styles
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('scrollbar-hide-styles')) {
      const style = document.createElement('style');
      style.id = 'scrollbar-hide-styles';
      style.textContent = `
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const items = data?.items || [];
  const pageCount = data?.pagination?.pageCount || 0;
  const total = data?.pagination?.total || 0;

  const handleSaveFamily = async (familyData: any) => {
    try {
      const url = selectedFamily 
        ? `/api/piece-families/${selectedFamily.id}` 
        : '/api/piece-families';
      const method = selectedFamily ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(familyData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          handlePermissionError(result.error);
          return;
        }
        throw new Error(result.error || 'Error al guardar familia');
      }

      toast.success(selectedFamily ? 'Familia actualizada exitosamente' : 'Familia creada exitosamente');
      setOpenUnifiedModal(false);
      setSelectedFamily(null);
      mutate();
    } catch (error) {
      console.error('Error saving family:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar familia');
    }
  };

  const handleViewDetails = async (family: any) => {
    try {
      const response = await fetch(`/api/piece-families/${family.id}`);
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          handlePermissionError(result.error);
          return;
        }
        throw new Error(result.error || 'Error al obtener detalles');
      }

      setViewDetails(result);
    } catch (error) {
      console.error('Error fetching family details:', error);
      toast.error(error instanceof Error ? error.message : 'Error al obtener detalles');
    }
  };

  const handleDelete = async (family: any) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la familia "${family.code}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/piece-families/${family.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          handlePermissionError(result.error);
          return;
        }
        throw new Error(result.error || 'Error al eliminar familia');
      }

      toast.success('Familia eliminada exitosamente');
      mutate();
    } catch (error) {
      console.error('Error deleting family:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar familia');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    mutate();
  };

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Error al cargar las familias de piezas</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageTransition>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
              <Tag className="h-6 w-6 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Familias de Piezas</h1>
              <p className="text-[var(--text-secondary)] mt-1">
                Gestiona las familias y configuraciones de piezas del sistema
              </p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={guardAction("piece-families", "create", () => {
                setSelectedFamily(null);
                setOpenUnifiedModal(true);
              }, {
                customMessage: "Necesitas permisos para crear familias de piezas. Contacta al administrador del sistema."
              })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Familia
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Search and filters */}
      <SectionTransition delay={0.1} className="mb-6">
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por código o descripción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </SectionTransition>

      {/* Families list */}
      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-8 text-center">
              <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No se encontraron familias de piezas</p>
              <Button onClick={guardAction("piece-families", "create", () => {
                setSelectedFamily(null);
                setOpenUnifiedModal(true);
              }, {
                customMessage: "Necesitas permisos para crear familias de piezas. Contacta al administrador del sistema."
              })}>
                <Plus className="w-4 h-4 mr-2" />
                Crear primera familia
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Código</th>
                    <th className="text-left p-4 font-medium">Descripción</th>
                    <th className="text-left p-4 font-medium">Prefijo</th>
                    <th className="text-left p-4 font-medium">Estado</th>
                    <th className="text-left p-4 font-medium">Piezas</th>
                    <th className="text-right p-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((family: any, index: number) => (
                    <motion.tr 
                      key={family.id} 
                      className="border-b hover:bg-muted/30 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="p-4 font-mono">{family.code}</td>
                      <td className="p-4">{family.description}</td>
                      <td className="p-4 font-mono">{family.prefix}</td>
                      <td className="p-4">
                        <Badge variant={family.active ? "default" : "secondary"}>
                          {family.active ? "Activa" : "Inactiva"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {family._count?.pieces || 0} piezas
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <RowActions
                          actions={[
                            {
                              label: "Ver detalles",
                              onClick: () => handleViewDetails(family),
                            },
                            {
                              label: "Editar",
                              onClick: guardAction("piece-families", "edit", () => {
                                setSelectedFamily(family);
                                setOpenUnifiedModal(true);
                              }, {
                                customMessage: "Necesitas permisos para editar familias de piezas."
                              }),
                            },
                            {
                              label: "Eliminar",
                              onClick: guardAction("piece-families", "delete", () => handleDelete(family), {
                                customMessage: "Necesitas permisos para eliminar familias de piezas."
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

      {/* Pagination */}
      {pageCount > 1 && (
        <Pagination
          currentPage={page}
          hasNextPage={page < pageCount}
          onPageChange={setPage}
        />
      )}

      {/* Create/Edit UnifiedModal */}
      <UnifiedModal
        open={openUnifiedModal}
        onClose={() => {
          setOpenUnifiedModal(false);
          setSelectedFamily(null);
        }}
        title={selectedFamily ? "Editar Familia" : "Nueva Familia"}
      >
        <div className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide mx-auto">
          <div className="p-6">
            <PieceFamilyForm
              family={selectedFamily}
              onSave={handleSaveFamily}
              onCancel={() => {
                setOpenUnifiedModal(false);
                setSelectedFamily(null);
              }}
            />
          </div>
        </div>
      </UnifiedModal>

      {/* View Details UnifiedModal */}
      {viewDetails && (
        <UnifiedModal
          open={!!viewDetails}
          onClose={() => setViewDetails(null)}
          title="Detalles de la Familia"
        >
          <div className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide mx-auto">
            <div className="p-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="font-medium mb-3">Información Básica</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Código</p>
                      <p className="font-mono bg-muted px-2 py-1 rounded inline-block">
                        {viewDetails.code}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Descripción</p>
                      <p className="font-medium">{viewDetails.description || 'Sin descripción'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Categoría</p>
                      <p className="font-medium">{viewDetails.category || 'Sin categoría'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Hormigón</p>
                      <p className="font-medium">{viewDetails.defaultConcreteType || 'No especificado'}</p>
                    </div>
                  </div>
                </div>

                {/* Configuration */}
                <div>
                  <h4 className="font-medium mb-3">Configuración</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      {viewDetails.requiresMold ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm">Requiere molde</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {viewDetails.requiresCables ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm">Requiere cables</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {viewDetails.requiresVaporCycle ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm">Requiere ciclo de vapor</span>
                    </div>
                    {viewDetails.maxCables && (
                      <div>
                        <p className="text-sm text-muted-foreground">Máximo de cables</p>
                        <p className="font-medium">{viewDetails.maxCables}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h4 className="font-medium mb-3">Estadísticas</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{viewDetails._count?.pieces || 0}</p>
                      <p className="text-sm text-muted-foreground">Piezas</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{viewDetails._count?.molds || 0}</p>
                      <p className="text-sm text-muted-foreground">Moldes</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{viewDetails._count?.pieceRecipes || 0}</p>
                      <p className="text-sm text-muted-foreground">Recetas</p>
                    </div>
                  </div>
                </div>

                {/* Related Pieces */}
                {viewDetails.pieces?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Piezas Asociadas (Primeras 10)</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3">Descripción</th>
                            <th className="text-left p-3">Planta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewDetails.pieces.map((piece: any, index: number) => (
                            <tr key={piece.id} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                              <td className="p-3">{piece.description}</td>
                              <td className="p-3">{piece.plant?.name || 'Sin asignar'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Related Molds */}
                {viewDetails.molds?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Moldes Asociados</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3">Código</th>
                            <th className="text-left p-3">Descripción</th>
                            <th className="text-left p-3">Planta</th>
                            <th className="text-left p-3">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewDetails.molds.map((mold: any, index: number) => (
                            <tr key={mold.id} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                              <td className="p-3">
                                <span className="font-mono">{mold.code}</span>
                              </td>
                              <td className="p-3">{mold.description || 'Sin descripción'}</td>
                              <td className="p-3">{mold.plant?.name || 'Sin asignar'}</td>
                              <td className="p-3">
                                <Badge variant={mold.active ? "default" : "secondary"}>
                                  {mold.active ? "Activo" : "Inactivo"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </UnifiedModal>
      )}

      {/* Permission Error UnifiedModal */}
      <PermissionErrorModal />
    </PageTransition>
  );
}