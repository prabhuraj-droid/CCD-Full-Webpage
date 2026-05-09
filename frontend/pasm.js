const API = "http://127.0.0.1:8000";

let isAdmin = false;
let pasmFiles = [];
let filteredPasm = [];
let currentSort = 'date-desc';
let editingPasm = null;

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

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    loadPasm();

    // Sort select handler
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            sortPasm();
            renderPasm();
        });
    }

    // Search functionality
    const searchInput = document.getElementById("searchInput");
    const clearSearch = document.getElementById("clearSearch");

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();

            // Show/hide clear button
            if (clearSearch) {
                clearSearch.style.display = searchTerm ? 'flex' : 'none';
            }

            filterPasm(searchTerm);
        });
    }

    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            clearSearch.style.display = 'none';
            filterPasm('');
            searchInput.focus();
        });
    }
});

// ==========================
// ADMIN LOGIN
// ==========================
document.getElementById("adminLoginBtn").onclick = () => {
    document.getElementById("loginModal").style.display = "block";
};

document.getElementById("loginForm").addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (username === "admin" && password === "nlcil@2026") {
        isAdmin = true;

        document.getElementById("adminControls").style.display = "flex";
        document.getElementById("loginModal").style.display = "none";

        showToast("Login successful!", "success");
        loadPasm();
    } else {
        showToast("Invalid username or password", "error");
    }
});

document.getElementById("logoutBtn").onclick = () => {
    isAdmin = false;
    document.getElementById("adminControls").style.display = "none";
    showToast("Logged out successfully", "info");
    loadPasm();
};

// ==========================
// ADD PASM BUTTON
// ==========================
document.getElementById("addPasmBtn").onclick = () => {
    editingPasm = null;
    document.getElementById("pasmModalTitle").innerHTML = '<i class="fas fa-plus"></i> Add PASM';
    document.getElementById("pasmForm").reset();
    document.getElementById("pasmFile").required = true;
    document.getElementById("pasmPreview").classList.remove("active");
    document.getElementById("pasmPreview").innerHTML = "";
    document.getElementById("pasmModal").style.display = "block";
};

// ===============================
// SEARCH & FILTER
// ===============================
function filterPasm(searchTerm) {
    if (!searchTerm) {
        filteredPasm = [...pasmFiles];
    } else {
        const term = searchTerm.toLowerCase();
        filteredPasm = pasmFiles.filter(pasm => {
            const title = (pasm.title || '').toLowerCase();
            const description = (pasm.description || '').toLowerCase();
            const date = (pasm.date || '').toLowerCase();
            const uploadDate = formatDate(pasm.created_at).toLowerCase();

            return title.includes(term) ||
                   description.includes(term) ||
                   date.includes(term) ||
                   uploadDate.includes(term);
        });
    }

    sortPasm();
    renderPasm();
}

// ===============================
// SORTING
// ===============================
function sortPasm() {
    const dataToSort = filteredPasm.length > 0 || document.getElementById("searchInput").value ? filteredPasm : pasmFiles;

    switch(currentSort) {
        case 'name-asc':
            dataToSort.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            break;
        case 'name-desc':
            dataToSort.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
            break;
        case 'date-asc':
            dataToSort.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'date-desc':
            dataToSort.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
    }
}

