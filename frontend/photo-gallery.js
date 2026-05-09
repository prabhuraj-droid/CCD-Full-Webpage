// ===============================
// CONFIG
// ===============================

// Auto detect local / deployed backend
const API_BASE =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : window.location.origin;

// ===============================
// STATE
// ===============================
let isAdmin = false;
let photos = [];
let currentView = "grid";
let currentSort = "date-desc";
let editingPhoto = null;

// ===============================
// TOAST NOTIFICATION SYSTEM
// ===============================
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icon =
        type === "success"
            ? "✓"
            : type === "error"
            ? "✕"
            : "ℹ";

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);

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
if (adminLoginBtn) {
    adminLoginBtn.onclick = () => {
        loginModal.style.display = "block";
    };
}

if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const u = document.getElementById("username").value;
        const p = document.getElementById("password").value;

        if (u === "admin" && p === "nlcil@2026") {
            isAdmin = true;

            if (adminControls) {
                adminControls.style.display = "flex";
            }

            loginModal.style.display = "none";

            showToast("Login successful!", "success");

            loadPhotos();

        } else {
            showToast("Invalid username or password", "error");
        }
    });
}

if (logoutBtn) {
    logoutBtn.onclick = () => {
        isAdmin = false;

        if (adminControls) {
            adminControls.style.display = "none";
        }

        showToast("Logged out successfully", "info");

        loadPhotos();
    };
}

// ===============================
// VIEW SWITCH
// ===============================
if (gridViewBtn) {
    gridViewBtn.onclick = () => switchView("grid");
}

if (listViewBtn) {
    listViewBtn.onclick = () => switchView("list");
}

function switchView(view) {

    currentView = view;

    if (!photoContainer) return;

    if (view === "grid") {

        photoContainer.className = "photo-grid";

        if (gridViewBtn) gridViewBtn.classList.add("active");
        if (listViewBtn) listViewBtn.classList.remove("active");

    } else {

        photoContainer.className = "photo-list";

        if (listViewBtn) listViewBtn.classList.add("active");
        if (gridViewBtn) gridViewBtn.classList.remove("active");
    }
}

// ===============================
// SORTING
// ===============================
if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
        currentSort = e.target.value;
        sortPhotos();
        renderPhotos();
    });
}

function sortPhotos() {

    switch (currentSort) {

        case "name-asc":
            photos.sort((a, b) =>
                a.title.localeCompare(b.title)
            );
            break;

        case "name-desc":
            photos.sort((a, b) =>
                b.title.localeCompare(a.title)
            );
            break;

        case "date-asc":
            photos.sort((a, b) =>
                new Date(a.created_at) - new Date(b.created_at)
            );
            break;

        case "date-desc":
        default:
            photos.sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            );
            break;
    }
}

// ===============================
// LOAD PHOTOS
// ===============================
async function loadPhotos() {

    try {

        const res = await fetch(`${API_BASE}/photos-list/`);

        if (!res.ok) {
            throw new Error("Failed to fetch photos");
        }

        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {

            if (emptyState) {
                emptyState.style.display = "block";
            }

            if (photoContainer) {
                photoContainer.innerHTML = "";
            }

            return;
        }

        if (emptyState) {
            emptyState.style.display = "none";
        }

        photos = data.map((photo, index) => ({
            id: index + 1,
            title: photo.title || photo.filename,
            description:
                photo.description || "No description available",
            imageUrl: `${API_BASE}${photo.url}`,
            filename: photo.filename,
            created_at:
                photo.created_at || new Date().toISOString()
        }));

        sortPhotos();
        renderPhotos();

    } catch (err) {

        console.error(err);

        showToast("Failed to load photos", "error");
    }
}

