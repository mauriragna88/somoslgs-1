'use client'

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface ViewsByDay {
  date: string
  visitas: number
  unicos: number
}

interface ChartData {
  name: string
  value: number
}

interface AdminViewsChartsProps {
  viewsByDay: ViewsByDay[]
  topReferrers: ChartData[]
  devicesData: ChartData[]
  totalViews: number
  viewsThisMonth: number
  viewsLast30: number
}

const REFERRER_COLORS = ['#0F766E', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const DEVICE_COLORS = ['#0F766E', '#3b82f6']

export default function AdminViewsCharts({
  viewsByDay,
  topReferrers,
  devicesData,
  totalViews,
  viewsThisMonth,
  viewsLast30,
}: AdminViewsChartsProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }

  const hasData = viewsLast30 > 0

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-bold text-gray-900">👁 Analytics de Visitas</h3>
        <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
          {totalViews} total
        </span>
      </div>

      {/* KPI Mini Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{viewsThisMonth.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Este mes</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{viewsLast30.toLocaleString()}</p>
          <p className="text-xs text-gray-500">30 dias</p>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          <span className="text-4xl block mb-2">📊</span>
          <p>No hay datos de visitas aun</p>
          <p className="text-sm mt-1">Las visitas se registran cuando alguien ve el perfil publico</p>
        </div>
      ) : (
        <>
          {/* Views Over Time */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Visitas - Ultimos 30 Dias</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={viewsByDay}>
                  <defs>
                    <linearGradient id="adminColorVisitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickLine={false}
                    interval={5}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(label: any) => formatDate(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="visitas"
                    name="Visitas"
                    stroke="#0F766E"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#adminColorVisitas)"
                  />
                  <Area
                    type="monotone"
                    dataKey="unicos"
                    name="Unicos"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fillOpacity={0}
                  />
                  <Legend
                    verticalAlign="top"
                    iconType="line"
                    formatter={(value) => <span className="text-gray-700 text-xs">{value}</span>}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Referrers & Devices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Referrers */}
            {topReferrers.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Origen de Visitas</h4>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topReferrers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        type="number"
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                        width={75}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                        formatter={(value: any) => [`${value} visitas`, '']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {topReferrers.map((_, index) => (
                          <Cell key={`ref-${index}`} fill={REFERRER_COLORS[index % REFERRER_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Devices */}
            {devicesData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Dispositivos</h4>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={devicesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {devicesData.map((_, index) => (
                          <Cell key={`dev-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                        formatter={(value: any) => [`${value} visitas`, '']}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(value) => <span className="text-gray-700 text-xs">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
