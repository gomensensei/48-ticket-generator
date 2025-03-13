const $ = id => {
    const element = document.getElementById(id);
    if (!element) console.error(`Element with ID "${id}" not found`);
    return element;
};
const canvas = $('ticketCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const fonts = {
    avant: 'ITC Avant Garde Gothic Std Extra Light',
    kozgo: 'KozGoPr6N',
    ar: 'AR ADGothicJP',
    customRect1: null,
    customText2_3: null,
    customText4_6: null,
    customText10_12: null
};
const sizes = { base: { w: 150, h: 65 }, bleed: 3 };
const dpi = {
    300: { base: { w: sizes.base.w * 300 / 25.4, h: sizes.base.h * 300 / 25.4 }, bleed: { w: (sizes.base.w + 2 * sizes.bleed) * 300 / 25.4, h: (sizes.base.h + 2 * sizes.bleed) * 300 / 25.4 } },
    70: { base: { w: sizes.base.w * 70 / 25.4, h: sizes.base.h * 70 / 25.4 }, bleed: { w: (sizes.base.w + 2 * sizes.bleed) * 70 / 25.4, h: (sizes.base.h + 2 * sizes.bleed) * 70 / 25.4 } }
};

let qrImage = null, customImage = null, previewScale = 1.0;
let currentLang = 'ja';

const langs = {
    ja: {
        title: 'チケットメーカー', preview: 'チケットプレビュー', custom: 'オリジナルチケット', rect1Line1: 'エリア1 テキスト (1行目)', rect1Line2: 'エリア1 テキスト (2行目)', rect1Color: 'エリア1 背景色', rect1TextColor: 'エリア1 文字色', text2: 'テキスト2', text3Line1: 'テキスト3 (1行目)', text3Line2: 'テキスト3 (2行目)', text4Line1: 'テキスト4 (1行目)', text4Line2: 'テキスト4 (2行目)', text5: 'テキスト5', text6: 'テキスト6', textColor: '文字色 (2-6)', bgColor: '全体の背景色', bgText: '背景テキスト', bgTextColor: '背景文字色', bgShadowColor: '背景影の色', rect9Color: 'エリア9 背景色', text10: 'テキスト10', text11: 'テキスト11', text12: 'テキスト12', footerTextColor: '文字色 (10-12)', qrCodeInput: 'QRコード画像 (優先)', qrCodeText: 'URLをQRコードにします', generateQR: '作成する', showQR: 'QRコード枠を表示', qrSquareColor: 'QR枠の色', customImageInput: 'カスタム画像', recommendedSize: '（推奨サイズ: 65mm x 150mm）', imageLayer: '画像のレイヤー', customFontRect1: 'エリア1用カスタムフォント', customFontText2_3: 'テキスト2-3用カスタムフォント', customFontText4_6: 'テキスト4-6用カスタムフォント', customFontText10_12: 'テキスト10-12用カスタムフォント', bleedOption: '裁ち落とし付き (+3mm)', download300: 'ダウンロード (300 DPI)', download70: 'ダウンロード (70 DPI)', advancedMode: '詳細設定', donate: 'カンパ', reportBug: '報錯', note: '※ダウンロードしたPNGはRGBです。印刷用にCMYKへ変換するにはPhotoshopかGIMPをご利用ください。', disclaimer: 'AKB48メンバーの生誕祭劇場公演で、ファンの皆様が復刻した劇場チケットに感動し、趣味としてファンが自作チケットを保存できるウェブサイトを制作いたしました。商業目的や違法な使用はご遠慮ください。権利は© AKB48及び株式会社DHに帰属し、制作者は責任を負いかねます。何卒ご了承ください。', downloadError: 'ダウンロードに失敗しました。もう一度お試しください。', inputError: '負の値または無効な値は使用できません。', opacityError: '透明度は0から1の間で入力してください。', qrFormatError: 'サポートされていないファイル形式です。画像を選択してください。', qrLoadError: 'QRコード画像の読み込みに失敗しました。', qrReadError: 'ファイルの読み込みに失敗しました。', fontLoadError: 'フォントの読み込みに失敗しました。デフォルトフォントを使用します。', qrGenerateError: 'QRコードの生成に失敗しました。', x: 'X', y: 'Y', spacing: '字間', size: 'サイズ', lineHeight: '行間', shadowX: 'シャドウX', shadowY: 'シャドウY', shadowOpacity: 'シャドウ透明度'
    },
    'zh-TW': {
        title: '門票生成器', preview: '門票預覽', custom: '自訂門票', rect1Line1: '區域1 文字 (第1行)', rect1Line2: '區域1 文字 (第2行)', rect1Color: '區域1 背景色', rect1TextColor: '區域1 文字色', text2: '文字2', text3Line1: '文字3 (第1行)', text3Line2: '文字3 (第2行)', text4Line1: '文字4 (第1行)', text4Line2: '文字4 (第2行)', text5: '文字5', text6: '文字6', textColor: '文字色 (2-6)', bgColor: '整體背景色', bgText: '背景文字', bgTextColor: '背景文字色', bgShadowColor: '背景陰影色', rect9Color: '區域9 背景色', text10: '文字10', text11: '文字11', text12: '文字12', footerTextColor: '文字色 (10-12)', qrCodeInput: 'QR碼圖片 (優先)', qrCodeText: '將URL轉為QR碼', generateQR: '生成', showQR: '顯示QR碼框架', qrSquareColor: 'QR框架顏色', customImageInput: '自訂圖片', recommendedSize: '（推薦尺寸: 65mm x 150mm）', imageLayer: '圖片層次', customFontRect1: '區域1用自訂字體', customFontText2_3: '文字2-3用自訂字體', customFontText4_6: '文字4-6用自訂字體', customFontText10_12: '文字10-12用自訂字體', bleedOption: '含出血位 (+3mm)', download300: '下載 (300 DPI)', download70: '下載 (70 DPI)', advancedMode: '進階設定', donate: '捐款', reportBug: '回報錯誤', note: '※下載的PNG為RGB格式。如需印刷用CMYK，請使用Photoshop或GIMP轉換。', disclaimer: '鑑於AKB48成員生誕祭劇場公演中，粉絲復刻的劇場門票令人感動，故製作此網站，讓粉絲可自製門票並保存。此網站純為興趣製作，請勿用於商業或非法用途。版權歸© AKB48及株式会社DH所有，製作者不承擔任何責任。', downloadError: '下載失敗，請重試。', inputError: '不可使用負值或無效值。', opacityError: '透明度需在0到1之間。', qrFormatError: '不支援的檔案格式，請選擇圖片。', qrLoadError: 'QR碼圖片載入失敗。', qrReadError: '檔案讀取失敗。', fontLoadError: '字體載入失敗，將使用預設字體。', qrGenerateError: 'QR碼生成失敗。', x: 'X', y: 'Y', spacing: '字距', size: '大小', lineHeight: '行距', shadowX: '陰影X', shadowY: '陰影Y', shadowOpacity: '陰影透明度'
    }
    // 其他語言省略
};

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

