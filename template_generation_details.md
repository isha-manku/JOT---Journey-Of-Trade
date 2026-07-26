# Template Generation Engine Documentation

This document explains the inner workings of the custom Document Generation Engine built directly into the CRM's Node.js backend.

## Overview
Unlike standard template engines that require users to litter their Microsoft Word documents with ugly tags (e.g., `{{buyer_name}}`), this CRM uses a revolutionary **"Tagless Occurrence-Based Injection"** approach. Users can upload standard, unedited `.docx` files and visually map which words, phrases, or table cells should be replaced with form data.

## 1. How It Works

### Step 1: Upload & Extraction
When a user uploads a `.docx` file, the backend uses `pizzip` to read the binary file and extract the underlying `word/document.xml`. This XML file contains the actual text of the document, interspersed with complex Microsoft Word formatting tags.

### Step 2: Mapping Form Fields
In the **Settings -> Documents -> Configure Form** modal, the frontend (via Mammoth.js) renders an HTML preview of the uploaded document.
- The user highlights a piece of text (e.g., "Santos Port, Brazil") and assigns it to a form field (e.g., "Loading Port").
- The frontend captures the exact string and its **Occurrence Index** (to handle cases where the same string appears multiple times in the document).
- This schema is saved to both `doc_template_versions` (for the engine) and `doc_schema_fields` (to dynamically generate the data entry form).

### Step 3: XML Hydration (`documentHydrator.service.js`)
When a user generates a document, the engine must inject the form data back into the raw `.docx` XML:
1. **Regex Generation:** The engine takes the target text (e.g., `ceo@ronsonstrading.com`), safely escapes any special regex characters (like periods `.`), and constructs a custom Regular Expression.
2. **Bypassing XML:** Because a word like "Brazil" might be split internally by Word formatting tags (e.g., `<w:t>Bra</w:t><w:r><w:t>zil</w:t>`), the generated regex automatically injects `(?:<[^>]+>)*` between every character. This allows the engine to perfectly match text *across* formatting boundaries without destroying the document's styling.
3. **Replacement:** The engine scans the XML. If an occurrence index was specified (e.g., "replace the 3rd instance of 'Brazil'"), it tracks the matches and only injects the sanitized form data into the exact targeted occurrence.
4. **Repackaging:** The modified XML is injected back into the `.docx` zip archive using `PizZip`, producing a perfectly formatted Microsoft Word document containing the new data.

### Step 4: PDF Conversion
Finally, the system calls LibreOffice in headless mode (`soffice --headless --convert-to pdf`) to convert the hydrated `.docx` into a finalized PDF. This ensures 100% layout fidelity, preserving complex headers, footers, tables, and watermarks.

## Key Files Responsible
- **`backend/documentHydrator.service.js`**: The core engine. Handles PizZip XML extraction, regex generation, text replacement, and LibreOffice PDF conversion.
- **`backend/docplatform_router.js`**: The API controller for generating documents and fetching the PDF buffers.
- **`backend/settings_router.js`**: Handles template uploading, schema saving, and database synchronization.
- **`backend/crm-jot-frontend/src/components/SchemaEditorModal.js`**: The UI where users highlight text and map fields.
- **`backend/crm-jot-frontend/src/pages/GenerateDoc.js`**: The dynamic form UI that generates the inputs based on the database schema.
