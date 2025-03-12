const $ = id => {
    const element = document.getElementById(id);
    if (!element) console.error(`Element with ID "${id}" not found`);
    return element;
};
const canvas = $('ticketCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

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
    },
    'zh-CN': {
        title: '门票生成器', preview: '门票预览', custom: '自定义门票', rect1Line1: '区域1 文本 (第1行)', rect1Line2: '区域1 文本 (第2行)', rect1Color: '区域1 背景色', rect1TextColor: '区域1 文字色', text2: '文本2', text3Line1: '文本3 (第1行)', text3Line2: '文本3 (第2行)', text4Line1: '文本4 (第1行)', text4Line2: '文本4 (第2行)', text5: '文本5', text6: '文本6', textColor: '文字色 (2-6)', bgColor: '整体背景色', bgText: '背景文本', bgTextColor: '背景文字色', bgShadowColor: '背景阴影色', rect9Color: '区域9 背景色', text10: '文本10', text11: '文本11', text12: '文本12', footerTextColor: '文字色 (10-12)', qrCodeInput: 'QR码图片 (优先)', qrCodeText: '将URL转为QR码', generateQR: '生成', showQR: '显示QR码框架', qrSquareColor: 'QR框架颜色', customImageInput: '自定义图片', recommendedSize: '（推荐尺寸: 65mm x 150mm）', imageLayer: '图片层级', customFontRect1: '区域1用自定义字体', customFontText2_3: '文本2-3用自定义字体', customFontText4_6: '文本4-6用自定义字体', customFontText10_12: '文本10-12用自定义字体', bleedOption: '含出血位 (+3mm)', download300: '下载 (300 DPI)', download70: '下载 (70 DPI)', advancedMode: '高级设置', donate: '捐款', reportBug: '报告错误', note: '※下载的PNG为RGB格式。如需印刷用CMYK，请使用Photoshop或GIMP转换。', disclaimer: '鉴于AKB48成员生诞祭剧场公演中，粉丝复刻的剧场门票令人感动，故制作此网站，让粉丝可自制门票并保存。此网站纯为兴趣制作，请勿用于商业或非法用途。版权归© AKB48及株式会社DH所有，制作者不承担任何责任。', downloadError: '下载失败，请重试。', inputError: '不可使用负值或无效值。', opacityError: '透明度需在0到1之间。', qrFormatError: '不支持的文件格式，请选择图片。', qrLoadError: 'QR码图片加载失败。', qrReadError: '文件读取失败。', fontLoadError: '字体加载失败，将使用默认字体。', qrGenerateError: 'QR码生成失败。', x: 'X', y: 'Y', spacing: '字距', size: '大小', lineHeight: '行距', shadowX: '阴影X', shadowY: '阴影Y', shadowOpacity: '阴影透明度'
    },
    en: {
        title: 'Ticket Maker', preview: 'Ticket Preview', custom: 'Custom Ticket', rect1Line1: 'Area 1 Text (Line 1)', rect1Line2: 'Area 1 Text (Line 2)', rect1Color: 'Area 1 Background Color', rect1TextColor: 'Area 1 Text Color', text2: 'Text 2', text3Line1: 'Text 3 (Line 1)', text3Line2: 'Text 3 (Line 2)', text4Line1: 'Text 4 (Line 1)', text4Line2: 'Text 4 (Line 2)', text5: 'Text 5', text6: 'Text 6', textColor: 'Text Color (2-6)', bgColor: 'Overall Background Color', bgText: 'Background Text', bgTextColor: 'Background Text Color', bgShadowColor: 'Background Shadow Color', rect9Color: 'Area 9 Background Color', text10: 'Text 10', text11: 'Text 11', text12: 'Text 12', footerTextColor: 'Text Color (10-12)', qrCodeInput: 'QR Code Image (Priority)', qrCodeText: 'Convert URL to QR Code', generateQR: 'Generate', showQR: 'Show QR Code Frame', qrSquareColor: 'QR Frame Color', customImageInput: 'Custom Image', recommendedSize: '(Recommended Size: 65mm x 150mm)', imageLayer: 'Image Layer', customFontRect1: 'Custom Font for Area 1', customFontText2_3: 'Custom Font for Text 2-3', customFontText4_6: 'Custom Font for Text 4-6', customFontText10_12: 'Custom Font for Text 10-12', bleedOption: 'With Bleed (+3mm)', download300: 'Download (300 DPI)', download70: 'Download (70 DPI)', advancedMode: 'Advanced Settings', donate: 'Donate', reportBug: 'Report Bug', note: '※The downloaded PNG is in RGB format. For printing, convert to CMYK using Photoshop or GIMP.', disclaimer: 'Inspired by the感動 of fans recreating theater tickets for AKB48 members’ birthday performances, this website was created as a hobby to allow fans to make and save their own tickets. Please refrain from commercial or illegal use. Rights belong to © AKB48 and DH Co., Ltd., and the creator assumes no responsibility.', downloadError: 'Download failed. Please try again.', inputError: 'Negative or invalid values cannot be used.', opacityError: 'Opacity must be between 0 and 1.', qrFormatError: 'Unsupported file format. Please select an image.', qrLoadError: 'Failed to load QR code image.', qrReadError: 'Failed to read file.', fontLoadError: 'Failed to load font. Default font will be used.', qrGenerateError: 'Failed to generate QR code.', x: 'X', y: 'Y', spacing: 'Letter Spacing', size: 'Size', lineHeight: 'Line Height', shadowX: 'Shadow X', shadowY: 'Shadow Y', shadowOpacity: 'Shadow Opacity'
    },
    ko: {
        title: '티켓 메이커', preview: '티켓 미리보기', custom: '커스텀 티켓', rect1Line1: '영역 1 텍스트 (1행)', rect1Line2: '영역 1 텍스트 (2행)', rect1Color: '영역 1 배경색', rect1TextColor: '영역 1 글자색', text2: '텍스트 2', text3Line1: '텍스트 3 (1행)', text3Line2: '텍스트 3 (2행)', text4Line1: '텍스트 4 (1행)', text4Line2: '텍스트 4 (2행)', text5: '텍스트 5', text6: '텍스트 6', textColor: '글자색 (2-6)', bgColor: '전체 배경색', bgText: '배경 텍스트', bgTextColor: '배경 글자색', bgShadowColor: '배경 그림자 색', rect9Color: '영역 9 배경색', text10: '텍스트 10', text11: '텍스트 11', text12: '텍스트 12', footerTextColor: '글자색 (10-12)', qrCodeInput: 'QR 코드 이미지 (우선)', qrCodeText: 'URL을 QR 코드로 변환', generateQR: '생성', showQR: 'QR 코드 프레임 표시', qrSquareColor: 'QR 프레임 색상', customImageInput: '커스텀 이미지', recommendedSize: '(추천 크기: 65mm x 150mm)', imageLayer: '이미지 레이어', customFontRect1: '영역 1용 커스텀 폰트', customFontText2_3: '텍스트 2-3용 커스텀 폰트', customFontText4_6: '텍스트 4-6용 커스텀 폰트', customFontText10_12: '텍스트 10-12용 커스텀 폰트', bleedOption: '블리드 포함 (+3mm)', download300: '다운로드 (300 DPI)', download70: '다운로드 (70 DPI)', advancedMode: '고급 설정', donate: '기부', reportBug: '버그 신고', note: '※다운로드된 PNG는 RGB 형식입니다. 인쇄용 CMYK로 변환하려면 Photoshop 또는 GIMP를 사용하세요.', disclaimer: 'AKB48 멤버의 생일 공연에서 팬들이 복각한 극장 티켓에 감동받아, 팬들이 취미로 자신만의 티켓을 만들고 저장할 수 있는 웹사이트를 제작했습니다. 상업적 또는 불법 사용은 삼가주세요. 권리는 © AKB48 및 DH 주식회사에 있으며, 제작자는 책임을 지지 않습니다.', downloadError: '다운로드에 실패했습니다. 다시 시도해주세요.', inputError: '음수 또는 유효하지 않은 값을 사용할 수 없습니다.', opacityError: '투명도는 0에서 1 사이여야 합니다.', qrFormatError: '지원되지 않는 파일 형식입니다. 이미지를 선택해주세요.', qrLoadError: 'QR 코드 이미지 로드에 실패했습니다.', qrReadError: '파일 읽기에 실패했습니다.', fontLoadError: '폰트 로드에 실패했습니다. 기본 폰트를 사용합니다.', qrGenerateError: 'QR 코드 생성에 실패했습니다.', x: 'X', y: 'Y', spacing: '자간', size: '크기', lineHeight: '행간', shadowX: '그림자 X', shadowY: '그림자 Y', shadowOpacity: '그림자 투명도'
    },
    th: {
        title: 'เครื่องสร้างตั๋ว', preview: 'ตัวอย่างตั๋ว', custom: 'ตั๋วที่กำหนดเอง', rect1Line1: 'ข้อความบริเวณ 1 (บรรทัด 1)', rect1Line2: 'ข้อความบริเวณ 1 (บรรทัด 2)', rect1Color: 'สีพื้นหลังบริเวณ 1', rect1TextColor: 'สีตัวอักษรบริเวณ 1', text2: 'ข้อความ 2', text3Line1: 'ข้อความ 3 (บรรทัด 1)', text3Line2: 'ข้อความ 3 (บรรทัด 2)', text4Line1: 'ข้อความ 4 (บรรทัด 1)', text4Line2: 'ข้อความ 4 (บรรทัด 2)', text5: 'ข้อความ 5', text6: 'ข้อความ 6', textColor: 'สีตัวอักษร (2-6)', bgColor: 'สีพื้นหลังทั้งหมด', bgText: 'ข้อความพื้นหลัง', bgTextColor: 'สีข้อความพื้นหลัง', bgShadowColor: 'สีเงาพื้นหลัง', rect9Color: 'สีพื้นหลังบริเวณ 9', text10: 'ข้อความ 10', text11: 'ข้อความ 11', text12: 'ข้อความ 12', footerTextColor: 'สีตัวอักษร (10-12)', qrCodeInput: 'ภาพ QR Code (ลำดับแรก)', qrCodeText: 'แปลง URL เป็น QR Code', generateQR: 'สร้าง', showQR: 'แสดงกรอบ QR Code', qrSquareColor: 'สีกรอบ QR', customImageInput: 'ภาพที่กำหนดเอง', recommendedSize: '(ขนาดแนะนำ: 65mm x 150mm)', imageLayer: 'ชั้นภาพ', customFontRect1: 'ฟอนต์กำหนดเองสำหรับบริเวณ 1', customFontText2_3: 'ฟอนต์กำหนดเองสำหรับข้อความ 2-3', customFontText4_6: 'ฟอนต์กำหนดเองสำหรับข้อความ 4-6', customFontText10_12: 'ฟอนต์กำหนดเองสำหรับข้อความ 10-12', bleedOption: 'มีขอบตัด (+3mm)', download300: 'ดาวน์โหลด (300 DPI)', download70: 'ดาวน์โหลด (70 DPI)', advancedMode: 'การตั้งค่าขั้นสูง', donate: 'บริจาค', reportBug: 'รายงานข้อผิดพลาด', note: '※PNG ที่ดาวน์โหลดเป็นรูปแบบ RGB หากต้องการพิมพ์ด้วย CMYK โปรดใช้ Photoshop หรือ GIMP ในการแปลง', disclaimer: 'จากความประทับใจในตั๋วโรงละครที่แฟนๆ สร้างขึ้นใหม่ในงานฉลองวันเกิดของสมาชิก AKB48 เราได้สร้างเว็บไซต์นี้เพื่อให้แฟนๆ สามารถทำตั๋วของตัวเองและเก็บไว้เป็นงานอดิเรก โปรดงดใช้ในเชิงพาณิชย์หรือผิดกฎหมาย สิขสิทธิ์เป็นของ © AKB48 และบริษัท DH ผู้สร้างไม่รับผิดชอบใดๆ', downloadError: 'การดาวน์โหลดล้มเหลว โปรดลองอีกครั้ง', inputError: 'ไม่สามารถใช้ค่าลบหรือค่าไม่ถูกต้องได้', opacityError: 'ความโปร่งใสต้องอยู่ระหว่าง 0 ถึง 1', qrFormatError: 'รูปแบบไฟล์ไม่รองรับ โปรดเลือกภาพ', qrLoadError: 'โหลดภาพ QR Code ล้มเหลว', qrReadError: 'การอ่านไฟล์ล้มเหลว', fontLoadError: 'โหลดฟอนต์ล้มเหลว จะใช้ฟอนต์เริ่มต้น', qrGenerateError: 'การสร้าง QR Code ล้มเหลว', x: 'X', y: 'Y', spacing: 'ระยะห่างตัวอักษร', size: 'ขนาด', lineHeight: 'ระยะห่างบรรทัด', shadowX: 'เงา X', shadowY: 'เงา Y', shadowOpacity: 'ความโปร่งใสของเงา'
    },
    id: {
        title: 'Pembuat Tiket', preview: 'Pratinjau Tiket', custom: 'Tiket Kustom', rect1Line1: 'Teks Area 1 (Baris 1)', rect1Line2: 'Teks Area 1 (Baris 2)', rect1Color: 'Warna Latar Area 1', rect1TextColor: 'Warna Teks Area 1', text2: 'Teks 2', text3Line1: 'Teks 3 (Baris 1)', text3Line2: 'Teks 3 (Baris 2)', text4Line1: 'Teks 4 (Baris 1)', text4Line2: 'Teks 4 (Baris 2)', text5: 'Teks 5', text6: 'Teks 6', textColor: 'Warna Teks (2-6)', bgColor: 'Warna Latar Keseluruhan', bgText: 'Teks Latar', bgTextColor: 'Warna Teks Latar', bgShadowColor: 'Warna Bayangan Latar', rect9Color: 'Warna Latar Area 9', text10: 'Teks 10', text11: 'Teks 11', text12: 'Teks 12', footerTextColor: 'Warna Teks (10-12)', qrCodeInput: 'Gambar QR Code (Prioritas)', qrCodeText: 'Ubah URL menjadi QR Code', generateQR: 'Buat', showQR: 'Tampilkan Bingkai QR Code', qrSquareColor: 'Warna Bingkai QR', customImageInput: 'Gambar Kustom', recommendedSize: '(Ukuran Disarankan: 65mm x 150mm)', imageLayer: 'Lapisan Gambar', customFontRect1: 'Font Kustom untuk Area 1', customFontText2_3: 'Font Kustom untuk Teks 2-3', customFontText4_6: 'Font Kustom untuk Teks 4-6', customFontText10_12: 'Font Kustom untuk Teks 10-12', bleedOption: 'Dengan Bleed (+3mm)', download300: 'Unduh (300 DPI)', download70: 'Unduh (70 DPI)', advancedMode: 'Pengaturan Lanjutan', donate: 'Donasi', reportBug: 'Laporkan Bug', note: '※PNG yang diunduh dalam format RGB. Untuk pencetakan, konversi ke CMYK menggunakan Photoshop atau GIMP.', disclaimer: 'Terinspirasi oleh tiket teater yang dibuat ulang oleh penggemar untuk pertunjukan ulang tahun anggota AKB48, situs web ini dibuat sebagai hobi agar penggemar dapat membuat dan menyimpan tiket mereka sendiri. Harap jangan digunakan untuk tujuan komersial atau ilegal. Hak cipta milik © AKB48 dan DH Co., Ltd., dan pembuat tidak bertanggung jawab.', downloadError: 'Pengunduhan gagal. Silakan coba lagi.', inputError: 'Nilai negatif atau tidak valid tidak dapat digunakan.', opacityError: 'Opasitas harus antara 0 dan 1.', qrFormatError: 'Format file tidak didukung. Pilih gambar.', qrLoadError: 'Gagal memuat gambar QR Code.', qrReadError: 'Gagal membaca file.', fontLoadError: 'Gagal memuat font. Font default akan digunakan.', qrGenerateError: 'Gagal membuat QR Code.', x: 'X', y: 'Y', spacing: 'Jarak Huruf', size: 'Ukuran', lineHeight: 'Jarak Baris', shadowX: 'Bayangan X', shadowY: 'Bayangan Y', shadowOpacity: 'Opasitas Bayangan'
    }
};

