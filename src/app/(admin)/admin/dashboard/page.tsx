// src/app/(admin)/admin/dashboard/page.tsx
export default function AdminDashboardPage() {
  const stats = [
    { label: 'Total Users', value: '12,345', change: '+12%' },
    { label: 'Mitra Aktif', value: '1,234', change: '+8%' },
    { label: 'Transaksi Hari Ini', value: 'Rp 45.2M', change: '+23%' },
    { label: 'Pending Verifikasi', value: '56', change: '-5%' },
  ];

  const recentActivities = [
    { id: 1, action: 'User baru mendaftar', user: 'john@email.com', time: '5 menit lalu' },
    { id: 2, action: 'Mitra terverifikasi', user: 'Bengkel Jaya Motor', time: '15 menit lalu' },
    { id: 3, action: 'Transaksi selesai', user: 'Order #12345', time: '1 jam lalu' },
    { id: 4, action: 'Laporan baru', user: 'Report #789', time: '2 jam lalu' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Selamat datang di Admin Panel Posko</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <span className={`text-sm font-medium ${
                stat.change.startsWith('+') ?  'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.user}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors text-left">
              📋 Lihat Pending Verifikasi
            </button>
            <button className="w-full px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors text-left">
              👥 Kelola Users
            </button>
            <button className="w-full px-4 py-3 bg-green-50 text-green-600 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors text-left">
              💰 Lihat Transaksi
            </button>
            <button className="w-full px-4 py-3 bg-purple-50 text-purple-600 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors text-left">
              📊 Generate Laporan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}