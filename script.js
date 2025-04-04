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
    300: { base: { w: Math.round(150 * 300 / 25.4), h: Math.round(65 * 300 / 25.4) }, bleed: { w: Math.round((150 + 6) * 300 / 25.4), h: Math.round((65 + 6) * 300 / 25.4) } },
    70: { base: { w: Math.round(150 * 70 / 25.4), h: Math.round(65 * 70 / 25.4) }, bleed: { w: Math.round((150 + 6) * 70 / 25.4), h: Math.round((65 + 6) * 70 / 25.4) } }
};

let qrImage = null, customImage = null, previewScale = 1.0;
let langs = {}, members = [], currentLang = 'ja';

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

const drawText = (lines, x, y, font, size, spacing, height, color, align = 'left', altFont, dpiVal = 300, context = ctx) => {
    if (!context) return;
    const ptPx = dpiVal / 72;
    context.fillStyle = color;
    context.textAlign = align;
    lines.forEach((l, i) => {
        let cx = x, ly = y + i * height * ptPx;
        if (!l) return;
        l.split('').forEach(c => {
            const isAlt = altFont && /[A-Za-z0-9①❘－]/.test(c);
            context.font = `${size * ptPx}px ${isAlt ? altFont : font || 'sans-serif'}`;
            context.fillText(c, cx, ly);
            cx += context.measureText(c).width + spacing * ptPx / 1000;
        });
    });
};

const drawBackground = async (dpiVal, bleed, w, h, mmPx, context = ctx) => {
    context.fillStyle = $('bgColor')?.value || '#E5EDF9';
    context.fillRect(0, 0, w, h);

    if (customImage) {
        const imgX = parseFloat($('customImageX')?.value || 0) * mmPx + (bleed ? sizes.bleed * mmPx : 0);
        const imgY = parseFloat($('customImageY')?.value || 0) * mmPx + (bleed ? sizes.bleed * mmPx : 0);
        const imgScale = parseFloat($('customImageScale')?.value || 1);
        const imgW = customImage.width * imgScale * (dpiVal / 72);
        const imgH = customImage.height * imgScale * (dpiVal / 72);
        context.drawImage(customImage, imgX, imgY, imgW, imgH);
    }

    const bg = { 
        t: $('bgText')?.value || 'YSS48', 
        x: parseFloat($('bgTextX')?.value || -100) * mmPx + (bleed ? sizes.bleed * mmPx : 0), 
        y: parseFloat($('bgTextY')?.value || 0) * mmPx + (bleed ? sizes.bleed * mmPx : 0), 
        s: parseFloat($('bgTextSpacing')?.value || -6000), 
        lh: parseFloat($('bgTextLineHeight')?.value || 46), 
        sz: parseFloat($('bgTextSize')?.value || 62) 
    };
    context.font = `${bg.sz * (dpiVal / 72)}px ${fonts.customRect1 || fonts.avant}`;
    const cw = context.measureText(bg.t.charAt(0)).width, 
          tw = context.measureText(bg.t).width, 
          gx = tw + bg.s * (dpiVal / 72) / 1000, 
          gy = bg.lh * (dpiVal / 72);
    context.globalAlpha = parseFloat($('bgShadowOpacity')?.value || 0.2);
    context.fillStyle = $('bgShadowColor')?.value || '#5F96ED';
    context.shadowColor = $('bgShadowColor')?.value || '#5F96ED';
    context.shadowOffsetX = parseFloat($('bgShadowX')?.value || 0.5) * mmPx;
    context.shadowOffsetY = parseFloat($('bgShadowY')?.value || -0.4) * mmPx;
    for (let y = bg.y, r = 0; y < h; y += gy, r++) 
        for (let x = bg.x + r * cw; x < w; x += gx) 
            context.fillText(bg.t, x, y);
    context.globalAlpha = parseFloat($('bgTextOpacity')?.value || 1);
    context.shadowOffsetX = context.shadowOffsetY = 0;
    context.fillStyle = $('bgTextColor')?.value || '#FFFFFF';
    for (let y = bg.y, r = 0; y < h; y += gy, r++) 
        for (let x = bg.x + r * cw; x < w; x += gx) 
            context.fillText(bg.t, x, y);
    context.globalAlpha = 1;
};

