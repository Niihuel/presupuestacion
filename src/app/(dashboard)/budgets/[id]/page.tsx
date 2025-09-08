'use client'

// Forzar renderizado estático para evitar conflictos con SSR
export const dynamic = 'force-static';

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ArrowLeftIcon, 
  CopyIcon, 
  DownloadIcon, 
  EditIcon, 
  HistoryIcon,
  PackageIcon,
  TruckIcon,
  ClipboardListIcon,
  MessageSquareIcon,
  UserIcon,
  CalendarIcon
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { PageTransition, SectionTransition } from '@/components/ui/page-transition'
import { motion } from 'framer-motion'

interface Budget {
  id: string
  version: number
  status: string
  createdAt: string
  budgetDate: string | null
  requestDate: string | null
  deliveryTerms: string | null
  paymentConditions: string | null
  validityDays: number | null
  notes: string | null
  finalTotal: number | null
  totalMaterials: number | null
  totalFreight: number | null
  totalAssembly: number | null
  totalAdditionals: number | null
  taxes: number | null
  customer: {
    id: string
    companyName: string
    displayName: string | null
    address: string | null
    city: string | null
    province: string | null
    contactPerson: string | null
    email: string | null
    phone: string | null
  }
  project: {
    id: string
    name: string
    description: string | null
    address: string | null
    city: string | null
    province: string | null
    designer: {
      id: string
      name: string
      email: string | null
    } | null
  }
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  seller: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  } | null
  items: any[]
  additionals: any[]
  freight: any[]
  pieces: any[]
  tracking: {
    id: string
    status: string
    comments: string | null
    changedAt: string
    user: {
      firstName: string | null
      lastName: string | null
      email: string
    }
  }[]
  observations: {
    id: string
    observation: string
    nextContactDate: string | null
    alertEnabled: boolean
    createdAt: string
    user: {
      firstName: string | null
      lastName: string | null
      email: string
    }
  }[]
  parentBudget: {
    id: string
    version: number
    status: string
    createdAt: string
  } | null
  versions: {
    id: string
    version: number
    status: string
    createdAt: string
    finalTotal: number | null
  }[]
}

