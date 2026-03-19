function $(id) { return document.getElementById(id); }

const canvas = $('ticketCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const fonts = {
    avant: 'ITC Avant Garde Gothic Std Extra Light',
    kozgo: 'KozGoPr6N',
    ar: 'AR ADGothicJP'
};

const dpi = {
    300: { base: { w: Math.round(150 * 300 / 25.4), h: Math.round(65 * 300 / 25.4) }, bleed: { w: Math.round((150 + 6) * 300 / 25.4), h: Math.round((65 + 6) * 300 / 25.4) } },
    70: { base: { w: Math.round(150 * 70 / 25.4), h: Math.round(65 * 70 / 25.4) }, bleed: { w: Math.round((150 + 6) * 70 / 25.4), h: Math.round((65 + 6) * 70 / 25.4) } }
};

let langs = {}, currentLang = 'ja';
// 10. 桌面版預設比例放大
let previewScale = window.innerWidth > 800 ? 1.5 : 1.0; 
let members = [], qrImage = null;

// 防抖
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => func(...args), delay); };
};

// ==========================================
// 14. 語言系統與自動偵測
// ==========================================
async function loadLanguages() {
    try {
        const response = await fetch('langs.json');
        langs = await response.json();
        
        // 自動偵測系統語言
        let sysLang = navigator.language || navigator.userLanguage;
        if(sysLang.includes('zh-TW') || sysLang.includes('zh-HK')) currentLang = 'zh-TW';
        else if(sysLang.includes('zh')) currentLang = 'zh-CN';
        else if(sysLang.includes('ja')) currentLang = 'ja';
        else currentLang = 'en'; // 預設英文
        
        $('languageSelector').value = currentLang;
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
            if (el.classList.contains('tooltip')) {
                el.textContent = langs[lang][key];
            } else if (el.tagName === 'SPAN' || el.tagName === 'DIV') {
                const icon = el.querySelector('i');
                if (icon) {
                    el.innerHTML = ''; el.appendChild(icon); el.appendChild(document.createTextNode(' ' + langs[lang][key]));
                } else {
                    el.textContent = langs[lang][key];
                }
            } else if (el.tagName === 'LABEL') {
                 // 處理帶有 input 的 label
                 const textNodes = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
                 if(textNodes.length > 0) textNodes[0].textContent = langs[lang][key] + ' ';
            } else {
                el.textContent = langs[lang][key];
            }
        }
    });
    debouncedDrawTicket(70);
};

// ==========================================
// 9. 極端顏色的可讀性增強 (Smart Contrast)
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
const drawText = (lines, x, y, font, size, spacing, color, context, dpiVal, altFont, enableGlow = false) => {
    if (!context) return;
    const ptPx = dpiVal / 72;
    context.fillStyle = color;
    context.textAlign = 'left';
    
    // 9. 如果背景色太亮或太暗，為前景字加入輕微描邊/發光，確保可讀性
    if (enableGlow) {
        const bgLum = getLuminance($('bgColor').value);
        context.shadowColor = bgLum > 0.6 ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.5)';
        context.shadowBlur = 3;
        context.shadowOffsetX = 1;
        context.shadowOffsetY = 1;
    } else {
        context.shadowColor = 'transparent';
    }

    lines.forEach((l, i) => {
        let cx = x;
        if (!l) return;
        l.split('').forEach(c => {
            const isAlt = altFont && /[A-Za-z0-9①❘－]/.test(c);
            context.font = `${size * ptPx}px ${isAlt ? altFont : font}`;
            context.fillText(c, cx, y);
            cx += context.measureText(c).width + (spacing * ptPx / 1000);
        });
    });
    context.shadowColor = 'transparent'; // Reset
};

