# Project Accrual Stopwatch Rules (Read Before Every Change)

This file contains the strict rules and goals for this project. Any future changes must align with these instructions.

---

## 🎯 The Core Goal
Provide an ultra-simplistic, raw-data, real-time live ticker calculating the accrued study + grace interest for HDFC Credila withdrawals, alongside credit card accounts tracking and on-campus shift income logs.

- **Zero Heavy Renderers:** No modern heavy frameworks like Next.js, React, tailwind Node modules, or split ports. 
- **Vanilla Setup:** A single port, single file `approach-2/index.html` executing entirely on the client-side.
- **Stopwatch Precision:** Live countdown calculating growth to the exact millisecond.
- **Permanent Entry storage:** Full browser `localStorage` persistent layer with JSON export/import backups.

---

## 🎨 Visual and UI Rules

### Multi-Tab Design
- Three distinct premium panels with micro-transitions:
  1. **Stopwatch & Active Debts:** Accrual cards + main stopwatch ticker + Net Liability/CC debt/Income snapshots.
  2. **Ledger & Entry Form:** Clean input form + searchable transaction logs with category-badge highlights.
  3. **Visual Analytics:** Lightweight interactive expense pie/donut chart.

### Stacked Cards (Left Column)
- 3 cards stacked vertically representing the 3 withdrawals.
- **NO label text:** Absolutely no text like "Withdrawn amount:", "Disbursal date:", or "Amount owing:".
- Only pure raw numbers or date formats.
- **Colors:**
  - Standard information must be in **black/muted-gray** (`#000000` / `#9CA3AF`).
  - Outstanding balances must be in **red** (`#EF4444`).
  - Active interest rate displayed in black/gray text.

### Summary Ticker Card (Right Column)
- Sticking to the right of the three stacked cards.
- **Top Left:** Total Disbursed amount in a large font.
- **Center:** The total additional owing amount (accrued interest total) updated live per millisecond.
- **Units:** Both INR and USD.
  - **INR** on top in a very large red font.
  - **USD** underneath in a slightly smaller bold red font.
- **Millisecond Ticker:** Must tick continuously to 2 decimal places.

---

## 🧮 Calculation Logic
- Simple interest calculations during the Study + Grace phase.
- Pro-rata second-by-second accumulation based on annual interest rates.
- Precise step-up rates applied per interval.
- Accurate calendar-month PMI deductions.
- Prepayments and Credit Card aggregates summed in real-time to deduct from outstanding values.

---

## 📊 Analytics & Charting
- Beautiful, lightweight SVG-based Donut charts.
- Zero dependency drawing using standard SVG circle elements (`stroke-dasharray` and `stroke-dashoffset`).
- Active mouse-hover highlighting on slices and legend cards for standard high-premium feel.

---

## 🧪 Testing & Verification
- Embedded browser unit test suite inside `index.html`.
- Accessible via query string parameter `?test=true` or a footer toggle.
- Must run in any browser to verify correctness after every code adjustment.

