# 📱 Vi-Santé Mobile Frontend Roadmap

**Project:** Vi-Santé React Native Mobile App  
**Current Status:** Home screen (Accueil) redesigned ✅  
**Next Phase:** Complete mobile app implementation

---

## 🎯 Project Overview

### **Backend (Existing)**
- **Stack:** Laravel 9, PHP 8, Sanctum Auth, MySQL
- **API Base:** `https://api.vi-santé.com/api` (or `https://api.xn--vi-sant-hya.com/api`)
- **Auth:** Bearer token (Sanctum)
- **Security:** Strict CORS with Origin whitelist

### **Frontend Mobile (In Progress)**
- **Stack:** React Native (Expo), TypeScript, React Navigation v6
- **State:** Zustand/Redux + React Query
- **Auth:** expo-secure-store for tokens
- **Maps:** react-native-maps
- **Current:** Accueil screen redesigned with dashboard components

---

## 🚨 Critical Backend Issue to Address

### **CORS/Origin Problem for Mobile**

**Issue:** Backend `CheckOrigin` middleware blocks requests without `Origin` header. React Native doesn't send `Origin/Referer` headers.

**Current Behavior:**
```php
// App\Http\Middleware\CheckOrigin
// Blocks if no Origin/Referer in production
if (!$origin && !$referer) {
    return response()->json(['error' => 'Forbidden'], 403);
}
```

**Solutions (Choose One):**

#### **Option 1: Allow Mobile with Custom Header (Recommended)**
```php
// Backend: CheckOrigin middleware
$isMobile = $request->header('X-Client-Type') === 'mobile';
$hasValidToken = $request->bearerToken() && auth('sanctum')->check();

if ($isMobile && $hasValidToken) {
    return $next($request); // Allow authenticated mobile
}
```

```typescript
// Frontend: Axios interceptor
axios.interceptors.request.use(config => {
  config.headers['X-Client-Type'] = 'mobile';
  return config;
});
```

#### **Option 2: Whitelist by User-Agent**
```php
$userAgent = $request->header('User-Agent');
$isMobileApp = str_contains($userAgent, 'ViSanteMobile');
```

#### **Option 3: Separate Mobile API Route**
```php
// routes/api.php
Route::prefix('mobile')->group(function() {
    // Mobile-specific routes without CheckOrigin
});
```

**Action Required:** Coordinate with backend team to implement Option 1.

---

## 📋 Implementation Phases

### **Phase 1: Core Infrastructure** ✅ (Partially Complete)

#### **Completed:**
- ✅ Project setup (Expo + TypeScript)
- ✅ Navigation structure (tabs)
- ✅ Home screen redesign (Accueil)
- ✅ Dashboard components (PersonalizedHeader, NextAppointmentCard, QuickActionsGrid, UserStatsRow)

#### **Remaining:**
- [ ] API client setup with Axios
- [ ] Secure token storage (expo-secure-store)
- [ ] React Query configuration
- [ ] State management (Zustand)
- [ ] Environment configuration (.env)

---

### **Phase 2: Authentication & User Management**

#### **2.1 Auth Screens**
- [ ] **Login Screen** (`/patient-auth`)
  - Email/password form
  - POST `/login` → store token + user
  - Navigate based on role
  
- [ ] **Register Screen** (`/register`)
  - Patient registration
  - POST `/register`
  - Email verification flow

- [ ] **Professional Auth** (`/professional-auth`)
  - Separate flow for doctors/organizations
  - POST `/organizations/register`

#### **2.2 Auth Flow**
```typescript
// lib/auth.ts
- login(email, password) → POST /login
- logout() → DELETE token from SecureStore
- getUser() → GET /user (with token)
- refreshToken() → Handle 401 responses
```

#### **2.3 Protected Routes**
```typescript
// navigation/ProtectedRoute.tsx
- Check token on app boot
- Fetch GET /user to determine role
- Navigate to appropriate tab stack
```

---

### **Phase 3: Patient Features**