// ===============================
// FORMAT DATE
// ===============================
function formatDate(isoString) {
    if (!isoString) return 'N/A';

    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
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
// HELPER: CHECK FILE EXISTS
// ===============================
function checkFileExists(filename) {
    return pasmFiles.some(pasm => pasm.filename === filename);
}

// ==========================
// LOAD PASM
// ==========================
async function loadPasm() {
    try {
        const res = await fetch(`${API}/pasm-list/`);
        const data = await res.json();

        const empty = document.getElementById("emptyState");
        const noResults = document.getElementById("noResultsState");

        if (!data || data.length === 0) {
            empty.style.display = "block";
            noResults.style.display = "none";
            document.getElementById("pasmContainer").innerHTML = "";
            pasmFiles = [];
            filteredPasm = [];
            return;
        }

        empty.style.display = "none";

        pasmFiles = data.map(pasm => ({
            ...pasm,
            created_at: pasm.created_at || new Date().toISOString()
        }));

        // Apply current search if any
        const searchInput = document.getElementById("searchInput");
        if (searchInput && searchInput.value.trim()) {
            filterPasm(searchInput.value.trim());
        } else {
            filteredPasm = [...pasmFiles];
            sortPasm();
            renderPasm();
        }

    } catch (error) {
        console.error("Error loading PASM:", error);
        showToast("Failed to load PASM files", "error");
    }
}

// ==========================
// RENDER PASM
// ==========================
function renderPasm() {
    const container = document.getElementById("pasmContainer");
    const emptyState = document.getElementById("emptyState");
    const noResultsState = document.getElementById("noResultsState");
    const searchInput = document.getElementById("searchInput");

    const dataToRender = searchInput && searchInput.value.trim() ? filteredPasm : pasmFiles;

    // Handle empty states
    if (pasmFiles.length === 0) {
        emptyState.style.display = "block";
        noResultsState.style.display = "none";
        container.innerHTML = "";
        return;
    }

    if (dataToRender.length === 0 && searchInput && searchInput.value.trim()) {
        emptyState.style.display = "none";
        noResultsState.style.display = "block";
        container.innerHTML = "";
        return;
    }

    emptyState.style.display = "none";
    noResultsState.style.display = "none";
    container.innerHTML = "";

    dataToRender.forEach((pasm, index) => {
        const card = document.createElement("div");
        card.className = "pdf-card";

        card.innerHTML = `
            <div class="pdf-serial">
                <div class="serial-number">${index + 1}</div>
            </div>

            <div class="pdf-icon">
                <i class="fas fa-file-pdf"></i>
            </div>

            <div class="pdf-info">
                <h3>${escapeHtml(pasm.title || "No Title")}</h3>
                <div class="pdf-date"><i class="fas fa-calendar"></i> ${escapeHtml(pasm.date || "No Date")}</div>
                <p>${escapeHtml(pasm.description || "No Description")}</p>
            </div>

            <div class="pdf-upload-date">
                <i class="fas fa-upload"></i>
                <span>${formatDate(pasm.created_at)}</span>
            </div>

            <div class="pdf-actions">
                <a href="${API}${pasm.url}" target="_blank" class="view-btn-pdf">
                    <i class="fas fa-eye"></i> View
                </a>
                <a href="${API}${pasm.url}" download class="download-btn">
                    <i class="fas fa-download"></i> Download
                </a>
                ${
                    isAdmin
                    ? `
                    <button class="edit-btn-pdf" data-file="${pasm.filename}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" data-file="${pasm.filename}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    `
                    : ""
                }
            </div>
        `;

        container.appendChild(card);

        // Add event listeners for admin buttons
        if (isAdmin) {
            const editBtn = card.querySelector(".edit-btn-pdf");
            const deleteBtn = card.querySelector(".delete-btn");

            if (editBtn) {
                editBtn.addEventListener("click", () => {
                    openEditPasmModal(pasm.filename, pasm.title, pasm.description, pasm.date);
                });
            }

            if (deleteBtn) {
                deleteBtn.addEventListener("click", () => {
                    deletePasm(pasm.filename);
                });
            }
        }
    });
}

// ==========================
// OPEN EDIT MODAL
// ==========================
function openEditPasmModal(filename, title, description, date) {
    editingPasm = filename;
    document.getElementById("pasmModalTitle").innerHTML = '<i class="fas fa-edit"></i> Edit PASM';
    document.getElementById("pasmTitle").value = title || "";
    document.getElementById("pasmDescription").value = description || "";
    document.getElementById("pasmDate").value = date || "";
    document.getElementById("pasmFile").required = false;
    document.getElementById("pasmPreview").classList.remove("active");
    document.getElementById("pasmPreview").innerHTML = "";
    document.getElementById("pasmModal").style.display = "block";
}

// ==========================
// UPLOAD / EDIT PASM (FIXED)
// ==========================
document.getElementById("pasmForm").addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("pasmFile");

    if (!editingPasm && fileInput.files.length === 0) {
        showToast("Please select a PDF file", "error");
        return;
    }

    // Check if file with same name exists when uploading new file
    if (!editingPasm && fileInput.files.length > 0) {
        const newFileName = fileInput.files[0].name;
        const existingPasm = pasmFiles.find(pasm => pasm.filename === newFileName);

        if (existingPasm) {
            const confirmReplace = confirm(
                `A file named "${newFileName}" already exists.\n\n` +
                `Existing file details:\n` +
                `Title: ${existingPasm.title}\n` +
                `Date: ${existingPasm.date}\n` +
                `Uploaded: ${formatDate(existingPasm.created_at)}\n\n` +
                `Do you want to replace it with the new file?`
            );

            if (!confirmReplace) {
                showToast("Upload cancelled", "info");
                return;
            }

            // Set editing mode to replace the existing file
            editingPasm = newFileName;
        }
    }

    const formData = new FormData();

    if (fileInput.files.length > 0) {
        formData.append("file", fileInput.files[0]);
    }

    formData.append("title", document.getElementById("pasmTitle").value || "No Title");
    formData.append("description", document.getElementById("pasmDescription").value || "No Description");
    formData.append("date", document.getElementById("pasmDate").value || "N/A");

    try {
        let res;

        if (editingPasm) {
            // Edit existing PASM
            res = await fetch(`${API}/edit-pasm/${encodeURIComponent(editingPasm)}`, {
                method: "PUT",
                body: formData
            });
        } else {
            // Upload new PASM
            res = await fetch(`${API}/upload-pasm/`, {
                method: "POST",
                body: formData
            });
        }

        if (!res.ok) {
            const result = await res.json().catch(() => ({}));
            console.error(result);
            showToast(editingPasm ? "Failed to update PASM" : "Failed to upload PASM", "error");
            return;
        }

        showToast(editingPasm ? "PASM updated successfully!" : "PASM uploaded successfully!", "success");

        document.getElementById("pasmForm").reset();
        document.getElementById("pasmModal").style.display = "none";
        editingPasm = null;

        loadPasm();

    } catch (error) {
        console.error("Error:", error);
        showToast("Server error", "error");
    }
});

// ==========================
// DELETE PASM
// ==========================
async function deletePasm(filename) {
    if (!confirm("Are you sure you want to delete this PASM file?")) return;

    try {
        const res = await fetch(`${API}/delete-pasm/${encodeURIComponent(filename)}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            const err = await res.text();
            console.error(err);
            showToast("Failed to delete PASM", "error");
            return;
        }

        showToast("PASM deleted successfully", "success");
        loadPasm();

    } catch (error) {
        console.error("Delete error:", error);
        showToast("Server error", "error");
    }
}

// ==========================
// CLOSE MODALS
// ==========================
document.querySelectorAll(".close").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".modal").forEach(modal => {
            modal.style.display = "none";
        });
        editingPasm = null;
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = "none";
        editingPasm = null;
    }
});

function closePasmModal() {
    document.getElementById("pasmModal").style.display = "none";
    editingPasm = null;
}