const drawTicket = async (dpiVal, targetCtx = ctx) => {
    if (!targetCtx) return;
    const bleed = $('bleedOption')?.checked || false;
    const w = bleed ? dpi[dpiVal].bleed.w : dpi[dpiVal].base.w;
    const h = bleed ? dpi[dpiVal].bleed.h : dpi[dpiVal].base.h;
    const mmPx = dpiVal / 25.4;
    const bleedOffset = bleed ? 3 * mmPx : 0;

    if (targetCtx === ctx) {
        canvas.width = w; canvas.height = h;
        // 確保手機版不超出版面
        let actualScale = window.innerWidth < 800 ? Math.min(1, (window.innerWidth - 40) / w) : previewScale;
        canvas.style.width = `${w * actualScale}px`; 
        canvas.style.height = `${h * actualScale}px`;
    }
    
    targetCtx.clearRect(0, 0, w, h);

    // 1. 預設顏色回歸 (Gradient)
    const colorA = $('rect1Color')?.value || '#2086D1'; 
    const colorB = $('bgColor')?.value || '#E5EDF9'; // 原始淺藍預設
    
    const gradient = targetCtx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, colorB);
    gradient.addColorStop(1, colorB); // 保留漸變結構，方便日後擴展
    targetCtx.fillStyle = gradient;
    targetCtx.fillRect(0, 0, w, h);

    // 7 & 8. 恢復背景文字排列與淺藍陰影 Logic
    const bgText = "YSS48";
    targetCtx.font = `${62 * (dpiVal / 72)}px ${fonts.avant}`;
    
    const cw = targetCtx.measureText("Y").width;
    const tw = targetCtx.measureText(bgText).width;
    const gx = tw + (-6000 * (dpiVal/72) / 1000); // 原始字距
    const gy = 46 * (dpiVal / 72);
    
    // 背景陰影層
    targetCtx.globalAlpha = 0.2;
    targetCtx.fillStyle = '#5F96ED'; // 原始淺藍
    targetCtx.shadowColor = '#5F96ED';
    targetCtx.shadowOffsetX = 0.5 * mmPx;
    targetCtx.shadowOffsetY = -0.4 * mmPx;
    
    let startX = -100 * mmPx + bleedOffset;
    let startY = 0 + bleedOffset;
    for (let y = startY, r = 0; y < h; y += gy, r++) {
        for (let x = startX + (r * cw); x < w; x += gx) {
            targetCtx.fillText(bgText, x, y);
        }
    }
    
    // 背景文字白字層 (Default)
    targetCtx.globalAlpha = 1;
    targetCtx.shadowOffsetX = 0; targetCtx.shadowOffsetY = 0;
    targetCtx.fillStyle = '#FFFFFF';
    for (let y = startY, r = 0; y < h; y += gy, r++) {
        for (let x = startX + (r * cw); x < w; x += gx) {
            targetCtx.fillText(bgText, x, y);
        }
    }

    // 方塊繪製 (Color A)
    targetCtx.fillStyle = colorA;
    targetCtx.fillRect(8 * mmPx + bleedOffset, 0 + bleedOffset, 25 * mmPx, 35 * mmPx); 
    targetCtx.fillRect(0 + bleedOffset, 60 * mmPx + bleedOffset, 150 * mmPx, 5 * mmPx); 
    
    // Logo 顏色對比
    const boxLum = getLuminance(colorA);
    const logoTextColor = boxLum > 0.6 ? '#1A1A1A' : '#FFFFFF';

    // 繪製 Logo (置中需特判)
    targetCtx.fillStyle = logoTextColor;
    targetCtx.textAlign = 'center';
    
    let l1X = parseFloat($('rect1Line1X').value) * mmPx + bleedOffset;
    let l1Y = parseFloat($('rect1Line1Y').value) * mmPx + bleedOffset;
    let l1Size = parseFloat($('rect1Size').value);
    targetCtx.font = `${l1Size * (dpiVal / 72)}px ${fonts.avant}`;
    targetCtx.fillText($('rect1Line1').value, l1X, l1Y);

    let l2X = parseFloat($('rect1Line2X').value) * mmPx + bleedOffset;
    let l2Y = parseFloat($('rect1Line2Y').value) * mmPx + bleedOffset;
    let l2Size = parseFloat($('rect1Line2Size').value);
    targetCtx.font = `${l2Size * (dpiVal / 72)}px ${fonts.avant}`;
    targetCtx.fillText($('rect1Line2').value, l2X, l2Y);

    // 主要文字 (深色, 啟用可讀性增強)
    const mainTextColor = '#000000';
    drawText([$('text2').value], parseFloat($('text2X')?.value || 37) * mmPx + bleedOffset, parseFloat($('text2Y')?.value || 12) * mmPx + bleedOffset, fonts.kozgo, 14.2, 2000, mainTextColor, targetCtx, dpiVal, fonts.ar, true);
    drawText([$('text3Line1').value], 35 * mmPx + bleedOffset, 19 * mmPx + bleedOffset, fonts.kozgo, 14.2, 2000, mainTextColor, targetCtx, dpiVal, fonts.ar, true);
    drawText([$('text3Line2').value], 35 * mmPx + bleedOffset, 25 * mmPx + bleedOffset, fonts.kozgo, 14.2, 2000, mainTextColor, targetCtx, dpiVal, fonts.ar, true);
    drawText([$('text4Line1').value], 13 * mmPx + bleedOffset, 43 * mmPx + bleedOffset, fonts.kozgo, 11, 1000, mainTextColor, targetCtx, dpiVal, fonts.ar, true);
    drawText([$('text4Line2').value], 13 * mmPx + bleedOffset, 48 * mmPx + bleedOffset, fonts.kozgo, 11, 1000, mainTextColor, targetCtx, dpiVal, fonts.ar, true);
    drawText([$('text5').value], 13 * mmPx + bleedOffset, 55 * mmPx + bleedOffset, fonts.kozgo, 16, 200, mainTextColor, targetCtx, dpiVal, fonts.ar, true);
    drawText([$('text6').value], 36 * mmPx + bleedOffset, 55 * mmPx + bleedOffset, fonts.kozgo, 13, 311, mainTextColor, targetCtx, dpiVal, fonts.ar, true);

    // Footer 文字
    drawText(["<主催 ‧ お問い合せ>"], 54 * mmPx + bleedOffset, 63.5 * mmPx + bleedOffset, fonts.kozgo, 7, 236, logoTextColor, targetCtx, dpiVal, fonts.ar, false);
    drawText([$('text11').value], 80.5 * mmPx + bleedOffset, 63.5 * mmPx + bleedOffset, fonts.kozgo, 10, 238, logoTextColor, targetCtx, dpiVal, fonts.ar, false);
    drawText(["TEL:01-2345-6789"], 108 * mmPx + bleedOffset, 64 * mmPx + bleedOffset, fonts.kozgo, 12.5, 236, logoTextColor, targetCtx, dpiVal, fonts.ar, false);

    // 16. QR 碼預設方塊邏輯
    if ($('showQR').checked) {
        const qs = 23 * mmPx;
        const qx = w - (8.5 * mmPx) - qs - (bleed ? 3*mmPx : 0);
        const qy = 23 * mmPx + bleedOffset;
        targetCtx.fillStyle = colorA;
        targetCtx.fillRect(qx, qy, qs, qs); // Default Colored Box
        
        if ($('qrCodeUrl').value && qrImage) {
            targetCtx.drawImage(qrImage, qx, qy, qs, qs);
        }
    }
};

