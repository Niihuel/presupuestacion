import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/authz";
import { idSchema } from "@/lib/validations/common";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(value);
};

// Helper function to format date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-AR').format(date);
};

// Enhanced PDF generation with better layout and professional design
async function generateBudgetPDF(budget: any) {
  const doc = new PDFDocument({ 
    margin: 50, 
    size: 'A4',
    info: {
      Title: `Presupuesto ${budget.id}`,
      Author: 'PRETENSA',
      Subject: 'Presupuesto de Estructuras Pretensadas',
      Creator: 'Sistema PRETENSA'
    }
  });
  
  const chunks: Uint8Array[] = [];
  
  doc.on("data", (chunk: any) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks as any)));
  });

  const pageWidth = doc.page.width - 100; // Account for margins
  
  // Professional Header with company branding
  doc.fontSize(24).font('Helvetica-Bold')
     .fillColor('#1e40af')
     .text('PRETENSA', 50, 50)
     .fontSize(12).font('Helvetica')
     .fillColor('#6b7280')
     .text('Sistema de Presupuestación de Estructuras Pretensadas', 50, 80)
     .text('Ruta 36 Km 42, Córdoba Capital | Tel: (0351) 555-0123', 50, 95)
     .text('Email: ventas@pretensa.com | www.pretensa.com', 50, 110);
  
  // Budget Title and Info
  doc.fontSize(20).font('Helvetica-Bold')
     .fillColor('#1e40af')
     .text(`PRESUPUESTO N° ${budget.id.slice(-8).toUpperCase()}`, 350, 50)
     .fontSize(11).font('Helvetica')
     .fillColor('#374151')
     .text(`Versión: ${budget.version}`, 350, 75)
     .text(`Estado: ${budget.status}`, 350, 90)
     .text(`Fecha: ${formatDate(budget.budgetDate || budget.createdAt)}`, 350, 105)
     .text(`Validez: ${budget.validityDays || 30} días`, 350, 120);

  // Draw a separator line
  doc.moveTo(50, 140).lineTo(550, 140).strokeColor('#e5e7eb').stroke();

  let yPosition = 160;

  // Customer and Project Information in two columns
  doc.fontSize(14).font('Helvetica-Bold')
     .fillColor('#1e40af')
     .text('INFORMACIÓN DEL CLIENTE', 50, yPosition)
     .text('INFORMACIÓN DEL PROYECTO', 300, yPosition);
  
  yPosition += 25;
  
  // Customer info (left column)
  doc.fontSize(10).font('Helvetica')
     .fillColor('#374151')
     .text(`Empresa: ${budget.customer?.companyName || 'N/A'}`, 50, yPosition)
     .text(`Contacto: ${budget.customer?.contactPerson || 'N/A'}`, 50, yPosition + 15)
     .text(`Email: ${budget.customer?.email || 'N/A'}`, 50, yPosition + 30)
     .text(`Teléfono: ${budget.customer?.phone || 'N/A'}`, 50, yPosition + 45)
     .text(`Dirección: ${budget.customer?.address || 'N/A'}`, 50, yPosition + 60);
  
  // Project info (right column)
  doc.text(`Nombre: ${budget.project?.name || 'N/A'}`, 300, yPosition)
     .text(`Descripción: ${budget.project?.description || 'N/A'}`, 300, yPosition + 15)
     .text(`Ubicación: ${budget.project?.address || 'N/A'}`, 300, yPosition + 30)
     .text(`Ciudad: ${budget.project?.city || 'N/A'}`, 300, yPosition + 45)
     .text(`Distancia: ${budget.project?.distanceFromCordoba || 0} km`, 300, yPosition + 60);

  yPosition += 100;
  
  // Check for page break
  if (yPosition > 700) {
    doc.addPage();
    yPosition = 50;
  }
  
  // Items Section with enhanced table design
  doc.fontSize(14).font('Helvetica-Bold')
     .fillColor('#1e40af')
     .text('DETALLE DE PIEZAS PRETENSADAS', 50, yPosition);
  
  yPosition += 30;
  
  // Table headers with background
  doc.rect(50, yPosition, 500, 20).fillColor('#f3f4f6').fill();
  doc.fontSize(9).font('Helvetica-Bold')
     .fillColor('#374151')
     .text('Descripción', 55, yPosition + 5)
     .text('Cant.', 250, yPosition + 5)
     .text('Precio Unit.', 300, yPosition + 5)
     .text('Subtotal', 420, yPosition + 5);
  
  yPosition += 25;
  
  let itemsTotal = 0;
  doc.fontSize(8).font('Helvetica').fillColor('#374151');
  
  budget.items.forEach((item: any, index: number) => {
    if (yPosition > 750) {
      doc.addPage();
      yPosition = 50;
      // Repeat headers on new page
      doc.rect(50, yPosition, 500, 20).fillColor('#f3f4f6').fill();
      doc.fontSize(9).font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Descripción', 55, yPosition + 5)
         .text('Cant.', 250, yPosition + 5)
         .text('Precio Unit.', 300, yPosition + 5)
         .text('Subtotal', 420, yPosition + 5);
      yPosition += 25;
    }
    
    const subtotal = item.quantity * (item.unitPrice || 0);
    itemsTotal += subtotal;
    
    // Alternate row background
    if (index % 2 === 0) {
      doc.rect(50, yPosition - 2, 500, 18).fillColor('#f9fafb').fill();
    }
    
    doc.fontSize(8).font('Helvetica').fillColor('#374151')
       .text(item.piece.description.substring(0, 45), 55, yPosition + 2)
       .text(item.quantity.toString(), 260, yPosition + 2)
       .text(formatCurrency(item.unitPrice || 0), 305, yPosition + 2)
       .text(formatCurrency(subtotal), 425, yPosition + 2);
    
    // Add family info if available
    if (item.piece.family) {
      doc.fontSize(7).fillColor('#6b7280')
         .text(`Familia: ${item.piece.family.description}`, 55, yPosition + 12);
    }
    
    yPosition += 20;
  });

  // Items Total with enhanced styling
  yPosition += 10;
  doc.rect(300, yPosition, 250, 25).fillColor('#dbeafe').fill();
  doc.fontSize(11).font('Helvetica-Bold')
     .fillColor('#1e40af')
     .text('Subtotal Piezas:', 310, yPosition + 7)
     .text(formatCurrency(itemsTotal), 425, yPosition + 7);

  // Additional Services Section
  if (budget.additionals && budget.additionals.length > 0) {
    yPosition += 40;
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }
    
    doc.fontSize(14).font('Helvetica-Bold')
       .text('Servicios Adicionales', 50, yPosition);
    
    yPosition += 30;
    
    // Table headers
    doc.fontSize(9).font('Helvetica-Bold')
       .text('Descripción', 50, yPosition)
       .text('Cantidad', 250, yPosition)
       .text('Precio Unit.', 320, yPosition)
       .text('Subtotal', 420, yPosition);
    
    yPosition += 15;
    doc.moveTo(50, yPosition).lineTo(500, yPosition).stroke();
    yPosition += 10;
    
    let additionalsTotal = 0;
    doc.fontSize(8).font('Helvetica');
    
    budget.additionals.forEach((additional: any) => {
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }
      
      const subtotal = additional.quantity * additional.unitPrice;
      additionalsTotal += subtotal;
      
      doc.text(additional.description.substring(0, 40), 50, yPosition)
         .text(additional.quantity.toString(), 250, yPosition)
         .text(formatCurrency(additional.unitPrice), 320, yPosition)
         .text(formatCurrency(subtotal), 420, yPosition);
      
      yPosition += 15;
    });
    
    // Additionals Total
    yPosition += 10;
    doc.moveTo(320, yPosition).lineTo(500, yPosition).stroke();
    yPosition += 15;
    doc.fontSize(10).font('Helvetica-Bold')
       .text('Subtotal Adicionales:', 320, yPosition)
       .text(formatCurrency(additionalsTotal), 420, yPosition);
  }

  // Freight Section
  if (budget.freight) {
    yPosition += 30;
    if (yPosition > 720) {
      doc.addPage();
      yPosition = 50;
    }
    
    doc.fontSize(14).font('Helvetica-Bold')
       .text('Información de Flete', 50, yPosition);
    
    yPosition += 25;
    doc.fontSize(10).font('Helvetica')
       .text(`Peso Total: ${budget.freight.totalRealWeight || 0} kg`, 50, yPosition)
       .text(`Distancia: ${budget.freight.billedDistance || 0} km`, 50, yPosition + 15)
       .text(`Costo Flete: ${formatCurrency(budget.freight.freightCost || 0)}`, 50, yPosition + 30);
  }

  // Grand Total
  yPosition += 60;
  if (yPosition > 720) {
    doc.addPage();
    yPosition = 50;
  }
  
  const grandTotal = (budget.totalPrice || 0);
  
  doc.fontSize(16).font('Helvetica-Bold')
     .text('TOTAL GENERAL:', 320, yPosition)
     .fontSize(18)
     .text(formatCurrency(grandTotal), 420, yPosition);

  // Footer
  yPosition += 60;
  doc.fontSize(8).font('Helvetica')
     .text('Este presupuesto es válido por 30 días desde la fecha de emisión.', 50, yPosition)
     .text('Para cualquier consulta, comuníquese con nuestro equipo de ventas.', 50, yPosition + 15);

  doc.end();
  return await done;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("budgets", "view");
    const { id } = await params;
    
    if (!idSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            piece: {
              include: {
                family: true
              }
            }
          }
        },
        additionals: true,
        customer: true,
        project: true,
        freight: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const pdfBuffer = await generateBudgetPDF(budget);
    
    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=presupuesto-${budget.id}-v${budget.version}.pdf`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Error generating PDF' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Keep existing POST method for backward compatibility
  return GET(request, { params });
}


