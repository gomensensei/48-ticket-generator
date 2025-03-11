const $ = id => document.getElementById(id);
const canvas = $('ticketCanvas');
const ctx = canvas.getContext('2d');

const fonts = {
    avant: 'ITC Avant Garde Gothic Std Extra Light, sans-serif',
    kozgo: 'KozGoPr6N, YuGothic, sans-serif',
    ar: 'AR ADGothicJP, MS PGothic, sans-serif',
    customRect1: null,
    customText2_3: null,
    customText4_6: null,
    customText10_12: null
};
const sizes = { base: { w: 150, h: 65 }, bleed: 3 };
const dpi = {
    300: {
        base: { w: sizes.base.w * 300 / 25.4, h: sizes.base.h * 300 / 25.4 },
        bleed: { w: (sizes.base.w + 2 * sizes.bleed) * 300 / 25.4, h: (sizes.base.h + 2 * sizes.bleed) * 300 / 25.4 }
    },
    70: {
        base: { w: sizes.base.w * 70 / 25.4, h: sizes.base.h * 70 / 25.4 },
        bleed: { w: (sizes.base.w + 2 * sizes.bleed) * 70 / 25.4, h: (sizes.base.h + 2 * sizes.bleed) * 70 / 25.4 }
    }
};

let qrImage = null, customImage = null, previewScale = 1.0, qrCodeInstance = null;

