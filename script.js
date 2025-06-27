// ------------------------------------------------------------
//  AKB48 ペンライトカラー表 – script.js 2025-06-27 Final
// ------------------------------------------------------------
class PenlightGenerator {
  constructor() {
    /* ---------- Canvas & 基準 ---------- */
    this.canvas = document.getElementById('renderCanvas');
    this.ctx    = this.canvas.getContext('2d');
    this.baseCanvasWidth = this.canvas.width;
    this.baseAspect      = this.canvas.height / this.canvas.width;

    /* ---------- 資料 ---------- */
    this.members         = [];
    this.preloadedImages = {};   // 預覽用
    this.grid            = [];   // 當前格子 (null or name_ja)
    this.currentIndex    = null; // 點擊索引
    this.cellHeight      = 0;    // 動態格高

    /* ---------- 詳細設定初值 ---------- */
    this.settings = {
      公演名:     { フォントサイズ: 28, 文字間隔: 0, X: 0, Y: 20 },
      全名 :      { フォントサイズ: null, 文字間隔: 0, X: 0, Y: 0 },
      ネックネーム:{ フォントサイズ: 20, 文字間隔: 0, X: 0, Y: 0 },
      期別 :      { フォントサイズ: 18, 文字間隔: 0, X: 0, Y: 0 },
      写真 :      { X: 0, Y: 0 },
      色塊 :      { X: 0, Y: 0 },
      色文字:     { フォントサイズ: 18, X: 0, Y: 0 }
    };

    /* ---------- UI 狀態 ---------- */
    this.state = {
      ninzu: '4x4',
      konmei: 'ただいま　恋愛中',
      kibetsu: '13期',
      showAll: false,
      showKibetsu: false,
      showKonmei: true,
      showPhoto: false,
      showNickname: false,
      showKi: false,
      showColorBlock: true,
      showColorText: false,
      customKonmei: ''
    };

    /* ---------- 色碼→日文色名 ---------- */
    this.colorMap = {
      '#FF0000': '赤',
      '#FFA500': 'オレンジ',
      '#FFFF00': '黄',
      '#0000FF': '青',
      '#00FF00': '緑',
      '#32CD32': '黄緑',
      '#FFFFFF': '白',
      '#FF69B4': '濃ピンク',
      '#FF1493': '濃ピンク',
      '#FFB6C1': '薄ピンク',
      '#00CED1': '水',
      '#800080': '紫'
    };
  }

  /* ================= 初期化 ================= */
  async init() {
    await this.loadData();
    this.setupUI();
    this.bindEvents();
    this.updateAndRender();
  }

  /* ---------- 載入成員資料 & 預覽圖片 ---------- */
  async loadData() {
    const res = await fetch('members.json');
    this.members = await res.json();
    await Promise.all(
      this.members.map(m => this.preloadImage(m.name_ja, m.image))
    );
  }
  /* 預覽用：不加 crossOrigin，確保畫面一定出圖（即使 taint） */
  preloadImage(name, src) {
    return new Promise(res => {
      const img = new Image();
      img.src = src;
      img.onload  = () => { this.preloadedImages[name] = img;  res(); };
      img.onerror = () => { this.preloadedImages[name] = null; res(); };
    });
  }

  /* ================= UI 建置 ================= */
  setupUI() {
    /* 詳細設定面板骨架 + 收摺 */
    const panel = document.getElementById('設定パネル');
    panel.innerHTML = `
      <strong>詳細設定</strong>
      <div id="詳細中身"></div>`;
    panel.querySelector('strong').onclick =
      () => panel.classList.toggle('collapsed');
    this.makeDraggable(panel);

    /* 表單初始值 */
    const $ = id => document.getElementById(id);
    $('ninzuSelect').value   = this.state.ninzu;
    $('konmeiSelect').value  = this.state.konmei;
    $('kibetsuSelect').value = this.state.kibetsu;
    $('showColorBlock').checked = this.state.showColorBlock;
    $('showColorText').checked  = this.state.showColorText;
  }
  /* 拖曳面板 */
  makeDraggable(el) {
    let ox = 0, oy = 0;
    el.addEventListener('mousedown', e => {
      if (e.target.tagName === 'INPUT') return;
      ox = e.clientX - el.offsetLeft;
      oy = e.clientY - el.offsetTop;
      const move = ev => {
        el.style.left = `${ev.clientX - ox}px`;
        el.style.top  = `${ev.clientY - oy}px`;
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', () =>
        document.removeEventListener('mousemove', move),
      { once: true });
    });
  }

