// Utility function to safely get DOM elements
const getElementById = (id) => {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Element with ID "${id}" not found`);
    return element;
};

// Configuration for ticket layout and defaults
const ticketConfig = {
    dimensions: { baseWidth: 150, baseHeight: 65, bleed: 3 }, // in mm
    dpi: {
        300: { scale: 300 / 25.4 }, // mm to px conversion
        70: { scale: 70 / 25.4 }
    },
    fonts: {
        avant: 'ITC Avant Garde Gothic Std Extra Light',
        kozgo: 'KozGoPr6N',
        ar: 'AR ADGothicJP',
        custom: { rect1: null, text2_3: null, text4_6: null, text10_12: null }
    },
    areas: {
        logo: { x: 8, y: 0, width: 25, height: 35 },
        qr: { xOffset: 8.5, size: 23, y: 23 }
    }
};

// Global state
let ticketState = {};
let qrImage = null;
let customBackgroundImage = null;
let previewScale = 1.0;
let currentLanguage = 'ja';
let translations = {}; // Will be loaded from langs.json

// Debounce utility
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

// Canvas setup
const canvas = getElementById('ticketCanvas');
const context = canvas.getContext('2d');

// Show/hide loading indicator
const toggleLoading = (show) => {
    getElementById('loading').style.display = show ? 'block' : 'none';
};

// Display error message
const showError = (id, message) => {
    const errorElement = getElementById(id + '-error');
    errorElement.textContent = message;
    errorElement.style.display = message ? 'inline' : 'none';
};

// Get ticket data from DOM
const getTicketData = () => ({
    logo: {
        line1: { text: getElementById('rect1Line1').value, x: parseFloat(getElementById('rect1Line1X').value), y: parseFloat(getElementById('rect1Line1Y').value), size: parseFloat(getElementById('rect1Size').value), spacing: parseFloat(getElementById('rect1Spacing').value) },
        line2: { text: getElementById('rect1Line2').value, x: parseFloat(getElementById('rect1Line2X').value), y: parseFloat(getElementById('rect1Line2Y').value), size: parseFloat(getElementById('rect1Line2Size').value), spacing: parseFloat(getElementById('rect1Line2Spacing').value) },
        backgroundColor: getElementById('rect1Color').value,
        textColor: getElementById('rect1TextColor').value
    },
    text: {
        performance: { text: getElementById('text2').value, x: parseFloat(getElementById('text2X').value), y: parseFloat(getElementById('text2Y').value), size: parseFloat(getElementById('text2Size').value), spacing: parseFloat(getElementById('text2Spacing').value) },
        birthdayLine1: { text: getElementById('text3Line1').value, x: parseFloat(getElementById('text3Line1X').value), y: parseFloat(getElementById('text3Line1Y').value), size: parseFloat(getElementById('text3Size').value), spacing: parseFloat(getElementById('text3Spacing').value) },
        birthdayLine2: { text: getElementById('text3Line2').value, x: parseFloat(getElementById('text3Line2X').value), y: parseFloat(getElementById('text3Line2Y').value), size: parseFloat(getElementById('text3Line2Size').value), spacing: parseFloat(getElementById('text3Line2Spacing').value) },
        date: { lines: [getElementById('text4Line1').value, getElementById('text4Line2').value], x: parseFloat(getElementById('text4Line1X').value), y: parseFloat(getElementById('text4Line1Y').value), size: parseFloat(getElementById('text4Size').value), spacing: parseFloat(getElementById('text4Spacing').value), lineHeight: parseFloat(getElementById('text4LineHeight').value) },
        number: { text: getElementById('text5').value, x: parseFloat(getElementById('text5X').value), y: parseFloat(getElementById('text5Y').value), size: parseFloat(getElementById('text5Size').value), spacing: parseFloat(getElementById('text5Spacing').value) },
        postalCode: { text: getElementById('text6').value, x: parseFloat(getElementById('text6X').value), y: parseFloat(getElementById('text6Y').value), size: parseFloat(getElementById('text6Size').value), spacing: parseFloat(getElementById('text6Spacing').value) },
        color: getElementById('textColor').value
    },
    background: {
        color: getElementById('bgColor').value,
        text: getElementById('bgText').value,
        textColor: getElementById('bgTextColor').value,
        shadowColor: getElementById('bgShadowColor').value,
        textX: parseFloat(getElementById('bgTextX').value),
        textY: parseFloat(getElementById('bgTextY').value),
        textSize: parseFloat(getElementById('bgTextSize').value),
        textSpacing: parseFloat(getElementById('bgTextSpacing').value),
        lineHeight: parseFloat(getElementById('bgTextLineHeight').value),
        shadowX: parseFloat(getElementById('bgShadowX').value),
        shadowY: parseFloat(getElementById('bgShadowY').value),
        shadowOpacity: parseFloat(getElementById('bgShadowOpacity').value)
    },
    footer: {
        backgroundColor: getElementById('rect9Color').value,
        other: { text: getElementById('text10').value, x: parseFloat(getElementById('text10X').value), y: parseFloat(getElementById('text10Y').value), size: parseFloat(getElementById('text10Size').value), spacing: parseFloat(getElementById('text10Spacing').value) },
        venue: { text: getElementById('text11').value, x: parseFloat(getElementById('text11X').value), y: parseFloat(getElementById('text11Y').value), size: parseFloat(getElementById('text11Size').value), spacing: parseFloat(getElementById('text11Spacing').value) },
        phone: { text: getElementById('text12').value, x: parseFloat(getElementById('text12X').value), y: parseFloat(getElementById('text12Y').value), size: parseFloat(getElementById('text12Size').value), spacing: parseFloat(getElementById('text12Spacing').value) },
        textColor: getElementById('footerTextColor').value
    },
    qr: {
        show: getElementById('showQR').checked,
        color: getElementById('qrSquareColor').value
    },
    customImage: {
        x: parseFloat(getElementById('customImageX').value),
        y: parseFloat(getElementById('customImageY').value),
        scale: parseFloat(getElementById('customImageScale').value)
    },
    bleed: getElementById('bleedOption').checked
});

// Update state and trigger redraw
const updateState = (key, value) => {
    ticketState[key] = value;
    debouncedDrawTicket(70);
};

// Draw text with custom spacing and alignment
const drawText = (lines, x, y, font, size, spacing, lineHeight, color, align = 'left', altFont, dpiScale, ctx) => {
    const ptToPx = dpiScale / 72;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    lines.forEach((line, index) => {
        let currentX = x;
        const lineY = y + index * lineHeight * ptToPx;
        if (!line) return;
        line.split('').forEach(char => {
            const useAltFont = altFont && /[A-Za-z0-9①❘－]/.test(char);
            ctx.font = `${size * ptToPx}px ${useAltFont ? altFont : font}`;
            ctx.fillText(char, currentX, lineY);
            currentX += ctx.measureText(char).width + spacing * ptToPx / 1000;
        });
    });
};

// Draw ticket background
const drawBackground = (data, dpiScale, width, height, bleedOffset, ctx) => {
    ctx.fillStyle = data.background.color;
    ctx.fillRect(0, 0, width, height);

    if (customBackgroundImage) {
        const imgX = data.customImage.x * dpiScale + bleedOffset;
        const imgY = data.customImage.y * dpiScale + bleedOffset;
        const imgWidth = customBackgroundImage.width * data.customImage.scale * (dpiScale / 72);
        const imgHeight = customBackgroundImage.height * data.customImage.scale * (dpiScale / 72);
        ctx.drawImage(customBackgroundImage, imgX, imgY, imgWidth, imgHeight);
    }

    ctx.font = `${data.background.textSize * (dpiScale / 72)}px ${ticketConfig.fonts.custom.rect1 || ticketConfig.fonts.avant}`;
    const charWidth = ctx.measureText(data.background.text.charAt(0)).width;
    const textWidth = ctx.measureText(data.background.text).width;
    const gridX = textWidth + data.background.textSpacing * (dpiScale / 72) / 1000;
    const gridY = data.background.lineHeight * (dpiScale / 72);
    ctx.globalAlpha = data.background.shadowOpacity;
    ctx.fillStyle = data.background.shadowColor;
    ctx.shadowColor = data.background.shadowColor;
    ctx.shadowOffsetX = data.background.shadowX * dpiScale;
    ctx.shadowOffsetY = data.background.shadowY * dpiScale;
    for (let y = data.background.textY * dpiScale + bleedOffset, row = 0; y < height; y += gridY, row++) {
        for (let x = data.background.textX * dpiScale + bleedOffset + row * charWidth; x < width; x += gridX) {
            ctx.fillText(data.background.text, x, y);
        }
    }
    ctx.globalAlpha = 1;
    ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    ctx.fillStyle = data.background.textColor;
    for (let y = data.background.textY * dpiScale + bleedOffset, row = 0; y < height; y += gridY, row++) {
        for (let x = data.background.textX * dpiScale + bleedOffset + row * charWidth; x < width; x += gridX) {
            ctx.fillText(data.background.text, x, y);
        }
    }
};

// Draw logo area
const drawLogo = (data, dpiScale, bleedOffset, ctx) => {
    ctx.fillStyle = data.logo.backgroundColor;
    ctx.fillRect(ticketConfig.areas.logo.x * dpiScale + bleedOffset, ticketConfig.areas.logo.y * dpiScale + bleedOffset, ticketConfig.areas.logo.width * dpiScale, ticketConfig.areas.logo.height * dpiScale);
    drawText([data.logo.line1.text], data.logo.line1.x * dpiScale + bleedOffset, data.logo.line1.y * dpiScale + bleedOffset, ticketConfig.fonts.custom.rect1 || ticketConfig.fonts.avant, data.logo.line1.size, data.logo.line1.spacing, 0, data.logo.textColor, 'center', null, dpiScale, ctx);
    drawText([data.logo.line2.text], data.logo.line2.x * dpiScale + bleedOffset, data.logo.line2.y * dpiScale + bleedOffset, ticketConfig.fonts.custom.rect1 || ticketConfig.fonts.avant, data.logo.line2.size, data.logo.line2.spacing, 0, data.logo.textColor, 'center', null, dpiScale, ctx);
};

// Draw main text areas
const drawMainText = (data, dpiScale, bleedOffset, ctx) => {
    const textColor = data.text.color;
    drawText([data.text.performance.text], data.text.performance.x * dpiScale + bleedOffset, data.text.performance.y * dpiScale + bleedOffset, ticketConfig.fonts.custom.text2_3 || ticketConfig.fonts.kozgo, data.text.performance.size, data.text.performance.spacing, 0, textColor, 'left', ticketConfig.fonts.ar, dpiScale, ctx);
    drawText([data.text.birthdayLine1.text], data.text.birthdayLine1.x * dpiScale + bleedOffset, data.text.birthdayLine1.y * dpiScale + bleedOffset, ticketConfig.fonts.custom.text2_3 || ticketConfig.fonts.kozgo, data.text.birthdayLine1.size, data.text.birthdayLine1.spacing, 0, textColor, 'left', ticketConfig.fonts.ar, dpiScale, ctx);
    drawText([data.text.birthdayLine2.text], data.text.birthdayLine2.x * dpiScale + bleedOffset, data.text.birthdayLine2.y * dpiScale + bleedOffset, ticketConfig.fonts.custom.text2_3 || ticketConfig.fonts.kozgo, data.text.birthdayLine2.size, data.text.birthdayLine2.spacing, 0, textColor, 'left', ticketConfig.fonts.ar, dpiScale, ctx);
    drawText(data.text.date.lines, data.text.date.x * dpiScale + bleedOffset, data.text.date.y * dpiScale + bleedOffset, ticketConfig.fonts.custom.text4_6 || ticketConfig.fonts.kozgo, data.text.date.size, data.text.date.spacing, data.text.date.lineHeight, textColor, 'left', ticketConfig.fonts.ar, dpiScale, ctx);
    drawText([data.text.number.text], data.text.number.x * dpiScale + bleedOffset, data.text.number.y * dpiScale + bleedOffset, ticketConfig.fonts.custom.text4_6 || ticketConfig.fonts.kozgo, data.text.number.size, data.text.number.spacing, 0, textColor, 'left', ticketConfig.fonts.ar, dpiScale, ctx);
    drawText([data.text.postalCode.text], data.text.postalCode.x * dpiScale + bleedOffset, data.text.postalCode.y * dpiScale + bleedOffset, ticketConfig.fonts.custom.text4_6 || ticketConfig.fonts.kozgo, data.text.postalCode.size, data.text.postalCode.spacing, 0, textColor, 'left', ticketConfig.fonts.ar, dpiScale, ctx);
};

// Draw footer area
const drawFooter = (data, dpiScale, bleedOffset, ctx) => {
    ctx.fillStyle = data.footer.backgroundColor;
    ctx.fillRect(bleedOffset, 60 * dpiScale + bleedOffset, ticketConfig.dimensions.baseWidth * dpiScale, 5 * dpiScale);
    drawText([data.footer.other.text], data.footer.other.x * dpiScale + bleedOffset, data.footer.other.y * dpiScale + bleedOffset, ticketConfig.fonts.custom.text10_12 || ticketConfig.fonts.kozgo, data.footer.other.size, data.footer.other.spacing, 0, data.footer.textColor, 'left', ticketConfig.fonts.ar, dpiScale, ctx);
    drawText([data.footer.venue.text], data.footer.venue.x * dpiScale + bleedOffset, data.footer.venue.y * dpiScale + bleedOffset, ticketConfig.fonts.custom.text10_12 || ticketConfig.fonts.kozgo, data.footer.venue.size, data.footer.venue.spacing, 0, data.footer.textColor, 'left', ticketConfig.fonts.ar, dpiScale, ctx);
    drawText([data.footer.phone.text], data.footer.phone.x * dpiScale + bleedOffset, data.footer.phone.y * dpiScale + bleedOffset, ticketConfig.fonts.custom.text10_12 || ticketConfig.fonts.kozgo, data.footer.phone.size, data.footer.phone.spacing, 0, data.footer.textColor, 'left', ticketConfig.fonts.ar, dpiScale, ctx);
};

// Draw QR code
const drawQRCode = (data, dpiScale, width, bleedOffset, ctx) => {
    if (data.qr.show) {
        const qrX = width - ticketConfig.areas.qr.xOffset * dpiScale - ticketConfig.areas.qr.size * dpiScale + bleedOffset;
        const qrY = ticketConfig.areas.qr.y * dpiScale + bleedOffset;
        const qrSize = ticketConfig.areas.qr.size * dpiScale;
        ctx.fillStyle = data.qr.color;
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        if (qrImage) ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    }
};

// Main drawing function
const drawTicket = async (dpi, ctx = context) => {
    toggleLoading(true);
    const data = getTicketData();
    const dpiScale = ticketConfig.dpi[dpi].scale;
    const bleedOffset = data.bleed ? ticketConfig.dimensions.bleed * dpiScale : 0;
    const width = (data.bleed ? ticketConfig.dimensions.baseWidth + 2 * ticketConfig.dimensions.bleed : ticketConfig.dimensions.baseWidth) * dpiScale;
    const height = (data.bleed ? ticketConfig.dimensions.baseHeight + 2 * ticketConfig.dimensions.bleed : ticketConfig.dimensions.baseHeight) * dpiScale;

    ctx.canvas.width = width;
    ctx.canvas.height = height;
    if (ctx === context) {
        canvas.style.width = `${width * previewScale}px`;
        canvas.style.height = `${height * previewScale}px`;
    }
    ctx.clearRect(0, 0, width, height);

    drawBackground(data, dpiScale, width, height, bleedOffset, ctx);
    drawLogo(data, dpiScale, bleedOffset, ctx);
    drawMainText(data, dpiScale, bleedOffset, ctx);
    drawFooter(data, dpiScale, bleedOffset, ctx);
    drawQRCode(data, dpiScale, width, bleedOffset, ctx);

    toggleLoading(false);
};

const debouncedDrawTicket = debounce(drawTicket, 300);

// Set preview scale
const setPreviewScale = (scale) => {
    previewScale = scale;
    if (window.innerWidth <= 768 && window.matchMedia("(orientation: portrait)").matches) {
        previewScale = Math.min(scale, window.innerWidth / (ticketConfig.dimensions.baseWidth * ticketConfig.dpi[70].scale) * 0.8);
    }
    drawTicket(70);
};

// Download ticket
const downloadTicket = async (dpi) => {
    toggleLoading(true);
    await drawTicket(dpi, context);
    const link = document.createElement('a');
    link.download = `ticket_${dpi}dpi.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    await drawTicket(70);
    toggleLoading(false);
};

