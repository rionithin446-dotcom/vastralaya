import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Truck, CheckCircle, XCircle } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  total_amount: number;
  payment_status: string;
  order_status: string;
  tracking_number: string | null;
  created_at: string;
  customer: {
    full_name: string;
    email: string;
    phone_number: string;
  };
  address: {
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  order_items: Array<{
    quantity: number;
    price_at_purchase: number;
    size: string;
    color: string;
    product: {
      name: string;
      category: string;
    };
  }>;
}

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(full_name, email, phone_number),
          address:customer_addresses(*),
          order_items(*, product:products(name, category))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', orderId);

      if (error) throw error;
      await fetchOrders();
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  const updateTrackingNumber = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_number: trackingNumber, order_status: 'shipped' })
        .eq('id', orderId);

      if (error) throw error;
      setTrackingNumber('');
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err) {
      console.error('Error updating tracking number:', err);
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

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
        <div className="text-sm text-gray-500">Total Orders: {orders.length}</div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.order_number}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                    {order.order_status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {order.payment_status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Customer Details</h4>
                  <p className="text-sm text-gray-600">{order.customer?.full_name}</p>
                  <p className="text-sm text-gray-600">{order.customer?.email}</p>
                  <p className="text-sm text-gray-600">{order.customer?.phone_number}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Delivery Address</h4>
                  <p className="text-sm text-gray-600">
                    {order.address?.address_line1}, {order.address?.address_line2}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.address?.city}, {order.address?.state} - {order.address?.pincode}
                  </p>
                  <p className="text-sm text-gray-600">Phone: {order.address?.phone}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Order Items</h4>
                <div className="space-y-2">
                  {order.order_items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.product?.name} ({item.size}, {item.color}) x {item.quantity}
                      </span>
                      <span className="font-medium">₹{item.price_at_purchase.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200 flex justify-between font-semibold">
                    <span>Total Amount</span>
                    <span className="text-amber-600">₹{order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {order.tracking_number && (
                <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Truck className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Tracking Number: {order.tracking_number}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {order.order_status === 'placed' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'confirmed')}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm Order
                  </button>
                )}
                {order.order_status === 'confirmed' && (
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Truck className="w-4 h-4" />
                    Mark as Shipped
                  </button>
                )}
                {order.order_status === 'shipped' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Delivered
                  </button>
                )}
                {!['cancelled', 'delivered'].includes(order.order_status) && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Tracking Number</h3>
            <p className="text-sm text-gray-600 mb-4">
              Order #{selectedOrder.order_number}
            </p>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateTrackingNumber(selectedOrder.id)}
                className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setTrackingNumber('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
