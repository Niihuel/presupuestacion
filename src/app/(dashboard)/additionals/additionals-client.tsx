'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PlusIcon, SearchIcon, FilterIcon, EditIcon, TrashIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { PageTransition, SectionTransition } from '@/components/ui/page-transition'
import { PageHeader } from '@/components/ui/page-header'
import { motion } from 'framer-motion'

interface Additional {
  id: string
  description: string
  unit: string
  price: number
  category: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AdditionalsResponse {
  additionals: Additional[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

interface AdditionalFormData {
  description: string
  unit: string
  price: number
  category: string
  isActive: boolean
}

const CATEGORIES = [
  'Montaje',
  'Transporte Especial',
  'Servicios Técnicos',
  'Materiales Adicionales',
  'Mano de Obra',
  'Equipos',
  'Otro'
]

const UNITS = [
  'Global',
  'Unidad',
  'm²',
  'm³',
  'ml',
  'kg',
  'tn',
  'hora',
  'día',
  'mes'
]

export default function AdditionalsClient() {
  const [additionals, setAdditionals] = useState<Additional[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  })
  
  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<AdditionalFormData>({
    description: '',
    unit: 'Global',
    price: 0,
    category: '',
    isActive: true,
  })
  const [saving, setSaving] = useState(false)
  
  const { toast } = useToast()

  const fetchAdditionals = async (page: number = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })

      if (search) params.append('search', search)
      if (categoryFilter) params.append('category', categoryFilter)
      if (activeFilter) params.append('isActive', activeFilter)

      const response = await fetch(`/api/additionals?${params}`)
      if (!response.ok) throw new Error('Error al cargar adicionales')

      const data: AdditionalsResponse = await response.json()
      setAdditionals(data.additionals)
      setPagination(data.pagination)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los adicionales',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdditionals(1)
  }, [search, categoryFilter, activeFilter])

  const handleOpenModal = (additional?: Additional) => {
    if (additional) {
      setEditingId(additional.id)
      setFormData({
        description: additional.description,
        unit: additional.unit,
        price: additional.price,
        category: additional.category || '',
        isActive: additional.isActive,
      })
    } else {
      setEditingId(null)
      setFormData({
        description: '',
        unit: 'Global',
        price: 0,
        category: '',
        isActive: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({
      description: '',
      unit: 'Global',
      price: 0,
      category: '',
      isActive: true,
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const url = editingId ? `/api/additionals/${editingId}` : '/api/additionals'
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar adicional')
      }

      toast({
        title: editingId ? 'Adicional actualizado' : 'Adicional creado',
        description: 'Los cambios se han guardado correctamente',
      })

      handleCloseModal()
      fetchAdditionals(pagination.currentPage)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al guardar',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este adicional?')) return

    try {
      const response = await fetch(`/api/additionals/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar adicional')
      }

      toast({
        title: 'Adicional eliminado',
        description: 'El adicional ha sido marcado como inactivo',
      })

      fetchAdditionals(pagination.currentPage)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al eliminar',
        variant: 'destructive',
      })
    }
  }

  const columns = [
    {
      accessorKey: 'description',
      header: 'Descripción',
      cell: ({ row }: any) => (
        <div className="max-w-xs">
          <div className="font-medium">{row.original.description}</div>
          {row.original.category && (
            <div className="text-sm text-muted-foreground">
              {row.original.category}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'unit',
      header: 'Unidad',
      cell: ({ row }: any) => (
        <Badge variant="outline">{row.original.unit}</Badge>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Precio',
      cell: ({ row }: any) => (
        <span className="font-medium">
          {formatCurrency(row.original.price)}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }: any) => (
        <Badge className={row.original.isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
        }>
          {row.original.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Actualizado',
      cell: ({ row }: any) => (
        <span className="text-sm">
          {new Date(row.original.updatedAt).toLocaleDateString('es-ES')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenModal(row.original)}
            >
              <EditIcon className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              className="text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      ),
    },
  ]

  return (
    <PageTransition>
      <div className="container mx-auto py-6">
        <PageHeader
          title="Catálogo de Adicionales"
          description="Gestiona los servicios y productos complementarios"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenModal()}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nuevo Adicional
                </Button>
              </DialogTrigger>
            </Dialog>
          </motion.div>
        </PageHeader>

        {/* Filters Card */}
        <SectionTransition delay={0.1} className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar adicionales..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={activeFilter} onValueChange={setActiveFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="true">Activos</SelectItem>
                      <SelectItem value="false">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearch('')
                      setCategoryFilter('')
                      setActiveFilter('')
                    }}
                  >
                    <FilterIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionTransition>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={additionals}
              loading={loading}
              pagination={pagination}
              onPageChange={fetchAdditionals}
            />
          </CardContent>
        </Card>

        {/* Modal Dialog */}
        <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Adicional' : 'Nuevo Adicional'}
              </DialogTitle>
              <DialogDescription>
                {editingId 
                  ? 'Modifica los datos del adicional'
                  : 'Crea un nuevo servicio o producto adicional'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Descripción *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ej: Montaje de estructuras"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unit">Unidad *</Label>
                  <Select value={formData.unit} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, unit: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="price">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select value={formData.category} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, category: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin categoría</SelectItem>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Activo</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isActive: checked }))
                  }
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSave}
                  disabled={saving || !formData.description || formData.price < 0}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  )
}