const API = "http://127.0.0.1:8000";

let isAdmin = false;
let pdfs = [];
let filteredPdfs = [];
let currentSort = 'date-desc';
let editingPdf = null;

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
    loadPdfs();

    // Sort select handler
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            sortPdfs();
            renderPdfs();
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

            filterPdfs(searchTerm);
        });
    }

    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            clearSearch.style.display = 'none';
            filterPdfs('');
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

document.getElementById("loginForm").onsubmit = (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (username === "admin" && password === "nlcil@2026") {
        isAdmin = true;

        document.getElementById("adminControls").style.display = "flex";
        document.getElementById("loginModal").style.display = "none";

        showToast("Login successful!", "success");
        loadPdfs();
    } else {
        showToast("Invalid username or password", "error");
    }
};

document.getElementById("logoutBtn").onclick = () => {
    isAdmin = false;
    document.getElementById("adminControls").style.display = "none";
    showToast("Logged out successfully", "info");
    loadPdfs();
};

// ===============================
// SEARCH & FILTER
// ===============================
function filterPdfs(searchTerm) {
    if (!searchTerm) {
        filteredPdfs = [...pdfs];
    } else {
        const term = searchTerm.toLowerCase();
        filteredPdfs = pdfs.filter(pdf => {
            const title = (pdf.title || '').toLowerCase();
            const description = (pdf.description || '').toLowerCase();
            const date = (pdf.date || '').toLowerCase();
            const uploadDate = formatDate(pdf.created_at).toLowerCase();

            return title.includes(term) ||
                   description.includes(term) ||
                   date.includes(term) ||
                   uploadDate.includes(term);
        });
    }

    renderPdfs();
}

