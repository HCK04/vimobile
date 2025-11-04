# Onboarding Feature - Testing Guide

## 🎯 What Was Implemented

### 1. **Onboarding Slides** (`/app/onboarding.tsx`)
- **3 professional slides** with consistent Vi-Santé design
- **Slide 1**: Welcome with heart icon and brand message
- **Slide 2**: Trust & Security (CNDP compliance)
- **Slide 3**: Get Started with user type selection
- Features:
  - Swipeable horizontal scrolling
  - Pagination dots with active state
  - Skip button (top right)
  - Next button (floating, bottom right)
  - Two CTAs: "Patient" and "Professional"
  - "Explorer sans compte" option

### 2. **EmptyState Component** (`/components/EmptyState.tsx`)
- Reusable component for empty screens
- Integrated into:
  - Messages screen
  - Appointments screen
- Features:
  - Icon with background circle
  - Title and description
  - Primary action button with icon
  - Optional secondary action

### 3. **Root Layout Integration** (`/app/_layout.tsx`)
- AsyncStorage check for first launch
- Automatic routing to onboarding
- Prevents back navigation to onboarding after completion

### 4. **DevTools Component** (`/components/DevTools.tsx`)
- Floating purple bug icon (bottom left)
- Development-only panel with:
  - Reset Onboarding
  - Check Status
  - View Onboarding
  - Clear All Data
- Only visible in `__DEV__` mode

---

## 🧪 How to Test

### **First Launch Test**
1. **Clear app data** (or use DevTools → Clear All Data)
2. **Restart the app**
3. **Expected**: Onboarding slides appear automatically
4. **Test swipe** gesture between slides
5. **Test pagination dots** - tap to jump to slide
6. **Test skip button** - should go to home screen
7. **Test next button** - should advance to next slide
8. **On Slide 3**:
   - Tap "Je suis un patient" → Should go to patient auth
   - OR tap "Je suis un professionnel" → Should go to professional auth
   - OR tap "Explorer sans compte" → Should go to home screen

### **Subsequent Launches Test**
1. **Close and reopen app**
2. **Expected**: Onboarding is skipped, goes directly to home/tabs
3. **Verify** AsyncStorage has `@vi-sante:onboarding_completed = true`

### **DevTools Test**
1. **Open home screen**
2. **Look for purple bug icon** (bottom left)
3. **Tap bug icon** → Panel should appear
4. **Test each button**:
   - **Reset Onboarding**: Should show alert, then allow navigation
   - **Check Status**: Should show "Completed ✓" or "Not completed ✗"
   - **View Onboarding**: Should navigate to onboarding screen
   - **Clear All Data**: Should show confirmation, then clear AsyncStorage

### **Empty State Test**
1. **Navigate to Messages tab**
2. **Expected**: EmptyState with "Aucun message" appears
3. **Tap "Trouver un médecin"** → Should navigate to search
4. **Navigate to Rendez-vous tab**
5. **Expected**: EmptyState with "Aucun rendez-vous" appears
6. **Tap "Rechercher un médecin"** → Should navigate to search
7. **Tap "Comment ça marche ?"** → (Currently no action, can be implemented)

---

## 🎨 Design Consistency Checklist

### ✅ Colors Match Existing UI
- Primary Blue: `#2563EB` ✓
- Light Blue: `#3B82F6`, `#DBEAFE`, `#EFF6FF` ✓
- Green: `#10B981`, `#D1FAE5` ✓
- Amber: `#F59E0B` ✓
- Text: `#111827` (dark), `#6B7280` (secondary) ✓
- Background: `#FFFFFF`, `#F8FAFC` ✓

### ✅ Typography Matches
- Title: 28px, 800 weight ✓
- Subtitle: 18px, 600 weight ✓
- Body: 16px, 400 weight ✓
- Button: 16px, 700-800 weight ✓

### ✅ Component Style Matches
- Border radius: 12-14px ✓
- Card padding: 16-20px ✓
- Button shadows: Subtle elevation ✓
- Icon circles: Consistent sizing ✓
- Professional healthcare aesthetic ✓

---

## 📱 Platform Testing

