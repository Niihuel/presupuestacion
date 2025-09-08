"use client";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import { useState, useEffect } from "react";
import useSWR from "swr";
import axios from "axios";
import { signOut, useSession } from "next-auth/react";
import { Bell, User, LogOut } from "lucide-react";
import { NavToolbar } from "@/components/ui/nav-toolbar";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { PermissionWrapper } from "@/components/auth/permission-wrapper";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    // Leer usuario para validar rol asignado
    const { data: me } = useSWR('/api/auth/me', (url)=>axios.get(url).then(r=>r.data), { shouldRetryOnError: false });

    useEffect(()=>{
        if (me && !me.isSuperAdmin && !me.roleId) {
            router.replace('/no-permissions');
        }
    }, [me, router]);
    return (
        <div className="min-h-screen">
            {/* Navbar integrado con el background */}
            <header className="relative z-50">
                <nav className="px-4 pt-4">
                    <div className="container mx-auto">
                        <div className="flex items-center justify-between py-4">
                            {/* Logo */}
                            <div className="flex items-center">
                                <Image 
                                    src="/multimedia/logo.png" 
                                    alt="PRETENSA Logo" 
                                    width={140} 
                                    height={50} 
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            
                            {/* Navegación central - Desktop */}
                            <div className="hidden lg:flex items-center justify-center flex-1 px-8">
                                <NavToolbar />
                            </div>
                            
                            {/* Navegación móvil - Mobile */}
                            <div className="lg:hidden flex-1 flex justify-center">
                                <NavToolbar className="scale-90" />
                            </div>
                            
                            {/* Controles de usuario */}
                            <div className="flex items-center gap-3">
                                <ThemeToggle />
                                <PermissionWrapper resource="system" action="view" fallback={<></>}>
                                    <NotificationsMenu />
                                </PermissionWrapper>
                                <UserMenu />
                            </div>
                        </div>
                    </div>
                </nav>
            </header>
            
            {/* Contenido principal */}
            <main className="container mx-auto px-4 pb-8">
                {children}
            </main>
        </div>
    );
}

function NotificationsMenu(){
	const [open, setOpen] = useState(false);
	const { data, mutate, error } = useSWR('/api/dashboard/alerts', (url)=>axios.get(url).then(r=>r.data), {
		refreshInterval: 10000,
		onError: (err) => {
			// Silently handle permission errors for notifications
			if (err?.response?.status === 403) {
				console.debug("User doesn't have permission to view notifications");
			}
		}
	});
	const items = data?.items ?? [];

	// If there's a permission error, don't show the notification menu
	if (error?.response?.status === 403) {
		return null;
	}
	async function onOpen(){
		const next = !open;
		setOpen(next);
		if(next){
			await axios.post('/api/dashboard/alerts');
			mutate();
		}
	}
	return (
		<div className="relative ml-2">
			<button onClick={onOpen} className="flex items-center gap-2 rounded-full px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
				<Bell size={16} />
				{items.filter((i:any)=>!i.read).length>0 && !open && (
					<span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white">{items.filter((i:any)=>!i.read).length}</span>
				)}
			</button>
			{open && (
				<div className="absolute right-0 mt-2 w-72 rounded-xl border border-white/30 dark:border-white/15 bg-white/60 dark:bg-black/50 backdrop-blur-xl p-2 shadow-lg" role="menu">
					<div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">Notificaciones</div>
					<div className="max-h-64 overflow-auto text-sm space-y-2">
						{items.length ? items.map((a:any)=> (
							<a key={a.id} href="/audit" className="block px-3 py-2 rounded-lg hover:bg-gray-100/60 dark:hover:bg-white/10">
								<div className="font-medium">{a.level?.toUpperCase?.() ?? 'INFO'}</div>
								<div className="text-gray-600 dark:text-gray-300">{a.message}</div>
							</a>
						)) : <div className="px-3 py-2 text-gray-500">Sin alertas</div>}
					</div>
				</div>
			)}
		</div>
	);
}

function UserMenu(){
	const [open, setOpen] = useState(false);
	const { data: session } = useSession();
	const { data } = useSWR('/api/auth/me', (url)=>axios.get(url).then(r=>r.data), { shouldRetryOnError: false });
	const user = data?.user;
	const sessionUser = session?.user;
	const initial = (user?.name?.trim()?.charAt(0) || sessionUser?.name?.trim()?.charAt(0) || user?.email?.trim()?.charAt(0) || sessionUser?.email?.trim()?.charAt(0) || 'U').toUpperCase();
	const hasImage = Boolean(user?.image) || Boolean(sessionUser?.image && (user?.provider === 'google' || sessionUser?.provider === 'google'));
	const isGoogleUser = user?.provider === 'google' || sessionUser?.provider === 'google';
	
	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClick = () => setOpen(false);
		if (open) {
			document.addEventListener('click', handleClick);
			return () => document.removeEventListener('click', handleClick);
		}
	}, [open]);
	
	return (
		<div className="relative ml-2">
			<motion.button 
				onClick={(e) => {
					e.stopPropagation();
					setOpen(o => !o);
				}} 
				className={cn(
					"flex items-center gap-2 rounded-xl p-2 transition-all duration-200",
					"hover:bg-[var(--surface-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
				)}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
			>
				{hasImage || (isGoogleUser && sessionUser?.image) ? (
					<Image
						src={(user?.image || sessionUser?.image) as string}
						alt={user?.name || sessionUser?.name || 'Usuario'}
						width={32}
						height={32}
						className="rounded-lg border border-[var(--surface-border)] shadow-sm"
					/>
				) : (
					<div className="h-8 w-8 rounded-lg border border-[var(--surface-border)] bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] shadow-sm flex items-center justify-center">
						<span className="text-xs font-semibold text-white">{initial}</span>
					</div>
				)}
			</motion.button>
			
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -10, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -10, scale: 0.95 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className="absolute right-0 mt-2 min-w-[200px] glass-card p-2 z-50 shadow-xl"
						onClick={(e) => e.stopPropagation()}
					>
						{/* User info section */}
						<div className="px-3 py-2 border-b border-[var(--surface-border)] mb-2">
							<div className="text-sm font-medium text-[var(--text-primary)]">{user?.name ?? sessionUser?.name ?? 'Usuario'}</div>
							<div className="text-xs text-[var(--text-secondary)]">{user?.email ?? sessionUser?.email ?? ''}</div>
							{isGoogleUser && (
								<div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
									Cuenta Google
								</div>
							)}
						</div>
						
						{/* Menu items */}
						<motion.div
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.05, duration: 0.15 }}
						>
							<Link
								href="/account"
								className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
								onClick={() => setOpen(false)}
							>
								<User size={16} />
								<span>Mi cuenta</span>
							</Link>
						</motion.div>
						
						<motion.div
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.08, duration: 0.15 }}
						>
							<button 
								onClick={() => {
									setOpen(false);
									signOut({ callbackUrl: '/login' });
								}} 
								className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-[var(--text-secondary)] hover:text-[var(--accent-danger)] hover:bg-red-50/80 dark:hover:bg-red-950/30"
							>
								<LogOut size={16} />
								<span>Cerrar sesión</span>
							</button>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