const drawText = (lines, x, y, font, size, spacing, height, color, align = 'left', altFont, dpiVal = 300) => {
    if (!ctx) return;
    const ptPx = dpiVal / 72;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    lines.forEach((l, i) => {
        let cx = x, ly = y + i * height * ptPx;
        if (!l) return;
        l.split('').forEach(c => {
            const isAlt = altFont && /[A-Za-z0-9①❘－]/.test(c);
            ctx.font = `${size * ptPx}px ${isAlt ? altFont : font}`;
            ctx.fillText(c, cx, ly);
            cx += ctx.measureText(c).width + spacing * ptPx / 1000;
        });
    });
};

const drawBackground = async (dpiVal, bleed, w, h, mmPx) => {
    ctx.fillStyle = $('bgColor')?.value || '#E5EDF9';
    ctx.fillRect(0, 0, w, h);

    if (customImage && $('imageLayer')?.value === 'background') {
        ctx.drawImage(customImage, bleed ? sizes.bleed * mmPx : 0, bleed ? sizes.bleed * mmPx : 0, w - (bleed ? 2 * sizes.bleed * mmPx : 0), h - (bleed ? 2 * sizes.bleed * mmPx : 0));
    }

    const bg = { 
        t: $('bgText')?.value || 'AKB48', 
        x: parseFloat($('bgTextX')?.value || -100) * mmPx + (bleed ? sizes.bleed * mmPx : 0), 
        y: parseFloat($('bgTextY')?.value || 0) * mmPx + (bleed ? sizes.bleed * mmPx : 0), 
        s: parseFloat($('bgTextSpacing')?.value || -6000), 
        lh: parseFloat($('bgTextLineHeight')?.value || 46), 
        sz: parseFloat($('bgTextSize')?.value || 62) 
    };
    ctx.font = `${bg.sz * (dpiVal / 72)}px ${fonts.customRect1 || fonts.avant}`;
    const cw = ctx.measureText(bg.t.charAt(0)).width, 
          tw = ctx.measureText(bg.t).width, 
          gx = tw + bg.s * (dpiVal / 72) / 1000, 
          gy = bg.lh * (dpiVal / 72);
    ctx.globalAlpha = parseFloat($('bgShadowOpacity')?.value || 0.2);
    ctx.fillStyle = $('bgShadowColor')?.value || '#5F96ED';
    ctx.shadowColor = $('bgShadowColor')?.value || '#5F96ED';
    ctx.shadowOffsetX = parseFloat($('bgShadowX')?.value || 0.5) * mmPx;
    ctx.shadowOffsetY = parseFloat($('bgShadowY')?.value || -0.4) * mmPx;
    for (let y = bg.y, r = 0; y < h; y += gy, r++) 
        for (let x = bg.x + r * cw; x < w; x += gx) 
            ctx.fillText(bg.t, x, y);
    ctx.globalAlpha = 1;
    ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    ctx.fillStyle = $('bgTextColor')?.value || '#FFFFFF';
    for (let y = bg.y, r = 0; y < h; y += gy, r++) 
        for (let x = bg.x + r * cw; x < w; x += gx) 
            ctx.fillText(bg.t, x, y);
};

