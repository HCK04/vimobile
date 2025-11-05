# Search Functionality Implementation

## ✅ Implementation Complete

Search functionality has been implemented for the Vi-Santé mobile app with backend integration.

---

## 📋 What Was Implemented

### 1. **Search Hook** (`lib/useSearch.ts`)

Created a reusable React hook for search functionality:

**Features:**
- ✅ Backend-powered search using `/api/users` endpoint
- ✅ Support for multiple filters (query, city, specialty, type)
- ✅ Proximity search with latitude/longitude/radius
- ✅ Separate methods for doctors, organizations, and general search
- ✅ Autocomplete suggestions
- ✅ Loading and error states
- ✅ TypeScript types for type safety

**Methods:**
```typescript
const { 
  loading,           // Loading state
  error,             // Error message
  results,           // Search results array
  search,            // General search function
  searchDoctors,     // Search only doctors
  searchOrganizations, // Search only organizations
  getSuggestions,    // Get autocomplete suggestions
  clearResults       // Clear results
} = useSearch();
```

**Search Filters:**
```typescript
interface SearchFilters {
  query?: string;      // Name or specialty
  city?: string;       // City name
  specialty?: string;  // Medical specialty
  type?: string;       // Professional type
  latitude?: number;   // For proximity search
  longitude?: number;  // For proximity search
  radius?: number;     // Search radius in km
}
```

---

### 2. **Home Screen** (`app/(tabs)/accueil.tsx`)

**Improvements:**
- ✅ Backend-powered autocomplete suggestions
- ✅ Debounced search (300ms delay)
- ✅ Loading state for suggestions
- ✅ Pass search parameters to results page
- ✅ Better error handling

**Features:**
- Search by name or specialty
- City selection with autocomplete
- Real-time suggestions dropdown
- Navigate to search results with filters

**Changes Made:**
- Replaced client-side filtering with `getSuggestions()` from useSearch hook
- Added loading state for suggestions
- Pass query and city parameters when navigating to search page
- Removed unused `doctors` and `establishments` state

---

### 3. **Search Results Page** (`app/recherche/index.tsx`)

**Complete Redesign:**
- ✅ Modern, clean UI with proper spacing
- ✅ Backend-powered search
- ✅ Three search filters: name, city, specialty
- ✅ Loading states with spinner
- ✅ Empty state with helpful message
- ✅ Error handling with error banner
- ✅ Results count display
- ✅ Professional cards with icons
- ✅ Back button navigation

**UI Components:**
- Header with back button
- Filter section with 3 inputs
- Search button with loading indicator
- Error banner (when errors occur)
- Results count
- Loading spinner
- Empty state illustration
- Result cards with:
  - Professional/Organization icon
  - Name and specialty
  - Location and type badges
  - Chevron for navigation

---

## 🎯 How It Works

### Backend Integration

**Endpoint Used:** `GET /api/users`

**Query Parameters:**
- `lat` - Latitude for proximity search
- `lng` - Longitude for proximity search
- `radius` - Search radius in kilometers (default: 5km)

**Response Format:**
```json
{
  "data": [
    {
      "id": 123,
      "name": "Dr. Ahmed Benali",
      "type": "medecin",
      "specialty": "Cardiologue",
      "ville": "Casablanca",
      "adresse": "123 Rue Example",
      "profile_image": "/storage/profiles/image.jpg",
      "rating": 4.5,
      "disponible": true,
      "profile_data": { ... }
    }
  ],
  "count": 1
}
```

**Client-Side Filtering:**
Since the backend returns all professionals, the hook applies client-side filtering for:
- Query (name matching)
- City (exact or partial match)
- Specialty (exact or partial match)
- Type (professional type)

---

## 🔍 Search Flow

### 1. Home Screen Autocomplete

```
User types in search box
    ↓
Debounce 300ms
    ↓
Call getSuggestions(query, 15)
    ↓
Backend: GET /api/users
    ↓
Client-side filter by query
    ↓
Show top 15 suggestions
    ↓
User selects suggestion → Navigate to profile
```

### 2. Search Results Page

```
User enters search criteria
    ↓
Click "Rechercher" button
    ↓
Call search({ query, city, specialty })
    ↓
Backend: GET /api/users
    ↓
Client-side filter by all criteria
    ↓
Display results with count
    ↓
User clicks result → Navigate to profile
```

---

## 📱 User Experience

### Home Screen

1. **Search Input**
   - Type name or specialty
   - See real-time suggestions
   - Click suggestion to view profile

2. **City Selection**
   - Select from Moroccan cities
   - Or choose "Toutes les villes"
   - Autocomplete dropdown

3. **Search Button**
   - Navigate to full search page
   - Passes current query and city

### Search Results Page

1. **Filter Section**
   - Name/Specialty input
   - City input
   - Specialty input (optional)
   - Search button

2. **Results Display**
   - Loading spinner while searching
   - Results count
   - Professional cards with details
   - Empty state if no results

3. **Error Handling**
   - Red error banner if search fails
   - Helpful error messages
   - Retry by searching again

---

## 🎨 UI/UX Features

### Design Elements