// ===============================
// RENDER PHOTOS
// ===============================
function renderPhotos() {

    if (!photoContainer) return;

    photoContainer.innerHTML = photos.map(photo => `

        <div class="photo-card" data-id="${photo.id}">

            <img
                src="${photo.imageUrl}"
                alt="${escapeHtml(photo.title)}"
                loading="lazy"

                onclick='openViewer(
                    "${photo.imageUrl}",
                    ${JSON.stringify(photo.title)},
                    ${JSON.stringify(photo.description)}
                )'
            >

            <div class="photo-info">

                <h3>${escapeHtml(photo.title)}</h3>

                <p>${escapeHtml(photo.description)}</p>

                ${isAdmin ? `

                <div class="photo-actions">

                    <button
                        class="action-btn edit-btn"

                        onclick='openEditPhotoModal(
                            ${JSON.stringify(photo.filename)},
                            ${JSON.stringify(photo.title)},
                            ${JSON.stringify(photo.description)}
                        )'
                    >
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>

                    <button
                        class="action-btn delete-btn"

                        onclick='deletePhoto(
                            ${JSON.stringify(photo.filename)}
                        )'
                    >
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>

                </div>

                ` : ""}

            </div>

        </div>

    `).join("");
}

// ===============================
// ESCAPE HTML
// ===============================
function escapeHtml(text) {

    if (!text) return "";

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

// ===============================
// IMAGE VIEWER
// ===============================
function openViewer(src, title, desc) {

    if (!viewerModal) return;

    viewerModal.style.display = "block";

    if (viewerImage) {
        viewerImage.src = src;
    }

    if (viewerTitle) {
        viewerTitle.textContent = title;
    }

    if (viewerDescription) {
        viewerDescription.textContent = desc;
    }
}

// ===============================
// IMAGE PREVIEW
// ===============================
if (photoFile) {

    photoFile.addEventListener("change", () => {

        const file = photoFile.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {

            photoPreview.innerHTML =
                `<img src="${reader.result}">`;

            photoPreview.classList.add("active");
        };

        reader.readAsDataURL(file);
    });
}

// ===============================
// OPEN ADD MODAL
// ===============================
if (addPhotoBtn) {

    addPhotoBtn.onclick = () => {

        editingPhoto = null;

        photoModalTitle.innerHTML =
            '<i class="fas fa-plus"></i> Add Photo';

        photoForm.reset();

        photoPreview.classList.remove("active");
        photoPreview.innerHTML = "";

        photoFile.required = true;

        photoModal.style.display = "block";
    };
}

// ===============================
// OPEN EDIT MODAL
// ===============================
function openEditPhotoModal(filename, title, description) {

    editingPhoto = filename;

    photoModalTitle.innerHTML =
        '<i class="fas fa-edit"></i> Edit Photo';

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
if (photoForm) {

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

                res = await fetch(
                    `${API_BASE}/edit-photo/${editingPhoto}`,
                    {
                        method: "PUT",
                        body: formData
                    }
                );

            } else {

                res = await fetch(
                    `${API_BASE}/upload/`,
                    {
                        method: "POST",
                        body: formData
                    }
                );
            }

            if (!res.ok) {

                const errorText = await res.text();

                console.error(errorText);

                throw new Error(errorText);
            }

            showToast(
                editingPhoto
                    ? "Photo updated successfully!"
                    : "Photo uploaded successfully!",
                "success"
            );

            photoForm.reset();

            photoPreview.classList.remove("active");

            photoModal.style.display = "none";

            editingPhoto = null;

            loadPhotos();

        } catch (err) {

            console.error(err);

            showToast(
                editingPhoto
                    ? "Failed to update photo"
                    : "Failed to upload photo",
                "error"
            );
        }
    });
}

// ===============================
// DELETE PHOTO
// ===============================
async function deletePhoto(filename) {

    if (!confirm(
        "Are you sure you want to delete this photo?"
    )) {
        return;
    }

    try {

        const res = await fetch(
            `${API_BASE}/delete/${filename}`,
            {
                method: "DELETE"
            }
        );

        if (!res.ok) {

            const errorText = await res.text();

            console.error(errorText);

            throw new Error(errorText);
        }

        showToast(
            "Photo deleted successfully",
            "success"
        );

        loadPhotos();

    } catch (err) {

        console.error(err);

        showToast(
            "Failed to delete photo",
            "error"
        );
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

    switchView("grid");

    loadPhotos();
};