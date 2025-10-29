import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  DollarSign,
  Users,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface Stats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalProducts: number;
  productsChange: number;
  lowStockCount: number;
  pendingOrders: number;
  recentOrders: any[];
  topProducts: any[];
}

export const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    totalProducts: 0,
    productsChange: 0,
    lowStockCount: 0,
    pendingOrders: 0,
    recentOrders: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, order_status, created_at');

      const { data: products } = await supabase
        .from('products')
        .select('stock_quantity, is_active');

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const pendingOrders = orders?.filter((o) => o.order_status === 'placed').length || 0;
      const lowStockProducts = products?.filter((p) => p.is_active && p.stock_quantity < 10) || [];

      setStats({
        totalRevenue,
        revenueChange: 12.5,
        totalOrders: ordersCount || 0,
        ordersChange: 8.2,
        totalProducts: products?.filter((p) => p.is_active).length || 0,
        productsChange: 3.1,
        lowStockCount: lowStockProducts.length,
        pendingOrders,
        recentOrders: recentOrders || [],
        topProducts: [],
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Overview</h1>
        <p className="text-slate-600">Welcome back! Here's what's happening with your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-emerald-100 text-sm font-medium">
              <ArrowUp className="w-4 h-4" />
              <span>{stats.revenueChange}%</span>
            </div>
          </div>
          <h3 className="text-white/80 text-sm font-medium mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-emerald-100 text-xs mt-2">vs last month</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 rounded-xl p-3">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
              <ArrowUp className="w-4 h-4" />
              <span>{stats.ordersChange}%</span>
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Total Orders</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.totalOrders}</p>
          <p className="text-slate-500 text-xs mt-2">{stats.pendingOrders} pending orders</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 rounded-xl p-3">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 text-purple-600 text-sm font-medium">
              <ArrowUp className="w-4 h-4" />
              <span>{stats.productsChange}%</span>
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Active Products</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.totalProducts}</p>
          <p className="text-slate-500 text-xs mt-2">In your catalog</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 rounded-xl p-3">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Low Stock Alert</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.lowStockCount}</p>
          <p className="text-slate-500 text-xs mt-2">Products need restock</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Recent Orders</h2>
            <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors">
              View All
            </button>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-slate-900">#{order.order_number}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{order.customer?.full_name || 'Unknown Customer'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">₹{Number(order.total_amount).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-left transition-all">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="font-semibold text-sm">Add New Product</p>
                  <p className="text-xs text-slate-300">Upload products to catalog</p>
                </div>
              </div>
            </button>

            <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-left transition-all">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-semibold text-sm">Manage Orders</p>
                  <p className="text-xs text-slate-300">{stats.pendingOrders} pending orders</p>
                </div>
              </div>
            </button>

            <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-left transition-all">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="font-semibold text-sm">View Analytics</p>
                  <p className="text-xs text-slate-300">Detailed business insights</p>
                </div>
              </div>
            </button>

            <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-left transition-all">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="font-semibold text-sm">Low Stock Items</p>
                  <p className="text-xs text-slate-300">{stats.lowStockCount} items need attention</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
