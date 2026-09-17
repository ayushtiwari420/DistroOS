import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart2,
  TrendingUp,
  ShoppingBag,
  Store,
  CreditCard,
  Boxes,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Layers,
  CheckCircle2,
  UserCheck,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

import {
  getExecutiveDashboardAnalytics,
  getRetailerAnalytics,
  getInventoryIntelligence,
  getCreditIntelligence,
  getReorderRecommendations
} from '../../../../services/wholesaler.service'

import Button from '../../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/Card'
import { SkeletonCard, SkeletonTable } from '../../../../components/ui/Skeleton'
import EmptyState from '../../../../components/ui/EmptyState'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const fmtNumber = (n) => Number(n || 0).toLocaleString('en-IN')

export default function AnalyticsTab({ onNavigate = () => {} }) {
  // ── Independent Section States ──
  const [execData, setExecData] = useState(null)
  const [execLoading, setExecLoading] = useState(true)
  const [execError, setExecError] = useState(null)

  const [retailerData, setRetailerData] = useState(null)
  const [retailerLoading, setRetailerLoading] = useState(true)
  const [retailerError, setRetailerError] = useState(null)

  const [inventoryData, setInventoryData] = useState(null)
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [inventoryError, setInventoryError] = useState(null)

  const [creditData, setCreditData] = useState(null)
  const [creditLoading, setCreditLoading] = useState(true)
  const [creditError, setCreditError] = useState(null)

  const [reorderData, setReorderData] = useState(null)
  const [reorderLoading, setReorderLoading] = useState(true)
  const [reorderError, setReorderError] = useState(null)

  const [lastUpdated, setLastUpdated] = useState(null)

  // ── Loaders for Each Section ──
  const fetchExecutive = useCallback(async () => {
    setExecLoading(true)
    setExecError(null)
    try {
      const res = await getExecutiveDashboardAnalytics()
      setExecData(res.data || res)
    } catch (err) {
      setExecError(err.message || 'Failed to load executive analytics')
    } finally {
      setExecLoading(false)
    }
  }, [])

  const fetchRetailers = useCallback(async () => {
    setRetailerLoading(true)
    setRetailerError(null)
    try {
      const res = await getRetailerAnalytics('?limit=5')
      setRetailerData(res.data || res)
    } catch (err) {
      setRetailerError(err.message || 'Failed to load retailer analytics')
    } finally {
      setRetailerLoading(false)
    }
  }, [])

  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true)
    setInventoryError(null)
    try {
      const res = await getInventoryIntelligence('?limit=5')
      setInventoryData(res.data || res)
    } catch (err) {
      setInventoryError(err.message || 'Failed to load inventory intelligence')
    } finally {
      setInventoryLoading(false)
    }
  }, [])

  const fetchCredit = useCallback(async () => {
    setCreditLoading(true)
    setCreditError(null)
    try {
      const res = await getCreditIntelligence('?limit=5')
      setCreditData(res.data || res)
    } catch (err) {
      setCreditError(err.message || 'Failed to load credit intelligence')
    } finally {
      setCreditLoading(false)
    }
  }, [])

  const fetchReorders = useCallback(async () => {
    setReorderLoading(true)
    setReorderError(null)
    try {
      const res = await getReorderRecommendations('?limit=5')
      setReorderData(res.data || res)
    } catch (err) {
      setReorderError(err.message || 'Failed to load reorder recommendations')
    } finally {
      setReorderLoading(false)
    }
  }, [])

  const refreshAll = useCallback(() => {
    fetchExecutive()
    fetchRetailers()
    fetchInventory()
    fetchCredit()
    fetchReorders()
    setLastUpdated(new Date())
  }, [fetchExecutive, fetchRetailers, fetchInventory, fetchCredit, fetchReorders])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // ── Sales Trend Chart Data ──
  const trendLabels = execData?.monthlyTrends?.map((t) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[(t._id?.month || 1) - 1]} ${t._id?.year || ''}`
  }) || []

  const trendRevenue = execData?.monthlyTrends?.map((t) => t.totalRevenue || 0) || []
  const trendOrders = execData?.monthlyTrends?.map((t) => t.totalOrders || 0) || []

  const chartData = {
    labels: trendLabels.length ? trendLabels : ['No Data'],
    datasets: [
      {
        type: 'line',
        label: 'Delivered Revenue (₹)',
        data: trendRevenue.length ? trendRevenue : [0],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.04)',
        borderWidth: 2.5,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: '#FFFFFF',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.25,
        yAxisID: 'y',
        fill: true
      },
      {
        type: 'bar',
        label: 'Orders Count',
        data: trendOrders.length ? trendOrders : [0],
        backgroundColor: 'rgba(209, 213, 219, 0.5)',
        hoverBackgroundColor: '#9CA3AF',
        borderRadius: 4,
        yAxisID: 'y1',
        barThickness: 18
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          font: { family: 'Inter', size: 12 },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: '#111827',
        titleFont: { family: 'Inter', size: 13, weight: '600' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: (context) => {
            if (context.dataset.yAxisID === 'y') {
              return ` Revenue: ${fmtCurrency(context.parsed.y)}`
            }
            return ` Orders: ${context.parsed.y}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#6B7280' }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: '#F3F4F6' },
        ticks: {
          font: { family: 'Inter', size: 11 },
          color: '#6B7280',
          callback: (value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: {
          font: { family: 'Inter', size: 11 },
          color: '#9CA3AF',
          stepSize: 1
        }
      }
    }
  }

  // ── Derived Overall Metrics ──
  const kpis = execData?.kpis || {}
  const totalRevenue = kpis.totalRevenue || 0
  const totalOrders = kpis.totalOrders || 0
  const activeRetailersCount = kpis.activeRetailers || 0
  const lowStockAlertsCount = kpis.lowStockAlerts || 0
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  const creditSummary = creditData?.summary || {}
  const totalOutstanding = creditSummary.totalOutstanding || creditData?.totalOutstanding || 0
  const inventorySummary = inventoryData?.summary || {}
  const inventoryValue = inventorySummary.inventoryCostValue || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto' }}>
      
      {/* ─────────────────────────────────────────────────────────────
          1. PAGE HEADER
      ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 4,
          borderBottom: '1px solid #E5E7EB'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1
              style={{
                fontFamily: 'Manrope, Inter, sans-serif',
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#111827',
                margin: 0
              }}
            >
              Analytics
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                background: '#EFF6FF',
                color: '#2563EB',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid #DBEAFE'
              }}
            >
              Live B2B ERP Ledger
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '3px 0 0' }}>
            Understand sales, customers, inventory, and credit across your distribution business.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshAll}
            icon={RefreshCw}
            style={{ fontSize: '0.8rem', background: '#FFFFFF', borderColor: '#E5E7EB' }}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. BUSINESS OVERVIEW (KPI TILES)
      ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16
        }}
      >
        {execLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} height={100} />)
        ) : execError ? (
          <div style={{ gridColumn: '1 / -1', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: 14, borderRadius: 8, fontSize: '0.85rem' }}>
            Failed to load KPI metrics. <Button variant="secondary" size="sm" onClick={fetchExecutive} style={{ marginLeft: 10 }}>Retry</Button>
          </div>
        ) : (
          <>
            <Card style={{ background: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: 'none' }}>
              <CardContent style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B7280' }}>Total Sales (Delivered)</span>
                  <TrendingUp size={16} color="#2563EB" />
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#111827' }}>
                  {fmtCurrency(totalRevenue)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: 4 }}>
                  Lifetime completed revenue
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: 'none' }}>
              <CardContent style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B7280' }}>Total Orders</span>
                  <ShoppingBag size={16} color="#2563EB" />
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#111827' }}>
                  {fmtNumber(totalOrders)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: 4 }}>
                  Across all network retailers
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: 'none' }}>
              <CardContent style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B7280' }}>Average Order Value</span>
                  <BarChart2 size={16} color="#2563EB" />
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#111827' }}>
                  {fmtCurrency(aov)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: 4 }}>
                  Per completed order
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: 'none' }}>
              <CardContent style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B7280' }}>Active Retailers</span>
                  <Store size={16} color="#2563EB" />
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#111827' }}>
                  {fmtNumber(activeRetailersCount)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: 4 }}>
                  Active purchasing accounts
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: 'none' }}>
              <CardContent style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B7280' }}>Outstanding Credit</span>
                  <CreditCard size={16} color="#2563EB" />
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#111827' }}>
                  {fmtCurrency(totalOutstanding)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: 4 }}>
                  Total active balance due
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: 'none' }}>
              <CardContent style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B7280' }}>Inventory Value</span>
                  <Boxes size={16} color="#2563EB" />
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#111827' }}>
                  {fmtCurrency(inventoryValue)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: 4 }}>
                  Asset cost value in warehouse
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          10. TOP INSIGHTS (DETERMINISTIC DATA-DRIVEN INSIGHTS)
      ───────────────────────────────────────────────────────────── */}
      {(!inventoryLoading || !creditLoading || !reorderLoading) && (
        <Card style={{ background: '#EFF6FF', borderColor: '#BFDBFE', boxShadow: 'none' }}>
          <CardContent style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Sparkles size={18} color="#2563EB" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1D4ED8', margin: 0 }}>
                Wholesale Operations Intelligence
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {inventorySummary.stockoutRiskCount > 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FFFFFF', padding: 12, borderRadius: 6, border: '1px solid #DBEAFE' }}>
                  <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>
                      {inventorySummary.stockoutRiskCount} product(s) approaching stockout risk
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                      Current stock is at or below threshold based on 30-day depletion velocity.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FFFFFF', padding: 12, borderRadius: 6, border: '1px solid #DBEAFE' }}>
                  <CheckCircle2 size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>
                      Inventory levels healthy
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                      No critical stockout risks detected across active catalog products.
                    </div>
                  </div>
                </div>
              )}

              {creditSummary.overdueAccounts > 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FFFFFF', padding: 12, borderRadius: 6, border: '1px solid #DBEAFE' }}>
                  <ShieldAlert size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>
                      {creditSummary.overdueAccounts} account(s) have overdue credit balances
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                      Total overdue: {fmtCurrency(creditSummary.totalOverdue || 0)}. Review in Credit tab.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FFFFFF', padding: 12, borderRadius: 6, border: '1px solid #DBEAFE' }}>
                  <CheckCircle2 size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>
                      Zero overdue accounts
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                      All retailer credit balances are current with no payment default flags.
                    </div>
                  </div>
                </div>
              )}

              {reorderData?.recommendations?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FFFFFF', padding: 12, borderRadius: 6, border: '1px solid #DBEAFE' }}>
                  <Clock size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>
                      Smart Reorder opportunities available
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                      Identified purchasing pattern cycles across network retailers.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. SALES ANALYTICS & TRENDS
      ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* Monthly Revenue & Order Volume Chart */}
        <Card style={{ gridColumn: 'span 2', background: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: 'none' }}>
          <CardHeader style={{ padding: '18px 20px 12px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <CardTitle style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                  Sales Performance & Order Volume Trend
                </CardTitle>
                <CardDescription style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                  6-month monthly aggregated delivered revenue and order counts
                </CardDescription>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', background: '#F8FAFC', padding: '3px 8px', borderRadius: 4, border: '1px solid #E5E7EB' }}>
                Calculation Period: 6 Months
              </span>
            </div>
          </CardHeader>
          <CardContent style={{ padding: 20 }}>
            {execLoading ? (
              <SkeletonCard height={240} />
            ) : execError ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#DC2626' }}>
                {execError}
              </div>
            ) : trendLabels.length === 0 ? (
              <EmptyState title="No sales trend data available" description="Completed orders will populate the 6-month revenue trend chart." />
            ) : (
              <div style={{ height: 260, position: 'relative' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Representatives Performance */}
        <Card style={{ background: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: 'none' }}>
          <CardHeader style={{ padding: '18px 20px 12px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <CardTitle style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                  Salesmen Performance
                </CardTitle>
                <CardDescription style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                  Revenue & orders generated by sales team
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('salesmen')}
                style={{ fontSize: '0.75rem', color: '#2563EB', padding: 0 }}
              >
                View All →
              </Button>
            </div>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {execLoading ? (
              <div style={{ padding: 16 }}><SkeletonTable rows={4} columns={3} /></div>
            ) : execError ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#DC2626', fontSize: '0.82rem' }}>Failed to load sales team data.</div>
            ) : !execData?.salesRepPerformance?.length ? (
              <div style={{ padding: 20 }}>
                <EmptyState title="No sales rep assignments" description="Orders placed by salesmen will display performance analytics here." />
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', color: '#6B7280', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600 }}>
                      <th style={{ padding: '10px 16px' }}>Salesman</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center' }}>Orders</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right' }}>Delivered Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {execData.salesRepPerformance.slice(0, 5).map((rep) => (
                      <tr key={rep._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#111827' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {rep.name?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div>
                              <div>{rep.name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 400 }}>{rep.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6B7280' }}>
                          {rep.totalOrders}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>
                          {fmtCurrency(rep.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. RETAILER ANALYTICS (TOP PURCHASING RETAILERS)
      ───────────────────────────────────────────────────────────── */}
      <Card style={{ background: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: 'none' }}>
        <CardHeader style={{ padding: '18px 20px 12px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <CardTitle style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                Retailer Performance & Risk Intelligence
              </CardTitle>
              <CardDescription style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                Top active accounts sorted by purchase volume and payment trust tier
              </CardDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('retailers')}
              style={{ fontSize: '0.78rem', borderColor: '#E5E7EB', background: '#FFFFFF' }}
            >
              Manage Retailers Network
            </Button>
          </div>
        </CardHeader>
        <CardContent style={{ padding: 0 }}>
          {retailerLoading ? (
            <div style={{ padding: 16 }}><SkeletonTable rows={5} columns={6} /></div>
          ) : retailerError ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#DC2626', fontSize: '0.83rem' }}>
              {retailerError} <Button variant="secondary" size="sm" onClick={fetchRetailers} style={{ marginLeft: 8 }}>Retry</Button>
            </div>
          ) : !retailerData?.retailers?.length ? (
            <div style={{ padding: 24 }}>
              <EmptyState title="No retailer analytics recorded" description="Retailers linked to your account will be analyzed here." />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', color: '#6B7280', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600 }}>
                    <th style={{ padding: '10px 16px' }}>Retailer</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center' }}>Orders</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right' }}>Total Purchases</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right' }}>AOV</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right' }}>Outstanding Credit</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center' }}>Trust Tier</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {retailerData.retailers.map((r) => (
                    <tr key={r.retailerId || r._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => onNavigate('retailer-detail', r.retailerId || r._id)}
                          style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', textDecoration: 'none' }}
                        >
                          <div style={{ fontWeight: 600, color: '#2563EB' }}>
                            {r.businessName || r.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                            {r.city ? `${r.city} • ` : ''}{r.phone || r.email}
                          </div>
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#111827', fontWeight: 500 }}>
                        {r.totalOrders || 0}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>
                        {fmtCurrency(r.totalSpent)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#6B7280' }}>
                        {fmtCurrency(r.averageOrderValue)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: r.currentDue > 0 ? '#111827' : '#6B7280' }}>
                        {fmtCurrency(r.currentDue)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: r.riskTier === 'Excellent' ? '#F0FDF4' : r.riskTier === 'Good' ? '#EFF6FF' : '#FFFBEB',
                            color: r.riskTier === 'Excellent' ? '#16A34A' : r.riskTier === 'Good' ? '#2563EB' : '#D97706',
                            border: `1px solid ${r.riskTier === 'Excellent' ? '#DCFCE7' : r.riskTier === 'Good' ? '#DBEAFE' : '#FEF3C7'}`
                          }}
                        >
                          {r.riskTier || 'Standard'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigate('retailer-detail', r.retailerId || r._id)}
                          style={{ fontSize: '0.75rem', color: '#2563EB' }}
                        >
                          Details →
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          6 & 7. PRODUCT & INVENTORY ANALYTICS (INVENTORY INTEL)
      ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* Product Intelligence Velocity Breakdown */}
        <Card style={{ background: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: 'none' }}>
          <CardHeader style={{ padding: '18px 20px 12px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <CardTitle style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                  Catalog Movement & Velocity
                </CardTitle>
                <CardDescription style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                  Source: Inventory Intelligence V1 (30-day velocity window)
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('inventory-intelligence')}
                style={{ fontSize: '0.75rem', color: '#2563EB', padding: 0 }}
              >
                Full Intel →
              </Button>
            </div>
          </CardHeader>
          <CardContent style={{ padding: 20 }}>
            {inventoryLoading ? (
              <SkeletonCard height={180} />
            ) : inventoryError ? (
              <div style={{ color: '#DC2626', fontSize: '0.82rem', textAlign: 'center' }}>{inventoryError}</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Fast-Moving Products</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#111827', marginTop: 4 }}>
                    {inventorySummary.fastMovingCount || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2 }}>≥ 3.0 units / day velocity</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Slow-Moving Products</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#111827', marginTop: 4 }}>
                    {inventorySummary.slowMovingCount || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2 }}>&lt; 0.2 units / day velocity</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Stockout Risk Products</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: inventorySummary.stockoutRiskCount > 0 ? '#D97706' : '#111827', marginTop: 4 }}>
                    {inventorySummary.stockoutRiskCount || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2 }}>Est. ≤ 7 days of stock left</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>No Recent Sales</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#111827', marginTop: 4 }}>
                    {inventorySummary.noRecentSalesCount || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2 }}>0 sales in last 30 days</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card style={{ background: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: 'none' }}>
          <CardHeader style={{ padding: '18px 20px 12px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <CardTitle style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                  Top Revenue-Generating Products
                </CardTitle>
                <CardDescription style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                  Highest revenue contributors across delivered orders
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('products')}
                style={{ fontSize: '0.75rem', color: '#2563EB', padding: 0 }}
              >
                Catalog →
              </Button>
            </div>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {execLoading ? (
              <div style={{ padding: 16 }}><SkeletonTable rows={4} columns={3} /></div>
            ) : !execData?.topProducts?.length ? (
              <div style={{ padding: 20 }}>
                <EmptyState title="No product sales recorded" description="Products sold in delivered orders will appear here." />
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', color: '#6B7280', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600 }}>
                      <th style={{ padding: '10px 16px' }}>Product</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center' }}>Units Sold</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {execData.topProducts.map((p) => (
                      <tr key={p._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#111827' }}>
                          {p.productName || 'Product'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6B7280' }}>
                          {fmtNumber(p.totalQuantity)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>
                          {fmtCurrency(p.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          8. CREDIT INTELLIGENCE ANALYTICS
      ───────────────────────────────────────────────────────────── */}
      <Card style={{ background: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: 'none' }}>
        <CardHeader style={{ padding: '18px 20px 12px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <CardTitle style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                Credit Intelligence & Exposure Classifications
              </CardTitle>
              <CardDescription style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                Real backend credit health metrics using strict V1 ledger classification rules
              </CardDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('credit')}
              style={{ fontSize: '0.78rem', borderColor: '#E5E7EB', background: '#FFFFFF' }}
            >
              Open Credit Desk
            </Button>
          </div>
        </CardHeader>
        <CardContent style={{ padding: 20 }}>
          {creditLoading ? (
            <SkeletonCard height={120} />
          ) : creditError ? (
            <div style={{ color: '#DC2626', fontSize: '0.83rem', textAlign: 'center' }}>
              {creditError} <Button variant="secondary" size="sm" onClick={fetchCredit} style={{ marginLeft: 8 }}>Retry</Button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12
                }}
              >
                {/* HEALTHY */}
                <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16A34A' }}>HEALTHY Accounts</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#16A34A', marginTop: 4 }}>
                    {creditSummary.healthyAccounts || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2 }}>Normal utilization & consistent payments</div>
                </div>

                {/* WATCH */}
                <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#D97706' }}>WATCH Accounts</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#D97706', marginTop: 4 }}>
                    {creditSummary.watchAccounts || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2 }}>60–84% utilization or delayed history</div>
                </div>

                {/* HIGH EXPOSURE */}
                <div style={{ background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563EB' }}>HIGH EXPOSURE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2563EB', marginTop: 4 }}>
                    {creditSummary.highExposureAccounts || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2 }}>≥ 85% credit utilization limit</div>
                </div>

                {/* OVERDUE */}
                <div style={{ background: creditSummary.overdueAccounts > 0 ? '#FEF2F2' : '#F8FAFC', border: `1px solid ${creditSummary.overdueAccounts > 0 ? '#FCA5A5' : '#E5E7EB'}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: creditSummary.overdueAccounts > 0 ? '#DC2626' : '#6B7280' }}>OVERDUE Accounts</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: creditSummary.overdueAccounts > 0 ? '#DC2626' : '#111827', marginTop: 4 }}>
                    {creditSummary.overdueAccounts || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2 }}>Balances past due repayment date</div>
                </div>

                {/* INSUFFICIENT DATA */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>INSUFFICIENT DATA</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827', marginTop: 4 }}>
                    {creditSummary.insufficientDataAccounts || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: 2 }}>New or unassigned limit accounts</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          9. SMART REORDER ANALYTICS
      ───────────────────────────────────────────────────────────── */}
      <Card style={{ background: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: 'none' }}>
        <CardHeader style={{ padding: '18px 20px 12px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <CardTitle style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                Smart Reorder Cycle Intelligence
              </CardTitle>
              <CardDescription style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                Predicted replenishment timing based on historical ordering frequency
              </CardDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('smart-reorder')}
              style={{ fontSize: '0.78rem', borderColor: '#E5E7EB', background: '#FFFFFF' }}
            >
              Open Reorder Engine
            </Button>
          </div>
        </CardHeader>
        <CardContent style={{ padding: 20 }}>
          {reorderLoading ? (
            <SkeletonCard height={120} />
          ) : reorderError ? (
            <div style={{ color: '#DC2626', fontSize: '0.83rem', textAlign: 'center' }}>
              {reorderError} <Button variant="secondary" size="sm" onClick={fetchReorders} style={{ marginLeft: 8 }}>Retry</Button>
            </div>
          ) : !reorderData?.recommendations?.length ? (
            <EmptyState title="No reorder predictions available" description="Repeat order history is required to calculate retailer reorder intervals." />
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {reorderData.recommendations.slice(0, 4).map((item, idx) => (
                  <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827' }}>
                        {item.retailer?.name || 'Retailer'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: item.status === 'REORDER_DUE' ? '#EFF6FF' : item.status === 'DUE_SOON' ? '#FFFBEB' : '#F8FAFC',
                          color: item.status === 'REORDER_DUE' ? '#2563EB' : item.status === 'DUE_SOON' ? '#D97706' : '#6B7280',
                          border: `1px solid ${item.status === 'REORDER_DUE' ? '#DBEAFE' : item.status === 'DUE_SOON' ? '#FEF3C7' : '#E5E7EB'}`
                        }}
                      >
                        {item.status?.replace('_', ' ') || 'UNKNOWN'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 600, marginBottom: 4 }}>
                      {item.product?.name || 'Product'}
                    </div>

                    <div style={{ fontSize: '0.73rem', color: '#6B7280', lineHeight: 1.4 }}>
                      {item.explanation || `Reorder interval: ${item.averageOrderInterval || 0} days.`}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid #E5E7EB', fontSize: '0.72rem', color: '#6B7280' }}>
                      <span>Avg Qty: {item.averageQuantity} units</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>Last purchase: {item.daysSinceLastPurchase}d ago</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* ─────────────────────────────────────────────────────────────
          11. DATA EXPLANATION FOOTER
      ───────────────────────────────────────────────────────────── */}
      <div style={{ fontSize: '0.75rem', color: '#6B7280', textAlign: 'center', padding: '12px 0 24px', borderTop: '1px solid #E5E7EB' }}>
        DistroOS B2B Analytics Engine • Source: Wholesaler ERP Database & Live Order Ledger • Server-side aggregated
      </div>
    </div>
  )
}
