
// InvoiceFlow - n8n + Gemini + Supabase Integration

const WEBHOOK_URL = "http://localhost:5678/webhook/invoice-upload";
const DASHBOARD_API_URL = "http://localhost:5678/webhook/get-invoices";
const APPROVAL_API_URL = "http://localhost:5678/webhook/update-invoice-status";

// Real invoice data from Supabase
let invoices = [];

// Helpers
const money = n =>
  "₹" + Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });

const initials = name =>
  (name || "NA")
    .split(" ")
    .filter(Boolean)
    .map(x => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const statusClass = s => (s || "Pending").toLowerCase();

const statusHTML = s =>
  `<span class="status-tag ${statusClass(s)}">${s || "Pending"}</span>`;

function formatDate(date) {
  if (!date) return "-";

  const d = new Date(date + (date.length === 10 ? "T00:00:00" : ""));

  if (isNaN(d.getTime())) return date;

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function showToast(message) {
  const el = document.getElementById("toast");
  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => el.classList.remove("show"), 2600);
}

// Convert Supabase records into UI format
function normalizeInvoice(data) {
  return {
    dbId: data.id,
    id: data.invoice_number || `INV-${data.id}`,
    vendor: data.vendor_name || "Unknown Vendor",
    date: formatDate(data.invoice_date),
    due: formatDate(data.due_date),
    amount: Number(data.total_amount || 0),
    status: data.approval_status || "Pending",
    fileName: data.file_name || "",
    createdAt: data.created_at
  };
}

// Fetch invoices from n8n API
async function loadInvoices() {
  try {
    const response = await fetch(DASHBOARD_API_URL, {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error("API Error: " + response.status);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid invoice data received from API.");
    }

    invoices = data.map(normalizeInvoice);

    renderTables();

    console.log("Invoices loaded successfully:", invoices);

  } catch (error) {
    console.error("Dashboard loading error:", error);
    showToast("Unable to load invoices: " + error.message);
  }
}

// Invoice Table Row
function invoiceRow(inv, compact = false) {
  return `<tr>
    <td><span class="invoice-id">${inv.id}</span></td>

    <td>
      <div class="vendor-cell">
        <span class="vendor-logo">${initials(inv.vendor)}</span>
        ${inv.vendor}
      </div>
    </td>

    <td>${inv.date}</td>

    ${compact ? "" : `<td>${inv.due}</td>`}

    <td>${money(inv.amount)}</td>

    <td>${statusHTML(inv.status)}</td>
  </tr>`;
}

// Render Dashboard, Invoices and Approvals
function renderTables() {

  // Recent Invoices
  document.getElementById("recent-table").innerHTML =
    invoices.slice(0, 4).map(x => invoiceRow(x, true)).join("");

  // All Invoices
  filterInvoices();

  // Approval Queue
  renderApprovals();

  // Dashboard Statistics
  const total = invoices.length;

  const pending = invoices.filter(
    x => x.status.toLowerCase() === "pending"
  ).length;

  const approved = invoices.filter(
    x => x.status.toLowerCase() === "approved"
  ).length;

  const rejected = invoices.filter(
    x => x.status.toLowerCase() === "rejected"
  ).length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-pending").textContent = pending;
  document.getElementById("stat-approved").textContent = approved;

  document.getElementById("stat-value").textContent =
  money(invoices.reduce((sum, inv) => sum + inv.amount, 0));

  const rejectedElement = document.getElementById("stat-rejected");
  if (rejectedElement) {
    rejectedElement.textContent = rejected;
  }

  document.getElementById("pending-nav-count").textContent = pending;
}

// Search and Filter Invoices
function filterInvoices() {

  const q = (
    document.getElementById("invoice-search")?.value || ""
  ).toLowerCase();

  const f = (
    document.getElementById("status-filter")?.value || "all"
  ).toLowerCase();

  const rows = invoices.filter(x =>
    (f === "all" || x.status.toLowerCase() === f) &&
    (
      x.id.toLowerCase().includes(q) ||
      x.vendor.toLowerCase().includes(q)
    )
  );

  document.getElementById("invoice-table").innerHTML =
    rows.length
      ? rows.map(x => invoiceRow(x)).join("")
      : `<tr>
          <td colspan="6" class="empty-row">
            No matching invoices found.
          </td>
        </tr>`;
}

// Approval Queue
function approvalMarkup(inv) {
  return `<div class="approval-row">

    <div class="approval-info">
      <span class="doc-icon">PDF</span>

      <div>
        <strong>${inv.id} · ${inv.vendor}</strong>
        <p>${inv.date} · Awaiting review</p>
      </div>
    </div>

    <div class="approval-amount">
      ${money(inv.amount)}
    </div>

    <div class="row-actions">
      <button class="mini-btn approve"
        data-action="approve"
        data-id="${inv.dbId}">
        Approve
      </button>

      <button class="mini-btn reject"
        data-action="reject"
        data-id="${inv.dbId}">
        Reject
      </button>
    </div>

  </div>`;
}

function renderApprovals() {

  const pending = invoices.filter(
    x => x.status.toLowerCase() === "pending"
  );

  document.getElementById("approval-preview-list").innerHTML =
    pending.length
      ? pending.slice(0, 2).map(approvalMarkup).join("")
      : `<div class="empty-row">
          No invoices are waiting for approval.
        </div>`;

  document.getElementById("approval-list-full").innerHTML =
    pending.length
      ? pending.map(approvalMarkup).join("")
      : `<div class="empty-row">
          All caught up! No pending approvals.
        </div>`;

  document.getElementById("approval-count").textContent =
    `${pending.length} pending`;
}

// Navigation
function navigate(view) {

  document.querySelectorAll(".page-view").forEach(x =>
    x.classList.remove("active")
  );

  document.getElementById(`view-${view}`)?.classList.add("active");

  document.querySelectorAll(".nav-link[data-view]").forEach(x =>
    x.classList.toggle("active", x.dataset.view === view)
  );

  const labels = {
    dashboard: "Dashboard",
    upload: "Upload Invoice",
    invoices: "All Invoices",
    approvals: "Approval Queue",
    settings: "Settings"
  };

  document.getElementById("breadcrumb-current").textContent =
    labels[view] || "Dashboard";

  document.getElementById("sidebar").classList.remove("open");
}

// Navigation Events
document.querySelectorAll("[data-view]").forEach(b =>
  b.addEventListener("click", () => navigate(b.dataset.view))
);

document.querySelectorAll("[data-go]").forEach(b =>
  b.addEventListener("click", () => navigate(b.dataset.go))
);

document.getElementById("mobile-menu").addEventListener("click", () =>
  document.getElementById("sidebar").classList.toggle("open")
);

// Search and Filter Events
document.getElementById("invoice-search").addEventListener(
  "input",
  filterInvoices
);

document.getElementById("status-filter").addEventListener(
  "change",
  filterInvoices
);

// Demo Approval Actions
// Approve / Reject - Supabase Database Update
document.addEventListener("click", async e => {

  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const id = Number(btn.dataset.id);

  const status =
    btn.dataset.action === "approve" ? "Approved" : "Rejected";

  btn.disabled = true;
  btn.textContent = "Processing...";

  try {

    const response = await fetch(APPROVAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: id,
        status: status
      })
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Status update failed.");
    }

    showToast(`Invoice ${status} successfully!`);

    // Fetch updated data from Supabase
    await loadInvoices();

  } catch (error) {

    console.error("Approval Error:", error);

    showToast("Error: " + error.message);

    btn.disabled = false;
    btn.textContent =
      status === "Approved" ? "Approve" : "Reject";
  }
});

