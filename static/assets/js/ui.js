// ui.js
import { APP_CONFIG } from "./config.js";

// ===== Camera tương tác =====
function openCamera() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        alert(
          "Camera đang hoạt động, cần tích hợp giao diện xem trước nếu muốn."
        );
        stream.getTracks().forEach((track) => track.stop());
      })
      .catch((err) => {
        alert("Không thể truy cập camera trên thiết bị này!");
        console.error("Camera access error:", err);
      });
  } else {
    alert("Trình duyệt không hỗ trợ camera!");
  }
}

// ===== Reset Upload Zone =====
function resetUpload() {
  const uploadZone = document.querySelector("#uploadZone");
  if (uploadZone) {
    uploadZone.innerHTML = `
      <div class="upload-placeholder">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Kéo thả ảnh vào đây hoặc nhấp để chọn ảnh</p>
      </div>`;
  }
  const analyzeBtn = document.getElementById("analyzeBtn");
  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add("disabled");
  }
}

// ===== Raspberry Pi Status =====
function checkPiStatus() {
  fetch(`${APP_CONFIG.PI_BASE_URL}/pi_status`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      const piBtn = document.getElementById("piCameraBtn");
      const piStatus = document.getElementById("piStatus");

      if (!piBtn || !piStatus) {
        console.warn("Pi button or status element not found");
        return;
      }

      if (data.status === "connected" && data.camera_ready) {
        piStatus.classList.remove("status-unavailable");
        piStatus.classList.add("status-available");
        piStatus.innerHTML = '<i class="fas fa-circle"></i> Pi sẵn sàng';
        piBtn.disabled = false;

        piBtn.onclick = async () => {
          const uploadZone = document.querySelector("#uploadZone");
          if (!uploadZone) {
            alert("Không tìm thấy vùng tải ảnh!");
            return;
          }

          try {
            // Countdown & Preview
            const previewContainer = document.createElement("div");
            previewContainer.className = "text-center mt-3";
            previewContainer.id = "piPreviewContainer";
            previewContainer.innerHTML = `
              <h6 class="mb-2">Xem trước từ Raspberry Pi</h6>
              <img id="piPreview" src="${APP_CONFIG.PI_BASE_URL}/video_feed" width="480" class="rounded shadow"/>
              <p class="text-muted mt-2" id="countdown">Đang đếm ngược: 5 giây...</p>
              <div class="progress mt-2" style="height: 10px;">
                <div class="progress-bar bg-primary" id="progressBar" role="progressbar" style="width: 100%;" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            `;
            uploadZone.innerHTML = "";
            uploadZone.appendChild(previewContainer);

            let seconds = 5;
            const countdownElement = document.getElementById("countdown");
            const progressBar = document.getElementById("progressBar");
            await new Promise((resolve) => {
              const interval = setInterval(() => {
                seconds--;
                if (seconds >= 0) {
                  countdownElement.textContent = `Đang đếm ngược: ${seconds} giây...`;
                  progressBar.style.width = `${(seconds / 5) * 100}%`;
                } else {
                  clearInterval(interval);
                  resolve();
                }
              }, 1000);
            });

            // Capture from Pi
            const res = await fetch(`${APP_CONFIG.PI_BASE_URL}/capture`, {
              method: "POST",
            });
            const data = await res.json();

            if (data.success && data.image) {
              const blob = await fetch(data.image).then((r) => r.blob());
              const file = new File([blob], "pi_image.jpg", {
                type: "image/jpeg",
              });
              window.selectedImage = file;

              uploadZone.innerHTML = `
                <img src="${data.image}" class="prediction-image mb-3" alt="Ảnh từ Pi">
                <div class="mt-3">
                  <h6>Ảnh từ Raspberry Pi</h6>
                  <button class="btn btn-outline-secondary btn-sm" id="resetBtn">
                    <i class="fas fa-times"></i> Chọn ảnh khác
                  </button>
                </div>`;

              // Gán lại hành động reset
              document
                .getElementById("resetBtn")
                ?.addEventListener("click", resetUpload);

              // Auto-trigger analyze
              const analyzeBtn = document.getElementById("analyzeBtn");
              if (analyzeBtn) {
                analyzeBtn.disabled = false;
                analyzeBtn.classList.remove("disabled");
                setTimeout(() => {
                  analyzeBtn.click();
                }, 500);
              }
            } else {
              alert(
                `Lỗi chụp ảnh từ Raspberry Pi: ${data.error || "Unknown error"}`
              );
              resetUpload();
            }
          } catch (err) {
            alert(`Không thể kết nối với Raspberry Pi: ${err.message}`);
            console.error("Capture error:", err);
            resetUpload();
          }
        };
      } else {
        piStatus.innerHTML = '<i class="fas fa-circle"></i> Pi chưa kết nối';
        piBtn.disabled = true;
      }
    })
    .catch((err) => {
      const piStatus = document.getElementById("piStatus");
      if (piStatus) {
        piStatus.innerHTML = '<i class="fas fa-circle"></i> Không kết nối được';
      }
      console.error("Pi status check failed:", err);
    });
}

export { openCamera, resetUpload, checkPiStatus };
