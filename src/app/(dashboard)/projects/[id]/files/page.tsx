"use client";

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';
import * as React from "react";
import useSWR from "swr";
import axios from "axios";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type ProjectFile = { id: string; fileName: string; fileUrl: string; fileType: string; uploadedAt: string; category?: string|null; size?: number|null };

const fetcher = (url: string) => axios.get(url).then(r => r.data);

export default function ProjectFilesManager({ params }: { params: { id: string } }) {
  // Note: This is a client component, so params is still synchronous here
  // The Next.js 15 params change only affects server components
  const projectId = params.id;
  const { data, mutate } = useSWR(`/api/projects/${projectId}/files`, fetcher);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>("grid");
  const files: ProjectFile[] = (data?.items ?? []);

  async function handleUpload(accepted: File[]) {
    setUploading(true);
    try{
      for (const file of accepted) {
        const form = new FormData();
        form.append("file", file);
        form.append("projectId", projectId);
        form.append("category", detectCategory(file.name));
        await fetch(`/api/projects/files/upload`, { method: "POST", body: form });
      }
      await mutate();
    } finally {
      setUploading(false);
    }
  }

  function detectCategory(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".dwg") || lower.endsWith(".dxf")) return "planos";
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "calculos";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) return "renders";
    return "documentos";
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-white/25 bg-white/80 dark:bg-black/60 shadow-sm px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Documentación del Proyecto</h1>
        <div className="flex gap-2">
          <Button onClick={()=> setView(v=> v==='grid'?'list':'grid')}>{view==='grid'? 'Lista' : 'Grilla'}</Button>
          <UploadButton onUpload={handleUpload} disabled={uploading} />
        </div>
      </div>

      <Stats files={files} />

      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {files.map(f => (<FileCard key={f.id} file={f} onChanged={mutate} projectId={projectId} />))}
        </div>
      ) : (
        <FilesList files={files} onChanged={mutate} projectId={projectId} />
      )}
    </div>
  );
}

function Stats({ files }: { files: ProjectFile[] }){
  const categories = ["planos","calculos","renders","documentos"] as const;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((key)=>{
        const count = files.filter(f=> (f.category ?? 'documentos') === key).length;
        return (
          <Card key={key}><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm capitalize">{key}</p><p className="text-2xl font-bold">{count}</p></div><span className="text-xs">{key}</span></CardContent></Card>
        );
      })}
    </div>
  );
}

function FileCard({ file, onChanged, projectId }: { file: ProjectFile; onChanged: ()=>void; projectId: string }){
  const [preview, setPreview] = useState<string | undefined>();
  useEffect(()=>{
    if (file.fileType?.startsWith('image/')) setPreview(file.fileUrl);
  }, [file]);
  async function del(){
    await axios.delete(`/api/projects/${projectId}/files/${file.id}`);
    onChanged();
  }
  return (
    <Card className="group hover:shadow-lg transition"><CardContent className="p-4">
      {preview ? (<img src={preview} className="w-full h-32 object-cover rounded mb-2" />) : (
        <div className="w-full h-32 bg-gray-100 dark:bg-neutral-900 rounded mb-2 flex items-center justify-center text-sm text-muted-foreground">Previsualización</div>
      )}
      <p className="font-medium truncate">{file.fileName}</p>
      <p className="text-xs text-muted-foreground">{new Date(file.uploadedAt).toLocaleString()}</p>
      <div className="mt-2 flex gap-2 opacity-100 transition">
        <a className="rounded-md border px-2 py-1 text-xs" href={file.fileUrl} download>Descargar</a>
        <Button size={"sm" as any} variant="outline" onClick={del}>Eliminar</Button>
      </div>
    </CardContent></Card>
  );
}

function FilesList({ files, onChanged, projectId }: { files: ProjectFile[]; onChanged: ()=>void; projectId: string }){
  return (
    <div className="overflow-x-auto border rounded-md bg-white dark:bg-transparent">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-neutral-900"><tr><th className="text-left p-2">Archivo</th><th className="text-left p-2">Tipo</th><th className="text-left p-2">Subido</th><th className="text-left p-2">Acciones</th></tr></thead>
        <tbody>
          {files.map(f=> (
            <tr key={f.id} className="border-t">
              <td className="p-2">{f.fileName}</td>
              <td className="p-2">{f.fileType}</td>
              <td className="p-2">{new Date(f.uploadedAt).toLocaleString()}</td>
              <td className="p-2"><a className="rounded-md border px-2 py-1 text-xs mr-2" href={f.fileUrl} download>Descargar</a><a className="rounded-md border px-2 py-1 text-xs" href={f.fileUrl} target="_blank">Ver</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UploadButton({ onUpload, disabled }: { onUpload: (files: File[])=>void|Promise<void>; disabled?: boolean }){
  const fileInput = React.useRef<HTMLInputElement>(null);
  function open(){ fileInput.current?.click(); }
  function onChange(e: React.ChangeEvent<HTMLInputElement>){
    const fl = Array.from(e.target.files ?? []);
    if (fl.length) onUpload(fl);
    e.currentTarget.value = "";
  }
  return (
    <>
      <Button onClick={open} disabled={disabled}>Subir archivos</Button>
      <input ref={fileInput} type="file" multiple className="hidden" onChange={onChange} />
    </>
  );
}


