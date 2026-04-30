
const SAS_URL = "PASTE_YOUR_SAS_URL_HERE";

const BASE = SAS_URL.split("?")[0];
const TOKEN = SAS_URL.split("?")[1];

let path = ""; // Store at the root

window.onload = () => {
  loadFiles();
};


function navigate(newPath) {
  path = newPath;
  updateBreadcrumb();
  loadFiles();
}

function updateBreadcrumb() {
  const bc = document.getElementById("breadcrumb");
  let html = `<span class="breadcrumb-item" onclick="navigate('')">My Drive</span>`;

  if (path !== "") {
    const parts = path.split("/").filter(p => p !== "");
    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      currentPath += parts[i] + "/";
      html += `<span class="breadcrumb-separator">/</span>`;
      html += `<span class="breadcrumb-item" onclick="navigate('${currentPath}')">${parts[i]}</span>`;
    }
  }
  bc.innerHTML = html;
}


let activeUploads = 0;
let completedUploads = 0;

function showToast() {
  document.getElementById("uploadToast").style.display = "flex";
}

function closeToast() {
  document.getElementById("uploadToast").style.display = "none";
  document.getElementById("toastItems").innerHTML = "";
  activeUploads = 0;
  completedUploads = 0;
}

function updateToastTitle() {
  const title = document.getElementById("toastTitle");
  if (activeUploads > 0) {
    title.innerText = `Uploading ${activeUploads} item${activeUploads > 1 ? 's' : ''}...`;
  } else if (completedUploads > 0) {
    title.innerText = `${completedUploads} upload${completedUploads > 1 ? 's' : ''} complete`;
  }
}


async function uploadFile(file) {
  if (!file) return;
  const url = `${BASE}/${path + file.name}?${TOKEN}`;

  showToast();
  activeUploads++;
  updateToastTitle();

  const itemId = 'upload-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const container = document.getElementById("toastItems");

  const div = document.createElement("div");
  div.className = "upload-item";
  div.id = itemId;

  div.innerHTML = `
    <span class="material-symbols-outlined upload-icon">insert_drive_file</span>
    <div class="upload-details">
      <div class="upload-name" title="${file.name}">${file.name}</div>
      <div class="upload-progress">
        <div class="upload-progress-bar"></div>
      </div>
    </div>
    <span class="material-symbols-outlined upload-status-icon" id="cancel-${itemId}" title="Cancel">close</span>
  `;
  container.prepend(div);

  const controller = new AbortController();
  const signal = controller.signal;

  document.getElementById(`cancel-${itemId}`).onclick = () => {
    controller.abort();
  };

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "x-ms-blob-type": "BlockBlob" },
      body: file,
      signal: signal
    });

    if (!res.ok) {
      throw new Error(`Upload failed with status: ${res.status}`);
    }

    activeUploads--;
    completedUploads++;
    updateToastTitle();

    const item = document.getElementById(itemId);
    item.classList.add("completed");
    document.getElementById(`cancel-${itemId}`).innerText = "check_circle";
    document.getElementById(`cancel-${itemId}`).title = "Completed";
    document.getElementById(`cancel-${itemId}`).onclick = null;

    loadFiles();
  } catch (err) {
    if (err.name === 'AbortError') {
      activeUploads--;
      updateToastTitle();

      const item = document.getElementById(itemId);
      item.classList.add("cancelled");
      document.getElementById(`cancel-${itemId}`).innerText = "error";
      document.getElementById(`cancel-${itemId}`).title = "Cancelled";
      document.getElementById(`cancel-${itemId}`).onclick = null;
    } else {
      console.error("Upload error:", err);
      activeUploads--;
      updateToastTitle();
      const item = document.getElementById(itemId);
      item.classList.add("cancelled");
      document.getElementById(`cancel-${itemId}`).innerText = "error";
      document.getElementById(`cancel-${itemId}`).title = "Error: " + err.message;
    }
  }
}

document.getElementById("fileInput").addEventListener("change", e => {
  uploadFile(e.target.files[0]);
  e.target.value = "";
});


function openInputModal(title, submitText, initialValue, onSubmit) {
  document.getElementById("inputModalTitle").innerText = title;
  const input = document.getElementById("inputModalInput");
  input.value = initialValue;

  const submitBtn = document.getElementById("inputModalSubmit");
  submitBtn.innerText = submitText;
  submitBtn.onclick = () => {
    if (input.value.trim() !== "") {
      closeInputModal();
      onSubmit(input.value.trim());
    }
  };

  document.getElementById("inputModal").style.display = "flex";
  input.focus();
  if (initialValue) {
    input.setSelectionRange(0, initialValue.lastIndexOf(".") > 0 ? initialValue.lastIndexOf(".") : initialValue.length);
  }
}

function closeInputModal() {
  document.getElementById("inputModal").style.display = "none";
}

