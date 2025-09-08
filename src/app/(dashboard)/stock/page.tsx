'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PlusIcon, SearchIcon, FilterIcon, PackageIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PageTransition, SectionTransition } from '@/components/ui/page-transition'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/ui/page-header';

interface StockItem {
  id: string
  quantity: number
  location: string | null
  piece: {
    id: string
    description: string
    family: {
      id: string
      code: string
      description: string | null
    }
  }
  plant: {
    id: string
    name: string
    location: string | null
  }
}

interface Plant {
  id: string
  name: string
  location: string | null
}

interface Piece {
  id: string
  description: string
  family: {
    id: string
    code: string
    description: string | null
  }
}

interface PieceFamily {
  id: string
  code: string
  description: string | null
}

interface StockResponse {
  stockItems: StockItem[]
  summary: {
    totalItems: number
    totalPieces: number
  }
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

interface MovementFormData {
  pieceId: string
  plantId: string
  quantity: number
  type: string
  budgetId: string
  notes: string
}

const MOVEMENT_TYPES = [
  { value: 'PRODUCTION_ENTRY', label: 'Entrada de Producción', icon: TrendingUpIcon, color: 'text-green-600' },
  { value: 'DISPATCH_EXIT', label: 'Despacho', icon: TrendingDownIcon, color: 'text-red-600' },
  { value: 'ADJUSTMENT_POSITIVE', label: 'Ajuste Positivo', icon: TrendingUpIcon, color: 'text-blue-600' },
  { value: 'ADJUSTMENT_NEGATIVE', label: 'Ajuste Negativo', icon: TrendingDownIcon, color: 'text-orange-600' },
  { value: 'TRANSFER_IN', label: 'Transferencia Entrada', icon: TrendingUpIcon, color: 'text-purple-600' },
  { value: 'TRANSFER_OUT', label: 'Transferencia Salida', icon: TrendingDownIcon, color: 'text-purple-600' },
  { value: 'RETURN_ENTRY', label: 'Devolución', icon: TrendingUpIcon, color: 'text-indigo-600' },
  { value: 'DAMAGE_EXIT', label: 'Baja por Daño', icon: TrendingDownIcon, color: 'text-gray-600' },
]

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ totalItems: 0, totalPieces: 0 })
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
  const [plantFilter, setPlantFilter] = useState('')
  const [familyFilter, setFamilyFilter] = useState('')
  
  // Movement modal
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [movementData, setMovementData] = useState<MovementFormData>({
    pieceId: '',
    plantId: '',
    quantity: 1,
    type: 'PRODUCTION_ENTRY',
    budgetId: '',
    notes: '',
  })
  const [movementSaving, setMovementSaving] = useState(false)
  
  // Data for selects
  const [plants, setPlants] = useState<Plant[]>([])
  const [pieces, setPieces] = useState<Piece[]>([])
  const [families, setFamilies] = useState<PieceFamily[]>([])
  
  const { toast } = useToast()

  const fetchStock = async (page: number = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })

      if (search) params.append('search', search)
      if (plantFilter) params.append('plantId', plantFilter)
      if (familyFilter) params.append('familyId', familyFilter)

      const response = await fetch(`/api/stock?${params}`)
      if (!response.ok) throw new Error('Error al cargar inventario')

      const data: StockResponse = await response.json()
      setStockItems(data.stockItems)
      setSummary(data.summary)
      setPagination(data.pagination)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el inventario',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMasterData = async () => {
    try {
      // Fetch plants
      const plantsResponse = await fetch('/api/plants')
      if (plantsResponse.ok) {
        const plantsData = await plantsResponse.json()
        setPlants(plantsData.plants || [])
      }

      // Fetch pieces
      const piecesResponse = await fetch('/api/pieces')
      if (piecesResponse.ok) {
        const piecesData = await piecesResponse.json()
        setPieces(piecesData.pieces || [])
      }

      // Fetch families
      const familiesResponse = await fetch('/api/piece-families')
      if (familiesResponse.ok) {
        const familiesData = await familiesResponse.json()
        setFamilies(familiesData.families || [])
      }
    } catch (error) {
      console.error('Error fetching master data:', error)
    }
  }

  useEffect(() => {
    fetchStock(1)
    fetchMasterData()
  }, [search, plantFilter, familyFilter])

  const handleOpenMovementModal = () => {
    setMovementData({
      pieceId: '',
      plantId: '',
      quantity: 1,
      type: 'PRODUCTION_ENTRY',
      budgetId: '',
      notes: '',
    })
    setIsMovementModalOpen(true)
  }

  const handleMovementSave = async () => {
    try {
      setMovementSaving(true)
      
      const response = await fetch('/api/stock/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al registrar movimiento')
      }

      toast({
        title: 'Movimiento registrado',
        description: 'El movimiento de inventario se ha registrado correctamente',
      })

      setIsMovementModalOpen(false)
      fetchStock(pagination.currentPage)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al registrar movimiento',
        variant: 'destructive',
      })
    } finally {
      setMovementSaving(false)
    }
  }

  const getMovementTypeConfig = (type: string) => {
    return MOVEMENT_TYPES.find(mt => mt.value === type) || MOVEMENT_TYPES[0]
  }

  const columns = [
    {
      accessorKey: 'piece.family.code',
      header: 'Familia',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.piece.family.code}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.piece.family.description || '-'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'piece.description',
      header: 'Pieza',
      cell: ({ row }: any) => (
        <div className="max-w-xs truncate">
          {row.original.piece.description}
        </div>
      ),
    },
    {
      accessorKey: 'plant.name',
      header: 'Planta',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.plant.name}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.plant.location || '-'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Cantidad',
      cell: ({ row }: any) => (
        <span className="font-medium">
          {row.original.quantity}
        </span>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Ubicación',
      cell: ({ row }: any) => (
        <span className="text-sm">
          {row.original.location || '-'}
        </span>
      ),
    },
  ]

  return (
    <PageTransition>
      <div className="container mx-auto py-6">
        <PageHeader
          title="Inventario de Piezas"
          description="Gestiona el stock de piezas en todas las plantas"
        >
          <Button onClick={handleOpenMovementModal}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Registrar Movimiento
          </Button>
        </PageHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <PackageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{summary.totalItems}</div>
                  <div className="text-sm text-muted-foreground">Tipos de Piezas</div>
                </div>
              </div>
            </CardContent>
          </Card>
            
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <PackageIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{summary.totalPieces}</div>
                  <div className="text-sm text-muted-foreground">Piezas Totales</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Filters */}
        <SectionTransition delay={0.1} className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Inventario</CardTitle>
              <CardDescription>
                Busca y filtra el inventario por diferentes criterios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar piezas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={plantFilter} onValueChange={setPlantFilter}>
                  <SelectTrigger>
                    <FilterIcon className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por planta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las plantas</SelectItem>
                    {plants.map((plant) => (
                      <SelectItem key={plant.id} value={plant.id}>
                        {plant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={familyFilter} onValueChange={setFamilyFilter}>
                  <SelectTrigger>
                    <FilterIcon className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por familia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las familias</SelectItem>
                    {families.map((family) => (
                      <SelectItem key={family.id} value={family.id}>
                        {family.code} - {family.description || 'Sin descripción'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </SectionTransition>

        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={stockItems}
              pagination={pagination}
              onPageChange={fetchStock}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}