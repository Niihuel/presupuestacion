"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCan } from "@/hooks/use-can";
import { PermissionWrapper } from "@/components/auth/permission-wrapper";
import {
  LayoutDashboard,
  Building2,
  Factory,
  Boxes,
  Truck,
  Users,
  ShieldCheck,
  SlidersHorizontal,
  PencilRuler,
  Bell,
  ClipboardPlus,
  FileText,
  Activity,
  ChevronDown,
  Component,
  Calculator,
  TrendingUp,
  Settings,
  Briefcase,
  Tags,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  id: string;
  title: string;
  icon: LucideIcon;
  href?: string;
  resource?: string;
  action?: string;
};

type NavSection = {
  id: string;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
};

const dropdownVariants = {
  closed: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: "easeInOut" as const
    }
  },
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const
    }
  }
};

const itemVariants = {
  closed: { opacity: 0, x: -10 },
  open: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.15
    }
  })
};

export function NavToolbar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const { can } = useCan();
  
  // Determinar la sección activa basada en la ruta
  const activeSection = React.useMemo(() => {
    if (pathname?.startsWith("/dashboard")) return "dashboard";
    if (pathname?.startsWith("/customers") || pathname?.startsWith("/projects") || 
        pathname?.startsWith("/plants") || pathname?.startsWith("/materials") || 
        pathname?.startsWith("/pieces") || pathname?.startsWith("/piece-families") || pathname?.startsWith("/trucks")) return "management";
    if (pathname?.startsWith("/budget") || pathname?.startsWith("/tracking")) return "budgeting";
    if (pathname?.startsWith("/users") || pathname?.startsWith("/roles") || 
        pathname?.startsWith("/parameters") || pathname?.startsWith("/designers") ||
        pathname?.startsWith("/adjustment-scales") || pathname?.startsWith("/polynomial-formula") ||
        pathname?.startsWith("/audit")) return "admin";
    return null;
  }, [pathname]);

  // Definir las secciones y sus elementos
  const navSections: NavSection[] = [
    {
      id: "management",
      title: "Gestión",
      icon: Briefcase,
      items: [
        { id: "customers", title: "Clientes", icon: Building2, href: "/customers", resource: "customers", action: "view" },
        { id: "projects", title: "Obras", icon: Boxes, href: "/projects", resource: "projects", action: "view" },
        { id: "plants", title: "Plantas", icon: Factory, href: "/plants", resource: "plants", action: "view" },
        { id: "materials", title: "Materiales", icon: Component, href: "/materials", resource: "materials", action: "view" },
        { id: "pieces", title: "Piezas", icon: Boxes, href: "/pieces", resource: "pieces", action: "view" },
        { id: "piece-families", title: "Familias de Piezas", icon: Tags, href: "/piece-families", resource: "piece-families", action: "view" },
        { id: "trucks", title: "Camiones", icon: Truck, href: "/trucks", resource: "trucks", action: "view" },
      ]
    },
    {
      id: "budgeting",
      title: "Presupuestación",
      icon: ClipboardPlus,
      items: [
        { id: "budget-wizard", title: "Nuevo Presupuesto", icon: ClipboardPlus, href: "/budget-wizard", resource: "budgets", action: "create" },
        { id: "budgets", title: "Presupuestos", icon: FileText, href: "/budgets", resource: "budgets", action: "view" },
        { id: "drafts", title: "Borradores", icon: FileText, href: "/budget/drafts", resource: "budgets", action: "view" },
        { id: "tracking", title: "Seguimientos", icon: Bell, href: "/tracking/calendar", resource: "projects", action: "view" },
      ]
    },
    {
      id: "admin",
      title: "Administración",
      icon: Settings,
      items: [
        { id: "users", title: "Usuarios", icon: Users, href: "/users", resource: "users", action: "view" },
        { id: "roles", title: "Roles y Permisos", icon: ShieldCheck, href: "/roles", resource: "roles", action: "view" },
        { id: "parameters", title: "Parámetros", icon: SlidersHorizontal, href: "/parameters", resource: "parameters", action: "view" },
        { id: "designers", title: "Diseñadores", icon: PencilRuler, href: "/designers", resource: "designers", action: "view" },
        { id: "adjustments", title: "Escalas de Ajuste", icon: TrendingUp, href: "/adjustment-scales", resource: "parameters", action: "view" },
        { id: "polynomials", title: "Fórmulas Polinómicas", icon: Calculator, href: "/polynomial-formula", resource: "parameters", action: "view" },
        { id: "audit", title: "Auditoría", icon: Activity, href: "/audit", resource: "audit", action: "view" },
      ]
    }
  ];

  // Filtrar secciones basado en permisos
  const visibleSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (!item.resource || !item.action) return true;
      try {
        return can.access(item.resource, item.action);
      } catch (error) {
        console.warn(`Error checking permission for ${item.resource}:${item.action}:`, error);
        return false;
      }
    })
  })).filter(section => section.items.length > 0);

  // Verificar si el usuario puede acceder al dashboard
  const canAccessDashboard = React.useMemo(() => {
    try {
      return can.access("dashboard", "view") || can.access("system", "view");
    } catch (error) {
      console.warn("Error checking dashboard permission:", error);
      return false;
    }
  }, [can]);

  const handleDropdownToggle = (sectionId: string) => {
    setActiveDropdown(activeDropdown === sectionId ? null : sectionId);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  React.useEffect(() => {
    const handleClick = () => closeDropdown();
    if (activeDropdown) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [activeDropdown]);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Dashboard link */}
      <PermissionWrapper resource="dashboard" action="view" fallback={<></>}>
        <Link href="/dashboard">
          <motion.button
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all duration-200",
              activeSection === "dashboard"
                ? "bg-[var(--accent-primary)] text-white shadow-lg"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-primary)]"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            // Add performance optimizations
            style={{
              willChange: 'transform',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden'
            }}
          >
            <LayoutDashboard size={14} className="lg:w-4 lg:h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </motion.button>
        </Link>
      </PermissionWrapper>

      {/* Navigation sections with dropdowns */}
      {visibleSections.map((section) => {
        const isActive = activeSection === section.id;
        const isOpen = activeDropdown === section.id;
        
        return (
          <div key={section.id} className="relative">
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                handleDropdownToggle(section.id);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-[var(--accent-primary)] text-white shadow-lg" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-primary)]"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              // Add performance optimizations
              style={{
                willChange: 'transform',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden'
              }}
            >
              <section.icon size={14} className="lg:w-4 lg:h-4" />
              <span className="hidden sm:inline">{section.title}</span>
              <ChevronDown 
                size={14} 
                className={cn(
                  "transition-transform duration-200 lg:w-4 lg:h-4", 
                  isOpen ? "transform rotate-180" : ""
                )} 
              />
            </motion.button>

            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.div
                  key={section.id}
                  className="absolute top-full left-0 mt-1 min-w-[200px] nav-dropdown glass-card p-2 z-50"
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={dropdownVariants}
                  style={{
                    position: 'absolute',
                    willChange: 'transform, opacity',
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                    transformOrigin: 'top center'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {section.items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      custom={i}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      variants={itemVariants}
                    >
                      <Link 
                        href={item.href || "#"} 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                        onClick={closeDropdown}
                      >
                        <item.icon size={16} />
                        <span>{item.title}</span>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default NavToolbar;