const langs = {
    ja: {
        title: 'チケットメーカー', preview: 'チケットプレビュー', custom: 'オリジナルチケット', rect1Line1: 'エリア1 テキスト (1行目)', rect1Line2: 'エリア1 テキスト (2行目)', rect1Color: 'エリア1 背景色', rect1TextColor: 'エリア1 文字色', text2: 'テキスト2', text3Line1: 'テキスト3 (1行目)', text3Line2: 'テキスト3 (2行目)', text4Line1: 'テキスト4 (1行目)', text4Line2: 'テキスト4 (2行目)', text5: 'テキスト5', text6: 'テキスト6', textColor: '文字色 (2-6)', bgColor: '全体の背景色', bgText: '背景テキスト', bgTextColor: '背景文字色', bgShadowColor: '背景影の色', rect9Color: 'エリア9 背景色', text10: 'テキスト10', text11: 'テキスト11', text12: 'テキスト12', footerTextColor: '文字色 (10-12)', qrCodeInput: 'QRコード画像 (優先)', qrCodeText: 'URLをQRコードにします', generateQR: '作成する', showQR: 'QRコード枠を表示', qrSquareColor: 'QR枠の色', customImageInput: 'カスタム画像', imageLayer: '画像のレイヤー', customFontRect1: 'エリア1用カスタムフォント', customFontText2_3: 'テキスト2-3用カスタムフォント', customFontText4_6: 'テキスト4-6用カスタムフォント', customFontText10_12: 'テキスト10-12用カスタムフォント', bleedOption: '裁ち落とし付き (+3mm)', download300: 'ダウンロード (300 DPI)', download70: 'ダウンロード (70 DPI)', advancedMode: '詳細設定', donate: 'カンパ', reportBug: '報錯', note: '※ダウンロードしたPNGはRGBです。印刷用にCMYKへ変換するにはPhotoshopかGIMPをご利用ください。', disclaimer: 'AKB48メンバーの生誕祭劇場公演で、ファンの皆様が復刻した劇場チケットに感動し、趣味としてファンが自作チケットを保存できるウェブサイトを制作いたしました。商業目的や違法な使用はご遠慮ください。権利は© AKB48及び株式会社DHに帰属し、制作者は責任を負いかねます。何卒ご了承ください。', downloadError: 'ダウンロードに失敗しました。もう一度お試しください。', inputError: '負の値または無効な値は使用できません。', opacityError: '透明度は0から1の間で入力してください。', qrFormatError: 'サポートされていないファイル形式です。画像を選択してください。', qrLoadError: 'QRコード画像の読み込みに失敗しました。', qrReadError: 'ファイルの読み込みに失敗しました。', fontLoadError: 'フォントの読み込みに失敗しました。デフォルトフォントを使用します。', qrGenerateError: 'QRコードの生成に失敗しました。', x: 'X', y: 'Y', spacing: '字間', size: 'サイズ', lineHeight: '行間', shadowX: 'シャドウX', shadowY: 'シャドウY', shadowOpacity: 'シャドウ透明度', recommendedSize: '（推奨サイズ: 65mm x 150mm）'
    },
    'zh-TW': {
        title: '門票生成器', preview: '門票預覽', custom: '自訂門票', rect1Line1: '矩形1文字 (行1)', rect1Line2: '矩形1文字 (行2)', rect1Color: '矩形1顏色', rect1TextColor: '矩形1文字顏色', text2: '文字2', text3Line1: '文字3 (行1)', text3Line2: '文字3 (行2)', text4Line1: '文字4 (行1)', text4Line2: '文字4 (行2)', text5: '文字5', text6: '文字6', textColor: '文字顏色 (2-6)', bgColor: '背景顏色', bgText: '背景文字', bgTextColor: '背景文字顏色', bgShadowColor: '背景陰影顏色', rect9Color: '矩形9顏色', text10: '文字10', text11: '文字11', text12: '文字12', footerTextColor: '文字顏色 (10-12)', qrCodeInput: 'QR碼圖片 (優先)', qrCodeText: 'QR碼文字', generateQR: '生成QR碼', showQR: '顯示QR碼框架', qrSquareColor: 'QR框架顏色', customImageInput: '自訂圖片', imageLayer: '圖片層次', customFontRect1: '矩形1用自訂字體', customFontText2_3: '文字2-3用自訂字體', customFontText4_6: '文字4-6用自訂字體', customFontText10_12: '文字10-12用自訂字體', bleedOption: '包含出血位 (每邊 +3mm)', download300: '下載門票 (300 DPI)', download70: '下載門票 (70 DPI)', advancedMode: '進階模式', donate: '捐贈', reportBug: '回報錯誤', note: '注意：下載的PNG為RGB模式。為印刷準備，請使用Photoshop或GIMP轉為CMYK。', disclaimer: '有鑑於AKB48成員的生誕祭劇場公演中，粉絲製作的應援品包括已不再印刷的實體劇場門票復刻版，因此突發奇想製作此網站，讓粉絲們能自製心目中的票券並自行保存。此網站純粹出於興趣製作，請勿用於商業或其他非法用途。所有權利歸© AKB48及株式会社DH所有，本人對一切責任免責，請注意。', downloadError: '下載失敗。請再試一次。', inputError: '不可使用負值或無效值。', opacityError: '透明度必須介於0到1之間。', qrFormatError: '不支援的檔案格式。請選擇圖片。', qrLoadError: 'QR碼圖片載入失敗。', qrReadError: '檔案讀取失敗。', fontLoadError: '字體載入失敗，將使用預設字體。', qrGenerateError: 'QR碼生成失敗。', x: 'X', y: 'Y', spacing: '字距', size: '大小', lineHeight: '行距', shadowX: '陰影X', shadowY: '陰影Y', shadowOpacity: '陰影透明度', recommendedSize: '（推薦尺寸: 65mm x 150mm）'
    }
    // 其他語言省略，可從之前版本補全
};

const checkFontAvailability = async (fontName) => {
    await document.fonts.ready;
    const isAvailable = document.fonts.check(`1em ${fontName}`);
    console.log(`Font "${fontName}" availability: ${isAvailable}`);
    return isAvailable;
};