### iOS
- [ ] Onboarding slides work
- [ ] Swipe gestures smooth
- [ ] SafeAreaView respects notch
- [ ] DevTools button visible
- [ ] Navigation works correctly

### Android
- [ ] Onboarding slides work
- [ ] Swipe gestures smooth
- [ ] Back button behavior correct
- [ ] DevTools button visible
- [ ] Navigation works correctly

### Web (if applicable)
- [ ] Onboarding displays correctly
- [ ] Click navigation works
- [ ] Responsive layout
- [ ] DevTools visible in dev mode

---

## 🐛 Known Issues / Future Improvements

### Current Limitations
1. **No animation between slides** - Uses native ScrollView paging (simple but effective)
2. **No auto-advance** - User must swipe or tap next (better UX for reading)
3. **Skip goes to home** - Could be smarter based on auth state
4. **"Comment ça marche ?" has no action** - Needs modal or help screen

### Future Enhancements
1. **Add slide animations** - Fade in content on slide change
2. **Add illustrations** - Custom SVG illustrations for each slide
3. **Add video option** - "Watch how it works" video
4. **Add analytics** - Track which slides users skip
5. **Add A/B testing** - Test different messaging
6. **Add tooltips** - Contextual help after onboarding
7. **Add profile completion** - Progress indicator
8. **Add success celebrations** - First appointment confetti

---

## 🔧 Troubleshooting

### Onboarding Not Showing
1. Check AsyncStorage: `@vi-sante:onboarding_completed`
2. Use DevTools → Reset Onboarding
3. Or manually: `AsyncStorage.removeItem('@vi-sante:onboarding_completed')`
4. Restart app

### DevTools Not Visible
1. Ensure you're in development mode (`__DEV__ === true`)
2. Check home screen (accueil.tsx)
3. Look for purple bug icon bottom left

### Navigation Issues
1. Check `_layout.tsx` routing logic
2. Verify AsyncStorage is working
3. Check console for errors
4. Ensure auth screens exist at `/auth/patient` and `/auth/professional`

### Empty States Not Showing
1. Ensure data arrays are empty in Messages/Appointments
2. Check EmptyState component import
3. Verify router is available

---

## 📊 Success Metrics

### Target KPIs (After Launch)
- **Onboarding Completion Rate**: >70%
- **Skip Rate**: <30%
- **Time to First Search**: <2 minutes
- **Empty State CTA Clicks**: >40%
- **Return User Recognition**: 100% (no onboarding on second launch)

---

## 🚀 Deployment Checklist

Before deploying to production:
- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Test with slow network
- [ ] Test with no network (AsyncStorage should still work)
- [ ] Verify DevTools is hidden in production (`__DEV__ === false`)
- [ ] Test all navigation paths
- [ ] Test skip functionality
- [ ] Test empty states
- [ ] Verify design consistency
- [ ] Check accessibility (font sizes, contrast)
- [ ] Test with different screen sizes
- [ ] Verify AsyncStorage persistence
- [ ] Test app restart behavior

---

## 📝 Code Locations

```
/app/onboarding.tsx              - Main onboarding component
/components/EmptyState.tsx       - Reusable empty state
/components/DevTools.tsx         - Development tools
/app/_layout.tsx                 - Root layout with routing logic
/app/(tabs)/messages.tsx         - Messages with EmptyState
/app/(tabs)/rendezvous.tsx       - Appointments with EmptyState
/app/(tabs)/accueil.tsx          - Home with DevTools
```

---

## 🎓 Usage Examples

### Reset Onboarding Programmatically
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.removeItem('@vi-sante:onboarding_completed');
// Then restart app or navigate to /onboarding
```

### Check Onboarding Status
```typescript
const value = await AsyncStorage.getItem('@vi-sante:onboarding_completed');
const completed = value === 'true';
```

### Use EmptyState in New Screen
```typescript
import { EmptyState } from '@/components/EmptyState';

<EmptyState
  icon="heart-outline"
  title="No favorites yet"
  description="Save your favorite doctors here"
  primaryAction={{
    label: "Browse Doctors",
    icon: "search",
    onPress: () => router.push('/recherche'),
  }}
/>
```

---

**Created**: November 4, 2025  
**Version**: 1.0.0  
**Status**: ✅ Ready for Testing
