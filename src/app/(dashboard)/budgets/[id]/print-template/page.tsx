import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface PrintTemplateBudgetPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PrintTemplateBudgetPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Presupuesto ${id} - Plantilla de Impresión`,
    description: 'Plantilla de impresión para presupuesto PRETENSA',
  };
}

async function getBudgetData(id: string) {
  const budget = await prisma.budget.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          piece: {
            include: {
              family: true,
            },
          },
        },
      },
      additionals: true,
      customer: true,
      project: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      freight: true,
      pieces: {
        include: {
          piece: {
            include: {
              family: true,
            },
          },
        },
      },
    },
  });

  if (!budget) {
    notFound();
  }

  return budget;
}

export default async function PrintTemplateBudgetPage({ params }: PrintTemplateBudgetPageProps) {
  const { id } = await params;
  const budget = await getBudgetData(id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Calculate totals
  const itemsTotal = budget.items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0);
  const additionalsTotal = budget.additionals.reduce((sum, add) => sum + add.total, 0);
  const freightTotal = budget.totalFreight || 0;
  const assemblyTotal = budget.totalAssembly || 0;
  const grandTotal = budget.finalTotal || (itemsTotal + additionalsTotal + freightTotal + assemblyTotal);

  return (
    <div className="min-h-screen bg-white text-black print:m-0 print:p-0" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-b-2 border-blue-600 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">PRETENSA</h1>
            <p className="text-lg text-gray-600">Sistema de Presupuestación de Estructuras Pretensadas</p>
            <div className="mt-2 text-sm text-gray-500">
              <p>Ruta 36 Km 42, Córdoba Capital</p>
              <p>Tel: (0351) 555-0123 | Email: ventas@pretensa.com</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-blue-800">PRESUPUESTO</h2>
            <div className="mt-2 text-sm">
              <p><strong>N°:</strong> {budget.id.slice(-8).toUpperCase()}</p>
              <p><strong>Versión:</strong> {budget.version}</p>
              <p><strong>Fecha:</strong> {formatDate(budget.budgetDate || budget.createdAt)}</p>
              <p><strong>Estado:</strong> {budget.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer and Project Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border border-gray-300 p-4 rounded">
          <h3 className="text-lg font-bold text-blue-800 mb-3 border-b border-gray-200 pb-1">
            INFORMACIÓN DEL CLIENTE
          </h3>
          <div className="text-sm space-y-1">
            <p><strong>Empresa:</strong> {budget.customer?.companyName || 'N/A'}</p>
            <p><strong>Contacto:</strong> {budget.customer?.contactPerson || 'N/A'}</p>
            <p><strong>Email:</strong> {budget.customer?.email || 'N/A'}</p>
            <p><strong>Teléfono:</strong> {budget.customer?.phone || 'N/A'}</p>
            <p><strong>Dirección:</strong> {budget.customer?.address || 'N/A'}</p>
            {budget.customer?.city && (
              <p><strong>Ciudad:</strong> {budget.customer.city}</p>
            )}
          </div>
        </div>

        <div className="border border-gray-300 p-4 rounded">
          <h3 className="text-lg font-bold text-blue-800 mb-3 border-b border-gray-200 pb-1">
            INFORMACIÓN DEL PROYECTO
          </h3>
          <div className="text-sm space-y-1">
            <p><strong>Nombre:</strong> {budget.project?.name || 'N/A'}</p>
            <p><strong>Descripción:</strong> {budget.project?.description || 'N/A'}</p>
            <p><strong>Ubicación:</strong> {budget.project?.address || 'N/A'}</p>
            {budget.project?.city && (
              <p><strong>Ciudad:</strong> {budget.project.city}</p>
            )}
            {budget.project?.distanceFromCordoba && (
              <p><strong>Distancia desde Córdoba:</strong> {budget.project.distanceFromCordoba} km</p>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-blue-800 mb-3 border-b border-gray-200 pb-1">
          DETALLE DE PIEZAS PRETENSADAS
        </h3>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-blue-100">
              <th className="border border-gray-300 p-2 text-left">Descripción</th>
              <th className="border border-gray-300 p-2 text-center">Cantidad</th>
              <th className="border border-gray-300 p-2 text-right">Precio Unitario</th>
              <th className="border border-gray-300 p-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {budget.items.map((item, index) => {
              const subtotal = item.quantity * (item.unitPrice || 0);
              return (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-300 p-2">
                    <div>
                      <strong>{item.piece.description}</strong>
                      {item.piece.family && (
                        <div className="text-xs text-gray-600">
                          Familia: {item.piece.family.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                  <td className="border border-gray-300 p-2 text-right">{formatCurrency(item.unitPrice || 0)}</td>
                  <td className="border border-gray-300 p-2 text-right font-semibold">{formatCurrency(subtotal)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-blue-50 font-semibold">
              <td colSpan={3} className="border border-gray-300 p-2 text-right">
                <strong>Subtotal Piezas:</strong>
              </td>
              <td className="border border-gray-300 p-2 text-right">
                <strong>{formatCurrency(itemsTotal)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Additional Services */}
      {budget.additionals.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-blue-800 mb-3 border-b border-gray-200 pb-1">
            SERVICIOS ADICIONALES
          </h3>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-green-100">
                <th className="border border-gray-300 p-2 text-left">Descripción</th>
                <th className="border border-gray-300 p-2 text-center">Cantidad</th>
                <th className="border border-gray-300 p-2 text-right">Precio Unitario</th>
                <th className="border border-gray-300 p-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {budget.additionals.map((additional, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-300 p-2">{additional.description}</td>
                  <td className="border border-gray-300 p-2 text-center">{additional.quantity}</td>
                  <td className="border border-gray-300 p-2 text-right">{formatCurrency(additional.unitPrice)}</td>
                  <td className="border border-gray-300 p-2 text-right font-semibold">{formatCurrency(additional.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-green-50 font-semibold">
                <td colSpan={3} className="border border-gray-300 p-2 text-right">
                  <strong>Subtotal Adicionales:</strong>
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  <strong>{formatCurrency(additionalsTotal)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Cost Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-blue-800 mb-3 border-b border-gray-200 pb-1">
          RESUMEN DE COSTOS
        </h3>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2 font-semibold">Subtotal Piezas:</td>
              <td className="border border-gray-300 p-2 text-right">{formatCurrency(itemsTotal)}</td>
            </tr>
            {additionalsTotal > 0 && (
              <tr>
                <td className="border border-gray-300 p-2 font-semibold">Servicios Adicionales:</td>
                <td className="border border-gray-300 p-2 text-right">{formatCurrency(additionalsTotal)}</td>
              </tr>
            )}
            {freightTotal > 0 && (
              <tr>
                <td className="border border-gray-300 p-2 font-semibold">Flete:</td>
                <td className="border border-gray-300 p-2 text-right">{formatCurrency(freightTotal)}</td>
              </tr>
            )}
            {assemblyTotal > 0 && (
              <tr>
                <td className="border border-gray-300 p-2 font-semibold">Montaje:</td>
                <td className="border border-gray-300 p-2 text-right">{formatCurrency(assemblyTotal)}</td>
              </tr>
            )}
            <tr className="bg-blue-100 font-bold text-lg">
              <td className="border border-gray-300 p-3">
                <strong>TOTAL GENERAL:</strong>
              </td>
              <td className="border border-gray-300 p-3 text-right">
                <strong>{formatCurrency(grandTotal)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Terms and Conditions */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-blue-800 mb-3 border-b border-gray-200 pb-1">
          CONDICIONES COMERCIALES
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Condiciones de Pago:</h4>
            <p>{budget.paymentConditions || 'Según condiciones acordadas'}</p>
            
            <h4 className="font-semibold mb-2 mt-4">Plazo de Entrega:</h4>
            <p>{budget.deliveryTerms || 'Según cronograma de obra'}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Validez de la Oferta:</h4>
            <p>{budget.validityDays || 30} días desde la fecha de emisión</p>
            
            {budget.notes && (
              <>
                <h4 className="font-semibold mb-2 mt-4">Observaciones:</h4>
                <p>{budget.notes}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-blue-600 pt-4 mt-8 text-center text-sm text-gray-600">
        <p>
          <strong>PRETENSA</strong> - Presupuesto generado el {formatDate(new Date())}
        </p>
        <p>
          Para cualquier consulta, comuníquese con nuestro equipo de ventas.
        </p>
        <p className="mt-2">
          Este presupuesto es válido por {budget.validityDays || 30} días desde la fecha de emisión.
        </p>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body { -webkit-print-color-adjust: exact !important; }
            .print\\:m-0 { margin: 0 !important; }
            .print\\:p-0 { padding: 0 !important; }
          }
        `
      }} />
    </div>
  );
}