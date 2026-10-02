import { Car } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Bell,
  ClipboardList,
  BriefcaseBusiness,
  CircleDollarSign,
  CreditCard,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Printer,
  Settings,
  ShoppingBag,
  Sparkles,
  Utensils,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api' })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eventhub_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

type RentalProduct = {
  id: number
  name: string
  category_id: number
  description: string
  quantity: number
  available_quantity: number
  rental_price: number
  unit: string
  security_deposit: number
  delivery_charge: number
  setup_charge: number
  status: string
  location: string
}
type ProductCategory = { id: number; name: string }
type BookingLine = { product_id: number; quantity: number }
type VehicleCatalogRecord = { id: number; name: string; vehicle_type: string; price_per_day: number; price_per_km: number }
type BookingVehicleLine = { vehicle_id: number; days: number; kilometers: number }
type BookingCateringLine = { menu_id: number; plates: number }
type NotificationRecord = { id: number; title: string; message: string; created_at: string; is_read: boolean }
type InventoryRecord = {
  id: number
  product_id: number
  product_name: string
  total_quantity: number
  available_quantity: number
  booked_quantity: number
  damaged_quantity: number
  lost_quantity: number
  returned_quantity: number
  location: string
}
type VehicleRecord = {
  id: number
  name: string
  vehicle_number: string
  vehicle_type: string
  driver_name: string
  driver_phone: string
  price_per_day: number
  price_per_km: number
  availability: 'Available' | 'Booked' | 'Maintenance' | 'Unavailable'
  image_url: string
}
type CateringMenuRecord = {
  id: number
  name: string
  description: string
  price_per_plate: number
  plates: number
  is_veg: boolean
  serving_time: string
}