const debouncedDrawTicket = debounce((dpiVal) => drawTicket(dpiVal), 150);

// ==========================================
// 2. 字體載入等待
// ==========================================
async function waitForFonts() {
    const fontPromises = [
        document.fonts.load(`400 47px "${fonts.avant}"`),
        document.fonts.load(`400 14.2px "${fonts.kozgo}"`),
        document.fonts.load(`400 14.2px "${fonts.ar}"`)
    ];
    try {
        await Promise.all(fontPromises);
        console.log("Fonts loaded.");
    } catch (err) {
        console.error('Font loading failed:', err);
    }
}

// ==========================================
// 4. 成員數據載入與 UI
// ==========================================
async function loadMembers() {
    try {
        const response = await fetch('members.json');
        members = await response.json();
        const selector = $('memberSelector');
        const groups = {};
        
        members.forEach(m => {
            const gen = m.generation || '其他';
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

$('memberSelector')?.addEventListener('change', (e) => {
    const member = members.find(m => m.name_ja === e.target.value);
    if (member) {
        $('memberHeader').style.display = 'flex';
        $('memberAvatar').src = member.image;
        $('memberName').textContent = member.name_ja;
        
        // 19. 光暈效果
        $('memberAvatar').style.boxShadow = `0 0 15px ${member.color_a}`;
        
        $('rect1Color').value = member.color_a; 
        $('bgColor').value = member.color_b === '#ffffff' ? '#FDF9FA' : member.color_b; 
        debouncedDrawTicket(70);
    } else {
        $('memberHeader').style.display = 'none';
    }
});

// ==========================================
// 19. 漣漪特效與 12. 分區 Hover 反饋
// ==========================================
document.addEventListener('mousedown', function(e) {
    if(e.target.tagName === 'CANVAS' || e.target.closest('.hover-zone')) {
        let ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = e.clientX - 20 + 'px';
        ripple.style.top = e.clientY - 20 + 'px';
        ripple.style.width = '40px'; ripple.style.height = '40px';
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }
});

// 畫布上方隱形區塊點擊切換抽屜
document.querySelectorAll('.hover-zone').forEach(zone => {
    zone.addEventListener('click', () => {
        const targetId = zone.id.replace('zone-', 'sec-');
        const icon = document.querySelector(`.nav-icon[data-target="${targetId}"]`);
        if(icon) icon.click();
    });
});

// ==========================================
// 15. 抽屜導航與 11. 進階設定
// ==========================================
function initSidebarNav() {
    const navIcons = document.querySelectorAll('.nav-icon:not(.special-link)');
    const sections = document.querySelectorAll('.drawer-section');

    navIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            navIcons.forEach(i => i.classList.remove('active'));
            icon.classList.add('active');
            
            sections.forEach(sec => sec.style.display = 'none');
            const targetSec = $(icon.getAttribute('data-target'));
            if(targetSec) {
                targetSec.style.display = 'block';
            }
        });
    });
}

