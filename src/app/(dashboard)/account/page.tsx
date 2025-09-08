"use client";

import * as React from "react";
import useSWR from "swr";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Calendar,
  Save,
  Edit,
  Key,
  AlertCircle,
  CheckCircle2,
  Settings,
  Camera,
  Upload
} from "lucide-react";
import { PageTransition, SectionTransition, CardTransition } from "@/components/ui/page-transition";

// Schema de validación para actualizar perfil
const profileUpdateSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirma la nueva contraseña"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const fetcher = (url: string) => axios.get(url).then(r => r.data);

export default function AccountPage() {
  const { data: session, status } = useSession();
  const { data: me, mutate, error, isLoading } = useSWR('/api/auth/me', fetcher, {
    onError: (err) => {
      console.error('Error loading user data:', err);
    },
    onSuccess: (data) => {
      console.log('User data loaded successfully:', data);
    }
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'profile' | 'security' | 'preferences'>('profile');

  const user = me;
  const profile = me?.profile;
  const sessionUser = session?.user;

  // Formulario de perfil
  const profileForm = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      department: '',
      position: '',
    }
  });

  // Formulario de contraseña
  const passwordForm = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  // Actualizar valores del formulario cuando cambie el usuario
  React.useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || '',
      });
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (values: any) => {
    try {
      await axios.put('/api/auth/profile', values);
      toast.success('Perfil actualizado correctamente');
      setIsEditing(false);
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar el perfil');
    }
  };

  const onPasswordSubmit = async (values: any) => {
    try {
      await axios.put('/api/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Contraseña actualizada correctamente');
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar la contraseña');
    }
  };

  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
        <AlertCircle className="h-3 w-3" />
        <span>{error}</span>
      </div>
    );
  };

  console.log('AccountPage render:', {
    sessionStatus: status,
    hasSessionUser: !!sessionUser,
    isLoading,
    hasUser: !!user,
    hasError: !!error
  });

  if (status === 'loading') {
    return (
      <PageTransition>
        <div className="min-h-[60vh] grid place-items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
            <p className="text-[var(--text-secondary)]">Verificando sesión...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <PageTransition>
        <div className="min-h-[60vh] grid place-items-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Sesión expirada
            </h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Tu sesión ha expirado. Por favor, inicia sesión nuevamente.
            </p>
            <Button onClick={() => window.location.href = '/login'}>
              Ir al login
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-[60vh] grid place-items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
            <p className="text-[var(--text-secondary)]">Cargando información completa del usuario...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    console.error('Error en la página de cuenta:', error);
    return (
      <PageTransition>
        <div className="min-h-[60vh] grid place-items-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Error al cargar la información del usuario
            </h2>
            <p className="text-[var(--text-secondary)] mb-4">
              {error?.response?.data?.error || error?.message || 'Error desconocido'}
            </p>
            <Button onClick={() => mutate()}>
              Intentar nuevamente
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Si no hay usuario de la API pero hay sesión, mostrar información básica
  if (!user && sessionUser) {
    return (
      <PageTransition>
        <div className="min-h-[60vh] grid place-items-center">
          <div className="text-center">
            <div className="text-yellow-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Información limitada disponible
            </h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Solo se pudo cargar información básica de la sesión. Algunas funciones pueden estar limitadas.
            </p>
            <div className="bg-[var(--surface-secondary)] p-4 rounded-lg mb-4">
              <p className="text-sm text-[var(--text-primary)]">
                <strong>Email:</strong> {sessionUser.email}
              </p>
              {sessionUser.name && (
                <p className="text-sm text-[var(--text-primary)] mt-1">
                  <strong>Nombre:</strong> {sessionUser.name}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => mutate()}>
                Intentar cargar información completa
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await axios.get('/api/auth/session-debug');
                    console.log('Session debug:', response.data);
                    alert('Revisa la consola del navegador para ver los detalles de la sesión');
                  } catch (error) {
                    console.error('Session debug error:', error);
                    alert('Error al obtener información de debug');
                  }
                }}
              >
                Debug Sesión
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Si no hay ni usuario ni sesión, mostrar error
  if (!user && !sessionUser) {
    return (
      <PageTransition>
        <div className="min-h-[60vh] grid place-items-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Usuario no encontrado
            </h2>
            <p className="text-[var(--text-secondary)] mb-4">
              No se pudo encontrar la información del usuario. Es posible que necesites iniciar sesión nuevamente.
            </p>
            <Button onClick={() => window.location.href = '/login'}>
              Ir al login
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

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
              <User className="h-6 w-6 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Mi Cuenta</h1>
              <p className="text-[var(--text-secondary)] mt-1">
                Gestiona tu información personal y configuración de seguridad
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <SectionTransition delay={0.1} className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src={user.image || sessionUser?.image} alt={user.name || sessionUser?.name} />
                  <AvatarFallback className="text-lg">
                    {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ||
                     sessionUser?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ||
                     user.email[0].toUpperCase() ||
                     sessionUser?.email?.[0].toUpperCase() ||
                     'U'}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-[var(--text-primary)]">{user.name || sessionUser?.name || 'Usuario'}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{user.email || sessionUser?.email || ''}</p>
                <Badge variant="secondary" className="mt-2">
                  {user.isSuperAdmin ? 'Super Admin' : user.role?.name || 'Usuario'}
                </Badge>
              </div>

              <Separator className="mb-4" />

              {/* Navigation */}
              <nav className="space-y-1">
                {[
                  { id: 'profile', label: 'Perfil', icon: User },
                  { id: 'security', label: 'Seguridad', icon: Key },
                  { id: 'preferences', label: 'Preferencias', icon: Settings },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </SectionTransition>

        {/* Main Content */}
        <SectionTransition delay={0.2} className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">Información Personal</h2>
                    <Button
                      variant={isEditing ? "outline" : "default"}
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2"
                    >
                      <Edit size={16} />
                      {isEditing ? 'Cancelar' : 'Editar'}
                    </Button>
                  </div>

                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre *</Label>
                        <Input
                          {...profileForm.register("firstName")}
                          disabled={!isEditing}
                          placeholder="Tu nombre"
                        />
                        <ErrorMessage error={profileForm.formState.errors.firstName?.message} />
                      </div>
                      <div>
                        <Label>Apellido *</Label>
                        <Input
                          {...profileForm.register("lastName")}
                          disabled={!isEditing}
                          placeholder="Tu apellido"
                        />
                        <ErrorMessage error={profileForm.formState.errors.lastName?.message} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Teléfono</Label>
                        <Input
                          {...profileForm.register("phone")}
                          disabled={!isEditing}
                          placeholder="11-2345-6789"
                        />
                        <ErrorMessage error={profileForm.formState.errors.phone?.message} />
                      </div>
                      <div>
                        <Label>Departamento</Label>
                        <Input
                          {...profileForm.register("department")}
                          disabled={!isEditing}
                          placeholder="Ej: Ventas"
                        />
                        <ErrorMessage error={profileForm.formState.errors.department?.message} />
                      </div>
                    </div>

                    <div>
                      <Label>Cargo</Label>
                      <Input
                        {...profileForm.register("position")}
                        disabled={!isEditing}
                        placeholder="Ej: Gerente de Ventas"
                      />
                      <ErrorMessage error={profileForm.formState.errors.position?.message} />
                    </div>

                    {isEditing && (
                      <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit" className="flex items-center gap-2">
                          <Save size={16} />
                          Guardar Cambios
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            profileForm.reset();
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </form>

                  {/* Información del sistema */}
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">Información del Sistema</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-[var(--surface-secondary)] rounded-lg">
                        <Mail className="h-5 w-5 text-[var(--accent-primary)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">Email</p>
                          <p className="text-xs text-[var(--text-secondary)]">{user.email || sessionUser?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-[var(--surface-secondary)] rounded-lg">
                        <Shield className="h-5 w-5 text-[var(--accent-primary)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">Rol</p>
                          <p className="text-xs text-[var(--text-secondary)]">{user.role?.name || 'Usuario'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-[var(--surface-secondary)] rounded-lg">
                        <Calendar className="h-5 w-5 text-[var(--accent-primary)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">Miembro desde</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-[var(--surface-secondary)] rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-[var(--accent-primary)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">Estado</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {user.active ? 'Activo' : 'Inactivo'} • {user.isApproved ? 'Aprobado' : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">Cambiar Contraseña</h2>

                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <div>
                      <Label>Contraseña Actual *</Label>
                      <Input
                        type="password"
                        {...passwordForm.register("currentPassword")}
                        placeholder="Ingresa tu contraseña actual"
                      />
                      <ErrorMessage error={passwordForm.formState.errors.currentPassword?.message} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nueva Contraseña *</Label>
                        <Input
                          type="password"
                          {...passwordForm.register("newPassword")}
                          placeholder="Mínimo 8 caracteres"
                        />
                        <ErrorMessage error={passwordForm.formState.errors.newPassword?.message} />
                      </div>
                      <div>
                        <Label>Confirmar Nueva Contraseña *</Label>
                        <Input
                          type="password"
                          {...passwordForm.register("confirmPassword")}
                          placeholder="Repite la nueva contraseña"
                        />
                        <ErrorMessage error={passwordForm.formState.errors.confirmPassword?.message} />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button type="submit" className="flex items-center gap-2">
                        <Key size={16} />
                        Cambiar Contraseña
                      </Button>
                    </div>
                  </form>

                  {/* Información de seguridad */}
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">Información de Seguridad</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-[var(--surface-secondary)] rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-[var(--accent-primary)]" />
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">Último acceso</p>
                            <p className="text-xs text-[var(--text-secondary)]">Hace unos momentos</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[var(--surface-secondary)] rounded-lg">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-[var(--accent-primary)]" />
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">Tipo de autenticación</p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {(user.provider || sessionUser?.provider) === 'google' ? 'Google OAuth' : 'Credenciales locales'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">Preferencias</h2>
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
                    <p className="text-[var(--text-secondary)]">Las preferencias estarán disponibles próximamente.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </SectionTransition>
      </div>
    </PageTransition>
  );
}