function dateKey(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function Sidebar() {
  const items = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Bookings', to: '/admin/bookings', icon: ClipboardList },
    { label: 'Calendar', to: '/admin/calendar', icon: CalendarDays },
    { label: 'Products', to: '/admin/products', icon: ShoppingBag },
    { label: 'Inventory', to: '/admin/inventory', icon: Package },
    { label: 'Vehicles', to: '/admin/vehicles', icon: Car },
    { label: 'Catering', to: '/admin/catering', icon: Utensils },
    { label: 'Reports', to: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Customers', to: '/admin/customers', icon: Users },
    { label: 'Staff', to: '/admin/staff', icon: BriefcaseBusiness },
    { label: 'Invoices', to: '/admin/invoices', icon: CreditCard },
    { label: 'Payments', to: '/admin/payments', icon: CircleDollarSign },
    { label: 'Quotations', to: '/admin/quotations', icon: FileText },
    { label: 'Notifications', to: '/admin/notifications', icon: Bell },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ]

  return (
    <aside className="hidden w-72 shrink-0 bg-slate-950 p-6 text-slate-200 lg:block">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-slate-950">E</div>
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-amber-300">EventHub</p>
          <p className="text-xs text-slate-400">Operations Suite</p>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map(({ label, to, icon: Icon }) => (
          <Link key={label} to={to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white">
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-10 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Live</p>
        <p className="mt-2 text-2xl font-semibold text-white">18</p>
        <p className="text-sm text-slate-300">Upcoming events this week</p>
      </div>
    </aside>
  )
}

function Topbar() {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem('eventhub_token')
    navigate('/login', { replace: true })
  }

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 p-2 text-slate-700 lg:hidden">
            <LayoutDashboard size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Overview</p>
            <h1 className="text-xl font-semibold text-slate-900">EventHub Admin</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={logout} aria-label="Log out" title="Log out" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"><LogOut size={18} /></button>
          <Link to="/admin/reports" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Reports</Link>
          <Link to="/create-booking" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">New Booking</Link>
        </div>
      </div>
    </header>
  )
}

function StatCard({ label, value, change, tone }: { label: string; value: string; change: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${tone}`}>{change}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function DashboardPage() {
  const [stats, setStats] = useState<{ total_bookings: number; total_revenue: number; pending_payments: number; available_products: number; low_stock_items: number; customers: number } | null>(null)
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([])
  const [bookingsData, setBookingsData] = useState<{ name: string; value: number }[]>([])
  const [inventoryData, setInventoryData] = useState<{ product_name: string; total_quantity: number; available_quantity: number; booked_quantity: number }[]>([])
  const [bookingRows, setBookingRows] = useState<BookingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/revenue'),
      api.get('/dashboard/bookings'),
      api.get('/inventory'),
      api.get<BookingRecord[]>('/bookings'),
    ])
      .then(([statsResponse, revenueResponse, bookingsResponse, inventoryResponse, bookingResponse]) => {
        setStats(statsResponse.data)
        setRevenueData(revenueResponse.data)
        setBookingsData(bookingsResponse.data)
        setInventoryData(inventoryResponse.data)
        setBookingRows(bookingResponse.data.slice(0, 5))
      })
      .catch((requestError) => {
        const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined
        setError(status === 401 ? 'Sign in as an admin to view the dashboard.' : 'Dashboard data could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 p-6">
      {error && <p role="alert" className="text-sm text-rose-700">{error} {error.includes('Sign in') && <Link to="/login" className="font-medium underline">Login</Link>}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Bookings" value={loading ? '—' : String(stats?.total_bookings ?? 0)} change="All records" tone="bg-emerald-100 text-emerald-700" />
        <StatCard label="Revenue Collected" value={loading ? '—' : `₹${(stats?.total_revenue ?? 0).toLocaleString('en-IN')}`} change="Paid payments" tone="bg-amber-100 text-amber-700" />
        <StatCard label="Outstanding" value={loading ? '—' : `₹${(stats?.pending_payments ?? 0).toLocaleString('en-IN')}`} change="Invoice balance" tone="bg-rose-100 text-rose-700" />
        <StatCard label="Customers" value={loading ? '—' : String(stats?.customers ?? 0)} change="Registered" tone="bg-sky-100 text-sky-700" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Monthly Revenue</h2>
            <span className="text-sm text-slate-500">INR</span>
          </div>
          <div className="h-72">
            {loading ? <p className="pt-24 text-center text-sm text-slate-500">Loading revenue…</p> : revenueData.length === 0 ? <p className="pt-24 text-center text-sm text-slate-500">No paid revenue in the reporting period.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Booking Type</h2>
          <div className="h-72">
            {loading ? <p className="pt-24 text-center text-sm text-slate-500">Loading booking mix…</p> : bookingsData.length === 0 ? <p className="pt-24 text-center text-sm text-slate-500">No active bookings.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bookingsData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={45} fill="#0f172a">
                    {bookingsData.map((entry, index) => <Cell key={entry.name} fill={['#f59e0b', '#f97316', '#fb7185', '#38bdf8', '#10b981'][index % 5]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Bookings</h2>
            <Link to="/admin/bookings" className="text-sm font-medium text-amber-600">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4">Booking</th>
                  <th className="py-3 pr-4">Event</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {!loading && bookingRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 align-middle">
                    <td className="py-3 pr-4 font-medium text-slate-800">#{row.id}</td>
                    <td className="py-3 pr-4">{row.event_type}</td>
                    <td className="py-3 pr-4">{row.event_date}</td>
                    <td className="py-3 pr-4">₹{row.grand_total.toLocaleString('en-IN')}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{row.status}</span>
                    </td>
                  </tr>
                ))}
                {!loading && bookingRows.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-500">No bookings yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Inventory Snapshot</h2>
          <div className="space-y-4">
            {inventoryData.map((item) => (
              <div key={item.product_name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.product_name}</span>
                  <span className="text-slate-500">{item.available_quantity} / {item.total_quantity}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${item.total_quantity > 0 ? (item.available_quantity / item.total_quantity) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
            {!loading && inventoryData.length === 0 && <p className="text-sm text-slate-500">No inventory records.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportsPage() {
  type ReportPayload = {
    totals: { total_bookings: number; active_bookings: number; booking_value: number; revenue_collected: number; outstanding_balance: number }
    event_types: { name: string; count: number }[]
    bookings: { booking_id: number; customer_name: string; event_type: string; event_date: string; status: string; booking_total: number; paid_amount: number; balance_due: number }[]
  }
  const year = new Date().getFullYear()
  const [startDate, setStartDate] = useState(() => dateKey(new Date(year, 0, 1)))
  const [endDate, setEndDate] = useState(() => dateKey(new Date(year, 11, 31)))
  const [report, setReport] = useState<ReportPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadReport(from = startDate, to = endDate) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get<ReportPayload>('/reports/summary', { params: { start_date: from, end_date: to } })
      setReport(response.data)
    } catch (requestError) {
      const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined
      setError(status === 401 ? 'Sign in as an admin to view reports.' : 'Report data could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReport(dateKey(new Date(year, 0, 1)), dateKey(new Date(year, 11, 31)))
  }, [])

  function downloadCsv() {
    if (!report) return
    const csvField = (value: string | number) => {
      const text = String(value)
      const safeText = /^\s*[=+\-@]/.test(text) ? `'${text}` : text
      return `"${safeText.replaceAll('"', '""')}"`
    }
    const rows = [
      ['Booking', 'Customer', 'Event', 'Event date', 'Status', 'Booking total', 'Paid', 'Balance due'],
      ...report.bookings.map((booking) => [booking.booking_id, booking.customer_name, booking.event_type, booking.event_date, booking.status, booking.booking_total, booking.paid_amount, booking.balance_due]),
    ]
    const csv = rows.map((row) => row.map(csvField).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `eventhub-report-${startDate}-to-${endDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const money = (value: number) => `₹${value.toLocaleString('en-IN')}`

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Business intelligence</p>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); void loadReport() }} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-slate-700">Event date from<input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Event date to<input required type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <button type="submit" disabled={loading} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{loading ? 'Loading…' : 'Run report'}</button>
        <button type="button" onClick={downloadCsv} disabled={!report || report.bookings.length === 0} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-40">Export CSV</button>
      </form>
      {error && <p role="alert" className="text-sm text-rose-700">{error} {error.includes('Sign in') && <Link to="/login" className="font-medium underline">Login</Link>}</p>}
      {report && <>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Bookings" value={String(report.totals.total_bookings)} change={`${report.totals.active_bookings} active`} tone="bg-sky-100 text-sky-700" />
          <StatCard label="Booking value" value={money(report.totals.booking_value)} change="Active bookings" tone="bg-slate-100 text-slate-700" />
          <StatCard label="Collected" value={money(report.totals.revenue_collected)} change="Confirmed payments" tone="bg-emerald-100 text-emerald-700" />
          <StatCard label="Outstanding" value={money(report.totals.outstanding_balance)} change="Active invoices" tone="bg-amber-100 text-amber-700" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Event mix</h2>
            {report.event_types.length === 0 ? <p className="text-sm text-slate-500">No active bookings in this period.</p> : <div className="divide-y divide-slate-100">{report.event_types.map((item) => <div key={item.name} className="flex justify-between py-3 text-sm"><span className="text-slate-700">{item.name}</span><span className="font-semibold text-slate-900">{item.count}</span></div>)}</div>}
          </section>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto"><table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-medium">Booking</th><th className="px-4 py-3 font-medium">Customer / event</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Total</th><th className="px-4 py-3 font-medium">Paid</th><th className="px-4 py-3 font-medium">Due</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Updating report…</td></tr>}
                {!loading && report.bookings.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No bookings in this date range.</td></tr>}
                {!loading && report.bookings.map((booking) => <tr key={booking.booking_id} className="border-t border-slate-100"><td className="px-4 py-3 font-medium text-slate-800">#{booking.booking_id}</td><td className="px-4 py-3"><span className="block text-slate-800">{booking.customer_name}</span><span className="text-xs text-slate-500">{booking.event_type}</span></td><td className="px-4 py-3">{booking.event_date}</td><td className="px-4 py-3">{booking.status}</td><td className="px-4 py-3">{money(booking.booking_total)}</td><td className="px-4 py-3">{money(booking.paid_amount)}</td><td className="px-4 py-3">{money(booking.balance_due)}</td></tr>)}
              </tbody>
            </table></div>
          </section>
        </div>
      </>}
    </div>
  )
}

function ProductsPage({ allowCreate = false }: { allowCreate?: boolean }) {
  const [products, setProducts] = useState<RentalProduct[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState({
    name: '', category_id: '', description: '', quantity: '0', rental_price: '0', unit: 'Piece',
    security_deposit: '0', delivery_charge: '0', setup_charge: '0', location: 'Aurangabad',
  })

  async function loadCatalog() {
    const [productResponse, categoryResponse] = await Promise.all([
      api.get<RentalProduct[]>('/products'),
      api.get<ProductCategory[]>('/categories'),
    ])
    setProducts(productResponse.data)
    setCategories(categoryResponse.data)
  }

  useEffect(() => {
    loadCatalog()
      .catch(() => setError('Product catalog could not be loaded.'))
      .finally(() => setLoading(false))
  }, [])

  async function submitProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      await api.post('/products', {
        ...draft,
        category_id: Number(draft.category_id),
        quantity: Number(draft.quantity),
        rental_price: Number(draft.rental_price),
        security_deposit: Number(draft.security_deposit),
        delivery_charge: Number(draft.delivery_charge),
        setup_charge: Number(draft.setup_charge),
      })
      await loadCatalog()
      setFormOpen(false)
      setDraft({ name: '', category_id: '', description: '', quantity: '0', rental_price: '0', unit: 'Piece', security_deposit: '0', delivery_charge: '0', setup_charge: '0', location: 'Aurangabad' })
      setNotice('Product added to the catalog.')
    } catch (requestError) {
      const detail = axios.isAxiosError(requestError) ? requestError.response?.data?.detail : null
      setError(typeof detail === 'string' ? detail : 'Product could not be created.')
    } finally {
      setSubmitting(false)
    }
  }

  const categoryNames = new Map(categories.map((category) => [category.id, category.name]))

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Catalog</p>
          <h1 className="text-2xl font-semibold text-slate-900">Products & Rentals</h1>
        </div>
        {allowCreate && <button type="button" onClick={() => setFormOpen((open) => !open)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">{formOpen ? 'Close form' : 'Add product'}</button>}
      </div>

      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}

      {formOpen && allowCreate && (
        <form onSubmit={submitProduct} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">Product name<input required maxLength={200} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-medium text-slate-700">Category<select required value={draft.category_id} onChange={(event) => setDraft((current) => ({ ...current, category_id: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Rental price<input required type="number" min="0" step="0.01" value={draft.rental_price} onChange={(event) => setDraft((current) => ({ ...current, rental_price: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-medium text-slate-700">Total quantity<input required type="number" min="0" step="1" value={draft.quantity} onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-medium text-slate-700">Rental unit<input required maxLength={50} value={draft.unit} onChange={(event) => setDraft((current) => ({ ...current, unit: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-medium text-slate-700">Location<input maxLength={150} value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-3">Description<textarea rows={2} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-medium text-slate-700">Security deposit<input type="number" min="0" step="0.01" value={draft.security_deposit} onChange={(event) => setDraft((current) => ({ ...current, security_deposit: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-medium text-slate-700">Delivery charge<input type="number" min="0" step="0.01" value={draft.delivery_charge} onChange={(event) => setDraft((current) => ({ ...current, delivery_charge: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-medium text-slate-700">Setup charge<input type="number" min="0" step="0.01" value={draft.setup_charge} onChange={(event) => setDraft((current) => ({ ...current, setup_charge: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <div className="md:col-span-2 xl:col-span-3"><button type="submit" disabled={submitting || categories.length === 0} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Saving…' : 'Save product'}</button></div>
        </form>
      )}

      {loading ? <p className="text-sm text-slate-500">Loading catalog…</p> : products.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No products in the catalog.</p> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">{categoryNames.get(item.category_id) ?? 'Rental'}</span>
                <span className="text-xs text-slate-500">{item.available_quantity} / {item.quantity} available</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{item.name}</h2>
              <p className="mt-2 min-h-10 text-sm text-slate-500">{item.description || 'Available for event rental.'}</p>
              <div className="mt-5 flex items-end justify-between gap-3">
                <span className="text-xl font-semibold text-slate-900">₹{item.rental_price.toLocaleString('en-IN')} <span className="text-sm font-normal text-slate-500">/ {item.unit}</span></span>
                <Link to="/create-booking" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Book</Link>
              </div>
              <p className="mt-3 text-xs text-slate-400">{item.location} · {item.status}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [draft, setDraft] = useState({ total_quantity: '', damaged_quantity: '', lost_quantity: '', location: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadInventory() {
    const response = await api.get<InventoryRecord[]>('/inventory')
    setInventory(response.data)
  }

  useEffect(() => {
    loadInventory()
      .catch((requestError) => {
        const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined
        setError(status === 401 ? 'Sign in as an admin to manage inventory.' : 'Inventory could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [])

  function startEditing(item: InventoryRecord) {
    setEditingProductId(item.product_id)
    setDraft({
      total_quantity: String(item.total_quantity),
      damaged_quantity: String(item.damaged_quantity),
      lost_quantity: String(item.lost_quantity),
      location: item.location,
    })
    setError('')
    setNotice('')
  }

  async function saveAdjustment(event: React.FormEvent<HTMLFormElement>, productId: number) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await api.patch(`/inventory/${productId}`, {
        total_quantity: Number(draft.total_quantity),
        damaged_quantity: Number(draft.damaged_quantity),
        lost_quantity: Number(draft.lost_quantity),
        location: draft.location,
      })
      setInventory((current) => current.map((item) => item.product_id === productId ? { ...item, ...response.data } : item))
      setEditingProductId(null)
      setNotice(`${response.data.message} for ${inventory.find((item) => item.product_id === productId)?.product_name}.`)
    } catch (requestError) {
      const detail = axios.isAxiosError(requestError) ? requestError.response?.data?.detail : null
      setError(typeof detail === 'string' ? detail : 'Inventory adjustment could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const totalStock = inventory.reduce((sum, item) => sum + item.total_quantity, 0)
  const availableStock = inventory.reduce((sum, item) => sum + item.available_quantity, 0)
  const impairedStock = inventory.reduce((sum, item) => sum + item.damaged_quantity + item.lost_quantity, 0)

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Stock control</p>
        <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total units" value={loading ? '—' : String(totalStock)} change="Physical stock" tone="bg-sky-100 text-sky-700" />
        <StatCard label="Available" value={loading ? '—' : String(availableStock)} change="Ready to rent" tone="bg-emerald-100 text-emerald-700" />
        <StatCard label="Damaged / lost" value={loading ? '—' : String(impairedStock)} change="Removed from availability" tone="bg-rose-100 text-rose-700" />
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error} {error.includes('Sign in') && <Link to="/login" className="font-medium underline">Login</Link>}</p>}
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">Total</th><th className="px-4 py-3 font-medium">Available</th><th className="px-4 py-3 font-medium">Booked</th><th className="px-4 py-3 font-medium">Damaged</th><th className="px-4 py-3 font-medium">Lost</th><th className="px-4 py-3 font-medium">Location</th><th className="px-4 py-3 font-medium">Action</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Loading inventory…</td></tr>}
              {!loading && !error && inventory.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No inventory records.</td></tr>}
              {!loading && inventory.map((item) => (
                <tr key={item.product_id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.product_name}</td>
                  {editingProductId === item.product_id ? (
                    <td colSpan={6} className="px-4 py-3">
                      <form onSubmit={(event) => void saveAdjustment(event, item.product_id)} className="grid gap-2 md:grid-cols-4">
                        <label className="text-xs text-slate-500">Total<input required type="number" min="0" value={draft.total_quantity} onChange={(event) => setDraft((current) => ({ ...current, total_quantity: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800" /></label>
                        <label className="text-xs text-slate-500">Damaged total<input required type="number" min="0" value={draft.damaged_quantity} onChange={(event) => setDraft((current) => ({ ...current, damaged_quantity: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800" /></label>
                        <label className="text-xs text-slate-500">Lost total<input required type="number" min="0" value={draft.lost_quantity} onChange={(event) => setDraft((current) => ({ ...current, lost_quantity: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800" /></label>
                        <label className="text-xs text-slate-500">Location<input value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800" /></label>
                        <div className="flex gap-3 md:col-span-4"><button type="submit" disabled={saving} className="font-medium text-amber-700 hover:underline">{saving ? 'Saving…' : 'Save adjustment'}</button><button type="button" onClick={() => setEditingProductId(null)} className="text-slate-500 hover:underline">Cancel</button></div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3">{item.total_quantity}</td><td className="px-4 py-3 font-medium text-emerald-700">{item.available_quantity}</td><td className="px-4 py-3">{item.booked_quantity}</td><td className="px-4 py-3">{item.damaged_quantity}</td><td className="px-4 py-3">{item.lost_quantity}</td><td className="px-4 py-3">{item.location}</td>
                      <td className="px-4 py-3"><button type="button" onClick={() => startEditing(item)} className="font-medium text-slate-700 hover:underline">Adjust</button></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function BookingFormPage() {
  const [products, setProducts] = useState<RentalProduct[]>([])
  const [vehicles, setVehicles] = useState<VehicleCatalogRecord[]>([])
  const [menus, setMenus] = useState<CateringMenuRecord[]>([])
  const [eventType, setEventType] = useState('Wedding')
  const [eventDate, setEventDate] = useState('2026-11-15')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('22:00')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Aurangabad')
  const [district, setDistrict] = useState('Aurangabad')
  const [state, setState] = useState('Maharashtra')
  const [pincode, setPincode] = useState('')
  const [lines, setLines] = useState<BookingLine[]>([])
  const [vehicleLines, setVehicleLines] = useState<BookingVehicleLine[]>([])
  const [cateringLines, setCateringLines] = useState<BookingCateringLine[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [selectedMenuId, setSelectedMenuId] = useState('')
  const [availability, setAvailability] = useState<Record<number, number>>({})
  const [notice, setNotice] = useState('')
  const [bookingId, setBookingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const hasToken = Boolean(localStorage.getItem('eventhub_token'))
  const productSubtotal = lines.reduce((sum, line) => {
    const product = products.find((item) => item.id === line.product_id)
    return sum + (product?.rental_price ?? 0) * line.quantity
  }, 0)
  const vehicleSubtotal = vehicleLines.reduce((sum, line) => {
    const vehicle = vehicles.find((item) => item.id === line.vehicle_id)
    return sum + (vehicle?.price_per_day ?? 0) * line.days + (vehicle?.price_per_km ?? 0) * line.kilometers
  }, 0)
  const cateringSubtotal = cateringLines.reduce((sum, line) => {
    const menu = menus.find((item) => item.id === line.menu_id)
    return sum + (menu?.price_per_plate ?? 0) * line.plates
  }, 0)
  const subtotal = productSubtotal + vehicleSubtotal + cateringSubtotal

  useEffect(() => {
    Promise.all([api.get<RentalProduct[]>('/products'), api.get<CateringMenuRecord[]>('/catering-menus')])
      .then(([productResponse, menuResponse]) => {
        setProducts(productResponse.data)
        setMenus(menuResponse.data)
      })
      .catch(() => setNotice('Could not load rental products. Check that the EventHub API is running.'))
  }, [])

  useEffect(() => {
    if (!hasToken) return
    let active = true
    api.get('/auth/me')
      .then((identityResponse) => {
        if (identityResponse.data.role !== 'customer') return null
        return api.get<CustomerProfileRecord>(`/customers/${identityResponse.data.id}`)
      })
      .then((profileResponse) => {
        if (!active || !profileResponse) return
        setAddress(profileResponse.data.address || '')
        setCity(profileResponse.data.city || '')
        setDistrict(profileResponse.data.district || '')
        setState(profileResponse.data.state || '')
        setPincode(profileResponse.data.pincode || '')
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [hasToken])

  useEffect(() => {
    api.get<VehicleCatalogRecord[]>('/vehicle-catalog', { params: { date: eventDate } })
      .then((response) => {
        setVehicles(response.data)
        setVehicleLines((current) => current.filter((line) => response.data.some((vehicle) => vehicle.id === line.vehicle_id)))
      })
      .catch(() => setVehicles([]))
  }, [eventDate])

  useEffect(() => {
    let active = true
    if (!eventDate || lines.length === 0) {
      setAvailability({})
      return () => { active = false }
    }

    Promise.all(lines.map(async ({ product_id }) => {
      const response = await api.get('/availability', { params: { product_id, date: eventDate } })
      return [product_id, response.data.available_quantity] as const
    }))
      .then((results) => {
        if (active) setAvailability(Object.fromEntries(results))
      })
      .catch(() => {
        if (active) setAvailability({})
      })

    return () => { active = false }
  }, [eventDate, lines])

  function addProduct() {
    const productId = Number(selectedProductId)
    if (!productId) return
    setLines((current) => {
      const existing = current.find((line) => line.product_id === productId)
      return existing
        ? current.map((line) => line.product_id === productId ? { ...line, quantity: line.quantity + 1 } : line)
        : [...current, { product_id: productId, quantity: 1 }]
    })
    setSelectedProductId('')
    setNotice('')
  }

  function addVehicle() {
    const vehicleId = Number(selectedVehicleId)
    if (!vehicleId || vehicleLines.some((line) => line.vehicle_id === vehicleId)) return
    setVehicleLines((current) => [...current, { vehicle_id: vehicleId, days: 1, kilometers: 0 }])
    setSelectedVehicleId('')
  }

  function addCateringMenu() {
    const menuId = Number(selectedMenuId)
    if (!menuId) return
    setCateringLines((current) => {
      const existing = current.find((line) => line.menu_id === menuId)
      return existing
        ? current.map((line) => line.menu_id === menuId ? { ...line, plates: line.plates + 1 } : line)
        : [...current, { menu_id: menuId, plates: 1 }]
    })
    setSelectedMenuId('')
  }

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setBookingId(null)
    if (!hasToken) {
      setNotice('Sign in before submitting a booking.')
      return
    }
    if (lines.length === 0 && vehicleLines.length === 0 && cateringLines.length === 0) {
      setNotice('Add at least one product or service.')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post('/bookings', {
        event_type: eventType,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        address,
        city,
        district,
        state,
        pincode,
        items: lines,
        vehicles: vehicleLines,
        catering: cateringLines,
      })
      setBookingId(response.data.booking_id)
      setNotice('Booking request submitted successfully.')
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : null
      setNotice(typeof detail === 'string' ? detail : 'Booking could not be submitted. Please check the details and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Booking Flow</p>
        <h1 className="text-2xl font-semibold text-slate-900">Create Booking</h1>
      </div>

      <form onSubmit={submitBooking} className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Event Type</label>
              <select value={eventType} onChange={(event) => setEventType(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5">
                <option>Wedding</option>
                <option>Birthday</option>
                <option>Corporate Event</option>
                <option>Religious Event</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Event Date</label>
              <input type="date" required value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Start Time</label>
                <input type="time" required value={startTime} onChange={(event) => setStartTime(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">End Time</label>
                <input type="time" required value={endTime} onChange={(event) => setEndTime(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Address<input required value={address} onChange={(event) => setAddress(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-medium text-slate-700">City<input required value={city} onChange={(event) => setCity(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-medium text-slate-700">District<input required value={district} onChange={(event) => setDistrict(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-medium text-slate-700">State<input required value={state} onChange={(event) => setState(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-medium text-slate-700">Pincode<input required inputMode="numeric" value={pincode} onChange={(event) => setPincode(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          </div>

          <div className="flex gap-2">
            <select aria-label="Rental product" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5">
              <option value="">Select a rental product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} · ₹{product.rental_price}/{product.unit}</option>)}
            </select>
            <button type="button" onClick={addProduct} disabled={!selectedProductId} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">Add item</button>
          </div>

          <section className="space-y-3 border-t border-slate-200 pt-4">
            <h2 className="text-sm font-semibold text-slate-800">Transport</h2>
            <div className="flex gap-2">
              <select aria-label="Rental vehicle" value={selectedVehicleId} onChange={(event) => setSelectedVehicleId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5">
                <option value="">Available vehicles for event date</option>
                {vehicles.filter((vehicle) => !vehicleLines.some((line) => line.vehicle_id === vehicle.id)).map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · ₹{vehicle.price_per_day}/day + ₹{vehicle.price_per_km}/km</option>)}
              </select>
              <button type="button" onClick={addVehicle} disabled={!selectedVehicleId} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">Add vehicle</button>
            </div>
            {vehicleLines.map((line) => {
              const vehicle = vehicles.find((item) => item.id === line.vehicle_id)
              return <div key={line.vehicle_id} className="flex flex-wrap items-center gap-2 text-sm"><span className="min-w-28 flex-1 font-medium text-slate-700">{vehicle?.name ?? 'Vehicle'}</span><label className="text-xs text-slate-500">Days<input aria-label={`${vehicle?.name} days`} type="number" min="1" value={line.days} onChange={(event) => setVehicleLines((current) => current.map((item) => item.vehicle_id === line.vehicle_id ? { ...item, days: Math.max(1, Number(event.target.value)) } : item))} className="ml-1 w-16 rounded border border-slate-200 px-1 py-1" /></label><label className="text-xs text-slate-500">Km<input aria-label={`${vehicle?.name} kilometers`} type="number" min="0" value={line.kilometers} onChange={(event) => setVehicleLines((current) => current.map((item) => item.vehicle_id === line.vehicle_id ? { ...item, kilometers: Math.max(0, Number(event.target.value)) } : item))} className="ml-1 w-20 rounded border border-slate-200 px-1 py-1" /></label><button type="button" onClick={() => setVehicleLines((current) => current.filter((item) => item.vehicle_id !== line.vehicle_id))} className="text-slate-400 hover:text-rose-600">Remove</button></div>
            })}
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-4">
            <h2 className="text-sm font-semibold text-slate-800">Catering</h2>
            <div className="flex gap-2">
              <select aria-label="Catering menu" value={selectedMenuId} onChange={(event) => setSelectedMenuId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5">
                <option value="">Select a catering menu</option>
                {menus.map((menu) => <option key={menu.id} value={menu.id}>{menu.name} · ₹{menu.price_per_plate}/plate · {menu.is_veg ? 'Veg' : 'Non-veg'}</option>)}
              </select>
              <button type="button" onClick={addCateringMenu} disabled={!selectedMenuId} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">Add menu</button>
            </div>
            {cateringLines.map((line) => {
              const menu = menus.find((item) => item.id === line.menu_id)
              const capacity = menu?.plates ?? 0
              return <div key={line.menu_id} className="flex items-center gap-2 text-sm"><span className="min-w-0 flex-1 font-medium text-slate-700">{menu?.name ?? 'Catering menu'} <span className="text-xs font-normal text-slate-500">(up to {capacity} plates)</span></span><input aria-label={`${menu?.name} plate count`} type="number" min="1" max={capacity || undefined} value={line.plates} onChange={(event) => setCateringLines((current) => current.map((item) => item.menu_id === line.menu_id ? { ...item, plates: Math.max(1, Number(event.target.value)) } : item))} className="w-20 rounded-lg border border-slate-200 px-2 py-1.5" /><button type="button" onClick={() => setCateringLines((current) => current.filter((item) => item.menu_id !== line.menu_id))} className="text-slate-400 hover:text-rose-600">Remove</button></div>
            })}
          </section>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Booking Summary</h2>
          <div className="space-y-3 text-sm text-slate-600">
            {lines.length === 0 && <p className="text-slate-500">No rental items selected.</p>}
            {lines.map((line) => {
              const product = products.find((item) => item.id === line.product_id)
              return (
                <div key={line.product_id} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1">{product?.name ?? 'Rental item'} <span className="text-xs text-slate-400">{availability[line.product_id] === undefined ? 'Checking availability' : `${availability[line.product_id]} available on date`}</span></span>
                  <input aria-label={`${product?.name ?? 'Item'} quantity`} type="number" min="1" value={line.quantity} onChange={(event) => setLines((current) => current.map((item) => item.product_id === line.product_id ? { ...item, quantity: Math.max(1, Number(event.target.value)) } : item))} className="w-20 rounded-lg border border-slate-200 px-2 py-1.5" />
                  <span className="w-24 text-right">₹{((product?.rental_price ?? 0) * line.quantity).toLocaleString('en-IN')}</span>
                  <button type="button" aria-label={`Remove ${product?.name ?? 'item'}`} onClick={() => setLines((current) => current.filter((item) => item.product_id !== line.product_id))} className="text-slate-400 hover:text-rose-600">Remove</button>
                </div>
              )
            })}
            {vehicleLines.map((line) => {
              const vehicle = vehicles.find((item) => item.id === line.vehicle_id)
              const total = (vehicle?.price_per_day ?? 0) * line.days + (vehicle?.price_per_km ?? 0) * line.kilometers
              return <div key={`vehicle-${line.vehicle_id}`} className="flex justify-between gap-3"><span>{vehicle?.name} · {line.days} day(s), {line.kilometers} km</span><span>₹{total.toLocaleString('en-IN')}</span></div>
            })}
            {cateringLines.map((line) => {
              const menu = menus.find((item) => item.id === line.menu_id)
              return <div key={`catering-${line.menu_id}`} className="flex justify-between gap-3"><span>{menu?.name} · {line.plates} plates</span><span>₹{((menu?.price_per_plate ?? 0) * line.plates).toLocaleString('en-IN')}</span></div>
            })}
            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between font-medium text-slate-800"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex items-center justify-between"><span>Delivery</span><span>₹500</span></div>
              <div className="flex items-center justify-between"><span>Setup</span><span>₹1,000</span></div>
              <div className="flex items-center justify-between"><span>Security deposit</span><span>₹1,000</span></div>
              <div className="mt-2 flex items-center justify-between text-lg font-semibold text-slate-900"><span>Total</span><span>₹{(subtotal + 2500).toLocaleString('en-IN')}</span></div>
            </div>
          </div>
          {notice && <p role="status" className={`mt-4 text-sm ${bookingId ? 'text-emerald-700' : 'text-rose-700'}`}>{notice}{bookingId ? ` Booking #${bookingId}.` : ''}</p>}
          {!hasToken && <p className="mt-4 text-sm text-slate-600">You need to <Link to="/login" className="font-medium text-amber-700 underline">sign in</Link> to submit this booking.</p>}
          <button type="submit" disabled={submitting || !hasToken || (lines.length === 0 && vehicleLines.length === 0 && cateringLines.length === 0)} className="mt-6 w-full rounded-xl bg-amber-500 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit Booking'}</button>
        </div>
      </form>
    </div>
  )
}

type BookingRecord = {
  id: number
  customer_name: string
  event_type: string
  event_date: string
  start_time: string
  end_time: string
  status: string
  grand_total: number
  city: string
  assigned_staff_id: number | null
  assigned_staff_name: string | null
  can_cancel: boolean
  items: { product_id: number; quantity: number; total_price: number }[]
}

function BookingListPage({ title }: { title: string }) {
  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [staffRoster, setStaffRoster] = useState<StaffRecord[]>([])
  const [userRole, setUserRole] = useState('')
  const isAdmin = userRole === 'admin'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    Promise.all([api.get<BookingRecord[]>('/bookings'), api.get('/auth/me')])
      .then(async ([bookingResponse, profileResponse]) => {
        setBookings(bookingResponse.data)
        setUserRole(profileResponse.data.role)
        if (profileResponse.data.role === 'admin') {
          const staffResponse = await api.get<StaffRecord[]>('/staff')
          setStaffRoster(staffResponse.data.filter((member) => member.is_active))
        }
      })
      .catch((requestError) => {
        const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined
        setError(status === 401 ? 'Sign in to view bookings.' : 'Bookings could not be loaded. Check the API connection and your access.')
      })
      .finally(() => setLoading(false))
  }, [])

  async function cancelBooking(bookingId: number) {
    setError('')
    setNotice('')
    try {
      await api.post(`/bookings/${bookingId}/cancel`)
      setBookings((current) => current.map((booking) => booking.id === bookingId ? { ...booking, status: 'Cancelled' } : booking))
      setNotice(`Booking #${bookingId} cancelled.`)
    } catch (requestError) {
      const detail = axios.isAxiosError(requestError) ? requestError.response?.data?.detail : null
      setError(typeof detail === 'string' ? detail : 'This booking could not be cancelled.')
    }
  }

  async function assignStaff(bookingId: number, staffId: string) {
    setError('')
    setNotice('')
    try {
      const response = await api.put(`/bookings/${bookingId}/staff`, { staff_id: staffId ? Number(staffId) : null })
      setBookings((current) => current.map((booking) => booking.id === bookingId ? {
        ...booking,
        assigned_staff_id: response.data.assigned_staff_id,
        assigned_staff_name: response.data.assigned_staff_name,
      } : booking))
      setNotice(staffId ? `Booking #${bookingId} assigned to ${response.data.assigned_staff_name}.` : `Booking #${bookingId} unassigned.`)
    } catch (requestError) {
      const detail = axios.isAxiosError(requestError) ? requestError.response?.data?.detail : null
      setError(typeof detail === 'string' ? detail : 'Staff assignment could not be updated.')
    }
  }

  async function updateBookingStatus(bookingId: number, status: 'Confirmed' | 'Rejected' | 'Completed') {
    setError('')
    setNotice('')
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status })
      setBookings((current) => current.map((booking) => booking.id === bookingId ? { ...booking, status } : booking))
      setNotice(`Booking #${bookingId} ${status.toLowerCase()}.`)
    } catch (requestError) {
      const detail = axios.isAxiosError(requestError) ? requestError.response?.data?.detail : null
      setError(typeof detail === 'string' ? detail : 'Booking status could not be updated.')
    }
  }

  const pendingCount = bookings.filter((booking) => booking.status.toLowerCase() === 'pending').length
  const totalValue = bookings.reduce((sum, booking) => sum + booking.grand_total, 0)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Event operations</p>
          <h1 className="text-2xl font-semibold text-slate-900">{title === 'My Bookings' && userRole === 'staff' ? 'Assigned Bookings' : title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {userRole === 'customer' && <Link to="/profile" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">My profile</Link>}
          <Link to="/notifications" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Notifications</Link>
          <Link to="/quotations" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Quotations</Link>
          <Link to="/payments" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Payments</Link>
          <Link to="/invoices" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Invoices</Link>
          <Link to="/create-booking" className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white">Create booking</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Bookings" value={loading ? '—' : String(bookings.length)} change="Your events" tone="bg-sky-100 text-sky-700" />
        <StatCard label="Pending requests" value={loading ? '—' : String(pendingCount)} change="Awaiting review" tone="bg-amber-100 text-amber-700" />
        <StatCard label="Booking value" value={loading ? '—' : `₹${totalValue.toLocaleString('en-IN')}`} change="Current list" tone="bg-emerald-100 text-emerald-700" />
      </div>

      {error && <p role="alert" className="text-sm text-rose-700">{error} {error.includes('Sign in') && <Link to="/login" className="font-medium underline">Login</Link>}</p>}
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Booking</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Schedule</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {isAdmin && <th className="px-4 py-3 font-medium">Assigned staff</th>}
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={isAdmin ? 9 : 8} className="px-4 py-10 text-center text-slate-500">Loading bookings…</td></tr>}
              {!loading && !error && bookings.length === 0 && <tr><td colSpan={isAdmin ? 9 : 8} className="px-4 py-10 text-center text-slate-500">No bookings yet.</td></tr>}
              {!loading && bookings.map((booking) => {
                const terminal = ['cancelled', 'rejected', 'completed'].includes(booking.status.toLowerCase())
                return (
                  <tr key={booking.id} className="border-t border-slate-100 align-top">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">#{booking.id}</td>
                    <td className="px-4 py-3"><span className="block font-medium text-slate-800">{booking.event_type}</span><span className="text-xs text-slate-500">{booking.city}</span></td>
                    <td className="px-4 py-3 text-slate-700">{booking.customer_name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{booking.event_date}<span className="block text-xs text-slate-400">{booking.start_time}–{booking.end_time}</span></td>
                    <td className="px-4 py-3 text-slate-600">{booking.items.reduce((sum, item) => sum + item.quantity, 0)} units</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">₹{booking.grand_total.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${booking.status.toLowerCase() === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : terminal ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>{booking.status}</span></td>
                    {isAdmin && <td className="px-4 py-3"><select aria-label={`Assign staff to booking ${booking.id}`} value={booking.assigned_staff_id ?? ''} onChange={(event) => void assignStaff(booking.id, event.target.value)} className="max-w-44 rounded-lg border border-slate-200 px-2 py-1.5"><option value="">Unassigned</option>{staffRoster.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select></td>}
                    <td className="whitespace-nowrap px-4 py-3"><div className="flex flex-wrap gap-2">{isAdmin && booking.status === 'Pending' && <><button type="button" onClick={() => void updateBookingStatus(booking.id, 'Confirmed')} className="font-medium text-emerald-700 hover:underline">Confirm</button><button type="button" onClick={() => void updateBookingStatus(booking.id, 'Rejected')} className="font-medium text-rose-700 hover:underline">Reject</button></>}{isAdmin && booking.status === 'Confirmed' && <button type="button" onClick={() => void updateBookingStatus(booking.id, 'Completed')} className="font-medium text-sky-700 hover:underline">Complete</button>}{booking.can_cancel && !terminal && <button type="button" onClick={() => void cancelBooking(booking.id)} className="font-medium text-rose-700 hover:underline">Cancel</button>}</div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

type CustomerRecord = {
  id: number
  full_name: string
  email: string
  phone: string | null
  total_bookings: number
  total_spending: number
  pending_amount: number
}

type CustomerProfileRecord = {
  id: number
  full_name: string
  email: string
  phone: string | null
  address: string
  city: string
  district: string
  state: string
  pincode: string
  total_bookings: number
  total_spending: number
  pending_amount: number
}

type StaffRecord = {
  id: number
  user_id: number
  full_name: string
  email: string
  phone: string | null
  role: string
  designation: string
  department: string
  is_active: boolean
}

type PaymentRecord = {
  id: number
  booking_id: number
  amount: number
  status: string
  payment_method: string
  created_at: string
}

type InvoiceRecord = {
  id: number
  booking_id: number
  customer_name: string
  event_date: string
  invoice_number: string
  subtotal: number
  final_amount: number
  paid_amount: number
  remaining_amount: number
}

type InvoiceDetailRecord = InvoiceRecord & {
  customer_email: string
  customer_phone: string | null
  event_type: string
  event_address: string
  city: string
  district: string
  state: string
  pincode: string
  created_at: string
  discount: number
  tax: number
  delivery_charge: number
  setup_charge: number
  security_deposit: number
  items: { product_name: string; quantity: number; unit_price: number; total_price: number }[]
}

type QuotationRecord = {
  id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  event_date: string
  location: string
  total_amount: number
  status: string
  items: { product_id: number; product_name: string; quantity: number; unit_price: number; total_price: number }[]
}

function CustomerProfilePage() {
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState({ full_name: '', phone: '', address: '', city: '', district: '', state: '', pincode: '' })

  useEffect(() => {
    api.get('/auth/me')
      .then(async (identityResponse) => {
        if (identityResponse.data.role !== 'customer') throw new Error('Customer profiles are only available for customer accounts.')
        setCustomerId(identityResponse.data.id)
        const response = await api.get<CustomerProfileRecord>(`/customers/${identityResponse.data.id}`)
        setDraft({
          full_name: response.data.full_name,
          phone: response.data.phone ?? '',
          address: response.data.address,
          city: response.data.city,
          district: response.data.district,
          state: response.data.state,
          pincode: response.data.pincode,
        })
      })
      .catch((requestError) => {
        const detail = axios.isAxiosError(requestError) ? requestError.response?.data?.detail : null
        setError(typeof detail === 'string' ? detail : requestError instanceof Error ? requestError.message : 'Customer profile could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [])

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (customerId === null) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await api.patch(`/customers/${customerId}`, { ...draft, phone: draft.phone || null })
      setNotice('Profile saved. Your next booking will use these details.')
    } catch (requestError) {
      const detail = axios.isAxiosError(requestError) ? requestError.response?.data?.detail : null
      setError(typeof detail === 'string' ? detail : 'Profile could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Account</p><h1 className="text-2xl font-semibold text-slate-900">My profile</h1></div>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      {loading ? <p className="text-sm text-slate-500">Loading profile…</p> : <form onSubmit={saveProfile} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Full name<input required maxLength={150} value={draft.full_name} onChange={(event) => setDraft((current) => ({ ...current, full_name: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Phone<input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">Event address<input maxLength={500} value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">City<input maxLength={100} value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">District<input maxLength={100} value={draft.district} onChange={(event) => setDraft((current) => ({ ...current, district: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">State<input maxLength={100} value={draft.state} onChange={(event) => setDraft((current) => ({ ...current, state: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Pincode<input inputMode="numeric" maxLength={20} value={draft.pincode} onChange={(event) => setDraft((current) => ({ ...current, pincode: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <div className="md:col-span-2"><button type="submit" disabled={saving} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save profile'}</button></div>
      </form>}
    </div>
  )
}

function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<CustomerRecord[]>('/customers')
      .then((response) => setCustomers(response.data))
      .catch((requestError) => {
        const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined
        setError(status === 401 ? 'Sign in as an admin to view customers.' : 'Customer records could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [])

  const bookingCount = customers.reduce((sum, customer) => sum + customer.total_bookings, 0)
  const spending = customers.reduce((sum, customer) => sum + customer.total_spending, 0)
  const pending = customers.reduce((sum, customer) => sum + customer.pending_amount, 0)

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Relationships</p>
        <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Customers" value={loading ? '—' : String(customers.length)} change="Registered" tone="bg-sky-100 text-sky-700" />
        <StatCard label="Bookings" value={loading ? '—' : String(bookingCount)} change="Across customers" tone="bg-emerald-100 text-emerald-700" />
        <StatCard label="Pending balance" value={loading ? '—' : `₹${pending.toLocaleString('en-IN')}`} change={`₹${spending.toLocaleString('en-IN')} lifetime`} tone="bg-amber-100 text-amber-700" />
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error} {error.includes('Sign in') && <Link to="/login" className="font-medium underline">Login</Link>}</p>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium">Contact</th><th className="px-4 py-3 font-medium">Bookings</th><th className="px-4 py-3 font-medium">Total spend</th><th className="px-4 py-3 font-medium">Balance due</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Loading customers…</td></tr>}
              {!loading && !error && customers.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No customers registered.</td></tr>}
              {!loading && customers.map((customer) => (
                <tr key={customer.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{customer.full_name}</td>
                  <td className="px-4 py-3 text-slate-600"><a href={`mailto:${customer.email}`} className="block hover:text-amber-700">{customer.email}</a>{customer.phone && <a href={`tel:${customer.phone}`} className="text-xs text-slate-400">{customer.phone}</a>}</td>
                  <td className="px-4 py-3 text-slate-700">{customer.total_bookings}</td>
                  <td className="px-4 py-3 text-slate-700">₹{customer.total_spending.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">₹{customer.pending_amount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function VehiclesPage() {
    const [vehicles, setVehicles] = useState<VehicleRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [formOpen, setFormOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [draft, setDraft] = useState({ name: '', vehicle_number: '', vehicle_type: 'Transport', driver_name: '', driver_phone: '', price_per_day: '0', price_per_km: '0' })

    async function loadVehicles() {
      const response = await api.get<VehicleRecord[]>('/vehicles')
      setVehicles(response.data)
    }

    useEffect(() => {
      loadVehicles()
        .catch((requestError) => {
          const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined
          setError(status === 401 ? 'Sign in as an admin to manage vehicles.' : 'Fleet records could not be loaded.')
        })
        .finally(() => setLoading(false))
    }, [])

    async function createVehicle(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setSubmitting(true)
      setError('')
      setNotice('')
      try {
        const response = await api.post<VehicleRecord>('/vehicles', {
          ...draft,
          vehicle_number: draft.vehicle_number.toUpperCase(),
          price_per_day: Number(draft.price_per_day),
          price_per_km: Number(draft.price_per_km),
        })
        setVehicles((current) => [response.data, ...current])
        setDraft({ name: '', vehicle_number: '', vehicle_type: 'Transport', driver_name: '', driver_phone: '', price_per_day: '0', price_per_km: '0' })
        setFormOpen(false)
        setNotice('Vehicle added to the fleet.')
      } catch (requestError) {
        const detail = axios.isAxiosError(requestError) ? requestError.response?.data?.detail : null
        setError(typeof detail === 'string' ? detail : 'Vehicle could not be created.')
      } finally {
        setSubmitting(false)
      }
    }

    async function updateAvailability(vehicle: VehicleRecord, availability: VehicleRecord['availability']) {
      setError('')
      setNotice('')
      try {
        await api.patch(`/vehicles/${vehicle.id}`, { availability })
        setVehicles((current) => current.map((item) => item.id === vehicle.id ? { ...item, availability } : item))
        setNotice(`${vehicle.name} marked ${availability.toLowerCase()}.`)
      } catch {
        setError('Vehicle availability could not be updated.')
      }
    }

    const availableCount = vehicles.filter((vehicle) => vehicle.availability === 'Available').length

    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Transport operations</p><h1 className="text-2xl font-semibold text-slate-900">Vehicles</h1></div>
          <button type="button" onClick={() => setFormOpen((open) => !open)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">{formOpen ? 'Close form' : 'Add vehicle'}</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2"><StatCard label="Fleet size" value={loading ? '—' : String(vehicles.length)} change="Registered vehicles" tone="bg-sky-100 text-sky-700" /><StatCard label="Available" value={loading ? '—' : String(availableCount)} change="Ready for booking" tone="bg-emerald-100 text-emerald-700" /></div>
        {error && <p role="alert" className="text-sm text-rose-700">{error} {error.includes('Sign in') && <Link to="/login" className="font-medium underline">Login</Link>}</p>}
        {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
        {formOpen && <form onSubmit={createVehicle} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">Vehicle name<input required maxLength={120} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-medium text-slate-700">Registration number<input required maxLength={50} value={draft.vehicle_number} onChange={(event) => setDraft((current) => ({ ...current, vehicle_number: event.target.value.toUpperCase() }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal uppercase" /></label>
          <label className="text-sm font-medium text-slate-700">Vehicle type<input required maxLength={80} value={draft.vehicle_type} onChange={(event) => setDraft((current) => ({ ...current, vehicle_type: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-medium text-slate-700">Driver name<input value={draft.driver_name} onChange={(event) => setDraft((current) => ({ ...current, driver_name: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-medium text-slate-700">Driver phone<input value={draft.driver_phone} onChange={(event) => setDraft((current) => ({ ...current, driver_phone: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-medium text-slate-700">Price per day<input type="number" min="0" step="0.01" value={draft.price_per_day} onChange={(event) => setDraft((current) => ({ ...current, price_per_day: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-medium text-slate-700">Price per km<input type="number" min="0" step="0.01" value={draft.price_per_km} onChange={(event) => setDraft((current) => ({ ...current, price_per_km: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <div className="md:col-span-2 xl:col-span-3"><button type="submit" disabled={submitting} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Saving…' : 'Save vehicle'}</button></div>
        </form>}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto"><table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-medium">Vehicle</th><th className="px-4 py-3 font-medium">Driver</th><th className="px-4 py-3 font-medium">Rates</th><th className="px-4 py-3 font-medium">Availability</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">Loading fleet…</td></tr>}
              {!loading && !error && vehicles.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">No vehicles registered.</td></tr>}
              {!loading && vehicles.map((vehicle) => <tr key={vehicle.id} className="border-t border-slate-100"><td className="px-4 py-3"><span className="block font-medium text-slate-800">{vehicle.name}</span><span className="text-xs text-slate-500">{vehicle.vehicle_number} · {vehicle.vehicle_type}</span></td><td className="px-4 py-3"><span className="block text-slate-700">{vehicle.driver_name || 'Unassigned'}</span>{vehicle.driver_phone && <span className="text-xs text-slate-500">{vehicle.driver_phone}</span>}</td><td className="px-4 py-3 text-slate-700">₹{vehicle.price_per_day.toLocaleString('en-IN')}/day · ₹{vehicle.price_per_km.toLocaleString('en-IN')}/km</td><td className="px-4 py-3"><select aria-label={`${vehicle.name} availability`} value={vehicle.availability} onChange={(event) => void updateAvailability(vehicle, event.target.value as VehicleRecord['availability'])} className="rounded-lg border border-slate-200 px-2 py-1.5"><option>Available</option><option>Booked</option><option>Maintenance</option><option>Unavailable</option></select></td></tr>)}
            </tbody>
          </table></div>
        </div>
      </div>
    )
}

function CateringPage({ adminMode = false }: { adminMode?: boolean }) {
  const [menus, setMenus] = useState<CateringMenuRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState({ name: '', description: '', price_per_plate: '0', plates: '0', is_veg: 'true', serving_time: 'Dinner' })

  async function loadMenus() {
    const response = await api.get<CateringMenuRecord[]>('/catering-menus')
    setMenus(response.data)
  }

  useEffect(() => {
    loadMenus()
      .catch(() => setError('Catering menus could not be loaded.'))
      .finally(() => setLoading(false))
  }, [])

  function editMenu(menu: CateringMenuRecord) {
    setEditingId(menu.id)
    setDraft({ name: menu.name, description: menu.description, price_per_plate: String(menu.price_per_plate), plates: String(menu.plates), is_veg: String(menu.is_veg), serving_time: menu.serving_time })
    setFormOpen(true)
    setError('')
    setNotice('')
  }

  async function saveMenu(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')
    const payload = { ...draft, price_per_plate: Number(draft.price_per_plate), plates: Number(draft.plates), is_veg: draft.is_veg === 'true' }
    try {
      if (editingId === null) {
        const response = await api.post<CateringMenuRecord>('/catering-menus', payload)
        setMenus((current) => [...current, response.data].sort((left, right) => left.name.localeCompare(right.name)))
        setNotice('Catering menu added.')
      } else {
        const response = await api.patch<CateringMenuRecord>(`/catering-menus/${editingId}`, payload)
        setMenus((current) => current.map((menu) => menu.id === editingId ? response.data : menu).sort((left, right) => left.name.localeCompare(right.name)))
        setNotice('Catering menu updated.')
      }
      setFormOpen(false)
      setEditingId(null)
      setDraft({ name: '', description: '', price_per_plate: '0', plates: '0', is_veg: 'true', serving_time: 'Dinner' })
    } catch (requestError) {
      const detail = axios.isAxiosError(requestError) ? requestError.response?.data?.detail : null
      setError(typeof detail === 'string' ? detail : 'Catering menu could not be saved.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Food service</p><h1 className="text-2xl font-semibold text-slate-900">Catering menus</h1></div>
        {adminMode && <button type="button" onClick={() => { setFormOpen((open) => !open); setEditingId(null) }} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">{formOpen ? 'Close form' : 'Add menu'}</button>}
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      {formOpen && adminMode && <form onSubmit={saveMenu} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">Menu name<input required maxLength={150} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Price per plate<input required type="number" min="0" step="0.01" value={draft.price_per_plate} onChange={(event) => setDraft((current) => ({ ...current, price_per_plate: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Plate capacity<input required type="number" min="0" step="1" value={draft.plates} onChange={(event) => setDraft((current) => ({ ...current, plates: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Dietary option<select value={draft.is_veg} onChange={(event) => setDraft((current) => ({ ...current, is_veg: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"><option value="true">Vegetarian</option><option value="false">Non-vegetarian</option></select></label>
        <label className="text-sm font-medium text-slate-700">Serving time<input required maxLength={30} value={draft.serving_time} onChange={(event) => setDraft((current) => ({ ...current, serving_time: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-3">Description<textarea rows={2} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <div className="md:col-span-2 xl:col-span-3"><button type="submit" disabled={submitting} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Saving…' : editingId === null ? 'Save menu' : 'Update menu'}</button></div>
      </form>}
      {loading ? <p className="text-sm text-slate-500">Loading menus…</p> : menus.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No catering menus available.</p> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {menus.map((menu) => <article key={menu.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">{menu.name}</h2><p className="mt-1 text-sm text-slate-500">{menu.is_veg ? 'Vegetarian' : 'Non-vegetarian'} · {menu.serving_time}</p></div><span className={`rounded-full px-2 py-1 text-xs font-medium ${menu.is_veg ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{menu.is_veg ? 'VEG' : 'NON-VEG'}</span></div><p className="mt-4 min-h-10 text-sm text-slate-600">{menu.description || 'Curated catering menu for your event.'}</p><div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-xl font-semibold text-slate-900">₹{menu.price_per_plate.toLocaleString('en-IN')}<span className="text-sm font-normal text-slate-500"> / plate</span></p><p className="mt-1 text-xs text-slate-500">Up to {menu.plates} plates</p></div>{adminMode && <button type="button" onClick={() => editMenu(menu)} className="text-sm font-medium text-slate-700 hover:underline">Edit</button>}</div></article>)}
      </div>}
    </div>
  )
}

function StaffPage() {
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState({ full_name: '', email: '', phone: '', password: '', designation: '', department: 'Operations' })

  async function loadStaff() {
    const response = await api.get<StaffRecord[]>('/staff')
    setStaff(response.data)
  }

  useEffect(() => {
    loadStaff()
      .catch((requestError) => {
        const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined
        setError(status === 401 ? 'Sign in as an admin to manage staff.' : 'Staff directory could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [])

  async function createStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const response = await api.post<StaffRecord>('/staff', { ...draft, phone: draft.phone || null })
      setStaff((current) => [response.data, ...current])
      setDraft({ full_name: '', email: '', phone: '', password: '', designation: '', department: 'Operations' })
      setFormOpen(false)
      setNotice('Staff account created.')
    } catch (requestError) {
      const detail = axios.isAxiosError(requestError) ? requestError.response?.data?.detail : null
      setError(typeof detail === 'string' ? detail : 'Staff account could not be created.')
    } finally {
      setSubmitting(false)
    }
  }

  async function setActive(staffMember: StaffRecord, isActive: boolean) {
    setError('')
    setNotice('')
    try {
      await api.patch(`/staff/${staffMember.id}`, { is_active: isActive })
      setStaff((current) => current.map((item) => item.id === staffMember.id ? { ...item, is_active: isActive } : item))
      setNotice(`${staffMember.full_name} ${isActive ? 'activated' : 'deactivated'}.`)
    } catch {
      setError('Staff status could not be updated.')
    }
  }

  const activeCount = staff.filter((member) => member.is_active).length

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Team operations</p>
          <h1 className="text-2xl font-semibold text-slate-900">Staff</h1>
        </div>
        <button type="button" onClick={() => setFormOpen((open) => !open)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">{formOpen ? 'Close form' : 'Add staff'}</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Team members" value={loading ? '—' : String(staff.length)} change="Staff accounts" tone="bg-sky-100 text-sky-700" />
        <StatCard label="Active" value={loading ? '—' : String(activeCount)} change="Can sign in" tone="bg-emerald-100 text-emerald-700" />
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error} {error.includes('Sign in') && <Link to="/login" className="font-medium underline">Login</Link>}</p>}
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      {formOpen && <form onSubmit={createStaff} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">Full name<input required maxLength={150} value={draft.full_name} onChange={(event) => setDraft((current) => ({ ...current, full_name: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Email<input required type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Phone<input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Temporary password<input required type="password" minLength={8} value={draft.password} onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Designation<input required maxLength={80} value={draft.designation} onChange={(event) => setDraft((current) => ({ ...current, designation: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-slate-700">Department<input required maxLength={80} value={draft.department} onChange={(event) => setDraft((current) => ({ ...current, department: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
        <div className="md:col-span-2 xl:col-span-3"><button type="submit" disabled={submitting} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Creating…' : 'Create staff account'}</button></div>
      </form>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-medium">Staff member</th><th className="px-4 py-3 font-medium">Designation</th><th className="px-4 py-3 font-medium">Department</th><th className="px-4 py-3 font-medium">Phone</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Action</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading staff…</td></tr>}
              {!loading && !error && staff.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No staff accounts yet.</td></tr>}
              {!loading && staff.map((member) => <tr key={member.id} className="border-t border-slate-100"><td className="px-4 py-3"><span className="block font-medium text-slate-800">{member.full_name}</span><span className="text-xs text-slate-500">{member.email}</span></td><td className="px-4 py-3">{member.designation}</td><td className="px-4 py-3">{member.department}</td><td className="px-4 py-3">{member.phone || '—'}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${member.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{member.is_active ? 'Active' : 'Inactive'}</span></td><td className="px-4 py-3"><button type="button" onClick={() => void setActive(member, !member.is_active)} className="font-medium text-slate-700 hover:underline">{member.is_active ? 'Deactivate' : 'Activate'}</button></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<NotificationRecord[]>('/notifications')
      .then((response) => setNotifications(response.data))
      .catch((requestError) => {
        const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined
        setError(status === 401 ? 'Sign in to view notifications.' : 'Notifications could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [])

  async function markRead(notificationId: number) {
    setError('')
    try {
      await api.patch(`/notifications/${notificationId}/read`)
      setNotifications((current) => current.map((item) => item.id === notificationId ? { ...item, is_read: true } : item))
    } catch {
      setError('Notification could not be marked as read.')
    }
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Updates</p>
          <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        </div>
        {!loading && <span className="text-sm text-slate-500">{unreadCount} unread</span>}
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error} {error.includes('Sign in') && <Link to="/login" className="font-medium underline">Login</Link>}</p>}
      <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading && <p className="p-8 text-center text-sm text-slate-500">Loading notifications…</p>}
        {!loading && !error && notifications.length === 0 && <p className="p-8 text-center text-sm text-slate-500">You’re all caught up.</p>}
        {notifications.map((notification) => (
          <article key={notification.id} className={`flex flex-wrap items-start justify-between gap-4 p-5 ${notification.is_read ? '' : 'bg-amber-50/50'}`}>
            <div className="flex min-w-0 gap-3">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.is_read ? 'bg-slate-300' : 'bg-amber-500'}`} />
              <div>
                <h2 className="font-semibold text-slate-900">{notification.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                <time className="mt-2 block text-xs text-slate-400" dateTime={notification.created_at}>{new Date(notification.created_at).toLocaleString('en-IN')}</time>
              </div>
            </div>
            {!notification.is_read && <button type="button" onClick={() => void markRead(notification.id)} className="text-sm font-medium text-amber-800 hover:underline">Mark read</button>}
          </article>
        ))}
      </div>
    </div>
  )
}

function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function refreshPayments() {
    const response = await api.get<PaymentRecord[]>('/payments')
    setPayments(response.data)
  }

  useEffect(() => {
    Promise.all([
      api.get<BookingRecord[]>('/bookings'),
      api.get<PaymentRecord[]>('/payments'),
      api.get('/auth/me'),
    ])
      .then(([bookingResponse, paymentResponse, profileResponse]) => {
        setBookings(bookingResponse.data)
        setPayments(paymentResponse.data)
        setIsAdmin(profileResponse.data.role === 'admin')
      })
      .catch((requestError) => {
        const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined
        setError(status === 401 ? 'Sign in to view and record payments.' : 'Payment records could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [])

  const selectedBooking = bookings.find((booking) => booking.id === Number(selectedBookingId))
  const reservedAmount = selectedBooking
    ? payments.filter((payment) => payment.booking_id === selectedBooking.id && ['pending', 'paid'].includes(payment.status.toLowerCase())).reduce((sum, payment) => sum + payment.amount, 0)
    : 0
  const remainingAmount = selectedBooking ? Math.max(0, selectedBooking.grand_total - reservedAmount) : 0

  async function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      await api.post('/payments', { booking_id: Number(selectedBookingId), amount: Number(amount), payment_method: paymentMethod })
      await refreshPayments()
      setAmount('')
      setNotice('Payment submitted for confirmation.')
    } catch (requestError) {
      const detail = axios.isAxiosError(requestError) ? requestError.response?.data?.detail : null
      setError(typeof detail === 'string' ? detail : 'Payment could not be recorded.')
    }
  }

  async function confirmPayment(paymentId: number) {
    setError('')
    setNotice('')
    try {
      await api.patch(`/payments/${paymentId}/status`, { status: 'Paid' })
      await refreshPayments()
      setNotice(`Payment #${paymentId} confirmed.`)
    } catch {
      setError('Payment could not be confirmed.')
    }
  }

  const openBookings = bookings.filter((booking) => !['cancelled', 'rejected'].includes(booking.status.toLowerCase()))

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Finance</p>
        <h1 className="text-2xl font-semibold text-slate-900">Payments</h1>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={submitPayment} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Record a payment</h2>
          <label className="block text-sm font-medium text-slate-700">Booking
            <select required value={selectedBookingId} onChange={(event) => setSelectedBookingId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5">
              <option value="">Select a booking</option>
              {openBookings.map((booking) => <option key={booking.id} value={booking.id}>#{booking.id} · {booking.event_type} · ₹{booking.grand_total.toLocaleString('en-IN')}</option>)}
            </select>
          </label>
          {selectedBooking && <p className="text-sm text-slate-500">Remaining after pending payments: ₹{remainingAmount.toLocaleString('en-IN')}</p>}
          <label className="block text-sm font-medium text-slate-700">Amount
            <input required type="number" min="0.01" step="0.01" max={remainingAmount || undefined} value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Method
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5">
              <option>UPI</option><option>Cash</option><option>Card</option><option>Bank Transfer</option>
            </select>
          </label>
          <button type="submit" disabled={!selectedBooking || remainingAmount <= 0} className="w-full rounded-xl bg-amber-500 px-4 py-3 font-medium text-white disabled:opacity-50">Submit payment</button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-medium">Payment</th><th className="px-4 py-3 font-medium">Booking</th><th className="px-4 py-3 font-medium">Method</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Action</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading payments…</td></tr>}
                {!loading && !error && payments.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No payments recorded.</td></tr>}
                {!loading && payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">#{payment.id}</td><td className="px-4 py-3">#{payment.booking_id}</td><td className="px-4 py-3">{payment.payment_method}</td><td className="px-4 py-3">₹{payment.amount.toLocaleString('en-IN')}</td><td className="px-4 py-3">{payment.status}</td>
                    <td className="px-4 py-3">{isAdmin && payment.status.toLowerCase() === 'pending' && <button type="button" onClick={() => void confirmPayment(payment.id)} className="font-medium text-emerald-700 hover:underline">Confirm paid</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error} {error.includes('Sign in') && <Link to="/login" className="font-medium underline">Login</Link>}</p>}
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
    </div>
  )
}

function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<InvoiceRecord[]>('/invoices')
      .then((response) => setInvoices(response.data))
      .catch((requestError) => {
        const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined
        setError(status === 401 ? 'Sign in to view invoices.' : 'Invoices could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [])

  const totalDue = invoices.reduce((sum, invoice) => sum + invoice.remaining_amount, 0)

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Finance</p>
        <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Invoices" value={loading ? '—' : String(invoices.length)} change="Issued" tone="bg-sky-100 text-sky-700" />
        <StatCard label="Outstanding" value={loading ? '—' : `₹${totalDue.toLocaleString('en-IN')}`} change="Balance due" tone="bg-amber-100 text-amber-700" />
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error} {error.includes('Sign in') && <Link to="/login" className="font-medium underline">Login</Link>}</p>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-medium">Invoice</th><th className="px-4 py-3 font-medium">Booking</th><th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium">Event date</th><th className="px-4 py-3 font-medium">Total</th><th className="px-4 py-3 font-medium">Paid</th><th className="px-4 py-3 font-medium">Due</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading invoices…</td></tr>}
              {!loading && !error && invoices.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No invoices issued.</td></tr>}
              {!loading && invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800"><Link to={`/invoice/${invoice.id}`} className="hover:text-amber-700 hover:underline">{invoice.invoice_number}</Link></td><td className="px-4 py-3">#{invoice.booking_id}</td><td className="px-4 py-3">{invoice.customer_name}</td><td className="px-4 py-3">{invoice.event_date}</td><td className="px-4 py-3">₹{invoice.final_amount.toLocaleString('en-IN')}</td><td className="px-4 py-3">₹{invoice.paid_amount.toLocaleString('en-IN')}</td><td className="px-4 py-3 font-medium">₹{invoice.remaining_amount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function InvoiceDocumentPage() {
  const { invoiceId } = useParams()
  const [invoice, setInvoice] = useState<InvoiceDetailRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!invoiceId) return
    api.get<InvoiceDetailRecord>(`/invoices/${invoiceId}`)
      .then((response) => setInvoice(response.data))
      .catch((requestError) => {
        const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined
        setError(status === 401 ? 'Sign in to view this invoice.' : status === 403 ? 'You do not have access to this invoice.' : 'Invoice could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [invoiceId])

  const money = (value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <main className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        <div className="print-hidden mb-4 flex items-center justify-between gap-3">
          <Link to="/invoices" className="text-sm font-medium text-slate-600 hover:text-slate-900">← Back to invoices</Link>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"><Printer size={16} /> Print / Save PDF</button>
        </div>
        {loading && <p className="py-16 text-center text-sm text-slate-500">Loading invoice…</p>}
        {error && <p role="alert" className="py-16 text-center text-sm text-rose-700">{error} {error.includes('Sign in') && <Link to="/login" className="font-medium underline">Login</Link>}</p>}
        {invoice && (
          <article className="invoice-document rounded-2xl border border-slate-200 bg-white p-10 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
            <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-7">
              <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">EventHub</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Invoice</h1><p className="mt-1 text-sm text-slate-500">Event rental & booking</p></div>
              <div className="text-right"><p className="text-sm text-slate-500">Invoice number</p><p className="text-lg font-semibold text-slate-900">{invoice.invoice_number}</p><p className="mt-2 text-sm text-slate-500">Issued {new Date(invoice.created_at).toLocaleDateString('en-IN')}</p></div>
            </header>
            <section className="grid gap-8 py-7 sm:grid-cols-2">
              <div><h2 className="text-xs font-semibold uppercase text-slate-500">Bill to</h2><p className="mt-2 font-semibold text-slate-900">{invoice.customer_name}</p><p className="text-sm text-slate-600">{invoice.customer_email}</p>{invoice.customer_phone && <p className="text-sm text-slate-600">{invoice.customer_phone}</p>}<p className="mt-2 text-sm text-slate-600">{invoice.event_address}<br />{[invoice.city, invoice.district, invoice.state, invoice.pincode].filter(Boolean).join(', ')}</p></div>
              <div><h2 className="text-xs font-semibold uppercase text-slate-500">Event</h2><p className="mt-2 font-semibold text-slate-900">{invoice.event_type}</p><p className="text-sm text-slate-600">{new Date(`${invoice.event_date}T00:00:00`).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p><p className="mt-2 text-sm text-slate-600">Booking #{invoice.booking_id}</p><p className="mt-2 text-sm font-medium text-slate-800">{invoice.remaining_amount <= 0 ? 'Paid in full' : `${money(invoice.remaining_amount)} due`}</p></div>
            </section>
            <table className="w-full border-collapse text-left text-sm">
              <thead><tr className="border-y border-slate-200 text-xs uppercase text-slate-500"><th className="py-3 pr-3 font-medium">Description</th><th className="py-3 px-3 text-right font-medium">Qty</th><th className="py-3 px-3 text-right font-medium">Unit price</th><th className="py-3 pl-3 text-right font-medium">Amount</th></tr></thead>
              <tbody>{invoice.items.map((item, index) => <tr key={`${item.product_name}-${index}`} className="border-b border-slate-100"><td className="py-3 pr-3 font-medium text-slate-800">{item.product_name}</td><td className="py-3 px-3 text-right text-slate-600">{item.quantity}</td><td className="py-3 px-3 text-right text-slate-600">{money(item.unit_price)}</td><td className="py-3 pl-3 text-right text-slate-800">{money(item.total_price)}</td></tr>)}</tbody>
            </table>
            <section className="ml-auto mt-6 w-full max-w-sm space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{money(invoice.subtotal)}</span></div>
              {invoice.discount > 0 && <div className="flex justify-between text-slate-600"><span>Discount</span><span>-{money(invoice.discount)}</span></div>}
              <div className="flex justify-between text-slate-600"><span>Tax</span><span>{money(invoice.tax)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Delivery</span><span>{money(invoice.delivery_charge)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Setup</span><span>{money(invoice.setup_charge)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Security deposit</span><span>{money(invoice.security_deposit)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900"><span>Total</span><span>{money(invoice.final_amount)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Paid</span><span>{money(invoice.paid_amount)}</span></div>
              <div className="flex justify-between font-semibold text-slate-900"><span>Balance due</span><span>{money(invoice.remaining_amount)}</span></div>
            </section>
            <footer className="mt-12 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">Thank you for choosing EventHub.</footer>
          </article>
        )}
      </div>
    </main>
  )
}

function QuotationDocumentPage() {
  const { quotationId } = useParams()
  const [quotation, setQuotation] = useState<QuotationRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!quotationId) return
    api.get<QuotationRecord>(`/quotations/${quotationId}`)
      .then((response) => setQuotation(response.data))
      .catch((requestError) => {
        const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined
        setError(status === 401 ? 'Sign in to view this quotation.' : status === 403 ? 'You do not have access to this quotation.' : 'Quotation could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [quotationId])

  const money = (value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <main className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        <div className="print-hidden mb-4 flex items-center justify-between gap-3">
          <Link to="/quotations" className="text-sm font-medium text-slate-600 hover:text-slate-900">← Back to quotations</Link>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"><Printer size={16} /> Print / Save PDF</button>
        </div>
        {loading && <p className="py-16 text-center text-sm text-slate-500">Loading quotation…</p>}
        {error && <p role="alert" className="py-16 text-center text-sm text-rose-700">{error} {error.includes('Sign in') && <Link to="/login" className="font-medium underline">Login</Link>}</p>}
        {quotation && (
          <article className="invoice-document rounded-2xl border border-slate-200 bg-white p-10 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
            <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-7">
              <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">EventHub</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Rental quotation</h1><p className="mt-1 text-sm text-slate-500">Estimate for event services</p></div>
              <div className="text-right"><p className="text-sm text-slate-500">Quotation</p><p className="text-lg font-semibold text-slate-900">Q-{String(quotation.id).padStart(6, '0')}</p><span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">{quotation.status}</span></div>
            </header>
            <section className="grid gap-8 py-7 sm:grid-cols-2">
              <div><h2 className="text-xs font-semibold uppercase text-slate-500">Prepared for</h2><p className="mt-2 font-semibold text-slate-900">{quotation.customer_name}</p><p className="text-sm text-slate-600">{quotation.customer_email}</p>{quotation.customer_phone && <p className="text-sm text-slate-600">{quotation.customer_phone}</p>}</div>
              <div><h2 className="text-xs font-semibold uppercase text-slate-500">Event details</h2><p className="mt-2 font-semibold text-slate-900">{new Date(`${quotation.event_date}T00:00:00`).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p><p className="text-sm text-slate-600">{quotation.location}</p></div>
            </section>
            <table className="w-full border-collapse text-left text-sm">
              <thead><tr className="border-y border-slate-200 text-xs uppercase text-slate-500"><th className="py-3 pr-3 font-medium">Rental item</th><th className="py-3 px-3 text-right font-medium">Qty</th><th className="py-3 px-3 text-right font-medium">Unit price</th><th className="py-3 pl-3 text-right font-medium">Amount</th></tr></thead>
              <tbody>{quotation.items.map((item, index) => <tr key={`${item.product_id}-${index}`} className="border-b border-slate-100"><td className="py-3 pr-3 font-medium text-slate-800">{item.product_name}</td><td className="py-3 px-3 text-right text-slate-600">{item.quantity}</td><td className="py-3 px-3 text-right text-slate-600">{money(item.unit_price)}</td><td className="py-3 pl-3 text-right text-slate-800">{money(item.total_price)}</td></tr>)}</tbody>
            </table>
            <div className="ml-auto mt-6 flex w-full max-w-sm justify-between border-t border-slate-200 pt-4 text-lg font-semibold text-slate-900"><span>Estimated total</span><span>{money(quotation.total_amount)}</span></div>
            <footer className="mt-12 border-t border-slate-200 pt-4 text-xs text-slate-500">This quotation is based on the rental items and event details listed above.</footer>
          </article>
        )}
      </div>
    </main>
  )
}

function QuotationsPage() {
  const [products, setProducts] = useState<RentalProduct[]>([])
  const [quotations, setQuotations] = useState<QuotationRecord[]>([])
  const [eventDate, setEventDate] = useState(() => dateKey(new Date()))
  const [location, setLocation] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [lines, setLines] = useState<BookingLine[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const total = lines.reduce((sum, line) => sum + (products.find((product) => product.id === line.product_id)?.rental_price ?? 0) * line.quantity, 0)

  useEffect(() => {
    Promise.all([api.get<RentalProduct[]>('/products'), api.get<QuotationRecord[]>('/quotations'), api.get('/auth/me')])
      .then(([productResponse, quotationResponse, profileResponse]) => {
        setProducts(productResponse.data)
        setQuotations(quotationResponse.data)
        setIsAdmin(profileResponse.data.role === 'admin')
      })
      .catch((requestError) => {
        const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined
        setError(status === 401 ? 'Sign in to create and view quotations.' : 'Quotation data could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [])

  function addProduct() {
    const productId = Number(selectedProductId)
    if (!productId) return
    setLines((current) => {
      const existing = current.find((line) => line.product_id === productId)
      return existing
        ? current.map((line) => line.product_id === productId ? { ...line, quantity: line.quantity + 1 } : line)
        : [...current, { product_id: productId, quantity: 1 }]
    })
    setSelectedProductId('')
  }

  async function submitQuotation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      const response = await api.post<QuotationRecord>('/quotations', { event_date: eventDate, location, items: lines })
      setQuotations((current) => [response.data, ...current])
      setLines([])
      setNotice(`Quotation #${response.data.id} created.`)
    } catch (requestError) {
      const detail = axios.isAxiosError(requestError) ? requestError.response?.data?.detail : null
      setError(typeof detail === 'string' ? detail : 'Quotation could not be created.')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(quotationId: number, status: 'Accepted' | 'Rejected') {
    setError('')
    setNotice('')
    try {
      await api.patch(`/quotations/${quotationId}/status`, { status })
      setQuotations((current) => current.map((quotation) => quotation.id === quotationId ? { ...quotation, status } : quotation))
      setNotice(`Quotation #${quotationId} ${status.toLowerCase()}.`)
    } catch {
      setError('Quotation status could not be updated.')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Estimate workspace</p>
        <h1 className="text-2xl font-semibold text-slate-900">Quotations</h1>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={submitQuotation} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Build a quote</h2>
          <label className="block text-sm font-medium text-slate-700">Event date<input required type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
          <label className="block text-sm font-medium text-slate-700">Event location<input required maxLength={200} value={location} onChange={(event) => setLocation(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
          <div className="flex gap-2">
            <select aria-label="Quotation product" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5">
              <option value="">Select a rental product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} · ₹{product.rental_price}/{product.unit}</option>)}
            </select>
            <button type="button" onClick={addProduct} disabled={!selectedProductId} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">Add item</button>
          </div>
          <div className="space-y-2">
            {lines.map((line) => {
              const product = products.find((item) => item.id === line.product_id)
              return <div key={line.product_id} className="flex items-center gap-2 text-sm"><span className="min-w-0 flex-1 text-slate-700">{product?.name}</span><input aria-label={`${product?.name} quantity`} type="number" min="1" value={line.quantity} onChange={(event) => setLines((current) => current.map((item) => item.product_id === line.product_id ? { ...item, quantity: Math.max(1, Number(event.target.value)) } : item))} className="w-20 rounded-lg border border-slate-200 px-2 py-1.5" /><button type="button" onClick={() => setLines((current) => current.filter((item) => item.product_id !== line.product_id))} className="text-slate-400 hover:text-rose-600">Remove</button></div>
            })}
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 font-semibold text-slate-900"><span>Estimated total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
          <button type="submit" disabled={submitting || lines.length === 0} className="w-full rounded-xl bg-amber-500 px-4 py-3 font-medium text-white disabled:opacity-50">{submitting ? 'Creating…' : 'Create quotation'}</button>
        </form>

        <div className="space-y-3">
          {loading && <p className="text-sm text-slate-500">Loading quotations…</p>}
          {!loading && !error && quotations.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No quotations yet.</div>}
          {quotations.map((quotation) => (
            <article key={quotation.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="font-semibold text-slate-900">Quote #{quotation.id} · {quotation.customer_name}</h2><p className="mt-1 text-sm text-slate-500">{quotation.event_date} · {quotation.location}</p><Link to={`/quotation/${quotation.id}`} className="mt-2 inline-block text-sm font-medium text-amber-700 hover:underline">View / print quote</Link></div>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">{quotation.status}</span>
              </div>
              <div className="mt-4 space-y-1 text-sm text-slate-600">
                {quotation.items.map((item, index) => <div key={`${quotation.id}-${item.product_id}-${index}`} className="flex justify-between gap-3"><span>{item.product_name} × {item.quantity}</span><span>₹{item.total_price.toLocaleString('en-IN')}</span></div>)}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <span className="font-semibold text-slate-900">Total ₹{quotation.total_amount.toLocaleString('en-IN')}</span>
                {isAdmin && quotation.status === 'Pending' && <div className="flex gap-3"><button type="button" onClick={() => void updateStatus(quotation.id, 'Accepted')} className="font-medium text-emerald-700 hover:underline">Accept</button><button type="button" onClick={() => void updateStatus(quotation.id, 'Rejected')} className="font-medium text-rose-700 hover:underline">Reject</button></div>}
              </div>
            </article>
          ))}
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error} {error.includes('Sign in') && <Link to="/login" className="font-medium underline">Login</Link>}</p>}
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
    </div>
  )
}

function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 font-bold text-slate-950">E</div>
          <div>
            <p className="text-lg font-semibold">EventHub</p>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Rental & Booking</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium">Login</Link>
          <Link to="/register" className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium">Create account</Link>
          <Link to="/admin/dashboard" className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950">Book a Demo</Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-16">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-sm text-amber-200">
              <Sparkles size={16} />
              Trusted by 500+ wedding and event planners
            </div>
            <h1 className="max-w-xl text-5xl font-semibold leading-tight text-white">Modern event rental management for premium Indian celebrations.</h1>
            <p className="mt-5 max-w-lg text-lg text-slate-300">Streamline bookings, manage inventory, assign staff, calculate availability, generate quotations, and maintain strong financial visibility from one place.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/create-booking" className="rounded-full bg-amber-500 px-6 py-3 font-medium text-slate-950">Start Booking</Link>
              <Link to="/services" className="rounded-full border border-slate-700 px-6 py-3 font-medium text-white">Explore Services</Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-amber-500/10">
            <div className="rounded-2xl bg-slate-950 p-5">
              <div className="flex items-center justify-between font-medium text-slate-300">
                <span>Wedding Package</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">Confirmed</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-800 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Tent</p>
                  <p className="mt-2 text-2xl font-semibold text-white">1</p>
                </div>
                <div className="rounded-2xl bg-slate-800 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Chairs</p>
                  <p className="mt-2 text-2xl font-semibold text-white">200</p>
                </div>
                <div className="rounded-2xl bg-slate-800 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">DJ</p>
                  <p className="mt-2 text-2xl font-semibold text-white">1</p>
                </div>
                <div className="rounded-2xl bg-slate-800 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Value</p>
                  <p className="mt-2 text-2xl font-semibold text-white">₹75k</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('admin@eventhub.in')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await api.post('/auth/login', { email, password })
      localStorage.setItem('eventhub_token', response.data.access_token)
      const requestedPath = location.state?.from
      if (response.data.user.role === 'admin') {
        navigate(typeof requestedPath === 'string' && requestedPath.startsWith('/admin/') ? requestedPath : '/admin/dashboard')
      } else {
        navigate(typeof requestedPath === 'string' && !requestedPath.startsWith('/admin/') ? requestedPath : '/dashboard')
      }
    } catch {
      setError('Email or password was not accepted.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-xl font-bold text-slate-950">E</div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to manage bookings and inventory</p>
        </div>

        <form onSubmit={submitLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
          </div>
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <button type="submit" disabled={submitting} className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-center font-medium text-white disabled:opacity-50">{submitting ? 'Signing in…' : 'Login'}</button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">New to EventHub? <Link to="/register" className="font-medium text-amber-700 hover:underline">Create a customer account</Link></p>
      </div>
    </div>
  )
}

function RegisterPage() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (draft.password !== draft.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const response = await api.post('/auth/register', {
        full_name: draft.full_name,
        email: draft.email,
        phone: draft.phone || null,
        password: draft.password,
      })
      localStorage.setItem('eventhub_token', response.data.access_token)
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      const detail = axios.isAxiosError(requestError) ? requestError.response?.data?.detail : null
      setError(typeof detail === 'string' ? detail : 'Account could not be created. Check your details and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-xl font-bold text-slate-950">E</div>
          <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Book rentals and manage your event requests</p>
        </div>
        <form onSubmit={submitRegistration} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">Full name<input required maxLength={150} autoComplete="name" value={draft.full_name} onChange={(event) => setDraft((current) => ({ ...current, full_name: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="block text-sm font-medium text-slate-700">Email<input required type="email" autoComplete="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="block text-sm font-medium text-slate-700">Phone <span className="font-normal text-slate-400">(optional)</span><input type="tel" autoComplete="tel" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="block text-sm font-medium text-slate-700">Password<input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={draft.password} onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          <label className="block text-sm font-medium text-slate-700">Confirm password<input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={draft.confirm_password} onChange={(event) => setDraft((current) => ({ ...current, confirm_password: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-center font-medium text-white disabled:opacity-50">{submitting ? 'Creating account…' : 'Create account'}</button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">Already have an account? <Link to="/login" className="font-medium text-amber-700 hover:underline">Log in</Link></p>
      </div>
    </div>
  )
}

function CalendarPage() {
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()))
  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    setLoading(true)
    api.get<BookingRecord[]>('/bookings', {
      params: {
        start_date: dateKey(new Date(year, month, 1)),
        end_date: dateKey(new Date(year, month + 1, 0)),
      },
    })
      .then((response) => {
        setBookings(response.data)
        setError('')
      })
      .catch((requestError) => {
        const status = axios.isAxiosError(requestError) ? requestError.response?.status : undefined
        setError(status === 401 ? 'Sign in to view the booking calendar.' : 'Calendar bookings could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [viewMonth])

  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
  const gridStart = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1 - ((firstDay.getDay() + 6) % 7))
  const days = Array.from({ length: 42 }, (_, index) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index))
  const bookingsByDate = bookings.reduce<Record<string, BookingRecord[]>>((grouped, booking) => {
    grouped[booking.event_date] = [...(grouped[booking.event_date] ?? []), booking]
    return grouped
  }, {})
  const selectedBookings = bookingsByDate[selectedDate] ?? []

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Operations</p>
          <h1 className="text-2xl font-semibold text-slate-900">Booking Calendar</h1>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Previous month" title="Previous month" onClick={() => setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50"><ChevronLeft size={18} /></button>
          <h2 className="min-w-40 text-center text-lg font-semibold text-slate-900">{viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
          <button type="button" aria-label="Next month" title="Next month" onClick={() => setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50"><ChevronRight size={18} /></button>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-rose-700">{error} {error.includes('Sign in') && <Link to="/login" className="font-medium underline">Login</Link>}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-medium uppercase text-slate-500">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div key={day} className="py-3">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = dateKey(day)
            const count = bookingsByDate[key]?.length ?? 0
            const isCurrentMonth = day.getMonth() === viewMonth.getMonth()
            return (
              <button
                key={key}
                type="button"
                aria-label={`${day.toLocaleDateString('en-IN', { dateStyle: 'full' })}${count ? `, ${count} bookings` : ''}`}
                aria-pressed={selectedDate === key}
                onClick={() => setSelectedDate(key)}
                className={`flex aspect-square min-w-0 flex-col items-center justify-center gap-1 border-b border-r border-slate-100 text-sm ${selectedDate === key ? 'bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-500' : 'hover:bg-slate-50'} ${isCurrentMonth ? 'text-slate-800' : 'text-slate-300'}`}
              >
                <span>{day.getDate()}</span>
                {count > 0 && <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold leading-4 text-white">{count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Events on {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', { dateStyle: 'long' })}</h2>
          {loading && <span className="text-sm text-slate-500">Loading…</span>}
        </div>
        {!loading && selectedBookings.length === 0 && <p className="text-sm text-slate-500">No bookings on this date.</p>}
        <div className="divide-y divide-slate-100">
          {selectedBookings.map((booking) => (
            <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium text-slate-800">{booking.event_type} · {booking.customer_name}</p>
                <p className="text-sm text-slate-500">{booking.start_time}–{booking.end_time} · {booking.city}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{booking.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <Routes>
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/bookings" element={<BookingListPage title="Booking Management" />} />
          <Route path="/admin/calendar" element={<CalendarPage />} />
          <Route path="/admin/products" element={<ProductsPage allowCreate />} />
          <Route path="/admin/inventory" element={<InventoryPage />} />
                    <Route path="/admin/vehicles" element={<VehiclesPage />} />
                    <Route path="/admin/catering" element={<CateringPage adminMode />} />
                    <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/customers" element={<CustomersPage />} />
          <Route path="/admin/staff" element={<StaffPage />} />
          <Route path="/admin/invoices" element={<InvoicesPage />} />
          <Route path="/admin/payments" element={<PaymentsPage />} />
          <Route path="/admin/quotations" element={<QuotationsPage />} />
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route path="/admin/settings" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const location = useLocation()
  const [access, setAccess] = useState<'checking' | 'allowed' | 'login' | 'customer'>('checking')

  useEffect(() => {
    let active = true
    if (!localStorage.getItem('eventhub_token')) {
      setAccess('login')
      return () => { active = false }
    }

    api.get('/auth/me')
      .then((response) => {
        if (active) setAccess(adminOnly && response.data.role !== 'admin' ? 'customer' : 'allowed')
      })
      .catch(() => {
        localStorage.removeItem('eventhub_token')
        if (active) setAccess('login')
      })

    return () => { active = false }
  }, [adminOnly])

  if (access === 'checking') return <div className="p-8 text-sm text-slate-500">Checking access…</div>
  if (access === 'login') return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (access === 'customer') return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicLandingPage />} />
      <Route path="/services" element={<ProductsPage />} />
      <Route path="/catering" element={<CateringPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/create-booking" element={<BookingFormPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><BookingListPage title="My Bookings" /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><CustomerProfilePage /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
      <Route path="/invoice/:invoiceId" element={<ProtectedRoute><InvoiceDocumentPage /></ProtectedRoute>} />
      <Route path="/quotation/:quotationId" element={<ProtectedRoute><QuotationDocumentPage /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
      <Route path="/quotations" element={<ProtectedRoute><QuotationsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