const drawText = (lines, x, y, font, size, spacing, height, color, align = 'left', altFont, dpiVal = 300) => {
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

const drawTicket = async (dpiVal) => {
    const isAvantLoaded = await checkFontAvailability('ITC Avant Garde Gothic Std Extra Light');
    if (!isAvantLoaded) console.warn('Using fallback font for ITC Avant Garde Gothic Std Extra Light.');

    const bleed = $('bleedOption').checked;
    const w = bleed ? dpi[dpiVal].bleed.w : dpi[dpiVal].base.w;
    const h = bleed ? dpi[dpiVal].bleed.h : dpi[dpiVal].base.h;
    const mmPx = dpiVal / 25.4;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w * previewScale}px`;
    canvas.style.height = `${h * previewScale}px`;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = $('bgColor').value;
    ctx.fillRect(0, 0, w, h);

    if (customImage && $('imageLayer').value === 'background') {
        ctx.drawImage(customImage, bleed ? sizes.bleed * mmPx : 0, bleed ? sizes.bleed * mmPx : 0, w - (bleed ? 2 * sizes.bleed * mmPx : 0), h - (bleed ? 2 * sizes.bleed * mmPx : 0));
    }

    const bg = { 
        t: $('bgText').value || 'AKB48', 
        x: parseFloat($('bgTextX').value || -100) * mmPx + (bleed ? sizes.bleed * mmPx : 0), 
        y: parseFloat($('bgTextY').value || 0) * mmPx + (bleed ? sizes.bleed * mmPx : 0), 
        s: parseFloat($('bgTextSpacing').value || -6000), 
        lh: parseFloat($('bgTextLineHeight').value || 46), 
        sz: parseFloat($('bgTextSize').value || 62) 
    };
    const bgFont = fonts.customRect1 || (isAvantLoaded ? 'ITC Avant Garde Gothic Std Extra Light' : 'sans-serif');
    ctx.font = `${bg.sz * (dpiVal / 72)}px ${bgFont}`;
    console.log(`Drawing background text with font: ${ctx.font}`);
    const cw = ctx.measureText(bg.t.charAt(0)).width, 
          tw = ctx.measureText(bg.t).width, 
          gx = tw + bg.s * (dpiVal / 72) / 1000, 
          gy = bg.lh * (dpiVal / 72);
    ctx.globalAlpha = parseFloat($('bgShadowOpacity').value || 0.2);
    ctx.fillStyle = $('bgShadowColor').value;
    ctx.shadowColor = $('bgShadowColor').value;
    ctx.shadowOffsetX = parseFloat($('bgShadowX').value || 0.5) * mmPx;
    ctx.shadowOffsetY = parseFloat($('bgShadowY').value || -0.4) * mmPx;
    for (let y = bg.y, r = 0; y < h; y += gy, r++) 
        for (let x = bg.x + r * cw; x < w; x += gx) 
            ctx.fillText(bg.t, x, y);
    ctx.globalAlpha = 1;
    ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    ctx.fillStyle = $('bgTextColor').value;
    for (let y = bg.y, r = 0; y < h; y += gy, r++) 
        for (let x = bg.x + r * cw; x < w; x += gx) 
            ctx.fillText(bg.t, x, y);

    ctx.fillStyle = $('rect1Color').value;
    ctx.fillRect(8 * mmPx + (bleed ? sizes.bleed * mmPx : 0), bleed ? sizes.bleed * mmPx : 0, 25 * mmPx, 35 * mmPx);
    drawText([$('rect1Line1').value], parseFloat($('rect1Line1X').value || 13.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('rect1Line1Y').value || 12) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customRect1 || (isAvantLoaded ? 'ITC Avant Garde Gothic Std Extra Light' : 'sans-serif'), parseFloat($('rect1Size').value || 47), parseFloat($('rect1Spacing').value || -7000), 0, $('rect1TextColor').value, 'center', null, dpiVal);
    drawText([$('rect1Line2').value], parseFloat($('rect1Line2X').value || 13.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('rect1Line2Y').value || 24) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customRect1 || (isAvantLoaded ? 'ITC Avant Garde Gothic Std Extra Light' : 'sans-serif'), parseFloat($('rect1Line2Size').value || 47), parseFloat($('rect1Line2Spacing').value || -7000), 0, $('rect1TextColor').value, 'center', null, dpiVal);

    const tc = $('textColor').value;
    drawText([$('text2').value], parseFloat($('text2X').value || 37) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text2Y').value || 12) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText2_3 || fonts.kozgo, parseFloat($('text2Size').value || 14.2), parseFloat($('text2Spacing').value || 2000), 0, tc, 'left', fonts.ar, dpiVal);
    drawText([$('text3Line1').value], parseFloat($('text3Line1X').value || 35) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text3Line1Y').value || 19) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText2_3 || fonts.kozgo, parseFloat($('text3Size').value || 14.2), parseFloat($('text3Spacing').value || 2000), 0, tc, 'left', fonts.ar, dpiVal);
    drawText([$('text3Line2').value], parseFloat($('text3Line2X').value || 35) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text3Line2Y').value || 25) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText2_3 || fonts.kozgo, parseFloat($('text3Line2Size').value || 14.2), parseFloat($('text3Line2Spacing').value || 2000), 0, tc, 'left', fonts.ar, dpiVal);
    drawText([$('text4Line1').value, $('text4Line2').value], parseFloat($('text4Line1X').value || 13) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text4Line1Y').value || 43) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText4_6 || fonts.kozgo, parseFloat($('text4Size').value || 11), parseFloat($('text4Spacing').value || 1000), parseFloat($('text4LineHeight').value || 14), tc, 'left', fonts.ar, dpiVal);
    drawText([$('text5').value], parseFloat($('text5X').value || 13) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text5Y').value || 55) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText4_6 || fonts.kozgo, parseFloat($('text5Size').value || 16), parseFloat($('text5Spacing').value || 200), 0, tc, 'left', fonts.ar, dpiVal);
    drawText([$('text6').value], parseFloat($('text6X').value || 36) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text6Y').value || 55) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText4_6 || fonts.kozgo, parseFloat($('text6Size').value || 13), parseFloat($('text6Spacing').value || 311), 0, tc, 'left', fonts.ar, dpiVal);

    ctx.fillStyle = $('rect9Color').value;
    ctx.fillRect(bleed ? sizes.bleed * mmPx : 0, 58 * mmPx + (bleed ? sizes.bleed * mmPx : 0), 150 * mmPx, 7 * mmPx);
    const fc = $('footerTextColor').value;
    drawText([$('text10').value], parseFloat($('text10X').value || 54) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text10Y').value || 62.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText10_12 || fonts.kozgo, parseFloat($('text10Size').value || 7), parseFloat($('text10Spacing').value || 236), 0, fc, 'left', fonts.ar, dpiVal);
    drawText([$('text11').value], parseFloat($('text11X').value || 80.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text11Y').value || 63) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText10_12 || fonts.kozgo, parseFloat($('text11Size').value || 10), parseFloat($('text11Spacing').value || 238), 0, fc, 'left', fonts.ar, dpiVal);
    drawText([$('text12').value], parseFloat($('text12X').value || 108) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text12Y').value || 63) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText10_12 || fonts.kozgo, parseFloat($('text12Size').value || 12.5), parseFloat($('text12Spacing').value || 236), 0, fc, 'left', fonts.ar, dpiVal);

    if ($('showQR').checked && qrImage) {
        const qx = w - 8.5 * mmPx - 23 * mmPx + (bleed ? sizes.bleed * mmPx : 0), 
              qy = 23 * mmPx + (bleed ? sizes.bleed * mmPx : 0), 
              qs = 23 * mmPx;
        ctx.drawImage(qrImage, qx, qy, qs, qs);
        ctx.strokeStyle = $('qrSquareColor').value;
        ctx.lineWidth = 2;
        ctx.strokeRect(qx, qy, qs, qs);
        console.log('QR code drawn at:', qx, qy, qs);
    }

    if (customImage && $('imageLayer').value === 'foreground') {
        ctx.drawImage(customImage, bleed ? sizes.bleed * mmPx : 0, bleed ? sizes.bleed * mmPx : 0, w - (bleed ? 2 * sizes.bleed * mmPx : 0), h - (bleed ? 2 * sizes.bleed * mmPx : 0));
    }
};

const setPreviewScale = (scale) => {
    previewScale = scale;
    console.log(`Setting preview scale to ${scale}x`);
    drawTicket(70);
};

const downloadTicket = (dpiVal) => {
    $('loading').style.display = 'block';
    drawTicket(dpiVal).then(() => {
        const link = document.createElement('a');
        link.download = `ticket-${dpiVal}dpi.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        $('loading').style.display = 'none';
    }).catch((err) => {
        console.error('Download error:', err);
        alert(langs.ja.downloadError);
        $('loading').style.display = 'none';
    });
};

