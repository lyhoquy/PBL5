// ===== API CALL HELPERS =====

function fetchJSON(url, options = {}) {
  return fetch(url, options).then((res) => {
    if (!res.ok) throw new Error("API Error");
    return res.json();
  });
}

function postFormData(url, formData) {
  return fetch(url, {
    method: "POST",
    body: formData,
  }).then((res) => {
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  });
}
