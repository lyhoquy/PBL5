/**
 * ===== APPLICATION CONFIGURATION =====
 * Centralized configuration for the Vietnamese Food Guide application
 */
// Application constants
export const APP_CONFIG = {
  PI_BASE_URL: "http://192.168.1.109:8080",

  // API endpoints
  API: {
    UPLOAD_PREDICT: "/api/upload_and_predict",
    GET_IMAGE: "/get_image",
    NOMINATIM: "https://nominatim.openstreetmap.org/search",
  },

  // Data file paths
  DATA: {
    RECIPES: "/static/assets/data/recipes.json",
    DESTINATIONS: "/static/assets/data/destinations.json",
  },

  // File upload constraints
  UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/gif"],
    MIME_PATTERNS: /^image\/(jpeg|jpg|png|gif)$/i,
  },

  // Map configuration
  MAP: {
    DEFAULT_CENTER: [16.047079, 108.20623], // Vietnam center
    DEFAULT_ZOOM: 6,
    REGION_ZOOM: 8,
    TILE_URL: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    MAX_ZOOM: 18,
    ATTRIBUTION: "© OpenStreetMap contributors",
    CIRCLE_RADIUS: 20000,
    ANIMATION_DELAY: 300,
  },

  // UI settings
  UI: {
    LOADING_DELAY: 1000,
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 3000,
    DEBOUNCE_DELAY: 300,
  },

  // Error messages
  MESSAGES: {
    ERRORS: {
      FILE_TOO_LARGE: "File quá lớn! Vui lòng chọn file nhỏ hơn 10MB.",
      INVALID_FILE_TYPE: "Vui lòng chọn file hình ảnh (JPG, PNG, GIF)!",
      UPLOAD_FAILED: "Lỗi khi tải lên hình ảnh!",
      ANALYSIS_FAILED: "Phân tích thất bại: ",
      SYSTEM_ERROR: "Lỗi hệ thống! Vui lòng thử lại.",
      PI_CONNECTION_FAILED: "Không thể kết nối với Raspberry Pi!",
      PI_NO_IMAGE: "Không tìm thấy ảnh từ Raspberry Pi.",
      RECIPE_LOAD_FAILED: "Lỗi tải công thức nấu ăn",
      DESTINATION_LOAD_FAILED: "Không thể tải dữ liệu bản đồ.",
      MAP_LOAD_FAILED: "Lỗi tải bản đồ",
      GEOLOCATION_FAILED: "Không thể định vị địa điểm",
    },

    SUCCESS: {
      ANALYSIS_COMPLETE: "Phân tích hoàn tất!",
      IMAGE_UPLOADED: "Ảnh đã được tải lên thành công!",
      RECIPE_SHARED: "Đã chia sẻ công thức!",
      LINK_COPIED: "Đã copy link chia sẻ!",
    },

    INFO: {
      NO_RESULTS:
        'Chưa có kết quả phân tích. Vui lòng upload ảnh ở tab "Nhận diện món ăn"',
      NO_RECIPE: "Không tìm thấy công thức cho món ăn đã nhận diện",
      NO_DESTINATION: "Không tìm thấy thông tin địa danh phù hợp.",
      ANALYZING: "Đang phân tích hình ảnh...",
    },
  },
};
