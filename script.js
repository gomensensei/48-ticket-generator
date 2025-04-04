// script.js（最終重構整合版）


document.addEventListener("DOMContentLoaded", async () => {
  await loadLangs();
  setupLangSelector();

  initDarkMode();
  setupDarkToggle();

  // 初始化畫布與繪製流程
  initCanvas();
  initInputs();
  drawCanvas();
});

function initDarkMode() {
  const enabled = localStorage.getItem("dark") === "1";
  document.body.classList.toggle("dark", enabled);
  const toggle = document.getElementById("darkToggle");
  if (toggle) toggle.checked = enabled;
}

function setupDarkToggle() {
  const toggle = document.getElementById("darkToggle");
  if (!toggle) return;
  toggle.addEventListener("change", () => {
    const enabled = toggle.checked;
    document.body.classList.toggle("dark", enabled);
    localStorage.setItem("dark", enabled ? "1" : "0");
    drawCanvas();
  });
}

function initInputs() {
  document.querySelectorAll("input, select, textarea").forEach(el => {
    el.addEventListener("input", debounce(drawCanvas, 200));
  });
}

// debounce 避免過度頻繁重繪
function debounce(func, delay) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(), delay);
  };
}

function drawCanvas() {
  const canvas = document.getElementById("ticket");
  const ctx = canvas.getContext("2d");

  const includeBleed = document.getElementById("bleed")?.checked;
  const w = includeBleed ? 1890 : 1843;
  const h = includeBleed ? 886 : 839;

  canvas.width = w;
  canvas.height = h;

  // 清空
  ctx.clearRect(0, 0, w, h);

  // 開始繪圖流程
  drawBackground(ctx, w, h);
  drawLogo(ctx, w, h);
  drawMainText(ctx, w, h);
  drawBorder(ctx, w, h);
  drawQR(ctx, w, h);
}