function openConfirmModal(title, text, submitText, onSubmit) {
  document.getElementById("confirmModalTitle").innerText = title;
  document.getElementById("confirmModalText").innerText = text;

  const submitBtn = document.getElementById("confirmModalSubmit");
  submitBtn.innerText = submitText;
  submitBtn.onclick = () => {
    closeConfirmModal();
    onSubmit();
  };

  document.getElementById("confirmModal").style.display = "flex";
}

function closeConfirmModal() {
  document.getElementById("confirmModal").style.display = "none";
}

function createCategory() {
  openInputModal("New folder", "Create", "", async (name) => {
    const folderPath = path + name + "/";
    const encodedFile = folderPath.split('/').map(encodeURIComponent).join('/');
    const url = `${BASE}/${encodedFile}.placeholder?${TOKEN}`;

    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: { "x-ms-blob-type": "BlockBlob" },
        body: "placeholder"
      });

      if (!res.ok) throw new Error("Failed to create category");
      loadFiles();
    } catch (err) {
      alert("Error creating category: " + err.message);
    }
  });
}

/* Drag Drop */
const drop = document.getElementById("dropArea");

drop.ondragover = e => {
  e.preventDefault();
  drop.classList.add('dragover');
};

drop.ondragleave = e => {
  e.preventDefault();
  drop.classList.remove('dragover');
};

drop.ondrop = e => {
  e.preventDefault();
  drop.classList.remove('dragover');
  if (e.dataTransfer.files.length) {
    uploadFile(e.dataTransfer.files[0]);
  }
};


async function loadFiles() {
  if (!SAS_URL) return;

  try {
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    // Add delimiter=/ to get folders as BlobPrefix
    const res = await fetch(`${SAS_URL}&restype=container&comp=list&prefix=${encodedPath}&delimiter=/`);
    if (!res.ok) return;
    const text = await res.text();

    const xml = new DOMParser().parseFromString(text, "application/xml");

    const list = document.getElementById("fileList");
    list.innerHTML = "";

    // 1. Load Categories (Folders)
    const prefixes = xml.getElementsByTagName("BlobPrefix");
    for (let i = 0; i < prefixes.length; i++) {
      const fullPath = prefixes[i].getElementsByTagName("Name")[0].textContent;
      const folderName = fullPath.replace(path, "").replace("/", "");

      const div = document.createElement("div");
      div.className = "file-card folder-card";

      div.innerHTML = `
        <div class="file-header" onclick="navigate('${fullPath}')">
          <span class="material-symbols-outlined icon" style="color: #5f6368;">folder</span>
          <span class="file-name" title="${folderName}">${folderName}</span>
        </div>
        <div class="file-actions">
          <button onclick="renameCategory('${fullPath}', '${folderName}')" title="Rename Category"><span class="material-symbols-outlined">edit</span></button>
          <button onclick="delCategory('${fullPath}', '${folderName}')" title="Delete Category"><span class="material-symbols-outlined">delete</span></button>
        </div>
      `;

      list.appendChild(div);
    }

    // 2. Load Files
    const blobs = xml.getElementsByTagName("Blob");
    for (let i = 0; i < blobs.length; i++) {
      const nameNode = blobs[i].getElementsByTagName("Name")[0];
      const full = nameNode.textContent;
      const short = full.replace(path, "");

      if (short === ".placeholder" || short === "") continue;

      // Determine icon based on extension
      let icon = "draft";
      const lower = short.toLowerCase();
      if (lower.endsWith(".jpg") || lower.endsWith(".png") || lower.endsWith(".jpeg") || lower.endsWith(".gif")) icon = "image";
      else if (lower.endsWith(".pdf")) icon = "picture_as_pdf";
      else if (lower.endsWith(".mp4")) icon = "movie";
      else if (lower.endsWith(".zip") || lower.endsWith(".rar")) icon = "folder_zip";

      const div = document.createElement("div");
      div.className = "file-card";

      div.innerHTML = `
        <div class="file-header">
          <span class="material-symbols-outlined icon">${icon}</span>
          <span class="file-name" title="${short}">${short}</span>
        </div>
        <div class="file-actions">
          <button onclick="preview('${full}')" title="Preview"><span class="material-symbols-outlined">visibility</span></button>
          <button onclick="renameFile('${full}', '${short}')" title="Rename"><span class="material-symbols-outlined">edit</span></button>
          <button onclick="share('${full}')" title="Share"><span class="material-symbols-outlined">link</span></button>
          <button onclick="del('${full}')" title="Delete"><span class="material-symbols-outlined">delete</span></button>
        </div>
      `;

      list.appendChild(div);
    }
  } catch (err) {
    console.error("Error loading files:", err);
  }
}

function preview(file) {
  const encodedFile = file.split('/').map(encodeURIComponent).join('/');
  const url = `${BASE}/${encodedFile}?${TOKEN}`;
  const modal = document.getElementById("previewModal");
  const content = document.getElementById("previewContent");

  const lower = file.toLowerCase();
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif")) {
    content.innerHTML = `<img src="${url}">`;
  } else if (lower.endsWith(".pdf")) {
    content.innerHTML = `<iframe src="${url}"></iframe>`;
  } else {
    content.innerHTML = `<p style="color: white; font-family: system-ui, sans-serif;">Preview not available. <a href="${url}" target="_blank" style="color: #8ab4f8; text-decoration: none;">Download File</a></p>`;
  }

  modal.style.display = "block";
}