const drawArea1 = (dpiVal, bleed, mmPx, context = ctx) => {
    context.fillStyle = $('rect1Color')?.value || '#2086D1';
    context.fillRect(8 * mmPx + (bleed ? sizes.bleed * mmPx : 0), bleed ? sizes.bleed * mmPx : 0, 25 * mmPx, 35 * mmPx);
    drawText([$('rect1Line1')?.value || 'YSS'], parseFloat($('rect1Line1X')?.value || 13.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('rect1Line1Y')?.value || 12) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customRect1 || fonts.avant, parseFloat($('rect1Size')?.value || 47), parseFloat($('rect1Spacing')?.value || -7000), 0, $('rect1TextColor')?.value || '#FFFFFF', 'center', null, dpiVal, context);
    drawText([$('rect1Line2')?.value || '48'], parseFloat($('rect1Line2X')?.value || 13.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('rect1Line2Y')?.value || 24) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customRect1 || fonts.avant, parseFloat($('rect1Line2Size')?.value || 47), parseFloat($('rect1Line2Spacing')?.value || -7000), 0, $('rect1TextColor')?.value || '#FFFFFF', 'center', null, dpiVal, context);
};

const drawText2To6 = (dpiVal, bleed, mmPx, context = ctx) => {
    const tc = $('textColor')?.value || '#000000';
    drawText([$('text2')?.value || '「ここからだ」 公演'], parseFloat($('text2X')?.value || 37) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text2Y')?.value || 12) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText2_3 || fonts.kozgo, parseFloat($('text2Size')?.value || 14.2), parseFloat($('text2Spacing')?.value || 2000), 0, tc, 'left', fonts.ar, dpiVal, context);
    drawText([$('text3Line1')?.value || '秋元康 生誕祭'], parseFloat($('text3Line1X')?.value || 35) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text3Line1Y')?.value || 19) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText2_3 || fonts.kozgo, parseFloat($('text3Size')?.value || 14.2), parseFloat($('text3Spacing')?.value || 2000), 0, tc, 'left', fonts.ar, dpiVal, context);
    drawText([$('text3Line2')?.value || 'YSS48劇場'], parseFloat($('text3Line2X')?.value || 35) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text3Line2Y')?.value || 25) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText2_3 || fonts.kozgo, parseFloat($('text3Line2Size')?.value || 14.2), parseFloat($('text3Line2Spacing')?.value || 2000), 0, tc, 'left', fonts.ar, dpiVal, context);
    drawText([$('text4Line1')?.value || '＜日付＞2025年05月02日（金）', $('text4Line2')?.value || 'OPEN：18時10分       START：18時30分      ￥3,400'], parseFloat($('text4Line1X')?.value || 13) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text4Line1Y')?.value || 43) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText4_6 || fonts.kozgo, parseFloat($('text4Size')?.value || 11), parseFloat($('text4Spacing')?.value || 1000), parseFloat($('text4LineHeight')?.value || 14), tc, 'left', fonts.ar, dpiVal, context);
    drawText([$('text5')?.value || '048番'], parseFloat($('text5X')?.value || 13) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text5Y')?.value || 55) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText4_6 || fonts.kozgo, parseFloat($('text5Size')?.value || 16), parseFloat($('text5Spacing')?.value || 200), 0, tc, 'left', fonts.ar, dpiVal, context);
    drawText([$('text6')?.value || '① ❘ 000－0000 ❘ ゴメン先生 様'], parseFloat($('text6X')?.value || 36) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text6Y')?.value || 55) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText4_6 || fonts.kozgo, parseFloat($('text6Size')?.value || 13), parseFloat($('text6Spacing')?.value || 311), 0, tc, 'left', fonts.ar, dpiVal, context);
};

const drawArea9 = (dpiVal, bleed, mmPx, context = ctx) => {
    context.fillStyle = $('rect9Color')?.value || '#2086D1';
    context.fillRect(bleed ? sizes.bleed * mmPx : 0, 60 * mmPx + (bleed ? sizes.bleed * mmPx : 0), 150 * mmPx, 5 * mmPx);
    const fc = $('footerTextColor')?.value || '#FFFFFF';
    drawText([$('text10')?.value || '<主催 ‧ お問い合せ>'], parseFloat($('text10X')?.value || 54) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text10Y')?.value || 63.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText10_12 || fonts.kozgo, parseFloat($('text10Size')?.value || 7), parseFloat($('text10Spacing')?.value || 236), 0, fc, 'left', fonts.ar, dpiVal, context);
    drawText([$('text11')?.value || 'YSS48 Theater'], parseFloat($('text11X')?.value || 80.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text11Y')?.value || 63.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText10_12 || fonts.kozgo, parseFloat($('text11Size')?.value || 10), parseFloat($('text11Spacing')?.value || 238), 0, fc, 'left', fonts.ar, dpiVal, context);
    drawText([$('text12')?.value || 'TEL:01-2345-6789'], parseFloat($('text12X')?.value || 108) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text12Y')?.value || 64) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText10_12 || fonts.kozgo, parseFloat($('text12Size')?.value || 12.5), parseFloat($('text12Spacing')?.value || 236), 0, fc, 'left', fonts.ar, dpiVal, context);
};

const drawQRCode = (dpiVal, bleed, w, mmPx, context = ctx) => {
    if ($('showQR')?.checked && qrImage) {
        const qrRightMargin = 8.5 * mmPx;
        const qrTopMargin = 23 * mmPx;
        const qs = 23 * mmPx;
        const qx = w - qrRightMargin - qs;
        const qy = qrTopMargin;
        context.fillStyle = $('qrSquareColor')?.value || '#2086D1';
        context.fillRect(qx, qy, qs, qs);
        context.drawImage(qrImage, qx, qy, qs, qs);
    }
};

const drawTicket = async (dpiVal, context = ctx) => {
    if (!context) return;
    const bleed = $('bleedOption')?.checked || false;
    const w = bleed ? dpi[dpiVal].bleed.w : dpi[dpiVal].base.w;
    const h = bleed ? dpi[dpiVal].bleed.h : dpi[dpiVal].base.h;
    const mmPx = dpiVal / 25.4;
    context.canvas.width = w;
    context.canvas.height = h;
    if (context === ctx) {
        canvas.style.width = `${w * previewScale}px`;
        canvas.style.height = `${h * previewScale}px`;
    }
    context.clearRect(0, 0, w, h);

    await drawBackground(dpiVal, bleed, w, h, mmPx, context);
    drawArea1(dpiVal, bleed, mmPx, context);
    drawText2To6(dpiVal, bleed, mmPx, context);
    drawArea9(dpiVal, bleed, mmPx, context);
    drawQRCode(dpiVal, bleed, w, mmPx, context);
};

const debouncedDrawTicket = debounce((dpiVal) => drawTicket(dpiVal), 300);

const setPreviewScale = (scale) => {
    previewScale = scale;
    if (window.innerWidth <= 768 && window.matchMedia("(orientation: portrait)").matches) {
        previewScale = Math.min(scale, (window.visualViewport?.width || window.innerWidth) / dpi[70].base.w * 0.8);
    }
    if (ctx) {
        const w = dpi[70].base.w;
        const h = dpi[70].base.h;
        canvas.style.width = `${w * previewScale}px`;
        canvas.style.height = `${h * previewScale}px`;
        debouncedDrawTicket(70);
    }
};

const downloadTicket = async (dpiVal) => {
    $('loading').style.display = 'block';
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const bleed = $('bleedOption')?.checked || false;
    const w = bleed ? dpi[dpiVal].bleed.w : dpi[dpiVal].base.w;
    const h = bleed ? dpi[dpiVal].bleed.h : dpi[dpiVal].base.h;
    const mmPx = dpiVal / 25.4;

    tempCanvas.width = w;
    tempCanvas.height = h;
    tempCtx.clearRect(0, 0, w, h);

    await drawBackground(dpiVal, bleed, w, h, mmPx, tempCtx);
    drawArea1(dpiVal, bleed, mmPx, tempCtx);
    drawText2To6(dpiVal, bleed, mmPx, tempCtx);
    drawArea9(dpiVal, bleed, mmPx, tempCtx);
    drawQRCode(dpiVal, bleed, w, mmPx, tempCtx);

    const link = document.createElement('a');
    link.download = `ticket_${dpiVal}dpi.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();

    await drawTicket(70);
    $('loading').style.display = 'none';
};

const downloadPDF = async () => {
    const { jsPDF } = window.jspdf;
    $('loading').textContent = langs[currentLang].generating || '生成中...';
    $('loading').style.display = 'block';
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    await drawTicket(300, tempCtx); // 使用 300 DPI
    const imgData = tempCanvas.toDataURL('image/png');
    const doc = new jsPDF({ unit: 'mm', format: [150, 65] });
    doc.addImage(imgData, 'PNG', 0, 0, 150, 65);
    doc.save('ticket.pdf');
    $('loading').style.display = 'none';
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
            debouncedDrawTicket(70);
        } catch (err) {
            console.error(`Failed to load font ${fontKey}:`, err);
            alert(langs[currentLang].fontLoadError);
        }
    };
    reader.onerror = () => alert(langs[currentLang].qrReadError);
    reader.readAsArrayBuffer(file);
};

const updateQRCode = () => {
    const url = $('qrCodeUrl')?.value;
    const qrContainer = $('qrPreview');
    qrContainer.innerHTML = '';
    qrContainer.style.display = 'block';
    if (!url) {
        qrImage = null;
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = $('qrSquareColor')?.value || '#2086D1';
        ctx.fillRect(0, 0, 128, 128);
        qrContainer.appendChild(canvas);
        debouncedDrawTicket(70);
        return;
    }
    new QRCode(qrContainer, {
        text: url,
        width: 128,
        height: 128,
        correctLevel: QRCode.CorrectLevel.H
    });
    setTimeout(() => {
        const qrElement = qrContainer.querySelector('img') || qrContainer.querySelector('canvas');
        if (!qrElement) return;
        const img = new Image();
        img.onload = () => {
            qrImage = img;
            debouncedDrawTicket(70);
        };
        img.src = qrElement.tagName === 'IMG' ? qrElement.src : qrElement.toDataURL('image/png');
    }, 300);
};

const changeLanguage = (lang) => {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (langs[lang][key]) {
            if (el.tagName === 'LABEL') {
                const input = el.querySelector('input, select');
                if (input) {
                    const textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                    if (textNode) textNode.textContent = langs[lang][key] + ': ';
                } else {
                    el.textContent = langs[lang][key];
                }
            } else {
                el.textContent = langs[lang][key];
            }
        }
    });
    debouncedDrawTicket(70);
};

const toggleAdvancedMode = () => {
    document.querySelectorAll('.advanced-mode').forEach(el => el.classList.toggle('active'));
    const btn = $('advancedModeBtn');
    btn.textContent = btn.textContent === langs[currentLang].advanced_mode ? langs[currentLang].simple_mode : langs[currentLang].advanced_mode;
};

const waitForFonts = async () => {
    const fontPromises = [
        document.fonts.load(`400 47px ${fonts.avant}`),
        document.fonts.load(`400 62px ${fonts.avant}`),
        document.fonts.load(`400 14.2px ${fonts.kozgo}`),
        document.fonts.load(`400 14.2px ${fonts.ar}`)
    ];
    try {
        await Promise.all(fontPromises);
    } catch (err) {
        console.error('Font loading failed:', err);
        alert(langs[currentLang].fontLoadError);
    }
};

async function loadLanguages() {
    try {
        const response = await fetch('langs.json');
        langs = await response.json();
        changeLanguage(currentLang);
    } catch (error) {
        console.error('Failed to load languages:', error);
    }
}

async function loadMembers() {
    try {
        const response = await fetch('members.json');
        members = await response.json();
        const selector = $('memberSelector');
        selector.innerHTML = '<option value="">選択なし</option>';
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.name_en;
            option.textContent = `${member.name_ja} (${member.name_en})`;
            selector.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load members:', error);
    }
}

function contrastColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
}

function applyMemberColor(member) {
    if (member.color === "#ffffff") {
        $('bgColor').value = "#ffffff";
        $('rect1Color').value = member.gradient[1];
        $('rect9Color').value = member.gradient[1];
        $('bgTextColor').value = member.name_en === "Mayuu Masai" || member.name_en === "Serika Nagano" ? "#1F1F1F" : contrastColor("#ffffff");
    } else if (member.name_en === "Saho Iwatate") {
        $('bgColor').value = "#3860FF";
        $('rect1Color').value = "#3860FF";
        $('rect9Color').value = "#FF3633";
        $('bgTextColor').value = contrastColor("#3860FF");
    } else {
        $('bgColor').value = member.color;
        $('rect1Color').value = member.gradient[1];
        $('rect9Color').value = member.gradient[1];
        $('bgTextColor').value = contrastColor(member.color);
    }
    $('bgTextOpacity').value = 0.2;
    const preview = $('memberPreview');
    preview.innerHTML = `
        <img src="${member.image}" alt="${member.name_ja}" style="width: 50px; height: 50px; object-fit: cover;">
        <p>${member.name_ja}</p>
        <div style="width: 80px; height: 20px; background: linear-gradient(to right, ${member.gradient[0]}, ${member.gradient[1]})"></div>
    `;
    debouncedDrawTicket(70);
}

const showThanksMessage = () => {
    alert(langs[currentLang].thanks_message);
};

document.addEventListener('DOMContentLoaded', () => {
    $('languageSelector')?.addEventListener('change', (e) => changeLanguage(e.target.value));
    $('qrCodeUrl')?.addEventListener('input', debounce(updateQRCode, 500));
    $('showQR')?.addEventListener('change', () => debouncedDrawTicket(70));
    $('qrSquareColor')?.addEventListener('input', () => debouncedDrawTicket(70));

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
            customImage.onload = () => debouncedDrawTicket(70);
        };
        reader.onerror = () => alert(langs[currentLang].qrReadError);
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
            const val = parseFloat(input.value);
            const errorSpan = $(input.id + '-error');
            if (isNaN(val)) {
                errorSpan.textContent = langs[currentLang].inputError;
                errorSpan.style.display = 'inline';
                input.value = 0;
            } else if (input.classList.contains('size-input') && (val < 1 || val > 100)) {
                errorSpan.textContent = langs[currentLang].sizeError || '大小必須介於 1-100pt';
                errorSpan.style.display = 'inline';
                input.value = Math.max(1, Math.min(100, val));
            } else if (input.classList.contains('opacity-input') && (val < 0 || val > 1)) {
                errorSpan.textContent = langs[currentLang].opacityError;
                errorSpan.style.display = 'inline';
                input.value = Math.max(0, Math.min(1, val));
            } else {
                errorSpan.style.display = 'none';
            }
            debouncedDrawTicket(70);
        });
    });

    document.querySelectorAll('input:not([type="number"]), select').forEach(el => {
        if (el.id !== 'languageSelector' && el.id !== 'memberSelector') {
            el.addEventListener('input', () => debouncedDrawTicket(70));
        }
    });

    $('scaleButton')?.addEventListener('click', () => {
        const options = $('scaleOptions');
        options.style.display = options.style.display === 'block' ? 'none' : 'block';
    });
    $('downloadButton')?.addEventListener('click', () => {
        const options = $('downloadOptions');
        options.style.display = options.style.display === 'block' ? 'none' : 'block';
    });
    $('download300Button')?.addEventListener('click', () => { showThanksMessage(); downloadTicket(300); });
    $('download70Button')?.addEventListener('click', () => { showThanksMessage(); downloadTicket(70); });
    $('downloadPdfButton')?.addEventListener('click', () => { showThanksMessage(); downloadPDF(); });
    $('advancedModeBtn')?.addEventListener('click', toggleAdvancedMode);
    $('nightModeBtn')?.addEventListener('click', () => {
        document.body.classList.toggle('night-mode');
        $('nightModeBtn').textContent = document.body.classList.contains('night-mode') ? langs[currentLang].default_mode : langs[currentLang].night_mode;
    });
    $('shareTwitterBtn')?.addEventListener('click', () => {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent('自作チケットをシェアします！ #TicketMaker');
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    });
    $('memberSelector')?.addEventListener('change', (e) => {
        const selected = members.find(m => m.name_en === e.target.value);
        if (selected) applyMemberColor(selected);
    });
    $('applyMemberColorBtn')?.addEventListener('click', () => {
        const selected = members.find(m => m.name_en === $('memberSelector').value);
        if (selected) applyMemberColor(selected);
    });

    document.querySelectorAll('.accordion-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const content = toggle.nextElementSibling;
            content.classList.toggle('active');
        });
    });
});

window.onload = async () => {
    await loadLanguages();
    await loadMembers();
    await waitForFonts();
    if (window.innerWidth <= 768 && window.matchMedia("(orientation: portrait)").matches) {
        previewScale = Math.min(1.0, (window.visualViewport?.width || window.innerWidth) / dpi[70].base.w * 0.8);
    } else {
        previewScale = 1.0;
    }
    await drawTicket(70);
};
