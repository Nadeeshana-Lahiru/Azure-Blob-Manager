# Azure Blob Manager ☁️

A modern, lightweight, and serverless web-based file manager that directly integrates with **Azure Blob Storage**. Inspired by the sleek interface of Google Drive, this application allows users to manage their cloud files entirely through the browser using the Azure REST API and Shared Access Signatures (SAS).

## ✨ Features

- **Google Drive Aesthetics**: A clean, responsive, Material-Design-inspired user interface.
- **Serverless Architecture**: No backend required! Connects directly to Azure Blob Storage via browser `fetch` requests.
- **Complete CRUD Operations**:
  - **Create**: Upload files with a dynamic progress toast manager, and create virtual folders (categories).
  - **Read**: Preview images and PDFs directly in the browser, and navigate seamlessly through deeply nested folders using breadcrumbs.
  - **Update**: Rename files and folders directly from the UI (handles complex Azure Blob copying behind the scenes).
  - **Delete**: Safely delete individual files or wipe out entire folders recursively.
- **Drag & Drop**: Seamlessly drag and drop files onto the dashboard to upload them to your cloud.

## 🚀 Setup & Installation

Because this is a static frontend application, you do not need to install any Node.js packages. However, you must configure your Azure Storage Account properly.

### 1. Azure CORS Configuration
To allow your web browser to communicate directly with Azure, you must enable Cross-Origin Resource Sharing (CORS) on your Storage Account:
1. Go to your Azure Portal -> Storage Account -> **Settings** -> **Resource sharing (CORS)**.
2. Under the **Blob service** tab, add a new rule:
   - **Allowed origins**: `*` *(or your specific hosted domain / `http://127.0.0.1:5500` for local dev)*
   - **Allowed methods**: Select `GET`, `PUT`, `OPTIONS`, `DELETE`, `POST`
   - **Allowed headers**: `*`
   - **Exposed headers**: `*`
   - **Max age**: `86400`
3. Save the rule.

### 2. Generate a SAS Token
The application authenticates using a SAS URL. 
1. Go to your Azure Portal -> Storage Account -> Containers.
2. Select your target container.
3. Click **Generate SAS** (Shared Access Signature).
4. **CRITICAL**: Ensure your Permissions include exactly: **Read, Add, Create, Write, Delete, and List** (`sp=racwdl`). *If you forget the **List** permission, the application will not be able to display your folders!*
5. Copy the generated **Blob SAS URL**.

### 3. Connect the Application
1. Clone this repository to your local machine.
2. Open `script.js` in your code editor.
3. Locate the `SAS_URL` constant at the very top of the file:
   ```javascript
   const SAS_URL = "PASTE_YOUR_SAS_URL_HERE";
   ```
4. Replace `"PASTE_YOUR_SAS_URL_HERE"` with the Blob SAS URL you generated in Step 2.
5. Open `index.html` in your web browser (or use a local server like Live Server).

## 🛠️ Built With

- HTML5
- Vanilla CSS3
- Vanilla JavaScript (ES6+)
- Azure Blob Storage REST API
