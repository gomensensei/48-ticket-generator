
let currentLang = "ja";
let langs = {};
let members = [];
let selectedMember = null;

async function loadLangs() {
  const res = await fetch("langs.json");
  langs = await res.json();
  applyLang(currentLang);
}

function applyLang(lang) {
  currentLang = lang;
  const dict = langs[lang] || langs["ja"];
  document.querySelectorAll("[data-lang-key]").forEach(el => {
    const key = el.dataset.langKey;
    if (dict[key]) el.textContent = dict[key];
  });
  document.getElementById("disclaimer").textContent = dict["disclaimer"];
  document.getElementById("paypay-id").textContent = dict["paypay_id"];
  document.getElementById("copyright").textContent = dict["copyright_notice"];
  document.title = dict["site_title"];
}

document.getElementById("lang-select").addEventListener("change", e => {
  applyLang(e.target.value);
});

document.getElementById("darkmode-toggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// 分頁切換
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab-content").forEach(t => t.style.display = "none");
    document.getElementById(`tab-${tab}`).style.display = "block";
  });
});

// 成員選單與主題色
async function loadMembers() {
  const res = await fetch("members.json");
  members = await res.json();
  const select = document.getElementById("member-select");
  members.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.name_ja;
    opt.textContent = m.name_ja;
    select.appendChild(opt);
  });
}

document.getElementById("member-select").addEventListener("change", e => {
  const name = e.target.value;
  const member = members.find(m => m.name_ja === name);
  if (!member) return;
  selectedMember = member;
  const apply = document.getElementById("apply-theme").checked;
  if (apply) applyMemberTheme(member);
  const info = document.getElementById("member-info");
  info.innerHTML = `
    <img src="${member.image}" style="width:120px;border-radius:0.5rem" />
    <p>${member.name_ja} / ${member.name_en}</p>
    <div style="width:100px;height:10px;background:${member.color}"></div>
  `;
});

function applyMemberTheme(member) {
  document.documentElement.style.setProperty("--accent-color", member.color);
  document.body.style.background = `linear-gradient(135deg, ${member.gradient[0]}, ${member.gradient[1]})`;
}

// 預覽縮放控制
document.getElementById("preview-scale").addEventListener("change", e => {
  const scale = parseFloat(e.target.value);
  const canvas = document.getElementById("ticket-canvas");
  canvas.style.transform = `scale(${scale})`;
});

// 即時更新
const inputFields = ["logo1", "logo2", "event", "bday1", "bday2", "date1", "date2", "number", "postal", "venue", "tel", "note", "bgtext"];
inputFields.forEach(id => {
  document.getElementById(id).addEventListener("input", debounce(drawTicket, 300));
});

function drawTicket() {
  const canvas = document.getElementById("ticket-canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "32px 'KozGoPr6N-Medium', sans-serif";
  ctx.fillStyle = "#000";
  ctx.fillText(document.getElementById("logo1").value, 80, 100);
  ctx.fillText(document.getElementById("logo2").value, 80, 150);
  ctx.font = "20px sans-serif";
  ctx.fillText(document.getElementById("event").value, 80, 200);
  ctx.fillText(document.getElementById("bday1").value, 80, 250);
  ctx.fillText(document.getElementById("bday2").value, 80, 280);
  ctx.fillText(document.getElementById("date1").value, 80, 310);
  ctx.fillText(document.getElementById("date2").value, 80, 340);
  updateQRCode();
}

function debounce(func, wait) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, arguments), wait);
  };
}

// PNG 匯出
document.getElementById("download-300dpi").addEventListener("click", () => downloadImage(300));
document.getElementById("download-70dpi").addEventListener("click", () => downloadImage(70));

function downloadImage(dpi) {
  const canvas = document.getElementById("ticket-canvas");
  const scale = dpi / 96;
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width * scale;
  tempCanvas.height = canvas.height * scale;
  const ctx = tempCanvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.drawImage(canvas, 0, 0);
  const link = document.createElement("a");
  link.download = `ticket_${dpi}dpi.png`;
  link.href = tempCanvas.toDataURL("image/png");
  link.click();
}

// PDF 匯出
document.getElementById("download-pdf").addEventListener("click", () => {
  const canvas = document.getElementById("ticket-canvas");
  const bleed = document.getElementById("add-bleed").checked;
  const scale = 3;
  const pdfCanvas = document.createElement("canvas");
  pdfCanvas.width = canvas.width * scale;
  pdfCanvas.height = canvas.height * scale;
  const ctx = pdfCanvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.drawImage(canvas, 0, 0);
  const imgData = pdfCanvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [105 + (bleed ? 6 : 0), 74 + (bleed ? 6 : 0)]
  });
  const offset = bleed ? 3 : 0;
  pdf.addImage(imgData, "PNG", offset, offset, 105, 74);
  pdf.save("ticket.pdf");
});

// QR Code 自動生成
function updateQRCode() {
  const url = document.getElementById("qr-url").value;
  if (!url) return;
  const qrContainer = document.getElementById("qr-preview");
  qrContainer.innerHTML = "";
  const qr = new QRCode(qrContainer, {
    text: url,
    width: 128,
    height: 128,
    correctLevel: QRCode.CorrectLevel.H
  });
  setTimeout(() => {
    const qrImg = qrContainer.querySelector("img");
    if (!qrImg) return;
    const canvas = document.getElementById("ticket-canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      const show = document.getElementById("show-qr").checked;
      if (show) ctx.drawImage(img, canvas.width - 160, canvas.height - 160, 120, 120);
    };
    img.src = qrImg.src;
  }, 300);
}

document.getElementById("qr-url").addEventListener("input", debounce(updateQRCode, 500));
document.getElementById("show-qr").addEventListener("change", updateQRCode);

// 初始化
window.addEventListener("DOMContentLoaded", async () => {
  await loadLangs();
  await loadMembers();
  drawTicket();
});
