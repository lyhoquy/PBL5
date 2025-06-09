// ===== UI INTERACTIONS =====

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
        console.error(err);
      });
  } else {
    alert("Trình duyệt không hỗ trợ camera!");
  }
}

function checkPiStatus() {
  fetch("http://10.10.59.82:8080/pi_status")
    .then((res) => res.json())
    .then((data) => {
      const piStatus = document.getElementById("piStatus");
      const piBtn = document.getElementById("piCameraBtn");

      if (data.status === "connected" && data.camera_ready) {
        piStatus.className = "status-indicator status-available";
        piStatus.innerHTML = '<i class="fas fa-circle"></i> Pi sẵn sàng';
        piBtn.disabled = false;

        // Gán sự kiện click để lấy ảnh từ Pi
        piBtn.onclick = async () => {
          try {
            const res = await fetch("http://10.10.59.82:8080/capture", {
              method: "POST",
            });
            const data = await res.json();

            if (data.success && data.image) {
              const uploadZone = document.getElementById("uploadZone");
              uploadZone.innerHTML = `
                <img src="${data.image}" class="prediction-image" alt="Ảnh từ Pi">
                <div class="mt-3">
                  <h6>Ảnh từ Raspberry Pi</h6>
                  <button class="btn btn-outline-secondary btn-sm" onclick="resetUpload()">
                    <i class="fas fa-times"></i> Chọn ảnh khác
                  </button>
                </div>`;

              const blob = await (await fetch(data.image)).blob();
              selectedImage = new File([blob], "pi_image.jpg", {
                type: "image/jpeg",
              });
              document.getElementById("analyzeBtn").disabled = false;
            } else {
              alert("❌ Không thể lấy ảnh từ Pi: " + data.message);
            }
          } catch (err) {
            console.error("Lỗi khi dùng Pi Camera:", err);
            alert("Lỗi kết nối tới Raspberry Pi.");
          }
        };
      } else {
        piStatus.className = "status-indicator status-unavailable";
        piStatus.innerHTML = '<i class="fas fa-circle"></i> Pi không sẵn sàng';
        piBtn.disabled = true;
        piBtn.onclick = null;
      }
    })
    .catch((err) => {
      const piStatus = document.getElementById("piStatus");
      piStatus.className = "status-indicator status-unavailable";
      piStatus.innerHTML = '<i class="fas fa-circle"></i> Không thể kết nối Pi';
      console.error("Lỗi kết nối Pi:", err);
    });
}
