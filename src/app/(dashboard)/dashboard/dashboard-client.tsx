"use client";

import { useOptimizedSWR } from "@/hooks/use-optimized-swr";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, AreaChart, Area } from "recharts";
import { ClipboardPlus, Users, FolderOpen, SlidersHorizontal, Cpu, MemoryStick, Activity, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { motion } from "framer-motion";
import * as React from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { PermissionWrapper } from "@/components/auth/permission-wrapper";
import { useCan } from "@/hooks/use-can";
import { useUnifiedPermissionError } from "@/hooks/use-unified-permission-error";

const fetcher = (url: string) => axios.get(url).then(r=>r.data);

export default function DashboardClient() {
	const searchParams = useSearchParams();
	const { can } = useCan();
	const { handlePermissionError, PermissionErrorModal } = useUnifiedPermissionError();

	React.useEffect(() => {
		const source = searchParams.get("source");
		if (source === "google-login") {
			toast.success("Inicio de sesión exitoso", {
				description: "Has iniciado sesión con tu cuenta de Google.",
			});
		} else if (source === "google-register") {
			toast.success("Registro con Google exitoso", {
				description: "Tu cuenta ha sido creada y está pendiente de aprobación.",
			});
		}
	}, [searchParams]);

	const kpi = useOptimizedSWR(`/api/dashboard/metrics`, fetcher).data ?? {};
	const cmp = useOptimizedSWR(`/api/reports/monthly-comparison`, fetcher).data ?? {};
	const prices = useOptimizedSWR(`/api/reports/price-evolution`, fetcher).data ?? [];

	const kpiChart = [
		{ name: "Aprobados", value: kpi.accepted ?? 0 },
		{ name: "Rechazados", value: kpi.rejected ?? 0 },
		{ name: "Pendientes", value: kpi.pending ?? 0 },
	];
	const priceChart = (prices as any[]).slice(-12).map((p) => ({
		date: new Date(p.effectiveDate).toLocaleDateString(),
		price: p.price,
	}));

	const spark = priceChart.length ? priceChart : [
		{ date: "-1", price: (cmp.previousMonth ?? 0) },
		{ date: "0", price: (cmp.currentMonth ?? 0) },
	];

	const stackedByStatus = [
		{
			month: "Actual",
			Aprobados: kpi.accepted ?? 0,
			Rechazados: kpi.rejected ?? 0,
			Pendientes: kpi.pending ?? 0,
		},
	];
	const conversionRate = kpi.totalBudgets ? ((kpi.accepted ?? 0) / (kpi.totalBudgets || 1)) * 100 : 0;
	const avgTicket = (kpi.avgTicket ?? 0);
	
	return (
		<PageTransition>
			{/* Modern Header */}
			<motion.div 
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2 }}
				className="glass-card p-6 mb-6"
			>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Dashboard</h1>
						<p className="text-[var(--text-secondary)]">
							Overview of your business metrics and recent activity
						</p>
					</div>
					<motion.div
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
					>
						<Link 
							href="/budget-wizard" 
							className="bg-[var(--accent-primary)] text-white flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:bg-[var(--accent-primary-hover)]"
						>
							<ClipboardPlus size={18} className="mr-2" />
							Nuevo Presupuesto
						</Link>
					</motion.div>
				</div>
			</motion.div>

			{/* Enhanced KPI Cards */}
			<motion.div 
				className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2, delay: 0.1 }}
			>
				<KPICard 
					title="Total Presupuestos" 
					value={kpi.totalBudgets ?? 0}
					sparkData={spark}
					color="#4A9FE8"
					index={0}
				/>
				<KPICard 
					title="Aprobados" 
					value={kpi.accepted ?? 0}
					sparkData={spark}
					color="#22c55e"
					trend={kpi.accepted > (kpi.totalBudgets - kpi.accepted) / 2 ? 'up' : 'down'}
					index={1}
				/>
				<KPICard 
					title="Rechazados" 
					value={kpi.rejected ?? 0}
					sparkData={spark}
					color="#ef4444"
					trend={kpi.rejected > 0 ? 'down' : 'neutral'}
					index={2}
				/>
				<KPICard 
					title="Pendientes" 
					value={kpi.pending ?? 0}
					sparkData={spark}
					color="#f59e0b"
					index={3}
				/>
				<KPICard 
					title="Tasa de conversión" 
					value={`${conversionRate.toFixed(1)}%`}
					sparkData={spark}
					color="#22c55e"
					trend={conversionRate > 70 ? 'up' : conversionRate > 50 ? 'neutral' : 'down'}
					index={4}
				/>
				<KPICard 
					title="Ticket medio" 
					value={`$${avgTicket?.toLocaleString?.() ?? avgTicket}`}
					sparkData={spark}
					color="#60a5fa"
					trend={'up'}
					index={5}
				/>
			</motion.div>

			{/* Main Content Grid */}
			<motion.div 
				className="grid lg:grid-cols-3 gap-6 mb-6"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2, delay: 0.2 }}
			>
				{/* Mini Kanban - Takes 2 columns */}
				<motion.div 
					className="lg:col-span-2"
					whileHover={{ y: -2 }}
					transition={{ duration: 0.2 }}
				>
					<div className="glass-card p-6 h-full">
						<div className="flex items-center justify-between mb-6">
							<div>
								<h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">Presupuestos en Proceso</h2>
								<p className="text-sm text-[var(--text-secondary)]">Vista rápida del flujo de trabajo</p>
							</div>
							<Link 
								href="/budgets/drafts" 
								className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] font-medium transition-colors"
							>
								Ver todos →
							</Link>
						</div>
						<MiniKanban />
					</div>
				</motion.div>

				{/* Upcoming Trackings */}
				<motion.div 
					whileHover={{ y: -2 }}
					transition={{ duration: 0.2 }}
				>
					<div className="glass-card p-6 h-full">
						<div className="mb-6">
							<h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">Próximos Seguimientos</h2>
							<p className="text-sm text-[var(--text-secondary)]">Eventos programados</p>
						</div>
						<UpcomingTrackings limit={5} />
					</div>
				</motion.div>
			</motion.div>

			{/* Quick Actions */}
			<motion.div 
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2, delay: 0.3 }}
				className="mb-12"
			>
				<div className="glass-card p-6 overflow-hidden border border-[var(--accent-primary)]/10 mb-8">
					{/* Section header with icon */}
					<div className="flex items-center gap-3 mb-6">
						<div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
							<Zap className="h-6 w-6 text-[var(--accent-primary)]" />
						</div>
						<div>
							<h2 className="text-xl font-semibold text-[var(--text-primary)]">Acciones Rápidas</h2>
							<p className="text-sm text-[var(--text-secondary)]">Accesos directos a las funciones más utilizadas</p>
						</div>
					</div>

					{/* Decorative divider */}
					<div className="relative mb-6">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-[var(--surface-border)]"></div>
						</div>
						<div className="relative flex justify-start">
							<span className="bg-[var(--surface-primary)] pr-2 text-sm text-[var(--text-secondary)]">Seleccione una acción</span>
						</div>
					</div>

					{/* Action cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<PermissionWrapper resource="budgets" action="create">
							<QuickActionCard 
								href="/budget-wizard"
								icon={ClipboardPlus}
								title="Nuevo presupuesto"
								description="Inicia el flujo de 6 pasos"
								color="var(--accent-primary)"
								index={0}
							/>
						</PermissionWrapper>
						<PermissionWrapper resource="customers" action="view">
							<QuickActionCard 
								href="/customers"
								icon={Users}
								title="Clientes"
								description="Gestiona clientes"
								color="#22c55e"
								index={1}
							/>
						</PermissionWrapper>
						<PermissionWrapper resource="projects" action="view">
							<QuickActionCard 
								href="/projects"
								icon={FolderOpen}
								title="Obras"
								description="Obras y archivos"
								color="#f59e0b"
								index={2}
							/>
						</PermissionWrapper>
						<PermissionWrapper resource="parameters" action="view">
							<QuickActionCard 
								href="/parameters"
								icon={SlidersHorizontal}
								title="Parámetros"
								description="Precios y ajustes"
								color="#8b5cf6"
								index={3}
							/>
						</PermissionWrapper>
					</div>
				</div>
			</motion.div>

			{/* Recent Events */}
			<PermissionWrapper resource="system" action="view">
				<motion.div 
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2, delay: 0.4 }}
				>
					<div className="glass-card p-6">
						<div className="flex items-center justify-between mb-6">
							<div>
								<h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">Eventos recientes</h2>
								<p className="text-sm text-[var(--text-secondary)]">Actividad del sistema</p>
							</div>
							<a 
								href="/audit" 
								className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] font-medium transition-colors"
							>
								Ver todo →
							</a>
						</div>
						<EventsTable onError={handlePermissionError} />
					</div>
				</motion.div>
			</PermissionWrapper>
			
			{/* Modal de errores de permisos */}
			<PermissionErrorModal />
		</PageTransition>
	);
}