const checkFontAvailability = async (fontName) => {
    await document.fonts.ready;
    return document.fonts.check(`1em ${fontName}`);
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

const drawTicket = async (dpiVal) => {
    if (!ctx) {
        console.error('Cannot draw ticket: Canvas context is null');
        return;
    }
    const isAvantLoaded = await checkFontAvailability('ITC Avant Garde Gothic Std Extra Light');
    if (!isAvantLoaded) {
        console.warn('Font "ITC Avant Garde Gothic Std Extra Light" not loaded, falling back to sans-serif.');
        fonts.avant = 'sans-serif';
    }

    const bleed = $('bleedOption')?.checked || false;
    const w = bleed ? dpi[dpiVal].bleed.w : dpi[dpiVal].base.w;
    const h = bleed ? dpi[dpiVal].bleed.h : dpi[dpiVal].base.h;
    const mmPx = dpiVal / 25.4;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w * previewScale}px`;
    canvas.style.height = `${h * previewScale}px`;
    ctx.clearRect(0, 0, w, h);

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

    ctx.fillStyle = $('rect1Color')?.value || '#2086D1';
    ctx.fillRect(8 * mmPx + (bleed ? sizes.bleed * mmPx : 0), bleed ? sizes.bleed * mmPx : 0, 25 * mmPx, 35 * mmPx);
    drawText([$('rect1Line1')?.value || 'AKB'], parseFloat($('rect1Line1X')?.value || 13.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('rect1Line1Y')?.value || 12) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customRect1 || fonts.avant, parseFloat($('rect1Size')?.value || 47), parseFloat($('rect1Spacing')?.value || -7000), 0, $('rect1TextColor')?.value || '#FFFFFF', 'center', null, dpiVal);
    drawText([$('rect1Line2')?.value || '48'], parseFloat($('rect1Line2X')?.value || 13.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('rect1Line2Y')?.value || 24) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customRect1 || fonts.avant, parseFloat($('rect1Line2Size')?.value || 47), parseFloat($('rect1Line2Spacing')?.value || -7000), 0, $('rect1TextColor')?.value || '#FFFFFF', 'center', null, dpiVal);

    const tc = $('textColor')?.value || '#000000';
    drawText([$('text2')?.value || '「ここからだ」 公演'], parseFloat($('text2X')?.value || 37) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text2Y')?.value || 12) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText2_3 || fonts.kozgo, parseFloat($('text2Size')?.value || 14.2), parseFloat($('text2Spacing')?.value || 2000), 0, tc, 'left', fonts.ar, dpiVal);
    drawText([$('text3Line1')?.value || '秋元康 生誕祭'], parseFloat($('text3Line1X')?.value || 35) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text3Line1Y')?.value || 19) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText2_3 || fonts.kozgo, parseFloat($('text3Size')?.value || 14.2), parseFloat($('text3Spacing')?.value || 2000), 0, tc, 'left', fonts.ar, dpiVal);
    drawText([$('text3Line2')?.value || 'AKB48劇場'], parseFloat($('text3Line2X')?.value || 35) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text3Line2Y')?.value || 25) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText2_3 || fonts.kozgo, parseFloat($('text3Line2Size')?.value || 14.2), parseFloat($('text3Line2Spacing')?.value || 2000), 0, tc, 'left', fonts.ar, dpiVal);
    drawText([$('text4Line1')?.value || '＜日付＞2025年05月02日（金）', $('text4Line2')?.value || 'OPEN：18時10分       START：18時30分      ￥3,400'], parseFloat($('text4Line1X')?.value || 13) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text4Line1Y')?.value || 43) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText4_6 || fonts.kozgo, parseFloat($('text4Size')?.value || 11), parseFloat($('text4Spacing')?.value || 1000), parseFloat($('text4LineHeight')?.value || 14), tc, 'left', fonts.ar, dpiVal);
    drawText([$('text5')?.value || '048番'], parseFloat($('text5X')?.value || 13) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text5Y')?.value || 55) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText4_6 || fonts.kozgo, parseFloat($('text5Size')?.value || 16), parseFloat($('text5Spacing')?.value || 200), 0, tc, 'left', fonts.ar, dpiVal);
    drawText([$('text6')?.value || '① ❘ 000－0000 ❘ ゴメン先生 様'], parseFloat($('text6X')?.value || 36) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text6Y')?.value || 55) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText4_6 || fonts.kozgo, parseFloat($('text6Size')?.value || 13), parseFloat($('text6Spacing')?.value || 311), 0, tc, 'left', fonts.ar, dpiVal);

    ctx.fillStyle = $('rect9Color')?.value || '#2086D1';
    ctx.fillRect(bleed ? sizes.bleed * mmPx : 0, 60 * mmPx + (bleed ? sizes.bleed * mmPx : 0), 150 * mmPx, 5 * mmPx);
    const fc = $('footerTextColor')?.value || '#FFFFFF';
    drawText([$('text10')?.value || '<主催 ‧ お問い合せ>'], parseFloat($('text10X')?.value || 54) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text10Y')?.value || 62.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText10_12 || fonts.kozgo, parseFloat($('text10Size')?.value || 7), parseFloat($('text10Spacing')?.value || 236), 0, fc, 'left', fonts.ar, dpiVal);
    drawText([$('text11')?.value || 'AKB48 Theater'], parseFloat($('text11X')?.value || 80.5) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text11Y')?.value || 63) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText10_12 || fonts.kozgo, parseFloat($('text11Size')?.value || 10), parseFloat($('text11Spacing')?.value || 238), 0, fc, 'left', fonts.ar, dpiVal);
    drawText([$('text12')?.value || 'TEL:03-5298-8648'], parseFloat($('text12X')?.value || 108) * mmPx + (bleed ? sizes.bleed * mmPx : 0), parseFloat($('text12Y')?.value || 63) * mmPx + (bleed ? sizes.bleed * mmPx : 0), fonts.customText10_12 || fonts.kozgo, parseFloat($('text12Size')?.value || 12.5), parseFloat($('text12Spacing')?.value || 236), 0, fc, 'left', fonts.ar, dpiVal);

    if ($('showQR')?.checked && qrImage) {
        const qx = w - 8.5 * mmPx - 23 * mmPx + (bleed ? sizes.bleed * mmPx : 0), 
              qy = 23 * mmPx + (bleed ? sizes.bleed * mmPx : 0), 
              qs = 23 * mmPx;
        ctx.fillStyle = $('qrSquareColor')?.value || '#2086D1';
        ctx.fillRect(qx, qy, qs, qs);
        ctx.drawImage(qrImage, qx, qy, qs, qs);
    }

    if (customImage && $('imageLayer')?.value === 'foreground') {
        ctx.drawImage(customImage, bleed ? sizes.bleed * mmPx : 0, bleed ? sizes.bleed * mmPx : 0, w - (bleed ? 2 * sizes.bleed * mmPx : 0), h - (bleed ? 2 * sizes.bleed * mmPx : 0));
    }
};

const setPreviewScale = (scale) => {
    console.log('Setting preview scale to:', scale);
    previewScale = scale;
    if (ctx) drawTicket(70);
};

const downloadTicket = (dpiVal) => {
    const loading = $('loading');
    if (loading) loading.style.display = 'block';
    drawTicket(dpiVal).then(() => {
        const link = document.createElement('a');
        link.download = `ticket-${dpiVal}dpi.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        if (loading) loading.style.display = 'none';
    }).catch((err) => {
        console.error('Download error:', err);
        alert(langs[currentLang].downloadError);
        if (loading) loading.style.display = 'none';
    });
};

