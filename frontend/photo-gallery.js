// ===============================
// CONFIG
// ===============================
const API_BASE = "http://127.0.0.1:8000";

// ===============================
// STATE
// ===============================
let isAdmin = false;
let photos = [];
let currentView = 'grid';
let currentSort = 'date-desc'; // default sort
let editingPhoto = null;

// ===============================
// TOAST NOTIFICATION SYSTEM
// ===============================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===============================
// ELEMENTS
// ===============================
const photoContainer = document.getElementById("photoContainer");
const emptyState = document.getElementById("emptyState");

const gridViewBtn = document.getElementById("gridView");
const listViewBtn = document.getElementById("listView");

const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminControls = document.getElementById("adminControls");

const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");

const addPhotoBtn = document.getElementById("addPhotoBtn");
const logoutBtn = document.getElementById("logoutBtn");

const photoModal = document.getElementById("photoModal");
const photoForm = document.getElementById("photoForm");
const photoModalTitle = document.getElementById("photoModalTitle");

const photoFile = document.getElementById("photoFile");
const photoTitle = document.getElementById("photoTitle");
const photoDescription = document.getElementById("photoDescription");
const photoPreview = document.getElementById("photoPreview");

const viewerModal = document.getElementById("imageViewerModal");
const viewerImage = document.getElementById("viewerImage");
const viewerTitle = document.getElementById("viewerTitle");
const viewerDescription = document.getElementById("viewerDescription");

const sortSelect = document.getElementById("sortSelect");

// ===============================
// LOGIN
// ===============================
adminLoginBtn.onclick = () => loginModal.style.display = "block";

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;

    if (u === "admin" && p === "nlcil@2026") {
        isAdmin = true;
        adminControls.style.display = "flex";
        loginModal.style.display = "none";
        showToast("Login successful!", "success");
        loadPhotos();
    } else {
        showToast("Invalid username or password", "error");
    }
});

logoutBtn.onclick = () => {
    isAdmin = false;
    adminControls.style.display = "none";
    showToast("Logged out successfully", "info");
    loadPhotos();
};

// ===============================
// VIEW SWITCH
// ===============================
gridViewBtn.onclick = () => switchView('grid');
listViewBtn.onclick = () => switchView('list');

function switchView(view) {
    currentView = view;

    if (view === 'grid') {
        photoContainer.className = 'photo-grid';
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    } else {
        photoContainer.className = 'photo-list';
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
    }
}

// ===============================
// SORTING
// ===============================
sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    sortPhotos();
    renderPhotos();
});

function sortPhotos() {
    switch(currentSort) {
        case 'name-asc':
            photos.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            photos.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'date-asc':
            photos.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'date-desc':
            photos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
    }
}

// ===============================
// LOAD PHOTOS (FROM BACKEND)
// ===============================
async function loadPhotos() {
    try {
        const res = await fetch(`${API_BASE}/photos-list/`);
        const data = await res.json();

        if (!data.length) {
            emptyState.style.display = "block";
            photoContainer.innerHTML = "";
            return;
        }

        emptyState.style.display = "none";

        // Convert backend â†’ UI format
        photos = data.map((photo, index) => ({
            id: index + 1,
            title: photo.title || photo.filename,
            description: photo.description || "No description available",
            imageUrl: `${API_BASE}${photo.url}`,
            filename: photo.filename,
            created_at: photo.created_at || new Date().toISOString()
        }));

        sortPhotos();
        renderPhotos();

    } catch (err) {
        console.error(err);
        showToast("Failed to load photos", "error");
    }
}