const generateQRCode = () => {
    const text = $('qrCodeText').value.trim();
    if (!text) {
        alert(langs.ja.qrFormatError);
        return;
    }
    try {
        const qrCanvas = document.createElement('canvas');
        if (!qrCodeInstance) {
            qrCodeInstance = new QRCode(qrCanvas, {
                text: text,
                width: 300,
                height: 300,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            qrCodeInstance.clear();
            qrCodeInstance.makeCode(text);
        }
        qrImage = new Image();
        qrImage.src = qrCanvas.toDataURL('image/png');
        qrImage.onload = () => {
            console.log('QR code generated and loaded successfully.');
            drawTicket(70);
        };
        qrImage.onerror = () => {
            console.error('QR image load error');
            alert(langs.ja.qrLoadError);
        };
    } catch (e) {
        console.error('QR generation error:', e);
        alert(langs.ja.qrGenerateError);
    }
};

const loadFont = (inputId, fontKey) => {
    $(inputId).addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const font = new FontFace(fontKey, ev.target.result);
            font.load().then((loadedFont) => {
                document.fonts.add(loadedFont);
                fonts[fontKey] = fontKey;
                drawTicket(70);
            }).catch((err) => {
                console.error('Font load error:', err);
                alert(langs.ja.fontLoadError);
            });
        };
        reader.onerror = () => alert(langs.ja.qrReadError);
        reader.readAsArrayBuffer(file);
    });
};