// ===============================
// SORTING
// ===============================
function sortPdfs() {
    const dataToSort = filteredPdfs.length > 0 || document.getElementById("searchInput").value ? filteredPdfs : pdfs;

    switch(currentSort) {
        case 'name-asc':
            dataToSort.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            dataToSort.sort((a, b) => b.title.localeCompare(a.title));
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

// ==========================
// LOAD PDFs
// ==========================
async function loadPdfs() {
    try {
        const res = await fetch(`${API}/pdf-list/`);
        const data = await res.json();

        const empty = document.getElementById("emptyState");
        const noResults = document.getElementById("noResultsState");

        if (!data || data.length === 0) {
            empty.style.display = "block";
            noResults.style.display = "none";
            document.getElementById("pdfContainer").innerHTML = "";
            pdfs = [];
            filteredPdfs = [];
            return;
        }

        empty.style.display = "none";

        pdfs = data.map(pdf => ({
            ...pdf,
            created_at: pdf.created_at || new Date().toISOString()
        }));

        // Apply current search if any
        const searchInput = document.getElementById("searchInput");
        if (searchInput && searchInput.value.trim()) {
            filterPdfs(searchInput.value.trim());
        } else {
            filteredPdfs = [...pdfs];
        }

        sortPdfs();
        renderPdfs();

    } catch (error) {
        console.error("Error loading PDFs:", error);
        showToast("Failed to load PDFs", "error");
    }
}

// ==========================
// RENDER PDFs
// ==========================
function renderPdfs() {
    const container = document.getElementById("pdfContainer");
    const emptyState = document.getElementById("emptyState");
    const noResultsState = document.getElementById("noResultsState");
    const searchInput = document.getElementById("searchInput");

    const dataToRender = searchInput && searchInput.value.trim() ? filteredPdfs : pdfs;

    // Handle empty states
    if (pdfs.length === 0) {
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

    dataToRender.forEach((pdf, index) => {
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
                <h3>${escapeHtml(pdf.title || "No Title")}</h3>
                <div class="pdf-date"><i class="fas fa-calendar"></i> ${escapeHtml(pdf.date || "No Date")}</div>
                <p>${escapeHtml(pdf.description || "No Description")}</p>
            </div>

            <div class="pdf-upload-date">
                <i class="fas fa-upload"></i>
                <span>${formatDate(pdf.created_at)}</span>
            </div>

            <div class="pdf-actions">
                <a href="${API}${pdf.url}" target="_blank" class="view-btn-pdf">
                    <i class="fas fa-eye"></i> View
                </a>
                <a href="${API}${pdf.url}" download class="download-btn">
                    <i class="fas fa-download"></i> Download
                </a>
                ${
                    isAdmin
                    ? `
                    <button class="edit-btn-pdf" data-file="${pdf.filename}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" data-file="${pdf.filename}">
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

            editBtn.addEventListener("click", () => {
                openEditPdfModal(pdf.filename, pdf.title, pdf.description, pdf.date);
            });

            deleteBtn.addEventListener("click", () => {
                deletePdf(pdf.filename);
            });
        }
    });
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
    return pdfs.some(pdf => pdf.filename === filename);
}

// ==========================
// OPEN ADD MODAL
// ==========================
document.getElementById("addPdfBtn").onclick = () => {
    editingPdf = null;
    document.getElementById("pdfModalTitle").innerHTML = '<i class="fas fa-plus"></i> Add E-Paper';
    document.getElementById("pdfForm").reset();
    document.getElementById("pdfFile").required = true;
    document.getElementById("pdfPreview").classList.remove("active");
    document.getElementById("pdfPreview").innerHTML = "";
    document.getElementById("pdfModal").style.display = "block";
};

// ==========================
// OPEN EDIT MODAL
// ==========================
function openEditPdfModal(filename, title, description, date) {
    editingPdf = filename;
    document.getElementById("pdfModalTitle").innerHTML = '<i class="fas fa-edit"></i> Edit E-Paper';
    document.getElementById("pdfTitle").value = title || "";
    document.getElementById("pdfDescription").value = description || "";
    document.getElementById("pdfDate").value = date || "";
    document.getElementById("pdfFile").required = false;
    document.getElementById("pdfPreview").classList.remove("active");
    document.getElementById("pdfPreview").innerHTML = "";
    document.getElementById("pdfModal").style.display = "block";
}

// ==========================
// UPLOAD / EDIT PDF (FIXED)
// ==========================
document.getElementById("pdfForm").onsubmit = async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("pdfFile");

    if (!editingPdf && fileInput.files.length === 0) {
        showToast("Please select a PDF file", "error");
        return;
    }

    // Check if file with same name exists when uploading new file
    if (!editingPdf && fileInput.files.length > 0) {
        const newFileName = fileInput.files[0].name;
        const existingPdf = pdfs.find(pdf => pdf.filename === newFileName);

        if (existingPdf) {
            const confirmReplace = confirm(
                `A file named "${newFileName}" already exists.\n\n` +
                `Existing file details:\n` +
                `Title: ${existingPdf.title}\n` +
                `Date: ${existingPdf.date}\n` +
                `Uploaded: ${formatDate(existingPdf.created_at)}\n\n` +
                `Do you want to replace it with the new file?`
            );

            if (!confirmReplace) {
                showToast("Upload cancelled", "info");
                return;
            }

            // Set editing mode to replace the existing file
            editingPdf = newFileName;
        }
    }

    const formData = new FormData();

    if (fileInput.files.length > 0) {
        formData.append("file", fileInput.files[0]);
    }

    formData.append("title", document.getElementById("pdfTitle").value || "No Title");
    formData.append("description", document.getElementById("pdfDescription").value || "No Description");
    formData.append("date", document.getElementById("pdfDate").value || "N/A");

    try {
        let res;

        if (editingPdf) {
            // Edit existing PDF
            res = await fetch(`${API}/edit-pdf/${editingPdf}`, {
                method: "PUT",
                body: formData
            });
        } else {
            // Upload new PDF
            res = await fetch(`${API}/upload-pdf/`, {
                method: "POST",
                body: formData
            });
        }

        if (!res.ok) {
            const result = await res.json();
            console.error(result);
            showToast(editingPdf ? "Failed to update PDF" : "Failed to upload PDF", "error");
            return;
        }

        showToast(editingPdf ? "PDF updated successfully!" : "PDF uploaded successfully!", "success");

        document.getElementById("pdfForm").reset();
        document.getElementById("pdfModal").style.display = "none";
        editingPdf = null;

        loadPdfs();

    } catch (error) {
        console.error("Error:", error);
        showToast("Server error", "error");
    }
};

// ==========================
// DELETE PDF
// ==========================
async function deletePdf(filename) {
    if (!confirm("Are you sure you want to delete this PDF?")) return;

    try {
        const res = await fetch(`${API}/delete-pdf/${encodeURIComponent(filename)}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            const err = await res.text();
            console.error(err);
            showToast("Failed to delete PDF", "error");
            return;
        }

        showToast("PDF deleted successfully", "success");
        loadPdfs();

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
        editingPdf = null;
    });
});

function closePdfModal() {
    document.getElementById("pdfModal").style.display = "none";
    editingPdf = null;
}
