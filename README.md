# 48 Ticket Generator | 48 票券生成器 | 48チケットジェネレーター

![Version](https://img.shields.io/badge/Version-2026.07.03-pink)
![License](https://img.shields.io/badge/License-Non--Commercial-blue)
![Platform](https://img.shields.io/badge/Platform-Web-orange)
![Cloud Save](https://img.shields.io/badge/Cloud%20Save-Optional-lightblue)

---

## Project Overview | 專案簡介 | プロジェクト概要

**[ZH]** 這是一個為 AKB48 劇場日回憶而製作的非官方 ticket-style 圖像生成工具。它可以把公演名稱、日期、座位、成員推色、QR code 與備註整理成高解像度圖片或 PDF，適合生誕祭、應援企劃與個人紀念使用。

**[EN]** 48 Ticket Generator is an unofficial fan-made ticket-style image creator for AKB48 theater-day memories. It turns performance details, dates, seats, oshi colors, QR codes, and notes into polished PNG or PDF exports.

**[JP]** 48 Ticket Generator は、AKB48 劇場日の思い出を ticket-style 画像として残すための非公式ファンツールです。公演名、日付、座席、推しカラー、QR code、メモを高解像度の PNG / PDF として出力できます。

---

## Main Features | 功能說明 | 主な機能

### 1. Ticket-style Canvas Export
* **[ZH]** 使用 Canvas 生成 ticket-style 圖像，支援 70 / 140 / 300 DPI 與印刷出血位。
* **[EN]** Canvas-based ticket image rendering with 70 / 140 / 300 DPI export and optional bleed.
* **[JP]** Canvas による ticket-style 画像生成。70 / 140 / 300 DPI と出血設定に対応します。

### 2. Member Color Presets
* **[ZH]** 可套用成員推色、雙色效果與頭像，快速建立個人化紀念票。
* **[EN]** Apply member color presets, dual-color effects, and avatar styling for personalized tickets.
* **[JP]** メンバーの推しカラー、2色効果、アバター表示で個人向けの記念チケットを作れます。

### 3. Detailed Layout Controls
* **[ZH]** 可微調文字位置、字距、行高、背景、logo、QR code 與 footer 色彩。
* **[EN]** Fine-tune text position, spacing, line height, background, logo, QR code, and footer colors.
* **[JP]** 文字位置、字間、行間、背景、logo、QR code、footer 色を細かく調整できます。

### 4. Local JSON Backup
* **[ZH]** 不登入也可匯出 / 匯入 JSON 設定，完整保留本機 workflow。
* **[EN]** Export and import JSON settings without login, preserving the local-first workflow.
* **[JP]** ログインなしで JSON 設定の書き出し / 読み込みができ、ローカル利用を維持します。

### 5. Optional Tool48 Account / Cloud Save
* **[ZH]** 登入後可使用最多 3 個 cloud slots。登入是可選功能，不會鎖住本機使用。
* **[EN]** Signed-in users can use up to 3 cloud slots. Login is optional and local use remains unlocked.
* **[JP]** ログイン後は最大 3 つの cloud slots を使えます。ログインは任意で、ローカル利用は制限されません。

---

## Technical Highlights | 技術亮點 | 技術的特徴

* **Smart Contrast Engine**: Calculates background luminance and adjusts text readability.
* **High-resolution Export Workflow**: Uses Canvas plus jsPDF for print-oriented output.
* **Responsive Editing UI**: Desktop drawer controls and compact mobile navigation.
* **Multilingual i18n**: `langs.json` drives UI text for Traditional Chinese, Simplified Chinese, Japanese, English, Korean, Thai, and Indonesian.
* **Privacy-first Design**: We will not disclose personal data without explicit consent.

---

## Quick Start | 快速開始 | クイックスタート

1. Keep all project files in the same folder.
2. Open `index.html`, or run a simple local server if browser file access is restricted.
3. Choose a language, edit the ticket, then export PNG / PDF or JSON.

```bash
python -m http.server 4173
```

Open:

```text
http://127.0.0.1:4173/
```

---

## File Structure | 檔案結構 | ファイル構成

* `index.html` - Main UI, canvas, settings panels, account popover, footer.
* `style.css` - Glass UI, responsive layout, editor controls, account styling.
* `script.js` - Canvas drawing, export workflow, local JSON, i18n, optional Supabase cloud save.
* `langs.json` - Multilingual copy.
* `members.json` - Member names, colors, avatar data.
* `fonts/` - Local font assets used by the ticket renderer.

---

## Maintenance | 維護 | メンテナンス

* Update member colors and names in `members.json`.
* Update UI text in `langs.json`.
* Keep local JSON import/export working even when cloud features change.
* Cloud save uses the public Supabase client only. Never commit service-role or backend-only secrets.
* Treat the 3 cloud slots as a hard cap unless the UI and database contract are updated together.

---

## Disclaimer | 免責聲明 | 免責事項

**[ZH]** 本專案為非官方、非商業粉絲創作，只供 fan 創作、紀念及設計參考使用。票券風圖片並非真實票券、官方文件或入場憑證。所有名稱、商標、圖片及相關素材權利屬 AKB48、DH Co., Ltd. 及各自權利持有人。

**[EN]** This is an unofficial, non-commercial fan-made project for fan creation, memories, and design reference only. Ticket-style images are not real tickets, official documents, or entry passes. All names, trademarks, images, and related materials belong to AKB48, DH Co., Ltd., and their respective rights holders.

**[JP]** 本プロジェクトは非公式・非商用のファン制作物です。ticket-style 画像は実際のチケット、公式書類、入場証ではありません。名称、商標、画像、関連素材の権利は AKB48、DH Co., Ltd. および各権利者に帰属します。

---

## Created by | 製作 | 制作

**ゴメン先生 (gomensensei)**