loadFont('customFontRect1', 'customRect1');
loadFont('customFontText2_3', 'customText2_3');
loadFont('customFontText4_6', 'customText4_6');
loadFont('customFontText10_12', 'customText10_12');

$('qrCodeInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
        alert(langs.ja.qrFormatError);
        return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
        qrImage = new Image();
        qrImage.src = ev.target.result;
        qrImage.onload = () => {
            console.log('QR image uploaded and loaded.');
            drawTicket(70);
        };
        qrImage.onerror = () => alert(langs.ja.qrLoadError);
    };
    reader.onerror = () => alert(langs.ja.qrReadError);
    reader.readAsDataURL(file);
});

$('customImageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
        alert(langs.ja.qrFormatError);
        return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
        customImage = new Image();
        customImage.src = ev.target.result;
        customImage.onload = () => drawTicket(70);
        customImage.onerror = () => alert(langs.ja.qrLoadError);
    };
    reader.onerror = () => alert(langs.ja.qrReadError);
    reader.readAsDataURL(file);
});

const toggleAdvancedMode = () => {
    document.querySelectorAll('.advanced-mode').forEach(el => el.classList.toggle('active'));
};

const changeLanguage = (lang) => {
    document.title = langs[lang].title;
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if (langs[lang][key]) {
            if (el.tagName === 'LABEL') {
                const textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                if (textNode) textNode.textContent = langs[lang][key] + ': ';
            } else {
                el.textContent = langs[lang][key];
            }
        }
    });
};

document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', () => {
        const val = parseFloat(input.value);
        if (input.classList.contains('opacity-input') && (val < 0 || val > 1)) {
            $(input.id + '-error').textContent = langs.ja.opacityError;
            $(input.id + '-error').style.display = 'inline';
            input.value = Math.max(0, Math.min(1, val));
        } else if (val < 0) {
            $(input.id + '-error').textContent = langs.ja.inputError;
            $(input.id + '-error').style.display = 'inline';
            input.value = 0;
        } else {
            $(input.id + '-error').style.display = 'none';
        }
        drawTicket(70);
    });
});

document.querySelectorAll('input:not([type="number"]), select').forEach(el => el.addEventListener('input', () => drawTicket(70)));

window.addEventListener('load', () => {
    console.log('Page loaded, drawing initial ticket...');
    drawTicket(70);
});
