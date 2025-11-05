# Missing Functionality Analysis - Vi-Santé Mobile App

## 📊 Executive Summary

**Backend Status:** ✅ 95% complete with comprehensive API endpoints  
**Mobile Patient Features:** 🟡 60% complete - Missing critical health dossier and profile management  
**Mobile Doctor Features:** ✅ 90% complete - Essential "quick check" features implemented

---

## 🎯 Product Strategy Reminder

- **Patients:** Mobile app is PRIMARY interface → Need comprehensive features
- **Doctors:** Mobile app for QUICK CHECKS only → Web version for full power
- **Focus:** Prioritize patient features, keep doctor features minimal

---

## ✅ Currently Implemented in Mobile

### **Patient Side (Implemented)**
- ✅ Search for doctors/professionals/organizations
- ✅ View doctor profiles with details
- ✅ Book appointments with date/time/reason
- ✅ View appointments list
- ✅ View appointment details
- ✅ Cancel appointments
- ✅ View basic user profile

### **Doctor Side (Implemented)**
- ✅ View dashboard with stats (upcoming, patients, total appointments)
- ✅ View appointments list with filters and search
- ✅ View appointment details
- ✅ Update appointment status (confirm/cancel/complete)
- ✅ Toggle availability on/off
- ✅ View notifications
- ✅ Mark notifications as read

---

## ❌ Missing Functionality - PATIENT SIDE

### **🔴 HIGH PRIORITY (Critical for Mobile Experience)**

#### 1. **Edit Profile** ⭐⭐⭐
**Backend:** ✅ Available  
**Endpoints:**
- `PUT /api/user/profile` - Update profile
- `POST /api/user/profile/update` - Alternative update
- `POST /api/user/profile/update-avatar` - Upload avatar

**What's Missing:**
- Edit profile screen with form (name, phone, email, birth date, city)
- Avatar upload with image picker
- Form validation and error handling

**Complexity:** 🟢 Easy  
**Impact:** High - Users need to update their information

---

#### 2. **Patient Health Dossier (Santé)** ⭐⭐⭐
**Backend:** ✅ Available  
**Endpoints:**
- `GET /api/patient/sante` - Get all health data
- `POST /api/patient/sante/section/{section}` - Update section
- `GET /api/patient/sante/vaccins/catalog` - Vaccine catalog
- `POST /api/patient/sante/vaccins/add` - Add vaccine
- `DELETE /api/patient/sante/vaccins/{id}` - Delete vaccine
- `POST /api/patient/sante/vaccins/none` - Toggle "no vaccines"
- `POST /api/patient/sante/documents/upload` - Upload document
- `DELETE /api/patient/sante/documents/{id}` - Delete document

**Sections Available:**
1. Medical History (antecedents_medicaux)
2. Regular Treatments (traitements_reguliers)
3. Allergies
4. Family History (antecedents_familiaux)
5. Surgeries (operations_chirurgicales)
6. Vaccines (vaccins)
7. Measurements (mesures)
8. Documents

**What's Missing:**
- Health dossier main screen
- Section screens for each category
- Vaccine management (add from catalog, view, delete)
- Document upload (camera + gallery)
- Document viewer
- Form inputs for each section

**Complexity:** 🟡 Medium  
**Impact:** Very High - Core feature for patients

---

#### 3. **View Doctor Available Hours** ⭐⭐⭐
**Backend:** ✅ Available  
**Endpoints:**
- `GET /api/doctors/{id}/available-hours` - Get doctor's schedule
- `GET /api/appointments/booked-slots/{doctorId}?date=YYYY-MM-DD` - Get booked slots

**What's Missing:**
- Calendar/time slot picker in booking form
- Display available hours
- Show booked vs available slots
- Better date/time selection UX

**Complexity:** 🟡 Medium  
**Impact:** High - Improves booking experience

---

#### 4. **Update/Reschedule Appointment** ⭐⭐
**Backend:** ✅ Available  
**Endpoints:**
- `PUT /api/appointments/{id}` - Update appointment