// PDF Upload + n8n Webhook Integration
const fileInput = document.getElementById("invoice-file");
const dropZone = document.getElementById("drop-zone");
const feedback = document.getElementById("upload-feedback");

async function uploadInvoice(file) {

  if (!file) return;

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    feedback.textContent = "Please select a PDF file.";
    feedback.style.color = "#d94d4d";
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    feedback.textContent = "File exceeds the 10 MB limit.";
    feedback.style.color = "#d94d4d";
    return;
  }

  const formData = new FormData();

  formData.append("data", file, file.name);

  feedback.textContent = "Uploading invoice to n8n...";
  feedback.style.color = "#555";

  try {

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      body: formData
    });

    const responseText = await response.text();

    console.log("n8n Response:", responseText);

    if (!response.ok) {
      throw new Error("Server error: " + response.status);
    }

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      result = {};
    }

    if (result.success === false) {
      throw new Error(result.message || "Invoice processing failed.");
    }

    feedback.textContent =
      `Successfully uploaded: ${file.name}`;

    feedback.style.color = "#15966b";

    showToast("Invoice processed successfully!");

    // Refresh Dashboard after successful upload
    await loadInvoices();

  } catch (error) {

    console.error("Upload error:", error);

    feedback.textContent = "Upload failed: " + error.message;
    feedback.style.color = "#d94d4d";

    showToast("Could not complete invoice upload.");
  }
}

// File Selection
fileInput.addEventListener("change", e => {
  uploadInvoice(e.target.files[0]);
});

// Drag and Drop
["dragenter", "dragover"].forEach(ev =>
  dropZone.addEventListener(ev, e => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  })
);

["dragleave", "drop"].forEach(ev =>
  dropZone.addEventListener(ev, e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
  })
);

dropZone.addEventListener("drop", e => {

  const file = e.dataTransfer.files[0];

  if (file) {
    uploadInvoice(file);
  }
});

// Initial Dashboard Load
loadInvoices();
