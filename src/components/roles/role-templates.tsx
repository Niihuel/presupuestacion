"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Users, 
  Eye, 
  Settings, 
  ClipboardPlus, 
  Building, 
  Truck,
  Calculator,
  Copy,
  Check,
  Crown,
  UserCheck,
  Briefcase,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  permissions: string[];
  category: "administrative" | "operational" | "managerial" | "specialized";
  level: "basic" | "intermediate" | "advanced" | "expert";
}

interface RoleTemplatesProps {
  onApplyTemplate: (template: RoleTemplate) => void;
  existingRoles: any[];
  availablePermissions: Record<string, any[]>;
}

// Predefined role templates
const roleTemplates: RoleTemplate[] = [
  {
    id: "admin",
    name: "Administrador General",
    description: "Acceso completo al sistema con todos los permisos administrativos",
    icon: Crown,
    color: "#ef4444",
    category: "administrative",
    level: "expert",
    permissions: [
      "users.view", "users.create", "users.edit", "users.delete",
      "roles.view", "roles.create", "roles.edit", "roles.delete",
      "permissions.view", "permissions.create", "permissions.edit",
      "system.backup", "system.restore", "parameters.edit",
      "dashboard.view", "budgets.view", "budgets.approve"
    ]
  },
  {
    id: "manager",
    name: "Gerente de Operaciones",
    description: "Gestión completa de presupuestos, proyectos y supervisión de equipos",
    icon: Briefcase,
    color: "#3b82f6",
    category: "managerial",
    level: "advanced",
    permissions: [
      "dashboard.view", "budgets.view", "budgets.create", "budgets.edit", "budgets.approve",
      "projects.view", "projects.create", "projects.edit",
      "customers.view", "customers.create", "customers.edit",
      "users.view", "materials.view", "pieces.view", "trucks.view",
      "calendar.view", "calendar.create", "calendar.edit"
    ]
  },
  {
    id: "sales",
    name: "Ejecutivo de Ventas",
    description: "Creación y gestión de presupuestos, seguimiento de clientes",
    icon: ClipboardPlus,
    color: "#22c55e",
    category: "operational",
    level: "intermediate",
    permissions: [
      "dashboard.view", "budgets.view", "budgets.create", "budgets.edit",
      "customers.view", "customers.create", "customers.edit",
      "projects.view", "projects.create",
      "materials.view", "pieces.view", "calendar.view", "calendar.create"
    ]
  },
  {
    id: "production",
    name: "Jefe de Producción",
    description: "Gestión de plantas, materiales, piezas y control de inventario",
    icon: Building,
    color: "#f59e0b",
    category: "operational",
    level: "advanced",
    permissions: [
      "dashboard.view", "plants.view", "plants.edit",
      "materials.view", "materials.create", "materials.edit",
      "pieces.view", "pieces.create", "pieces.edit",
      "budgets.view", "projects.view", "molds.view", "molds.edit"
    ]
  },
  {
    id: "logistics",
    name: "Coordinador de Logística",
    description: "Gestión de camiones, transportes y seguimiento de entregas",
    icon: Truck,
    color: "#8b5cf6",
    category: "operational",
    level: "intermediate",
    permissions: [
      "dashboard.view", "trucks.view", "trucks.create", "trucks.edit",
      "budgets.view", "projects.view", "customers.view",
      "calendar.view", "calendar.create"
    ]
  },
  {
    id: "accountant",
    name: "Contador",
    description: "Acceso a reportes financieros, parámetros de costos y análisis",
    icon: Calculator,
    color: "#06b6d4",
    category: "specialized",
    level: "intermediate",
    permissions: [
      "dashboard.view", "budgets.view", "budgets.export",
      "parameters.view", "parameters.edit", "projects.view",
      "customers.view", "materials.view"
    ]
  },
  {
    id: "designer",
    name: "Diseñador",
    description: "Acceso a obras, modelos 3D y gestión de archivos",
    icon: Eye,
    color: "#ec4899",
    category: "specialized",
    level: "basic",
    permissions: [
      "dashboard.view", "projects.view", "projects.edit",
      "customers.view", "pieces.view", "molds.view"
    ]
  },
  {
    id: "supervisor",
    name: "Supervisor de Calidad",
    description: "Supervisión de producción, control de calidad y reportes",
    icon: UserCheck,
    color: "#84cc16",
    category: "operational",
    level: "intermediate",
    permissions: [
      "dashboard.view", "plants.view", "materials.view",
      "pieces.view", "budgets.view", "projects.view",
      "calendar.view"
    ]
  },
  {
    id: "viewer",
    name: "Solo Lectura",
    description: "Acceso de solo lectura a información básica del sistema",
    icon: Eye,
    color: "#6b7280",
    category: "operational",
    level: "basic",
    permissions: [
      "dashboard.view", "budgets.view", "projects.view",
      "customers.view", "materials.view", "pieces.view"
    ]
  }
];

// Category labels
const categoryLabels = {
  administrative: "Administrativo",
  operational: "Operacional", 
  managerial: "Gerencial",
  specialized: "Especializado",
  basic: "Básico"
};

