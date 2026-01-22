I have verified the database schema and confirmed the column mapping. The original `lift_on` and `lift_of` columns (which were numeric costs) have been replaced by `almt_pickup` and `almt_drop` (which are text addresses). This means they must be **removed from all cost calculations** (Total, Margin, etc.) and treated as informational text fields.

**Verified Schema Mapping:**
*   `bills` -> `no_dn` (VARCHAR)
*   `lift_on` -> `almt_pickup` (TEXT)
*   `lift_of` -> `almt_drop` (TEXT)

**Implementation Plan:**

1.  **Backend Updates (`node_backend/routes/salesCost.js` & `dashboard.js`)**
    *   **Refactor SQL:** Update all `SELECT`, `INSERT`, `UPDATE` queries to use `no_dn`, `almt_pickup`, `almt_drop`.
    *   **Logic Change:** Remove `lift_on` and `lift_of` from the `total` and `margin` cost calculations, as they are now text fields (addresses).
    *   **Data Handling:** Update request body parsing to treat `almt_pickup`/`almt_drop` as strings, not numbers.
    *   **Export:** Update the Excel export to show "No. DN", "Alamat Pickup", and "Alamat Drop" instead of the old fields.

2.  **Frontend Updates (`tailadmin-vuejs-1.0.0/src/components/sales-cost/SalesCostForm.vue`)**
    *   **Form UI:** Replace "Bills" input with "No. DN".
    *   **Form UI:** Replace "Lift On" (Number) with "Alamat Pickup" (Textarea/Input).
    *   **Form UI:** Replace "Lift Off" (Number) with "Alamat Drop" (Textarea/Input).
    *   **Logic:** Update the payload sent to the backend to match the new field names.

3.  **Frontend View Updates**
    *   **Detail View (`DetailSalesCost.vue`):** Update labels and data binding to show the new fields.
    *   **Print View (`PrintSalesCost.vue`):** Update the print template to reflect the changes.
    *   **List View (`SalesCost.vue`):** Ensure no lingering references to old fields in filters or columns.

4.  **Verification**
    *   I will perform a codebase-wide search to ensure no references to `bills`, `lift_on`, or `lift_of` remain in the Sales Cost feature.
