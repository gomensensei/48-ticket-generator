function $(id) { return document.getElementById(id); }

const canvas = $('ticketCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const fonts = { avant: 'ITC Avant Garde Gothic Std Extra Light', kozgo: 'KozGoPr6N', ar: 'AR ADGothicJP' };
const dpi = {
    300: { base: { w: Math.round(150 * 300 / 25.4), h: Math.round(65 * 300 / 25.4) }, bleed: { w: Math.round((150 + 6) * 300 / 25.4), h: Math.round((65 + 6) * 300 / 25.4) } },
    140: { base: { w: Math.round(150 * 140 / 25.4), h: Math.round(65 * 140 / 25.4) }, bleed: { w: Math.round((150 + 6) * 140 / 25.4), h: Math.round((65 + 6) * 140 / 25.4) } },
    70: { base: { w: Math.round(150 * 70 / 25.4), h: Math.round(65 * 70 / 25.4) }, bleed: { w: Math.round((150 + 6) * 70 / 25.4), h: Math.round((65 + 6) * 70 / 25.4) } }
};
const SUPABASE_URL = 'https://jappifgnjssqxvjodgiv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_oXfJyHkRtn1BHBw-9ictBQ__01qBCZg';
const CLOUD_TABLE = 'ticket_saves';
const CLOUD_SLOT_NUMS = [1, 2, 3];

const PREVIEW_DPI = 140; 
const CSS_BASE_DPI = 70;

let langs = {}, currentLang = 'ja';
let previewScale = window.innerWidth > 800 ? 1.5 : 1.0; 
let members = [], qrImage = null;
let cloud = { client: null, user: null, records: [], busy: false, ready: false, dirty: false, statusKey: '' };
let suppressCloudDirty = false;

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => func(...args), delay); };
};

function t(key, replacements = {}) {
    const dictionary = langs[currentLang] || langs.en || {};
    const fallback = langs.en || {};
    const template = dictionary[key] || fallback[key] || key;
    return Object.entries(replacements).reduce((value, [name, replacement]) => {
        return value.split(`{${name}}`).join(String(replacement));
    }, template);
}

function getCloudActionErrorMessage(error) {
    const message = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ');
    if (/tool48_ticket_cloud_slot_limit_reached|ticket_saves slot|slot_num|cloud slot/i.test(message)) {
        return t('cloudSlotFull');
    }
    return error?.message || t('cloudActionFailed');
}

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
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (langs[lang][key]) {
            if (['SPAN', 'DIV', 'H3', 'BUTTON', 'OPTION'].includes(el.tagName)) {
                const icon = el.querySelector('i') || el.querySelector('svg');
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

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (langs[lang][key]) el.placeholder = langs[lang][key];
    });

    updateCloudUI();
    debouncedDrawTicket();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

