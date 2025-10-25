import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Plus, X } from 'lucide-react';

const CATEGORIES = [
  'Saree',
  'Kurti',
  'Mysore Silk',
  'Crepe Silk',
  'Lehenga',
  'Salwar Kameez',
  'Dupatta',
  'Blouse',
];

export const ProductUpload: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock_quantity: '',
    material: '',
    image_url: '',
    size_options: [''],
    color_options: [''],
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('products').insert({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        material: formData.material,
        image_url: formData.image_url,
        size_options: formData.size_options.filter((s) => s.trim() !== ''),
        color_options: formData.color_options.filter((c) => c.trim() !== ''),
        is_active: true,
      });

      if (insertError) throw insertError;

      setSuccess('Product uploaded successfully!');
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        stock_quantity: '',
        material: '',
        image_url: '',
        size_options: [''],
        color_options: [''],
      });
    } catch (err) {
      setError('Failed to upload product. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addField = (field: 'size_options' | 'color_options') => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ''],
    });
  };

  const removeField = (field: 'size_options' | 'color_options', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({
      ...formData,
      [field]: newArray.length > 0 ? newArray : [''],
    });
  };

  const updateField = (field: 'size_options' | 'color_options', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({
      ...formData,
      [field]: newArray,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <Upload className="w-12 h-12 text-amber-600 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-900">Upload New Product</h2>
      </div>

      {success && (
        <div className="bg-green-50 text-green-800 p-4 rounded-lg">{success}</div>
      )}
      {error && <div className="bg-red-50 text-red-800 p-4 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          >
            <option value="">Select Category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
          <input
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
          <input
            type="text"
            value={formData.material}
            onChange={(e) => setFormData({ ...formData, material: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="e.g., Pure Silk, Cotton"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Size Options</label>
        {formData.size_options.map((size, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={size}
              onChange={(e) => updateField('size_options', index, e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., S, M, L, XL"
            />
            {formData.size_options.length > 1 && (
              <button
                type="button"
                onClick={() => removeField('size_options', index)}
                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addField('size_options')}
          className="flex items-center gap-2 px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Size
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color Options</label>
        {formData.color_options.map((color, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={color}
              onChange={(e) => updateField('color_options', index, e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., Red, Blue, Green"
            />
            {formData.color_options.length > 1 && (
              <button
                type="button"
                onClick={() => removeField('color_options', index)}
                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addField('color_options')}
          className="flex items-center gap-2 px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Color
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Uploading...' : 'Upload Product'}
      </button>
    </form>
  );
};
