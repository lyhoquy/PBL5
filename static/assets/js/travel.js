// ===== TRAVEL & MAP LOGIC - FIXED VERSION =====
const MAPBOX_TOKEN =
  "pk.eyJ1Ijoia2lhbmRhcyIsImEiOiJjbWJvd2g0Y3QyMHZ6Mm5weXZtcnNobmNiIn0.dnwxdURmEZn7hxvqXojW9Q";
// Improved state management with proper encapsulation
const TravelManager = {
  map: null,
  mapContainer: null,
  isInitialized: false,
  isLoading: false,
  latestTravelData: null,
  pendingTravelRender: null,
  requestQueue: [], // For API rate limiting

  // Initialize the travel manager
  init() {
    this.bindEvents();
    this.setupMapContainer();
  },

  // Bind event listeners
  bindEvents() {
    document.addEventListener("DOMContentLoaded", () => {
      const travelTab = document.getElementById("travel-tab");
      if (travelTab) {
        travelTab.addEventListener("shown.bs.tab", () => {
          this.handleTravelTabActivation();
        });
      }
    });
  },

  // Setup map container reference
  setupMapContainer() {
    this.mapContainer = document.getElementById("vietnamMap");
    if (!this.mapContainer) {
      console.error("Map container not found");
    }
  },

  // Handle travel tab activation with proper error handling
  async handleTravelTabActivation() {
    if (this.isLoading) {
      console.log("Map is currently loading, skipping activation");
      return;
    }

    try {
      // Check if we have pending data to render
      if (this.pendingTravelRender) {
        console.log("Rendering pending travel data:", this.pendingTravelRender);
        const { region, landmarks, description } = this.pendingTravelRender;
        await this.renderTravelContent(region, landmarks, description);
        this.pendingTravelRender = null;
      }
      // Check if we have latest data to re-render
      else if (this.latestTravelData) {
        console.log("Re-rendering latest travel data:", this.latestTravelData);
        const { region, landmarks, description } = this.latestTravelData;
        await this.renderTravelContent(region, landmarks, description);
      }
      // Show default Vietnam map if no specific data
      else {
        console.log("No travel data, showing default Vietnam map");
        await this.showDefaultVietnamMap();
      }
    } catch (error) {
      console.error("Error in handleTravelTabActivation:", error);
      this.showMapError("Lỗi khi tải bản đồ");
    }
  },

  // Main display function with improved error handling
  async displayTravel(key) {
    console.log("displayTravel called with key:", key);

    if (!this.mapContainer) {
      console.error("Map container not found");
      return;
    }

    if (this.isLoading) {
      console.log("Already loading, ignoring request");
      return;
    }

    this.isLoading = true;
    this.showMapLoading();

    try {
      const destinations = await this.loadDestinations();
      const travelInfo = destinations[key];

      if (!travelInfo) {
        throw new Error(`Không tìm thấy thông tin cho key: ${key}`);
      }

      console.log("Travel info loaded:", travelInfo);

      // Store the latest travel data
      this.latestTravelData = {
        region: travelInfo.region,
        landmarks: travelInfo.landmarks || [],
        description: travelInfo.description || "",
      };

      // Check if travel tab is currently active
      const travelTabPane = document.getElementById("travel");
      const isActive =
        travelTabPane && travelTabPane.classList.contains("active");

      if (isActive) {
        // Render immediately if tab is active
        await this.renderTravelContent(
          travelInfo.region,
          travelInfo.landmarks || [],
          travelInfo.description || ""
        );
      } else {
        // Store for later rendering when tab becomes active
        this.pendingTravelRender = {
          region: travelInfo.region,
          landmarks: travelInfo.landmarks || [],
          description: travelInfo.description || "",
        };
        console.log("Travel data stored for pending render");
      }
    } catch (err) {
      console.error("Error loading travel data:", err);
      this.showMapError(`Không thể tải dữ liệu: ${err.message}`);
    } finally {
      this.isLoading = false;
    }
  },

  // Load destinations with proper error handling
  async loadDestinations() {
    const response = await fetch("/static/assets/data/destinations.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  // Render travel content with proper async handling
  async renderTravelContent(region, landmarks, description) {
    console.log("renderTravelContent called:", {
      region,
      landmarks,
      description,
    });

    try {
      // Update UI elements safely
      this.updateTravelUI(region, description);

      // Initialize map with proper async handling
      await this.initVietnamMap(region, landmarks);
    } catch (error) {
      console.error("Error in renderTravelContent:", error);
      this.showMapError("Lỗi khi hiển thị nội dung du lịch");
    }
  },

  // Update travel UI elements safely
  updateTravelUI(region, description) {
    const regionTitle = document.getElementById("regionTitle");
    const regionDescription = document.getElementById("regionDescription");

    if (regionTitle) {
      regionTitle.textContent = `Khám phá vùng miền: ${region}`;
    }

    if (regionDescription) {
      regionDescription.textContent =
        description || `Khám phá các địa danh nổi tiếng tại ${region}`;
    }
  },

  // Initialize Vietnam map with proper cleanup and error handling
  async initVietnamMap(regionName, landmarks = []) {
    console.log("initVietnamMap called:", { regionName, landmarks });

    if (!this.mapContainer) {
      console.error("Map container not found");
      return;
    }

    try {
      // Clean up existing map properly
      await this.cleanupMap();

      // Create fresh map container
      this.createMapContainer();

      // Wait for DOM to settle before creating map
      await this.delay(100);

      // Create Leaflet map
      await this.createLeafletMap(regionName, landmarks);
    } catch (error) {
      console.error("Error in initVietnamMap:", error);
      this.showMapError("Lỗi khởi tạo bản đồ");
    }
  },

  // Improved cleanup with proper error handling
  async cleanupMap() {
    if (this.map) {
      try {
        // Remove all layers first
        this.map.eachLayer((layer) => {
          try {
            this.map.removeLayer(layer);
          } catch (e) {
            console.warn("Error removing layer:", e);
          }
        });

        // Remove map instance
        this.map.remove();
        console.log("Map cleaned up successfully");
      } catch (error) {
        console.error("Error during map cleanup:", error);
      } finally {
        this.map = null;
        this.isInitialized = false;
      }
    }
  },

  // Create map container with proper structure
  createMapContainer() {
    if (!this.mapContainer) return;

    // Clear container
    this.mapContainer.innerHTML = "";

    // Create new map div with proper styling
    const mapDiv = document.createElement("div");
    mapDiv.id = "vietnamMapInternal";
    mapDiv.style.height = "500px";
    mapDiv.style.borderRadius = "15px";
    mapDiv.style.overflow = "hidden";
    mapDiv.style.position = "relative";

    this.mapContainer.appendChild(mapDiv);
  },

  // Create Leaflet map with proper configuration
  async createLeafletMap(regionName, landmarks) {
    try {
      const center = [16.047079, 108.20623]; // Vietnam center

      // Ensure Leaflet is loaded
      if (typeof L === "undefined") {
        throw new Error("Leaflet library not loaded");
      }

      // Check if map container exists
      const mapElement = document.getElementById("vietnamMapInternal");
      if (!mapElement) {
        throw new Error("Map container element not found");
      }

      // Create map instance with proper configuration
      const map = L.map("vietnamMapInternal", {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        attributionControl: true,
      }).setView(center, 6);

      // Store map reference
      this.map = map;

      // Add tile layer with proper error handling
      const tileLayer = L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
        {
          tileSize: 512,
          zoomOffset: -1,
          maxZoom: 18,
          attribution:
            '© <a href="https://www.mapbox.com/">Mapbox</a> © OpenStreetMap contributors',
        }
      );

      tileLayer.addTo(map);

      // Handle tile load errors
      tileLayer.on("tileerror", (error) => {
        console.warn("Tile load error:", error);
      });

      // Handle map errors
      map.on("error", (error) => {
        console.warn("Map error:", error);
      });

      // Wait for map to be ready
      await this.delay(200);

      // Add region and landmarks with rate limiting
      await this.addRegionToMap(map, regionName);
      await this.addLandmarksToMap(map, landmarks);
      this.addMapLegend(map);

      // Ensure map renders properly
      setTimeout(() => {
        try {
          map.invalidateSize();
          this.isInitialized = true;
          console.log("Map initialized successfully");
        } catch (error) {
          console.warn("Error invalidating map size:", error);
          this.isInitialized = true; // Still mark as initialized
        }
      }, 100);
    } catch (error) {
      console.error("Error creating Leaflet map:", error);
      this.showMapError(`Lỗi tạo bản đồ: ${error.message}`);
    }
  },

  // Add region to map with proper error handling
  async addRegionToMap(map, regionName) {
    if (!regionName || !map) return;

    try {
      const results = await this.geocodeLocation(`${regionName}, Vietnam`);
      if (results && results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const coords = [parseFloat(lat), parseFloat(lon)];

        // Add region circle
        const regionCircle = L.circle(coords, {
          color: "#dc3545",
          fillColor: "#dc3545",
          fillOpacity: 0.2,
          radius: 50000,
          weight: 2,
        }).addTo(map);

        regionCircle.bindPopup(`
          <div class="text-center">
            <h6 class="mb-1">${regionName}</h6>
            <small class="text-muted">${display_name}</small>
          </div>
        `);

        // Center map on region
        map.setView(coords, 8);
        console.log("Region added to map:", regionName);
      }
    } catch (error) {
      console.warn("Error adding region to map:", regionName, error);
    }
  },

  // Add landmarks with proper rate limiting
  async addLandmarksToMap(map, landmarks) {
    if (!landmarks || landmarks.length === 0 || !map) return;

    for (let i = 0; i < landmarks.length; i++) {
      const landmark = landmarks[i];

      try {
        // Rate limiting: wait between requests
        if (i > 0) {
          await this.delay(500); // 500ms between requests
        }

        const results = await this.geocodeLocation(`${landmark}, Vietnam`);
        if (results && results.length > 0) {
          const { lat, lon, display_name } = results[0];
          const coords = [parseFloat(lat), parseFloat(lon)];

          // Create marker
          const marker = L.marker(coords, {
            title: landmark,
          }).addTo(map);

          marker.bindPopup(`
            <div class="text-center">
              <h6 class="mb-1">${landmark}</h6>
              <small class="text-muted">${display_name}</small>
            </div>
          `);

          console.log("Landmark added:", landmark);
        }
      } catch (error) {
        console.warn("Error adding landmark:", landmark, error);
      }
    }
  },

  // Geocoding with proper error handling and rate limiting
  async geocodeLocation(query) {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "VietnamFoodApp/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    return response.json();
  },

  // Add map legend
  addMapLegend(map) {
    if (!map) return;

    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "map-legend");
      div.innerHTML = `
        <div class="bg-white p-2 rounded shadow-sm">
          <h6 class="mb-2 text-primary">Chú thích</h6>
          <div class="mb-1">
            <span style="background:#dc3545;display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:8px;"></span>
            <small>Vùng đặc trưng</small>
          </div>
          <div>
            <i class="fas fa-map-marker-alt text-primary me-1"></i>
            <small>Địa danh nổi bật</small>
          </div>
        </div>
      `;
      return div;
    };

    legend.addTo(map);
  },

  // Show default Vietnam map
  async showDefaultVietnamMap() {
    console.log("Showing default Vietnam map");

    if (!this.mapContainer) return;

    // Update UI for default view
    this.updateTravelUI("Việt Nam", "Khám phá đất nước Việt Nam xinh đẹp");

    // Show default map
    await this.initVietnamMap("Việt Nam", []);
  },

  // Show loading state
  showMapLoading() {
    if (!this.mapContainer) return;

    this.mapContainer.innerHTML = `
      <div class="map-loading d-flex flex-column align-items-center justify-content-center" style="height: 500px;">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
        <p class="text-muted">Đang tải bản đồ vùng miền...</p>
      </div>
    `;
  },

  // Show error state
  showMapError(message) {
    if (!this.mapContainer) return;

    this.mapContainer.innerHTML = `
      <div class="map-error d-flex flex-column align-items-center justify-content-center text-center p-4" style="height: 500px;">
        <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
        <h6 class="text-danger mb-2">Lỗi tải bản đồ</h6>
        <p class="text-muted mb-3">${message}</p>
        <button class="btn btn-outline-primary btn-sm" onclick="location.reload()">
          <i class="fas fa-refresh me-1"></i>Tải lại trang
        </button>
      </div>
    `;
  },

  // Create error tile URL with proper UTF-8 encoding
  createErrorTileUrl() {
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>
        <rect width='256' height='256' fill='#f8f9fa'/>
        <text x='50%' y='50%' text-anchor='middle' fill='#6c757d' font-size='14' dy='.3em'>
          Map Error
        </text>
      </svg>
    `;

    try {
      // Use URL encoding instead of base64 to avoid character encoding issues
      return "data:image/svg+xml," + encodeURIComponent(svg);
    } catch (error) {
      console.warn("Error creating error tile URL:", error);
      // Fallback to a simple colored rectangle
      return (
        "data:image/svg+xml," +
        encodeURIComponent(`
        <svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>
          <rect width='256' height='256' fill='#f8f9fa'/>
        </svg>
      `)
      );
    }
  },

  // Utility function for delays
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  // Check if map is ready
  isMapReady() {
    return (
      this.isInitialized &&
      this.map &&
      document.getElementById("vietnamMapInternal")
    );
  },
};

// Initialize the travel manager
TravelManager.init();

// Export functions for backward compatibility
window.displayTravel = (key) => TravelManager.displayTravel(key);
window.initVietnamMap = (region, landmarks) =>
  TravelManager.initVietnamMap(region, landmarks);
window.isMapReady = () => TravelManager.isMapReady();
