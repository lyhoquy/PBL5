// ===== IMAGE PREDICTION LOGIC =====

let selectedImage = null;

function setupFileUpload() {
  const fileInput = document.getElementById("fileInput");
  const uploadZone = document.getElementById("uploadZone");
  const analyzeBtn = document.getElementById("analyzeBtn");

  uploadZone.addEventListener("dragover", function (e) {
    e.preventDefault();
    uploadZone.style.borderColor = "#ff6b6b";
    uploadZone.style.backgroundColor = "rgba(255, 107, 107, 0.1)";
  });

  uploadZone.addEventListener("dragleave", function (e) {
    e.preventDefault();
    uploadZone.style.borderColor = "#d4a574";
    uploadZone.style.backgroundColor = "";
  });

  uploadZone.addEventListener("drop", function (e) {
    e.preventDefault();
    uploadZone.style.borderColor = "#d4a574";
    uploadZone.style.backgroundColor = "";
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  fileInput.addEventListener("change", function (e) {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });
}

function handleFileSelect(file) {
  if (!file.type.startsWith("image/")) {
    alert("Vui lòng chọn file hình ảnh!");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert("File quá lớn! Vui lòng chọn file nhỏ hơn 10MB.");
    return;
  }

  selectedImage = file;

  const reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById("uploadZone").innerHTML = `
      <img src="${e.target.result}" class="prediction-image" alt="Preview">
      <div class="mt-3">
        <h6>Ảnh đã được chọn: ${file.name}</h6>
        <button class="btn btn-outline-secondary btn-sm" onclick="resetUpload()">
          <i class="fas fa-times"></i> Chọn ảnh khác
        </button>
      </div>`;
    document.getElementById("analyzeBtn").disabled = false;
  };
  reader.readAsDataURL(file);
}

function resetUpload() {
  selectedImage = null;
  document.getElementById("analyzeBtn").disabled = true;
  document.getElementById("uploadZone").innerHTML = `
    <input type="file" id="fileInput" accept="image/*" />
    <div class="upload-content">
      <i class="fas fa-cloud-upload-alt fa-3x text-primary mb-3"></i>
      <h5>Thả ảnh vào đây hoặc click để chọn</h5>
      <p class="text-muted">Hỗ trợ JPG, PNG, GIF (tối đa 10MB)</p>
    </div>`;
  setupFileUpload();
}

function analyzeImage() {
  if (!selectedImage) return;

  document.getElementById("loadingSpinner").style.display = "block";
  document.getElementById("analyzeBtn").disabled = true;

  const formData = new FormData();
  formData.append("file", selectedImage);

  fetch("/api/upload_and_predict", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("loadingSpinner").style.display = "none";
      document.getElementById("analyzeBtn").disabled = false;

      const normalizedKey = normalizeKey(data.best_prediction);
      window.latestPredictionKey = normalizedKey;

      if (data.status === "success") {
        displayResults(data);
        displayRecipe(normalizedKey);
        displayTravel(normalizedKey);
        switchTab("results");
      } else {
        alert("Phân tích thất bại: " + data.message);
      }
    })
    .catch((err) => {
      document.getElementById("loadingSpinner").style.display = "none";
      document.getElementById("analyzeBtn").disabled = false;
      alert("Lỗi hệ thống khi phân tích ảnh!");
      console.error(err);
    });
}

function displayResults(data) {
  const container = document.getElementById("resultsContent");
  const best = data.best_prediction || "Không rõ";
  const models = data.results;

  let html = `
    <div class="col-12 mb-4">
      <div class="result-header text-center">
        <h5 class="mb-3">
          <i class="fas fa-trophy text-warning me-2"></i>
          Kết quả tốt nhất: <strong class="text-primary">${best}</strong>
        </h5>
        ${
          selectedImage
            ? `<img src="${URL.createObjectURL(
                selectedImage
              )}" class="prediction-image mb-3" alt="Ảnh đã phân tích">`
            : ""
        }
      </div>
    </div>`;

  for (const key in models) {
    const model = models[key];
    const confidenceColor =
      model.confidence > 0.8
        ? "success"
        : model.confidence > 0.5
        ? "warning"
        : "danger";

    html += `
      <div class="col-md-6 mb-4">
        <div class="model-card">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">${model.name}</h6>
            <span class="badge bg-${confidenceColor}">${(
      model.confidence * 100
    ).toFixed(1)}%</span>
          </div>

          <div class="progress mb-2">
            <div class="progress-bar bg-${confidenceColor}" role="progressbar" style="width: ${(
      model.confidence * 100
    ).toFixed(1)}%" aria-valuenow="${(model.confidence * 100).toFixed(
      1
    )}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>

          <p class="mb-1">
            <strong>Dự đoán:</strong>
            <span class="text-primary">${model.predicted_class}</span>
          </p>

          <h6 class="mb-2">Top 5 kết quả:</h6>
          <div class="top5-list">
            ${model.top5
              .map(
                (item, index) => `
              <div class="top5-item">
                <span class="rank">#${index + 1}</span>
                <span class="class-name">${item.class}</span>
                <span class="confidence">${(item.confidence * 100).toFixed(
                  1
                )}%</span>
              </div>`
              )
              .join("")}
          </div>
        </div>
      </div>`;
  }

  container.innerHTML = html;
}
