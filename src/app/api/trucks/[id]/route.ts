import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { jsonOK, jsonError, handleApiError } from "@/lib/api";
import { truckSchema } from "@/lib/validations/trucks";
import { writeAuditLog } from "@/lib/audit";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify permissions
    await requirePermission("trucks", "view");
    const { id } = await params;

    const truck = await prisma.truck.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!truck) {
      return jsonError("Camión no encontrado", 404);
    }

    return jsonOK(truck);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify permissions
    await requirePermission("trucks", "edit");
    const { id } = await params;
    const body = await req.json();

    // Validate data
    const parsed = truckSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Error de validación", 400, parsed.error.flatten());
    }

    // Check if truck exists
    const existingTruck = await prisma.truck.findUnique({
      where: { id }
    });

    if (!existingTruck) {
      return jsonError("Camión no encontrado", 404);
    }

    // Convert numeric string values to numbers
    const data = {
      ...parsed.data,
      capacityTons: parsed.data.capacityTons ? Number(parsed.data.capacityTons) : undefined,
      maxLength: parsed.data.maxLength ? Number(parsed.data.maxLength) : undefined,
      maxPieces: parsed.data.maxPieces ? Number(parsed.data.maxPieces) : undefined,
      minBillableTons: parsed.data.minBillableTons ? Number(parsed.data.minBillableTons) : undefined,
    };

    // Update truck
    const updated = await prisma.truck.update({
      where: { id },
      data
    });

    await writeAuditLog({
      action: "update", 
      resource: "truck", 
      resourceId: id, 
      detail: `Updated truck: ${updated.plate}`
    });

    return jsonOK(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify permissions
    await requirePermission("trucks", "delete");
    const { id } = await params;

    // Check if truck exists
    const existingTruck = await prisma.truck.findUnique({
      where: { id }
    });

    if (!existingTruck) {
      return jsonError("Camión no encontrado", 404);
    }

    // Delete truck
    await prisma.truck.delete({
      where: { id }
    });

    await writeAuditLog({
      action: "delete", 
      resource: "truck", 
      resourceId: id, 
      detail: `Deleted truck: ${existingTruck.plate}`
    });

    return jsonOK({ success: true, message: "Camión eliminado correctamente" });
  } catch (error) {
    return handleApiError(error);
  }
}