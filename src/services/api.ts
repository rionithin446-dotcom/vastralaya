import { supabase } from '../lib/supabase';

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };
}

function getRetailerHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export const productAPI = {
  getAll: async (category?: string) => {
    const url = category
      ? `${API_BASE_URL}/products?category=${category}`
      : `${API_BASE_URL}/products`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },
};

export const cartAPI = {
  getCart: async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/cart`, { headers });

    if (!response.ok) throw new Error('Failed to fetch cart');
    return response.json();
  },

  addItem: async (product_id: string, quantity: number, size?: string, color?: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ product_id, quantity, size, color }),
    });

    if (!response.ok) throw new Error('Failed to add item to cart');
    return response.json();
  },

  updateItem: async (itemId: string, quantity: number) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/cart/${itemId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) throw new Error('Failed to update cart item');
    return response.json();
  },

  removeItem: async (itemId: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/cart/${itemId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) throw new Error('Failed to remove cart item');
    return response.json();
  },

  clearCart: async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) throw new Error('Failed to clear cart');
    return response.json();
  },
};

export const orderAPI = {
  getOrders: async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/orders`, { headers });

    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  getById: async (id: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, { headers });

    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  },

  create: async (address_id: string, items: any[], payment_screenshot_url?: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ address_id, items, payment_screenshot_url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order');
    }
    return response.json();
  },
};

export const customerAPI = {
  getProfile: async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/customer-profile`, { headers });

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to fetch profile');
    }
    return response.status === 404 ? null : response.json();
  },

  createProfile: async (profile: { full_name: string; phone_number?: string; email?: string }) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/customer-profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify(profile),
    });

    if (!response.ok) throw new Error('Failed to create profile');
    return response.json();
  },

  updateProfile: async (updates: Partial<{ full_name: string; phone_number: string; email: string }>) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/customer-profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  addresses: {
    getAll: async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/customer-profile/addresses`, { headers });

      if (!response.ok) throw new Error('Failed to fetch addresses');
      return response.json();
    },

    create: async (address: any) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/customer-profile/addresses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(address),
      });

      if (!response.ok) throw new Error('Failed to create address');
      return response.json();
    },

    update: async (id: string, updates: any) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/customer-profile/addresses/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update address');
      return response.json();
    },

    delete: async (id: string) => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/customer-profile/addresses/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) throw new Error('Failed to delete address');
      return response.json();
    },
  },
};

export const retailerAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/retailer-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to login');
    }
    return response.json();
  },

  products: {
    getAll: async (token: string) => {
      const response = await fetch(`${API_BASE_URL}/retailer-management/products`, {
        headers: getRetailerHeaders(token),
      });

      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },

    create: async (token: string, product: any) => {
      const response = await fetch(`${API_BASE_URL}/retailer-management/products`, {
        method: 'POST',
        headers: getRetailerHeaders(token),
        body: JSON.stringify(product),
      });

      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
    },

    update: async (token: string, id: string, updates: any) => {
      const response = await fetch(`${API_BASE_URL}/retailer-management/products/${id}`, {
        method: 'PUT',
        headers: getRetailerHeaders(token),
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },

    delete: async (token: string, id: string) => {
      const response = await fetch(`${API_BASE_URL}/retailer-management/products/${id}`, {
        method: 'DELETE',
        headers: getRetailerHeaders(token),
      });

      if (!response.ok) throw new Error('Failed to delete product');
      return response.json();
    },
  },

  orders: {
    getAll: async (token: string, status?: string) => {
      const url = status
        ? `${API_BASE_URL}/retailer-management/orders?status=${status}`
        : `${API_BASE_URL}/retailer-management/orders`;

      const response = await fetch(url, {
        headers: getRetailerHeaders(token),
      });

      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },

    getById: async (token: string, id: string) => {
      const response = await fetch(`${API_BASE_URL}/retailer-management/orders/${id}`, {
        headers: getRetailerHeaders(token),
      });

      if (!response.ok) throw new Error('Failed to fetch order');
      return response.json();
    },

    update: async (token: string, id: string, updates: any) => {
      const response = await fetch(`${API_BASE_URL}/retailer-management/orders/${id}`, {
        method: 'PUT',
        headers: getRetailerHeaders(token),
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update order');
      return response.json();
    },
  },

  stats: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/retailer-management/stats`, {
      headers: getRetailerHeaders(token),
    });

    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },
};

export const uploadAPI = {
  uploadImage: async (file: File) => {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': headers.Authorization as string,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload image');
    }
    return response.json();
  },

  uploadRetailerImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'X-Retailer-Upload': 'true',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload image');
    }
    return response.json();
  },
};
