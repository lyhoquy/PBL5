import { openCamera, resetUpload, checkPiStatus } from "./ui.js";

import {
  analyzeImage,
  setupFileUpload,
  normalizeKey,
  bindAnalyzeButton,
  displayResults,
  handleFileSelect,
} from "./prediction.js";

import { displayRecipe, printRecipe, shareRecipe } from "./recipe.js";

// import { displayTravel } from "./travel.js";

import { debounce, throttle } from "./utils.js";

import { APP_CONFIG } from "./config.js";

import { fetchJSON, postFormData } from "./api.js";

// ==== DOM READY ====
document.addEventListener("DOMContentLoaded", () => {
  checkPiStatus();
  setupFileUpload();

  // Gán nút chuyển tab
  document.querySelectorAll("[data-action='switch-tab']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      if (target) switchTab(target);
    });
  });

  // Nút mở camera
  document.querySelectorAll("[data-action='open-camera']").forEach((btn) => {
    btn.addEventListener("click", openCamera);
  });

  // Nút phân tích ảnh
  document.querySelectorAll("[data-action='analyze-image']").forEach((btn) => {
    btn.addEventListener("click", analyzeImage);
  });
});

// ==== Switch Tab ====
function switchTab(tabName) {
  const tab = document.getElementById(tabName + "-tab");
  if (tab) {
    new bootstrap.Tab(tab).show();
  }
}
