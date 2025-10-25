import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Checkout } from './Checkout';
import { Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';

interface CartItem {
  id: string;
  quantity: number;
  size: string;
  color: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    category: string;
    stock_quantity: number;
  };
}

interface CartProps {
  onCartUpdate: (count: number) => void;
}

export const Cart: React.FC<CartProps> = ({ onCartUpdate }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('customer_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
      onCartUpdate(data?.length || 0);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;
      await fetchCart();
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId);

      if (error) throw error;
      await fetchCart();
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  if (loading) {
    return <div className="text-center py-12">Loading cart...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="w-24 h-24 mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500">Add some products to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Shopping Cart</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-md p-4 flex gap-4">
              <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.pexels.com/photos/1113554/pexels-photo-1113554.jpeg';
                  }}
                />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{item.product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{item.product.category}</p>
                <div className="flex gap-4 text-sm text-gray-600 mb-2">
                  {item.size && <span>Size: {item.size}</span>}
                  {item.color && <span>Color: {item.color}</span>}
                </div>
                <p className="text-lg font-bold text-amber-600">₹{item.product.price.toFixed(2)}</p>
              </div>

              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-semibold w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 hover:bg-gray-200 rounded"
                    disabled={item.quantity >= item.product.stock_quantity}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-amber-600">₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowCheckout(true)}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-200"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>

      {showCheckout && (
        <Checkout
          onComplete={() => {
            setShowCheckout(false);
            fetchCart();
            alert('Order placed successfully! You will receive updates on your order status.');
          }}
          onCancel={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
};
