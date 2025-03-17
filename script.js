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
    300: { base: { w: 1843, h: 839 }, bleed: { w: 1844, h: 840 } },
    70: { base: { w: Math.round(150 * 70 / 25.4), h: Math.round(65 * 70 / 25.4) }, bleed: { w: Math.round((150 + 2 * 3) * 70 / 25.4), h: Math.round((65 + 2 * 3) * 70 / 25.4) } }
};

let qrImage = null, customImage = null, previewScale = 1.0;
let currentLang = 'ja';

const langs = {
    ja: {
        title: 'チケットメーカー', preview: 'チケットプレビュー', custom: 'オリジナルチケット', 
        rect1Line1: 'ロゴ テキスト (1行目)', rect1Line2: 'ロゴ テキスト (2行目)', rect1Color: 'ロゴ 背景色', rect1TextColor: 'ロゴ 文字色', 
        text2: '公演', text3Line1: '生誕祭 (1行目)', text3Line2: '生誕祭 (2行目)', text4Line1: '日付 (1行目)', text4Line2: '日付 (2行目)', text5: '番号', text6: '郵便番号', textColor: '文字色 (2-6)', 
        bgColor: '全体の背景色', bgText: '背景テキスト', bgTextColor: '背景文字色', bgTextOpacity: '背景文字透明度', bgShadowColor: '背景影の色', 
        rect9Color: 'ボーダー 背景色', text10: '他', text11: '場所', text12: '電話番号', footerTextColor: 'ボーダー文字色', 
        qrCodeInput: 'QRコード画像', showQR: 'QRコード枠を表示', qrSquareColor: 'QR枠の色', 
        customBgImageInput: 'カスタム背景画像', recommendedSize: '（推奨サイズ: 65mm x 150mm）', 
        customFontRect1: 'ロゴ用カスタムフォント', customFontText2_3: '公演-生誕祭用カスタムフォント', customFontText4_6: '日付-番号-郵便番号用カスタムフォント', customFontText10_12: '他-場所-電話番号用カスタムフォント', 
        bleedOption: '裁ち落とし付き (+3mm)', download300: 'ダウンロード (300 DPI)', download70: 'ダウンロード (70 DPI)', advancedMode: '詳細設定', donate: 'カンパ', reportBug: '報錯', 
        note: '※ダウンロードしたPNGはRGBです。印刷用にCMYKへ変換するにはPhotoshopかGIMPをご利用ください。', 
        disclaimer: 'AKB48メンバーの生誕祭劇場公演で、ファンの皆様が復刻した劇場チケットに感動し、趣味としてファンが自作チケットを保存できるウェブサイトを制作いたしました。商業目的や違法な使用はご遠慮ください。権利は© AKB48及び株式会社DHに帰属し、制作者は責任を負いかねます。何卒ご了承ください。', 
        downloadError: 'ダウンロードに失敗しました。もう一度お試しください。', inputError: '負の値または無効な値は使用できません。', opacityError: '透明度は0から1の間で入力してください。', 
        qrFormatError: 'サポートされていないファイル形式です。画像を選択してください。', qrLoadError: 'QRコード画像の読み込みに失敗しました。', qrReadError: 'ファイルの読み込みに失敗しました。', 
        fontLoadError: 'フォントの読み込みに失敗しました。デフォルトフォントを使用します。', 
        x: 'X', y: 'Y', spacing: '字間', size: 'サイズ', lineHeight: '行間', shadowX: 'シャドウX', shadowY: 'シャドウY', shadowOpacity: 'シャドウ透明度', scale: '縮放'
    },
    'zh-TW': {
        title: '門票生成器', preview: '門票預覽', custom: '自訂門票', 
        rect1Line1: '標誌 文字 (第1行)', rect1Line2: '標誌 文字 (第2行)', rect1Color: '標誌 背景色', rect1TextColor: '標誌 文字色', 
        text2: '演出', text3Line1: '生日祭 (第1行)', text3Line2: '生日祭 (第2行)', text4Line1: '日期 (第1行)', text4Line2: '日期 (第2行)', text5: '編號', text6: '郵遞區號', textColor: '文字色 (2-6)', 
        bgColor: '整體背景色', bgText: '背景文字', bgTextColor: '背景文字色', bgTextOpacity: '背景文字透明度', bgShadowColor: '背景陰影色', 
        rect9Color: '邊框 背景色', text10: '其他', text11: '場地', text12: '電話號碼', footerTextColor: '邊框文字色', 
        qrCodeInput: 'QR碼圖片', showQR: '顯示QR碼框架', qrSquareColor: 'QR框架顏色', 
        customBgImageInput: '自訂背景圖片', recommendedSize: '（推薦尺寸: 65mm x 150mm）', 
        customFontRect1: '標誌用自訂字體', customFontText2_3: '演出-生日祭用自訂字體', customFontText4_6: '日期-編號-郵遞區號用自訂字體', customFontText10_12: '其他-場地-電話號碼用自訂字體', 
        bleedOption: '含出血位 (+3mm)', download300: '下載 (300 DPI)', download70: '下載 (70 DPI)', advancedMode: '進階設定', donate: '捐款', reportBug: '回報錯誤', 
        note: '※下載的PNG為RGB格式。如需印刷用CMYK，請使用Photoshop或GIMP轉換。', 
        disclaimer: '鑑於AKB48成員生誕祭劇場公演中，粉絲復刻的劇場門票令人感動，故製作此網站，讓粉絲可自製門票並保存。此網站純為興趣製作，請勿用於商業或非法用途。版權歸© AKB48及株式会社DH所有，製作者不承擔任何責任。', 
        downloadError: '下載失敗，請重試。', inputError: '不可使用負值或無效值。', opacityError: '透明度需在0到1之間。', 
        qrFormatError: '不支援的檔案格式，請選擇圖片。', qrLoadError: 'QR碼圖片載入失敗。', qrReadError: '檔案讀取失敗。', 
        fontLoadError: '字體載入失敗，將使用預設字體。', 
        x: 'X', y: 'Y', spacing: '字距', size: '大小', lineHeight: '行距', shadowX: '陰影X', shadowY: '陰影Y', shadowOpacity: '陰影透明度', scale: '縮放'
    },
    'zh-CN': {
        title: '门票生成器', preview: '门票预览', custom: '自定义门票', 
        rect1Line1: '标志 文本 (第1行)', rect1Line2: '标志 文本 (第2行)', rect1Color: '标志 背景色', rect1TextColor: '标志 文字色', 
        text2: '演出', text3Line1: '生日祭 (第1行)', text3Line2: '生日祭 (第2行)', text4Line1: '日期 (第1行)', text4Line2: '日期 (第2行)', text5: '编号', text6: '邮递区号', textColor: '文字色 (2-6)', 
        bgColor: '整体背景色', bgText: '背景文本', bgTextColor: '背景文字色', bgTextOpacity: '背景文字透明度', bgShadowColor: '背景阴影色', 
        rect9Color: '边框 背景色', text10: '其他', text11: '场地', text12: '电话号码', footerTextColor: '边框文字色', 
        qrCodeInput: 'QR码图片', showQR: '显示QR码框架', qrSquareColor: 'QR框架颜色', 
        customBgImageInput: '自定义背景图片', recommendedSize: '（推荐尺寸: 65mm x 150mm）', 
        customFontRect1: '标志用自定义字体', customFontText2_3: '演出-生日祭用自定义字体', customFontText4_6: '日期-编号-邮递区号用自定义字体', customFontText10_12: '其他-场地-电话号码用自定义字体', 
        bleedOption: '含出血位 (+3mm)', download300: '下载 (300 DPI)', download70: '下载 (70 DPI)', advancedMode: '高级设置', donate: '捐款', reportBug: '报告错误', 
        note: '※下载的PNG为RGB格式。如需印刷用CMYK，请使用Photoshop或GIMP转换。', 
        disclaimer: '鉴于AKB48成员诞辰祭剧场公演中，粉丝复刻的剧场门票令人感动，故制作此网站，让粉丝可自制门票并保存。此网站纯为兴趣制作，请勿用于商业或非法用途。版权归© AKB48及株式会社DH所有，制作者不承担任何责任。', 
        downloadError: '下载失败，请重试。', inputError: '不可使用负值或无效值。', opacityError: '透明度需在0到1之间。', 
        qrFormatError: '不支持的文件格式，请选择图片。', qrLoadError: 'QR码图片加载失败。', qrReadError: '文件读取失败。', 
        fontLoadError: '字体加载失败，将使用默认字体。', 
        x: 'X', y: 'Y', spacing: '字距', size: '大小', lineHeight: '行距', shadowX: '阴影X', shadowY: '阴影Y', shadowOpacity: '阴影透明度', scale: '缩放'
    },
    en: {
        title: 'Ticket Maker', preview: 'Ticket Preview', custom: 'Custom Ticket', 
        rect1Line1: 'Logo Text (Line 1)', rect1Line2: 'Logo Text (Line 2)', rect1Color: 'Logo Background Color', rect1TextColor: 'Logo Text Color', 
        text2: 'Performance', text3Line1: 'Birthday (Line 1)', text3Line2: 'Birthday (Line 2)', text4Line1: 'Date (Line 1)', text4Line2: 'Date (Line 2)', text5: 'Number', text6: 'Postal Code', textColor: 'Text Color (2-6)', 
        bgColor: 'Overall Background Color', bgText: 'Background Text', bgTextColor: 'Background Text Color', bgTextOpacity: 'Background Text Opacity', bgShadowColor: 'Background Shadow Color', 
        rect9Color: 'Border Background Color', text10: 'Other', text11: 'Venue', text12: 'Phone Number', footerTextColor: 'Border Text Color', 
        qrCodeInput: 'QR Code Image', showQR: 'Show QR Code Frame', qrSquareColor: 'QR Frame Color', 
        customBgImageInput: 'Custom Background Image', recommendedSize: '(Recommended Size: 65mm x 150mm)', 
        customFontRect1: 'Custom Font for Logo', customFontText2_3: 'Custom Font for Performance-Birthday', customFontText4_6: 'Custom Font for Date-Number-Postal Code', customFontText10_12: 'Custom Font for Other-Venue-Phone Number', 
        bleedOption: 'With Bleed (+3mm)', download300: 'Download (300 DPI)', download70: 'Download (70 DPI)', advancedMode: 'Advanced Settings', donate: 'Donate', reportBug: 'Report Bug', 
        note: '※Downloaded PNG is in RGB. Use Photoshop or GIMP to convert to CMYK for printing.', 
        disclaimer: 'Inspired by AKB48 member birthday theater performances, this site was created for fans to save custom tickets as a hobby. Commercial or illegal use is prohibited. Rights belong to © AKB48 and DH Co., Ltd. The creator assumes no responsibility.', 
        downloadError: 'Download failed. Please try again.', inputError: 'Negative or invalid values are not allowed.', opacityError: 'Opacity must be between 0 and 1.', 
        qrFormatError: 'Unsupported file format. Please select an image.', qrLoadError: 'Failed to load QR code image.', qrReadError: 'Failed to read file.', 
        fontLoadError: 'Failed to load font. Using default font.', 
        x: 'X', y: 'Y', spacing: 'Letter Spacing', size: 'Size', lineHeight: 'Line Height', shadowX: 'Shadow X', shadowY: 'Shadow Y', shadowOpacity: 'Shadow Opacity', scale: 'Scale'
    },
    ko: {
        title: '티켓 메이커', preview: '티켓 미리보기', custom: '커스텀 티켓', 
        rect1Line1: '로고 텍스트 (1행)', rect1Line2: '로고 텍스트 (2행)', rect1Color: '로고 배경색', rect1TextColor: '로고 글자색', 
        text2: '공연', text3Line1: '생일 축제 (1행)', text3Line2: '생일 축제 (2행)', text4Line1: '날짜 (1행)', text4Line2: '날짜 (2행)', text5: '번호', text6: '우편번호', textColor: '글자색 (2-6)', 
        bgColor: '전체 배경색', bgText: '배경 텍스트', bgTextColor: '배경 글자색', bgTextOpacity: '배경 글자 투명도', bgShadowColor: '배경 그림자 색상', 
        rect9Color: '테두리 배경색', text10: '기타', text11: '장소', text12: '전화번호', footerTextColor: '테두리 글자색', 
        qrCodeInput: 'QR코드 이미지', showQR: 'QR코드 프레임 표시', qrSquareColor: 'QR 프레임 색상', 
        customBgImageInput: '커스텀 배경 이미지', recommendedSize: '(추천 크기: 65mm x 150mm)', 
        customFontRect1: '로고용 커스텀 폰트', customFontText2_3: '공연-생일 축제용 커스텀 폰트', customFontText4_6: '날짜-번호-우편번호용 커스텀 폰트', customFontText10_12: '기타-장소-전화번호용 커스텀 폰트', 
        bleedOption: '블리드 포함 (+3mm)', download300: '다운로드 (300 DPI)', download70: '다운로드 (70 DPI)', advancedMode: '고급 설정', donate: '기부', reportBug: '버그 신고', 
        note: '※다운로드한 PNG는 RGB입니다. 인쇄용 CMYK로 변환하려면 Photoshop 또는 GIMP를 사용하세요.', 
        disclaimer: 'AKB48 멤버 생일 공연에서 팬들이 복각한 극장 티켓에 감동받아, 팬들이 취미로 티켓을 제작하고 저장할 수 있는 웹사이트를 만들었습니다. 상업적 또는 불법 사용은 금지됩니다. 권리는 © AKB48 및 DH 주식회사에 있으며, 제작자는 책임을 지지 않습니다.', 
        downloadError: '다운로드에 실패했습니다. 다시 시도하세요.', inputError: '음수 또는 유효하지 않은 값은 사용할 수 없습니다.', opacityError: '투명도는 0에서 1 사이로 입력하세요.', 
        qrFormatError: '지원되지 않는 파일 형식입니다. 이미지를 선택하세요.', qrLoadError: 'QR코드 이미지 로드에 실패했습니다.', qrReadError: '파일 읽기에 실패했습니다.', 
        fontLoadError: '폰트 로드에 실패했습니다. 기본 폰트를 사용합니다.', 
        x: 'X', y: 'Y', spacing: '자간', size: '크기', lineHeight: '행간', shadowX: '그림자 X', shadowY: '그림자 Y', shadowOpacity: '그림자 투명도', scale: '축척'
    },
    th: {
        title: 'เครื่องทำตั๋ว', preview: 'ตัวอย่างตั๋ว', custom: 'ตั๋วที่กำหนดเอง', 
        rect1Line1: 'ข้อความโลโก้ (บรรทัดที่ 1)', rect1Line2: 'ข้อความโลโก้ (บรรทัดที่ 2)', rect1Color: 'สีพื้นหลังโลโก้', rect1TextColor: 'สีตัวอักษรโลโก้', 
        text2: 'การแสดง', text3Line1: 'งานฉลองวันเกิด (บรรทัดที่ 1)', text3Line2: 'งานฉลองวันเกิด (บรรทัดที่ 2)', text4Line1: 'วันที่ (บรรทัดที่ 1)', text4Line2: 'วันที่ (บรรทัดที่ 2)', text5: 'หมายเลข', text6: 'รหัสไปรษณีย์', textColor: 'สีตัวอักษร (2-6)', 
        bgColor: 'สีพื้นหลังทั้งหมด', bgText: 'ข้อความพื้นหลัง', bgTextColor: 'สีข้อความพื้นหลัง', bgTextOpacity: 'ความโปร่งใสข้อความพื้นหลัง', bgShadowColor: 'สีเงาพื้นหลัง', 
        rect9Color: 'สีพื้นหลังกรอบ', text10: 'อื่นๆ', text11: 'สถานที่', text12: 'หมายเลขโทรศัพท์', footerTextColor: 'สีตัวอักษรกรอบ', 
        qrCodeInput: 'รูปภาพ QR โค้ด', showQR: 'แสดงกรอบ QR โค้ด', qrSquareColor: 'สีกรอบ QR', 
        customBgImageInput: 'รูปภาพพื้นหลังที่กำหนดเอง', recommendedSize: '(ขนาดแนะนำ: 65 มม. x 150 มม.)', 
        customFontRect1: 'ฟอนต์ที่กำหนดเองสำหรับโลโก้', customFontText2_3: 'ฟอนต์ที่กำหนดเองสำหรับการแสดง-งานฉลองวันเกิด', customFontText4_6: 'ฟอนต์ที่กำหนดเองสำหรับวันที่-หมายเลข-รหัสไปรษณีย์', customFontText10_12: 'ฟอนต์ที่กำหนดเองสำหรับอื่นๆ-สถานที่-หมายเลขโทรศัพท์', 
        bleedOption: 'รวมระยะตัดขอบ (+3 มม.)', download300: 'ดาวน์โหลด (300 DPI)', download70: 'ดาวน์โหลด (70 DPI)', advancedMode: 'การตั้งค่าขั้นสูง', donate: 'บริจาค', reportBug: 'รายงานข้อผิดพลาด', 
        note: '※PNG ที่ดาวน์โหลดเป็น RGB หากต้องการใช้ CMYK สำหรับการพิมพ์ กรุณาแปลงด้วย Photoshop หรือ GIMP', 
        disclaimer: 'ได้รับแรงบันดาลใจจากตั๋วโรงละครที่แฟน ๆ สร้างขึ้นในงานฉลองวันเกิดของสมาชิก AKB48 เว็บไซต์นี้สร้างขึ้นเพื่อให้แฟน ๆ สามารถทำตั๋วเองและเก็บไว้เป็นงานอดิเรก ห้ามใช้เพื่อการค้าหรือผิดกฎหมาย สิทธิ์เป็นของ © AKB48 และบริษัท DH ผู้สร้างไม่รับผิดชอบใด ๆ', 
        downloadError: 'การดาวน์โหลดล้มเหลว กรุณาลองใหม่', inputError: 'ไม่สามารถใช้ค่าลบหรือค่าที่ไม่ถูกต้องได้', opacityError: 'ความโปร่งใสต้องอยู่ระหว่าง 0 ถึง 1', 
        qrFormatError: 'รูปแบบไฟล์ไม่รองรับ กรุณาเลือกภาพ', qrLoadError: 'โหลดภาพ QR โค้ดไม่สำเร็จ', qrReadError: 'อ่านไฟล์ไม่สำเร็จ', 
        fontLoadError: 'โหลดฟอนต์ไม่สำเร็จ จะใช้ฟอนต์เริ่มต้น', 
        x: 'X', y: 'Y', spacing: 'ระยะห่างตัวอักษร', size: 'ขนาด', lineHeight: 'ระยะห่างบรรทัด', shadowX: 'เงา X', shadowY: 'เงา Y', shadowOpacity: 'ความโปร่งใสของเงา', scale: 'สเกล'
    },
    id: {
        title: 'Pembuat Tiket', preview: 'Pratinjau Tiket', custom: 'Tiket Kustom', 
        rect1Line1: 'Teks Logo (Baris 1)', rect1Line2: 'Teks Logo (Baris 2)', rect1Color: 'Warna Latar Logo', rect1TextColor: 'Warna Teks Logo', 
        text2: 'Pertunjukan', text3Line1: 'Pesta Ulang Tahun (Baris 1)', text3Line2: 'Pesta Ulang Tahun (Baris 2)', text4Line1: 'Tanggal (Baris 1)', text4Line2: 'Tanggal (Baris 2)', text5: 'Nomor', text6: 'Kode Pos', textColor: 'Warna Teks (2-6)', 
        bgColor: 'Warna Latar Keseluruhan', bgText: 'Teks Latar', bgTextColor: 'Warna Teks Latar', bgTextOpacity: 'Opasitas Teks Latar', bgShadowColor: 'Warna Bayangan Latar', 
        rect9Color: 'Warna Latar Batas', text10: 'Lainnya', text11: 'Tempat', text12: 'Nomor Telepon', footerTextColor: 'Warna Teks Batas', 
        qrCodeInput: 'Gambar Kode QR', showQR: 'Tampilkan Bingkai Kode QR', qrSquareColor: 'Warna Bingkai QR', 
        customBgImageInput: 'Gambar Latar Kustom', recommendedSize: '(Ukuran Disarankan: 65mm x 150mm)', 
        customFontRect1: 'Font Kustom untuk Logo', customFontText2_3: 'Font Kustom untuk Pertunjukan-Pesta Ulang Tahun', customFontText4_6: 'Font Kustom untuk Tanggal-Nomor-Kode Pos', customFontText10_12: 'Font Kustom untuk Lainnya-Tempat-Nomor Telepon', 
        bleedOption: 'Dengan Bleed (+3mm)', download300: 'Unduh (300 DPI)', download70: 'Unduh (70 DPI)', advancedMode: 'Pengaturan Lanjutan', donate: 'Donasi', reportBug: 'Laporkan Bug', 
        note: '※PNG yang diunduh dalam format RGB. Gunakan Photoshop atau GIMP untuk mengonversi ke CMYK untuk pencetakan.', 
        disclaimer: 'Terinspirasi dari tiket teater yang dibuat ulang oleh penggemar dalam pertunjukan ulang tahun anggota AKB48, situs ini dibuat agar penggemar dapat membuat dan menyimpan tiket sebagai hobi. Penggunaan komersial atau ilegal dilarang. Hak cipta milik © AKB48 dan DH Co., Ltd. Pembuat tidak bertanggung jawab.', 
        downloadError: 'Gagal mengunduh. Silakan coba lagi.', inputError: 'Nilai negatif atau tidak valid tidak diperbolehkan.', opacityError: 'Opasitas harus antara 0 dan 1.', 
        qrFormatError: 'Format file tidak didukung. Pilih gambar.', qrLoadError: 'Gagal memuat gambar kode QR.', qrReadError: 'Gagal membaca file.', 
        fontLoadError: 'Gagal memuat font. Menggunakan font default.', 
        x: 'X', y: 'Y', spacing: 'Jarak Huruf', size: 'Ukuran', lineHeight: 'Jarak Baris', shadowX: 'Bayangan X', shadowY: 'Bayangan Y', shadowOpacity: 'Opasitas Bayangan', scale: 'Skala'
    }
};

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
            context.font = `${size * ptPx}px ${isAlt ? altFont : font}`;
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
    context.globalAlpha = 1; // Reset alpha
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
    if ($('showQR')?.checked) {
        // QR Code 位置固定相對於基礎尺寸右下角，不隨裁切邊偏移
        const qrRightMargin = 8.5 * mmPx; // 距離右邊 8.5mm
        const qrTopMargin = 23 * mmPx;   // 距離頂部 23mm
        const qs = 23 * mmPx;            // QR Code 尺寸 23mm x 23mm
        const qx = w - qrRightMargin - qs; // 從右邊計算位置
        const qy = qrTopMargin;           // 固定從頂部計算
        context.fillStyle = $('qrSquareColor')?.value || '#2086D1';
        context.fillRect(qx, qy, qs, qs);
        if (qrImage) {
            context.drawImage(qrImage, qx, qy, qs, qs);
        }
    }
};