  /* ================= 事件綁定 ================= */
  bindEvents() {
    const $q = sel => document.querySelectorAll(sel);
    $q('#controls input:not(#customKonmei), #controls select')
      .forEach(el => el.addEventListener('change', () => this.updateAndRender()));

    /* 色塊/文字二選一 */
    document.getElementById('showColorBlock').addEventListener('change', e => {
      if (e.target.checked) document.getElementById('showColorText').checked = false;
      this.updateAndRender();
    });
    document.getElementById('showColorText').addEventListener('change', e => {
      if (e.target.checked) document.getElementById('showColorBlock').checked = false;
      this.updateAndRender();
    });

    /* 勾期別取消全員 */
    document.getElementById('showKibetsu').addEventListener('change', () => {
      document.getElementById('showAll').checked = false;
      this.updateAndRender();
    });

    /* 詳細設定按鈕 */
    document.getElementById('settingsButton')
      .addEventListener('click', () =>
        document.getElementById('設定パネル').classList.toggle('collapsed'));

    /* Canvas 點擊 (+ 選人 / 取消) */
    this.canvas.addEventListener('click', e => this.handleCanvasClick(e));

    /* 下載 */
    document.getElementById('downloadButton').addEventListener('click', () => this.exportPNG());
  }

  /* ================= 狀態 → 畫面 ================= */
  updateState() {
    const $ = id => document.getElementById(id);
    this.state.ninzu         = $('ninzuSelect').value;
    this.state.konmei        = $('konmeiSelect').value;
    this.state.kibetsu       = $('kibetsuSelect').value;
    this.state.showAll       = $('showAll').checked;
    this.state.showKibetsu   = $('showKibetsu').checked;
    this.state.showKonmei    = $('showKonmei').checked;
    this.state.showPhoto     = $('showPhoto').checked;
    this.state.showNickname  = $('showNickname').checked;
    this.state.showKi        = $('showKi').checked;
    this.state.showColorBlock= $('showColorBlock').checked;
    this.state.showColorText = $('showColorText').checked;
    this.state.customKonmei  = $('customKonmei').value;

    $('customKonmei').style.display =
      this.state.konmei === 'other' ? 'inline-block' : 'none';
  }

  updateGrid() {
    const [cols, rowsSelect] = this.state.ninzu.split('x').map(Number);
    let list = [];

    if (this.state.showAll) {
      list = this.members.map(m => m.name_ja);
    } else if (this.state.showKibetsu) {
      list = this.members.filter(m => m.ki === this.state.kibetsu)
                         .map(m => m.name_ja);
    } else if (this.grid.length) {
      list = [...this.grid];
    }

    const rows = Math.ceil(list.length / cols) || rowsSelect;
    this.grid = Array(cols * rows).fill(null);
    list.forEach((n, i) => (this.grid[i] = n));

    this.resizeCanvas(cols, rows);
  }

  resizeCanvas(cols, rows) {
    const cw = this.canvas.width / cols;
    let ratio = 0.5; // 基底：全名+色塊

    if (this.state.showPhoto)     ratio += 0.6;
    if (this.state.showNickname)  ratio += 0.12;
    if (this.state.showKi)        ratio += 0.12;
    if (this.state.showColorBlock || this.state.showColorText)
      ratio += 0.18;

    this.cellHeight = cw * ratio;
    const headerH = this.state.showKonmei ? this.settings.公演名.フォントサイズ + 10 : 0;
    this.canvas.height = rows * this.cellHeight + headerH;
  }

  updateAndRender() {
    this.updateState();
    this.updateGrid();
    this.renderGrid();
  }

