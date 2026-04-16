import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, TrendingUp, Package, DollarSign } from 'lucide-react'
import { useStockVariants } from '@/hooks/useStockVariants'

const VARIANT_COLORS = {
  inpatient: '#3b82f6',
  nursing: '#10b981',
  surgery: '#f59e0b',
}

interface StockData {
  medication_id: string
  medication_name: string
  total_quantity: number
  total_available: number
  total_reserved: number
  total_value: number
  expiry_soon: boolean
}

export function MedicationStockDashboard() {
  const { variants, loading, error, fetchVariants, getSummary } = useStockVariants()
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null)
  const [stockData, setStockData] = useState<StockData[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([])

  useEffect(() => {
    // Initialize with sample data or fetch all
    loadStockData()
  }, [])

  const loadStockData = async () => {
    // In real scenario, fetch from database
    // For now, transform existing variants
    const data: StockData[] = []
    const groupedByMed = new Map<string, any>()

    variants.forEach((v) => {
      if (!groupedByMed.has(v.medication_id)) {
        groupedByMed.set(v.medication_id, {
          medication_id: v.medication_id,
          total_quantity: 0,
          total_available: 0,
          total_reserved: 0,
          total_value: 0,
          expiry_soon: false,
        })
      }

      const entry = groupedByMed.get(v.medication_id)
      entry.total_quantity += v.quantity_total
      entry.total_available += v.quantity_available
      entry.total_reserved += v.quantity_reserved
      entry.total_value += v.quantity_total * v.unit_cost

      if (v.expiry_date) {
        const expiry = new Date(v.expiry_date)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        entry.expiry_soon = expiry <= thirtyDaysFromNow
      }
    })

    setStockData(Array.from(groupedByMed.values()))
  }

  const selectedData = selectedMedication
    ? stockData.find((d) => d.medication_id === selectedMedication)
    : null

  const variantDistribution = selectedData
    ? [
        {
          name: 'Inpatient',
          value:
            variants
              .filter(
                (v) =>
                  v.medication_id === selectedMedication && v.variant_type === 'inpatient'
              )
              .reduce((sum, v) => sum + v.quantity_available, 0) || 0,
        },
        {
          name: 'Nursing',
          value:
            variants
              .filter(
                (v) =>
                  v.medication_id === selectedMedication && v.variant_type === 'nursing'
              )
              .reduce((sum, v) => sum + v.quantity_available, 0) || 0,
        },
        {
          name: 'Surgery',
          value:
            variants
              .filter(
                (v) =>
                  v.medication_id === selectedMedication && v.variant_type === 'surgery'
              )
              .reduce((sum, v) => sum + v.quantity_available, 0) || 0,
        },
      ]
    : []

  const totalValue = stockData.reduce((sum, d) => sum + d.total_value, 0)
  const totalAvailable = stockData.reduce((sum, d) => sum + d.total_available, 0)
  const totalReserved = stockData.reduce((sum, d) => sum + d.total_reserved, 0)
  const expiringCount = stockData.filter((d) => d.expiry_soon).length

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total medication stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAvailable}</div>
            <p className="text-xs text-muted-foreground">Units ready for use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReserved}</div>
            <p className="text-xs text-muted-foreground">Currently reserved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expiringCount}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Medication */}
        <Card>
          <CardHeader>
            <CardTitle>Stock by Medication</CardTitle>
            <CardDescription>Available vs Reserved quantity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="medication_id" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_available" stackId="a" fill="#3b82f6" name="Available" />
                <Bar dataKey="total_reserved" stackId="a" fill="#ef4444" name="Reserved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Value Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Value Distribution</CardTitle>
            <CardDescription>Medication cost breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stockData.slice(0, 5)}
                  dataKey="total_value"
                  nameKey="medication_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {stockData.slice(0, 5).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Variant Distribution for Selected Med */}
      {selectedData && (
        <Card>
          <CardHeader>
            <CardTitle>Variant Distribution</CardTitle>
            <CardDescription>Stock by department type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={variantDistribution.filter((v) => v.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {variantDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        Object.values(VARIANT_COLORS)[
                          index % Object.keys(VARIANT_COLORS).length
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Medication List with Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Medications</CardTitle>
          <CardDescription>Click to view details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stockData.map((med) => (
              <div
                key={med.medication_id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() =>
                  setSelectedMedication(
                    selectedMedication === med.medication_id ? null : med.medication_id
                  )
                }
              >
                <div className="flex-1">
                  <div className="font-medium">{med.medication_id}</div>
                  <div className="text-sm text-muted-foreground">
                    ${med.total_value.toFixed(2)} • {med.total_available} available
                  </div>
                </div>
                {med.expiry_soon && <Badge variant="destructive">Expiring</Badge>}
                <Badge
                  variant={med.total_available > 10 ? 'default' : 'secondary'}
                >
                  {med.total_available} units
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