- **Modern Cards:** Rounded corners, subtle shadows
- **Icons:** Ionicons for visual clarity
- **Colors:** Blue primary (#2563EB), Gray neutrals
- **Typography:** Clear hierarchy with font weights
- **Spacing:** Consistent 12-16px padding
- **Feedback:** Loading states, empty states, errors

### Accessibility

- ✅ Keyboard navigation support
- ✅ Return key triggers search
- ✅ Clear visual feedback
- ✅ Readable text sizes
- ✅ Sufficient color contrast

---

## 🔧 Technical Details

### Performance Optimizations

1. **Debouncing**
   - 300ms delay for autocomplete
   - Prevents excessive API calls
   - Smooth typing experience

2. **Efficient Filtering**
   - Client-side filtering after fetch
   - Reduces backend load
   - Fast results display

3. **State Management**
   - Minimal re-renders
   - Proper cleanup in useEffect
   - Loading states prevent duplicate requests

### Error Handling

```typescript
try {
  const results = await search(filters);
  // Handle results
} catch (err) {
  // Error state set automatically
  // User sees error banner
}
```

### TypeScript Types

```typescript
interface SearchResult {
  id: number;
  name: string;
  type: string;
  specialty?: string;
  ville?: string;
  adresse?: string;
  profile_image?: string;
  rating?: number;
  disponible?: boolean;
  distance?: number;
  isOrganization?: boolean;
}
```

---

## 🧪 Testing

### Manual Testing Steps

1. **Test Autocomplete**
   ```
   - Open home screen
   - Type "ahmed" in search box
   - Verify suggestions appear
   - Click a suggestion
   - Verify navigation to profile
   ```

2. **Test Search Filters**
   ```
   - Navigate to search page
   - Enter name: "Dr"
   - Enter city: "Casablanca"
   - Click "Rechercher"
   - Verify filtered results
   ```

3. **Test Empty States**
   ```
   - Search for "zzzzzzz"
   - Verify empty state shows
   - Verify helpful message displays
   ```

4. **Test Error Handling**
   ```
   - Turn off backend
   - Try to search
   - Verify error banner shows
   - Verify error message is clear
   ```

### Test with Backend

```bash
# Start backend
cd /home/super_user_zakaria/Dev/vi/viback
sudo docker-compose up -d

# Start mobile app
cd /home/super_user_zakaria/Dev/vi/vimobile
npm start

# Test endpoints manually
curl -H 'X-Client-Type: mobile' http://localhost:8000/api/users
curl -H 'X-Client-Type: mobile' http://localhost:8000/api/medecins
```

---

## 📊 Backend Endpoints Used

### 1. GET /api/users
**Purpose:** Search all healthcare professionals and organizations  
**Auth:** Public (no token required)  
**Headers:** `X-Client-Type: mobile`  
**Query Params:**
- `lat` (optional) - Latitude
- `lng` (optional) - Longitude
- `radius` (optional) - Search radius in km

**Response:**
```json
{
  "data": [...],
  "count": 123
}
```

### 2. GET /api/medecins
**Purpose:** Get all doctors  
**Auth:** Public  
**Headers:** `X-Client-Type: mobile`  
**Response:** Array of doctor profiles

### 3. GET /api/organizations/search
**Purpose:** Search organizations (clinics, pharmacies, etc.)  
**Auth:** Public  
**Headers:** `X-Client-Type: mobile`  
**Query Params:**
- `q` - Search query
- `city` - City name

---

## 🚀 Future Enhancements

### Planned Features

1. **Proximity Search**
   - Use device location
   - Show distance to each professional
   - Sort by distance
   - Map view

2. **Advanced Filters**
   - Filter by rating
   - Filter by availability
   - Filter by price range
   - Filter by insurance accepted

3. **Search History**
   - Save recent searches
   - Quick access to past searches
   - Clear history option

4. **Favorites**
   - Save favorite professionals
   - Quick access from search
   - Sync across devices

5. **Voice Search**
   - Speech-to-text input
   - Hands-free searching
   - Accessibility improvement

---

## 📝 Code Examples

### Using the Search Hook

```typescript
import { useSearch } from '@/lib/useSearch';

function MyComponent() {
  const { loading, results, search } = useSearch();

  const handleSearch = async () => {
    await search({
      query: 'cardiologue',
      city: 'Casablanca',
      radius: 10,
    });
  };

  return (
    <View>
      <Button onPress={handleSearch}>Search</Button>
      {loading && <ActivityIndicator />}
      {results.map(result => (
        <Text key={result.id}>{result.name}</Text>
      ))}
    </View>
  );
}
```

### Getting Autocomplete Suggestions

```typescript
const { getSuggestions } = useSearch();

const fetchSuggestions = async (query: string) => {
  const suggestions = await getSuggestions(query, 10);
  // suggestions is an array of SearchResult
};
```

---

## 🐛 Known Issues

### Current Limitations

1. **No Proximity Search Yet**
   - Location button shows "not activated" alert
   - Need to implement geolocation
   - Need to request location permissions

2. **Client-Side Filtering**
   - All data fetched from backend
   - Filtering done on device
   - Could be slow with large datasets
   - **Future:** Add backend query parameters

3. **No Caching**
   - Each search fetches from backend
   - No offline support
   - **Future:** Implement React Query for caching

---

## ✅ Summary

**Status:** ✅ **Complete and Functional**

**What Works:**
- ✅ Home screen autocomplete
- ✅ Search results page
- ✅ Backend integration
- ✅ Loading states
- ✅ Error handling
- ✅ Empty states
- ✅ Mobile header (X-Client-Type)

**What's Next:**
- 🔧 Implement proximity search
- 🔧 Add advanced filters
- 🔧 Implement caching with React Query
- 🔧 Add search history
- 🔧 Add favorites feature

---

**Implementation Date:** November 5, 2025  
**Backend:** Laravel 9 (http://localhost:8000)  
**Mobile:** React Native + Expo  
**Status:** Ready for testing ✅