const BUDGET_STATUSES = [
  { value: 'DRAFT', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  { value: 'PRESENTED', label: 'Presentado', color: 'bg-blue-100 text-blue-800' },
  { value: 'APPROVED', label: 'Aprobado', color: 'bg-green-100 text-green-800' },
  { value: 'REJECTED', label: 'Rechazado', color: 'bg-red-100 text-red-800' },
  { value: 'CANCELLED', label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
]

export default function BudgetDetailPage() {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)
  const [versionCreateLoading, setVersionCreateLoading] = useState(false)
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false)
  const [statusComments, setStatusComments] = useState('')
  
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const budgetId = params.id as string

  const fetchBudget = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/budgets/${budgetId}`)
      if (!response.ok) throw new Error('Error al cargar presupuesto')

      const data = await response.json()
      setBudget(data.budget)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el presupuesto',
        variant: 'destructive',
      })
      router.push('/dashboard/budgets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBudget()
  }, [budgetId])

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setStatusUpdateLoading(true)
      const response = await fetch(`/api/budgets/${budgetId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          comments: statusComments || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar estado')
      }

      const data = await response.json()
      setBudget(prev => prev ? { ...prev, status: newStatus } : null)
      setStatusComments('')
      
      toast({
        title: 'Estado actualizado',
        description: data.message,
      })
      
      // Refresh to get updated tracking
      fetchBudget()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar estado',
        variant: 'destructive',
      })
    } finally {
      setStatusUpdateLoading(false)
    }
  }

  const handleCreateNewVersion = async () => {
    try {
      setVersionCreateLoading(true)
      const response = await fetch(`/api/budgets/${budgetId}/version`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear versión')
      }

      const data = await response.json()
      
      toast({
        title: 'Nueva versión creada',
        description: data.message,
      })
      
      // Redirect to the new version
      router.push(`/dashboard/budgets/${data.budgetId}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear versión',
        variant: 'destructive',
      })
    } finally {
      setVersionCreateLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!budget) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Presupuesto no encontrado</h3>
              <p className="text-gray-500">El presupuesto que buscas no existe o no tienes permisos para verlo.</p>
              <Button className="mt-4" onClick={() => router.push('/dashboard/budgets')}>
                Volver a presupuestos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/budgets')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver
          </Button>
          
          {budget && (
            <div>
              <h1 className="text-2xl font-bold">Presupuesto #{budget.id.slice(-8)}</h1>
              <p className="text-muted-foreground">
                Versión {budget.version} • {new Date(budget.createdAt).toLocaleDateString('es-ES')}
              </p>
            </div>
          )}
        </div>
        
        {budget && (
          <div className="flex items-center gap-2">
            <Badge className={
              BUDGET_STATUSES.find(s => s.value === budget.status)?.color || 'bg-gray-100 text-gray-800'
            }>
              {BUDGET_STATUSES.find(s => s.value === budget.status)?.label || budget.status}
            </Badge>
            
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : budget ? (
        <div className="space-y-6">
          {/* Budget Actions */}
          <SectionTransition>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <CopyIcon className="h-4 w-4 mr-2" />
                    Duplicar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsVersionDialogOpen(true)}
                  >
                    <HistoryIcon className="h-4 w-4 mr-2" />
                    Nueva Versión
                  </Button>
                  
                  <Select 
                    value={budget.status} 
                    onValueChange={handleStatusUpdate}
                    disabled={statusUpdateLoading}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_STATUSES.filter(s => s.value !== budget.status).map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </SectionTransition>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer & Project Info */}
              <SectionTransition delay={0.1}>
                <Card>
                  <CardHeader>
                    <CardTitle>Información del Cliente y Proyecto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Cliente</h3>
                        <p className="text-sm">{budget.customer.displayName || budget.customer.companyName}</p>
                        {budget.customer.companyName && budget.customer.displayName && (
                          <p className="text-sm text-muted-foreground">{budget.customer.companyName}</p>
                        )}
                        {budget.customer.address && (
                          <p className="text-sm text-muted-foreground">
                            {budget.customer.address}, {budget.customer.city}, {budget.customer.province}
                          </p>
                        )}
                        {(budget.customer.contactPerson || budget.customer.email || budget.customer.phone) && (
                          <div className="mt-2 text-sm">
                            {budget.customer.contactPerson && <p>{budget.customer.contactPerson}</p>}
                            {budget.customer.email && <p>{budget.customer.email}</p>}
                            {budget.customer.phone && <p>{budget.customer.phone}</p>}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2">Proyecto</h3>
                        <p className="text-sm">{budget.project.name}</p>
                        {budget.project.description && (
                          <p className="text-sm text-muted-foreground">{budget.project.description}</p>
                        )}
                        {budget.project.address && (
                          <p className="text-sm text-muted-foreground">
                            {budget.project.address}, {budget.project.city}, {budget.project.province}
                          </p>
                        )}
                        {budget.project.designer && (
                          <div className="mt-2 text-sm">
                            <p className="font-medium">Diseñador</p>
                            <p>{budget.project.designer.name}</p>
                            {budget.project.designer.email && <p>{budget.project.designer.email}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </SectionTransition>

              {/* Budget Items Tabs */}
              <SectionTransition delay={0.2}>
                <Tabs defaultValue="items">
                  <TabsList>
                    <TabsTrigger value="items" className="flex items-center gap-2">
                      <PackageIcon className="h-4 w-4" />
                      Piezas
                    </TabsTrigger>
                    <TabsTrigger value="freight" className="flex items-center gap-2">
                      <TruckIcon className="h-4 w-4" />
                      Flete
                    </TabsTrigger>
                    <TabsTrigger value="assembly" className="flex items-center gap-2">
                      <ClipboardListIcon className="h-4 w-4" />
                      Montaje
                    </TabsTrigger>
                    <TabsTrigger value="additionals" className="flex items-center gap-2">
                      <PackageIcon className="h-4 w-4" />
                      Adicionales
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="items" className="mt-4">
                    <Card>
                      <CardContent className="p-0">
                        {/* Items table content */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-muted">
                              <tr>
                                <th className="text-left p-3 text-sm font-medium">Pieza</th>
                                <th className="text-left p-3 text-sm font-medium">Cantidad</th>
                                <th className="text-left p-3 text-sm font-medium">Precio Unitario</th>
                                <th className="text-left p-3 text-sm font-medium">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {budget.items.map((item, index) => (
                                <motion.tr 
                                  key={item.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="border-b hover:bg-muted/50"
                                >
                                  <td className="p-3">
                                    <div className="font-medium">{item.piece.description}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {item.piece.family.code} - {item.piece.family.description || 'Sin descripción'}
                                    </div>
                                  </td>
                                  <td className="p-3">{item.quantity}</td>
                                  <td className="p-3">{formatCurrency(item.unitPrice || 0)}</td>
                                  <td className="p-3">{formatCurrency(item.subtotal || 0)}</td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="freight" className="mt-4">
                    <Card>
                      <CardContent className="p-0">
                        {/* Freight table content */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-muted">
                              <tr>
                                <th className="text-left p-3 text-sm font-medium">Origen</th>
                                <th className="text-left p-3 text-sm font-medium">Destino</th>
                                <th className="text-left p-3 text-sm font-medium">Distancia</th>
                                <th className="text-left p-3 text-sm font-medium">Precio</th>
                              </tr>
                            </thead>
                            <tbody>
                              {budget.freight.map((item, index) => (
                                <motion.tr 
                                  key={item.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="border-b hover:bg-muted/50"
                                >
                                  <td className="p-3">
                                    <div className="font-medium">{item.originPlant?.name || 'Planta Origen'}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {item.originPlant?.location || 'Ubicación no especificada'}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-medium">{item.destinationPlant?.name || 'Obra Destino'}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {item.destinationPlant?.location || budget.project.address || 'Ubicación no especificada'}
                                    </div>
                                  </td>
                                  <td className="p-3">{(item.distance !== null && item.distance !== undefined) ? `${item.distance.toFixed(2)} km` : '0.00 km'}</td>
                                  <td className="p-3">{formatCurrency(item.price || 0)}</td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="assembly" className="mt-4">
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-muted-foreground">Montaje no implementado aún.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="additionals" className="mt-4">
                    <Card>
                      <CardContent className="p-0">
                        {/* Additionals table content */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-muted">
                              <tr>
                                <th className="text-left p-3 text-sm font-medium">Descripción</th>
                                <th className="text-left p-3 text-sm font-medium">Unidad</th>
                                <th className="text-left p-3 text-sm font-medium">Precio</th>
                              </tr>
                            </thead>
                            <tbody>
                              {budget.additionals.map((item, index) => (
                                <motion.tr 
                                  key={item.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="border-b hover:bg-muted/50"
                                >
                                  <td className="p-3">
                                    <div className="font-medium">{item.description}</div>
                                    {item.category && (
                                      <div className="text-sm text-muted-foreground">{item.category}</div>
                                    )}
                                  </td>
                                  <td className="p-3">{item.unit}</td>
                                  <td className="p-3">{formatCurrency(item.price || 0)}</td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </SectionTransition>

              {/* Notes */}
              <SectionTransition delay={0.3}>
                <Card>
                  <CardHeader>
                    <CardTitle>Notas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {budget.notes ? (
                      <p className="whitespace-pre-wrap">{budget.notes}</p>
                    ) : (
                      <p className="text-muted-foreground">No hay notas para este presupuesto.</p>
                    )}
                  </CardContent>
                </Card>
              </SectionTransition>
            </div>

            {/* Right Column - Summary & Tracking */}
            <div className="space-y-6">
              {/* Budget Summary */}
              <SectionTransition delay={0.1}>
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Materiales:</span>
                      <span className="font-medium">{formatCurrency(budget.totalMaterials || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flete:</span>
                      <span className="font-medium">{formatCurrency(budget.totalFreight || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Montaje:</span>
                      <span className="font-medium">{formatCurrency(budget.totalAssembly || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Adicionales:</span>
                      <span className="font-medium">{formatCurrency(budget.totalAdditionals || 0)}</span>
                    </div>
                    {budget.taxes !== null && (
                      <div className="flex justify-between">
                        <span>Impuestos:</span>
                        <span className="font-medium">{formatCurrency(budget.taxes || 0)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(budget.finalTotal || 0)}</span>
                    </div>
                  </CardContent>
                </Card>
              </SectionTransition>

              {/* Tracking */}
              <SectionTransition delay={0.2}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HistoryIcon className="h-5 w-5" />
                      Seguimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {budget.tracking.map((track, index) => (
                        <motion.div 
                          key={track.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-l-2 border-primary pl-4 py-1"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {BUDGET_STATUSES.find(s => s.value === track.status)?.label || track.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(track.changedAt).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                          {track.comments && (
                            <p className="text-sm mb-1">{track.comments}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Por {track.user.firstName} {track.user.lastName} ({track.user.email})
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </SectionTransition>

              {/* Observations */}
              <SectionTransition delay={0.3}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquareIcon className="h-5 w-5" />
                      Observaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {budget.observations.length > 0 ? (
                        budget.observations.map((obs, index) => (
                          <motion.div 
                            key={obs.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-3 bg-muted rounded-lg"
                          >
                            <p className="text-sm">{obs.observation}</p>
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                              <span>
                                {obs.nextContactDate && (
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    {new Date(obs.nextContactDate).toLocaleDateString('es-ES')}
                                  </span>
                                )}
                              </span>
                              <span>
                                {obs.user.firstName} {obs.user.lastName} • {new Date(obs.createdAt).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No hay observaciones registradas.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </SectionTransition>
            </div>
          </div>
        </div>
      ) : null}

      {/* New Version Dialog */}
      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Versión</DialogTitle>
            <DialogDescription>
              Crear una nueva versión de este presupuesto. La nueva versión tendrá el mismo contenido pero podrá ser modificado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm">
              ¿Estás seguro de que deseas crear una nueva versión del presupuesto #{budget?.id.slice(-8)}?
            </p>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsVersionDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateNewVersion}
                disabled={versionCreateLoading}
              >
                {versionCreateLoading ? 'Creando...' : 'Crear Versión'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
