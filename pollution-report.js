const REPORT_STORAGE_KEY = "pollution_reports";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const formEl = document.getElementById("pollutionReportForm");
const locationEl = document.getElementById("reportLocation");
const typeEl = document.getElementById("pollutionType");
const descriptionEl = document.getElementById("reportDescription");
const imageEl = document.getElementById("reportImage");
const imagePreviewEl = document.getElementById("imagePreview");
const errorEl = document.getElementById("reportError");
const successEl = document.getElementById("reportSuccess");

let selectedImageDataUrl = "";

function showError(message) {
  if (!message) {
    errorEl.style.display = "none";
    errorEl.textContent = "";
    return;
  }
  errorEl.style.display = "block";
  errorEl.textContent = message;
}

function showSuccess(message) {
  if (!message) {
    successEl.style.display = "none";
    successEl.textContent = "";
    return;
  }
  successEl.style.display = "block";
  successEl.textContent = message;
}

function loadReports() {
  try {
    const raw = localStorage.getItem(REPORT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReports(reports) {
  localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reports));
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Unable to read selected image."));
    reader.readAsDataURL(file);
  });
}

function clearImagePreview() {
  selectedImageDataUrl = "";
  imagePreviewEl.src = "";
  imagePreviewEl.style.display = "none";
}

imageEl.addEventListener("change", async () => {
  showError("");
  showSuccess("");
  clearImagePreview();

  const file = imageEl.files && imageEl.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    imageEl.value = "";
    showError("Please upload a valid image file.");
    return;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    imageEl.value = "";
    showError("Image must be 5 MB or smaller.");
    return;
  }

  try {
    selectedImageDataUrl = await readImageAsDataUrl(file);
    imagePreviewEl.src = selectedImageDataUrl;
    imagePreviewEl.style.display = "block";
  } catch (err) {
    imageEl.value = "";
    clearImagePreview();
    showError(err?.message || "Unable to process selected image.");
  }
});

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  showError("");
  showSuccess("");

  const location = locationEl.value.trim();
  const pollutionType = typeEl.value.trim();
  const description = descriptionEl.value.trim();

  if (!location || !pollutionType || !description) {
    showError("Please fill in location, pollution type, and description.");
    return;
  }

  const report = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    location,
    pollutionType,
    description,
    imageEvidence: selectedImageDataUrl || null,
    submittedAt: new Date().toISOString()
  };

  const reports = loadReports();
  reports.push(report);
  saveReports(reports);

  formEl.reset();
  clearImagePreview();
  showSuccess("Report submitted successfully. Thank you for helping track pollution.");
});
