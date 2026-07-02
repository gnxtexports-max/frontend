You are a senior product designer. Design a modern, minimal "Expenses Page" for a Transport Management System (TMS) web application.

Goal:
The page should primarily focus on **clear, structured table-based expense tracking**, with supporting UI elements for filtering and quick insights.

---

Layout:

* Desktop frame (1440px width)
* Left vertical sidebar (dark theme)
* Main content area (light background, high readability)
* Use Auto Layout and an 8px spacing system

---

Sidebar:

* Sections:

  * Overview
  * Operations
  * Fleet Management
  * Master Data
  * Analytics

* Menu Items:

  * Dashboard
  * Shipments
  * Trip Tracking
  * Expenses (ACTIVE STATE – highlighted)
  * Vehicles
  * Drivers
  * Dealers
  * Product Data
  * Reports

* Style:

  * Minimal outline icons
  * Subtle active background highlight
  * Clean spacing and alignment

---

Main Content:

1. Header Section:

* Title: Expenses
* Subtitle: Track and manage shipment-related costs
* Primary CTA: "+ Add Expense" (top-right, prominent button)

---

2. Filters Bar (Horizontal Card – Compact & Functional):

* Search input (Shipment ID / Driver)

* Date range picker

* Dropdown filters:

  * Shipment
  * Vehicle
  * Driver
  * Expense Type

* Design:

  * Single-row layout
  * Rounded inputs (8px radius)
  * Light borders, minimal shadows
  * Optimized for quick scanning

---

3. Summary Cards (Secondary Importance):

* Total Expenses
* Fuel Cost
* Toll Charges
* Maintenance
* Other Expenses

Each card:

* Label
* ₹ Amount (clear hierarchy)
* Small icon
* Minimal visual weight (do NOT overpower table)
* Soft shadow or border

---

4. PRIMARY FOCUS — Expenses Table (Dominant Section):

Design a highly readable, data-heavy table.

Columns:

* Shipment ID
* Date
* Driver Name
* Vehicle ID
* Expense Type
* Amount (₹)
* Payment Mode (Cash / UPI / Card)
* Status (Approved / Pending)
* Actions (View / Edit)

Table UX:

* Sticky header
* Row hover state
* Alternating row background (very subtle)
* Status badges:

  * Approved → soft green
  * Pending → soft yellow
* Right-align numeric values (Amount column)
* Truncate long text with tooltip
* Pagination at bottom
* Optional: column sorting + filtering

Visual Priority:
The table should take **70–80% of visual attention**.

---

5. Add Expense Modal:

Trigger: "+ Add Expense" button

Fields:

* Shipment ID (dropdown)
* Date picker
* Expense Type (dropdown)
* Amount input (₹ prefix)
* Payment Mode selector
* Notes (textarea)
* Upload Receipt (drag & drop or file upload)

Actions:

* Cancel (secondary)
* Save Expense (primary)

---

Design Style:

* Minimal SaaS dashboard (similar to Stripe / Linear / Notion)
* Neutral palette:

  * Background: light gray / white
  * Text: dark gray
  * Accent: single subtle brand color
* Border radius: 8–12px
* Soft shadows (very light)
* Clean sans-serif typography

---

UX Enhancements:

* Highlight high-expense rows subtly (light red tint or indicator)
* Show ₹ currency consistently
* Enable quick scanning of financial data
* Keep interface uncluttered and professional
* Ensure table readability is the top priority over decorative UI

---

Output Requirements:

* Structure using Auto Layout
* Component-based design (Cards, Table, Filters, Modal)
* Ready for direct implementation in Figma
* Maintain consistent spacing, alignment, and hierarchy