**What's Missing:**
- Edit appointment screen
- Date/time picker for rescheduling
- Validation (can't reschedule to past, check availability)

**Complexity:** 🟢 Easy  
**Impact:** Medium - Users need flexibility

---

#### 5. **View Annonces (Special Offers)** ⭐⭐
**Backend:** ✅ Available  
**Endpoints:**
- `GET /api/annonces` - List all public annonces
- `GET /api/annonces/{id}` - Get annonce details

**What's Missing:**
- Annonces list screen
- Annonce detail screen
- Filter by category/location
- Book appointment from annonce

**Complexity:** 🟢 Easy  
**Impact:** Medium - Valuable for users to see offers

---

### **🟡 MEDIUM PRIORITY (Nice to Have)**

#### 6. **Favorites/Bookmarks**
**Backend:** ❌ Not Available  
**What's Needed:**
- Backend: Create favorites table and endpoints
- Mobile: Favorites list, add/remove functionality

**Complexity:** 🟡 Medium  
**Impact:** Medium - Convenience feature

---

#### 7. **Messages/Chat System**
**Backend:** ❌ Not Available  
**What's Needed:**
- Backend: Full messaging system (complex)
- Mobile: Chat interface, real-time updates

**Complexity:** 🔴 Hard  
**Impact:** High - But complex, consider later

---

#### 8. **Appointment Reminders/Notifications**
**Backend:** ✅ Partially Available (notifications exist)  
**What's Missing:**
- Push notifications setup (Expo Notifications)
- Notification preferences
- Reminder scheduling

**Complexity:** 🟡 Medium  
**Impact:** Medium - Improves user engagement

---

## ❌ Missing Functionality - DOCTOR SIDE

### **🟢 LOW PRIORITY (Doctors Use Web for These)**

#### 1. **Manage Annonces (Special Offers)**
**Backend:** ✅ Available  
**Endpoints:**
- `GET /api/doctor/annonces` - List doctor's annonces
- `POST /api/doctor/annonces` - Create annonce
- `POST /api/doctor/annonces/{id}` - Update annonce
- `DELETE /api/doctor/annonces/{id}` - Delete annonce
- `PUT /api/doctor/annonces/{id}/toggle-status` - Activate/deactivate
- `POST /api/doctor/annonces/activate-all` - Bulk activate
- `POST /api/doctor/annonces/deactivate-all` - Bulk deactivate

**Complexity:** 🟡 Medium  
**Recommendation:** ⚠️ Skip for mobile - Use web version

---

#### 2. **Set Absence/Vacation Mode**
**Backend:** ✅ Available  
**Endpoints:**
- `POST /api/professional/profile/set-absence` - Set absence period
- `POST /api/professional/profile/toggle-vacation-mode` - Toggle vacation

**Complexity:** 🟢 Easy  
**Recommendation:** ⚠️ Optional - Could add simple toggle

---

#### 3. **Update Professional Profile**
**Backend:** ✅ Available  
**Endpoints:**
- `GET /api/professional/profile` - Get profile
- `POST /api/professional/profile/update` - Update profile
- `POST /api/professional/profile/update-image` - Update image

**Complexity:** 🟡 Medium  
**Recommendation:** ⚠️ Skip for mobile - Use web version

---

#### 4. **Messages/Chat**
**Backend:** ❌ Not Available  
**Recommendation:** ⚠️ Skip - Use web version

---

## 📋 Implementation Roadmap

### **Phase 1: Essential Patient Features (2-3 weeks)**
1. ✅ Edit Profile + Avatar Upload
2. ✅ View Doctor Available Hours
3. ✅ Update/Reschedule Appointment
4. ✅ View Annonces List

### **Phase 2: Health Dossier (3-4 weeks)**
1. ✅ Health Dossier Main Screen
2. ✅ Medical History Section
3. ✅ Allergies Section
4. ✅ Vaccines Management
5. ✅ Document Upload/Viewer
6. ✅ Other Sections (treatments, surgeries, etc.)

### **Phase 3: Enhanced Features (2-3 weeks)**
1. ✅ Favorites System (backend + mobile)
2. ✅ Push Notifications
3. ✅ Appointment Reminders
4. ✅ Better Search Filters

### **Phase 4: Messaging (4-5 weeks)**
1. ✅ Backend Messaging System
2. ✅ Mobile Chat Interface
3. ✅ Real-time Updates
4. ✅ Notifications

---

## 🎨 UI/UX Considerations

All new features should follow the established design system:
- **Background:** `#F8FAFC`
- **Cards:** White with `#E5E7EB` borders, 12-16px radius
- **Primary Blue:** `#2563EB`
- **Icons:** Ionicons with 40x40px circles
- **Spacing:** 16px padding, 12px gaps
- **Headers:** Back button + title + optional action

---

## 🔧 Technical Requirements

### **Dependencies Needed:**
```json
{
  "expo-image-picker": "^14.x", // For avatar + document upload
  "expo-document-picker": "^11.x", // For document selection
  "expo-notifications": "^0.27.x", // For push notifications
  "react-native-calendars": "^1.x", // For date/time picker
  "@react-native-async-storage/async-storage": "^1.x" // Already installed
}
```

### **Backend Considerations:**
- ✅ All endpoints are ready
- ❌ Favorites system needs to be built
- ❌ Messaging system needs to be built
- ✅ File upload is supported (documents, images)

---

## 📊 Complexity & Time Estimates

| Feature | Complexity | Time | Priority |
|---------|-----------|------|----------|
| Edit Profile | 🟢 Easy | 1-2 days | HIGH |
| Available Hours | 🟡 Medium | 2-3 days | HIGH |
| Update Appointment | 🟢 Easy | 1 day | HIGH |
| View Annonces | 🟢 Easy | 1-2 days | HIGH |
| Health Dossier | 🟡 Medium | 2-3 weeks | HIGH |
| Favorites | 🟡 Medium | 3-4 days | MEDIUM |
| Push Notifications | 🟡 Medium | 2-3 days | MEDIUM |
| Messaging | 🔴 Hard | 4-5 weeks | LOW |

**Total Estimated Time (High Priority):** 4-5 weeks  
**Total Estimated Time (All Features):** 10-12 weeks

---

## 🎯 Recommendations

### **Immediate Actions (This Week):**
1. ✅ Implement Edit Profile + Avatar Upload
2. ✅ Add View Annonces functionality
3. ✅ Implement Update Appointment

### **Next Sprint (2-3 Weeks):**
1. ✅ Implement Available Hours in booking flow
2. ✅ Start Health Dossier (main screen + 2-3 sections)

### **Future Sprints:**
1. ✅ Complete Health Dossier
2. ✅ Add Favorites system
3. ✅ Implement Push Notifications
4. ⚠️ Consider Messaging (complex, evaluate need)

---

## 🚫 What NOT to Implement (Doctor Side)

- ❌ Annonces Management (use web)
- ❌ Profile Editing (use web)
- ❌ Detailed Statistics (use web)
- ❌ Patient Management (use web)
- ❌ Schedule Management (use web)

**Reason:** Doctors will use web version for administrative tasks. Mobile is for quick checks only.

---

## ✅ Summary

**Patient Side:**
- **Implemented:** 60% (search, booking, appointments, basic profile)
- **Missing:** 40% (health dossier, profile editing, annonces, advanced features)
- **Priority:** HIGH - Patients rely on mobile app

**Doctor Side:**
- **Implemented:** 90% (dashboard, appointments, status updates, notifications)
- **Missing:** 10% (advanced features better suited for web)
- **Priority:** LOW - Doctors use web for full features

**Next Steps:**
1. Start with Edit Profile (quick win)
2. Add Available Hours (improves booking)
3. Implement Health Dossier (core feature)
4. Add nice-to-have features later

---

## 📝 Notes

- All backend endpoints are well-documented and functional
- Mobile app already has good foundation and design system
- Focus on patient experience first
- Keep doctor features minimal (quick checks only)
- Consider user feedback before implementing messaging (complex feature)

---

**Last Updated:** November 6, 2025  
**Status:** Ready for implementation planning
