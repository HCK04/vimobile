# Developer Access to Doctor Features

## Problem
Doctor dashboard and features require authentication. In development, you need a quick way to test doctor interfaces without going through the full login flow.

## Solution: Mock Doctor Login

### Quick Access (DevTools)
1. **Reload the app** (press `r` in Expo terminal)
2. **Tap the purple bug button** (floating button, bottom-left)
3. **Tap "Mock Doctor Login"** (blue button with person-add icon)
4. **Tap "Go to Dashboard"** in the alert
5. ✅ You're now logged in as "Dr. Test (Dev)" and can access doctor features

### What the Mock Login Does
- Creates a fake doctor user:
  ```javascript
  {
    id: 999,
    name: 'Dr. Test (Dev)',
    email: 'doctor.test@dev.local',
    role_id: 2,
    role: { id: 2, name: 'medecin' }
  }
  ```
- Generates a mock token: `dev-mock-token-{timestamp}`
- Stores auth in memory using `setAuth(token, user)`
- Allows access to all doctor routes

### DevTools Auth Features

#### **Mock Doctor Login** (blue, person-add icon)
- Instantly logs you in as a test doctor
- No backend call required
- Perfect for testing doctor UI/UX

#### **Check Auth Status** (shield icon)
- Shows current login state
- Displays user name, email, and role
- Useful for debugging auth issues

#### **Logout** (orange, log-out icon)
- Clears auth token and user
- Returns to logged-out state
- Test login flows again

#### **Go to Doctor Dashboard** (medkit icon)
- Navigate directly to `/doctor/dashboard`
- Works after mock login
- Shows appointments list

#### **Professional Login** (log-in icon)
- Navigate to `/auth/professional`
- Real login/registration flow
- Use for testing actual auth

---

## Doctor Features Available

### 1. Doctor Dashboard (`/doctor/dashboard`)
**Requires:** Mock login or real auth

**Features:**
- List of appointments
- Patient names, dates, times
- Appointment status
- Tap to view details

**API Endpoint:** `GET /api/doctor/appointments`

### 2. Appointment Details (`/doctor/appointments/[id]`)
**Requires:** Mock login or real auth

**Features:**
- Full appointment details
- Patient contact info
- Confirm or refuse appointment
- Status updates

**API Endpoints:**
- `GET /api/doctor/appointments/{id}`
- `PUT /api/doctor/appointments/{id}/status`

---

## Testing Workflow

### Scenario 1: Test Doctor Dashboard UI
```
1. Open DevTools
2. Mock Doctor Login
3. Go to Doctor Dashboard
4. Verify UI renders correctly
5. Check empty state (no appointments)
```

### Scenario 2: Test Appointment Flow (with backend)
```
1. Ensure backend is running (http://localhost:8000)
2. Mock Doctor Login
3. Go to Doctor Dashboard
4. API call to /api/doctor/appointments
5. View appointment list
6. Tap an appointment
7. Confirm or refuse
8. Verify status update
```

### Scenario 3: Test Auth Flow (real login)
```
1. Open DevTools
2. Tap "Professional Login"
3. Complete registration or login
4. Backend creates real user + token
5. Access doctor features with real auth
```

---

## Auth Storage

### In-Memory (Current Implementation)
```typescript
// lib/api.ts
let authToken: string | null = null;
let authUser: any | null = null;

export function setAuth(token: string | null, user?: any) {
  authToken = token;
  if (user !== undefined) authUser = user;
}

export function getAuth() {
  return { token: authToken, user: authUser };
}
```

**Limitation:** Auth is lost on app reload/restart.

**Future:** Use AsyncStorage or expo-secure-store for persistence.

---

## Backend Requirements

### Doctor Endpoints (Laravel)
All require `Authorization: Bearer {token}` header.

**Appointments:**
- `GET /api/doctor/appointments` - List doctor's appointments
- `GET /api/doctor/appointments/{id}` - Appointment details
- `PUT /api/doctor/appointments/{id}/status` - Update status (confirmed/cancelled)

**Stats (future):**
- `GET /api/doctor/stats` - Dashboard statistics

**Profile:**
- `GET /api/user` - Current user (doctor)
- `PUT /api/user/profile` - Update profile

---

## Mock vs Real Auth

| Feature | Mock Login | Real Login |
|---------|-----------|------------|
| Speed | Instant | Requires form |
| Backend | Not needed | Required |
| Persistence | Lost on reload | Can persist |
| Token | Fake | Valid JWT |
| API Calls | May fail auth | Works fully |
| Use Case | UI testing | Full testing |

---

## Troubleshooting

### "Not logged in" on Doctor Dashboard
- Open DevTools
- Check Auth Status
- If not logged in, use Mock Doctor Login
- Navigate to dashboard again

### API calls return 401 Unauthorized
- Mock token is fake and won't work with real backend
- Use real login via "Professional Login"
- Or test UI-only features with mock

### Auth lost after reload
- Current implementation uses in-memory storage
- Auth clears on app restart
- Use Mock Login again after reload
- Future: implement persistent storage

### Can't access doctor routes
- Ensure you're logged in (Check Auth Status)
- Verify role is "medecin" (role_id: 2)
- Check backend is running for API calls

---

## Next Steps

### For Development
1. ✅ Use Mock Login for quick UI testing
2. ✅ Use Real Login for full flow testing
3. 🔧 Add persistent auth (AsyncStorage/SecureStore)
4. 🔧 Add patient mock login for testing patient features

### For Production
1. Remove mock login (only in `__DEV__`)
2. Implement secure token storage
3. Add token refresh logic
4. Add biometric auth (optional)

---

## Summary

- **Mock Doctor Login** in DevTools bypasses auth for quick testing
- Access doctor dashboard and appointment features instantly
- Perfect for UI/UX development without backend dependency
- Use real login for full integration testing
- Auth is in-memory (lost on reload) - use mock login again as needed

**Quick Command:**
```
DevTools → Mock Doctor Login → Go to Dashboard
```

Done! 🎉