// Level labels and colors
const levelConfig = {
  basic: { label: "Básico", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  intermediate: { label: "Intermedio", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  advanced: { label: "Avanzado", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  expert: { label: "Experto", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" }
};

export function RoleTemplates({ onApplyTemplate, existingRoles, availablePermissions }: RoleTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<RoleTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter templates by category
  const filteredTemplates = selectedCategory 
    ? roleTemplates.filter(t => t.category === selectedCategory)
    : roleTemplates;

  // Get unique categories
  const categories = Array.from(new Set(roleTemplates.map(t => t.category)));

  // Check if role name already exists
  const isNameTaken = (name: string) => {
    return existingRoles.some(role => 
      role.name.toLowerCase() === name.toLowerCase()
    );
  };

  // Get permission display info
  const getPermissionInfo = (permissionKey: string) => {
    const [resource, action] = permissionKey.split('.');
    const resourcePerms = availablePermissions[resource] || [];
    const permission = resourcePerms.find(p => p.action === action);
    
    return {
      resource,
      action,
      found: !!permission,
      display: permission?.description || `${action} ${resource}`
    };
  };

  // Calculate compatibility score
  const getCompatibilityScore = (template: RoleTemplate) => {
    const foundPermissions = template.permissions.filter(perm => {
      const info = getPermissionInfo(perm);
      return info.found;
    });
    return Math.round((foundPermissions.length / template.permissions.length) * 100);
  };

  const handleApplyTemplate = (template: RoleTemplate) => {
    if (isNameTaken(template.name)) {
      toast.error(`Ya existe un rol con el nombre "${template.name}"`);
      return;
    }

    const compatibilityScore = getCompatibilityScore(template);
    if (compatibilityScore < 80) {
      toast.warning(`Compatibilidad ${compatibilityScore}% - Algunos permisos pueden no estar disponibles`);
    }

    onApplyTemplate(template);
    toast.success(`Plantilla "${template.name}" aplicada correctamente`);
  };

  const openPreview = (template: RoleTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Plantillas de Roles
            </h2>
            <p className="text-[var(--text-secondary)]">
              Aplicar configuraciones predefinidas para roles comunes
            </p>
          </div>
          
          {/* Category filter */}
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {categoryLabels[category as keyof typeof categoryLabels]}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => {
          const IconComponent = template.icon;
          const levelInfo = levelConfig[template.level];
          const compatibilityScore = getCompatibilityScore(template);
          const isNameConflict = isNameTaken(template.name);
          
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Card className="h-full glass-card hover:shadow-lg hover:border-[var(--accent-primary)]/20 transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div
                      className="p-3 rounded-xl border-2 transition-all duration-200 group-hover:scale-110"
                      style={{ 
                        backgroundColor: `${template.color}15`,
                        borderColor: `${template.color}30`
                      }}
                    >
                      <IconComponent 
                        className="h-6 w-6" 
                        style={{ color: template.color }}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Badge className={levelInfo.color}>
                        {levelInfo.label}
                      </Badge>
                      <Badge 
                        className={cn(
                          "text-xs",
                          compatibilityScore >= 90 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                          compatibilityScore >= 80 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" :
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        )}
                      >
                        {compatibilityScore}% compatible
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                        {template.name}
                      </h3>
                      {isNameConflict && (
                        <Badge variant="destructive" className="text-xs">
                          Nombre en uso
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Permissions preview */}
                    <div>
                      <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">
                        {template.permissions.length} permisos incluidos
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.permissions.slice(0, 4).map(perm => {
                          const info = getPermissionInfo(perm);
                          return (
                            <Badge 
                              key={perm}
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                info.found ? "opacity-100" : "opacity-50"
                              )}
                            >
                              {info.action}
                            </Badge>
                          );
                        })}
                        {template.permissions.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.permissions.length - 4} más
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPreview(template)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Vista previa
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApplyTemplate(template)}
                        disabled={isNameConflict}
                        className="flex-1 btn-primary"
                        style={{
                          backgroundColor: isNameConflict ? undefined : template.color,
                          borderColor: isNameConflict ? undefined : template.color
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Preview UnifiedModal */}
      <UnifiedModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={`Plantilla: ${selectedTemplate?.name}`}
        className="max-w-2xl"
      >
        {selectedTemplate && (
          <div className="space-y-6">
            {/* Template info */}
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-xl border-2"
                style={{ 
                  backgroundColor: `${selectedTemplate.color}15`,
                  borderColor: `${selectedTemplate.color}30`
                }}
              >
                <selectedTemplate.icon 
                  className="h-6 w-6" 
                  style={{ color: selectedTemplate.color }}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{selectedTemplate.name}</h3>
                <p className="text-[var(--text-secondary)] mb-2">{selectedTemplate.description}</p>
                <div className="flex gap-2">
                  <Badge className={levelConfig[selectedTemplate.level].color}>
                    {levelConfig[selectedTemplate.level].label}
                  </Badge>
                  <Badge variant="outline">
                    {categoryLabels[selectedTemplate.category as keyof typeof categoryLabels]}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Permissions list */}
            <div>
              <h4 className="font-medium mb-3">Permisos incluidos ({selectedTemplate.permissions.length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedTemplate.permissions.map(perm => {
                  const info = getPermissionInfo(perm);
                  return (
                    <div key={perm} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-primary)]">
                      {info.found ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span className={cn(
                        "text-sm",
                        info.found ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] opacity-60"
                      )}>
                        {info.display}
                      </span>
                      <code className="text-xs bg-[var(--surface-secondary)] px-1 py-0.5 rounded ml-auto">
                        {perm}
                      </code>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  handleApplyTemplate(selectedTemplate);
                  setPreviewOpen(false);
                }}
                disabled={isNameTaken(selectedTemplate.name)}
                style={{ backgroundColor: selectedTemplate.color }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Aplicar plantilla
              </Button>
            </div>
          </div>
        )}
      </UnifiedModal>
    </div>
  );
}