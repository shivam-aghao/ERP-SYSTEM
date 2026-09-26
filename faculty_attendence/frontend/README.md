# SSGMCE, Shegaon - Teacher Attendance ERP Portal
### Shri Sant Gajanan Maharaj College Of Engineering, Shegaon

A modern, responsive, touch & pointer-enabled **Teacher Attendance Management Module** designed for SSGMCE College ERP.

Built with clean, vanilla HTML5, CSS3 (Custom Properties, CSS Grid, Flexbox), and modular ES6+ JavaScript.

---

## 🎯 Attendance Workflow

The system enforces the strict 8-step College ERP flow:

```
ATTENDANCE HOME
      ↓
DEPARTMENT SELECTION (CSE, IT, ASH, MECH, EE, ENTC)
      ↓
CLASS SELECTION (e.g., 2R1, 2R2, 3R, 4R, 2N1, etc.)
      ↓
DATE SELECTION (Interactive Academic Calendar)
      ↓
SUBJECT SELECTION (Data Structures, Java, etc.)
      ↓
STUDENT ATTENDANCE (Swipe Deck & Roster List)
      ↓
SUMMARY & REVIEW (Doughnut Chart, Present/Absent Rosters, Inline Edit)
      ↓
SAVE DRAFT / SUBMIT ATTENDANCE (Duplicate Check & Database Lock)
```

---

## 🎨 Theme & Color Palette

- **Primary**: `#0B5CAD`
- **Secondary**: `#1565C0`
- **Accent**: `#00A6D6`
- **Navy**: `#0B5CAD`
- **White**: `#FFFFFF`
- **Background**: `#F4F8FC`
- **Text**: `#263238`
- **Muted**: `#64748B`

---

## 🚀 Key Features

### 1. Pointer-Based Swipe Engine (`js/swipeEngine.js`)
- Full support for **Touch**, **Mouse Drag**, and **Pointer Events**.
- Physics-based card drag with tilt angle and opacity modulation.
- Dynamic stamps: **✓ PRESENT** (Green) and **✕ ABSENT** (Red) reveal as drag distance increases past threshold.
- Pure student focus: **ROLL NUMBER** + **STUDENT NAME** without profile picture clutter.
- Desktop controls: `[ ← ABSENT ]` and `[ PRESENT → ]`.
- **Keyboard Shortcuts**:
  - `→` (Arrow Right): Mark **Present**
  - `←` (Arrow Left): Mark **Absent**
  - `Space`: Skip / Next
  - `Backspace` / `Ctrl+Z`: Undo previous student

### 2. Dual View Modes
- **Card Swipe Deck**: High-speed Tinder/deck-style marking ideal for touchscreens and quick roll call.
- **Roster List View**: Clean roster list with student initials, PRN, and toggleable status pills (inspired by mobile ERP roster designs).

### 3. Academic Calendar (`Step 4`)
- Month-by-month navigation with "Today" quick button.
- Highlights: Today highlighted in `#00A6D6`, selected date in `#0B5CAD`.
- Academic date validation (flags Sundays/holidays).

### 4. Summary, Analytics & Edit Mode (`Step 7`)
- Real-time SVG **Doughnut Chart** displaying percentage.
- Breakdown counters: Total Students, Present Count, Absent Count, Attendance Rate %.
- Two dedicated scrollable rosters: **Present Students** vs **Absent Students**.
- **Edit Attendance**: Searchable student table with toggle switches to flip statuses before submission.

### 5. Data Persistence & Backend Ready (`js/attendanceService.js`)
- Integrated with `localStorage` for drafts and historical attendance logs.
- Promise-based service architecture ready to hook into **REST API**, **PostgreSQL**, **MySQL**, **Firebase**, or **Supabase**.
- **Duplicate submission prevention**: Blocks accidental duplicate submissions for the same Department, Class, Date, and Subject.

---

## 📂 Project Structure

```
ERP System/
├── index.html              # Main single-page application layout
├── css/
│   └── styles.css          # Design system, CSS grid, card animations, responsive rules
├── js/
│   ├── data.js             # Departments, classes, subjects, and 60-student roster generator
│   ├── attendanceService.js# Service abstraction with draft/submit API simulation
│   ├── swipeEngine.js      # Pointer drag physics, tilt, swipe fling, keyboard controls
│   └── app.js              # Application controller, stepper, calendar, summary & modals
└── README.md               # Documentation & usage guide
```

---

## 💻 How to Run

1. Simply double-click `index.html` to open it in any modern browser (Chrome, Edge, Firefox, Safari).
2. Or serve it via any static server, e.g.:
   ```powershell
   npx serve .
   ```
   or
   ```powershell
   python -m http.server 8000
   ```