// Load custom font
const loadCustomFont = (file, fontKey) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const fontData = e.target.result;
        const font = new FontFace(fontKey, fontData);
        await font.load();
        document.fonts.add(font);
        ticketConfig.fonts.custom[fontKey] = fontKey;
        debouncedDrawTicket(70);
    };
    reader.onerror = () => alert(translations[currentLanguage]?.qrReadError || 'File read error');
    reader.readAsArrayBuffer(file);
};

// Change language
const changeLanguage = (lang) => {
    currentLanguage = lang;
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (translations[lang] && translations[lang][key]) {
            if (el.tagName === 'LABEL') {
                const input = el.querySelector('input, select');
                if (input) {
                    const textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                    if (textNode) textNode.textContent = translations[lang][key] + ' ';
                } else {
                    el.textContent = translations[lang][key];
                }
            } else {
                el.textContent = translations[lang][key];
            }
        }
    });
    debouncedDrawTicket(70);
};

// Toggle advanced mode
const toggleAdvancedMode = () => {
    const advancedElements = document.querySelectorAll('.advanced-mode');
    advancedElements.forEach(el => el.classList.toggle('active'));
    const button = getElementById('advancedModeBtn');
    button.textContent = button.textContent === translations[currentLanguage]?.advancedMode ? '簡易設定' : translations[currentLanguage]?.advancedMode || 'Advanced Settings';
};