const drawTicket = async (dpiVal, context = ctx) => {
    if (!context) {
        console.error('Cannot draw ticket: Canvas context is null');
        return;
    }
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
    console.log('Setting preview scale to:', scale);
    previewScale = scale;
    if (window.innerWidth <= 768 && window.matchMedia("(orientation: portrait)").matches) {
        previewScale = Math.min(scale, window.innerWidth / dpi[70].base.w * 0.8);
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
    console.log(`Downloading ticket at ${dpiVal} DPI`);
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
    console.log('Download triggered');

    // Restore preview canvas
    const previewW = dpi[70].base.w;
    const previewH = dpi[70].base.h;
    canvas.width = previewW;
    canvas.height = previewH;
    canvas.style.width = `${previewW * previewScale}px`;
    canvas.style.height = `${previewH * previewScale}px`;
    await drawTicket(70);
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
            console.log(`Custom font ${fontKey} loaded`);
            debouncedDrawTicket(70);
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

const changeLanguage = (lang) => {
    console.log('Changing language to:', lang);
    currentLang = lang;
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (langs[lang][key]) {
            if (el.tagName === 'LABEL') {
                const input = el.querySelector('input, select');
                if (input) {
                    const textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                    if (textNode) {
                        textNode.textContent = langs[lang][key] + ' ';
                    }
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
    console.log('Toggling advanced mode');
    const advancedElements = document.querySelectorAll('.advanced-mode');
    advancedElements.forEach(el => el.classList.toggle('active'));
    const btn = $('advancedModeBtn');
    btn.textContent = btn.textContent === langs[currentLang].advancedMode ? '簡易設定' : langs[currentLang].advancedMode;
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
        console.log('All fonts loaded');
    } catch (err) {
        console.error('Font loading failed:', err);
        alert(langs[currentLang].fontLoadError);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    $('languageSelector')?.addEventListener('change', (e) => changeLanguage(e.target.value));
    $('qrCodeInput')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            alert(langs[currentLang].qrFormatError);
            qrImage = null;
            debouncedDrawTicket(70);
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            qrImage = new Image();
            qrImage.src = event.target.result;
            qrImage.onload = () => {
                console.log('QR code image uploaded successfully');
                debouncedDrawTicket(70);
            };
            qrImage.onerror = () => {
                console.error('Failed to load QR code image');
                alert(langs[currentLang].qrLoadError);
                qrImage = null;
                debouncedDrawTicket(70);
            };
        };
        reader.onerror = () => {
            console.error('Failed to read QR code file');
            alert(langs[currentLang].qrReadError);
            qrImage = null;
            debouncedDrawTicket(70);
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
                debouncedDrawTicket(70);
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
            debouncedDrawTicket(70);
        });
    });

    document.querySelectorAll('input:not([type="number"]), select').forEach(el => {
        if (el.id !== 'languageSelector') {
            el.addEventListener('input', () => {
                console.log(`Input/select changed: ${el.id} = ${el.value}`);
                debouncedDrawTicket(70);
            });
        }
    });

    $('download300Button')?.addEventListener('click', () => downloadTicket(300));
    $('download70Button')?.addEventListener('click', () => downloadTicket(70));
    $('scale50Button')?.addEventListener('click', () => setPreviewScale(0.5));
    $('scale100Button')?.addEventListener('click', () => setPreviewScale(1.0));
    $('scale150Button')?.addEventListener('click', () => setPreviewScale(1.5));
    $('scale200Button')?.addEventListener('click', () => setPreviewScale(2.0));
    $('advancedModeBtn')?.addEventListener('click', toggleAdvancedMode);
});

window.onload = async () => {
    console.log('Page loaded');
    await waitForFonts();
    console.log('Fonts loaded, initializing ticket');
    changeLanguage('ja');
    if (window.innerWidth <= 768 && window.matchMedia("(orientation: portrait)").matches) {
        previewScale = Math.min(1.0, window.innerWidth / dpi[70].base.w * 0.8);
    } else {
        previewScale = 1.0;
    }
    await drawTicket(70);
};
