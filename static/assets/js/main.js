// ===== MAIN APPLICATION LOGIC =====

document.addEventListener("DOMContentLoaded", function () {
  checkPiStatus();
  setupFileUpload();
});

// Switch to specific tab
function switchTab(tabName) {
  const tab = document.getElementById(tabName + "-tab");
  if (tab) {
    new bootstrap.Tab(tab).show();
  }
}

// Normalize a key for lookup
function normalizeKey(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "_");
}

document.addEventListener("DOMContentLoaded", function () {
  checkPiStatus();
  setupFileUpload();

  document.querySelectorAll("[data-action='switch-tab']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      if (target) switchTab(target);
    });
  });

  // Nút phân tích ảnh
  document.querySelectorAll("[data-action='analyze-image']").forEach((btn) => {
    btn.addEventListener("click", () => analyzeImage());
  });
});
