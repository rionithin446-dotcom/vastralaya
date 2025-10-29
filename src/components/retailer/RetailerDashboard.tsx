import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardHome } from './DashboardHome';
import { ProductUpload } from './ProductUpload';
import { OrderManagement } from './OrderManagement';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Upload,
  LogOut,
  Store,
  Menu,
  X,
  Settings,
  BarChart3,
} from 'lucide-react';

type TabType = 'home' | 'upload' | 'orders' | 'analytics' | 'settings';

export const RetailerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, retailerData } = useAuth();

  const navigation = [
    { id: 'home' as TabType, name: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload' as TabType, name: 'Products', icon: Package },
    { id: 'orders' as TabType, name: 'Orders', icon: ShoppingBag },
    { id: 'analytics' as TabType, name: 'Analytics', icon: BarChart3 },
    { id: 'settings' as TabType, name: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardHome />;
      case 'upload':
        return <ProductUpload />;
      case 'orders':
        return <OrderManagement />;
      case 'analytics':
        return (
          <div className="text-center py-20">
            <BarChart3 className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Analytics Coming Soon</h3>
            <p className="text-slate-600">Advanced analytics and reporting features will be available shortly.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-20">
            <Settings className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Settings Coming Soon</h3>
            <p className="text-slate-600">Profile and account settings will be available shortly.</p>
          </div>
        );
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Store className="w-8 h-8 text-emerald-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Vastralaya</h1>
                <p className="text-xs text-slate-400">Retailer Portal</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <div className="bg-slate-800 rounded-xl p-4 mb-4">
              <p className="text-xs text-slate-400 mb-2">Logged in as</p>
              <p className="text-sm font-semibold text-white truncate">{retailerData?.email || 'Retailer'}</p>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 text-red-400 hover:bg-red-600/20 rounded-xl font-medium transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-slate-600" />
              </button>

              <div className="hidden lg:block">
                <h2 className="text-2xl font-bold text-slate-900">
                  {navigation.find((item) => item.id === activeTab)?.name}
                </h2>
              </div>

              <div className="lg:hidden">
                <div className="flex items-center gap-2">
                  <Store className="w-6 h-6 text-emerald-600" />
                  <span className="font-bold text-slate-900">Vastralaya</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-emerald-700">Active</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};