function drawBackground(ctx, w, h) {
  const bgColor = document.getElementById("bgColor")?.value || "#ffffff";
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  // 背景文字
  const text = document.getElementById("bgText")?.value || "";
  const textColor = document.getElementById("bgTextColor")?.value || "#eeeeee";
  const shadowColor = document.getElementById("bgShadowColor")?.value || "#cccccc";

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.font = "bold 180px 'KozGoPr6N', sans-serif";
  ctx.fillStyle = shadowColor;
  ctx.fillText(text, 4, 4);
  ctx.fillStyle = textColor;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawLogo(ctx, w, h) {
  const show = document.getElementById("showLogo")?.checked;
  if (!show) return;

  const bg = document.getElementById("logoBg")?.value || "#0071bc";
  const color = document.getElementById("logoColor")?.value || "#ffffff";
  const bleed = document.getElementById("bleed")?.checked;

  const x = bleed ? 60 : 30;
  const y = bleed ? 60 : 30;
  const width = 200;
  const height = 100;

  ctx.fillStyle = bg;
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = color;
  ctx.font = "bold 36px 'KozGoPr6N', sans-serif";
  ctx.fillText("AKB", x + 20, y + 40);
  ctx.fillText("48", x + 20, y + 80);
}

function drawMainText(ctx, w, h) {
  const get = id => document.getElementById(id)?.value || "";

  const color = document.getElementById("textColor")?.value || "#000000";
  ctx.fillStyle = color;

  const font = "32px 'jadhei01m', sans-serif";
  ctx.font = font;

  const left = 270;
  const top = 150;
  const lineHeight = 42;

  const lines = [
    get("logo1"),
    get("logo2"),
    get("event"),
    get("birthday1"),
    get("birthday2"),
    get("date1"),
    get("date2"),
    `整理番号：${get("number")}`,
    `郵便番号：${get("postal")}`,
    get("venue"),
    get("tel"),
    get("extra")
  ];

  lines.forEach((txt, i) => {
    ctx.fillText(txt, left, top + i * lineHeight);
  });
}

function drawBorder(ctx, w, h) {
  const bg = document.getElementById("borderColor")?.value || "#f6c6d0";
  const textColor = document.getElementById("borderTextColor")?.value || "#000";

  ctx.fillStyle = bg;
  ctx.fillRect(0, h - 40, w, 40); // 底部條
  ctx.fillRect(0, 0, 20, h);      // 左側條
  ctx.fillRect(w - 20, 0, 20, h); // 右側條

  ctx.fillStyle = textColor;
  ctx.font = "20px 'KozGoPr6N', sans-serif";
  ctx.fillText("© AKB48", 30, h - 15);
  ctx.fillText("※PayPay ID: gomensensei", w - 280, h - 15);
}

function drawQR(ctx, w, h) {
  const show = document.getElementById("showQR")?.checked;
  if (!show) return;

  const qrColor = document.getElementById("qrColor")?.value || "#000";
  const imgInput = document.getElementById("qrImage");
  const qrUrl = document.getElementById("qrUrl")?.value;

  const x = w - 220;
  const y = 30;
  const size = 160;

  ctx.fillStyle = "#fff";
  ctx.fillRect(x - 10, y - 10, size + 20, size + 20);
  ctx.strokeStyle = qrColor;
  ctx.strokeRect(x - 10, y - 10, size + 20, size + 20);

  // 使用上傳圖像
  if (imgInput?.files?.length) {
    const file = imgInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, x, y, size, size);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  } else if (qrUrl) {
    // 使用 QR code library 自動產生
    const temp = document.createElement("div");
    const qr = new QRCode(temp, {
      text: qrUrl,
      width: size,
      height: size,
      colorDark: qrColor,
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    setTimeout(() => {
      const img = temp.querySelector("img");
      if (img) {
        const qrImg = new Image();
        qrImg.onload = () => ctx.drawImage(qrImg, x, y, size, size);
        qrImg.src = img.src;
      }
    }, 100);
  }
}

function exportImage(dpi = 300) {
  const canvas = document.getElementById("ticket");
  const scale = dpi / 96; // 假設預設為 96dpi

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width * scale;
  exportCanvas.height = canvas.height * scale;

  const ctx = exportCanvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.drawImage(canvas, 0, 0);

  const link = document.createElement("a");
  link.download = \`ticket_${dpi}dpi.png\`;
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
}

function exportPDF() {
  const canvas = document.getElementById("ticket");
  const imgData = canvas.toDataURL("image/jpeg", 1.0);
  const pdf = new jspdf.jsPDF("l", "mm", [150, 65]);

  pdf.addImage(imgData, "JPEG", 0, 0, 150, 65);
  pdf.save("ticket.pdf");
}

function setupExportButtons() {
  document.getElementById("download300")?.addEventListener("click", () => exportImage(300));
  document.getElementById("download70")?.addEventListener("click", () => exportImage(70));
  document.getElementById("downloadPDF")?.addEventListener("click", exportPDF);
}

let members = [];

async function loadMembers() {
  const res = await fetch("members.json");
  members = await res.json();

  const select = document.getElementById("memberSelect");
  select.innerHTML = '<option value="">（選択なし）</option>';
  members.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.name;
    opt.textContent = m.name;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    const selected = members.find(m => m.name === select.value);
    if (!selected) return;

    if (document.getElementById("applyTheme")?.checked) {
      document.getElementById("bgColor").value = selected.color.bg;
      document.getElementById("textColor").value = selected.color.text;
      document.getElementById("borderColor").value = selected.color.border;
      document.getElementById("logoColor").value = selected.color.logo;
      drawCanvas();
    }

    // 顯示圖鑑資訊
    const info = document.getElementById("memberInfo");
    if (!info) return;
    info.innerHTML = `
      <img src="${selected.image}" alt="${selected.name}" style="width:100px;height:auto;"><br>
      <strong>${selected.name}</strong><br>
      <span>${selected.name_en}</span>
    `;
  });
}

function setupUploaders() {
  // 字體上傳
  const fontInput = document.getElementById("fontFile");
  fontInput?.addEventListener("change", () => {
    if (fontInput.files.length === 0) return;
    const file = fontInput.files[0];
    if (!file.name.endsWith(".woff2")) {
      alert("請上傳 .woff2 格式字體！");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const fontData = e.target.result;
      const newFont = new FontFace("customFont", fontData, {});
      newFont.load().then(loaded => {
        document.fonts.add(loaded);
        drawCanvas();
      });
    };
    reader.readAsArrayBuffer(file);
  });

  // 背景圖上傳
  const bgInput = document.getElementById("bgImage");
  bgInput?.addEventListener("change", () => {
    if (bgInput.files.length === 0) return;
    const file = bgInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.getElementById("ticket");
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
      document.getElementById(btn.dataset.target).style.display = "block";
    });
  });
}

function setupPreviewZoom() {
  const zoom = document.getElementById("previewZoom");
  if (!zoom) return;
  zoom.addEventListener("change", () => {
    const canvas = document.getElementById("ticket");
    const scale = parseFloat(zoom.value);
    canvas.style.transform = \`scale(\${scale})\`;
  });
}

// 啟用所有 UI 功能
document.addEventListener("DOMContentLoaded", () => {
  setupExportButtons();
  setupUploaders();
  setupTabs();
  setupPreviewZoom();
  loadMembers();
});
