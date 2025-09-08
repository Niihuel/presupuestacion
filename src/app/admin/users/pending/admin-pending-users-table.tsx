"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, X, User, Mail, Phone, Building, Briefcase, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PageTransition } from "@/components/ui/page-transition";

interface PendingUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  createdAt: string;
  registrationToken: string;
}

export default function AdminPendingUsersTable() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchPendingUsers();
  }, [session, status, router]);

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch("/api/admin/users/pending");
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Error al cargar usuarios pendientes");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch("/api/admin/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Error al aprobar usuario");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch("/api/admin/users/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          reason: rejectReason[userId] || undefined 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        setShowRejectModal(null);
        setRejectReason({ ...rejectReason, [userId]: "" });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Error al rechazar usuario");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white/80 dark:bg-black/60 border border-gray-200 dark:border-white/25 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Panel de Administración</h1>
                <p className="text-muted-foreground mt-1">
                  Usuarios pendientes de aprobación ({users.length})
                </p>
              </div>
              <button 
                onClick={fetchPendingUsers}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
              >
                Refrescar
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Users List */}
          {users.length === 0 ? (
            <div className="bg-white/80 dark:bg-black/60 border border-gray-200 dark:border-white/25 rounded-lg p-12 text-center">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No hay usuarios pendientes</h3>
              <p className="text-muted-foreground">Todas las solicitudes han sido procesadas.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {users.map((user) => (
                <div key={user.id} className="bg-white/80 dark:bg-black/60 border border-gray-200 dark:border-white/25 rounded-lg">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Solicitud recibida el {format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(user.id)}
                          disabled={actionLoading === user.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Aprobar
                        </button>
                        <button
                          onClick={() => setShowRejectModal(user.id)}
                          disabled={actionLoading === user.id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          Rechazar
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{user.phone}</span>
                          </div>
                        )}
                        {user.department && (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{user.department}</span>
                          </div>
                        )}
                        {user.position && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{user.position}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="bg-gray-50 dark:bg-neutral-900 p-3 rounded-md">
                          <p className="text-xs text-muted-foreground mb-1">Token de Registro:</p>
                          <code className="text-xs font-mono break-all">{user.registrationToken}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reject Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Rechazar Solicitud</h3>
                <p className="text-muted-foreground mb-4">
                  ¿Deseas agregar un motivo de rechazo? (Opcional)
                </p>
                <textarea
                  value={rejectReason[showRejectModal] || ""}
                  onChange={(e) => setRejectReason({ 
                    ...rejectReason, 
                    [showRejectModal]: e.target.value 
                  })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  rows={3}
                  placeholder="Motivo del rechazo..."
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleReject(showRejectModal)}
                    disabled={actionLoading === showRejectModal}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition disabled:opacity-50"
                  >
                    {actionLoading === showRejectModal ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Confirmar Rechazo
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(null);
                      setRejectReason({ ...rejectReason, [showRejectModal]: "" });
                    }}
                    className="px-4 py-2 border border-border rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}