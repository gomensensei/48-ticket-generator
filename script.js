function $(id) { return document.getElementById(id); }

const canvas = $('ticketCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const fonts = {
    avant: 'ITC Avant Garde Gothic Std Extra Light',
    kozgo: 'KozGoPr6N',
    ar: 'AR ADGothicJP'
};

const dpi = {
    300: { base: { w: Math.round(150 * 300 / 25.4), h: Math.round(65 * 300 / 25.4) } },
    70: { base: { w: Math.round(150 * 70 / 25.4), h: Math.round(65 * 70 / 25.4) } }
};

let langs = {}, currentLang = 'ja', previewScale = 1.0;
let members = [], qrImage = null;

// UI 基礎位移基準點
const baseLayout = {
    rect1Line1: { x: 13.5, y: 12, spacing: -7000, size: 47 },
    rect1Line2: { x: 13.5, y: 24, spacing: -7000, size: 47 },
    text2: { x: 37, y: 12, spacing: 2000, size: 14.2 },
    text3Line1: { x: 35, y: 19, spacing: 2000, size: 14.2 },
    text3Line2: { x: 35, y: 25, spacing: 2000, size: 14.2 },
    text4Line1: { x: 13, y: 43, spacing: 1000, size: 11 },
    text4Line2: { x: 13, y: 48, spacing: 1000, size: 11 }, // 假設
    text5: { x: 13, y: 55, spacing: 200, size: 16 },
    text6: { x: 36, y: 55, spacing: 311, size: 13 },
    footerLines: { y: 63.5 }
};

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => func(...args), delay); };
};

// ==========================================
// 1. 多國語言系統 (langs.json 整合)
// ==========================================
async function loadLanguages() {
    try {
        const response = await fetch('langs.json');
        langs = await response.json();
        changeLanguage(currentLang);
    } catch (error) {
        console.error('Failed to load langs.json:', error);
    }
}

