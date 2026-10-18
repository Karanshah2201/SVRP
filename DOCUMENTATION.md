# Shri Viswakarma Rail Production — Project Documentation

> **Last Updated:** February 17, 2026  
> **Tech Stack:** React (Vite) + Node.js (Express) + MongoDB  
> **Status:** Development

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Folder Structure](#3-folder-structure)
4. [Setup & Installation](#4-setup--installation)
5. [Environment Variables](#5-environment-variables)
6. [Database Schemas](#6-database-schemas)
7. [API Endpoints](#7-api-endpoints)
8. [Authentication System](#8-authentication-system)
9. [Frontend Pages & Components](#9-frontend-pages--components)
10. [Admin Panel](#10-admin-panel)
11. [File Upload System](#11-file-upload-system)
12. [Category & Subcategory System](#12-category--subcategory-system)
13. [3D Model Viewer](#13-3d-model-viewer)
14. [Routing Architecture](#14-routing-architecture)
15. [Key Features Summary](#15-key-features-summary)

---

## 1. Project Overview

Shri Viswakarma Rail Production is a product catalog and management platform for railway infrastructure and equipment. It features:

- A **public-facing landing page** with a 3D model viewer
- **User authentication** (login, register, forgot/update password)
- **Product browsing** with category and subcategory filtering
- A **contact form** for customer inquiries
- A full **admin panel** for managing products, categories, subcategories, and contact submissions
- **File upload** support for images, videos, audio, and 3D model files

---

## 2. Tech Stack & Dependencies

### Backend
| Package | Purpose |
|---------|---------|
| `express` | Web server framework |
| `mongoose` | MongoDB ODM |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT authentication |
| `cors` | Cross-Origin Resource Sharing |
| `dotenv` | Environment variable management |
| `express-session` | Session management |
| `cookie-parser` | Cookie handling |
| `connect-mongo` | MongoDB session store |
| `multer` | File upload handling |

### Frontend
| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI library |
| `vite` | Build tool & dev server |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client (via `@/lib/api`) |
| `framer-motion` | Animations & transitions |
| `lucide-react` | Icon library |
| `sonner` | Toast notifications |
| `three` | 3D rendering engine |
| `@react-three/fiber` | React Three.js renderer |
| `@react-three/drei` | Three.js helpers |

---

## 3. Folder Structure

```
Rail works/
├── Backend/
│   ├── .env                    # Environment variables
│   ├── server.js               # Main server file (all routes, models, middleware)
│   ├── uploads/                # Uploaded files directory (auto-created)
│   ├── package.json
│   └── nodemon.json
│
├── Frontend/
│   ├── public/
│   │   └── 1769954393_ICFMeasurement.fbx   # 3D model file
│   ├── src/
│   │   ├── App.jsx             # Main app with all route definitions
│   │   ├── App.css             # Global styles
│   │   ├── lib/
│   │   │   └── api.js          # Axios instance (base URL: http://localhost:5000/api)
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Navigation bar with dynamic category dropdown
│   │   │   ├── ModelViewer.jsx # Three.js FBX model viewer
│   │   │   ├── AdminRoute.jsx  # Admin route guard
│   │   │   ├── ProtectedRoute.jsx  # User route guard
│   │   │   ├── PublicRoute.jsx     # Guest-only route guard
│   │   │   ├── PaymentModal.jsx    # Payment modal component
│   │   │   └── ui/             # Reusable UI components
│   │   └── pages/
│   │       ├── Landing.jsx         # Landing page with 3D model
│   │       ├── Login.jsx           # User login
│   │       ├── Register.jsx        # User registration
│   │       ├── ForgotPassword.jsx  # Password recovery
│   │       ├── UpdatePassword.jsx  # Password update
│   │       ├── AuthLayout.jsx      # Auth pages layout wrapper
│   │       ├── About.jsx           # About page
│   │       ├── Contact.jsx         # Contact form page
│   │       ├── Products.jsx        # Products listing (filterable)
│   │       ├── ProductDetails.jsx  # Individual product details
│   │       ├── Profile.jsx         # User profile management
│   │       └── admin/
│   │           ├── AdminLogin.jsx      # Admin login page
│   │           ├── AdminLayout.jsx     # Admin sidebar layout
│   │           ├── AdminDashboard.jsx  # Admin stats dashboard
│   │           ├── AdminProducts.jsx   # Product CRUD management
│   │           ├── AdminCategories.jsx # Category & subcategory management
│   │           └── AdminContacts.jsx   # Contact submissions viewer
│   ├── package.json
│   └── vite.config.js
│
└── DOCUMENTATION.md            # This file
```

---

## 4. Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)

### Backend Setup
```bash
cd "Rail works/Backend"
npm install
# Configure .env file (see section 5)
node server.js
# Server runs on http://localhost:5000
```

### Frontend Setup
```bash
cd "Rail works/Frontend"
npm install
npm run dev
# App runs on http://localhost:5173
```

### Default Admin Account
On first startup, the backend automatically seeds a default admin user:
- **Email:** `admin@railworks.com`
- **Password:** `admin123`

---

## 5. Environment Variables

### Backend (`.env`)
```env
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=<your-jwt-secret>
PORT=5000
```

### Frontend
The API base URL is configured in `src/lib/api.js`:
```javascript
const api = axios.create({
    baseURL: 'http://localhost:5000/api'
})
```

---

## 6. Database Schemas

### User
```javascript
{
    fullname: String,           // Default: ''
    email: String,              // Required, unique, lowercase
    password: String,           // Required, bcrypt hashed
    role: String,               // 'user' | 'admin', default: 'user'
    createdAt: Date             // Default: Date.now
}
```

### Profile
```javascript
{
    user: ObjectId,             // Ref: 'User', required, unique
    fullname: String,           // Required
    phoneNumber: String,        // Default: ''
    avatar: String              // Default: ''
}
```

### Product
```javascript
{
    id: Number,                 // Required, unique (auto-incremented)
    name: String,
    category: String,           // Links to Category.name
    subcategory: String,        // Links to Category.subcategories[].name
    price: String,              // e.g. "₹10,000"
    rating: Number,             // 0-5
    image: String,              // URL or uploaded file path
    description: String,
    features: [String],         // Array of feature strings
    mediaType: String,          // 'image' | 'video' | '3d' | 'audio'
    mediaUrl: String            // URL to media file
}
```

### Category
```javascript
{
    name: String,               // Required, unique
    description: String,        // Default: ''
    image: String,              // Default: '' (uploaded image URL)
    subcategories: [{
        name: String,           // Required
        description: String     // Default: ''
    }],
    createdAt: Date             // Default: Date.now
}
```

### Contact
```javascript
{
    name: String,
    email: String,
    subject: String,
    message: String,
    createdAt: Date             // Default: Date.now
}
```

---

## 7. API Endpoints

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API health check |
| `GET` | `/api/categories` | Get all categories (with subcategories) |
| `GET` | `/api/products` | Get products (optional: `?category=X&subcategory=Y`) |
| `GET` | `/api/products/:id` | Get single product by ID |
| `POST` | `/api/contact` | Submit contact form |

### Auth Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/register` | Register new user (body: `fullname`, `email`, `password`) |
| `POST` | `/api/login` | User login (body: `email`, `password`) → returns `token` |
| `POST` | `/api/logout` | Logout (destroys session) |
| `POST` | `/api/forgot-password` | Request password reset |
| `POST` | `/api/update-password` | Update password (requires auth) |

### Protected Routes (Require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/profile` | Get current user profile |
| `PUT` | `/api/profile` | Update profile (fullname, phoneNumber, avatar) |
| `POST` | `/api/upload` | Upload a file (multipart/form-data, field: `file`) |

### Admin Routes (Require admin token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Admin login → returns `token` |
| `GET` | `/api/admin/stats` | Dashboard stats (products, categories, contacts, users counts) |

#### Admin — Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/categories` | List all categories |
| `POST` | `/api/admin/categories` | Create category (body: `name`, `description`, `image`) |
| `DELETE` | `/api/admin/categories/:id` | Delete category |

#### Admin — Subcategories
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/categories/:id/subcategories` | Add subcategory (body: `name`, `description`) |
| `DELETE` | `/api/admin/categories/:id/subcategories/:subId` | Delete subcategory |

#### Admin — Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/products` | List all products |
| `POST` | `/api/admin/products` | Create product |
| `PUT` | `/api/admin/products/:id` | Update product |
| `DELETE` | `/api/admin/products/:id` | Delete product |

#### Admin — Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/contacts` | List all contact messages |
| `DELETE` | `/api/admin/contacts/:id` | Delete a contact message |

#### Admin — Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/reviews` | List all reviews |
| `DELETE` | `/api/admin/reviews/:id` | Delete a review |

#### User — Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products/:id/reviews` | Get reviews for a product |
| `POST` | `/api/products/:id/reviews` | Submit a review (auth required) |

---

## 8. Authentication System

### How It Works

1. **User Registration** → Password is hashed with `bcrypt` (salt rounds: 10) → User + Profile documents created → JWT token returned
2. **User Login** → Email/password verified → JWT token generated (1 hour expiry) → Token stored in both cookie and returned in response
3. **Admin Login** → Separate endpoint `/api/admin/login` → Checks `role === 'admin'` → Returns admin-specific JWT token

### Token Storage (Frontend)
| Key | Storage | Purpose |
|-----|---------|---------|
| `token` | `localStorage` | User authentication |
| `user` | `localStorage` | User data (JSON) |
| `adminToken` | `localStorage` | Admin authentication |

### Route Guards (Frontend)
| Component | Purpose | Redirect |
|-----------|---------|----------|
| `ProtectedRoute` | Requires `token` in localStorage | → `/login` |
| `PublicRoute` | Only for guests (no token) | → `/products` |
| `AdminRoute` | Requires `adminToken` in localStorage | → `/admin/login` |

### Middleware (Backend)
| Middleware | Purpose |
|-----------|---------|
| `authenticateToken` | Verifies JWT from `Authorization` header or cookie |
| `isAdmin` | Checks if authenticated user has `role: 'admin'` |

---

## 9. Frontend Pages & Components

### Public Pages (No Auth Required)

| Page | Route | File | Description |
|------|-------|------|-------------|
| Landing | `/` | `Landing.jsx` | Hero section with animated text, 3D model viewer with error boundary, feature highlights |
| About | `/about` | `About.jsx` | Company information |
| Contact | `/contact` | `Contact.jsx` | Contact form (name, email, subject, message) |

### Auth Pages (Guest Only)

| Page | Route | File | Description |
|------|-------|------|-------------|
| Login | `/login` | `Login.jsx` | Email & password login |
| Register | `/register` | `Register.jsx` | User registration form |
| Forgot Password | `/forgot-password` | `ForgotPassword.jsx` | Password recovery |
| Update Password | `/update-password` | `UpdatePassword.jsx` | Password change |

### Protected Pages (Auth Required)

| Page | Route | File | Description |
|------|-------|------|-------------|
| Products | `/products` | `Products.jsx` | Product grid with category/subcategory filtering via query params |
| Product Details | `/product/:id` | `ProductDetails.jsx` | Detailed product view with media display |
| Profile | `/profile` | `Profile.jsx` | User profile editing |

### Key Components

| Component | File | Description |
|-----------|------|-------------|
| Navbar | `Navbar.jsx` | Fixed top nav with logo, nav links, **dynamic category dropdown** (fetched from DB with nested subcategories), user menu |
| ModelViewer | `ModelViewer.jsx` | Three.js FBX model renderer with OrbitControls |
| PaymentModal | `PaymentModal.jsx` | Payment/checkout modal |

---

## 10. Admin Panel

### Access
- **URL:** `http://localhost:5173/admin/login`
- **Credentials:** `admin@railworks.com` / `admin123`

### Admin Pages

#### Dashboard (`/admin/dashboard`)
- Displays 4 stat cards: **Products**, **Categories**, **Contacts**, **Users**
- Fetches data from `/api/admin/stats`
- Animated card layout with icons

#### Categories (`/admin/categories`)
- **Accordion-style category list** — each card expands to show subcategories
- **Add Category** → modal with name, description, image upload
- **Add Subcategory** → modal with name and description fields
- **Delete** category or individual subcategories
- Badge shows subcategory count (e.g., `3 sub`)
- Category image upload from local storage

#### Products (`/admin/products`)
- **Table view** with columns: Product (image + name), Category (with subcategory), Price, Media type, Rating, Actions
- **Add/Edit Product** → modal form with:
  - Name, Category dropdown (fetched from DB), Subcategory dropdown (dynamic, based on selected category)
  - Price, Rating
  - **Image upload** from local storage (with preview)
  - Description, Features (comma-separated)
  - Media type selector (Image / Video / Audio / 3D)
  - **Media file upload** from local storage
- **Delete product** with confirmation

#### Contacts (`/admin/contacts`)
- Split-view layout: message list on left, detail view on right
- Shows contact name, email, subject, message, date
- Delete messages

#### Reviews (`/admin/reviews`)
- **Stats Dashboard** at the top: Total reviews, average rating, rating distribution
- **Searchable table** of all user reviews
- Shows user info, product name, rating, comment, time
- **Delete** inappropriate reviews

### Admin Layout (`AdminLayout.jsx`)
- Dark sidebar with navigation links:
  - Dashboard, Products, Categories, Contacts
- User info display at bottom
- Logout functionality (clears `adminToken`)
- Main content area with `<Outlet />`

---

## 11. File Upload System

### How It Works
1. Frontend selects a file via `<input type="file">`
2. File is sent as `multipart/form-data` to `POST /api/upload`
3. Backend (multer) saves the file to `Backend/uploads/` with a unique filename
4. API returns the file URL: `/uploads/<filename>`
5. Frontend constructs full URL: `http://localhost:5000/uploads/<filename>`
6. URL is stored in the product/category document

### Configuration
| Setting | Value |
|---------|-------|
| Max file size | 50 MB |
| Storage location | `Backend/uploads/` |
| Allowed formats | JPEG, JPG, PNG, GIF, WebP, MP4, MP3, WAV, FBX, GLB, GLTF, OBJ, Blend, SVG |
| Static serving | `http://localhost:5000/uploads/<filename>` |
| Naming convention | `{timestamp}-{random}.{ext}` |

### Where Files Are Uploaded
| Feature | Field | Usage |
|---------|-------|-------|
| Product image | `image` | Displayed in product cards and detail page |
| Product media | `mediaUrl` | Video, audio, or 3D file for product |
| Category image | `image` | Displayed in category cards |

---

## 12. Category & Subcategory System

### Structure
```
Category (e.g., "Locomotives")
├── Subcategory (e.g., "Diesel")
├── Subcategory (e.g., "Electric")
└── Subcategory (e.g., "Steam")
```

### How It Flows

1. **Admin creates a category** → stored in `categories` collection
2. **Admin adds subcategories** → stored as embedded array in the category document
3. **Admin creates a product** → selects category from dropdown → if the selected category has subcategories, a second dropdown appears to select a subcategory
4. **Navbar** → fetches all categories with subcategories from `/api/categories` → builds multi-level dropdown:
   - **Level 1:** Category names (bold, clickable → filters by category)
   - **Level 2:** Subcategory names (indented with left border, clickable → filters by category + subcategory)
   - **"All Products"** link at the bottom
5. **Products page** → reads `?category=X&subcategory=Y` from URL → passes to API → displays filtered results

### URL Examples
| URL | Shows |
|-----|-------|
| `/products` | All products |
| `/products?category=Locomotives` | All Locomotive products |
| `/products?category=Locomotives&subcategory=Diesel` | Only Diesel Locomotive products |

---

## 13. 3D Model Viewer

### Implementation
- Uses **Three.js** via `@react-three/fiber` and `@react-three/drei`
- Loads FBX models using `FBXLoader`
- Wrapped in **ModelErrorBoundary** on the Landing page to prevent crashes

### Features
- OrbitControls for rotation/zoom
- Ambient + directional lighting
- Auto-scaling to fit the canvas
- Graceful error fallback UI if model fails to load

### Model File
- Located at: `Frontend/public/1769954393_ICFMeasurement.fbx`
- Served at: `/1769954393_ICFMeasurement.fbx`

---

## 14. Routing Architecture

```
/                           → Landing Page (public)
/about                      → About Page (public)
/contact                    → Contact Page (public)
│
├── /login                  → Login (guest only)
├── /register               → Register (guest only)
├── /forgot-password        → Forgot Password (guest only)
├── /update-password        → Update Password (guest only)
│
├── /products               → Products Listing (auth required)
├── /product/:id            → Product Details (auth required)
├── /profile                → User Profile (auth required)
│
├── /admin/login            → Admin Login (public)
├── /admin/dashboard        → Admin Dashboard (admin auth)
├── /admin/products         → Admin Products (admin auth)
├── /admin/categories       → Admin Categories (admin auth)
└── /admin/contacts         → Admin Contacts (admin auth)
```

### Route Protection Flow
```
User visits page
    │
    ├── Public page → Show page
    │
    ├── PublicRoute (auth pages) → Has token? 
    │       ├── Yes → Redirect to /products
    │       └── No → Show auth page
    │
    ├── ProtectedRoute → Has token?
    │       ├── Yes → Show page
    │       └── No → Redirect to /login
    │
    └── AdminRoute → Has adminToken?
            ├── Yes → Show admin page
            └── No → Redirect to /admin/login
```

---

## 15. Key Features Summary

| Feature | Status | Notes |
|---------|--------|-------|
| User Registration & Login | ✅ Complete | JWT-based with session support |
| Password Recovery | ✅ Complete | Forgot + Update password flow |
| User Profile | ✅ Complete | Edit fullname, phone, avatar |
| Landing Page | ✅ Complete | Animated hero + 3D model viewer |
| Product Browsing | ✅ Complete | Grid layout with category/subcategory filtering |
| Product Details | ✅ Complete | Full product view with media support |
| Contact Form | ✅ Complete | Stored to MongoDB |
| Dynamic Navbar | ✅ Complete | Categories + subcategories from DB |
| Admin Authentication | ✅ Complete | Separate login + route guard |
| Admin Dashboard | ✅ Complete | Stats overview |
| Admin Products CRUD | ✅ Complete | Create, read, update, delete with file uploads |
| Admin Categories CRUD | ✅ Complete | With image upload |
| Admin Subcategories | ✅ Complete | Add/delete under parent categories |
| Admin Contacts | ✅ Complete | View + delete contact messages |
| Admin Reviews | ✅ Complete | View stats + delete user reviews |
| File Upload | ✅ Complete | Images, videos, audio, 3D files (50MB max) |
| 3D Model Viewer | ✅ Complete | FBX loading with error boundary |
| CORS Configuration | ✅ Complete | Configured for localhost:5173 |
| Auto Admin Seeding | ✅ Complete | admin@svrp.com / admin123 |
| Product Data Seeding | ✅ Complete | Initial products seeded on first run |
| User Reviews | ✅ Complete | Users can rate and review products |

---

## CORS Configuration

The backend allows requests from:
- `http://localhost:5173`
- `http://127.0.0.1:5173`

With methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`  
Headers: `Content-Type`, `Authorization`  
Credentials: `true`

---

## Running the Project

### Quick Start
```bash
# Terminal 1 — Backend
cd "Rail works/Backend"
node server.js
# → http://localhost:5000

# Terminal 2 — Frontend 
cd "Rail works/Frontend"
npm run dev
# → http://localhost:5173
```

### Testing Admin Panel
1. Visit `http://localhost:5173/admin/login`
2. Login: `admin@railworks.com` / `admin123`
3. Dashboard → see stats
4. Categories → add category → expand → add subcategories
5. Products → add product → select category → select subcategory → upload image → create
6. Visit `http://localhost:5173/products` as a user to see products
7. Navbar "Categories" dropdown shows categories with nested subcategories

---

*End of Documentation*
