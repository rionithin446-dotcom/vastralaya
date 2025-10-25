import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Filter, ShoppingCart, Plus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  size_options: string[];
  color_options: string[];
  material: string;
}

interface ProductBrowseProps {
  onCartUpdate: (count: number) => void;
}

export const ProductBrowse: React.FC<ProductBrowseProps> = ({ onCartUpdate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();

  const categories = ['All', 'Saree', 'Kurti', 'Mysore Silk', 'Crepe Silk', 'Lehenga', 'Salwar Kameez', 'Dupatta', 'Blouse'];

  useEffect(() => {
    fetchProducts();
    fetchCartCount();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    if (!user) return;
    try {
      const { count, error } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id);

      if (error) throw error;
      onCartUpdate(count || 0);
    } catch (err) {
      console.error('Error fetching cart count:', err);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const addToCart = async () => {
    if (!user || !selectedProduct) return;

    try {
      const { error } = await supabase.from('cart_items').upsert(
        {
          customer_id: user.id,
          product_id: selectedProduct.id,
          quantity,
          size: selectedSize,
          color: selectedColor,
        },
        { onConflict: 'customer_id,product_id,size,color' }
      );

      if (error) throw error;

      setSelectedProduct(null);
      setSelectedSize('');
      setSelectedColor('');
      setQuantity(1);
      fetchCartCount();
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for sarees, kurtis, silk..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              onClick={() => {
                setSelectedProduct(product);
                if (product.size_options?.length > 0) setSelectedSize(product.size_options[0]);
                if (product.color_options?.length > 0) setSelectedColor(product.color_options[0]);
              }}
            >
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.pexels.com/photos/1113554/pexels-photo-1113554.jpeg';
                  }}
                />
              </div>
              <div className="p-4">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full mb-2">
                  {product.category}
                </span>
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                {product.material && (
                  <p className="text-xs text-gray-500 mb-2">Material: {product.material}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-amber-600">₹{product.price.toFixed(2)}</span>
                  <span className="text-sm text-gray-500">Stock: {product.stock_quantity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="aspect-square overflow-hidden rounded-xl bg-gray-100 mb-6">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.pexels.com/photos/1113554/pexels-photo-1113554.jpeg';
                  }}
                />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h2>
              <p className="text-gray-600 mb-4">{selectedProduct.description}</p>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium">{selectedProduct.category}</span>
                </div>
                {selectedProduct.material && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Material</span>
                    <span className="font-medium">{selectedProduct.material}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Stock Available</span>
                  <span className="font-medium">{selectedProduct.stock_quantity}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Price</span>
                  <span className="text-3xl font-bold text-amber-600">₹{selectedProduct.price.toFixed(2)}</span>
                </div>
              </div>

              {selectedProduct.size_options?.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Size</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.size_options.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          selectedSize === size
                            ? 'border-amber-600 bg-amber-50 text-amber-900'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedProduct.color_options?.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Color</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.color_options.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          selectedColor === color
                            ? 'border-amber-600 bg-amber-50 text-amber-900'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-semibold"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedProduct.stock_quantity, quantity + 1))}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={addToCart}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-200"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
