'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { PlusIcon, SearchIcon, FilterIcon, EyeIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { PageTransition, SectionTransition } from '@/components/ui/page-transition'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/ui/page-header'

interface Budget {
  id: string
  version: number
  status: string
  createdAt: string
  finalTotal: number | null
  customer: {
    id: string
    companyName: string
    displayName: string | null
  }
  project: {
    id: string
    name: string
    description: string | null
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
  parentBudget: {
    id: string
    version: number
  } | null
  versions: {
    id: string
    version: number
    status: string
    createdAt: string
  }[]
}

interface BudgetsResponse {
  budgets: Budget[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

const BUDGET_STATUSES = [
  { value: 'DRAFT', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  { value: 'PRESENTED', label: 'Presentado', color: 'bg-blue-100 text-blue-800' },
  { value: 'APPROVED', label: 'Aprobado', color: 'bg-green-100 text-green-800' },
  { value: 'REJECTED', label: 'Rechazado', color: 'bg-red-100 text-red-800' },
  { value: 'CANCELLED', label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
]

export default function BudgetsClient() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  })
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const router = useRouter()
  const { toast } = useToast()

  const fetchBudgets = async (page: number = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      })

      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/budgets?${params}`)
      if (!response.ok) throw new Error('Error al cargar presupuestos')

      const data: BudgetsResponse = await response.json()
      setBudgets(data.budgets)
      setPagination(data.pagination)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los presupuestos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBudgets(1)
  }, [search, statusFilter, sortBy, sortOrder])

  const getStatusBadge = (status: string) => {
    const statusConfig = BUDGET_STATUSES.find(s => s.value === status)
    return (
      <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
        {statusConfig?.label || status}
      </Badge>
    )
  }

  const getUserName = (user: { firstName: string | null; lastName: string | null; email: string }) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim()
    }
    return user.email
  }

  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }: any) => (
        <span className="font-mono text-sm">
          {row.original.id.slice(-8)}
        </span>
      ),
    },
    {
      accessorKey: 'version',
      header: 'Versión',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">v{row.original.version}</span>
          {row.original.parentBudget && (
            <span className="text-xs text-muted-foreground">
              (de v{row.original.parentBudget.version})
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Cliente',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">
            {row.original.customer.displayName || row.original.customer.companyName}
          </div>
          {row.original.customer.displayName && (
            <div className="text-sm text-muted-foreground">
              {row.original.customer.companyName}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'project',
      header: 'Proyecto',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.project.name}</div>
          {row.original.project.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {row.original.project.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }: any) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'finalTotal',
      header: 'Total',
      cell: ({ row }: any) => (
        <span className="font-medium">
          {row.original.finalTotal ? formatCurrency(row.original.finalTotal) : 'Sin calcular'}
        </span>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Creado por',
      cell: ({ row }: any) => (
        <span className="text-sm">{getUserName(row.original.user)}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }: any) => (
        <span className="text-sm">
          {new Date(row.original.createdAt).toLocaleDateString('es-ES')}
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
              onClick={() => router.push(`/dashboard/budgets/${row.original.id}`)}
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              Ver
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
          title="Gestión de Presupuestos" 
          description="Administra todos los presupuestos del sistema"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => router.push('/dashboard/budget-wizard')}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </motion.div>
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle>Gestión de Presupuestos</CardTitle>
            <CardDescription>
              Administra todos los presupuestos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <SectionTransition delay={0.1} className="mb-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por ID, cliente, proyecto..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los estados</SelectItem>
                    {BUDGET_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-')
                  setSortBy(field)
                  setSortOrder(order as 'asc' | 'desc')
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Más recientes</SelectItem>
                    <SelectItem value="createdAt-asc">Más antiguos</SelectItem>
                    <SelectItem value="finalTotal-desc">Mayor valor</SelectItem>
                    <SelectItem value="finalTotal-asc">Menor valor</SelectItem>
                    <SelectItem value="version-desc">Versión desc.</SelectItem>
                    <SelectItem value="version-asc">Versión asc.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </SectionTransition>

            <DataTable
              columns={columns}
              data={budgets}
              pagination={pagination}
              onPageChange={fetchBudgets}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}