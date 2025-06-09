// ===== TRAVEL & MAP LOGIC =====

document
  .getElementById("travel-tab")
  .addEventListener("shown.bs.tab", function () {
    if (window.pendingTravelRender) {
      const { region, landmarks } = window.pendingTravelRender;
      initVietnamMap(region, landmarks);
      window.latestTravelRegion = region;
      window.latestTravelLandmarks = landmarks;
      window.pendingTravelRender = null;
    } else if (window.latestTravelRegion) {
      initVietnamMap(window.latestTravelRegion, window.latestTravelLandmarks);
    }
  });

function displayTravel(key) {
  const mapContainer = document.getElementById("vietnamMap");
  if (!mapContainer) return;

  mapContainer.innerHTML = `<div class="map-loading">
    <div class="spinner-border text-primary" role="status"></div>
    <p class="mt-3">Đang tải bản đồ vùng miền...</p>
  </div>`;

  fetch("/static/assets/data/destinations.json")
    .then((res) => res.json())
    .then((destinations) => {
      const travelInfo = destinations[key];
      if (!travelInfo) {
        mapContainer.innerHTML = `<div class="text-danger text-center p-4">
          <i class="fas fa-exclamation-triangle fa-2x mb-2"></i><br>
          Không tìm thấy thông tin địa danh phù hợp.
        </div>`;
        return;
      }

      document.getElementById(
        "regionTitle"
      ).innerText = `Khám phá vùng miền: ${travelInfo.region}`;
      document.getElementById("regionDescription").innerText =
        travelInfo.description;

      const travelTabPane = document.getElementById("travel");
      if (!travelTabPane.classList.contains("active")) {
        window.pendingTravelRender = {
          region: travelInfo.region,
          landmarks: travelInfo.landmarks || [],
        };
      } else {
        initVietnamMap(travelInfo.region, travelInfo.landmarks);
      }

      window.latestTravelRegion = travelInfo.region;
      window.latestTravelLandmarks = travelInfo.landmarks || [];
    })
    .catch((err) => {
      console.error("Lỗi khi tải thông tin địa danh:", err);
      mapContainer.innerHTML = `<div class="text-danger text-center p-4">
        <i class="fas fa-exclamation-triangle fa-2x mb-2"></i><br>
        Không thể tải dữ liệu bản đồ.
      </div>`;
    });
}

function initVietnamMap(regionName, landmarks) {
  const mapContainer = document.getElementById("vietnamMap");
  if (!mapContainer) return;

  if (window.vietnamMap) {
    window.vietnamMap.remove();
  }

  mapContainer.innerHTML = "";
  const mapDiv = document.createElement("div");
  mapDiv.id = "vietnamMapInternal";
  mapDiv.style.height = "500px";
  mapDiv.style.borderRadius = "15px";
  mapContainer.appendChild(mapDiv);

  const center = [16.047079, 108.20623];
  const map = L.map("vietnamMapInternal").setView(center, 6);
  window.vietnamMap = map;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap",
    errorTileUrl:
      "data:image/svg+xml;base64," +
      btoa(
        `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><rect width='256' height='256' fill='#eee'/><text x='50%' y='50%' text-anchor='middle' fill='#999' font-size='18' dy='.3em'>Lỗi bản đồ</text></svg>`
      ),
  }).addTo(map);

  fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${regionName}, Vietnam`
  )
    .then((res) => res.json())
    .then((results) => {
      if (results.length > 0) {
        const { lat, lon } = results[0];
        L.circle([parseFloat(lat), parseFloat(lon)], {
          color: "red",
          fillColor: "#f03",
          fillOpacity: 0.3,
          radius: 20000,
        })
          .addTo(map)
          .bindPopup(`Vùng đặc trưng: ${regionName}`);
        map.setView([parseFloat(lat), parseFloat(lon)], 8);
      }
    });

  landmarks.forEach((name) => {
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${name}, Vietnam`
    )
      .then((res) => res.json())
      .then((results) => {
        if (results.length > 0) {
          const { lat, lon } = results[0];
          L.marker([parseFloat(lat), parseFloat(lon)])
            .addTo(map)
            .bindPopup(name);
        }
      })
      .catch((err) => console.warn("Lỗi khi định vị địa danh:", name, err));
  });

  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "info legend");
    div.innerHTML = `
      <h6 class="mb-1">Chú thích</h6>
      <div><span style="background:red;display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:5px;"></span> Vùng đặc trưng</div>
      <div><i class="fas fa-map-marker-alt text-primary me-2"></i> Địa danh nổi bật</div>`;
    return div;
  };
  legend.addTo(map);

  setTimeout(() => map.invalidateSize(), 300);
}