#### **3.1 Search & Browse** (Partially Complete)
- [x] Search UI (already in accueil.tsx)
- [ ] Connect to API endpoints:
  - GET `/users` (professionals)
  - GET `/medecins` (doctors)
  - GET `/organizations`
  - GET `/clinics`
  - GET `/pharmacies`
- [ ] Search results screen
- [ ] Filters (specialty, city, availability)

#### **3.2 Professional Profiles**
- [ ] **Doctor Profile Screen** (`/medecins/:id`)
  - GET `/medecins/{id}`
  - Show: photo, specialty, diplomas, experiences, services
  - Normalize media paths (`/storage/...`)
  - Available hours display
  - "Book Appointment" CTA

- [ ] **Organization Profile Screen** (`/organizations/:id`)
  - GET `/organizations/{id}`
  - Show: type, services, location, hours
  - Map preview (react-native-maps)
  - Image gallery carousel

- [ ] **Pharmacy/Parapharmacy** (`/pharmacies/:id`)
  - GET `/pharmacies/{id}` or `/parapharmacies/{id}`
  - Guard duty indicator
  - City search

#### **3.3 Appointment Booking**
- [ ] **Booking Flow**
  - Available slots: GET `/doctors/{id}/available-hours`
  - Check booked: GET `/appointments/booked-slots/{doctorId}`
  - Book doctor: POST `/rendezvous`
  - Book organization: POST `/appointments`
  - Confirmation screen with QR code

- [ ] **My Appointments** (`/patient/mes-rdv`)
  - List: GET `/appointments`
  - Details: GET `/appointments/{id}`
  - Reschedule: PUT `/appointments/{id}`
  - Cancel: POST `/appointments/{id}/cancel`
  - Status badges (confirmed, pending, cancelled)

#### **3.4 Health Dossier** (New Feature)
- [ ] **Santé Overview** (`/patient/sante`)
  - GET `/patient/sante`
  - Sections: vaccines, allergies, chronic conditions, documents

- [ ] **Vaccines Management**
  - List vaccines
  - Add: POST `/patient/sante/vaccins`
  - Delete: DELETE `/patient/sante/vaccins/{id}`
  - Toggle "none": POST `/patient/sante/vaccins/toggle-none`

- [ ] **Documents Upload**
  - Upload: POST `/patient/sante/documents/upload` (multipart)
  - List documents
  - Delete: DELETE `/patient/sante/documents/{id}`
  - Use expo-document-picker

#### **3.5 Patient Profile**
- [ ] **Profile Screen** (`/profile`)
  - View: GET `/user/profile`
  - Edit: PUT `/user/profile` or POST `/user/profile/update`
  - Avatar upload: POST `/user/profile/update-avatar`
  - Personal info, contact, address

#### **3.6 Announcements Feed**
- [ ] **Annonces List** (`/annonces`)
  - GET `/annonces` (public)
  - Card layout with discount badges
  - Filter by specialty/location
  - Details: GET `/annonces/{id}`

---

### **Phase 4: Professional/Organization Features**

#### **4.1 Dashboard**
- [ ] **Doctor Dashboard** (`/doctor/dashboard`)
  - GET `/doctor/stats`
  - Today's appointments count
  - Pending appointments
  - Revenue stats (if available)
  - Quick actions

- [ ] **Organization Dashboard**
  - Similar to doctor but org-specific

#### **4.2 Profile Management**
- [ ] **Professional Profile Edit** (`/doctor/profile`)
  - View: GET `/professional/profile`
  - Update: POST/PUT `/professional/profile/update`
  - Image upload: POST `/professional/profile/update-image`
  - Gallery management (multiple images)
  - CV fields (diplomas, experiences, services)

- [ ] **Organization Profile Edit** (`/organization/profile`)
  - Similar structure
  - Organization-specific fields

- [ ] **Pharmacy Profile** (`/pharmacy/profile`)
  - GET/PUT `/pharmacy/profile/update`
  - Guard duty toggle

#### **4.3 Availability Management**
- [ ] **Availability Toggle**
  - POST `/professional/profile/toggle-availability`
  - Switch component

- [ ] **Absence/Vacation**
  - POST `/professional/profile/set-absence`
  - POST `/professional/profile/toggle-vacation-mode`
  - Date range picker