// ===============================
// RENDER PHOTOS (UI FROM hp2)
// ===============================
function renderPhotos() {
    photoContainer.innerHTML = photos.map(photo => `
        <div class="photo-card" data-id="${photo.id}">

            <img src="${photo.imageUrl}"
                 onclick="openViewer('${photo.imageUrl}', '${escapeHtml(photo.title)}', '${escapeHtml(photo.description)}')">

            <div class="photo-info">
                <h3>${escapeHtml(photo.title)}</h3>
                <p>${escapeHtml(photo.description)}</p>

                ${isAdmin ? `
                <div class="photo-actions">
                    <button class="action-btn edit-btn" onclick="openEditPhotoModal('${photo.filename}', '${escapeHtml(photo.title)}', '${escapeHtml(photo.description)}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete-btn" onclick="deletePhoto('${photo.filename}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>` : ""}
            </div>
        </div>
    `).join('');
}

// ===============================
// HELPER: ESCAPE HTML
// ===============================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===============================
// IMAGE VIEWER
// ===============================
function openViewer(src, title, desc) {
    viewerModal.style.display = "block";
    viewerImage.src = src;
    viewerTitle.textContent = title;
    viewerDescription.textContent = desc;
}

// ===============================
// IMAGE PREVIEW
// ===============================
photoFile.addEventListener("change", () => {
    const file = photoFile.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        photoPreview.innerHTML = `<img src="${reader.result}">`;
        photoPreview.classList.add("active");
    };
    reader.readAsDataURL(file);
});

// ===============================
// OPEN ADD MODAL
// ===============================
addPhotoBtn.onclick = () => {
    editingPhoto = null;
    photoModalTitle.innerHTML = '<i class="fas fa-plus"></i> Add Photo';
    photoForm.reset();
    photoPreview.classList.remove("active");
    photoPreview.innerHTML = "";
    photoFile.required = true;
    photoModal.style.display = "block";
};

// ===============================
// OPEN EDIT MODAL
// ===============================
function openEditPhotoModal(filename, title, description) {
    editingPhoto = filename;
    photoModalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Photo';
    photoTitle.value = title;
    photoDescription.value = description;
    photoFile.required = false;
    photoPreview.classList.remove("active");
    photoPreview.innerHTML = "";
    photoModal.style.display = "block";
}

// ===============================
// UPLOAD / EDIT PHOTO
// ===============================
photoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!editingPhoto && !photoFile.files[0]) {
        showToast("Please select an image", "error");
        return;
    }

    const formData = new FormData();

    if (photoFile.files[0]) {
        formData.append("file", photoFile.files[0]);
    }

    formData.append("title", photoTitle.value);
    formData.append("description", photoDescription.value);

    try {
        let res;

        if (editingPhoto) {
            // Edit existing photo
            res = await fetch(`${API_BASE}/edit-photo/${editingPhoto}`, {
                method: "PUT",
                body: formData
            });
        } else {
            // Upload new photo
            res = await fetch(`${API_BASE}/upload/`, {
                method: "POST",
                body: formData
            });
        }

        if (!res.ok) throw new Error();

        showToast(editingPhoto ? "Photo updated successfully!" : "Photo uploaded successfully!", "success");

        photoForm.reset();
        photoPreview.classList.remove("active");
        photoModal.style.display = "none";
        editingPhoto = null;

        loadPhotos();

    } catch {
        showToast(editingPhoto ? "Failed to update photo" : "Failed to upload photo", "error");
    }
});

// ===============================
// DELETE PHOTO
// ===============================
async function deletePhoto(filename) {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
        const res = await fetch(`${API_BASE}/delete/${filename}`, {
            method: "DELETE"
        });

        if (!res.ok) throw new Error();

        showToast("Photo deleted successfully", "success");
        loadPhotos();

    } catch {
        showToast("Failed to delete photo", "error");
    }
}

// ===============================
// CLOSE MODALS
// ===============================
document.querySelectorAll(".close").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".modal").forEach(m => {
            m.style.display = "none";
        });
        editingPhoto = null;
    };
});

function closePhotoModal() {
    photoModal.style.display = "none";
    editingPhoto = null;
}

// ===============================
// INIT
// ===============================
window.onload = () => {
    switchView('grid'); // default
    loadPhotos();
};