  /* ================= 畫格子 ================= */
  renderGrid(tc = this.canvas, ctx = this.ctx, imgMap = this.preloadedImages) {
    const isExport = tc !== this.canvas;
    const scale = tc.width / this.canvas.width;
    ctx.fillStyle = '#fff4f6';
    ctx.fillRect(0, 0, tc.width, tc.height);

    /* 公演名 */
    if (this.state.showKonmei) {
      const t = this.state.konmei === 'other'
        ? this.state.customKonmei.trim() : this.state.konmei;
      ctx.fillStyle = '#F676A6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = `${this.settings.公演名.フォントサイズ * scale}px KozGoPr6N`;
      ctx.fillText(t, tc.width / 2, this.settings.公演名.Y * scale);
    }

    const [cols] = this.state.ninzu.split('x').map(Number);
    const cw = tc.width / cols;
    const ch = this.cellHeight * scale;
    const topOffset = this.state.showKonmei
      ? (this.settings.公演名.フォントサイズ + 10) * scale : 0;

    this.grid.forEach((name, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const x = c * cw, y = r * ch + topOffset;

      /* 背景+框 */
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, cw, ch);
      ctx.strokeStyle = '#F676A6';
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(x, y, cw, ch);

      /* 空格 → 選択 */
      if (!name) {
        if (!isExport) {
          ctx.fillStyle = '#F676A6';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `${24 * scale}px KozGoPr6N`;
          ctx.fillText('選択', x + cw / 2, y + ch / 2);
        }
        return;
      }

      const mem = this.members.find(m => m.name_ja === name);
      let cursorY = y + 8 * scale;

      /* 照片 */
      if (this.state.showPhoto && imgMap[name]) {
        const img = imgMap[name];
        const asp = img.naturalWidth / img.naturalHeight;
        let ph = ch * 0.55, pw = ph * asp;
        if (pw > cw * 0.8) { pw = cw * 0.8; ph = pw / asp; }
        ctx.drawImage(
          img,
          x + (cw - pw) / 2 + this.settings.写真.X * scale,
          cursorY + this.settings.写真.Y * scale,
          pw, ph
        );
        cursorY += ph + 5 * scale;
      }

      /* 姓名 */
      const baseFS = Math.min(ch * 0.16, cw * 0.18);
      const fsName = Math.max(baseFS, (this.settings.全名.フォントサイズ || 22) * scale);
      ctx.fillStyle = '#F676A6';
      ctx.font = `${fsName}px KozGoPr6N`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(
        mem.name_ja,
        x + cw / 2 + this.settings.全名.X * scale,
        cursorY + this.settings.全名.Y * scale
      );
      cursorY += fsName + 4 * scale;

      /* 暱稱 */
      if (this.state.showNickname) {
        const fsNick = Math.min(ch * 0.11, 18 * scale);
        ctx.font = `${fsNick}px KozGoPr6N`;
        ctx.fillText(
          mem.nickname,
          x + cw / 2 + this.settings.ネックネーム.X * scale,
          cursorY + this.settings.ネックネーム.Y * scale
        );
        cursorY += fsNick + 3 * scale;
      }

      /* 期別 */
      if (this.state.showKi) {
        const fsKi = Math.min(ch * 0.11, 16 * scale);
        ctx.font = `${fsKi}px KozGoPr6N`;
        ctx.fillText(
          mem.ki,
          x + cw / 2 + this.settings.期別.X * scale,
          cursorY + this.settings.期別.Y * scale
        );
        cursorY += fsKi + 3 * scale;
      }

      /* 推しカラー */
      const colors = mem.colors;
      if (this.state.showColorText) {
        const fsC = Math.min(ch * 0.09, this.settings.色文字.フォントサイズ * scale);
        ctx.font = `${fsC}px KozGoPr6N`;
        ctx.textBaseline = 'middle';
        const txt = colors.map(c => this.colorMap[c] || c).join(' × ');
        ctx.fillStyle = '#F676A6';
        ctx.fillText(
          txt,
          x + cw / 2 + this.settings.色文字.X * scale,
          y + ch * 0.86 + this.settings.色文字.Y * scale
        );
      } else if (this.state.showColorBlock) {
        const bw = (cw * 0.8) / colors.length;
        const bh = bw * 0.7;
        const startX = x + (cw - bw * colors.length) / 2 + this.settings.色塊.X * scale;
        colors.forEach((c, idx) => {
          ctx.fillStyle = c || '#ddd';
          ctx.fillRect(
            startX + idx * bw,
            y + ch * 0.82 + this.settings.色塊.Y * scale,
            bw, bh
          );
        });
      }
    });
  }

  /* ================= Canvas 點擊 (+/取消) ================= */
  handleCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const headerH = this.state.showKonmei
      ? this.settings.公演名.フォントサイズ + 10 : 0;
    y -= headerH;
    if (y < 0) return;

    const [cols] = this.state.ninzu.split('x').map(Number);
    const cw = this.canvas.width / cols;
    const ch = this.cellHeight;
    const col = Math.floor(x / cw);
    const row = Math.floor(y / ch);
    const idx = row * cols + col;
    if (idx < 0 || idx >= this.grid.length) return;

    // 右上角刪除
    if (this.grid[idx] && x % cw > cw - 40 && y % ch < 40) {
      this.grid[idx] = null;
      this.updateAndRender();
      return;
    }

    // 空格選人
    if (!this.grid[idx]) this.showPopup(idx);
  }

  /* ================= 彈出選單 ================= */
  showPopup(idx) {
    this.currentIndex = idx;
    const popup = document.getElementById('popup');
    popup.innerHTML = '';

    const groups = [...new Set(this.members.map(m => m.ki))];
    groups.forEach(g => {
      const det = document.createElement('details');
      const sum = document.createElement('summary');
      sum.textContent = g;
      det.appendChild(sum);

      const list = document.createElement('div');
      list.className = 'member-list';
      this.members.filter(m => m.ki === g).forEach(m => {
        const item = document.createElement('div');
        item.className = 'member-item';
        item.innerHTML =
          `<img src=\"${m.image}\" width=\"48\"><span>${m.name_ja}</span>`;
        item.onclick = () => {
          popup.querySelectorAll('.member-item')
               .forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
        };
        list.appendChild(item);
      });
      det.appendChild(list);
      popup.appendChild(det);
    });

    const ok = document.createElement('button');
    ok.textContent = '選択';
    ok.onclick = () => {
      const sel = popup.querySelector('.member-item.selected span');
      if (sel) {
        this.grid[this.currentIndex] = sel.textContent;
        popup.style.display = 'none';
        this.updateAndRender();
      }
    };
    const close = document.createElement('button');
    close.textContent = '閉じる';
    close.onclick = () => (popup.style.display = 'none');

    popup.appendChild(ok);
    popup.appendChild(close);
    popup.style.display = 'block';
  }

  /* ================= 匯出 PNG ================= */
  exportPNG() {
    // 確實更新畫布尺寸
    this.resizeCanvas(...this.state.ninzu.split('x').map(Number));

    // 代理載入所有當前 grid 所需照片
    const names = [...new Set(this.grid.filter(Boolean))];
    const proxyLoads = names.map(n => {
      const mem = this.members.find(m => m.name_ja === n);
      if (!mem) return Promise.resolve();
      const pImg = new Image();
      pImg.crossOrigin = 'anonymous';
      const raw = mem.image.replace(/^https?:\\/\\//, '');
      pImg.src = `https://images.weserv.nl/?url=${encodeURIComponent(raw)}`;
      return new Promise(r => {
        pImg.onload  = () => { this.preloadedImages[`EXPORT_${n}`] = pImg; r(); };
        pImg.onerror = () => { this.preloadedImages[`EXPORT_${n}`] = null;  r(); };
      });
    });

    Promise.all(proxyLoads).then(() => {
      const scale = 2;
      const tmp = document.createElement('canvas');
      tmp.width  = this.canvas.width  * scale;
      tmp.height = this.canvas.height * scale;
      const p = tmp.getContext('2d');
      p.scale(scale, scale);

      // 代理 Map：優先用 EXPORT_ 圖
      const map = new Proxy(this.preloadedImages, {
        get: (t, k) => t[`EXPORT_${k}`] || t[k]
      });
      this.renderGrid(tmp, p, map);

      const a = document.createElement('a');
      a.download = 'penlight_colors.png';
      a.href = tmp.toDataURL('image/png');
      a.click();
    });
  }
}

/* ================= 啟動 ================= */
window.addEventListener('DOMContentLoaded', () => {
  new PenlightGenerator().init();
});