// Load translations and initialize app
const initializeApp = async () => {
    try {
        const response = await fetch('langs.json');
        if (!response.ok) throw new Error('Failed to load translations');
        translations = await response.json();
        changeLanguage('ja');
        setPreviewScale(1.0);
        await drawTicket(70);
    } catch (error) {
        console.error('Error loading translations:', error);
        alert('Failed to load language data. Please refresh the page.');
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    getElementById('languageSelector').addEventListener('change', (e) => changeLanguage(e.target.value));

    getElementById('qrCodeInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
            alert(file.size > 5 * 1024 * 1024 ? 'File size exceeds 5MB limit.' : translations[currentLanguage]?.qrFormatError || 'Unsupported file format');
            qrImage = null;
            debouncedDrawTicket(70);
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            qrImage = new Image();
            qrImage.src = event.target.result;
            qrImage.onload = () => debouncedDrawTicket(70);
            qrImage.onerror = () => {
                alert(translations[currentLanguage]?.qrLoadError || 'QR code load error');
                qrImage = null;
                debouncedDrawTicket(70);
            };
        };
        reader.onerror = () => alert(translations[currentLanguage]?.qrReadError || 'File read error');
        reader.readAsDataURL(file);
    });

    getElementById('customImageInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
            alert(file.size > 5 * 1024 * 1024 ? 'File size exceeds 5MB limit.' : translations[currentLanguage]?.qrFormatError || 'Unsupported file format');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            customBackgroundImage = new Image();
            customBackgroundImage.src = event.target.result;
            customBackgroundImage.onload = () => debouncedDrawTicket(70);
            customBackgroundImage.onerror = () => alert(translations[currentLanguage]?.qrLoadError || 'Image load error');
        };
        reader.onerror = () => alert(translations[currentLanguage]?.qrReadError || 'File read error');
        reader.readAsDataURL(file);
    });

    ['customFontRect1', 'customFontText2_3', 'customFontText4_6', 'customFontText10_12'].forEach(id => {
        getElementById(id).addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) loadCustomFont(file, id.replace('customFont', '').toLowerCase());
        });
    });

    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', () => {
            const value = parseFloat(input.value);
            if (isNaN(value)) {
                showError(input.id, translations[currentLanguage]?.inputError || 'Invalid value');
                input.value = 0;
            } else if (input.classList.contains('opacity-input') && (value < 0 || value > 1)) {
                showError(input.id, translations[currentLanguage]?.opacityError || 'Opacity must be 0-1');
                input.value = Math.max(0, Math.min(1, value));
            } else if (value < 0) {
                showError(input.id, translations[currentLanguage]?.inputError || 'Negative values not allowed');
                input.value = 0;
            } else {
                showError(input.id, '');
            }
            debouncedDrawTicket(70);
        });
    });

    document.querySelectorAll('input:not([type="number"]), select').forEach(el => {
        if (el.id !== 'languageSelector') {
            el.addEventListener('input', () => debouncedDrawTicket(70));
        }
    });

    getElementById('download300Button').addEventListener('click', () => downloadTicket(300));
    getElementById('download70Button').addEventListener('click', () => downloadTicket(70));
    getElementById('scale50Button').addEventListener('click', () => setPreviewScale(0.5));
    getElementById('scale100Button').addEventListener('click', () => setPreviewScale(1.0));
    getElementById('scale150Button').addEventListener('click', () => setPreviewScale(1.5));
    getElementById('scale200Button').addEventListener('click', () => setPreviewScale(2.0));
    getElementById('advancedModeBtn').addEventListener('click', toggleAdvancedMode);
});

// Initialize app after loading translations
window.onload = () => {
    initializeApp();
};