function closePreview() {
  document.getElementById("previewModal").style.display = "none";
  document.getElementById("previewContent").innerHTML = ""; // clear content to stop media playback
}

function share(file) {
  const encodedFile = file.split('/').map(encodeURIComponent).join('/');
  const url = `${BASE}/${encodedFile}?${TOKEN}`;
  prompt("Share this link:", url);
}

function renameFile(fullPath, currentName) {
  openInputModal("Rename file", "OK", currentName, async (newName) => {
    if (newName === currentName) return;

    const oldFileParts = fullPath.split("/");
    oldFileParts.pop(); // remove old name
    const dirPath = oldFileParts.join(oldFileParts.length > 0 ? "/" : "");
    const newFullPath = (dirPath ? dirPath + "/" : "") + newName;

    const encodedOld = fullPath.split('/').map(encodeURIComponent).join('/');
    const encodedNew = newFullPath.split('/').map(encodeURIComponent).join('/');

    const sourceUrl = `${BASE}/${encodedOld}?${TOKEN}`;
    const targetUrl = `${BASE}/${encodedNew}?${TOKEN}`;

    try {
      // 1. Copy the blob to the new name
      const copyRes = await fetch(targetUrl, {
        method: "PUT",
        headers: { "x-ms-copy-source": sourceUrl }
      });

      if (!copyRes.ok) throw new Error("Failed to rename (copy)");

      // 2. Delete the old blob
      await fetch(`${BASE}/${encodedOld}?${TOKEN}`, {
        method: "DELETE"
      });

      loadFiles();
    } catch (err) {
      alert("Rename error: " + err.message);
    }
  });
}

function renameCategory(oldPath, oldName) {
  openInputModal("Rename folder", "OK", oldName, async (newName) => {
    if (newName === oldName) return;

    try {
      // 1. Get all blobs starting with oldPath
      const res = await fetch(`${SAS_URL}&restype=container&comp=list&prefix=${encodeURIComponent(oldPath)}`);
      if (!res.ok) throw new Error("Failed to list category contents");
      const text = await res.text();
      const xml = new DOMParser().parseFromString(text, "application/xml");
      const blobs = xml.getElementsByTagName("Blob");

      // 2. Loop and rename each
      const dirPath = oldPath.substring(0, oldPath.length - oldName.length - 1);
      const newPath = (dirPath ? dirPath : "") + newName + "/";

      for (let i = 0; i < blobs.length; i++) {
        const full = blobs[i].getElementsByTagName("Name")[0].textContent;
        const newFull = full.replace(oldPath, newPath);

        const encodedOld = full.split('/').map(encodeURIComponent).join('/');
        const encodedNew = newFull.split('/').map(encodeURIComponent).join('/');

        const sourceUrl = `${BASE}/${encodedOld}?${TOKEN}`;
        const targetUrl = `${BASE}/${encodedNew}?${TOKEN}`;

        // Copy
        const copyRes = await fetch(targetUrl, {
          method: "PUT",
          headers: { "x-ms-copy-source": sourceUrl }
        });

        if (!copyRes.ok) throw new Error("Failed to copy " + full);

        // Delete
        await fetch(`${BASE}/${encodedOld}?${TOKEN}`, { method: "DELETE" });
      }

      loadFiles();
    } catch (err) {
      alert("Rename category error: " + err.message);
    }
  });
}

function del(file) {
  const shortName = file.split('/').pop();
  openConfirmModal("Delete file?", `Are you sure you want to delete "${shortName}"?`, "Delete", async () => {
    const encodedFile = file.split('/').map(encodeURIComponent).join('/');
    await fetch(`${BASE}/${encodedFile}?${TOKEN}`, {
      method: "DELETE"
    });
    loadFiles();
  });
}

function delCategory(folderPath, folderName) {
  openConfirmModal("Delete folder?", `Are you sure you want to delete "${folderName}" and ALL its contents?`, "Delete", async () => {
    try {
      // 1. Get all blobs starting with folderPath
      const res = await fetch(`${SAS_URL}&restype=container&comp=list&prefix=${encodeURIComponent(folderPath)}`);
      if (!res.ok) throw new Error("Failed to list category contents");
      const text = await res.text();
      const xml = new DOMParser().parseFromString(text, "application/xml");
      const blobs = xml.getElementsByTagName("Blob");

      for (let i = 0; i < blobs.length; i++) {
        const full = blobs[i].getElementsByTagName("Name")[0].textContent;
        const encodedFile = full.split('/').map(encodeURIComponent).join('/');
        await fetch(`${BASE}/${encodedFile}?${TOKEN}`, { method: "DELETE" });
      }

      loadFiles();
    } catch (err) {
      alert("Delete category error: " + err.message);
    }
  });
}