"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  History, 
  Shield, 
  User, 
  Calendar, 
  Filter, 
  Search, 
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Minus,
  RotateCcw,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: "GRANT" | "REVOKE" | "CREATE_ROLE" | "DELETE_ROLE" | "MODIFY_ROLE";
  resourceType: "ROLE" | "PERMISSION" | "USER_ROLE";
  resourceId: string;
  resourceName: string;
  details: {
    permissionId?: string;
    permissionName?: string;
    roleId?: string;
    roleName?: string;
    targetUserId?: string;
    targetUserName?: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
  };
  ipAddress?: string;
  userAgent?: string;
}

interface PermissionHistoryProps {
  auditEntries: AuditEntry[];
  onExportAudit?: (filters: any) => void;
  onViewDetails?: (entry: AuditEntry) => void;
  loading?: boolean;
}

export function PermissionHistory({ 
  auditEntries, 
  onExportAudit, 
  onViewDetails,
  loading = false 
}: PermissionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedResourceType, setSelectedResourceType] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: ""
  });
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Action configuration
  const actionConfig = {
    GRANT: {
      label: "Permiso Otorgado",
      icon: Plus,
      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    REVOKE: {
      label: "Permiso Revocado",
      icon: Minus,
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      bgColor: "bg-red-50 dark:bg-red-900/20"
    },
    CREATE_ROLE: {
      label: "Rol Creado",
      icon: CheckCircle2,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    DELETE_ROLE: {
      label: "Rol Eliminado",
      icon: XCircle,
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      bgColor: "bg-red-50 dark:bg-red-900/20"
    },
    MODIFY_ROLE: {
      label: "Rol Modificado",
      icon: AlertCircle,
      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20"
    }
  };

  // Filter audit entries
  const filteredEntries = useMemo(() => {
    return auditEntries.filter(entry => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !entry.userName.toLowerCase().includes(query) &&
          !entry.resourceName.toLowerCase().includes(query) &&
          !entry.details.permissionName?.toLowerCase().includes(query) &&
          !entry.details.roleName?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Action filter
      if (selectedAction && entry.action !== selectedAction) {
        return false;
      }

      // Resource type filter
      if (selectedResourceType && entry.resourceType !== selectedResourceType) {
        return false;
      }

      // Date range filter
      if (dateRange.from || dateRange.to) {
        const entryDate = new Date(entry.timestamp);
        if (dateRange.from && entryDate < new Date(dateRange.from)) {
          return false;
        }
        if (dateRange.to && entryDate > new Date(dateRange.to)) {
          return false;
        }
      }

      return true;
    });
  }, [auditEntries, searchQuery, selectedAction, selectedResourceType, dateRange]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, AuditEntry[]> = {};
    
    filteredEntries.forEach(entry => {
      const date = new Date(entry.timestamp).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });

    // Sort groups by date (newest first)
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .reduce((acc, [date, entries]) => {
        acc[date] = entries.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        return acc;
      }, {} as Record<string, AuditEntry[]>);
  }, [filteredEntries]);

  // Get action summary statistics
  const actionStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      stats[entry.action] = (stats[entry.action] || 0) + 1;
    });
    return stats;
  }, [filteredEntries]);

  const openDetails = (entry: AuditEntry) => {
    setSelectedEntry(entry);
    setDetailsOpen(true);
    onViewDetails?.(entry);
  };

  const handleExport = () => {
    onExportAudit?.({
      searchQuery,
      selectedAction,
      selectedResourceType,
      dateRange,
      totalEntries: filteredEntries.length
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedAction(null);
    setSelectedResourceType(null);
    setDateRange({ from: "", to: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
              <History className="h-6 w-6 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Historial de Permisos
              </h2>
              <p className="text-[var(--text-secondary)] mt-1">
                Auditoría completa de cambios en roles y permisos
              </p>
            </div>
          </div>

          {/* Action Statistics */}
          <div className="flex gap-3">
            {Object.entries(actionStats).map(([action, count]) => {
              const config = actionConfig[action as keyof typeof actionConfig];
              if (!config) return null;
              
              return (
                <div key={action} className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)]">{count}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{config.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4 items-end">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
              <Input
                placeholder="Buscar por usuario, recurso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Action filter */}
            <select
              value={selectedAction || ""}
              onChange={(e) => setSelectedAction(e.target.value || null)}
              className="px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-primary)] text-sm"
            >
              <option value="">Todas las acciones</option>
              {Object.entries(actionConfig).map(([action, config]) => (
                <option key={action} value={action}>
                  {config.label}
                </option>
              ))}
            </select>

            {/* Resource type filter */}
            <select
              value={selectedResourceType || ""}
              onChange={(e) => setSelectedResourceType(e.target.value || null)}
              className="px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-primary)] text-sm"
            >
              <option value="">Todos los recursos</option>
              <option value="ROLE">Roles</option>
              <option value="PERMISSION">Permisos</option>
              <option value="USER_ROLE">Asignación Usuario-Rol</option>
            </select>

            {/* Date filters */}
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="text-sm"
                placeholder="Desde"
              />
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="text-sm"
                placeholder="Hasta"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Filter summary */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--surface-border)]">
            <span className="text-sm text-[var(--text-secondary)]">
              Mostrando {filteredEntries.length} de {auditEntries.length} entradas
            </span>
            {(searchQuery || selectedAction || selectedResourceType || dateRange.from || dateRange.to) && (
              <Badge variant="outline" className="text-xs">
                Filtros activos
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Timeline */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 animate-spin" />
              <span>Cargando historial...</span>
            </div>
          </div>
        ) : Object.keys(groupedEntries).length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <History className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              Sin entradas de auditoría
            </h3>
            <p className="text-[var(--text-secondary)]">
              No se encontraron registros con los filtros aplicados
            </p>
          </motion.div>
        ) : (
          Object.entries(groupedEntries).map(([date, entries], dayIndex) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.1 }}
            >
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <h3 className="font-semibold">
                      {new Date(date).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <Badge variant="outline">{entries.length} eventos</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {entries.map((entry, entryIndex) => {
                      const config = actionConfig[entry.action];
                      const ActionIcon = config.icon;
                      
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: entryIndex * 0.05 }}
                          className={cn(
                            "flex items-start gap-4 p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer",
                            config.bgColor
                          )}
                          onClick={() => openDetails(entry)}
                          style={{ borderLeftColor: config.color.includes('green') ? '#22c55e' : 
                                   config.color.includes('red') ? '#ef4444' :
                                   config.color.includes('blue') ? '#3b82f6' : '#f59e0b' }}
                        >
                          <div className={cn("p-2 rounded-lg", config.color)}>
                            <ActionIcon className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={config.color}>
                                {config.label}
                              </Badge>
                              <span className="text-xs text-[var(--text-secondary)]">
                                {new Date(entry.timestamp).toLocaleTimeString('es-ES')}
                              </span>
                            </div>
                            
                            <div className="text-sm text-[var(--text-primary)] mb-1">
                              <span className="font-medium">{entry.userName}</span>
                              {entry.action === 'GRANT' && entry.details.permissionName && (
                                <span> otorgó el permiso <strong>{entry.details.permissionName}</strong> 
                                  {entry.details.targetUserName && <span> a <strong>{entry.details.targetUserName}</strong></span>}
                                </span>
                              )}
                              {entry.action === 'REVOKE' && entry.details.permissionName && (
                                <span> revocó el permiso <strong>{entry.details.permissionName}</strong>
                                  {entry.details.targetUserName && <span> de <strong>{entry.details.targetUserName}</strong></span>}
                                </span>
                              )}
                              {entry.action === 'CREATE_ROLE' && (
                                <span> creó el rol <strong>{entry.resourceName}</strong></span>
                              )}
                              {entry.action === 'DELETE_ROLE' && (
                                <span> eliminó el rol <strong>{entry.resourceName}</strong></span>
                              )}
                              {entry.action === 'MODIFY_ROLE' && (
                                <span> modificó el rol <strong>{entry.resourceName}</strong></span>
                              )}
                            </div>
                            
                            {entry.details.reason && (
                              <div className="text-xs text-[var(--text-secondary)] italic">
                                Razón: {entry.details.reason}
                              </div>
                            )}
                          </div>
                          
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Details UnifiedModal */}
      <UnifiedModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title="Detalles de Auditoría"
        className="max-w-2xl"
      >
        {selectedEntry && (
          <div className="space-y-6">
            {/* Entry header */}
            <div className="flex items-start gap-4">
              <div className={cn("p-3 rounded-lg", actionConfig[selectedEntry.action].color)}>
                {(() => {
                  const IconComponent = actionConfig[selectedEntry.action].icon;
                  return <IconComponent className="h-6 w-6" />;
                })()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">
                  {actionConfig[selectedEntry.action].label}
                </h3>
                <p className="text-[var(--text-secondary)]">
                  {new Date(selectedEntry.timestamp).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* Entry details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Usuario</label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    <span>{selectedEntry.userName}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Recurso</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="h-4 w-4" />
                    <span>{selectedEntry.resourceName}</span>
                    <Badge variant="outline">{selectedEntry.resourceType}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedEntry.ipAddress && (
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Dirección IP</label>
                    <div className="mt-1 font-mono text-sm">{selectedEntry.ipAddress}</div>
                  </div>
                )}
                
                {selectedEntry.details.reason && (
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Razón</label>
                    <div className="mt-1 text-sm">{selectedEntry.details.reason}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Technical details */}
            <div className="p-4 rounded-lg bg-[var(--surface-secondary)]">
              <h4 className="font-medium mb-2">Detalles Técnicos</h4>
              <pre className="text-xs text-[var(--text-secondary)] overflow-x-auto">
                {JSON.stringify({
                  id: selectedEntry.id,
                  action: selectedEntry.action,
                  resourceId: selectedEntry.resourceId,
                  details: selectedEntry.details,
                  userAgent: selectedEntry.userAgent
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </UnifiedModal>
    </div>
  );
}