// Modern KPI Card Component
function KPICard({ 
  title, 
  value, 
  sparkData, 
  color, 
  trend, 
  index 
}: { 
  title: string;
  value: string | number;
  sparkData: any[];
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  index: number;
}) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={16} className="text-green-500" />;
    if (trend === 'down') return <TrendingDown size={16} className="text-red-500" />;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <div className="glass-card p-6 h-full transition-all duration-200 hover:shadow-lg hover:border-[var(--accent-primary)]/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
            {title}
          </h3>
          {getTrendIcon()}
        </div>
        
        {/* Value */}
        <div className="flex items-end justify-between mb-4">
          <motion.div 
            className="text-3xl font-bold text-[var(--text-primary)]"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 + 0.1 }}
          >
            {value}
          </motion.div>
        </div>
        
        {/* Sparkline */}
        <div className="h-12 w-full opacity-80 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <Area 
                dataKey="price" 
                stroke={color} 
                fill={`url(#gradient-${index})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Subtle indicator bar */}
        <motion.div 
          className="h-1 rounded-full mt-3"
          style={{ backgroundColor: color }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
        />
      </div>
    </motion.div>
  );
}

// Quick Action Card Component
function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  color,
  index
}: {
  href: string;
  icon: any;
  title: string;
  description: string;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={href} className="block group">
        <div className="glass-card p-6 h-full transition-all duration-200 hover:shadow-lg hover:border-[var(--accent-primary)]/20">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <motion.div 
              className="p-3 rounded-xl transition-all duration-200"
              style={{ 
                backgroundColor: `${color}15`,
                border: `1px solid ${color}30`
              }}
              whileHover={{ 
                backgroundColor: `${color}25`,
                scale: 1.1 
              }}
            >
              <Icon 
                size={20} 
                style={{ color }}
                className="transition-transform duration-200 group-hover:scale-110"
              />
            </motion.div>
            
            {/* Content */}
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-primary)] transition-colors">
                {title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {description}
              </p>
            </div>
          </div>
          
          {/* Hover indicator */}
          <motion.div 
            className="h-0.5 rounded-full mt-4 transition-all duration-200"
            style={{ backgroundColor: color }}
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: 1 }}
          />
        </div>
      </Link>
    </motion.div>
  );
}

// Existing components with minor styling improvements
function EventsTable({ onError }: { onError?: (error: any, context?: string) => void }){
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const { data, isLoading, error } = useOptimizedSWR(`/api/dashboard/changes?page=${page}&pageSize=${pageSize}`, fetcher, {
    onError: (err) => {
      if (onError) {
        onError(err, "Ver registros de auditoría");
      }
    }
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  // Si hay error de permisos, no mostrar nada
  if (error?.response?.status === 403) {
    return (
      <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
        No tienes permisos para ver los registros de auditoría
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="overflow-x-auto border rounded-md bg-white dark:bg-transparent">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-900"><tr><th className="text-left p-2">Fecha</th><th className="text-left p-2">Evento</th></tr></thead>
          <tbody>
            {isLoading ? (<tr><td className="p-2">Cargando...</td></tr>) : (items.length ? items.map((it:any)=> (
              <tr key={it.id} className="border-t"><td className="p-2">{new Date(it.at).toLocaleString()}</td><td className="p-2">{it.message}</td></tr>
            )) : (<tr><td className="p-2">Sin datos</td></tr>))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2 p-2 text-sm">
        <button className="px-3 py-1 rounded border" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Anterior</button>
        <span>Página {page}</span>
        <button className="px-3 py-1 rounded border" disabled={(page*pageSize)>=total} onClick={()=>setPage(p=>p+1)}>Siguiente</button>
      </div>
    </div>
  );
}

function MiniKanban(){
  const { data, error, isLoading } = useOptimizedSWR('/api/budgets/drafts/summary', fetcher);

  // Si hay error de permisos, mostrar mensaje simple
  if (error?.response?.status === 403) {
    return (
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
        No tienes permisos para ver presupuestos
      </div>
    );
  }

  const summaryData = data ?? {};

  return (
    <div className="flex gap-2 overflow-x-auto">
      {[1,2,3,4,5,6].map((step)=> (
        <div key={step} className="min-w-[140px]">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Paso {step}</div>
          <div className="space-y-1">
            {(summaryData[step]??[]).slice(0,3).map((d:any)=> (
              <Link key={d.id} href={`/budgets/drafts`} className="block p-2 bg-gray-100 dark:bg-neutral-900 rounded text-xs">
                <div className="font-medium truncate">{d.customerName ?? '—'}</div>
                <div className="text-gray-500 dark:text-gray-400">{new Date(d.lastEditedAt).toLocaleDateString()}</div>
              </Link>
            ))}
            {(summaryData[step]?.length ?? 0) > 3 && (
              <Link href="/budgets/drafts" className="text-xs underline">+{(summaryData[step]?.length ?? 0) - 3} más</Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function UpcomingTrackings({ limit = 5 }: { limit?: number }){
  const { data, error } = useOptimizedSWR('/api/tracking/events', fetcher);

  // Si hay error de permisos, mostrar mensaje simple
  if (error?.response?.status === 403) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4">
        No tienes permisos para ver seguimientos
      </div>
    );
  }

  const items = (data?.items ?? []) as any[];
  const future = items.filter(i=> new Date(i.scheduledDate) >= new Date()).slice(0, limit);

  return (
    <div className="text-sm space-y-2">
      {future.map(t => (
        <div key={t.id} className="flex items-center justify-between">
          <div className="truncate">{t.project?.name ?? 'Proyecto'} - {t.type}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(t.scheduledDate).toLocaleString()}</div>
        </div>
      ))}
      {!future.length && <div className="text-sm text-muted-foreground">Sin próximos seguimientos</div>}
    </div>
  );
}