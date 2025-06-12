// ===== RECIPE DISPLAY LOGIC =====

function displayRecipe(key) {
  fetch("/static/assets/data/recipes.json")
    .then((res) => res.json())
    .then((recipes) => {
      const data = recipes[key];
      const content = document.getElementById("recipeContent");

      if (!data) {
        content.innerHTML = `<div class="text-center text-muted">
          <i class="fas fa-utensils fa-3x mb-3"></i>
          <p>Không tìm thấy công thức cho món ăn đã nhận diện</p>
          <small class="text-muted">Key tìm kiếm: ${key}</small>
        </div>`;
        return;
      }

      let html = `
        <div class="recipe-header text-center mb-4">
          <h4 class="mb-2">${data.name}</h4>
          ${
            data.description
              ? `<p class="text-muted">${data.description}</p>`
              : ""
          }
        </div>`;

      if (data.ingredients && Array.isArray(data.ingredients)) {
        html += `
          <div class="mb-4">
            <h5><i class="fas fa-shopping-basket text-success me-2"></i>Nguyên liệu</h5>
            <div class="table-responsive">
              <table class="table table-bordered table-striped">
                <thead class="table-light">
                  <tr>
                    <th>Nguyên liệu</th>
                    <th>Số lượng</th>
                    <th>Đơn vị</th>
                    <th>Công dụng</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.ingredients
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.quantity || "-"}</td>
                      <td>${item.unit || "-"}</td>
                      <td>${item.note || "-"}</td>
                    </tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>`;
      }

      if (data.recipe && Array.isArray(data.recipe)) {
        html += `
          <div class="mb-4">
            <h5><i class="fas fa-list-ol text-primary me-2"></i>Các bước thực hiện</h5>
            <div class="step-book">
              ${data.recipe
                .map(
                  (step, index) => `
                <div class="step-item mb-3">
                  <div class="step-number">Bước ${index + 1}:</div>
                  <div class="step-text">${step}</div>
                </div>`
                )
                .join("")}
            </div>
          </div>`;
      }

      html += `
        <div class="text-center mt-4">
          <button class="btn btn-outline-primary me-2" onclick="printRecipe()">
            <i class="fas fa-print"></i> In công thức
          </button>
          <button class="btn btn-outline-success" onclick="shareRecipe()">
            <i class="fas fa-share-alt"></i> Chia sẻ
          </button>
        </div>`;

      content.innerHTML = html;
    })
    .catch((err) => {
      console.error("Lỗi tải công thức:", err);
      document.getElementById("recipeContent").innerHTML = `
        <div class="text-center text-danger">
          <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
          <p>Lỗi tải công thức nấu ăn</p>
        </div>`;
    });
}

function printRecipe() {
  window.print();
}

function shareRecipe() {
  if (navigator.share) {
    navigator.share({
      title: "Công thức nấu ăn",
      text: "Xem công thức nấu ăn này!",
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert("Đã copy link chia sẻ!");
  }
}
export { displayRecipe, printRecipe, shareRecipe };