const generateQRCode = () => {
    const text = $('qrCodeText')?.value.trim();
    if (!text) {
        alert(langs[currentLang].qrGenerateError);
        return;
    }
    try {
        qrImage = null;
        const qrCanvas = document.createElement('canvas');
        new QRCode(qrCanvas, { 
            text: text, 
            width: 300, 
            height: 300,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        qrImage = new Image();
        qrImage.src = qrCanvas.toDataURL('image/png');
        qrImage.onload = () => {
            console.log('QR code generated and loaded.');
            if (ctx) drawTicket(70);
        };
        qrImage.onerror = () => {
            console.error('QR image load error');
            alert(langs[currentLang].qrLoadError);
        };
    } catch (e) {
        console.error('QR generation error:', e);
        alert(langs[currentLang].qrGenerateError);
    }
};

const loadFont = (inputId, fontKey) => {
    const input = $(inputId);
    if (!input) return;
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const font = new FontFace(fontKey, ev.target.result);
            font.load().then((loadedFont) => {
                document.fonts.add(loadedFont);
                fonts[fontKey] = loadedFont.family;
                if (ctx) drawTicket(70);
            }).catch((err) => {
                console.error('Font load error:', err);
                alert(langs[currentLang].fontLoadError);
            });
        };
        reader.onerror = () => alert(langs[currentLang].qrReadError);
        reader.readAsArrayBuffer(file);
    });
};