#### **4.4 Appointments Management**
- [ ] **Appointments List** (`/doctor/appointments`)
  - GET `/doctor/appointments`
  - Filter by status, date
  - Pull-to-refresh

- [ ] **Appointment Details** (`/doctor/appointments/:id`)
  - GET `/doctor/appointments/{id}`
  - Patient info
  - Update status: PUT `/doctor/appointments/{id}/status`
  - Actions: confirm, cancel, complete

#### **4.5 Announcements (Doctors Only)**
- [ ] **Annonces Management** (`/doctor/annonces`)
  - List: GET `/doctor/annonces`
  - Create: POST `/doctor/annonces`
  - Edit: POST `/doctor/annonces/{id}`
  - Toggle status: PUT `/doctor/annonces/{id}/toggle-status`
  - Delete: DELETE `/doctor/annonces/{id}`
  - Bulk activate: POST `/doctor/annonces/activate-all`

---

### **Phase 5: Shared Features**

#### **5.1 Notifications**
- [ ] **Notification Center**
  - List: GET `/notifications`
  - Badge count on bell icon
  - Mark read: PUT `/notifications/{id}/read`
  - Mark all read: PUT `/notifications/read-all`

- [ ] **Push Notifications** (Optional)
  - Expo push notifications
  - Register device token
  - Handle notification taps

#### **5.2 Media Handling**
- [ ] **Secure Media Viewer**
  - Stream: GET `/media/professional/carte`
  - Authorization required
  - PDF viewer for documents

- [ ] **Image Gallery**
  - Carousel component
  - Pinch-to-zoom
  - Full-screen modal

#### **5.3 Maps Integration**
- [ ] **Location Display**
  - react-native-maps
  - Show clinic/pharmacy location
  - Directions button (open in Maps app)

---

### **Phase 6: Admin Features** (Optional)

- [ ] **Users Management**
  - List: GET `/admin/users`
  - Create: POST `/admin/users`
  - Edit: PUT `/admin/users/{id}`
  - Delete: DELETE `/admin/users/{id}`

- [ ] **Roles Management**
  - GET `/roles`

---

### **Phase 7: Stripe Integration** (Future)

- [ ] **Subscription Flow**
  - POST `/stripe/create-checkout-session`
  - Verify: POST `/stripe/verify-session`
  - Cancel: POST `/stripe/cancel-subscription`
  - Customer portal: POST `/stripe/customer-portal`
  - Details: GET `/stripe/subscription-details/{userId}`

---

## 🛠️ Technical Implementation Details

### **API Client Setup**

```typescript
// lib/apiClient.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@env';

const apiClient = axios.create({
  baseURL: API_BASE_URL || 'https://api.vi-santé.com/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Type': 'mobile', // For CORS bypass
  },
});

// Request interceptor: Add token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token && !isPublicRoute(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // Navigate to login
    }
    return Promise.reject(error);
  }
);

// Public routes (no auth required)
const publicRoutes = [
  '/login',
  '/register',
  '/users',
  '/medecins',
  '/profiles',
  '/annonces',
  '/site-stats',
  '/organizations',
  '/pharmacies',
  '/parapharmacies',
  '/clinics',
];

function isPublicRoute(url?: string): boolean {
  return publicRoutes.some(route => url?.includes(route));
}
```

### **React Query Setup**

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

### **State Management (Zustand)**

```typescript
// store/authStore.ts
import create from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: number;
  email: string;
  role_id: number;
  role?: { name: string };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  
  login: async (email, password) => {
    const response = await apiClient.post('/login', { email, password });
    const { token, user } = response.data;
    await SecureStore.setItemAsync('auth_token', token);
    set({ token, user, isLoading: false });
  },
  
  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ token: null, user: null });
  },
  
  loadUser: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      try {
        const response = await apiClient.get('/user');
        set({ user: response.data, token, isLoading: false });
      } catch {
        await SecureStore.deleteItemAsync('auth_token');
        set({ token: null, user: null, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
```

### **Data Normalization Helpers**

