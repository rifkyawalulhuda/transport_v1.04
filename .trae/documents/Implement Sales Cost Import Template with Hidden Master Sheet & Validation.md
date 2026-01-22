I will implement the Sales Cost Import/Export enhancements as follows:

### 1. Backend Routes (`node_backend/routes/salesCost.js`)

**A. New Endpoint: `GET /template`**
I will create a route to generate the Excel import template with the following structure:

*   **Sheet "Master" (Hidden: `veryHidden`)**:
    *   Populated with live data from MySQL:
        *   **Customer**: ID, Name, Display (`ID - Name`)
        *   **Driver**: ID, Name, Display (`ID - Name`)
        *   **Route (Area)**: ID, Name, Display (`ID - Name`)
        *   **Truck**: ID, No Police, Display (`ID - No Police`)
    *   **Named Ranges**: I will define workbook-level names (`CUSTOMER_LIST`, `DRIVER_LIST`, `ROUTE_LIST`, `TRUCK_LIST`) pointing to the dynamic rows in the Master sheet.

*   **Sheet "SalesCost"**:
    *   Columns: Standard Sales Cost fields + "Temp ID" (for linking DNs).
    *   **Data Validation**: 
        *   Columns "Customer", "Driver", "Route", "Truck" will use the Named Ranges (e.g., `=CUSTOMER_LIST`) to show the "ID - Name" dropdown.
    *   **Header Updates**: Renaming headers to indicate format (e.g., "Customer (ID - Nama)").

*   **Sheet "DNList"**:
    *   Columns: "Temp ID" (to link to SalesCost), "No DN", "Qty", "PKG" (Static dropdown: IBC, CTN, PIL, DRM), etc.

**B. New Endpoint: `POST /import`**
I will implement the import logic using `multer` (memory storage) and `exceljs`:

1.  **Parsing**: Read "SalesCost" and "DNList" sheets.
2.  **ID Extraction**: For dropdown columns, I will implement a parser to split the string `ID - Name` by `" - "` and extract the numeric ID.
3.  **Validation**:
    *   Ensure extracted IDs are valid numbers and > 0.
    *   (Optional) Check if the IDs exist in the database for data integrity.
4.  **Database Insertion**:
    *   Insert `sales_cost` records first to generate `id_sales_cost`.
    *   Map DN items to the new `id_sales_cost` using the "Temp ID" (or a simplified row-based assumption if you prefer, but "Temp ID" is safer).
    *   Upsert/Insert into MongoDB `sales_cost_dn` collection.

### 2. Dependencies
*   I will reuse the existing `db` connection and `SalesCostDN` model.
*   I will verify `multer` is available or add it if missing (it appears to be used in other files).

### 3. Verification
*   I will confirm that the "Master" sheet is hidden in the generated file.
*   I will confirm that the dropdowns work and show the "ID - Name" format.
*   I will confirm that the import successfully strips the name and saves the correct ID to the database.