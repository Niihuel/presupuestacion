"use client";

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';
import * as React from "react";
import useSWR from "swr";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RowActions } from "@/components/ui/row-actions";
import { Pagination } from "@/components/ui/pagination";
import { usePermissionGuard } from "@/hooks/use-permission-guard";
import { toast } from "sonner";
import { Plus, User } from "lucide-react";
import { PageTransition, SectionTransition } from "@/components/ui/page-transition";
import { motion } from "framer-motion";

const fetcher = (url: string) => axios.get(url).then(r=>r.data);

export default function UsersPage(){
  const { guardAction, guardAsyncAction, canCreate, canEdit, canDelete } = usePermissionGuard();
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortDir, setSortDir] = React.useState<"asc"|"desc">("desc");
  const { data, mutate, isLoading } = useSWR(`/api/users?page=${page}&pageSize=10&q=${encodeURIComponent(q)}&sortBy=${sortBy}&sortDir=${sortDir}`, fetcher);
  const roles = useSWR(`/api/roles`, fetcher).data ?? [];
  const items = (data?.items ?? []) as any[];

  const [openCreate, setOpenCreate] = React.useState(false);
  const [viewItem, setViewItem] = React.useState<any|null>(null);
  const [editItem, setEditItem] = React.useState<any|null>(null);
  const [deleteItem, setDeleteItem] = React.useState<any|null>(null);

  // Protected actions using permission guards
  const handleCreateUser = guardAsyncAction(
    "users", 
    "create", 
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;
      const fd = new FormData(form);
      const payload: any = Object.fromEntries(fd.entries());
      payload.active = true;
      if (!payload.email || !payload.password) { 
        toast.error("Email y password requeridos"); 
        return; 
      }
      await axios.post("/api/users", payload);
      toast.success("Usuario creado");
      form.reset();
      mutate();
      setOpenCreate(false);
    }
  );

  const handleUpdateUser = guardAsyncAction(
    "users",
    "edit", 
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editItem) return;
      const fd = new FormData(e.currentTarget as HTMLFormElement);
      const payload: any = Object.fromEntries(fd.entries());
      await axios.put(`/api/users/${editItem.id}`, payload);
      toast.success("Usuario actualizado");
      mutate();
      setEditItem(null);
    }
  );

  const handleDeleteUser = guardAsyncAction(
    "users",
    "delete",
    async () => {
      if (!deleteItem) return;
      await axios.delete(`/api/users/${deleteItem.id}`);
      toast.success("Usuario eliminado");
      mutate();
      setDeleteItem(null);
    }
  );

  // Protected UI actions
  const handleOpenCreate = guardAction("users", "create", () => setOpenCreate(true));
  const handleOpenEdit = guardAction("users", "edit", (user: any) => setEditItem(user));
  const handleOpenDelete = guardAction("users", "delete", (user: any) => setDeleteItem(user));

  return (
    <PageTransition>
      <div className="container mx-auto p-6 max-w-7xl">
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
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Gestión de Usuarios</h1>
                <p className="text-[var(--text-secondary)] mt-1">
                  Administra las cuentas de usuario y sus permisos
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filtros */}
        <SectionTransition delay={0.1} className="mb-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Filtros</h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Input value={q} onChange={e=>{setPage(1); setQ(e.target.value)}} placeholder="Buscar usuario..." className="max-w-sm"/>
                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" onClick={() => setQ("")} className="transition-all duration-200">
                      Limpiar filtros
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={handleOpenCreate}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Usuario
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionTransition>

        {/* Lista de usuarios */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-900 border-b">
                <tr>
                  <th className="text-left p-4 cursor-pointer font-semibold" onClick={()=>{setSortBy("firstName"); setSortDir(sortDir==='asc'?'desc':'asc')}}>Nombre {sortBy==="firstName" ? (sortDir==="asc"?"▲":"▼") : ""}</th>
                  <th className="text-left p-4 cursor-pointer font-semibold" onClick={()=>{setSortBy("email"); setSortDir(sortDir==='asc'?'desc':'asc')}}>Email {sortBy==="email" ? (sortDir==="asc"?"▲":"▼") : ""}</th>
                  <th className="text-left p-4 cursor-pointer font-semibold" onClick={()=>{setSortBy("role"); setSortDir(sortDir==='asc'?'desc':'asc')}}>Rol {sortBy==="role" ? (sortDir==="asc"?"▲":"▼") : ""}</th>
                  <th className="text-left p-4 font-semibold">Activo</th>
                  <th className="text-left p-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (<tr><td className="p-8 text-center text-muted-foreground" colSpan={5}>Cargando...</td></tr>) : (
                  (items.length ? items.map((u:any, index: number)=> (
                    <motion.tr 
                      key={u.id} 
                      className="border-b hover:bg-muted/50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="p-4">{[u.firstName,u.lastName].filter(Boolean).join(" ") || "-"}</td>
                      <td className="p-4">{u.email}</td>
                      <td className="p-4">{u.roleId ? roles.find((r:any)=>r.id===u.roleId)?.name ?? u.roleId : "-"}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          u.active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {u.active?"Activo":"Inactivo"}
                        </span>
                      </td>
                      <td className="p-4">
                        <RowActions 
                          onView={()=>setViewItem(u)} 
                          onEdit={()=>handleOpenEdit(u)} 
                          onDelete={()=>handleOpenDelete(u)} 
                        />
                      </td>
                    </motion.tr>
                  )) : (<tr><td className="p-8 text-center text-muted-foreground" colSpan={5}>
                    <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="mb-4">No se encontraron usuarios</p>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button onClick={handleOpenCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        Crear primer usuario
                      </Button>
                    </motion.div>
                  </td></tr>))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        </Card>

        {/* Paginación */}
        {((data?.items?.length ?? 0) > 0) && (
          <Pagination
            currentPage={page}
            hasNextPage={(data?.items?.length ?? 0) >= 10}
            onPageChange={setPage}
          />
        )}
        <UnifiedModal open={openCreate} onOpenChange={setOpenCreate} title="Nuevo Usuario">
          <form onSubmit={handleCreateUser} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nombre</Label><Input name="firstName"/></div>
              <div><Label>Apellido</Label><Input name="lastName"/></div>
            </div>
            <div>
              <Label>Email</Label><Input name="email" type="email" required/>
            </div>
            <div>
              <Label>Password</Label><Input name="password" type="password" required/>
            </div>
            <div>
              <Label>Rol</Label>
              <Select name="roleId">
                <option value="">(sin rol)</option>
                {roles.map((r:any)=>(<option key={r.id} value={r.id}>{r.name}</option>))}
              </Select>
            </div>
            <Button type="submit">Guardar</Button>
          </form>
        </UnifiedModal>
        <UnifiedModal open={!!viewItem} onOpenChange={(o)=>!o && setViewItem(null)} title="Ver Usuario">
          <pre className="text-xs overflow-auto max-h-72">{viewItem ? JSON.stringify(viewItem, null, 2) : null}</pre>
        </UnifiedModal>
        <UnifiedModal open={!!editItem} onOpenChange={(o)=>!o && setEditItem(null)} title="Editar Usuario">
          {editItem && (
            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nombre</Label><Input name="firstName" defaultValue={editItem.firstName ?? ""}/></div>
                <div><Label>Apellido</Label><Input name="lastName" defaultValue={editItem.lastName ?? ""}/></div>
              </div>
              <div>
                <Label>Rol</Label>
                <Select name="roleId" defaultValue={editItem.roleId ?? ""}>
                  <option value="">(sin rol)</option>
                  {roles.map((r:any)=>(<option key={r.id} value={r.id}>{r.name}</option>))}
                </Select>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={!!editItem.active}/> Activo</label>
              </div>
              <Button type="submit">Guardar cambios</Button>
            </form>
          )}
        </UnifiedModal>
        <UnifiedModal open={!!deleteItem} onOpenChange={(o)=>!o && setDeleteItem(null)} title="Eliminar Usuario">
          <p className="text-sm">¿Confirmas eliminar el usuario <b>{deleteItem?.email}</b>?</p>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="outline" onClick={()=>setDeleteItem(null)}>Cancelar</Button>
            <Button onClick={handleDeleteUser}>Eliminar</Button>
          </div>
        </UnifiedModal>
      </div>
    </PageTransition>
  );
}