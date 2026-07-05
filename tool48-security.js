(function () {
  "use strict";

  var SCRIPT_ID = "tool48-turnstile-api";
  var TOKEN_MAX_AGE_MS = 240000;
  var TOKEN_WAIT_MS = 120000;
  var FAILURE_WINDOW_MS = 10 * 60 * 1000;
  var FAILURE_THRESHOLD = 3;
  var states = new WeakMap();

  var copy = {
    "zh-HK": {
      captchaWaiting: "請先完成人機驗證。",
      captchaFailed: "人機驗證未能完成，請稍後再試。",
      forgotPassword: "忘記密碼",
      resetMissingEmail: "請先輸入帳戶電郵。",
      resetSending: "正在寄出重設密碼電郵...",
      resetSent: "已寄出重設密碼電郵，請查看信箱。",
      dailyLimit: "短時間內新增紀錄太多，請稍後再試。",
      payloadTooLarge: "資料內容太大，請減少內容後再儲存。",
      authUnavailable: "Cloud save 暫時未能使用。",
      authFailed: "登入未能完成。"
    },
    "zh-TW": {
      captchaWaiting: "請先完成人機驗證。",
      captchaFailed: "人機驗證未能完成，請稍後再試。",
      forgotPassword: "忘記密碼",
      resetMissingEmail: "請先輸入帳戶電郵。",
      resetSending: "正在寄出重設密碼電郵...",
      resetSent: "已寄出重設密碼電郵，請查看信箱。",
      dailyLimit: "短時間內新增紀錄太多，請稍後再試。",
      payloadTooLarge: "資料內容太大，請減少內容後再儲存。",
      authUnavailable: "Cloud save 暫時未能使用。",
      authFailed: "登入未能完成。"
    },
    "zh-Hans": {
      captchaWaiting: "请先完成人机验证。",
      captchaFailed: "人机验证未能完成，请稍后再试。",
      forgotPassword: "忘记密码",
      resetMissingEmail: "请先输入账户邮箱。",
      resetSending: "正在寄出重设密码邮件...",
      resetSent: "已寄出重设密码邮件，请查看邮箱。",
      dailyLimit: "短时间内新增记录太多，请稍后再试。",
      payloadTooLarge: "资料内容太大，请减少内容后再保存。",
      authUnavailable: "Cloud save 暂时未能使用。",
      authFailed: "登录未能完成。"
    },
    ja: {
      captchaWaiting: "先に認証を完了してください。",
      captchaFailed: "認証を完了できませんでした。時間を置いて再試行してください。",
      forgotPassword: "パスワードを忘れた場合",
      resetMissingEmail: "アカウントのメールアドレスを入力してください。",
      resetSending: "パスワード再設定メールを送信しています...",
      resetSent: "パスワード再設定メールを送信しました。メールをご確認ください。",
      dailyLimit: "短時間に作成された記録が多すぎます。時間を置いて再試行してください。",
      payloadTooLarge: "保存データが大きすぎます。内容を減らしてから保存してください。",
      authUnavailable: "Cloud save は現在利用できません。",
      authFailed: "ログインを完了できませんでした。"
    },
    ko: {
      captchaWaiting: "먼저 보안 인증을 완료해 주세요.",
      captchaFailed: "보안 인증을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      forgotPassword: "비밀번호 찾기",
      resetMissingEmail: "계정 이메일을 먼저 입력해 주세요.",
      resetSending: "비밀번호 재설정 메일을 보내는 중...",
      resetSent: "비밀번호 재설정 메일을 보냈습니다. 메일함을 확인해 주세요.",
      dailyLimit: "짧은 시간에 새 기록이 너무 많이 생성되었습니다. 잠시 후 다시 시도해 주세요.",
      payloadTooLarge: "저장 데이터가 너무 큽니다. 내용을 줄인 뒤 다시 저장해 주세요.",
      authUnavailable: "Cloud save를 잠시 사용할 수 없습니다.",
      authFailed: "로그인을 완료하지 못했습니다."
    },
    th: {
      captchaWaiting: "กรุณายืนยันว่าคุณไม่ใช่บอทก่อน",
      captchaFailed: "ยืนยันไม่สำเร็จ กรุณาลองใหม่ภายหลัง",
      forgotPassword: "ลืมรหัสผ่าน",
      resetMissingEmail: "กรุณากรอกอีเมลบัญชีก่อน",
      resetSending: "กำลังส่งอีเมลรีเซ็ตรหัสผ่าน...",
      resetSent: "ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว โปรดตรวจสอบกล่องจดหมาย",
      dailyLimit: "มีการเพิ่มข้อมูลใหม่มากเกินไปในช่วงเวลาสั้น ๆ กรุณาลองใหม่ภายหลัง",
      payloadTooLarge: "ข้อมูลใหญ่เกินไป กรุณาลดเนื้อหาแล้วบันทึกใหม่",
      authUnavailable: "Cloud save ยังใช้งานไม่ได้ในขณะนี้",
      authFailed: "ไม่สามารถเข้าสู่ระบบได้"
    },
    id: {
      captchaWaiting: "Selesaikan verifikasi keamanan terlebih dahulu.",
      captchaFailed: "Verifikasi gagal. Coba lagi nanti.",
      forgotPassword: "Lupa kata sandi",
      resetMissingEmail: "Masukkan email akun terlebih dahulu.",
      resetSending: "Mengirim email reset kata sandi...",
      resetSent: "Email reset kata sandi sudah dikirim. Periksa kotak masuk Anda.",
      dailyLimit: "Terlalu banyak catatan baru dalam waktu singkat. Coba lagi nanti.",
      payloadTooLarge: "Data terlalu besar. Kurangi isinya lalu simpan lagi.",
      authUnavailable: "Cloud save belum tersedia.",
      authFailed: "Login belum berhasil."
    },
    en: {
      captchaWaiting: "Please complete the security check first.",
      captchaFailed: "The security check could not be completed. Please try again later.",
      forgotPassword: "Forgot password",
      resetMissingEmail: "Enter your account email first.",
      resetSending: "Sending password reset email...",
      resetSent: "Password reset email sent. Please check your inbox.",
      dailyLimit: "Too many new records in a short time. Please try again later.",
      payloadTooLarge: "This save is too large. Please reduce the content and try again.",
      authUnavailable: "Cloud save is not available right now.",
      authFailed: "Sign in could not be completed."
    }
  };

  function normalizeLang(value) {
    var lang = String(value || "").trim();
    if (!lang) return "en";
    if (/^zh-(cn|hans)$/i.test(lang)) return "zh-Hans";
    if (/^zh-(hk|tw|hant)$/i.test(lang) || /^zh$/i.test(lang)) return "zh-HK";
    if (/^ja/i.test(lang)) return "ja";
    if (/^ko/i.test(lang)) return "ko";
    if (/^th/i.test(lang)) return "th";
    if (/^id/i.test(lang)) return "id";
    return "en";
  }

  function currentLang() {
    var select = document.querySelector("select[id*='lang' i], select[id*='language' i]");
    return normalizeLang(select && select.value ? select.value : document.documentElement.lang);
  }

  function text(key) {
    var lang = currentLang();
    return (copy[lang] && copy[lang][key]) || copy.en[key] || key;
  }

  function getSiteKey() {
    var configured = window.TOOL48_TURNSTILE_SITE_KEY || window.TOOL48_SECURITY_CONFIG?.turnstileSiteKey || "";
    var meta = document.querySelector("meta[name='tool48-turnstile-site-key']");
    return String(configured || meta?.content || "").trim();
  }

  function setFormMessage(form, message) {
    var node = form?.querySelector("[data-tool48-auth-message], .cloud-message, .memo-status, .account-message")
      || document.getElementById("cloudMessage")
      || document.getElementById("cloudStatus")
      || document.getElementById("accountStatus");
    if (node) node.textContent = message || "";
  }

  function loadTurnstile() {
    if (window.turnstile?.render) return Promise.resolve();
    var existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      return new Promise(function (resolve, reject) {
        existing.addEventListener("load", function () { resolve(); }, { once: true });
        existing.addEventListener("error", reject, { once: true });
      });
    }
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = function () { resolve(); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function stateFor(form) {
    var target = form || document.body;
    var state = states.get(target);
    if (!state) {
      state = { widgetId: null, token: "", tokenAt: 0, waiters: [] };
      states.set(target, state);
    }
    return state;
  }

  function ensureBox(form) {
    var target = form || document.body;
    var box = target.querySelector?.(".tool48-turnstile-box");
    if (!box) {
      box = document.createElement("div");
      box.className = "tool48-turnstile-box";
      box.setAttribute("aria-live", "polite");
      var actions = target.querySelector?.(".cloud-form-actions, .account-button-row, .cloud-actions");
      if (actions && actions.parentNode) actions.parentNode.insertBefore(box, actions);
      else target.appendChild(box);
    }
    return box;
  }

  function resolveWaiters(state, token) {
    var waiters = state.waiters.splice(0);
    waiters.forEach(function (waiter) { waiter.resolve(token); });
  }

  async function prepareForm(form) {
    if (!getSiteKey() || !form) return false;
    await loadTurnstile();
    var state = stateFor(form);
    if (state.widgetId !== null) return true;
    var box = ensureBox(form);
    state.widgetId = window.turnstile.render(box, {
      sitekey: getSiteKey(),
      theme: "light",
      callback: function (token) {
        state.token = token || "";
        state.tokenAt = Date.now();
        box.dataset.state = state.token ? "ready" : "waiting";
        resolveWaiters(state, state.token);
      },
      "expired-callback": function () {
        state.token = "";
        state.tokenAt = 0;
        box.dataset.state = "expired";
      },
      "error-callback": function () {
        state.token = "";
        state.tokenAt = 0;
        box.dataset.state = "error";
        var waiters = state.waiters.splice(0);
        waiters.forEach(function (waiter) { waiter.reject(new Error(text("captchaFailed"))); });
      }
    });
    box.dataset.state = "waiting";
    return true;
  }

  function waitForToken(form, state) {
    if (state.token && Date.now() - state.tokenAt < TOKEN_MAX_AGE_MS) return Promise.resolve(state.token);
    setFormMessage(form, text("captchaWaiting"));
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        state.waiters = state.waiters.filter(function (waiter) { return waiter.resolve !== resolve; });
        reject(new Error(text("captchaFailed")));
      }, TOKEN_WAIT_MS);
      state.waiters.push({
        resolve: function (token) {
          clearTimeout(timer);
          token ? resolve(token) : reject(new Error(text("captchaFailed")));
        },
        reject: function (error) {
          clearTimeout(timer);
          reject(error);
        }
      });
    });
  }

  async function getCaptchaToken(action, form) {
    if (!getSiteKey()) return "";
    await prepareForm(form);
    var state = stateFor(form);
    if (!state.token || Date.now() - state.tokenAt >= TOKEN_MAX_AGE_MS) {
      try {
        if (state.widgetId !== null && window.turnstile?.reset) window.turnstile.reset(state.widgetId);
      } catch (_err) {}
    }
    return waitForToken(form, state);
  }

  function resetCaptcha(form) {
    var state = stateFor(form);
    state.token = "";
    state.tokenAt = 0;
    if (state.widgetId !== null && window.turnstile?.reset) {
      try { window.turnstile.reset(state.widgetId); } catch (_err) {}
    }
  }

  function authOptions(baseOptions, captchaToken) {
    var options = Object.assign({}, baseOptions || {});
    if (captchaToken) options.captchaToken = captchaToken;
    return options;
  }

  function signInPayload(email, password, captchaToken) {
    var payload = { email: email, password: password };
    if (captchaToken) payload.options = { captchaToken: captchaToken };
    return payload;
  }

  function failureKey(email) {
    return "tool48.auth.failures." + String(email || "").trim().toLowerCase();
  }

  function readFailures(email) {
    try {
      var now = Date.now();
      var rows = JSON.parse(localStorage.getItem(failureKey(email)) || "[]");
      return Array.isArray(rows) ? rows.filter(function (time) { return now - Number(time) < FAILURE_WINDOW_MS; }) : [];
    } catch (_err) {
      return [];
    }
  }

  function recordAuthFailure(email) {
    var rows = readFailures(email);
    rows.push(Date.now());
    try { localStorage.setItem(failureKey(email), JSON.stringify(rows)); } catch (_err) {}
    return rows.length;
  }

  function clearAuthFailures(email) {
    try { localStorage.removeItem(failureKey(email)); } catch (_err) {}
  }

  function needsExtraCaptcha(email) {
    return readFailures(email).length >= FAILURE_THRESHOLD;
  }

  async function requestPasswordReset(client, email, form) {
    if (!client) throw new Error(text("authUnavailable"));
    if (!email) throw new Error(text("resetMissingEmail"));
    var captchaToken = await getCaptchaToken("reset_password", form);
    var options = authOptions({ redirectTo: window.location.href }, captchaToken);
    var result = await client.auth.resetPasswordForEmail(email, options);
    resetCaptcha(form);
    if (result.error) throw result.error;
    return result.data;
  }

  function guardMessage(error) {
    var message = [error?.message, error?.details, error?.hint, String(error || "")].filter(Boolean).join(" ");
    if (/daily_insert_limit_reached/i.test(message)) return text("dailyLimit");
    if (/payload_too_large/i.test(message)) return text("payloadTooLarge");
    return "";
  }

  function localizeButtons(root) {
    (root || document).querySelectorAll("[data-tool48-reset-password]").forEach(function (button) {
      button.textContent = text("forgotPassword");
      button.setAttribute("aria-label", text("forgotPassword"));
    });
  }

  function init() {
    document.querySelectorAll("form.cloud-login-form, form[data-tool48-login-form]").forEach(function (form) {
      prepareForm(form).catch(function () {});
    });
    localizeButtons(document);
    document.addEventListener("change", function (event) {
      if (event.target && event.target.matches("select[id*='lang' i], select[id*='language' i]")) {
        localizeButtons(document);
      }
    });
  }

  window.Tool48Security = {
    authOptions: authOptions,
    clearAuthFailures: clearAuthFailures,
    getCaptchaToken: getCaptchaToken,
    guardMessage: guardMessage,
    needsExtraCaptcha: needsExtraCaptcha,
    prepareForm: prepareForm,
    recordAuthFailure: recordAuthFailure,
    requestPasswordReset: requestPasswordReset,
    resetCaptcha: resetCaptcha,
    signInPayload: signInPayload,
    text: text
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
