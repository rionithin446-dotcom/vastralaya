import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProductUpload } from './ProductUpload';
import { OrderManagement } from './OrderManagement';
import { Package, ShoppingBag, LogOut, Upload } from 'lucide-react';

export const RetailerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'orders'>('upload');
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <nav className="bg-white shadow-lg border-b-4 border-amber-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-amber-900">Vastralaya</h1>
              <span className="ml-4 text-sm text-amber-700">Retailer Portal</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'upload'
                    ? 'border-amber-600 text-amber-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Upload className="w-5 h-5" />
                Upload Products
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'orders'
                    ? 'border-amber-600 text-amber-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                Manage Orders
              </button>
            </nav>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeTab === 'upload' ? <ProductUpload /> : <OrderManagement />}
        </div>
      </div>
    </div>
  );
};
