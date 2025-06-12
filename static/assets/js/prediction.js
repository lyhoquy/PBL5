// ===== PREDICTION LOGIC =====
import { resetUpload } from "./ui.js";
import { APP_CONFIG } from "./config.js";
import { displayRecipe } from "./recipe.js";
import { TravelManager } from "./travel.js";

// Global selected image
window.selectedImage = null;

// Gán lại sự kiện nút phân tích
function bindAnalyzeButton() {
  const btn = document.getElementById("analyzeBtn");
  if (btn) {
    btn.removeEventListener("click", analyzeImage); // Xoá trước nếu đã gán
    btn.addEventListener("click", analyzeImage);
  }
}

// Xử lý khi chọn ảnh
function handleFileSelect(file) {
  const uploadZone = document.getElementById("uploadZone");
  if (!file || !uploadZone) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    uploadZone.innerHTML = `
      <img src="${e.target.result}" class="prediction-image mb-3" alt="Ảnh tải lên">
      <div class="mt-3">
        <h6>Ảnh đã chọn</h6>
        <button class="btn btn-outline-secondary btn-sm" id="resetBtn">
          <i class="fas fa-times"></i> Chọn ảnh khác
        </button>
      </div>`;

    window.selectedImage = file;

    const analyzeBtn = document.getElementById("analyzeBtn");
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.classList.remove("disabled");
    }

    // Gán lại sự kiện
    document.getElementById("resetBtn")?.addEventListener("click", resetUpload);
    bindAnalyzeButton();
  };

  reader.readAsDataURL(file);
}

// Kéo thả ảnh
function setupFileUpload() {
  const uploadZone = document.getElementById("uploadZone");

  if (!uploadZone) return;

  uploadZone.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      if (input.files && input.files[0]) {
        handleFileSelect(input.files[0]);
      }
    };
    input.click();
  });

  uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadZone.classList.add("drag-over");
  });

  uploadZone.addEventListener("dragleave", () => {
    uploadZone.classList.remove("drag-over");
  });

  uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.classList.remove("drag-over");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });
}

// Hàm normalize key
function normalizeKey(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

// results.js
function displayResults(data) {
  const container = document.getElementById("resultsContent");
  if (!container || !data || !data.results) return;

  const name = data.best_prediction || "Không xác định";

  // Hiển thị ảnh preview
  let imageURL = "";
  if (window.selectedImage) {
    imageURL = URL.createObjectURL(window.selectedImage);
  }

  let html = `
    <div class="col-12 mb-4">
      <div class="card shadow-sm overflow-hidden">
        <div class="row g-0">
          <div class="col-md-4 bg-light d-flex justify-content-center align-items-center" style="min-height: 250px;">
            <img src="${imageURL}" class="img-fluid object-fit-contain p-3" style="max-height: 240px;" alt="Ảnh đã chọn">
          </div>
          <div class="col-md-8 p-3">
            <h4 class="text-success">Món ăn được nhận diện:</h4>
            <h2 class="text-primary fw-bold mb-3">${name}</h2>
  `;

  const models = data.results;

  for (const key in models) {
    const model = models[key];
    html += `
      <div class="mb-3">
        <h5>${model.name || key}</h5>
        <p class="mb-1">Kết quả chính: <strong>${
          model.predicted_class
        }</strong> (${(model.confidence * 100).toFixed(1)}%)</p>
        <div class="progress mb-2">
          <div class="progress-bar bg-info" role="progressbar" style="width: ${
            model.confidence * 100
          }%" aria-valuenow="${
      model.confidence * 100
    }" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        <ul class="list-group list-group-flush small">`;

    if (model.top5 && Array.isArray(model.top5)) {
      model.top5.forEach((item, index) => {
        html += `
          <li class="list-group-item d-flex justify-content-between">
            <span>#${index + 1} ${item.class}</span>
            <span>${(item.confidence * 100).toFixed(1)}%</span>
          </li>`;
      });
    }

    html += `</ul></div>`;
  }

  html += `</div></div></div></div>`;
  container.innerHTML = html;

  // Auto chuyển tab
  const resultsTab = document.getElementById("results-tab");
  if (resultsTab) {
    new bootstrap.Tab(resultsTab).show();
  }
}

// Phân tích ảnh
function analyzeImage() {
  const image = window.selectedImage;
  if (!image) {
    alert("Vui lòng chọn ảnh trước!");
    return;
  }

  const analyzeBtn = document.getElementById("analyzeBtn");
  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add("disabled");
  }

  const formData = new FormData();
  formData.append("file", image);

  fetch(APP_CONFIG.API.UPLOAD_PREDICT, {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data || !data.best_prediction) {
        alert("Không nhận diện được món ăn!");
        return;
      }

      const predictionKey = normalizeKey(data.best_prediction);
      console.log("Kết quả:", predictionKey);
      displayResults(data);
      displayRecipe(predictionKey);
      TravelManager.displayTravel(predictionKey);
    })
    .catch((err) => {
      console.error("Lỗi phân tích:", err);
      alert("Lỗi khi phân tích ảnh!");
    });
}

// ===== EXPORT =====
export {
  analyzeImage,
  setupFileUpload,
  normalizeKey,
  bindAnalyzeButton,
  displayResults,
  handleFileSelect,
};