const changeLanguage = (lang) => {
    currentLang = lang;
    if (!langs[lang]) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (langs[lang][key]) {
            if (el.tagName === 'LABEL') {
                const textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
                if (textNode) textNode.textContent = langs[lang][key] + ' ';
            } else if (el.tagName === 'SPAN' || el.tagName === 'DIV') {
                const icon = el.querySelector('i');
                if (icon) {
                    el.innerHTML = ''; el.appendChild(icon); el.appendChild(document.createTextNode(' ' + langs[lang][key]));
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

// ==========================================
// 2. 智能色彩對比系統 (分離 A/B 兩色)
// ==========================================
function getLuminance(hex) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;
    let [rs, gs, bs] = [r, g, b].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// ==========================================
// 3. 畫布渲染核心
// ==========================================
const drawText = (lines, x, y, font, size, spacing, height, color, align = 'left', altFont, dpiVal, context) => {
    if (!context) return;
    const ptPx = dpiVal / 72;
    context.fillStyle = color;
    context.textAlign = align;
    
    lines.forEach((l, i) => {
        let cx = x, ly = y + i * height * ptPx;
        if (!l) return;
        l.split('').forEach(c => {
            const isAlt = altFont && /[A-Za-z0-9①❘－]/.test(c);
            context.font = `${size * ptPx}px ${isAlt ? altFont : font}`;
            context.fillText(c, cx, ly);
            cx += context.measureText(c).width + spacing * ptPx / 1000;
        });
    });
};

const drawTicket = async (dpiVal) => {
    if (!ctx) return;
    const w = dpi[dpiVal].base.w;
    const h = dpi[dpiVal].base.h;
    const mmPx = dpiVal / 25.4;

    canvas.width = w; canvas.height = h;
    canvas.style.width = `${w * previewScale}px`; canvas.style.height = `${h * previewScale}px`;
    ctx.clearRect(0, 0, w, h);

    // 取得雙色
    const colorA = $('rect1Color')?.value || '#2086D1'; // 方塊色
    const colorB = $('bgColor')?.value || '#FDF9FA';    // 背景色
    
    // 背景繪製 (Color B)
    ctx.fillStyle = colorB;
    ctx.fillRect(0, 0, w, h);

    // 背景浮水印 (基於 Color B 對比度)
    const bgLum = getLuminance(colorB);
    ctx.fillStyle = bgLum > 0.8 ? '#1A1A1A' : '#FFFFFF';
    ctx.globalAlpha = bgLum > 0.8 ? 0.03 : 0.1;
    ctx.font = `${62 * (dpiVal / 72)}px ${fonts.avant}`;
    
    const gx = ctx.measureText("YSS48").width - (6000 * (dpiVal/72) / 1000);
    for (let y = 0; y < h + 46 * (dpiVal/72); y += 46 * (dpiVal/72)) {
        for (let x = -50 * mmPx; x < w; x += gx) {
            ctx.fillText("YSS48", x, y);
        }
    }
    ctx.globalAlpha = 1.0;

    // 方塊繪製 (Color A)
    ctx.fillStyle = colorA;
    ctx.fillRect(8 * mmPx, 0, 25 * mmPx, 35 * mmPx); // Logo Box
    ctx.fillRect(0, 60 * mmPx, 150 * mmPx, 5 * mmPx); // Footer Box
    
    // Logo 顏色 (基於 Color A 對比度)
    const boxLum = getLuminance(colorA);
    const logoTextColor = boxLum > 0.6 ? '#1A1A1A' : '#FFFFFF';

    // 取得歸一化偏移
    const offX1 = parseFloat($('rect1Line1X_slider')?.value || 0);

    // 繪製 Logo 文字
    drawText([$('rect1Line1')?.value || 'YSS'], (baseLayout.rect1Line1.x + offX1) * mmPx, baseLayout.rect1Line1.y * mmPx, fonts.avant, baseLayout.rect1Line1.size, baseLayout.rect1Line1.spacing, 0, logoTextColor, 'center', null, dpiVal, ctx);
    drawText([$('rect1Line2')?.value || '48'], (baseLayout.rect1Line2.x + offX1) * mmPx, baseLayout.rect1Line2.y * mmPx, fonts.avant, baseLayout.rect1Line2.size, baseLayout.rect1Line2.spacing, 0, logoTextColor, 'center', null, dpiVal, ctx);

    // 繪製主要文字 (深色)
    const mainTextColor = '#1A1A1A';
    drawText([$('text2')?.value || ''], baseLayout.text2.x * mmPx, baseLayout.text2.y * mmPx, fonts.kozgo, baseLayout.text2.size, baseLayout.text2.spacing, 0, mainTextColor, 'left', fonts.ar, dpiVal, ctx);
    drawText([$('text3Line1')?.value || ''], baseLayout.text3Line1.x * mmPx, baseLayout.text3Line1.y * mmPx, fonts.kozgo, baseLayout.text3Line1.size, baseLayout.text3Line1.spacing, 0, mainTextColor, 'left', fonts.ar, dpiVal, ctx);
    drawText([$('text3Line2')?.value || ''], baseLayout.text3Line2.x * mmPx, baseLayout.text3Line2.y * mmPx, fonts.kozgo, baseLayout.text3Line2.size, baseLayout.text3Line2.spacing, 0, mainTextColor, 'left', fonts.ar, dpiVal, ctx);
    
    drawText([$('text4Line1')?.value || ''], baseLayout.text4Line1.x * mmPx, baseLayout.text4Line1.y * mmPx, fonts.kozgo, baseLayout.text4Line1.size, baseLayout.text4Line1.spacing, 0, mainTextColor, 'left', fonts.ar, dpiVal, ctx);
    drawText([$('text4Line2')?.value || ''], baseLayout.text4Line2.x * mmPx, baseLayout.text4Line2.y * mmPx, fonts.kozgo, baseLayout.text4Line2.size, baseLayout.text4Line2.spacing, 0, mainTextColor, 'left', fonts.ar, dpiVal, ctx);
    drawText([$('text5')?.value || ''], baseLayout.text5.x * mmPx, baseLayout.text5.y * mmPx, fonts.kozgo, baseLayout.text5.size, baseLayout.text5.spacing, 0, mainTextColor, 'left', fonts.ar, dpiVal, ctx);
    drawText([$('text6')?.value || ''], baseLayout.text6.x * mmPx, baseLayout.text6.y * mmPx, fonts.kozgo, baseLayout.text6.size, baseLayout.text6.spacing, 0, mainTextColor, 'left', fonts.ar, dpiVal, ctx);

    // 繪製 Footer 文字 (使用 Logo 相同嘅對比色)
    drawText(["<主催 ‧ お問い合せ>"], 54 * mmPx, baseLayout.footerLines.y * mmPx, fonts.kozgo, 7, 236, 0, logoTextColor, 'left', fonts.ar, dpiVal, ctx);
    drawText([$('text11')?.value || ''], 80.5 * mmPx, baseLayout.footerLines.y * mmPx, fonts.kozgo, 10, 238, 0, logoTextColor, 'left', fonts.ar, dpiVal, ctx);
    drawText(["TEL:01-2345-6789"], 108 * mmPx, 64 * mmPx, fonts.kozgo, 12.5, 236, 0, logoTextColor, 'left', fonts.ar, dpiVal, ctx);

    // 繪製 QR 碼
    const qrUrl = $('qrCodeUrl')?.value;
    if (qrUrl && qrImage) {
        const qs = 23 * mmPx;
        const qx = w - (8.5 * mmPx) - qs;
        const qy = 23 * mmPx;
        ctx.fillStyle = colorA;
        ctx.fillRect(qx, qy, qs, qs);
        ctx.drawImage(qrImage, qx, qy, qs, qs);
    }
};

const debouncedDrawTicket = debounce((dpiVal) => drawTicket(dpiVal), 150);

// ==========================================
// 4. UI 邏輯與成員數據
// ==========================================
async function loadMembers() {
    try {
        const response = await fetch('members.json');
        members = await response.json();
        
        const selector = $('memberSelector');
        const groups = {};
        members.forEach(m => {
            const gen = m.generation || '其他成員';
            if(!groups[gen]) groups[gen] = [];
            groups[gen].push(m);
        });

        for (const [gen, mems] of Object.entries(groups)) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = gen;
            mems.forEach(m => {
                const option = document.createElement('option');
                option.value = m.name_ja;
                option.textContent = `${m.name_ja} (${m.name_en})`;
                optgroup.appendChild(option);
            });
            selector.appendChild(optgroup);
        }
    } catch (error) {
        console.error('Failed to load members:', error);
    }
}

// 應用成員專屬配色 (雙色應用)
$('memberSelector')?.addEventListener('change', (e) => {
    const member = members.find(m => m.name_ja === e.target.value);
    if (member) {
        $('memberHeader').style.display = 'flex';
        $('memberAvatar').src = member.image;
        $('memberName').textContent = member.name_ja;
        
        // 雙色邏輯應用
        $('rect1Color').value = member.color_a; // 方塊色
        $('bgColor').value = member.color_b === '#ffffff' ? '#F5F5F5' : member.color_b; // 背景色避免純白太刺眼
        
        debouncedDrawTicket(70);
    } else {
        $('memberHeader').style.display = 'none';
    }
});

// QR 碼生成
$('qrCodeUrl')?.addEventListener('input', debounce(() => {
    const url = $('qrCodeUrl').value;
    const qrContainer = $('qrPreview');
    qrContainer.innerHTML = '';
    if (!url) { qrImage = null; debouncedDrawTicket(70); return; }
    
    new QRCode(qrContainer, { text: url, width: 128, height: 128 });
    setTimeout(() => {
        const qrElement = qrContainer.querySelector('img') || qrContainer.querySelector('canvas');
        if (qrElement) {
            qrImage = new Image();
            qrImage.onload = () => debouncedDrawTicket(70);
            qrImage.src = qrElement.tagName === 'IMG' ? qrElement.src : qrElement.toDataURL('image/png');
        }
    }, 300);
}, 500));

// 導航列切換
function initSidebarNav() {
    const navIcons = document.querySelectorAll('.nav-icon:not(.special-link)');
    const sections = document.querySelectorAll('.drawer-section');
    sections.forEach((sec, i) => sec.style.display = i === 0 ? 'block' : 'none');

    navIcons.forEach((icon, index) => {
        icon.addEventListener('click', () => {
            navIcons.forEach(i => i.classList.remove('active'));
            icon.classList.add('active');
            sections.forEach(sec => { sec.style.opacity = '0'; setTimeout(() => sec.style.display = 'none', 150); });
            setTimeout(() => {
                if(sections[index]) { sections[index].style.display = 'block'; setTimeout(() => sections[index].style.opacity = '1', 50); }
            }, 150);
        });
    });
}

// 歸一化 Slider 綁定
document.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener('input', (e) => {
        const valSpan = $(e.target.id.replace('_slider', '_val'));
        if(valSpan) {
            const val = parseFloat(e.target.value);
            valSpan.textContent = val > 0 ? `+${val}` : val;
            valSpan.style.color = val === 0 ? 'var(--text-muted)' : 'var(--primary)';
        }
        debouncedDrawTicket(70);
    });
});

// 即時更新綁定
document.querySelectorAll('input[type="text"], input[type="color"]').forEach(el => {
    el.addEventListener('input', () => debouncedDrawTicket(70));
});

$('languageSelector')?.addEventListener('change', (e) => changeLanguage(e.target.value));
$('themeToggleBtn')?.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
});

window.onload = async () => {
    await loadLanguages();
    await loadMembers();
    initSidebarNav();
    drawTicket(70);
};
