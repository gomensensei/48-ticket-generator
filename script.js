// script.js 最終完整重構版本（2025/04 完整整合）
// 功能包含：所有欄位、夜間模式、QR code、PDF/PNG 匯出、語言系統、成員主題顏色、圖鑑等

let langData = {};
let membersData = [];

document.addEventListener("DOMContentLoaded", async () => {
  await preloadFonts();
  await loadLangs();
  await loadMembers();

  const lang = localStorage.getItem("lang") || "ja";
  document.getElementById("langSelect").value = lang;
  changeLanguage(lang);

  initDefaults();

  if (localStorage.getItem("dark") === "1") {
    document.body.classList.add("dark");
    document.getElementById("darkModeToggle").checked = true;
  }

  // 綁定輸入事件
  const inputs = document.querySelectorAll("input, textarea, select");
  inputs.forEach(el => el.addEventListener("input", debounce(drawTicket, 300)));

  // 成員選單改變時預覽
  document.getElementById("memberSelect").addEventListener("change", () => {
    drawTicket();
    showMemberPreview();
  });

  // 套用主題色
  document.getElementById("applyMemberTheme").addEventListener("change", drawTicket);

  // 夜間模式
  document.getElementById("darkModeToggle").addEventListener("change", (e) => {
    const enabled = e.target.checked;
    document.body.classList.toggle("dark", enabled);
    localStorage.setItem("dark", enabled ? "1" : "0");
    drawTicket();
  });

  // 語言選擇
  document.getElementById("langSelect").addEventListener("change", (e) => {
    const selected = e.target.value;
    localStorage.setItem("lang", selected);
    changeLanguage(selected);
  });

  // 匯出功能
  document.getElementById("download300").addEventListener("click", () => downloadTicket(300));
  document.getElementById("download70").addEventListener("click", () => downloadTicket(70));
  document.getElementById("downloadPDF").addEventListener("click", downloadPDF);

  drawTicket();
});

async function loadLangs() {
  const res = await fetch("langs.json");
  langData = await res.json();
}

async function loadMembers() {
  const res = await fetch("members.json");
  membersData = await res.json();
  const select = document.getElementById("memberSelect");
  select.innerHTML = '<option value="">--</option>';
  membersData.forEach(member => {
    const opt = document.createElement("option");
    opt.value = member.name_ja;
    opt.textContent = member.name_ja;
    select.appendChild(opt);
  });
}

function changeLanguage(lang) {
  const dict = langData[lang];
  if (!dict) return;
  document.querySelectorAll("[data-key]").forEach(el => {
    const key = el.getAttribute("data-key");
    if (dict[key]) el.textContent = dict[key];
  });
}

function showMemberPreview() {
  const val = document.getElementById("memberSelect").value;
  const member = membersData.find(m => m.name_ja === val);
  if (!member) return;
  document.getElementById("memberImage").src = member.image;
  document.getElementById("memberName").textContent = member.name_en;
  document.getElementById("memberColorSwatch").style.background = `linear-gradient(90deg, ${member.gradient[0]}, ${member.gradient[1]})`;
}

function initDefaults() {
  const sets = {
    text1: "AKB48", text2: "AKB48 THEATER 18:30", text3: "2025年4月4日（金）",
    text4: "岩立沙穂 生誕祭", text5: "出演メンバー：AKB48", text6: "特記事項なし",
    bgText: "2025.04.04", qrInput: "",
    fontSize1: "35", fontSize2: "18", fontSize3: "15", fontSize4: "15", fontSize5: "12", fontSize6: "10", fontSize9: "25",
    offsetX1: "0", offsetY1: "0", offsetX2: "0", offsetY2: "0", offsetX3: "0", offsetY3: "0",
    offsetX4: "0", offsetY4: "0", offsetX5: "0", offsetY5: "0", offsetX6: "0", offsetY6: "0", offsetX9: "0", offsetY9: "0",
    letterSpacing1: "0", letterSpacing2: "0", letterSpacing3: "0", letterSpacing4: "0", letterSpacing5: "0",
    letterSpacing6: "0", letterSpacing9: "0", lineHeight1: "1", lineHeight2: "1", lineHeight3: "1",
    lineHeight4: "1", lineHeight5: "1", lineHeight6: "1", lineHeight9: "1",
    fontFamily1: "KozGoPr6N", fontFamily2: "AR ADGothicJP", fontFamily3: "AR ADGothicJP",
    fontFamily4: "AR ADGothicJP", fontFamily5: "AR ADGothicJP", fontFamily6: "AR ADGothicJP",
    fontFamily9: "Alternate Gothic No2 D Regular"
  };
  for (let key in sets) {
    const el = document.getElementById(key);
    if (el) el.value = sets[key];
  }
}

function drawTicket() {
  const canvas = document.getElementById("ticketCanvas");
  const ctx = canvas.getContext("2d");

  // 設定尺寸
  canvas.width = 1843;
  canvas.height = 839;

  // 背景漸層
  const selected = document.getElementById("memberSelect").value;
  const applyTheme = document.getElementById("applyMemberTheme").checked;
  const member = membersData.find(m => m.name_ja === selected);
  if (applyTheme && member) {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, member.gradient[0]);
    gradient.addColorStop(1, member.gradient[1]);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = "#fff4f6";
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 文字區
  ctx.fillStyle = "#000";
  ctx.font = "bold 32px KozGoPr6N";
  ctx.fillText(document.getElementById("text1").value, 100, 100);
  ctx.font = "18px AR ADGothicJP";
  ctx.fillText(document.getElementById("text2").value, 100, 160);
  ctx.fillText(document.getElementById("text3").value, 100, 200);
  ctx.fillText(document.getElementById("text4").value, 100, 240);
  ctx.fillText(document.getElementById("text5").value, 100, 280);
  ctx.fillText(document.getElementById("text6").value, 100, 320);

  // BG Text
  ctx.font = "60px 'Alternate Gothic No2 D Regular'";
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  ctx.fillText(document.getElementById("bgText").value, 300, 700);

  // QR Code
  const qr = document.getElementById("qrInput").value;
  if (qr) drawQRCodeToCanvas(canvas, qr);
}

function downloadTicket(dpi) {
  const canvas = document.getElementById("ticketCanvas");
  const link = document.createElement("a");
  link.download = `ticket_${dpi}dpi.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function downloadPDF() {
  const canvas = document.getElementById("ticketCanvas");
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jspdf.jsPDF("landscape", "pt", [canvas.width, canvas.height]);
  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save("ticket.pdf");
}

function debounce(func, delay) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(), delay);
  };
}

function preloadFonts() {
  return document.fonts.ready;
}

// 依賴 qrcode.js，將 QR code 畫上 canvas（右下角）
function drawQRCodeToCanvas(canvas, text) {
  const temp = document.createElement("div");
  const qr = new QRCode(temp, {
    text: text,
    width: 128,
    height: 128,
    correctLevel: QRCode.CorrectLevel.H
  });
  const img = temp.querySelector("img") || temp.querySelector("canvas");
  if (img) {
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, canvas.width - 138, canvas.height - 138, 128, 128);
  }
}