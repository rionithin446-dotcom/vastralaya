import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: string;
  order_status: string;
  tracking_number: string | null;
  created_at: string;
  address: {
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    pincode: string;
  };
  order_items: Array<{
    quantity: number;
    price_at_purchase: number;
    size: string;
    color: string;
    product: {
      name: string;
      category: string;
      image_url: string;
    };
  }>;
}

export const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          address:customer_addresses(*),
          order_items(*, product:products(*))
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'placed':
      case 'confirmed':
        return <Clock className="w-5 h-5" />;
      case 'shipped':
        return <Truck className="w-5 h-5" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-24 h-24 mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">No orders yet</h2>
        <p className="text-gray-500">Start shopping to see your orders here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">My Orders</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 border-b border-amber-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">Order #{order.order_number}</h3>
                  <p className="text-sm text-gray-600">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                    {getStatusIcon(order.order_status)}
                    {order.order_status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-4">
                {order.order_items?.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={item.product?.image_url}
                        alt={item.product?.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.pexels.com/photos/1113554/pexels-photo-1113554.jpeg';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.product?.name}</h4>
                      <p className="text-sm text-gray-600">{item.product?.category}</p>
                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{item.price_at_purchase.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Address</span>
                  <div className="text-right">
                    <p className="text-gray-900">{order.address?.address_line1}</p>
                    {order.address?.address_line2 && (
                      <p className="text-gray-900">{order.address?.address_line2}</p>
                    )}
                    <p className="text-gray-900">
                      {order.address?.city}, {order.address?.state} - {order.address?.pincode}
                    </p>
                  </div>
                </div>

                {order.tracking_number && (
                  <div className="flex justify-between text-sm bg-blue-50 p-3 rounded-lg">
                    <span className="text-blue-800 font-medium flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Tracking Number
                    </span>
                    <span className="text-blue-900 font-semibold">{order.tracking_number}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Total Amount</span>
                  <span className="text-amber-600">₹{order.total_amount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.payment_status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : order.payment_status === 'pending'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    Payment: {order.payment_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
