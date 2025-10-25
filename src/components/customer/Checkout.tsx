import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MapPin, CreditCard, Upload, CheckCircle } from 'lucide-react';

interface Address {
  id: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  is_default: boolean;
}

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
  };
}

interface CheckoutProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ onComplete, onCancel }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState<'address' | 'payment' | 'confirm'>('address');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchAddresses();
    fetchCart();
  }, []);

  const fetchAddresses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
      const defaultAddress = data?.find((a) => a.is_default);
      if (defaultAddress) setSelectedAddress(defaultAddress.id);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const fetchCart = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('customer_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const placeOrder = async () => {
    if (!user || !selectedAddress || cartItems.length === 0) return;

    setLoading(true);

    try {
      const orderNumber = `VST${Date.now()}`;
      const totalAmount = calculateTotal();

      let screenshotUrl = '';
      if (paymentScreenshot) {
        screenshotUrl = `payment_${Date.now()}_${paymentScreenshot.name}`;
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: user.id,
          address_id: selectedAddress,
          total_amount: totalAmount,
          payment_status: 'pending',
          payment_method: 'phonepe_qr',
          payment_screenshot_url: screenshotUrl,
          order_status: 'placed',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_purchase: item.product.price,
        size: item.size,
        color: item.color,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      const { error: cartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('customer_id', user.id);

      if (cartError) throw cartError;

      onComplete();
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedAddressData = addresses.find((a) => a.id === selectedAddress);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex items-center gap-2 ${step === 'address' ? 'text-amber-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'address' ? 'bg-amber-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Address</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-amber-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'payment' ? 'bg-amber-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Payment</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-amber-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'confirm' ? 'bg-amber-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Confirm</span>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 'address' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Select Delivery Address</h3>
              {addresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No addresses saved. Please add an address first.</p>
                </div>
              ) : (
                addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedAddress === address.id
                        ? 'border-amber-600 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddress === address.id}
                      onChange={(e) => setSelectedAddress(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                        selectedAddress === address.id
                          ? 'border-amber-600 bg-amber-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedAddress === address.id && (
                          <CheckCircle className="w-full h-full text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        {address.is_default && (
                          <span className="inline-block bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium mb-2">
                            Default
                          </span>
                        )}
                        <p className="font-medium text-gray-900">{address.address_line1}</p>
                        {address.address_line2 && (
                          <p className="text-gray-600">{address.address_line2}</p>
                        )}
                        <p className="text-gray-600">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="text-gray-600">Phone: {address.phone}</p>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-amber-600" />
                  PhonePe Payment
                </h3>
                <div className="bg-white rounded-lg p-6 mb-4">
                  <div className="text-center">
                    <div className="bg-gray-100 w-64 h-64 mx-auto rounded-lg flex items-center justify-center mb-4">
                      <div className="text-center">
                        <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                          <p className="text-gray-500 text-sm px-4">PhonePe QR Code<br/>Scan to Pay</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-amber-600 mb-2">₹{calculateTotal().toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Scan the QR code with PhonePe to complete payment</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-2">Payment Instructions:</p>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Open PhonePe app on your phone</li>
                    <li>Scan the QR code above</li>
                    <li>Complete the payment</li>
                    <li>Take a screenshot of the payment confirmation</li>
                    <li>Upload the screenshot below</li>
                  </ol>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Payment Screenshot
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="payment-screenshot"
                  />
                  <label htmlFor="payment-screenshot" className="cursor-pointer">
                    {screenshotPreview ? (
                      <div>
                        <img
                          src={screenshotPreview}
                          alt="Payment screenshot"
                          className="max-h-48 mx-auto mb-2 rounded-lg"
                        />
                        <p className="text-sm text-green-600 font-medium">Screenshot uploaded</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-600">Click to upload payment screenshot</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <h3 className="text-xl font-bold text-green-900">Ready to Place Order</h3>
                </div>
                <p className="text-green-700">Please review your order details before confirming.</p>
              </div>

              <div className="border rounded-xl p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Delivery Address</h4>
                  {selectedAddressData && (
                    <div className="text-gray-600 text-sm">
                      <p>{selectedAddressData.address_line1}</p>
                      {selectedAddressData.address_line2 && <p>{selectedAddressData.address_line2}</p>}
                      <p>
                        {selectedAddressData.city}, {selectedAddressData.state} - {selectedAddressData.pincode}
                      </p>
                      <p>Phone: {selectedAddressData.phone}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.product.name} ({item.size}, {item.color}) x {item.quantity}
                        </span>
                        <span className="font-medium">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total Amount</span>
                    <span className="text-amber-600">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200">
          <div className="flex gap-3">
            {step !== 'address' && (
              <button
                onClick={() => {
                  if (step === 'payment') setStep('address');
                  if (step === 'confirm') setStep('payment');
                }}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (step === 'address') {
                  if (!selectedAddress) {
                    alert('Please select a delivery address');
                    return;
                  }
                  setStep('payment');
                } else if (step === 'payment') {
                  if (!paymentScreenshot) {
                    alert('Please upload payment screenshot');
                    return;
                  }
                  setStep('confirm');
                } else {
                  placeOrder();
                }
              }}
              disabled={loading || (step === 'address' && !selectedAddress)}
              className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : step === 'confirm' ? 'Place Order' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
