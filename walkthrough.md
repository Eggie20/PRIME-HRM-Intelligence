# NBSC Candidate Portal & Footer Design System Overhaul

## 1. Overview of Completed Work
This update delivers an executive, minimalist redesign of the **NBSC Candidate Portal** navigation bar, standardizes the authentic NBSC shield branding, replaces raw unicode symbols with crisp vector SVG icons, separates the public guest tracker from the logged-in candidate's multi-application portfolio, and refines the institution-wide footer alignment.

---

## 2. Key Upgrades Delivered

### A. Candidate Portal Navigation Bar (`candidate-nav.css`)
- **Modular Stylesheet**: Centralized navigation styles in `frontend/pages/applicants/candidate-nav.css` to eliminate style drift across all candidate views.
- **Executive Aesthetics**:
  - Deep Academic Navy (`#002b5c`) background with 2px gold accent border (`#d4a843`).
  - Drop-shadow elevation (`box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18)`).
  - Authentic NBSC Shield Seal (`school_logo.png`) rendered with a 1.5px multi-directional white outline drop-shadow and smooth hover zoom.
  - Custom vector SVG icons for **Dashboard**, **Open positions**, **My Applications**, **Settings**, and **Sign out** (replacing raw emojis `▦`, `💼`, `🔍`, `⚙`).
  - Active pill indicators with gold background accents, bottom borders, and glow effects.
  - Candidate profile chip displaying user avatar (`CM`), candidate name (`Carlo Mendoza`), applicant role badge, gold-accented settings link, and red-hover sign-out button.
  - Full mobile drawer with smooth slide-down animation, candidate summary card, and responsive touch targets.

### B. Separation of Public vs. Candidate Application Tracking
- **Public Guest Tracker** (`frontend/pages/track-application/track-application.html`):
  - Accessible from the public job board and home pages.
  - Single-code lookup via radar/search icon for unregistered or guest applicants.
- **Candidate Portal Tracker** (`frontend/pages/applicants/application-track/application-track.html`):
  - Renamed to **"My Applications"** in the candidate navigation with a checklist SVG icon.
  - Integrated with the candidate's active portfolio (`NBSC-APP-2026-10001` Active, `NBSC-APP-2025-08420` Archived) via sidebar application switcher.

