function $(id) { return document.getElementById(id); }

const canvas = $('ticketCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const fonts = { avant: 'ITC Avant Garde Gothic Std Extra Light', kozgo: 'KozGoPr6N', ar: 'AR ADGothicJP' };
const dpi = {
    300: { base: { w: Math.round(150 * 300 / 25.4), h: Math.round(65 * 300 / 25.4) }, bleed: { w: Math.round((150 + 6) * 300 / 25.4), h: Math.round((65 + 6) * 300 / 25.4) } },
    70: { base: { w: Math.round(150 * 70 / 25.4), h: Math.round(65 * 70 / 25.4) }, bleed: { w: Math.round((150 + 6) * 70 / 25.4), h: Math.round((65 + 6) * 70 / 25.4) } }
};

// 8. 預覽用高清 DPI (2倍 Retina 解析度，解決桌面版模糊)
const PREVIEW_DPI = 140; 
const CSS_BASE_DPI = 70;

let langs = {}, currentLang = 'ja';
let previewScale = window.innerWidth > 800 ? 1.5 : 1.0; 
let members = [], qrImage = null;

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => func(...args), delay); };
};

async function loadLanguages() {
    try {
        const response = await fetch('langs.json');
        langs = await response.json();
        
        let sysLang = navigator.language || navigator.userLanguage;
        if(sysLang.includes('zh-TW') || sysLang.includes('zh-HK')) currentLang = 'zh-TW';
        else if(sysLang.includes('zh')) currentLang = 'zh-CN';
        else if(sysLang.includes('ja')) currentLang = 'ja';
        else currentLang = 'en';
        
        $('languageSelector').value = currentLang;
        changeLanguage(currentLang);
    } catch (error) { console.error('Failed to load langs.json:', error); }
}

const changeLanguage = (lang) => {
    currentLang = lang;
    if (!langs[lang]) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (langs[lang][key]) {
            if (el.tagName === 'SPAN' || el.tagName === 'DIV' || el.tagName === 'H3' || el.tagName === 'BUTTON' || el.tagName === 'OPTION') {
                const icon = el.querySelector('i');
                if (icon) {
                    el.innerHTML = ''; el.appendChild(icon); el.appendChild(document.createTextNode(' ' + langs[lang][key]));
                } else {
                    el.textContent = langs[lang][key];
                }
            } else if (el.tagName === 'LABEL') {
                 const textNodes = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
                 if(textNodes.length > 0) textNodes[0].textContent = langs[lang][key] + ' ';
            } else {
                el.textContent = langs[lang][key];
            }
        }
    });

    document.querySelectorAll('[data-i18n-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-label');
        if(langs[lang][key]) el.setAttribute('data-label', langs[lang][key]);
    });

    debouncedDrawTicket();
};

function getMutedDarkColor(hex) {
    let r = parseInt(hex.substring(1,3), 16); let g = parseInt(hex.substring(3,5), 16); let b = parseInt(hex.substring(5,7), 16);
    r = Math.floor(r * 0.5 + 102 * 0.5); g = Math.floor(g * 0.5 + 102 * 0.5); b = Math.floor(b * 0.5 + 102 * 0.5);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// 9. 陰影顏色提取邏輯：將背景文字色大幅調亮並減淡
function getLighterMutedColor(hex) {
    let r = parseInt(hex.substring(1,3), 16); let g = parseInt(hex.substring(3,5), 16); let b = parseInt(hex.substring(5,7), 16);
    // 與純白混合 60% 提亮
    r = Math.floor(r * 0.4 + 255 * 0.6); g = Math.floor(g * 0.4 + 255 * 0.6); b = Math.floor(b * 0.4 + 255 * 0.6);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function getLuminance(hex) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16) / 255; let g = parseInt(hex.substring(2, 4), 16) / 255; let b = parseInt(hex.substring(4, 6), 16) / 255;
    let [rs, gs, bs] = [r, g, b].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

const drawText = (lines, x, y, font, size, spacing, height, color, align = 'left', altFont, dpiVal, context, enableGlow = false) => {
    if (!context) return;
    const ptPx = dpiVal / 72;
    context.fillStyle = color;
    context.textAlign = align;
    
    if (enableGlow) {
        const bgLum = getLuminance($('bgColor').value);
        context.shadowColor = bgLum > 0.6 ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)';
        context.shadowBlur = 3; context.shadowOffsetX = 1; context.shadowOffsetY = 1;
    } else {
        context.shadowColor = 'transparent';
    }

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
    context.shadowColor = 'transparent';
};

