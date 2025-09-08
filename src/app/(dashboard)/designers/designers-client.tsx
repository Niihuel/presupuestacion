"use client";

import * as React from "react";
import useSWR from "swr";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UnifiedModal } from "@/components/ui/unified-modal";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RowActions } from "@/components/ui/row-actions";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { Plus, Palette } from "lucide-react";
import { PageTransition, SectionTransition } from "@/components/ui/page-transition";
import { motion } from "framer-motion";

const fetcher = (url: string) => axios.get(url).then(r=>r.data);

export default function DesignersClient(){
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");
  const { data, mutate, isLoading } = useSWR(`/api/designers?page=${page}&pageSize=10&q=${encodeURIComponent(q)}`, fetcher);
  const items = (data?.items ?? []) as any[];
  const [openCreate, setOpenCreate] = React.useState(false);
  const [viewItem, setViewItem] = React.useState<any|null>(null);
  const [editItem, setEditItem] = React.useState<any|null>(null);
  const [deleteItem, setDeleteItem] = React.useState<any|null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const payload = Object.fromEntries(fd.entries());
    await axios.post(`/api/designers`, payload);
    toast.success("Diseñador creado");
    (e.currentTarget as HTMLFormElement).reset();
    mutate();
    setOpenCreate(false);
  }

  async function onUpdate(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(!editItem) return;
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const payload = Object.fromEntries(fd.entries());
    await axios.put(`/api/designers/${editItem.id}`, payload);
    toast.success("Diseñador actualizado");
    mutate();
    setEditItem(null);
  }

  async function onConfirmDelete(){
    if(!deleteItem) return;
    await axios.delete(`/api/designers/${deleteItem.id}`);
    toast.success("Diseñador eliminado");
    mutate();
    setDeleteItem(null);
  }

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
                <Palette className="h-6 w-6 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Gestión de Diseñadores</h1>
                <p className="text-[var(--text-secondary)] mt-1">
                  Administra el equipo de diseñadores y su información de contacto
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
                <Input value={q} onChange={e=>{setPage(1); setQ(e.target.value)}} placeholder="Buscar diseñador..." className="max-w-sm"/>
                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" onClick={() => setQ("")} className="transition-all duration-200">
                      Limpiar filtros
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={() => setOpenCreate(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Diseñador
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionTransition>

        {/* Lista de diseñadores */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-900 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold">Nombre</th>
                    <th className="text-left p-4 font-semibold">Email</th>
                    <th className="text-left p-4 font-semibold">Teléfono</th>
                    <th className="text-left p-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (<tr><td className="p-8 text-center text-muted-foreground" colSpan={4}>Cargando...</td></tr>) : (
                    (items.length ? items.map((d:any, index: number)=> (
                      <motion.tr 
                        key={d.id} 
                        className="border-b hover:bg-muted/50"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="p-4">{d.name}</td>
                        <td className="p-4">{d.email ?? "-"}</td>
                        <td className="p-4">{d.phone ?? "-"}</td>
                        <td className="p-4">
                          <RowActions 
                            onView={()=>setViewItem(d)} 
                            onEdit={()=>setEditItem(d)} 
                            onDelete={()=>setDeleteItem(d)} 
                          />
                        </td>
                      </motion.tr>
                    )) : (<tr><td className="p-8 text-center text-muted-foreground" colSpan={4}>
                      <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="mb-4">No se encontraron diseñadores</p>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button onClick={() => setOpenCreate(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Crear primer diseñador
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
            hasNextPage={(items.length??0) >= 10}
            onPageChange={setPage}
          />
        )}
        <UnifiedModal open={openCreate} onOpenChange={setOpenCreate} title="Nuevo Diseñador">
          <form onSubmit={onSubmit} className="space-y-3">
            <div><Label>Nombre</Label><Input name="name" required/></div>
            <div><Label>Email</Label><Input name="email" type="email"/></div>
            <div><Label>Teléfono</Label><Input name="phone"/></div>
            <Button type="submit">Guardar</Button>
          </form>
        </UnifiedModal>
        <UnifiedModal open={!!viewItem} onOpenChange={(o)=>!o && setViewItem(null)} title="Ver Diseñador">
          <pre className="text-xs overflow-auto max-h-72">{viewItem ? JSON.stringify(viewItem, null, 2) : null}</pre>
        </UnifiedModal>
        <UnifiedModal open={!!editItem} onOpenChange={(o)=>!o && setEditItem(null)} title="Editar Diseñador">
          {editItem && (
            <form onSubmit={onUpdate} className="space-y-3">
              <div><Label>Nombre</Label><Input name="name" defaultValue={editItem.name} required/></div>
              <div><Label>Email</Label><Input name="email" type="email" defaultValue={editItem.email ?? ""}/></div>
              <div><Label>Teléfono</Label><Input name="phone" defaultValue={editItem.phone ?? ""}/></div>
              <Button type="submit">Guardar cambios</Button>
            </form>
          )}
        </UnifiedModal>
        <UnifiedModal open={!!deleteItem} onOpenChange={(o)=>!o && setDeleteItem(null)} title="Eliminar Diseñador">
          <p className="text-sm">¿Confirmas eliminar al diseñador <b>{deleteItem?.name}</b>?</p>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="outline" onClick={()=>setDeleteItem(null)}>Cancelar</Button>
            <Button onClick={onConfirmDelete}>Eliminar</Button>
          </div>
        </UnifiedModal>
      </div>
    </PageTransition>
  );
}