### C. Pages Integrated & Synchronized
1. [applicant-portal.html](file:///c:/NBSC%20PRIME-HRM%20Intelligence%20Hub/frontend/pages/applicants/applicant-portal/applicant-portal.html): Active on *Dashboard*.
2. [open-positions.html](file:///c:/NBSC%20PRIME-HRM%20Intelligence%20Hub/frontend/pages/applicants/open-positions/open-positions.html): Active on *Open positions*.
3. [application-track.html](file:///c:/NBSC%20PRIME-HRM%20Intelligence%20Hub/frontend/pages/applicants/application-track/application-track.html): Active on *My Applications*.
4. [profile-settings.html](file:///c:/NBSC%20PRIME-HRM%20Intelligence%20Hub/frontend/pages/applicants/profile-settings/profile-settings.html): Active on *Settings*.

### D. Footer Enhancements (`nbsc-footer.css`)
- Shield logo enlarged to **96px** with crisp 2px multi-directional white outline drop-shadow.
- 4 regulatory compliance seals (ISO 9001, CSC PRIME-HRM, Bagong Pilipinas, Transparency Seal) enlarged to **84px** with `flex-wrap: nowrap` on desktop.
- Centered bottom block with straightened, single-line `Powered by: Information and Communication Technology Management Office` text.

### E. Application Wizard Previous Button Contrast Fix (`apply.css`)
- Fixed low-contrast bug where the `← Previous` button rendered dark text (`#334155`) over a dark navy gradient (`#0F1B2D`) due to background-image inheritance from `components.css`.
- Standardized `.wizard-actions .btn--secondary` and `#btn-prev-*` to a clean, high-contrast white card button (`background: #ffffff; color: #1e293b; border: 1.5px solid #cbd5e1`) with interactive hover states (`#f8fafc`, deep navy text `#002b5c`, border `#94a3b8`).

### F. Application Wizard Mobile Responsiveness Fix (`apply.css`)
- **Resolved Viewport Overflow**:
  - Replaced fixed minimum grid sizing in `.wizard-stepper` with `repeat(4, minmax(0, 1fr))` so all 4 step indicators fit seamlessly across screen widths without forcing horizontal scroll or being pushed off-screen.
  - Eliminated `<legend>` floating behavior (`float: none !important; clear: both !important; display: block !important; width: 100% !important;`) and added proper text-wrapping rules (`word-wrap: break-word; overflow-wrap: break-word; white-space: normal;`), allowing long step headings (e.g. `Step 2: Educational & Professional Qualifications`) to wrap naturally without truncating mid-word.
  - Stacked `.wizard-actions` buttons vertically on mobile (`flex-direction: column-reverse !important; width: 100% !important; gap: 0.65rem !important;`), placing the primary action on top and the `← Previous` button full-width below it, preventing horizontal cut-off.
  - Responsive padding tiers for `#form-application-wizard` across standard breakpoints (`<= 768px`, `<= 480px`, and `<= 360px`) ensuring full content accessibility and zero horizontal overflow down to 320px viewports.

### G. Public Mobile Navigation Drawer White Redesign (`track-application.css`, `job-board-nav.css`, `index.css`)
- **Eliminated Dark Overlay**: Removed legacy `background: #0b1320` override that caused black-on-navy unreadable text when tapping the mobile hamburger toggle.
- **Institutional White Aesthetic**: Replaced with clean, high-contrast white card styling (`background: #ffffff !important; box-shadow: 0 16px 28px -4px rgba(0, 0, 0, 0.12); border-bottom: 2px solid #d4a843;`).
- **Enhanced Legibility & Interaction**: Navigation links now render in deep slate (`#1e293b`) with amber hover backgrounds and an official navy/gold accent left-border for the active route.

### H. Candidate Portal Navbar Mobile Sizing Fix (`candidate-nav.css`)
- **Resolved Hamburger Button Clipping**:
  - Replaced rigid `flex-shrink: 0` on `.brand` with flexible container bounds (`min-width: 0; flex: 1 1 auto; overflow: hidden;`) and added `flex-shrink: 0; margin-left: auto;` to `.nav-toggle-btn`.
  - Added mobile padding tiers for `.topbar-inner` (`padding: 8px 12px` on `<= 480px` down to `padding: 6px 8px` on `<= 360px` instead of `10px 24px`), preventing the navbar content from exceeding screen bounds.
  - Added responsive scaling for the NBSC seal (44px scaled to 34px / 30px) and font sizes for the brand title and subtitle (`PRIME-HRM Recruitment Suite • Level II Accredited`) with `text-overflow: ellipsis`, guaranteeing the hamburger button stays fully visible inside the screen margin.

### I. Enlarged Logo Seal & Candidate Dropdown Menu (`candidate-nav.css`)
- **Prominent Brand Identity**:
  - Enlarged NBSC seal from 44px to **52px** on desktop (and up to 44px on tablet / 40px on mobile) with reinforced 3D drop-shadows and hover zoom.
  - Scaled brand title text to **1.3rem (800 weight)** with enhanced letter-spacing and 0.76rem gold-accented subtitle.
- **Enlarged User Profile Dropdown Menu**:
  - Increased dropdown card width from 280px to **320px** with deeper elevation (`box-shadow: 0 20px 48px rgba(0, 0, 0, 0.5)`).
  - Enlarged avatar from 40px to **48px** with a 2px gold border.
  - Increased typography for candidate name (1.05rem), role badge, and email address.
  - Increased item padding (12px 14px) and SVG icon sizes from 17px to **20px** for easier touch navigation and enhanced visual hierarchy.

### J. Complete Candidate Navigation Dropdown & Mobile Drawer Suite
- **Unified Navigation Suite**:
  - Incorporated all primary navigation links directly into the candidate profile dropdown menu (`#user-dropdown-menu`) and the mobile navigation drawer (`#topbar-mobile-drawer`).
  - Dropdown & Mobile Drawer items now include:
    1. **Dashboard**: Candidate overview & summary (`applicant-portal.html`)
    2. **Open positions**: Explore active job vacancies (`open-positions.html`)
    3. **My Applications**: Status tracking & interview dockets (`application-track.html`)
    4. *[Divider]*
    5. **Settings**: Profile, credentials & ID proof (`profile-settings.html`)
    6. *[Divider]*
    7. **Sign out**: High-visibility sign-out action with red hover indicator (`#btn-applicant-logout` / `#btn-mobile-logout`)
- **Rich Typography & Microcopy**:
  - Styled with `.dropdown-item-title` / `.mobile-navlink-title` (semi-bold 600) and `.dropdown-item-sub` / `.mobile-navlink-sub` (subtle muted slate `#94a3b8`) for maximum clarity.
- **Dynamic Route Synchronization**:
  - Added route detection in `candidate-nav.js` to dynamically synchronize the `active` highlight state across the desktop topbar, profile dropdown, and mobile navigation drawer.

---

## 3. Verification & Validation
- **Navigation Markup & CSS**: Verified across all 4 candidate portal pages. Redundant topbar rules removed in favor of `candidate-nav.css`.
- **Database & Script Compatibility**: Validated `window.db` and `global.db` exports.
- **Responsive Layout**: Validated desktop and mobile drawer toggle behavior.
- **Wizard Navigation**: Verified `← Previous` button contrast and styling across all wizard steps.
- **Wizard Responsiveness**: Verified `#form-application-wizard` layout on mobile breakpoints with 100% width fluid bounds, zero horizontal overflow, natural multi-line heading wrapping, and stacked action buttons.
- **Public Mobile Navigation**: Verified clean white backdrop, gold accent border, and high-contrast links across Track Application, Job Board, and Home pages.
- **Candidate Portal Navbar**: Verified on `<= 768px`, `<= 480px`, and `<= 360px` mobile viewports with fully visible, unclipped hamburger toggle button and fluid brand typography.
- **Enlarged Elements**: Verified 52px logo seal, 320px dropdown menu, 48px avatar, and 20px icons on Candidate Portal.
- **Dropdown & Drawer Links**: Verified that Dashboard, Open positions, My Applications, Settings, and Sign out are unified across both desktop profile dropdown and mobile navigation drawer on all candidate views.

