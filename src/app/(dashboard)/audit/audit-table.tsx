"use client";

import * as React from "react";
import useSWR from "swr";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Search, Calendar, User } from "lucide-react";
import { SectionTransition } from "@/components/ui/page-transition";
import { motion } from "framer-motion";
import { PageHeader } from '@/components/ui/page-header';

const fetcher = (url: string) => axios.get(url).then(r => r.data);

export default function AuditTable() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const pageSize = 20;
  
  const { data, isLoading } = useSWR(
    `/api/dashboard/changes?page=${page}&pageSize=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ''}`, 
    fetcher
  );
  
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleClearFilters = () => {
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registros de Auditoría"
        description="Historial de actividades y cambios en el sistema"
      />
      
      {/* Filters Card */}
      <SectionTransition delay={0.1} className="mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar en registros de auditoría..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  onClick={handleClearFilters}
                  disabled={!search}
                  className="transition-all duration-200"
                >
                  Limpiar filtros
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </SectionTransition>

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">Cargando registros de auditoría...</div>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Sin registros de auditoría
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No hay actividades registradas en el sistema.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Fecha
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Usuario
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold">Evento</th>
                    <th className="text-left p-4 font-semibold">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, index: number) => (
                    <motion.tr 
                      key={item.id} 
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(item.at).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: '2-digit', 
                            day: '2-digit',
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.at).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium">
                          {item.user?.name || item.userId || 'Sistema'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.user?.email}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {item.action || item.event}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {item.message || item.description}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {items.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, total)} de {total} registros
              </div>
              <div className="flex items-center gap-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="transition-all duration-200"
                  >
                    Anterior
                  </Button>
                </motion.div>
                <span className="text-sm">
                  Página {page} de {totalPages}
                </span>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="transition-all duration-200"
                  >
                    Siguiente
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}