loadFont('customFontRect1', 'customRect1');
loadFont('customFontText2_3', 'customText2_3');
loadFont('customFontText4_6', 'customText4_6');
loadFont('customFontText10_12', 'customText10_12');

$('qrCodeInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
        alert(langs[currentLang].qrFormatError);
        return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
        qrImage = new Image();
        qrImage.src = ev.target.result;
        qrImage.onload = () => {
            console.log('QR image uploaded and loaded.');
            if (ctx) drawTicket(70);
        };
        qrImage.onerror = () => alert(langs[currentLang].qrLoadError);
    };
    reader.onerror = () => alert(langs[currentLang].qrReadError);
    reader.readAsDataURL(file);
});

$('customImageInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
        alert(langs[currentLang].qrFormatError);
        return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
        customImage = new Image();
        customImage.src = ev.target.result;
        customImage.onload = () => {
            console.log('Custom image loaded.');
            if (ctx) drawTicket(70);
        };
        customImage.onerror = () => alert(langs[currentLang].qrLoadError);
    };
    reader.onerror = () => alert(langs[currentLang].qrReadError);
    reader.readAsDataURL(file);
});

const toggleAdvancedMode = () => {
    console.log('Toggling advanced mode');
    document.querySelectorAll('.advanced-mode').forEach(el => el.classList.toggle('active'));
};