```typescript
// utils/normalize.ts

// Normalize media paths
export function normalizeMediaPath(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/storage/')) return `https://api.vi-santé.com${path}`;
  return `https://api.vi-santé.com/storage/${path}`;
}

// Parse JSON or CSV arrays
export function parseArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return value.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

// Normalize professional profile
export function normalizeProfessionalProfile(profile: any) {
  return {
    ...profile,
    photo: normalizeMediaPath(profile.photo),
    carte_professionnelle: normalizeMediaPath(profile.carte_professionnelle),
    images: parseArray(profile.images).map(normalizeMediaPath),
    services: parseArray(profile.services),
    moyens_paiement: parseArray(profile.moyens_paiement),
    diplomes: parseArray(profile.diplomes),
    experiences: parseArray(profile.experiences),
    specialty: parseArray(profile.specialty),
  };
}
```

---

## 🎨 UI/UX Guidelines

### **Design System**

**Colors (Healthcare Palette):**
```typescript
export const COLORS = {
  primary: '#2563EB',      // Trust blue
  secondary: '#3B82F6',    // Light blue
  success: '#10B981',      // Health green
  successLight: '#D1FAE5', // Light green bg
  care: '#EC4899',         // Compassion pink
  careLight: '#FCE7F3',    // Light pink bg
  warning: '#F59E0B',      // Alert amber
  warningLight: '#FEF3C7', // Light amber bg
  danger: '#EF4444',       // Error red
  background: '#F8FAFC',   // Clean gray
  white: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
};
```

**Typography:**
```typescript
export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '700' },
  h2: { fontSize: 24, fontWeight: '600' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  small: { fontSize: 14, fontWeight: '400' },
  tiny: { fontSize: 12, fontWeight: '400' },
};
```

**Spacing:**
```typescript
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

### **Component Patterns**

- **Cards:** Rounded corners (12px), shadow, white background
- **Buttons:** Rounded (8px), min height 44px (touch target)
- **Inputs:** Rounded (8px), border, focus state
- **Lists:** Pull-to-refresh, infinite scroll, skeleton loaders
- **Modals:** Bottom sheets for forms, full-screen for details
- **Empty States:** Illustration + message + CTA
- **Loading States:** Skeleton screens, not spinners

---

## 📦 Dependencies to Add

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.0.0",
    "axios": "^1.6.0",
    "expo-secure-store": "~13.0.0",
    "expo-document-picker": "~12.0.0",
    "expo-image-picker": "~15.0.0",
    "react-native-maps": "1.14.0",
    "expo-location": "~17.0.0",
    "react-native-qrcode-svg": "^6.3.0",
    "date-fns": "^3.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.22.0"
  }
}
```

---

## 🚀 Next Immediate Steps

### **Week 1: Core Infrastructure**
1. ✅ Home screen redesign (DONE)
2. [ ] Set up API client with interceptors
3. [ ] Configure expo-secure-store
4. [ ] Set up React Query
5. [ ] Create Zustand auth store
6. [ ] Environment configuration

### **Week 2: Authentication**
1. [ ] Login screen
2. [ ] Register screen
3. [ ] Protected route wrapper
4. [ ] Role-based navigation
5. [ ] Token refresh logic

### **Week 3: Patient Core Features**
1. [ ] Search results screen
2. [ ] Doctor profile screen
3. [ ] Appointment booking flow
4. [ ] My appointments list
5. [ ] Appointment details

### **Week 4: Professional Features**
1. [ ] Doctor dashboard
2. [ ] Profile edit screen
3. [ ] Appointments management
4. [ ] Availability settings

---

## 📝 Notes

- **Backend Coordination Required:** CORS/Origin fix for mobile
- **Testing:** Use Expo Go for development, build standalone for production
- **Performance:** Optimize images, lazy load lists, cache API responses
- **Accessibility:** Screen reader support, touch targets, color contrast
- **Offline:** Consider offline-first with React Query persistence

---

**Status:** 📍 Phase 1 (Home Screen) Complete  
**Next:** Phase 1 (API Infrastructure) → Phase 2 (Authentication)

---

*Last Updated: November 4, 2025*
