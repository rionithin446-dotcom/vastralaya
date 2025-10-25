import React, { useState } from 'react';
import { ProductBrowse } from './ProductBrowse';
import { Cart } from './Cart';
import { MyOrders } from './MyOrders';
import { MyAddresses } from './MyAddresses';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingBag, ShoppingCart, MapPin, Package, LogOut, Search } from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'browse' | 'cart' | 'orders' | 'addresses'>('browse');
  const [cartCount, setCartCount] = useState(0);
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md sticky top-0 z-40 border-b-4 border-amber-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Vastralaya
              </h1>
              <div className="hidden md:flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('browse')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'browse'
                      ? 'bg-amber-50 text-amber-900'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  Shop
                </button>
                <button
                  onClick={() => setActiveTab('cart')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors relative ${
                    activeTab === 'cart'
                      ? 'bg-amber-50 text-amber-900'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Cart
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-amber-50 text-amber-900'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'addresses'
                      ? 'bg-amber-50 text-amber-900'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  Addresses
                </button>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="md:hidden bg-white border-t border-gray-200 sticky top-16 z-30">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex flex-col items-center py-3 px-4 ${
              activeTab === 'browse' ? 'text-amber-600' : 'text-gray-600'
            }`}
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="text-xs mt-1">Shop</span>
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`flex flex-col items-center py-3 px-4 relative ${
              activeTab === 'cart' ? 'text-amber-600' : 'text-gray-600'
            }`}
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs mt-1">Cart</span>
            {cartCount > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center py-3 px-4 ${
              activeTab === 'orders' ? 'text-amber-600' : 'text-gray-600'
            }`}
          >
            <Package className="w-6 h-6" />
            <span className="text-xs mt-1">Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`flex flex-col items-center py-3 px-4 ${
              activeTab === 'addresses' ? 'text-amber-600' : 'text-gray-600'
            }`}
          >
            <MapPin className="w-6 h-6" />
            <span className="text-xs mt-1">Address</span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'browse' && <ProductBrowse onCartUpdate={setCartCount} />}
        {activeTab === 'cart' && <Cart onCartUpdate={setCartCount} />}
        {activeTab === 'orders' && <MyOrders />}
        {activeTab === 'addresses' && <MyAddresses />}
      </main>
    </div>
  );
};
