import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RetailerLogin } from './components/retailer/RetailerLogin';
import { RetailerDashboard } from './components/retailer/RetailerDashboard';
import { CustomerAuth } from './components/customer/CustomerAuth';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { Store, User } from 'lucide-react';

function AppContent() {
  const [portalType, setPortalType] = useState<'customer' | 'retailer' | null>(null);
  const { user, userType, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (userType === 'retailer') {
    return <RetailerDashboard />;
  }

  if (userType === 'customer') {
    return <CustomerDashboard />;
  }

  if (portalType === 'retailer') {
    return <RetailerLogin />;
  }

  if (portalType === 'customer') {
    return <CustomerAuth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Vastralaya
          </h1>
          <p className="text-xl text-gray-700 mb-2">Traditional Indian Cultural Dresses</p>
          <p className="text-gray-600">Discover the elegance of sarees, kurtis, and premium silk collections</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setPortalType('customer')}
            className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <User className="w-10 h-10 text-amber-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Customer Portal</h2>
            <p className="text-gray-600 mb-4">
              Browse our exclusive collection of traditional dresses, add to cart, and place orders
            </p>
            <div className="flex items-center justify-center text-amber-600 font-semibold">
              Start Shopping
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => setPortalType('retailer')}
            className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Store className="w-10 h-10 text-blue-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Retailer Portal</h2>
            <p className="text-gray-600 mb-4">
              Upload products, manage inventory, and process customer orders
            </p>
            <div className="flex items-center justify-center text-blue-600 font-semibold">
              Access Dashboard
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        <div className="mt-12 text-center">
          <div className="flex justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Premium Quality</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
