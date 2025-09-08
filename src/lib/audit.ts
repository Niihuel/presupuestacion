import { prisma } from "@/lib/prisma";

export async function writeAuditLog(opts: { userId?: string|null; action: string; resource: string; resourceId?: string|null; detail?: string|null; }){
  try{
    await prisma.auditLog.create({ data: {
      userId: opts.userId ?? undefined,
      action: opts.action,
      resource: opts.resource,
      resourceId: opts.resourceId ?? undefined,
      detail: opts.detail ?? undefined,
    }});
  }catch(_err){
    // evitar romper la operación por la auditoría
  }
}


