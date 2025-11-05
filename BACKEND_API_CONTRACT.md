# Backend API Contract (Mobile Scope)

This document lists the backend endpoints we will use, with request/response shapes, to avoid implementing unsupported features.

All authenticated endpoints require:
- Header: `Authorization: Bearer <token>`
- Header: `Accept: application/json`
- Header (mobile dev): `X-Client-Type: mobile`

---

## Auth & User

### GET /api/user
- Returns the authenticated user with `role` relation

### GET /api/user/profile
- Returns the current user with relations depending on role:
  - Patients: includes `profile` + `patientProfile`
  - Professionals/Organizations: may include specific profile (e.g., `medecinProfile`) or flattened org profile when role is an organization
- Mobile usage: read-only user display

### PUT /api/user/profile
- Updates user basic info (+ patient profile, and professional fields if applicable)
- Validation fields (subset we will use for patient):
  - name (required string)
  - email (required, unique except self)
  - phone (optional string)
  - age (optional number)
  - gender (optional string)
  - blood_type (optional string)
  - allergies (optional string OR string[])
  - chronic_diseases (optional string OR string[])
  - password (optional string >= 8) + password_confirmation when provided
- Response:
```json
{
  "message": "Profile updated successfully",
  "user": { /* user with relations */ }
}
```

### POST /api/user/profile/update-avatar
- Content-Type: multipart/form-data
- Field: `avatar` (image, max 3MB)
- Response:
```json
{ "message": "Avatar updated successfully", "path": "/storage/avatars/<file>" }
```

---

## Search & Profiles (Public)

### GET /api/users
- Public search for professionals/organizations. Supports optional proximity params `lat`, `lng`, `radius`.
- Returns array of users with `ville`, `profile_data` (decoded JSON fields) and excludes vacation-mode users.

### GET /api/professionals/{id}
### GET /api/profile/{id}
### GET /api/profiles/{id}
- Resolve professional or profile by ID (varies by data). Fallbacks are used in mobile when one endpoint fails.

### GET /api/medecins (public)
### GET /api/medecins/{id} (public)
- Lists professionals and fetches by ID (minimal data)

### GET /api/profiles/slug/{slug}
- Universal slug resolver. Used to find an entity ID from a slug.

---

## Appointments (Patient)

### POST /api/patient/appointments
- Create a new appointment with a doctor (or organization)
- For doctor appointment (storeDoctorAppointment):
```json
{
  "target_user_id": <doctorUserId>,
  "target_role": "medecin" | "kine" | "orthophoniste" | "psychologue" | "clinique" | "pharmacie" | "parapharmacie" | "labo_analyse" | "centre_radiologie",
  "date_time": "YYYY-MM-DD HH:MM" | "YYYY-MM-DD HH:MM:SS",
  "reason": "string",
  "patient_name": "optional",
  "patient_phone": "optional",
  "patient_email": "optional",
  "announcement_id": "optional"
}
```
- Returns: `201` with created appointment summary

### GET /api/patient/appointments
- Returns the patient's appointments list (normalized fields)

### GET /api/appointments/{id}
- Returns appointment details for the patient

### PUT /api/appointments/{id}
- Reschedule/update an appointment (patient only)
```json
{ "date": "YYYY-MM-DD", "time": "HH:MM", "reason": "optional string" }
```
- Validates availability, future time (>= 30 minutes ahead)
- Returns updated appointment summary

### POST /api/appointments/{id}/cancel
- Cancels an appointment (patient only)
- Returns `{ message: "Rendez-vous annulé", id }`

---

## Schedules & Availability

### GET /api/doctors/{id}/available-hours?date=YYYY-MM-DD
- Returns hourly slots for selected date with status flags
```json
[
  { "time": "09:00", "available": true, "booked": false, "past": false },
  ...
]
```

### GET /api/appointments/booked-slots/{doctorId}?date=YYYY-MM-DD
- Returns `{ success: true, bookedSlots: ["HH:MM", ...] }`

---

## Notifications

### GET /api/notifications
- Returns notifications for authenticated user

### PUT /api/notifications/{id}/read
### PUT /api/notifications/read-all
- Mark single/all notifications as read

---

## Annonces (Public + Doctor)

### GET /api/annonces (public)
- Public list of active annonces
- Optional query: `search`, `category`

### GET /api/annonces/{id}
- Public annonce detail

### (Doctor Auth) /api/doctor/annonces [...]
- Full CRUD for doctor's own annonces (not needed on mobile)

---

## Patient Santé (Health Dossier)

### GET /api/patient/sante
- Returns all sections with items + `none` flag
```json
{
  "sante": {
    "documents": { "items": [...], "none": false },
    "antecedents_medicaux": { "items": [...], "none": false },
    "traitements_reguliers": { "items": [...], "none": false },
    "allergies": { "items": [...], "none": false },
    "antecedents_familiaux": { "items": [...], "none": false },
    "operations_chirurgicales": { "items": [...], "none": false },
    "vaccins": { "items": [...], "none": false },
    "mesures": { "items": [...], "none": false }
  }
}
```

### POST /api/patient/sante/section/{section}
- Update a section (except `documents` and `vaccins` which have dedicated endpoints)
```json
{ "items": [ ... ], "none": true | false }
```
- Returns `{ message, section, data: { items, none } }`

### Vaccines
- GET `/api/patient/sante/vaccins/catalog` → `{ catalog: string[] }`
- POST `/api/patient/sante/vaccins/add` → `{ name: string, date: YYYY-MM-DD }` → returns `{ vaccine, vaccins }`
- DELETE `/api/patient/sante/vaccins/{id}` → deletes one
- POST `/api/patient/sante/vaccins/none` → `{ none: boolean }`

### Documents
- POST `/api/patient/sante/documents/upload`
  - multipart/form-data, field: `file` (max 5MB)
  - Returns `{ document: { id, name, path, uploaded_at }, documents: [...] }`
- DELETE `/api/patient/sante/documents/{id}`

---

## Professional (Doctor) Quick Actions

### GET /api/doctor/stats
- Returns: `{ appointmentsUpcoming, totalPatients, totalAppointments, revenue }`

### GET /api/doctor/appointments
- Returns list mapped to `{ id, date, time_start, status, patient_name, ... }`

### GET /api/doctor/appointments/{id}
- Returns details (date, time, status, patient info, annonce info if linked)

### PUT /api/doctor/appointments/{id}/status
- `{ status: "confirmed" | "cancelled" | "pending" | "completed" | "missed" }`

### POST /api/professional/profile/toggle-availability
- No payload; toggles availability

---

## Notes & Constraints
- Avatar max size: 3MB; patient document max size: 5MB
- Appointment reschedule requires a future time (>= 30 minutes)
- Available hours compute from `horaires` JSON OR `horaire_start`/`horaire_end`, with booked & past slot filtering by date
- Search `/api/users` excludes professionals in vacation mode

---

## Implementation Order (Mobile)
1. Edit Profile + Avatar (patient)
2. Available Hours + Booked Slots in booking flow
3. Update/Reschedule Appointment
4. Annonces list + detail (public)
5. Patient Santé (overview + sections: vaccines, documents, allergies, treatments, surgeries, etc.)

Design reference across all screens: the patient Accueil page (colors, spacing, cards, icons).
