# 🚀 Quick Start - Testing Guide

## 🎯 How to Access the Home Screen

There are **3 ways** to get to the home screen and test the onboarding:

---

## **Method 1: Skip Onboarding (Fastest)** ⚡

### On Slide 3 of Onboarding:
1. **Start the app** (it will show onboarding on first launch)
2. **Swipe to Slide 3** (or tap pagination dots)
3. **Tap "Explorer sans compte"** (bottom link)
4. **✅ You're on the home screen!**

This is the **fastest way** to test without logging in.

---

## **Method 2: Use DevTools** 🐛

### From Any Screen:
1. **Navigate to home/accueil tab**
2. **Look for purple bug icon** (bottom left)
3. **Tap the bug icon** → DevTools panel opens
4. **Options:**
   - **"Reset Onboarding"** → Restart the onboarding flow
   - **"View Onboarding"** → Jump directly to onboarding
   - **"Check Status"** → See if onboarding is completed

This is the **best way for testing** and iterating.

---

## **Method 3: Login as Patient** 👤

### If You Have a Patient Account:
1. **Go through onboarding** (or skip it)
2. **On Slide 3**, tap **"Je suis un patient"**
3. **Login screen appears**
4. **Enter credentials:**
   ```
   Email: [your patient email]
   Password: [your password]
   ```
5. **Tap "Se connecter"**
6. **✅ Redirects to home screen** (`/(tabs)/accueil`)

### If You Don't Have an Account:
1. **On login screen**, tap **"S'inscrire"** tab
2. **Fill out patient registration:**
   - Step 1: Email, Password, Name, Phone
   - Step 2: Age, Gender, Blood Type
   - Step 3: Allergies, Chronic Conditions
3. **Submit registration**
4. **✅ Redirects to home screen**

---

## **Method 4: Bypass Onboarding Entirely** 🔧

### For Quick Testing (Development Only):

**Option A: Manually Set AsyncStorage**
```typescript
// In any component or console
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('@vi-sante:onboarding_completed', 'true');
// Then restart app or navigate to /(tabs)/accueil
```

**Option B: Comment Out Onboarding Check**
```typescript
// In app/_layout.tsx, temporarily comment out:
// if (!onboardingCompleted && !inOnboarding) {
//   router.replace('/onboarding');
// }
```

**Option C: Use DevTools "Clear All Data" then "View Onboarding"**

---

## 🧪 **Recommended Testing Flow**

### **First Time Testing:**
```
1. Start app → See onboarding automatically
2. Swipe through all 3 slides
3. On Slide 3 → Tap "Explorer sans compte"
4. ✅ Now on home screen with DevTools available
```

### **Subsequent Testing:**
```
1. On home screen → Tap purple bug icon
2. Tap "Reset Onboarding"
3. Tap "Go to Onboarding"
4. Test different flows (skip, patient, professional)
```

---

## 📱 **What You'll See on Home Screen**

### **Home Screen Features:**
- ✅ **Search bar** - Find doctors/clinics
- ✅ **Quick stats** - Patients, Doctors, Appointments
- ✅ **Categories** - Browse by specialty
- ✅ **Purple bug icon** (bottom left) - DevTools

### **Bottom Tabs:**
- **Accueil** (Home) - Main screen
- **Messages** - Empty state (no messages yet)
- **Rendez-vous** - Empty state (no appointments yet)
- **Profil** - User profile

---

## 🎨 **Testing Checklist**

### **Onboarding Flow:**
- [ ] First launch shows onboarding
- [ ] Can swipe between slides
- [ ] Pagination dots work
- [ ] Skip button works
- [ ] "Explorer sans compte" works
- [ ] "Je suis un patient" goes to patient auth
- [ ] "Je suis un professionnel" goes to professional auth

### **Home Screen:**
- [ ] DevTools button visible (purple bug)
- [ ] Search bar functional
- [ ] Stats display correctly
- [ ] Categories visible
- [ ] Bottom tabs work

### **Empty States:**
- [ ] Messages tab shows empty state
- [ ] Appointments tab shows empty state
- [ ] CTAs in empty states work

### **DevTools:**
- [ ] Bug icon visible (bottom left)
- [ ] Panel opens when tapped
- [ ] "Reset Onboarding" works
- [ ] "Check Status" works
- [ ] "View Onboarding" works
- [ ] "Clear All Data" works (with confirmation)

---

## 🐛 **Troubleshooting**

### **Onboarding Not Showing:**
```bash
# Use DevTools → Reset Onboarding
# OR manually:
AsyncStorage.removeItem('@vi-sante:onboarding_completed')
```

### **Can't Find DevTools:**
```bash
# Make sure you're in development mode
# Check home screen (accueil tab)
# Look for purple bug icon bottom left
```

### **Stuck on Onboarding:**
```bash
# Tap "Passer" (top right) to skip
# OR tap "Explorer sans compte" on Slide 3
```

### **Want to Reset Everything:**
```bash
# DevTools → Clear All Data
# Then restart app
```

---

## 🎯 **Quick Commands**

### **Start the App:**
```bash
cd /home/super_user_zakaria/Dev/vimobile
npm start
# or
expo start
```

### **Reset Onboarding (via code):**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.removeItem('@vi-sante:onboarding_completed');
```

### **Check Onboarding Status:**
```typescript
const value = await AsyncStorage.getItem('@vi-sante:onboarding_completed');
console.log('Onboarding completed:', value === 'true');
```

---

## 💡 **Pro Tips**

1. **Use "Explorer sans compte"** - Fastest way to home screen
2. **Use DevTools** - Best for testing iterations
3. **Purple bug icon** - Your best friend for testing
4. **Empty states** - Check Messages & Appointments tabs
5. **Swipe gestures** - Test on real device for best experience

---

## 🎉 **Summary**

### **Fastest Route to Home Screen:**
```
Start App → Swipe to Slide 3 → "Explorer sans compte" → ✅ Home!
```

### **Best for Testing:**
```
Home Screen → Purple Bug Icon → Reset Onboarding → Test Flow
```

### **With Login:**
```
Slide 3 → "Je suis un patient" → Login → ✅ Home!
```

---

**Now you're ready to test! 🚀**

Start the app and look for the purple bug icon on the home screen - that's your testing control center!
