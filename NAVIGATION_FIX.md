# Navigation to Accueil Fix

## Issue
User cannot navigate past onboarding screen to accueil.

## Root Cause
The app uses AsyncStorage to track onboarding completion. The navigation guard in `app/_layout.tsx` redirects to `/onboarding` if the key `@vi-sante:onboarding_completed` is not set to `'true'`.

## Solutions

### Option 1: Use DevTools (Recommended for Development)
1. **Reload the app** in Expo (press `r` in terminal or shake device)
2. **Tap the floating purple bug button** (bottom-left)
3. **Tap "Skip to Accueil"** button (green home icon)
4. This will:
   - Set onboarding as completed in AsyncStorage
   - Navigate directly to `/(tabs)/accueil`

### Option 2: Use Onboarding Screen Buttons
On the onboarding screen (slide 3/3):
- **"Je suis un patient"** → Goes to patient auth/registration
- **"Je suis un professionnel"** → Goes to professional auth/registration
- **"Explorer sans compte"** → Skips to accueil (browse mode)

Or use the **"Passer"** button (top-right, slides 1-2) to skip directly to accueil.

### Option 3: Manual AsyncStorage Clear (if stuck)
If navigation is completely broken:
1. Open DevTools (purple bug button)
2. Tap **"Clear All Data"** (red trash icon)
3. Confirm
4. Restart the app
5. Complete onboarding flow again

## Files Modified
- `components/DevTools.tsx`
  - Added `skipToAccueil()` function
  - Added "Skip to Accueil" button in DevTools panel

## Navigation Flow
```
App Launch
    ↓
Check AsyncStorage for '@vi-sante:onboarding_completed'
    ↓
├─ Not set or 'false' → Redirect to /onboarding
│       ↓
│   User completes onboarding or skips
│       ↓
│   Set '@vi-sante:onboarding_completed' = 'true'
│       ↓
└─ Set to 'true' → Allow access to /(tabs)/accueil
```

## Testing
1. Reload Expo app
2. Open DevTools
3. Check onboarding status (should show "Completed ✓" or "Not completed ✗")
4. Use "Skip to Accueil" if needed
5. Verify you can access accueil and navigate tabs

## DevTools Features (Development Only)
- **Reset Onboarding**: Clear completion flag, restart onboarding
- **Check Status**: View current onboarding completion state
- **View Onboarding**: Navigate to onboarding screen
- **Skip to Accueil**: Bypass onboarding, go directly to home
- **Go to Doctor Dashboard**: Quick access to doctor interface
- **Professional Login**: Quick access to professional auth
- **Clear All Data**: Nuclear option, clears all AsyncStorage

## Notes
- DevTools only appear in `__DEV__` mode (development builds)
- Production builds will not show the floating bug button
- Onboarding is shown once per app install (unless cleared)