function getMutedDarkColor(hex) {
    if(!hex || hex.length < 7) return '#888888';
    let r = parseInt(hex.substring(1,3), 16), g = parseInt(hex.substring(3,5), 16), b = parseInt(hex.substring(5,7), 16);
    r = Math.floor(r * 0.5 + 102 * 0.5); g = Math.floor(g * 0.5 + 102 * 0.5); b = Math.floor(b * 0.5 + 102 * 0.5);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function getLighterMutedColor(hex) {
    if(!hex || hex.length < 7) return '#5F96ED';
    let r = parseInt(hex.substring(1,3), 16), g = parseInt(hex.substring(3,5), 16), b = parseInt(hex.substring(5,7), 16);
    r = Math.floor(r * 0.25 + 255 * 0.75); g = Math.floor(g * 0.25 + 255 * 0.75); b = Math.floor(b * 0.25 + 255 * 0.75);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function getLuminance(hex) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16) / 255, g = parseInt(hex.substring(2, 4), 16) / 255, b = parseInt(hex.substring(4, 6), 16) / 255;
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

const drawTicket = async (exportDpi = null, exportFormat = 'png') => {
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
        const cssW = bleed ? dpi[CSS_BASE_DPI].bleed.w : dpi[CSS_BASE_DPI].base.w;
        if (window.innerWidth < 800) {
            canvas.style.width = '100%'; canvas.style.height = 'auto';
        } else {
            canvas.style.width = `${cssW * previewScale}px`; canvas.style.height = 'auto';
        }
    }
    
    targetCtx.clearRect(0, 0, w, h);
    const colorA = $('rect1Color')?.value || '#2086D1', colorB = $('bgColor')?.value || '#E5EDF9'; 
    targetCtx.fillStyle = colorB;
    targetCtx.fillRect(0, 0, w, h);

    const bgTextStr = $('bgText')?.value || 'AKB48';
    const bgTextX = parseFloat($('bgTextX')?.value || -100) * mmPx + bleedOffset;
    const bgTextY = parseFloat($('bgTextY')?.value || 0) * mmPx + bleedOffset;
    const bgTextSpacing = parseFloat($('bgTextSpacing')?.value || -6000), bgTextSize = parseFloat($('bgTextSize')?.value || 62), bgTextLineHeight = parseFloat($('bgTextLineHeight')?.value || 46);
    
    targetCtx.font = `${bgTextSize * (renderDpi / 72)}px ${fonts.avant}`;
    const cw = targetCtx.measureText(bgTextStr.charAt(0)).width, tw = targetCtx.measureText(bgTextStr).width;
    const gx = tw + bgTextSpacing * (renderDpi/72) / 1000, gy = bgTextLineHeight * (renderDpi / 72);
    
    targetCtx.globalAlpha = parseFloat($('bgShadowOpacity')?.value || 0.25);
    targetCtx.fillStyle = $('bgShadowColor')?.value || '#5F96ED';
    targetCtx.shadowColor = $('bgShadowColor')?.value || '#5F96ED';
    targetCtx.shadowOffsetX = parseFloat($('bgShadowX')?.value || 0.5) * mmPx;
    targetCtx.shadowOffsetY = parseFloat($('bgShadowY')?.value || -0.4) * mmPx;
    
    for (let y = bgTextY, r = 0; y < h; y += gy, r++) {
        for (let x = bgTextX + (r * cw); x < w; x += gx) { targetCtx.fillText(bgTextStr, x, y); }
    }
    
    targetCtx.globalAlpha = parseFloat($('bgTextOpacity')?.value || 1);
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
    drawText([$('rect1Line1')?.value], parseFloat($('rect1Line1X')?.value || 13.6) * mmPx + bleedOffset, parseFloat($('rect1Line1Y')?.value || 12.5) * mmPx + bleedOffset, fonts.avant, parseFloat($('rect1Size')?.value || 47), parseFloat($('rect1Spacing')?.value || -7000), 0, logoTextColor, 'center', null, renderDpi, targetCtx, false);
    drawText([$('rect1Line2')?.value], parseFloat($('rect1Line2X')?.value || 13.5) * mmPx + bleedOffset, parseFloat($('rect1Line2Y')?.value || 24.5) * mmPx + bleedOffset, fonts.avant, parseFloat($('rect1Line2Size')?.value || 47), parseFloat($('rect1Line2Spacing')?.value || -5000), 0, logoTextColor, 'center', null, renderDpi, targetCtx, false);

    const mainTextColor = $('textColor')?.value || '#000000';
    drawText([$('text2')?.value], parseFloat($('text2X')?.value || 37) * mmPx + bleedOffset, parseFloat($('text2Y')?.value || 12) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text2Size')?.value || 14.2), parseFloat($('text2Spacing')?.value || 2000), 0, mainTextColor, 'left', fonts.ar, renderDpi, targetCtx, true);
    drawText([$('text3Line1')?.value], parseFloat($('text3Line1X')?.value || 35) * mmPx + bleedOffset, parseFloat($('text3Line1Y')?.value || 19) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text3Size')?.value || 14.2), parseFloat($('text3Spacing')?.value || 2000), 0, mainTextColor, 'left', fonts.ar, renderDpi, targetCtx, true);
    drawText([$('text3Line2')?.value], parseFloat($('text3Line2X')?.value || 35) * mmPx + bleedOffset, parseFloat($('text3Line2Y')?.value || 25) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text3Line2Size')?.value || 14.2), parseFloat($('text3Line2Spacing')?.value || 2000), 0, mainTextColor, 'left', fonts.ar, renderDpi, targetCtx, true);
    drawText([$('text4Line1')?.value], parseFloat($('text4Line1X')?.value || 13) * mmPx + bleedOffset, parseFloat($('text4Line1Y')?.value || 43) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text4Size')?.value || 11), parseFloat($('text4Spacing')?.value || 1000), parseFloat($('text4LineHeight')?.value||14), mainTextColor, 'left', fonts.ar, renderDpi, targetCtx, true);
    drawText([$('text4Line2')?.value], 13 * mmPx + bleedOffset, 48 * mmPx + bleedOffset, fonts.kozgo, 11, 1000, 0, mainTextColor, 'left', fonts.ar, renderDpi, targetCtx, true); 
    drawText([$('text5')?.value], parseFloat($('text5X')?.value || 13) * mmPx + bleedOffset, parseFloat($('text5Y')?.value || 55) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text5Size')?.value || 16), parseFloat($('text5Spacing')?.value || 200), 0, mainTextColor, 'left', fonts.ar, renderDpi, targetCtx, true);
    drawText([$('text6')?.value], parseFloat($('text6X')?.value || 36) * mmPx + bleedOffset, parseFloat($('text6Y')?.value || 55) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text6Size')?.value || 13), parseFloat($('text6Spacing')?.value || 311), 0, mainTextColor, 'left', fonts.ar, renderDpi, targetCtx, true);

    const footerTextColor = $('footerTextColor')?.value || '#FFFFFF';
    drawText([$('text10')?.value], parseFloat($('text10X')?.value || 54) * mmPx + bleedOffset, parseFloat($('text10Y')?.value || 63.5) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text10Size')?.value || 7), parseFloat($('text10Spacing')?.value || 236), 0, footerTextColor, 'left', fonts.ar, renderDpi, targetCtx, false);
    drawText([$('text11')?.value], parseFloat($('text11X')?.value || 80.5) * mmPx + bleedOffset, parseFloat($('text11Y')?.value || 63.5) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text11Size')?.value || 10), parseFloat($('text11Spacing')?.value || 238), 0, footerTextColor, 'left', fonts.ar, renderDpi, targetCtx, false);
    drawText([$('text12')?.value], parseFloat($('text12X')?.value || 108) * mmPx + bleedOffset, parseFloat($('text12Y')?.value || 64) * mmPx + bleedOffset, fonts.kozgo, parseFloat($('text12Size')?.value || 12.5), parseFloat($('text12Spacing')?.value || 236), 0, footerTextColor, 'left', fonts.ar, renderDpi, targetCtx, false);

    if ($('showQR').checked) {
        const qs = 23 * mmPx, qx = w - (8.5 * mmPx) - qs - (bleed ? 3*mmPx : 0), qy = 23 * mmPx + bleedOffset;
        targetCtx.fillStyle = colorA;
        targetCtx.fillRect(qx, qy, qs, qs);
        if ($('qrCodeUrl').value && qrImage) { targetCtx.drawImage(qrImage, qx, qy, qs, qs); }
    }

    if (!isPreview) {
        if (exportFormat === 'pdf') {
            triggerPDFDownload(targetCtx.canvas, bleed);
        } else {
            triggerDownload(targetCtx.canvas, `${exportDpi}dpi`);
        }
    }
};

const debouncedDrawTicket = debounce(() => drawTicket(), 150);

async function waitForFonts() {
    const fontPromises = [document.fonts.load(`400 47px "${fonts.avant}"`), document.fonts.load(`400 14.2px "${fonts.kozgo}"`), document.fonts.load(`400 14.2px "${fonts.ar}"`)];
    try { await Promise.all(fontPromises); } catch (err) { console.error(err); }
}

async function loadMembers() {
    try {
        const response = await fetch('members.json');
        members = await response.json();
        const selector = $('memberSelector'), groups = {};
        members.filter(isSelectableMember).forEach(m => { const gen = m.generation || '其他'; if(!groups[gen]) groups[gen] = []; groups[gen].push(m); });
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

function isSelectableMember(member) {
    return Boolean(member) && member.active !== false && member.selectable !== false && member.hiddenFromSelection !== true;
}

function isTicketStateControl(el) {
    if (!el || !el.id || el.type === 'file') return false;
    if (el.closest('.account-popover') || el.closest('.cloud-save-section')) return false;
    if (el.id.startsWith('cloud') || el.id.startsWith('account')) return false;
    return true;
}

function getTicketConfig() {
    const config = {};
    document.querySelectorAll('input, select').forEach(el => {
        if (isTicketStateControl(el)) {
            config[el.id] = el.type === 'checkbox' ? el.checked : el.value;
        }
    });
    return config;
}

function applyTicketConfig(config, options = {}) {
    if (!config || typeof config !== 'object') return;
    suppressCloudDirty = Boolean(options.keepClean);
    try {
        Object.keys(config).forEach(id => {
            const el = $(id);
            if (el && isTicketStateControl(el)) {
                if (el.type === 'checkbox') el.checked = Boolean(config[id]);
                else el.value = config[id];
                const syncInput = document.querySelector(`.sync-slider[data-target="${id}"]`);
                if (syncInput) syncInput.value = config[id];
            }
        });
        if (config.memberSelector && $('memberSelector')) {
            $('memberSelector').dispatchEvent(new Event('change'));
        }
        refreshQRCode();
        debouncedDrawTicket();
    } finally {
        suppressCloudDirty = false;
    }
    if (!options.keepClean) markCloudDirty();
}

function exportTicketConfig() {
    const config = getTicketConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TicketConfig_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importTicketConfigFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
        try {
            const config = JSON.parse(re.target.result);
            applyTicketConfig(config);
        } catch (err) { console.error("Import failed:", err); }
    };
    reader.readAsText(file);
}

$('exportConfigBtn')?.addEventListener('click', exportTicketConfig);
$('exportConfigBtnPanel')?.addEventListener('click', exportTicketConfig);

$('importConfigBtn')?.addEventListener('click', () => $('configFileInput').click());
$('importConfigBtnPanel')?.addEventListener('click', () => $('configFileInput').click());

$('configFileInput')?.addEventListener('change', (e) => {
    importTicketConfigFile(e.target.files[0]);
    e.target.value = '';
});

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function buildTicketPayload(slotNum) {
    return {
        type: 'ticket-generator',
        version: 1,
        slot_num: slotNum,
        saved_at: new Date().toISOString(),
        ticket_config: getTicketConfig()
    };
}

function extractTicketConfig(payload) {
    if (!payload || typeof payload !== 'object') return {};
    return payload.ticket_config || payload.config || payload;
}

function buildCloudTitle(slotNum) {
    const eventName = $('text2')?.value.trim() || '';
    const eventDate = $('text4Line1')?.value.trim() || '';
    const title = [eventName, eventDate].filter(Boolean).join(' / ');
    return (title || t('cloudSlotDefaultTitle', { slot: slotNum })).slice(0, 120);
}

function findCloudSlot(slotNum) {
    return cloud.records.find(record => Number(record.slot_num) === Number(slotNum));
}

function formatCloudTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    try {
        return new Intl.DateTimeFormat(currentLang, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    } catch (_error) {
        return date.toLocaleString();
    }
}

function getCloudDisplayName() {
    return cloud.user?.user_metadata?.display_name || cloud.user?.email || t('cloudAccount');
}

function setAccountToggleLabel(label) {
    const toggle = $('accountToggleBtn');
    if (!toggle) return;
    const icon = toggle.querySelector('svg, i');
    toggle.textContent = '';
    if (icon) toggle.appendChild(icon);
    const text = document.createElement('span');
    text.textContent = label;
    toggle.appendChild(text);
}

function getCloudStatusText(statusKey) {
    if (statusKey) return t(statusKey, { count: cloud.records.length });
    if (!cloud.ready) return t('cloudUnavailable');
    if (!cloud.user) return t('cloudLocalOnly');
    return cloud.dirty ? t('cloudUnsavedChanges') : t('cloudSaveAvailable');
}

function setCloudMessage(message) {
    if ($('cloudMessage')) $('cloudMessage').textContent = message || '';
    if ($('cloudSlotMessage')) $('cloudSlotMessage').textContent = message || '';
}

function setCloudBusy(isBusy) {
    cloud.busy = isBusy;
    updateCloudUI();
}

function markCloudDirty() {
    if (suppressCloudDirty || !cloud.user || cloud.busy) return;
    cloud.dirty = true;
    cloud.statusKey = 'cloudUnsavedChanges';
    updateCloudUI();
}

function normalizeCloudRecords(records) {
    const bySlot = new Map();
    (Array.isArray(records) ? records : []).forEach(record => {
        const slot = Number(record.slot_num);
        if (!CLOUD_SLOT_NUMS.includes(slot) || bySlot.has(slot)) return;
        bySlot.set(slot, record);
    });
    return CLOUD_SLOT_NUMS.map(slot => bySlot.get(slot)).filter(Boolean);
}

function renderCloudSlots() {
    const list = $('cloudSlotList');
    if (!list) return;
    const loggedIn = Boolean(cloud.user);
    list.innerHTML = '';

    CLOUD_SLOT_NUMS.forEach(slot => {
        const record = findCloudSlot(slot);
        const card = document.createElement('div');
        card.className = `cloud-slot${record ? '' : ' is-empty'}`;

        const title = record?.title || t('cloudEmptySlot');
        const meta = record
            ? t('cloudSlotUpdated', { time: formatCloudTime(record.updated_at || record.created_at) })
            : t('cloudEmptySlotHint');
        const state = record ? t('cloudSlotFilled') : t('cloudSlotEmpty');
        const saveLabel = record ? t('cloudOverwriteSlot') : t('cloudSaveSlot');

        card.innerHTML = `
            <div class="cloud-slot-header">
                <div>
                    <span class="cloud-slot-label">${escapeHtml(t('cloudSlotLabel', { slot }))}</span>
                    <span class="cloud-slot-title">${escapeHtml(title)}</span>
                    <span class="cloud-slot-meta">${escapeHtml(meta)}</span>
                </div>
                <span class="cloud-slot-state">${escapeHtml(state)}</span>
            </div>
            <div class="cloud-slot-actions">
                <button class="btn-mini" type="button" data-cloud-action="save" data-slot="${slot}">${escapeHtml(saveLabel)}</button>
                <button class="btn-mini" type="button" data-cloud-action="load" data-slot="${slot}">${escapeHtml(t('cloudLoadSlot'))}</button>
                <button class="btn-mini delete" type="button" data-cloud-action="delete" data-slot="${slot}">${escapeHtml(t('cloudDeleteSlot'))}</button>
            </div>
        `;

        card.querySelectorAll('button').forEach(button => {
            const needsRecord = button.dataset.cloudAction === 'load' || button.dataset.cloudAction === 'delete';
            button.disabled = cloud.busy || !loggedIn || (needsRecord && !record);
        });

        list.appendChild(card);
    });
}

function updateCloudUI(statusKey) {
    if (statusKey) cloud.statusKey = statusKey;
    const loggedIn = Boolean(cloud.user);
    const statusText = getCloudStatusText(statusKey || cloud.statusKey);

    if ($('cloudSaveSection')) $('cloudSaveSection').classList.toggle('is-local-only', !loggedIn);
    if ($('cloudStatus')) $('cloudStatus').textContent = statusText;
    if ($('cloudSlotStatus')) $('cloudSlotStatus').textContent = statusText;
    if ($('cloudLoginForm')) $('cloudLoginForm').hidden = loggedIn || !cloud.ready;
    if ($('cloudActions')) $('cloudActions').hidden = !loggedIn;
    if ($('cloudUserLabel')) $('cloudUserLabel').textContent = loggedIn ? getCloudDisplayName() : '';
    if ($('cloudQuickSaveBtn')) $('cloudQuickSaveBtn').disabled = cloud.busy || !loggedIn;
    if ($('cloudLogoutBtn')) $('cloudLogoutBtn').disabled = cloud.busy;

    ['cloudNicknameInput', 'cloudEmailInput', 'cloudPasswordInput', 'cloudSignInBtn', 'cloudSignUpBtn'].forEach(id => {
        const node = $(id);
        if (node) node.disabled = cloud.busy || loggedIn || !cloud.ready;
    });

    setAccountToggleLabel(loggedIn ? getCloudDisplayName() : t('accountNavGuest'));
    renderCloudSlots();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function requireCloudLogin(silent) {
    const ok = Boolean(cloud.client && cloud.user && cloud.ready);
    if (!ok && !silent) {
        updateCloudUI('cloudLocalOnly');
        setCloudMessage(t('cloudLoginRequired'));
    }
    return ok;
}

async function initCloudSave() {
    if (!$('cloudStatus') && !$('cloudSlotList')) return;
    if (!window.supabase?.createClient) {
        cloud.ready = false;
        updateCloudUI('cloudUnavailable');
        setCloudMessage(t('cloudUnavailable'));
        return;
    }

    try {
        cloud.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        cloud.ready = true;
        const { data, error } = await cloud.client.auth.getSession();
        if (error) throw error;
        cloud.user = data.session?.user || null;

        cloud.client.auth.onAuthStateChange(async (_event, session) => {
            cloud.user = session?.user || null;
            cloud.dirty = false;
            cloud.statusKey = '';
            if (!cloud.user) {
                cloud.records = [];
                setCloudMessage('');
                updateCloudUI('cloudLocalOnly');
                return;
            }
            await loadCloudSlots({ silent: true });
            updateCloudUI('cloudSaveAvailable');
        });

        if (cloud.user) await loadCloudSlots({ silent: true });
        updateCloudUI(cloud.user ? 'cloudSaveAvailable' : 'cloudLocalOnly');
    } catch (error) {
        console.warn('Cloud Save unavailable:', error);
        cloud.ready = false;
        setCloudMessage(t('cloudUnavailable'));
        updateCloudUI('cloudUnavailable');
    }
}

function bindCloudEvents() {
    const popover = $('accountPopover');
    const toggle = $('accountToggleBtn');

    toggle?.addEventListener('click', () => {
        if (!popover) return;
        popover.hidden = !popover.hidden;
        toggle.setAttribute('aria-expanded', String(!popover.hidden));
    });

    document.addEventListener('click', event => {
        if (!popover || popover.hidden) return;
        if (popover.contains(event.target) || toggle?.contains(event.target)) return;
        popover.hidden = true;
        toggle?.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && popover) {
            popover.hidden = true;
            toggle?.setAttribute('aria-expanded', 'false');
        }
    });

    $('cloudLoginForm')?.addEventListener('submit', loginCloudAccount);
    $('cloudLogoutBtn')?.addEventListener('click', logoutCloudAccount);
    $('cloudQuickSaveBtn')?.addEventListener('click', saveNextEmptyCloudSlot);
    $('cloudSlotList')?.addEventListener('click', event => {
        const button = event.target.closest('button[data-cloud-action]');
        if (!button) return;
        const slot = Number(button.dataset.slot);
        if (button.dataset.cloudAction === 'save') saveCloudSlot(slot);
        if (button.dataset.cloudAction === 'load') loadCloudSlot(slot);
        if (button.dataset.cloudAction === 'delete') deleteCloudSlot(slot);
    });
}

async function loginCloudAccount(event) {
    event.preventDefault();
    if (!cloud.client) {
        setCloudMessage(t('cloudUnavailable'));
        updateCloudUI('cloudUnavailable');
        return;
    }

    const action = event.submitter?.dataset.authAction === 'signup' ? 'signup' : 'signin';
    const nickname = $('cloudNicknameInput')?.value.trim() || '';
    const email = $('cloudEmailInput')?.value.trim() || '';
    const password = $('cloudPasswordInput')?.value || '';

    if (!email || !password) {
        setCloudMessage(t('cloudMissingEmailPassword'));
        return;
    }
    if (action === 'signup' && !nickname) {
        setCloudMessage(t('cloudMissingSignup'));
        return;
    }

    setCloudBusy(true);
    setCloudMessage(t(action === 'signup' ? 'cloudSigningUp' : 'cloudSigningIn'));

    let result;
    try {
        result = action === 'signup'
            ? await cloud.client.auth.signUp({ email, password, options: { data: { display_name: nickname }, emailRedirectTo: window.location.href } })
            : await cloud.client.auth.signInWithPassword({ email, password });
    } catch (error) {
        result = { error };
    }

    setCloudBusy(false);
    if ($('cloudPasswordInput')) $('cloudPasswordInput').value = '';

    if (result.error) {
        console.warn(result.error);
        setCloudMessage(getCloudActionErrorMessage(result.error));
        updateCloudUI('cloudActionFailed');
        return;
    }

    cloud.user = result.data.session?.user || cloud.user;
    cloud.dirty = false;
    setCloudMessage(action === 'signup' && !result.data.session ? t('cloudSignupNeedsConfirm') : t('cloudSignedIn'));
    if (cloud.user) {
        await loadCloudSlots({ silent: true });
        if ($('accountPopover')) $('accountPopover').hidden = true;
    }
    updateCloudUI(cloud.user ? 'cloudSaveAvailable' : 'cloudLocalOnly');
}

async function logoutCloudAccount() {
    if (!cloud.client) return;
    setCloudBusy(true);
    const { error } = await cloud.client.auth.signOut();
    setCloudBusy(false);
    if (error) {
        console.warn(error);
        setCloudMessage(error.message || t('cloudLogoutFailed'));
        updateCloudUI('cloudLogoutFailed');
        return;
    }
    cloud.user = null;
    cloud.records = [];
    cloud.dirty = false;
    setCloudMessage(t('cloudLoggedOut'));
    updateCloudUI('cloudLocalOnly');
}

async function loadCloudSlots(options = {}) {
    if (!requireCloudLogin(options.silent)) return;
    setCloudBusy(true);
    let response;
    try {
        response = await cloud.client
            .from(CLOUD_TABLE)
            .select('id,user_id,slot_num,title,ticket_payload,created_at,updated_at')
            .eq('user_id', cloud.user.id)
            .in('slot_num', CLOUD_SLOT_NUMS)
            .order('slot_num', { ascending: true })
            .order('updated_at', { ascending: false });
    } catch (error) {
        response = { data: null, error };
    }
    setCloudBusy(false);

    const { data, error } = response;
    if (error) {
        console.warn(error);
        setCloudMessage(error.message || t('cloudActionFailed'));
        updateCloudUI('cloudActionFailed');
        return;
    }

    cloud.records = normalizeCloudRecords(data);
    if (!options.silent) setCloudMessage(t('cloudSlotsLoaded', { count: cloud.records.length }));
    updateCloudUI(options.silent ? undefined : 'cloudSaveAvailable');
}

async function saveNextEmptyCloudSlot() {
    if (!requireCloudLogin()) return;
    const emptySlot = CLOUD_SLOT_NUMS.find(slot => !findCloudSlot(slot));
    if (!emptySlot) {
        setCloudMessage(t('cloudSlotFull'));
        updateCloudUI('cloudSlotFull');
        return;
    }
    await saveCloudSlot(emptySlot, { confirmOverwrite: false });
}

async function saveCloudSlot(slotNum, options = {}) {
    slotNum = Number(slotNum);
    if (!CLOUD_SLOT_NUMS.includes(slotNum)) {
        setCloudMessage(t('cloudInvalidSlot'));
        updateCloudUI('cloudInvalidSlot');
        return;
    }
    if (!requireCloudLogin()) return;

    const existing = findCloudSlot(slotNum);
    if (existing && options.confirmOverwrite !== false) {
        const ok = window.confirm(t('cloudConfirmOverwrite', { slot: slotNum, title: existing.title || t('cloudEmptySlot') }));
        if (!ok) {
            setCloudMessage(t('cloudOverwriteCanceled'));
            return;
        }
    }

    const row = {
        user_id: cloud.user.id,
        slot_num: slotNum,
        title: buildCloudTitle(slotNum),
        ticket_payload: buildTicketPayload(slotNum),
        updated_at: new Date().toISOString()
    };

    setCloudBusy(true);
    let result;
    try {
        result = existing
            ? await cloud.client.from(CLOUD_TABLE).update(row).eq('id', existing.id).eq('user_id', cloud.user.id).select('id').single()
            : await cloud.client.from(CLOUD_TABLE).insert(row).select('id').single();
    } catch (error) {
        result = { data: null, error };
    }
    setCloudBusy(false);

    if (result.error) {
        console.warn(result.error);
        setCloudMessage(result.error.message || t('cloudActionFailed'));
        updateCloudUI('cloudActionFailed');
        return;
    }

    cloud.dirty = false;
    await loadCloudSlots({ silent: true });
    setCloudMessage(t(existing ? 'cloudOverwriteSuccess' : 'cloudSaveSuccess'));
    updateCloudUI('cloudSaved');
}

async function loadCloudSlot(slotNum) {
    if (!requireCloudLogin()) return;
    const record = findCloudSlot(slotNum);
    if (!record) {
        setCloudMessage(t('cloudNoSlotRecord'));
        return;
    }
    try {
        applyTicketConfig(extractTicketConfig(record.ticket_payload), { keepClean: true });
        cloud.dirty = false;
        setCloudMessage(t('cloudLoadSuccess'));
        updateCloudUI('cloudSaveAvailable');
    } catch (error) {
        console.warn(error);
        setCloudMessage(t('cloudActionFailed'));
        updateCloudUI('cloudActionFailed');
    }
}

async function deleteCloudSlot(slotNum) {
    if (!requireCloudLogin()) return;
    const record = findCloudSlot(slotNum);
    if (!record) {
        setCloudMessage(t('cloudNoSlotRecord'));
        return;
    }
    if (!window.confirm(t('cloudConfirmDelete', { slot: slotNum, title: record.title || t('cloudEmptySlot') }))) return;

    setCloudBusy(true);
    let response;
    try {
        response = await cloud.client
            .from(CLOUD_TABLE)
            .delete()
            .eq('id', record.id)
            .eq('user_id', cloud.user.id);
    } catch (error) {
        response = { error };
    }
    setCloudBusy(false);

    const { error } = response;
    if (error) {
        console.warn(error);
        setCloudMessage(error.message || t('cloudActionFailed'));
        updateCloudUI('cloudActionFailed');
        return;
    }

    await loadCloudSlots({ silent: true });
    setCloudMessage(t('cloudDeleteSuccess'));
    updateCloudUI('cloudDeleted');
}

function bindTicketDirtyTracking() {
    document.querySelectorAll('input, select').forEach(el => {
        if (!isTicketStateControl(el)) return;
        const eventName = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input';
        el.addEventListener(eventName, markCloudDirty);
    });
}

$('swapBgColors')?.addEventListener('click', () => {
    const temp = $('rect1Color').value;
    $('rect1Color').value = $('bgColor').value;
    $('bgColor').value = temp;
    document.documentElement.style.setProperty('--color-a', $('rect1Color').value);
    document.documentElement.style.setProperty('--color-b', $('bgColor').value);
    debouncedDrawTicket();
});

$('swapTextShadowColors')?.addEventListener('click', () => {
    const temp = $('bgTextColor').value;
    $('bgTextColor').value = $('bgShadowColor').value;
    $('bgShadowColor').value = temp;
    debouncedDrawTicket();
});

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
        const lumA = getLuminance(member.color_a);
        const textColorA = lumA > 0.8 ? '#000000' : '#FFFFFF';
        $('rect1TextColor').value = textColorA;
        $('footerTextColor').value = textColorA;
        let bColor = member.color_b === '#ffffff' ? '#FDF9FA' : member.color_b;
        $('bgColor').value = bColor; 
        
        // 顏色互換：背景文字為深色、陰影為淺色發光
        const mutedTextColor = getMutedDarkColor(bColor);
        const lighterColor = getLighterMutedColor(mutedTextColor);
        $('bgTextColor').value = mutedTextColor;    
        $('bgShadowColor').value = lighterColor; 
        
        $('bgTextOpacity').value = 1;     
        $('bgShadowOpacity').value = 0.25; 
        
        const opacitySlider = document.querySelector('.sync-slider[data-target="bgTextOpacity"]');
        if (opacitySlider) opacitySlider.value = 1;
        const shadowSlider = document.querySelector('.sync-slider[data-target="bgShadowOpacity"]');
        if (shadowSlider) shadowSlider.value = 0.25;
        
        debouncedDrawTicket();
    } else {
        $('memberHeader').style.display = 'none';
    }
});

document.addEventListener('mousedown', function(e) {
    if(['INPUT', 'BUTTON', 'SELECT', 'A', 'I', 'svg', 'path', 'LABEL'].includes(e.target.tagName)) return;
    let ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = e.clientX - 20 + 'px', ripple.style.top = e.clientY - 20 + 'px';
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
});

function initSidebarNav() {
    document.querySelectorAll('.hover-zone').forEach(zone => {
        zone.addEventListener('click', () => {
            const targetId = zone.id.replace('zone-', 'sec-');
            const icon = document.querySelector(`.nav-icon[data-target="${targetId}"]`);
            if(icon) {
                const drawer = $('settingsDrawer');
                const sections = document.querySelectorAll('.drawer-section');
                const navIcons = document.querySelectorAll('.nav-icon:not(.special-link)');
                
                navIcons.forEach(i => i.classList.remove('active'));
                sections.forEach(sec => sec.style.display = 'none');
                
                icon.classList.add('active');
                drawer.classList.add('open');
                const targetSec = $(targetId);
                if(targetSec) targetSec.style.display = 'block';
                
                if (window.innerWidth <= 800) {
                    setTimeout(() => {
                        drawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        // 展開時顯示箭咀
                        const hint = $('mobileScrollHint');
                        if (hint) {
                            hint.classList.add('show');
                            hint.classList.remove('fade-out');
                        }
                    }, 50);
                }
            }
        });
    });

    const navIcons = document.querySelectorAll('.nav-icon:not(.special-link)'), sections = document.querySelectorAll('.drawer-section'), drawer = $('settingsDrawer');
    navIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const isAlreadyActive = icon.classList.contains('active');
            navIcons.forEach(i => i.classList.remove('active')), sections.forEach(sec => sec.style.display = 'none');
            if (isAlreadyActive && drawer.classList.contains('open')) {
                drawer.classList.remove('open');
            } else {
                icon.classList.add('active'), drawer.classList.add('open');
                const targetSec = $(icon.getAttribute('data-target'));
                if(targetSec) targetSec.style.display = 'block';
                
                if (window.innerWidth <= 800) {
                    const hint = $('mobileScrollHint');
                    if (hint) {
                        hint.classList.add('show');
                        hint.classList.remove('fade-out');
                    }
                }
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
    
    const backupActions = $('backupActions');
    if (backupActions) {
        if (isActive) backupActions.classList.add('active');
        else backupActions.classList.remove('active');
    }
    
    const advSliders = document.querySelectorAll('.adv-slider');
    advSliders.forEach(el => { el.style.display = isActive ? 'flex' : 'none'; });
});

document.querySelectorAll('.sync-slider').forEach(slider => {
    const input = $(slider.getAttribute('data-target'));
    if (input) {
        slider.addEventListener('input', e => { input.value = e.target.value; debouncedDrawTicket(); });
        input.addEventListener('input', e => { slider.value = e.target.value; });
    }
});

function refreshQRCode() {
    const url = $('qrCodeUrl').value, qrContainer = $('qrPreview');
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
}

$('qrCodeUrl')?.addEventListener('input', debounce(refreshQRCode, 500));

$('showQR').addEventListener('change', () => debouncedDrawTicket());
document.querySelectorAll('input').forEach(el => { if(isTicketStateControl(el) && !el.classList.contains('sync-slider')) el.addEventListener('input', () => debouncedDrawTicket()); });
$('languageSelector')?.addEventListener('change', (e) => changeLanguage(e.target.value));
$('themeToggleBtn')?.addEventListener('click', () => { document.body.setAttribute('data-theme', document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); });

$('downloadBtn')?.addEventListener('click', () => $('downloadModal').style.display = 'flex');
$('dlPDF')?.addEventListener('click', () => { $('downloadModal').style.display = 'none'; triggerPDFDownload(canvas, $('bleedOption').checked); });
$('dl300')?.addEventListener('click', () => { $('downloadModal').style.display = 'none'; drawTicket(300, 'png'); });
$('dl70')?.addEventListener('click', () => { $('downloadModal').style.display = 'none'; drawTicket(70, 'png'); });

function isMobileExportDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth <= 768) || window.matchMedia('(max-width: 768px)').matches;
}

function getMobileSaveText() {
    const map = {
        'zh-HK': '請長按圖片，然後選擇儲存圖片。',
        'zh-CN': '请长按图片，然后选择保存图片。',
        ja: '画像を長押しして保存してください。',
        ko: '이미지를 길게 눌러 저장해 주세요.',
        th: 'กดรูปภาพค้างไว้เพื่อบันทึก',
        id: 'Tekan lama gambar untuk menyimpan.',
        en: 'Long-press the image to save it.'
    };
    return map[currentLang] || map.en;
}

function openMobileImageSaveOverlay(dataUrl) {
    document.getElementById('mobileResultOverlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'mobileResultOverlay';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:3000; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; padding:20px; box-sizing:border-box; background:rgba(0,0,0,.86); backdrop-filter:blur(8px); opacity:0; transition:opacity .25s ease;';

    const hint = document.createElement('div');
    hint.textContent = getMobileSaveText();
    hint.style.cssText = 'max-width:min(92vw,420px); color:#fff; background:#ff4f9a; padding:10px 18px; border-radius:999px; text-align:center; font-weight:900; line-height:1.35; box-shadow:0 8px 24px rgba(255,79,154,.34);';

    const img = document.createElement('img');
    img.src = dataUrl;
    img.className = 'allow-save';
    img.style.cssText = 'max-width:100%; max-height:72dvh; border-radius:18px; object-fit:contain; box-shadow:0 18px 48px rgba(0,0,0,.52); -webkit-touch-callout:default; user-select:auto;';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    closeBtn.style.cssText = 'position:absolute; top:18px; right:18px; width:42px; height:42px; border-radius:50%; border:1px solid rgba(255,255,255,.28); color:#fff; background:rgba(255,255,255,.16); display:grid; place-items:center;';
    closeBtn.onclick = () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 250);
    };

    overlay.append(hint, img, closeBtn);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
}

function triggerDownload(canvasObj, dpiStr) {
    const dataUrl = canvasObj.toDataURL('image/png');
    const link = document.createElement('a'); link.download = `Ticket_${dpiStr}_${Date.now()}.png`; link.href = dataUrl; link.click();
    if (dpiStr === '70dpi' && isMobileExportDevice()) {
        setTimeout(() => openMobileImageSaveOverlay(dataUrl), 220);
    }
}

function triggerPDFDownload(canvasObj, hasBleed) {
    const { jsPDF } = window.jspdf;
    const w_mm = hasBleed ? 156 : 150;
    const h_mm = hasBleed ? 71 : 65;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [w_mm, h_mm] });
    const imgData = canvasObj.toDataURL('image/jpeg', 1.0);
    pdf.addImage(imgData, 'JPEG', 0, 0, w_mm, h_mm);
    pdf.save(`Ticket_PrintReady_${Date.now()}.pdf`);
}

// 捲動偵測自動淡出浮動箭咀
const hideHint = () => {
    const hint = $('mobileScrollHint');
    if (hint && hint.classList.contains('show')) {
        hint.classList.add('fade-out');
        setTimeout(() => hint.classList.remove('show'), 300);
    }
};

const workspace = document.querySelector('.workspace');
if (workspace) {
    workspace.addEventListener('scroll', () => { if (workspace.scrollTop > 5) hideHint(); }, { passive: true });
    workspace.addEventListener('touchmove', hideHint, { passive: true });
}

window.addEventListener('resize', () => debouncedDrawTicket());
bindCloudEvents();
bindTicketDirtyTracking();

window.onload = async () => { 
    drawTicket(); 
    await Promise.all([loadLanguages(), loadMembers()]);
    initSidebarNav();
    await initCloudSave();
    waitForFonts().then(() => debouncedDrawTicket()); 
};

window.addEventListener('DOMContentLoaded', () => {
    if(window.lucide) lucide.createIcons();
});