const drawTicket = async (exportDpi = null) => {
    // 判斷是匯出還是預覽
    const isPreview = (exportDpi === null);
    const renderDpi = isPreview ? PREVIEW_DPI : exportDpi;
    const targetCtx = isPreview ? ctx : document.createElement('canvas').getContext('2d');
    if (!targetCtx) return;

    const bleed = $('bleedOption')?.checked || false;
    const w = bleed ? dpi[renderDpi].bleed.w : dpi[renderDpi].base.w;
    const h = bleed ? dpi[renderDpi].bleed.h : dpi[renderDpi].base.h;
    const mmPx = renderDpi / 25.4;
    const bleedOffset = bleed ? 3 * mmPx : 0;

    targetCtx.canvas.width = w; 
    targetCtx.canvas.height = h;

    if (isPreview) {
        // 8. 預覽時 CSS 大小永遠基於 70 DPI 計算，確保物理大小一致但解析度提升
        const cssW = bleed ? dpi[CSS_BASE_DPI].bleed.w : dpi[CSS_BASE_DPI].base.w;
        const cssH = bleed ? dpi[CSS_BASE_DPI].bleed.h : dpi[CSS_BASE_DPI].base.h;
        if (window.innerWidth < 800) {
            canvas.style.width = '100%'; canvas.style.height = 'auto';
        } else {
            canvas.style.width = `${cssW * previewScale}px`; canvas.style.height = `${cssH * previewScale}px`;
        }
    }
    
    targetCtx.clearRect(0, 0, w, h);

    const colorA = $('rect1Color')?.value || '#2086D1'; 
    const colorB = $('bgColor')?.value || '#E5EDF9'; 
    
    targetCtx.fillStyle = colorB;
    targetCtx.fillRect(0, 0, w, h);

    const bgTextStr = $('bgText')?.value || 'YSS48';
    const bgTextX = parseFloat($('bgTextX')?.value || -100) * mmPx + bleedOffset;
    const bgTextY = parseFloat($('bgTextY')?.value || 0) * mmPx + bleedOffset;
    const bgTextSpacing = parseFloat($('bgTextSpacing')?.value || -6000);
    const bgTextSize = parseFloat($('bgTextSize')?.value || 62);
    const bgTextLineHeight = parseFloat($('bgTextLineHeight')?.value || 46);
    
    targetCtx.font = `${bgTextSize * (renderDpi / 72)}px ${fonts.avant}`;
    const cw = targetCtx.measureText(bgTextStr.charAt(0)).width;
    const tw = targetCtx.measureText(bgTextStr).width;
    const gx = tw + bgTextSpacing * (renderDpi/72) / 1000;
    const gy = bgTextLineHeight * (renderDpi / 72);
    
    targetCtx.globalAlpha = parseFloat($('bgShadowOpacity')?.value || 0.2);
    targetCtx.fillStyle = $('bgShadowColor')?.value || '#5F96ED';
    targetCtx.shadowColor = $('bgShadowColor')?.value || '#5F96ED';
    targetCtx.shadowOffsetX = parseFloat($('bgShadowX')?.value || 0.5) * mmPx;
    targetCtx.shadowOffsetY = parseFloat($('bgShadowY')?.value || -0.4) * mmPx;
    
    for (let y = bgTextY, r = 0; y < h; y += gy, r++) {
        for (let x = bgTextX + (r * cw); x < w; x += gx) { targetCtx.fillText(bgTextStr, x, y); }
    }
    
    targetCtx.globalAlpha = parseFloat($('bgTextOpacity')?.value || 0.15);
    targetCtx.shadowOffsetX = 0; targetCtx.shadowOffsetY = 0;
    targetCtx.fillStyle = $('bgTextColor')?.value || '#888888';
    for (let y = bgTextY, r = 0; y < h; y += gy, r++) {
        for (let x = bgTextX + (r * cw); x < w; x += gx) { targetCtx.fillText(bgTextStr, x, y); }
    }
    targetCtx.globalAlpha = 1;

    targetCtx.fillStyle = colorA;
    targetCtx.fillRect(8 * mmPx + bleedOffset, bleedOffset, 25 * mmPx, 35 * mmPx); 
    targetCtx.fillStyle = $('rect9Color')?.value || colorA;
    targetCtx.fillRect(bleedOffset, 60 * mmPx + bleedOffset, 150 * mmPx, 5 * mmPx); 
    
    const logoTextColor = $('rect1TextColor')?.value || '#FFFFFF';
    drawText([$('rect1Line1').value], parseFloat($('rect1Line1X').value) * mmPx + bleedOffset, parseFloat($('rect1Line1Y').value) * mmPx + bleedOffset, fonts.avant, parseFloat($('rect1Size').value), parseFloat($('rect1Spacing').value), 0, logoTextColor, 'center', null, renderDpi, targetCtx, false);
    drawText([$('rect1Line2').value], parseFloat($('rect1Line2X').value) * mmPx + bleedOffset, parseFloat($('rect1Line2Y').value) * mmPx + bleedOffset, fonts.avant, parseFloat($('rect1Line2Size').value), parseFloat($('rect1Line2Spacing').value), 0, logoTextColor, 'center', null, renderDpi, targetCtx, false);

    const mainTextColor = $('textColor')?.value || '#000000';
    drawText([$('text2').value], parseFloat($('text2X').value) * mmPx + bleedOffset, parseFloat($('text2Y').value) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text2Size').value), parseFloat($('text2Spacing').value), 0, mainTextColor, 'left', fonts.ar, renderDpi, targetCtx, true);
    drawText([$('text3Line1').value], parseFloat($('text3Line1X').value) * mmPx + bleedOffset, parseFloat($('text3Line1Y').value) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text3Size').value), parseFloat($('text3Spacing').value), 0, mainTextColor, 'left', fonts.ar, renderDpi, targetCtx, true);
    drawText([$('text3Line2').value], parseFloat($('text3Line2X').value) * mmPx + bleedOffset, parseFloat($('text3Line2Y').value) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text3Line2Size').value), parseFloat($('text3Line2Spacing').value), 0, mainTextColor, 'left', fonts.ar, renderDpi, targetCtx, true);
    drawText([$('text4Line1').value], parseFloat($('text4Line1X').value) * mmPx + bleedOffset, parseFloat($('text4Line1Y').value) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text4Size').value), parseFloat($('text4Spacing').value), parseFloat($('text4LineHeight')?.value||14), mainTextColor, 'left', fonts.ar, renderDpi, targetCtx, true);
    drawText([$('text4Line2').value], 13 * mmPx + bleedOffset, 48 * mmPx + bleedOffset, fonts.kozgo, 11, 1000, 0, mainTextColor, 'left', fonts.ar, renderDpi, targetCtx, true); 
    drawText([$('text5').value], parseFloat($('text5X').value) * mmPx + bleedOffset, parseFloat($('text5Y').value) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text5Size').value), parseFloat($('text5Spacing').value), 0, mainTextColor, 'left', fonts.ar, renderDpi, targetCtx, true);
    drawText([$('text6').value], parseFloat($('text6X').value) * mmPx + bleedOffset, parseFloat($('text6Y').value) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text6Size').value), parseFloat($('text6Spacing').value), 0, mainTextColor, 'left', fonts.ar, renderDpi, targetCtx, true);

    const footerTextColor = $('footerTextColor')?.value || '#FFFFFF';
    drawText([$('text10').value], parseFloat($('text10X').value) * mmPx + bleedOffset, parseFloat($('text10Y').value) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text10Size').value), parseFloat($('text10Spacing').value), 0, footerTextColor, 'left', fonts.ar, renderDpi, targetCtx, false);
    drawText([$('text11').value], parseFloat($('text11X').value) * mmPx + bleedOffset, parseFloat($('text11Y').value) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text11Size').value), parseFloat($('text11Spacing').value), 0, footerTextColor, 'left', fonts.ar, renderDpi, targetCtx, false);
    drawText([$('text12').value], parseFloat($('text12X').value) * mmPx + bleedOffset, parseFloat($('text12Y').value) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text12Size').value), parseFloat($('text12Spacing').value), 0, footerTextColor, 'left', fonts.ar, renderDpi, targetCtx, false);

    if ($('showQR').checked) {
        const qs = 23 * mmPx;
        const qx = w - (8.5 * mmPx) - qs - (bleed ? 3*mmPx : 0);
        const qy = 23 * mmPx + bleedOffset;
        targetCtx.fillStyle = colorA;
        targetCtx.fillRect(qx, qy, qs, qs);
        if ($('qrCodeUrl').value && qrImage) { targetCtx.drawImage(qrImage, qx, qy, qs, qs); }
    }

    if (!isPreview) triggerDownload(targetCtx.canvas, `${exportDpi}dpi`);
};

const debouncedDrawTicket = debounce(() => drawTicket(), 150);

async function waitForFonts() {
    const fontPromises = [
        document.fonts.load(`400 47px "${fonts.avant}"`),
        document.fonts.load(`400 14.2px "${fonts.kozgo}"`),
        document.fonts.load(`400 14.2px "${fonts.ar}"`)
    ];
    try { await Promise.all(fontPromises); } catch (err) { console.error(err); }
}

async function loadMembers() {
    try {
        const response = await fetch('members.json');
        members = await response.json();
        const selector = $('memberSelector');
        const groups = {};
        members.forEach(m => { const gen = m.generation || '其他'; if(!groups[gen]) groups[gen] = []; groups[gen].push(m); });
        for (const [gen, mems] of Object.entries(groups)) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = gen;
            mems.forEach(m => {
                const option = document.createElement('option');
                option.value = m.name_ja; option.textContent = `${m.name_ja} (${m.name_en})`;
                optgroup.appendChild(option);
            });
            selector.appendChild(optgroup);
        }
    } catch (error) { console.error(error); }
}

$('memberSelector')?.addEventListener('change', (e) => {
    const member = members.find(m => m.name_ja === e.target.value);
    if (member) {
        $('memberHeader').style.display = 'flex';
        $('memberAvatar').src = member.image;
        $('memberName').textContent = member.name_ja;
        
        document.documentElement.style.setProperty('--color-a', member.color_a);
        document.documentElement.style.setProperty('--color-b', member.color_b);
        
        $('rect1Color').value = member.color_a; 
        $('rect9Color').value = member.color_a; 
        
        // 5. Logo A色黑白字判斷
        const lumA = getLuminance(member.color_a);
        const textColorA = lumA > 0.8 ? '#000000' : '#FFFFFF';
        $('rect1TextColor').value = textColorA;
        $('footerTextColor').value = textColorA;
        
        let bColor = member.color_b === '#ffffff' ? '#FDF9FA' : member.color_b;
        $('bgColor').value = bColor; 
        
        // 9. 背景文字與陰影提取
        const mutedTextColor = getMutedDarkColor(bColor);
        $('bgTextColor').value = mutedTextColor;
        $('bgShadowColor').value = getLighterMutedColor(mutedTextColor);
        $('bgTextOpacity').value = 0.15;

        debouncedDrawTicket();
    } else {
        $('memberHeader').style.display = 'none';
    }
});

document.addEventListener('mousedown', function(e) {
    if(['INPUT', 'BUTTON', 'SELECT', 'A', 'I', 'LABEL'].includes(e.target.tagName)) return;
    let ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = e.clientX - 20 + 'px';
    ripple.style.top = e.clientY - 20 + 'px';
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
});

function initSidebarNav() {
    const navIcons = document.querySelectorAll('.nav-icon:not(.special-link)');
    const sections = document.querySelectorAll('.drawer-section');
    const drawer = $('settingsDrawer');

    navIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const isAlreadyActive = icon.classList.contains('active');
            navIcons.forEach(i => i.classList.remove('active'));
            sections.forEach(sec => sec.style.display = 'none');
            
            if (isAlreadyActive && drawer.classList.contains('open')) {
                drawer.classList.remove('open');
            } else {
                icon.classList.add('active');
                drawer.classList.add('open');
                const targetSec = $(icon.getAttribute('data-target'));
                if(targetSec) targetSec.style.display = 'block';
            }
        });
    });

    document.querySelectorAll('.hover-zone').forEach(zone => {
        zone.addEventListener('click', () => {
            const targetId = zone.id.replace('zone-', 'sec-');
            const icon = document.querySelector(`.nav-icon[data-target="${targetId}"]`);
            if(icon) {
                if(!icon.classList.contains('active')) icon.click();
                else if (!drawer.classList.contains('open')) drawer.classList.add('open');
            }
        });
    });
}

$('advToggleBtnMaster')?.addEventListener('click', () => {
    const advAreas = document.querySelectorAll('.advanced-options');
    let isActive = false;
    advAreas.forEach(el => { el.classList.toggle('active'); if(el.classList.contains('active')) isActive = true; });
    const span = $('advToggleBtnMaster').querySelector('span');
    if(span) span.textContent = isActive ? langs[currentLang].simple_mode : langs[currentLang].advanced_mode;
});

// Slider 雙向同步
document.querySelectorAll('.sync-slider').forEach(slider => {
    const input = $(slider.getAttribute('data-target'));
    if (input) {
        slider.addEventListener('input', e => { input.value = e.target.value; debouncedDrawTicket(); });
        input.addEventListener('input', e => { slider.value = e.target.value; });
    }
});

$('qrCodeUrl')?.addEventListener('input', debounce(() => {
    const url = $('qrCodeUrl').value;
    const qrContainer = $('qrPreview');
    qrContainer.innerHTML = '';
    if (!url) { qrImage = null; debouncedDrawTicket(); return; }
    new QRCode(qrContainer, { text: url, width: 128, height: 128 });
    setTimeout(() => {
        const qrElement = qrContainer.querySelector('img') || qrContainer.querySelector('canvas');
        if (qrElement) {
            qrImage = new Image();
            qrImage.onload = () => debouncedDrawTicket();
            qrImage.src = qrElement.tagName === 'IMG' ? qrElement.src : qrElement.toDataURL('image/png');
        }
    }, 300);
}, 500));

$('showQR').addEventListener('change', () => debouncedDrawTicket());
document.querySelectorAll('input').forEach(el => { if(!el.classList.contains('sync-slider')) el.addEventListener('input', () => debouncedDrawTicket()); });
$('languageSelector')?.addEventListener('change', (e) => changeLanguage(e.target.value));
$('themeToggleBtn')?.addEventListener('click', () => { document.body.setAttribute('data-theme', document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); });

$('downloadBtn')?.addEventListener('click', () => $('downloadModal').style.display = 'flex');
$('dl300')?.addEventListener('click', () => { $('downloadModal').style.display = 'none'; drawTicket(300); });
$('dl70')?.addEventListener('click', () => { $('downloadModal').style.display = 'none'; drawTicket(70); });

function triggerDownload(canvasObj, dpiStr) {
    const link = document.createElement('a'); link.download = `Ticket_${dpiStr}_${Date.now()}.png`; link.href = canvasObj.toDataURL('image/png'); link.click();
}

window.addEventListener('resize', () => debouncedDrawTicket());
window.onload = async () => { await waitForFonts(); await loadLanguages(); await loadMembers(); initSidebarNav(); drawTicket(); };
