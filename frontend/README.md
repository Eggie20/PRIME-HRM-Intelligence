# NBSC PRIME-HRM Intelligence Hub — Frontend Documentation

## Overview
The frontend is built entirely using **pure semantic HTML5, vanilla CSS (BEM methodology), and modern JavaScript (ES6+)**.
- ❌ **No React, Vue, or frontend frameworks**
- ❌ **Zero inline styles** (`style="..."` attributes are strictly prohibited)
- ❌ **Zero inline scripts** (`<script>` tags containing embedded code are strictly prohibited)
- ✅ **Every page lives in its own dedicated directory** with its own triad:
  - `{page-name}.html`
  - `{page-name}.css`
  - `{page-name}.js`
- ✅ **JSDoc documentation** for all JavaScript functions
- ✅ **Accessible HTML5 elements** with unique IDs for interactive targets

---

## Directory Architecture

```
frontend/
├── index.html                    # Public landing homepage
├── index.css                     # Landing styling & SARA teaser
├── index.js                      # Smooth scroll & session CTAs
│
├── shared/
│   ├── css/
│   │   ├── global.css            # Color tokens, typography, CSS reset
│   │   ├── components.css        # Buttons, cards, modals, toasts, tables, badges
│   │   ├── layout.css            # Sidebar, navbar, page grid wrappers
│   │   └── utilities.css         # Flexbox, spacing, typography helpers
│   ├── js/
│   │   ├── constants.js          # API_BASE_URL, ROLES, HIRING_STAGES, DEPARTMENTS
│   │   ├── utils.js              # Formatters (date, currency, file size), validation
│   │   ├── api.js                # Centralized fetch wrapper with Bearer token injection
│   │   ├── auth.js               # Route guards, token management, session state
│   │   └── components.js         # Dynamic DOM builders (toast, modal, spinner)
│   └── img/
│
├── vendor/
│   ├── chart.min.js              # Chart.js (standalone UMD)
│   ├── sortable.min.js           # Drag-and-drop Kanban engine
│   └── qrcode.min.js             # Client-side 2FA QR code engine
│
└── pages/
    ├── auth/
    │   ├── admin-login/          # Split-screen navy/gold staff login with demo presets
    │   ├── applicant-login/      # Applicant sign in
    │   ├── register/             # Applicant account registration
    │   ├── setup-2fa/            # TOTP setup + QR code
    │   ├── verify-2fa/           # 6-digit TOTP challenge
    │   └── forgot-password/      # Password recovery
    ├── dashboard/
    │   └── dashboard/            # HR Command Center with 4 Chart.js graphs
    ├── employees/
    │   ├── employee-list/        # Filterable employee table with pagination
    │   ├── employee-form/        # Add/edit employee
    │   ├── employee-detail/      # Profile viewer
    │   └── employee-import/      # Drag-and-drop Excel bulk importer
    └── programs/
        ├── program-list/         # Academic/operational programs directory
        └── program-form/         # Register/edit program
```

---

## Color Token Reference (from `shared/css/global.css`)

| Variable | Hex Code | Purpose |
|----------|----------|---------|
| `--color-primary-900` | `#0B1320` | Deepest midnight background |
| `--color-primary-800` | `#0F1B2D` | Official NBSC Midnight Navy |
| `--color-accent-500`  | `#D4A843` | Official NBSC Heritage Gold |
| `--color-success-500` | `#10B981` | Accredited / Active / Permanent |
| `--color-neutral-50`  | `#F8FAFC` | Light surface background |