$('advToggleBtn')?.addEventListener('click', () => {
    const advAreas = document.querySelectorAll('.advanced-options');
    let isActive = false;
    advAreas.forEach(el => {
        el.classList.toggle('active');
        if(el.classList.contains('active')) isActive = true;
    });
    $('advToggleBtn').querySelector('span').textContent = isActive ? langs[currentLang].simple_mode : langs[currentLang].advanced_mode;
});


// QR
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

$('showQR').addEventListener('change', () => debouncedDrawTicket(70));

// Inputs binding
document.querySelectorAll('input[type="text"], input[type="number"], input[type="color"]').forEach(el => {
    el.addEventListener('input', () => debouncedDrawTicket(70));
});

$('languageSelector')?.addEventListener('change', (e) => changeLanguage(e.target.value));
$('themeToggleBtn')?.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
});

// ==========================================
// 17 & 18. 下載與出血位
// ==========================================
$('downloadBtn')?.addEventListener('click', () => {
    $('downloadModal').style.display = 'flex';
});

$('dl300')?.addEventListener('click', async () => {
    $('downloadModal').style.display = 'none';
    const tempCanvas = document.createElement('canvas');
    await drawTicket(300, tempCanvas.getContext('2d'));
    triggerDownload(tempCanvas, '300dpi');
});

$('dl70')?.addEventListener('click', async () => {
    $('downloadModal').style.display = 'none';
    const tempCanvas = document.createElement('canvas');
    await drawTicket(70, tempCanvas.getContext('2d'));
    triggerDownload(tempCanvas, '70dpi');
});

$('bleedOption')?.addEventListener('change', () => {
    debouncedDrawTicket(70);
});

function triggerDownload(canvasObj, dpiStr) {
    const link = document.createElement('a');
    link.download = `Ticket_${dpiStr}_${Date.now()}.png`;
    link.href = canvasObj.toDataURL('image/png');
    link.click();
}

window.addEventListener('resize', () => debouncedDrawTicket(70));

window.onload = async () => {
    await waitForFonts(); // 2. 強制等待字體
    await loadLanguages(); // 14. 載入語言並自動偵測
    await loadMembers();
    initSidebarNav();
    drawTicket(70); // 初次渲染
};