const drawArea1 = (dpiVal, bleed, mmPx) => {
    ctx.fillStyle = $('rect1Color')?.value || '#2086D1';
    ctx.fillRect(8 * mmPx + (bleed ? sizes.bleed * mmPx : 0), bleed ? sizes.bleed * mmPx : 0, 25 * mmPx, 35 * mmPx);
    drawText([$('rect1Line1')?.value || 'AKB'], parseFloat($('rect1Line1X')?.value || 13.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('rect1Line1Y')?.value || 12) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customRect1 || fonts.avant, parseFloat($('rect1Size')?.value || 47), parseFloat($('rect1Spacing')?.value || -7000), 0, $('rect1TextColor')?.value || '#FFFFFF', 'center', null, dpiVal);
    drawText([$('rect1Line2')?.value || '48'], parseFloat($('rect1Line2X')?.value || 13.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('rect1Line2Y')?.value || 24) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customRect1 || fonts.avant, parseFloat($('rect1Line2Size')?.value || 47), parseFloat($('rect1Line2Spacing')?.value || -7000), 0, $('rect1TextColor')?.value || '#FFFFFF', 'center', null, dpiVal);
};

const drawText2To6 = (dpiVal, bleed, mmPx) => {
    const tc = $('textColor')?.value || '#000000';
    drawText([$('text2')?.value || '「ここからだ」 公演'], parseFloat($('text2X')?.value || 37) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text2Y')?.value || 12) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText2_3 || fonts.kozgo, parseFloat($('text2Size')?.value || 14.2), parseFloat($('text2Spacing')?.value || 2000), 0, tc, 'left', fonts.ar, dpiVal);
    drawText([$('text3Line1')?.value || '秋元康 生誕祭'], parseFloat($('text3Line1X')?.value || 35) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text3Line1Y')?.value || 19) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText2_3 || fonts.kozgo, parseFloat($('text3Size')?.value || 14.2), parseFloat($('text3Spacing')?.value || 2000), 0, tc, 'left', fonts.ar, dpiVal);
    drawText([$('text3Line2')?.value || 'AKB48劇場'], parseFloat($('text3Line2X')?.value || 35) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text3Line2Y')?.value || 25) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText2_3 || fonts.kozgo, parseFloat($('text3Line2Size')?.value || 14.2), parseFloat($('text3Line2Spacing')?.value || 2000), 0, tc, 'left', fonts.ar, dpiVal);
    drawText([$('text4Line1')?.value || '＜日付＞2025年05月02日（金）', $('text4Line2')?.value || 'OPEN：18時10分       START：18時30分      ￥3,400'], parseFloat($('text4Line1X')?.value || 13) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text4Line1Y')?.value || 43) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText4_6 || fonts.kozgo, parseFloat($('text4Size')?.value || 11), parseFloat($('text4Spacing')?.value || 1000), parseFloat($('text4LineHeight')?.value || 14), tc, 'left', fonts.ar, dpiVal);
    drawText([$('text5')?.value || '048番'], parseFloat($('text5X')?.value || 13) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text5Y')?.value || 55) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText4_6 || fonts.kozgo, parseFloat($('text5Size')?.value || 16), parseFloat($('text5Spacing')?.value || 200), 0, tc, 'left', fonts.ar, dpiVal);
    drawText([$('text6')?.value || '① ❘ 000－0000 ❘ ゴメン先生 様'], parseFloat($('text6X')?.value || 36) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text6Y')?.value || 55) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText4_6 || fonts.kozgo, parseFloat($('text6Size')?.value || 13), parseFloat($('text6Spacing')?.value || 311), 0, tc, 'left', fonts.ar, dpiVal);
};

const drawArea9 = (dpiVal, bleed, mmPx) => {
    ctx.fillStyle = $('rect9Color')?.value || '#2086D1';
    ctx.fillRect(bleed ? sizes.bleed * mmPx : 0, 60 * mmPx + (bleed ? sizes.bleed * mmPx : 0), 150 * mmPx, 5 * mmPx);
    const fc = $('footerTextColor')?.value || '#FFFFFF';
    drawText([$('text10')?.value || '<主催 ‧ お問い合せ>'], parseFloat($('text10X')?.value || 54) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text10Y')?.value || 62.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText10_12 || fonts.kozgo, parseFloat($('text10Size')?.value || 7), parseFloat($('text10Spacing')?.value || 236), 0, fc, 'left', fonts.ar, dpiVal);
    drawText([$('text11')?.value || 'AKB48 Theater'], parseFloat($('text11X')?.value || 80.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text11Y')?.value || 63) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText10_12 || fonts.kozgo, parseFloat($('text11Size')?.value || 10), parseFloat($('text11Spacing')?.value || 238), 0, fc, 'left', fonts.ar, dpiVal);
    drawText([$('text12')?.value || 'TEL:03-5298-8648'], parseFloat($('text12X')?.value || 108) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text12Y')?.value || 63) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText10_12 || fonts.kozgo, parseFloat($('text12Size')?.value || 12.5), parseFloat($('text12Spacing')?.value || 236), 0, fc, 'left', fonts.ar, dpiVal);
};

const drawQRCode = (dpiVal, bleed, w, mmPx) => {
    if ($('showQR')?.checked && qrImage) {
        const qx = w - 8.5 * mmPx - 23 * mmPx + (bleed ? sizes.bleed * mmPx : 0), 
              qy = 23 * mmPx + (bleed ? sizes.bleed * mmPx : 0), 
              qs = 23 * mmPx;
        ctx.fillStyle = $('qrSquareColor')?.value || '#2086D1';
        ctx.fillRect(qx, qy, qs, qs);
        ctx.drawImage(qrImage, qx, qy, qs, qs);
    }
};

const drawForegroundImage = (dpiVal, bleed, w, h, mmPx) => {
    if (customImage && $('imageLayer')?.value === 'foreground') {
        ctx.drawImage(customImage, bleed ? sizes.bleed * mmPx : 0, bleed ? sizes.bleed * mmPx : 0, w - (bleed ? 2 * sizes.bleed * mmPx : 0), h - (bleed ? 2 * sizes.bleed * mmPx : 0));
    }
};

const drawTicket = async (dpiVal) => {
    if (!ctx) {
        console.error('Cannot draw ticket: Canvas context is null');
        return;
    }
    const bleed = $('bleedOption')?.checked || false;
    const w = bleed ? dpi[dpiVal].bleed.w : dpi[dpiVal].base.w;
    const h = bleed ? dpi[dpiVal].bleed.h : dpi[dpiVal].base.h;
    const mmPx = dpiVal / 25.4;
    canvas.width = w;
    canvas.height = h;
    const aspectRatio = w / h;
    canvas.style.width = `${w * previewScale}px`;
    canvas.style.height = `${(w * previewScale) / aspectRatio}px`; // 保持比例
    ctx.clearRect(0, 0, w, h);

    await drawBackground(dpiVal, bleed, w, h, mmPx);
    drawArea1(dpiVal, bleed, mmPx);
    drawText2To6(dpiVal, bleed, mmPx);
    drawArea9(dpiVal, bleed, mmPx);
    drawQRCode(dpiVal, bleed, w, mmPx);
    drawForegroundImage(dpiVal, bleed, w, h, mmPx);
};

const debouncedDrawTicket = debounce((dpiVal) => drawTicket(dpiVal), 300);

const setPreviewScale = (scale) => {
    console.log('Setting preview scale to:', scale);
    previewScale = scale;
    // 動態調整手機預覽比例
    if (window.innerWidth <= 768 && window.matchMedia("(orientation: portrait)").matches) {
        previewScale = Math.min(scale, window.innerWidth / dpi[70].base.w * 0.9); // 手機縮小至 90%
    }
    if (ctx) debouncedDrawTicket(70);
};

const downloadTicket = async (dpiVal) => {
    console.log(`Downloading ticket at ${dpiVal} DPI`);
    await drawTicket(dpiVal);
    const link = document.createElement('a');
    link.download = `ticket_${dpiVal}dpi.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    console.log('Download triggered');
};

const generateQRCode = () => {
    const text = $('qrCodeText')?.value;
    if (!text) {
        console.log('No URL provided for QR code generation');
        return;
    }
    console.log('Generating QR code for:', text);
    if (typeof QRCode === 'undefined') {
        console.error('QRCode library not loaded');
        return;
    }
    try {
        const qrCanvas = document.createElement('canvas');
        QRCode.toCanvas(qrCanvas, text, { width: 300, errorCorrectionLevel: 'H' }, (error) => {
            if (error) {
                console.error('QR Code generation error:', error);
                alert(langs[currentLang].qrGenerateError);
                return;
            }
            qrImage = new Image();
            qrImage.src = qrCanvas.toDataURL('image/png');
            qrImage.onload = () => {
                console.log('QR code image loaded');
                if (ctx) debouncedDrawTicket(70);
            };
            qrImage.onerror = () => {
                console.error('QR code image failed to load');
                alert(langs[currentLang].qrLoadError);
            };
        });
    } catch (e) {
        console.error('QR code generation failed:', e);
        alert(langs[currentLang].qrGenerateError);
    }
};

const loadFont = (file, fontKey) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const fontData = e.target.result;
        try {
            const font = new FontFace(fontKey, fontData);
            await font.load();
            document.fonts.add(font);
            fonts[fontKey] = fontKey;
            console.log(`Custom font ${fontKey} loaded`);
            if (ctx) debouncedDrawTicket(70);
        } catch (err) {
            console.error(`Failed to load font ${fontKey}:`, err);
            alert(langs[currentLang].fontLoadError);
        }
    };
    reader.onerror = () => {
        console.error('Font file read error');
        alert(langs[currentLang].qrReadError);
    };
    reader.readAsArrayBuffer(file);
};

$('qrCodeInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
        alert(langs[currentLang].qrFormatError);
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        qrImage = new Image();
        qrImage.src = event.target.result;
        qrImage.onload = () => {
            console.log('QR code image uploaded');
            if (ctx) debouncedDrawTicket(70);
        };
        qrImage.onerror = () => {
            console.error('Failed to load QR code image');
            alert(langs[currentLang].qrLoadError);
        };
    };
    reader.onerror = () => {
        console.error('Failed to read QR code file');
        alert(langs[currentLang].qrReadError);
    };
    reader.readAsDataURL(file);
});

$('customImageInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
        alert(langs[currentLang].qrFormatError);
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        customImage = new Image();
        customImage.src = event.target.result;
        customImage.onload = () => {
            console.log('Custom image uploaded');
            if (ctx) debouncedDrawTicket(70);
        };
        customImage.onerror = () => {
            console.error('Failed to load custom image');
            alert(langs[currentLang].qrLoadError);
        };
    };
    reader.onerror = () => {
        console.error('Failed to read custom image file');
        alert(langs[currentLang].qrReadError);
    };
    reader.readAsDataURL(file);
});

['customFontRect1', 'customFontText2_3', 'customFontText4_6', 'customFontText10_12'].forEach(id => {
    $(id)?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) loadFont(file, id.replace('customFont', 'custom'));
    });
});

document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', () => {
        console.log(`Input changed: ${input.id} = ${input.value}`);
        const val = parseFloat(input.value);
        if (isNaN(val)) {
            $(input.id + '-error').textContent = langs[currentLang].inputError;
            $(input.id + '-error').style.display = 'inline';
            input.value = 0;
        } else if (input.classList.contains('opacity-input') && (val < 0 || val > 1)) {
            $(input.id + '-error').textContent = langs[currentLang].opacityError;
            $(input.id + '-error').style.display = 'inline';
            input.value = Math.max(0, Math.min(1, val));
        } else if (val < 0) {
            $(input.id + '-error').textContent = langs[currentLang].inputError;
            $(input.id + '-error').style.display = 'inline';
            input.value = 0;
        } else {
            $(input.id + '-error').style.display = 'none';
        }
        if (ctx) debouncedDrawTicket(70);
    });
});

document.querySelectorAll('input:not([type="number"]), select').forEach(el => {
    el.addEventListener('input', () => {
        console.log(`Input/select changed: ${el.id} = ${el.value}`);
        if (ctx) debouncedDrawTicket(70);
    });
});

$('generateQRButton')?.addEventListener('click', generateQRCode);
$('download300Button')?.addEventListener('click', () => downloadTicket(300));
$('download70Button')?.addEventListener('click', () => downloadTicket(70));
$('scale50Button')?.addEventListener('click', () => setPreviewScale(0.5));
$('scale100Button')?.addEventListener('click', () => setPreviewScale(1.0));
$('scale150Button')?.addEventListener('click', () => setPreviewScale(1.5));
$('scale200Button')?.addEventListener('click', () => setPreviewScale(2.0));

const toggleAdvancedMode = () => {
    console.log('Toggling advanced mode');
    const advancedElements = document.querySelectorAll('.advanced-mode');
    advancedElements.forEach(el => el.classList.toggle('active'));
    const btn = $('advancedModeBtn');
    btn.textContent = btn.textContent === langs[currentLang].advancedMode ? '簡易設定' : langs[currentLang].advancedMode;
};

const changeLanguage = (lang) => {
    console.log('Changing language to:', lang);
    currentLang = lang;
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (langs[lang][key]) {
            if (el.tagName === 'LABEL') {
                const input = el.querySelector('input, select');
                if (input) {
                    el.childNodes[0].textContent = langs[lang][key] + ': ';
                } else {
                    el.textContent = langs[lang][key];
                }
            } else {
                el.textContent = langs[lang][key];
            }
        }
    });
    if (ctx) debouncedDrawTicket(70);
};

const waitForFonts = async () => {
    const fontPromises = [
        document.fonts.load(`400 47px ${fonts.avant}`),
        document.fonts.load(`400 14.2px ${fonts.kozgo}`),
        document.fonts.load(`400 14.2px ${fonts.ar}`)
    ];
    await Promise.all(fontPromises);
    console.log('Fonts loaded');
};

window.onload = async () => {
    console.log('Page loaded');
    if (!$('qrCodeText')) console.error('qrCodeText element not found');
    $('qrCodeText').value = 'https://x.com/';

    // 等待字體載入
    await waitForFonts();

    // 檢查 QRCode 是否可用，若不可用則延遲執行
    const waitForQRCode = () => {
        if (typeof QRCode !== 'undefined') {
            generateQRCode();
        } else {
            console.log('Waiting for QRCode library...');
            setTimeout(waitForQRCode, 1000); // 每秒檢查一次
        }
    };
    setTimeout(waitForQRCode, 1000); // 初始延遲 1 秒

    if (ctx) {
        // 手機直向模式初始縮放
        if (window.innerWidth <= 768 && window.matchMedia("(orientation: portrait)").matches) {
            previewScale = window.innerWidth / dpi[70].base.w * 0.9;
        }
        drawTicket(70);
    } else {
        console.error('Canvas context not initialized');
    }
};
