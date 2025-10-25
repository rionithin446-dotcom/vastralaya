# Vastralaya E-Commerce Platform

A comprehensive e-commerce platform for traditional Indian cultural dresses, featuring separate retailer and customer portals.

## Overview

Vastralaya is a full-stack e-commerce solution built with React, TypeScript, Tailwind CSS, and Supabase, specializing in traditional Indian clothing like sarees, kurtis, Mysore silk, crepe silk, and more.

## Features

### Customer Portal

- **Authentication**
  - Email/password registration and login
  - Session persistence
  - Secure password management

- **Product Browsing**
  - Amazon-like interface
  - Category filtering (Saree, Kurti, Mysore Silk, Crepe Silk, etc.)
  - Real-time search functionality
  - Product details with size and color options

- **Shopping Cart**
  - Add/remove items
  - Adjust quantities
  - View cart summary with totals

- **Order Management**
  - PhonePe QR code payment integration
  - Payment screenshot upload
  - Order tracking with status updates
  - Order history view

- **Address Management**
  - Add multiple delivery addresses
  - Edit and delete addresses
  - Set default address
  - Secure per-user address storage

### Retailer Portal

- **Authentication**
  - Fixed credentials login (email: rionithin446@gmail.com)
  - Session persistence
  - Password change capability

- **Product Management**
  - Real-time product upload
  - Multiple dress categories support
  - Image URL upload
  - Size and color variants
  - Stock quantity tracking
  - Material specifications

- **Order Management**
  - View all customer orders
  - Update order status (Placed → Confirmed → Shipped → Delivered)
  - Add tracking numbers
  - View customer and delivery details
  - Process payment confirmations

## Technology Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- Vite (build tool)

### Backend & Database
- Supabase (PostgreSQL)
- Row Level Security (RLS) policies
- Real-time data synchronization

### Authentication
- Supabase Auth for customers
- Custom authentication for retailers

### Payment Integration
- PhonePe QR code payment system
- Payment screenshot verification

## Database Schema

### Tables

1. **retailer_auth** - Retailer authentication
2. **customers** - Customer profiles
3. **customer_addresses** - Delivery addresses
4. **products** - Product catalog
5. **orders** - Order records
6. **order_items** - Individual order items
7. **cart_items** - Shopping cart items

### Security

All tables are protected with Row Level Security (RLS) policies:
- Customers can only access their own data
- Retailers have read-only access to orders
- Products are publicly viewable when active
- Addresses are private to each user

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Retailer Credentials

- **Email:** rionithin446@gmail.com
- **Password:** Rio_vr_446

## Usage

### For Customers

1. Select "Customer Portal" from the home screen
2. Sign up or sign in with your credentials
3. Browse products by category or search
4. Add items to cart with preferred size and color
5. Manage delivery addresses
6. Proceed to checkout
7. Complete payment via PhonePe QR code
8. Upload payment screenshot
9. Track your orders

### For Retailers

1. Select "Retailer Portal" from the home screen
2. Sign in with retailer credentials
3. Upload new products with details, images, and variants
4. Manage incoming orders
5. Update order status and add tracking numbers
6. View customer details and delivery addresses

## Key Features

### Real-time Updates
- Product uploads appear instantly in customer portal
- Order status changes reflect immediately
- Cart updates in real-time

### Security
- Encrypted password storage
- Secure authentication flows
- RLS policies prevent unauthorized data access
- User-specific data isolation

### User Experience
- Responsive design for all devices
- Traditional Indian aesthetic with amber/orange color scheme
- Smooth animations and transitions
- Intuitive navigation

### Payment Processing
- QR code-based PhonePe integration
- Payment screenshot verification
- Order confirmation system

## Project Structure

```
src/
├── components/
│   ├── customer/
│   │   ├── CustomerAuth.tsx
│   │   ├── CustomerDashboard.tsx
│   │   ├── ProductBrowse.tsx
│   │   ├── Cart.tsx
│   │   ├── Checkout.tsx
│   │   ├── MyOrders.tsx
│   │   └── MyAddresses.tsx
│   └── retailer/
│       ├── RetailerLogin.tsx
│       ├── RetailerDashboard.tsx
│       ├── ProductUpload.tsx
│       └── OrderManagement.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   └── supabase.ts
├── App.tsx
└── main.tsx
```

## Future Enhancements

- Social login integration (Google/Facebook)
- Phone number authentication
- Multiple product images
- Product reviews and ratings
- Wishlist functionality
- Advanced analytics for retailers
- Email notifications
- SMS notifications for order updates
- Return and refund management
- Discount codes and promotions

## License

All rights reserved.

## Support

For support or queries, contact: rionithin446@gmail.com
