(function () {
  "use strict";

  var DISMISS_MS = 24 * 60 * 60 * 1000;
  var deferredPrompt = null;
  var bar = null;
  var startX = 0;
  var startY = 0;

  var copy = {
    "zh-HK": {
      title: "將 Tool48 加到手機桌面",
      body: "之後可以像 App 一樣快速打開。",
      action: "加入",
      close: "關閉提示",
      ios: "iPhone 請用 Safari 分享選單，再選「加入主畫面」。",
      android: "Android 請用瀏覽器選單加入主畫面。"
    },
    "zh-TW": {
      title: "將 Tool48 加到手機桌面",
      body: "之後可以像 App 一樣快速打開。",
      action: "加入",
      close: "關閉提示",
      ios: "iPhone 請用 Safari 分享選單，再選「加入主畫面」。",
      android: "Android 請用瀏覽器選單加入主畫面。"
    },
    "zh-Hans": {
      title: "将 Tool48 加到手机桌面",
      body: "之后可以像 App 一样快速打开。",
      action: "加入",
      close: "关闭提示",
      ios: "iPhone 请用 Safari 分享菜单，再选“添加到主屏幕”。",
      android: "Android 请用浏览器菜单添加到主屏幕。"
    },
    ja: {
      title: "Tool48をホーム画面に追加",
      body: "次回からアプリのようにすぐ開けます。",
      action: "追加",
      close: "閉じる",
      ios: "iPhoneはSafariの共有メニューから「ホーム画面に追加」を選んでください。",
      android: "Androidはブラウザのメニューからホーム画面に追加してください。"
    },
    ko: {
      title: "Tool48을 홈 화면에 추가",
      body: "다음부터 앱처럼 빠르게 열 수 있어요.",
      action: "추가",
      close: "닫기",
      ios: "iPhone은 Safari 공유 메뉴에서 홈 화면에 추가를 선택해 주세요.",
      android: "Android는 브라우저 메뉴에서 홈 화면에 추가해 주세요."
    },
    th: {
      title: "เพิ่ม Tool48 ไปที่หน้าจอหลัก",
      body: "เปิดใช้งานครั้งต่อไปได้รวดเร็วเหมือนแอป",
      action: "เพิ่ม",
      close: "ปิด",
      ios: "บน iPhone ให้ใช้เมนูแชร์ของ Safari แล้วเลือกเพิ่มไปยังหน้าจอโฮม",
      android: "บน Android ให้ใช้เมนูของเบราว์เซอร์เพื่อเพิ่มไปยังหน้าจอหลัก"
    },
    id: {
      title: "Tambahkan Tool48 ke layar utama",
      body: "Buka lebih cepat seperti aplikasi.",
      action: "Tambah",
      close: "Tutup",
      ios: "Di iPhone, gunakan menu Bagikan Safari lalu pilih Tambah ke Layar Utama.",
      android: "Di Android, gunakan menu browser untuk menambahkannya ke layar utama."
    },
    en: {
      title: "Add Tool48 to your home screen",
      body: "Open it faster, just like an app.",
      action: "Add",
      close: "Dismiss",
      ios: "On iPhone, use Safari Share, then choose Add to Home Screen.",
      android: "On Android, use your browser menu to add it to the home screen."
    }
  };

  function normalizeLang(value) {
    var lang = String(value || "").trim();
    if (/^zh-(cn|hans)$/i.test(lang)) return "zh-Hans";
    if (/^zh-(hk|tw|hant)$/i.test(lang) || /^zh$/i.test(lang)) return "zh-HK";
    if (/^ja/i.test(lang)) return "ja";
    if (/^ko/i.test(lang)) return "ko";
    if (/^th/i.test(lang)) return "th";
    if (/^id/i.test(lang)) return "id";
    return "en";
  }

  function lang() {
    var select = document.querySelector("select[id*='lang' i], select[id*='language' i]");
    return normalizeLang(select && select.value ? select.value : document.documentElement.lang);
  }

  function t(key) {
    var table = copy[lang()] || copy.en;
    return table[key] || copy.en[key] || key;
  }

  function dismissKey() {
    var segment = location.pathname.split("/").filter(Boolean)[0] || "hub";
    return "tool48.install.dismissedAt." + segment;
  }

  function isDismissed() {
    try {
      var value = Number(localStorage.getItem(dismissKey()) || 0);
      return value && Date.now() - value < DISMISS_MS;
    } catch (_err) {
      return false;
    }
  }

  function rememberDismiss() {
    try { localStorage.setItem(dismissKey(), String(Date.now())); } catch (_err) {}
  }

  function isMobile() {
    return window.matchMedia("(max-width: 820px)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  }

  function showGuidance() {
    var detail = bar?.querySelector(".tool48-install-copy span");
    if (!detail) return;
    detail.textContent = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? t("ios") : t("android");
  }

  function dismiss() {
    if (!bar) return;
    rememberDismiss();
    bar.classList.remove("is-visible");
    setTimeout(function () { bar?.remove(); bar = null; }, 220);
  }

  async function runInstallPrompt() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch (_err) {}
      deferredPrompt = null;
      dismiss();
      return;
    }
    showGuidance();
  }

  function updateCopy() {
    if (!bar) return;
    bar.querySelector(".tool48-install-copy strong").textContent = t("title");
    bar.querySelector(".tool48-install-copy span").textContent = t("body");
    bar.querySelector(".tool48-install-action").textContent = t("action");
    bar.querySelector(".tool48-install-close").setAttribute("aria-label", t("close"));
  }

  function createBar() {
    if (bar || !isMobile() || isStandalone() || isDismissed()) return;
    bar = document.createElement("div");
    bar.className = "tool48-install-bar";
    bar.innerHTML = '<span class="tool48-install-mark" aria-hidden="true"></span><span class="tool48-install-copy"><strong></strong><span></span></span><button class="tool48-install-action" type="button"></button><button class="tool48-install-close" type="button" aria-label=""></button>';
    bar.querySelector(".tool48-install-close").textContent = "x";
    bar.querySelector(".tool48-install-action").addEventListener("click", runInstallPrompt);
    bar.querySelector(".tool48-install-close").addEventListener("click", dismiss);
    bar.addEventListener("pointerdown", function (event) {
      startX = event.clientX;
      startY = event.clientY;
    });
    bar.addEventListener("pointerup", function (event) {
      var dx = event.clientX - startX;
      var dy = event.clientY - startY;
      if (Math.abs(dx) > 70 || Math.abs(dy) > 44) dismiss();
    });
    updateCopy();
    document.body.appendChild(bar);
    requestAnimationFrame(function () { bar?.classList.add("is-visible"); });
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredPrompt = event;
    createBar();
  });

  function init() {
    setTimeout(createBar, 1300);
    document.addEventListener("change", function (event) {
      if (event.target && event.target.matches("select[id*='lang' i], select[id*='language' i]")) updateCopy();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
