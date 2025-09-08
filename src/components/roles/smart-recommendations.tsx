"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Shield, 
  Users, 
  Zap,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Plus,
  ArrowRight,
  Sparkles,
  Target,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

interface User {
  id: string;
  name: string;
  roleId?: string;
  department?: string;
  position?: string;
}

interface Recommendation {
  id: string;
  type: "PERMISSION_GRANT" | "PERMISSION_REVOKE" | "ROLE_CREATION" | "ROLE_MERGE" | "SECURITY_IMPROVEMENT";
  priority: "HIGH" | "MEDIUM" | "LOW";
  confidence: number; // 0-100
  title: string;
  description: string;
  reasoning: string[];
  impact: "SECURITY" | "EFFICIENCY" | "COMPLIANCE" | "OPTIMIZATION";
  affected: {
    roleIds?: string[];
    userIds?: string[];
    permissionIds?: string[];
  };
  action: {
    type: string;
    payload: any;
  };
  estimatedBenefit: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

interface SmartRecommendationsProps {
  roles: Role[];
  permissions: Record<string, Permission[]>;
  users: User[];
  auditData?: any[];
  onApplyRecommendation: (recommendation: Recommendation) => void;
  onDismissRecommendation: (recommendationId: string) => void;
}

export function SmartRecommendations({
  roles,
  permissions,
  users,
  auditData = [],
  onApplyRecommendation,
  onDismissRecommendation
}: SmartRecommendationsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(new Set());

  // ML-style recommendation engine
  const recommendations = useMemo((): Recommendation[] => {
    const recs: Recommendation[] = [];
    const allPermissions = Object.values(permissions).flat();

    // 1. Security Analysis - Over-privileged roles
    const overPrivilegedRoles = roles.filter(role => {
      const permissionCount = role.permissions.length;
      const totalPermissions = allPermissions.length;
      return permissionCount > totalPermissions * 0.7; // More than 70% of all permissions
    });

    overPrivilegedRoles.forEach(role => {
      recs.push({
        id: `overprivileged_${role.id}`,
        type: "PERMISSION_REVOKE",
        priority: "HIGH",
        confidence: 85,
        title: `Reducir permisos del rol "${role.name}"`,
        description: `El rol tiene ${role.permissions.length} permisos, lo que puede representar un riesgo de seguridad.`,
        reasoning: [
          "Principio de menor privilegio violado",
          "Superficie de ataque aumentada",
          "Riesgo de uso indebido elevado"
        ],
        impact: "SECURITY",
        affected: { roleIds: [role.id] },
        action: {
          type: "REVIEW_ROLE_PERMISSIONS",
          payload: { roleId: role.id }
        },
        estimatedBenefit: "Reducción del 40% en superficie de ataque",
        riskLevel: "HIGH"
      });
    });

    // 2. Efficiency Analysis - Similar roles that can be merged
    const rolePairs = [];
    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const role1 = roles[i];
        const role2 = roles[j];
        
        const permissions1 = new Set(role1.permissions.map(p => p.id));
        const permissions2 = new Set(role2.permissions.map(p => p.id));
        
        const intersection = new Set([...permissions1].filter(x => permissions2.has(x)));
        const union = new Set([...permissions1, ...permissions2]);
        
        const similarity = intersection.size / union.size;
        
        if (similarity > 0.8 && similarity < 1.0) { // 80-99% similar
          rolePairs.push({ role1, role2, similarity });
        }
      }
    }

    rolePairs.forEach(({ role1, role2, similarity }) => {
      recs.push({
        id: `merge_${role1.id}_${role2.id}`,
        type: "ROLE_MERGE",
        priority: "MEDIUM",
        confidence: Math.round(similarity * 100),
        title: `Considerar fusionar "${role1.name}" y "${role2.name}"`,
        description: `Los roles tienen ${Math.round(similarity * 100)}% de similitud en permisos.`,
        reasoning: [
          "Eliminación de duplicación",
          "Simplificación de gestión",
          "Reducción de complejidad operativa"
        ],
        impact: "EFFICIENCY",
        affected: { roleIds: [role1.id, role2.id] },
        action: {
          type: "MERGE_ROLES",
          payload: { sourceRoleId: role1.id, targetRoleId: role2.id }
        },
        estimatedBenefit: "Reducción del 30% en tiempo de gestión",
        riskLevel: "LOW"
      });
    });

    // 3. Coverage Analysis - Uncovered critical permissions
    const criticalResources = ['users', 'roles', 'permissions', 'system'];
    const criticalActions = ['view', 'create', 'edit', 'delete'];
    
    const criticalPermissions = allPermissions.filter(p => 
      criticalResources.includes(p.resource) && criticalActions.includes(p.action)
    );

    const uncoveredCritical = criticalPermissions.filter(p => 
      !roles.some(role => role.permissions.some(rp => rp.id === p.id))
    );

    if (uncoveredCritical.length > 0) {
      recs.push({
        id: `uncovered_critical`,
        type: "ROLE_CREATION",
        priority: "HIGH",
        confidence: 90,
        title: `Crear rol para permisos críticos sin asignar`,
        description: `${uncoveredCritical.length} permisos críticos no están asignados a ningún rol.`,
        reasoning: [
          "Permisos críticos sin cobertura",
          "Gestión de acceso incompleta",
          "Posibles brechas de seguridad"
        ],
        impact: "SECURITY",
        affected: { permissionIds: uncoveredCritical.map(p => p.id) },
        action: {
          type: "CREATE_ADMIN_ROLE",
          payload: { permissionIds: uncoveredCritical.map(p => p.id) }
        },
        estimatedBenefit: "Cobertura completa de permisos críticos",
        riskLevel: "MEDIUM"
      });
    }

    // 4. Department-based role suggestions
    const departmentGroups = Array.isArray(users) ? users.reduce((acc, user) => {
      if (user.department) {
        if (!acc[user.department]) acc[user.department] = [];
        acc[user.department].push(user);
      }
      return acc;
    }, {} as Record<string, User[]>) : {};

    Object.entries(departmentGroups).forEach(([department, deptUsers]) => {
      if (deptUsers.length >= 3) { // Only suggest for departments with 3+ users
        const commonRoles = roles.filter(role => 
          deptUsers.filter(user => user.roleId === role.id).length >= 2
        );

        if (commonRoles.length === 0) {
          recs.push({
            id: `department_role_${department}`,
            type: "ROLE_CREATION",
            priority: "MEDIUM",
            confidence: 75,
            title: `Crear rol específico para ${department}`,
            description: `El departamento ${department} tiene ${deptUsers.length} usuarios sin un rol específico.`,
            reasoning: [
              "Usuarios de departamento sin rol específico",
              "Oportunidad de estandarización",
              "Mejora en gestión de permisos"
            ],
            impact: "EFFICIENCY",
            affected: { userIds: deptUsers.map(u => u.id) },
            action: {
              type: "CREATE_DEPARTMENT_ROLE",
              payload: { department, userIds: deptUsers.map(u => u.id) }
            },
            estimatedBenefit: "Estandarización del 100% del departamento",
            riskLevel: "LOW"
          });
        }
      }
    });

    // 5. Unused permissions cleanup
    const usedPermissionIds = new Set(
      roles.flatMap(role => role.permissions.map(p => p.id))
    );
    const unusedPermissions = allPermissions.filter(p => !usedPermissionIds.has(p.id));

    if (unusedPermissions.length > 5) {
      recs.push({
        id: `cleanup_unused`,
        type: "SECURITY_IMPROVEMENT",
        priority: "LOW",
        confidence: 70,
        title: `Revisar ${unusedPermissions.length} permisos sin usar`,
        description: "Hay permisos que no están asignados a ningún rol y pueden eliminarse.",
        reasoning: [
          "Reducción de complejidad",
          "Eliminación de confusión",
          "Limpieza de sistema"
        ],
        impact: "OPTIMIZATION",
        affected: { permissionIds: unusedPermissions.map(p => p.id) },
        action: {
          type: "REVIEW_UNUSED_PERMISSIONS",
          payload: { permissionIds: unusedPermissions.map(p => p.id) }
        },
        estimatedBenefit: "Simplificación del sistema",
        riskLevel: "LOW"
      });
    }

    // 6. Role assignment optimization
    const usersWithoutRoles = Array.isArray(users) ? users.filter(user => !user.roleId) : [];
    if (usersWithoutRoles.length > 0) {
      recs.push({
        id: `assign_roles`,
        type: "SECURITY_IMPROVEMENT",
        priority: "HIGH",
        confidence: 95,
        title: `Asignar roles a ${usersWithoutRoles.length} usuarios`,
        description: "Hay usuarios sin roles asignados, lo que puede ser un riesgo de seguridad.",
        reasoning: [
          "Control de acceso incompleto",
          "Usuarios sin restricciones",
          "Violación de políticas de seguridad"
        ],
        impact: "SECURITY",
        affected: { userIds: usersWithoutRoles.map(u => u.id) },
        action: {
          type: "ASSIGN_DEFAULT_ROLES",
          payload: { userIds: usersWithoutRoles.map(u => u.id) }
        },
        estimatedBenefit: "Control completo de acceso",
        riskLevel: "HIGH"
      });
    }

    return recs.filter(rec => !dismissedRecommendations.has(rec.id));
  }, [roles, permissions, users, dismissedRecommendations]);

  // Filter recommendations by category
  const filteredRecommendations = useMemo(() => {
    if (!selectedCategory) return recommendations;
    return recommendations.filter(rec => rec.impact === selectedCategory);
  }, [recommendations, selectedCategory]);

  // Recommendation categories
  const categories = [
    { id: "SECURITY", label: "Seguridad", icon: Shield, color: "text-red-600" },
    { id: "EFFICIENCY", label: "Eficiencia", icon: Zap, color: "text-blue-600" },
    { id: "COMPLIANCE", label: "Cumplimiento", icon: CheckCircle2, color: "text-green-600" },
    { id: "OPTIMIZATION", label: "Optimización", icon: Target, color: "text-purple-600" }
  ];

  // Priority configuration
  const priorityConfig = {
    HIGH: { label: "Alta", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
    MEDIUM: { label: "Media", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
    LOW: { label: "Baja", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" }
  };

  // Risk configuration
  const riskConfig = {
    HIGH: { label: "Alto", color: "text-red-600" },
    MEDIUM: { label: "Medio", color: "text-yellow-600" },
    LOW: { label: "Bajo", color: "text-green-600" }
  };

  const handleApplyRecommendation = (recommendation: Recommendation) => {
    onApplyRecommendation(recommendation);
    toast.success(`Recomendación aplicada: ${recommendation.title}`);
  };

  const handleDismissRecommendation = (recommendationId: string) => {
    setDismissedRecommendations(prev => new Set([...prev, recommendationId]));
    onDismissRecommendation(recommendationId);
    toast.info("Recomendación descartada");
  };

  const runAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate analysis time
    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success("Análisis completado");
    }, 2000);
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                Recomendaciones Inteligentes
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </h2>
              <p className="text-[var(--text-secondary)] mt-1">
                Sugerencias automatizadas basadas en análisis de patrones y mejores prácticas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-lg font-bold text-[var(--text-primary)]">
                {recommendations.length}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                recomendaciones
              </div>
            </div>
            <Button onClick={runAnalysis} disabled={isAnalyzing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isAnalyzing && "animate-spin")} />
              {isAnalyzing ? "Analizando..." : "Analizar"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Category filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Todas ({recommendations.length})
            </Button>
            {categories.map(category => {
              const count = recommendations.filter(r => r.impact === category.id).length;
              const CategoryIcon = category.icon;
              
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-1"
                >
                  <CategoryIcon className="h-3 w-3" />
                  {category.label} ({count})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations list */}
      <div className="space-y-4">
        {isAnalyzing ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 animate-pulse text-purple-600" />
              <span>Ejecutando análisis de patrones...</span>
            </div>
          </div>
        ) : filteredRecommendations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Lightbulb className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              {selectedCategory ? "Sin recomendaciones en esta categoría" : "No hay recomendaciones"}
            </h3>
            <p className="text-[var(--text-secondary)]">
              {selectedCategory 
                ? "Tu sistema está optimizado en esta área"
                : "Tu configuración de roles y permisos está bien optimizada"
              }
            </p>
          </motion.div>
        ) : (
          filteredRecommendations.map((recommendation, index) => {
            const priorityInfo = priorityConfig[recommendation.priority];
            const riskInfo = riskConfig[recommendation.riskLevel];
            
            return (
              <motion.div
                key={recommendation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-card hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Priority indicator */}
                      <div className={cn(
                        "w-2 h-full rounded-full",
                        recommendation.priority === "HIGH" ? "bg-red-500" :
                        recommendation.priority === "MEDIUM" ? "bg-yellow-500" : "bg-green-500"
                      )} />
                      
                      <div className="flex-1 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                                {recommendation.title}
                              </h3>
                              <Badge className={priorityInfo.color}>
                                {priorityInfo.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {recommendation.confidence}% confianza
                              </Badge>
                            </div>
                            <p className="text-[var(--text-secondary)] mb-3">
                              {recommendation.description}
                            </p>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-sm mb-2">Justificación</h4>
                            <ul className="space-y-1">
                              {recommendation.reasoning.map((reason, idx) => (
                                <li key={idx} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                                  <ArrowRight className="h-3 w-3 mt-0.5 text-blue-500" />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[var(--text-secondary)]">Beneficio estimado:</span>
                              <span className="font-medium">{recommendation.estimatedBenefit}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[var(--text-secondary)]">Nivel de riesgo:</span>
                              <span className={cn("font-medium", riskInfo.color)}>
                                {riskInfo.label}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[var(--text-secondary)]">Impacto:</span>
                              <Badge variant="outline">{recommendation.impact}</Badge>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2 border-t border-[var(--surface-border)]">
                          <Button
                            onClick={() => handleApplyRecommendation(recommendation)}
                            className="btn-primary"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Aplicar recomendación
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleDismissRecommendation(recommendation.id)}
                          >
                            Descartar
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver detalles
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}