const changeLanguage = (lang) => {
    console.log('Changing language to:', lang);
    currentLang = lang;
    document.title = langs[lang].title;
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if (langs[lang][key]) {
            if (el.tagName === 'LABEL') {
                const textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                if (textNode) textNode.textContent = langs[lang][key] + ': ';
            } else if (el.tagName === 'BUTTON') {
                el.textContent = langs[lang][key];
            } else {
                el.textContent = langs[lang][key];
            }
        }
    });
    if (ctx) drawTicket(70);
};

document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', () => {
        console.log(`Input changed: ${input.id} = ${input.value}`);
        const val = parseFloat(input.value);
        if (input.classList.contains('opacity-input') && (val < 0 || val > 1)) {
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
        if (ctx) drawTicket(70);
    });
});

document.querySelectorAll('input:not([type="number"]), select').forEach(el => {
    el.addEventListener('input', () => {
        console.log(`Input/select changed: ${el.id} = ${el.value}`);
        if (ctx) drawTicket(70);
    });
});

$('generateQRButton')?.addEventListener('click', () => {
    console.log('Generate QR button clicked');
    generateQRCode();
});

$('download300Button')?.addEventListener('click', () => {
    console.log('Download 300 DPI clicked');
    downloadTicket(300);
});

$('download70Button')?.addEventListener('click', () => {
    console.log('Download 70 DPI clicked');
    downloadTicket(70);
});

window.addEventListener('load', () => {
    console.log('Page loaded, initializing ticket...');
    const qrCodeText = $('qrCodeText');
    if (qrCodeText) {
        qrCodeText.value = 'https://example.com';
        console.log('QR code text set to:', qrCodeText.value);
        generateQRCode();
    } else {
        console.error('qrCodeText element not found');
    }
    if (ctx) {
        console.log('Drawing ticket...');
        drawTicket(70);
    } else {
        console.error('Cannot draw ticket: Canvas context is null');
    }
});
