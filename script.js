const $ = id => {
 const element = document.getElementById(id);
 if (!element) console.warn(`Element with ID "${id}" not found`);
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
 title: 'チケットメーカー', preview: 'チケットプレビュー', custom: 'オリジナルチケット', 
 rect1Line1: 'ロゴ テキスト (1行目)', rect1Line2: 'ロゴ テキスト (2行目)', rect1Color: 'ロゴ 背景色', rect1TextColor: 'ロゴ 文字色', 
 text2: '公演', text3Line1: '生誕祭 (1行目)', text3Line2: '生誕祭 (2行目)', text4Line1: '日付 (1行目)', text4Line2: '日付 (2行目)', text5: '番号', text6: '郵便番号', textColor: '文字色 (2-6)', 
 bgColor: '全体の背景色', bgText: '背景テキスト', bgTextColor: '背景文字色', bgShadowColor: '背景影の色', 
 rect9Color: 'ボーダー 背景色', text10: '他', text11: '場所', text12: '電話番号', footerTextColor: 'ボーダー文字色', 
 qrCodeInput: 'QRコード画像', showQR: 'QRコード枠を表示', qrSquareColor: 'QR枠の色', 
 customImageInput: 'カスタム背景画像', recommendedSize: '（推奨サイズ: 65mm x 150mm）', imageLayer: '画像のレイヤー', 
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
 bgColor: '整體背景色', bgText: '背景文字', bgTextColor: '背景文字色', bgShadowColor: '背景陰影色', 
 rect9Color: '邊框 背景色', text10: '其他', text11: '場地', text12: '電話號碼', footerTextColor: '邊框文字色', 
 qrCodeInput: 'QR碼圖片', showQR: '顯示QR碼框架', qrSquareColor: 'QR框架顏色', 
 customImageInput: '自訂背景圖片', recommendedSize: '（推薦尺寸: 65mm x 150mm）', imageLayer: '圖片層次', 
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
 bgColor: '整体背景色', bgText: '背景文本', bgTextColor: '背景文字色', bgShadowColor: '背景阴影色', 
 rect9Color: '边框 背景色', text10: '其他', text11: '场地', text12: '电话号码', footerTextColor: '边框文字色', 
 qrCodeInput: 'QR码图片', showQR: '显示QR码框架', qrSquareColor: 'QR框架颜色', 
 customImageInput: '自定义背景图片', recommendedSize: '（推荐尺寸: 65mm x 150mm）', imageLayer: '图片层级', 
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
 bgColor: 'Overall Background Color', bgText: 'Background Text', bgTextColor: 'Background Text Color', bgShadowColor: 'Background Shadow Color', 
 rect9Color: 'Border Background Color', text10: 'Other', text11: 'Venue', text12: 'Phone Number', footerTextColor: 'Border Text Color', 
 qrCodeInput: 'QR Code Image', showQR: 'Show QR Code Frame', qrSquareColor: 'QR Frame Color', 
 customImageInput: 'Custom Background Image', recommendedSize: '(Recommended Size: 65mm x 150mm)', imageLayer: 'Image Layer', 
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
 bgColor: '전체 배경색', bgText: '배경 텍스트', bgTextColor: '배경 글자색', bgShadowColor: '배경 그림자 색상', 
 rect9Color: '테두리 배경색', text10: '기타', text11: '장소', text12: '전화번호', footerTextColor: '테두리 글자색', 
 qrCodeInput: 'QR코드 이미지', showQR: 'QR코드 프레임 표시', qrSquareColor: 'QR 프레임 색상', 
 customImageInput: '커스텀 배경 이미지', recommendedSize: '(추천 크기: 65mm x 150mm)', imageLayer: '이미지 레이어', 
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
 bgColor: 'สีพื้นหลังทั้งหมด', bgText: 'ข้อความพื้นหลัง', bgTextColor: 'สีข้อความพื้นหลัง', bgShadowColor: 'สีเงาพื้นหลัง', 
 rect9Color: 'สีพื้นหลังกรอบ', text10: 'อื่นๆ', text11: 'สถานที่', text12: 'หมายเลขโทรศัพท์', footerTextColor: 'สีตัวอักษรกรอบ', 
 qrCodeInput: 'รูปภาพ QR โค้ด', showQR: 'แสดงกรอบ QR โค้ด', qrSquareColor: 'สีกรอบ QR', 
 customImageInput: 'ภาพพื้นหลังที่กำหนดเอง', recommendedSize: '(ขนาดแนะนำ: 65 มม. x 150 มม.)', imageLayer: 'ชั้นของรูปภาพ', 
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
 bgColor: 'Warna Latar Keseluruhan', bgText: 'Teks Latar', bgTextColor: 'Warna Teks Latar', bgShadowColor: 'Warna Bayangan Latar', 
 rect9Color: 'Warna Latar Batas', text10: 'Lainnya', text11: 'Tempat', text12: 'Nomor Telepon', footerTextColor: 'Warna Teks Batas', 
 qrCodeInput: 'Gambar Kode QR', showQR: 'Tampilkan Bingkai Kode QR', qrSquareColor: 'Warna Bingkai QR', 
 customImageInput: 'Gambar Latar Kustom', recommendedSize: '(Ukuran Disarankan: 65mm x 150mm)', imageLayer: 'Lapisan Gambar', 
 customFontRect1: 'Font Kustom untuk Logo', customFontText2_3: 'Font Kustom untuk Pertunjukan-Pesta Ulang Tahun', customFontText4_6: 'Font Kustom untuk Tanggal-Nomor-Kode Pos', customFontText10_12: 'Font Kustom untuk Lainnya-Tempat-Nomor Telepon', 
 bleedOption: 'Dengan Bleed (+3mm)', download300: 'Unduh (300 DPI)', download70: 'Unduh (70 DPI)', advancedMode: 'Pengaturan Lanjutan', donate: 'Donasi', reportBug: 'Laporkan Bug', 
 note: '※PNG yang diunduh dalam format RGB. Gunakan Photoshop atau GIMP untuk mengonversi ke CMYK untuk pencetakan.', 
 disclaimer: 'Terinspirasi oleh tiket teater yang dibuat ulang oleh penggemar dalam pertunjukan ulang tahun anggota AKB48, situs ini dibuat agar penggemar dapat membuat dan menyimpan tiket kustom sebagai hobi. Penggunaan komersial atau ilegal dilarang. Hak milik © AKB48 dan DH Co., Ltd. Pembuat tidak bertanggung jawab.', 
 downloadError: 'Unduhan gagal. Silakan coba lagi.', inputError: 'Nilai negatif atau tidak valid tidak diperbolehkan.', opacityError: 'Opasitas harus antara 0 dan 1.', 
 qrFormatError: 'Format file tidak didukung. Pilih gambar.', qrLoadError: 'Gagal memuat gambar kode QR.', qrReadError: 'Gagal membaca file.', 
 fontLoadError: 'Gagal memuat font. Menggunakan font default.', 
 x: 'X', y: 'Y', spacing: 'Jarak Huruf', size: 'Ukuran', lineHeight: 'Jarak Baris', shadowX: 'Bayangan X', shadowY: 'Bayangan Y', shadowOpacity: 'Opasitas Bayangan', scale: 'Skala'
 }
};

function drawText(context, text, font, x, y, size, spacing, color, align = 'left', height) {
 try {
 context.font = `${size}px ${font}`;
 context.fillStyle = color;
 context.textAlign = align;
 const chars = text.split('');
 let currentX = x;
 chars.forEach(char => {
 context.fillText(char, currentX, y);
 const width = context.measureText(char).width;
 currentX += width + (spacing / 1000) * size;
 });
 return height || size;
 } catch (e) {
 console.error('Error in drawText:', e);
 return size;
 }
}

function drawBackground(context, dpiVal, bleed) {
 try {
 const bgColor = $('bgColor')?.value || '#E5EDF9';
 context.fillStyle = bgColor;
 context.fillRect(0, 0, context.canvas.width, context.canvas.height);

 const imageLayer = $('image Layer')?.value || 'background';
 if (customImage && imageLayer === 'background') {
 const customImageX = parseFloat($('customImageX')?.value || 0) * dpiVal / 25.4;
 const customImageY = parseFloat($('customImageY')?.value || 0) * dpiVal / 25.4;
 const customImageScale = parseFloat($('customImageScale')?.value || 1) || 1;
 const imgWidth = customImage.width * customImageScale;
 const imgHeight = customImage.height * customImageScale;
 context.drawImage(customImage, customImageX + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), customImageY + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), imgWidth, imgHeight);
 }

 const bgText = $('bgText')?.value || 'AKB48';
 const bgTextX = parseFloat($('bgTextX')?.value || -100) * dpiVal / 25.4;
 const bgTextY = parseFloat($('bgTextY')?.value || 0) * dpiVal / 25.4;
 const bgTextSpacing = parseFloat($('bgTextSpacing')?.value || -6000);
 const bgTextSize = parseFloat($('bgTextSize')?.value || 62) * dpiVal / 72;
 const bgTextColor = $('bgTextColor')?.value || '#FFFFFF';
 const bgShadowColor = $('bgShadowColor')?.value || '#5F96ED';
 const bgShadowX = parseFloat($('bgShadowX')?.value || 0.5) * dpiVal / 25.4;
 const bgShadowY = parseFloat($('bgShadowY')?.value || -0.4) * dpiVal / 25.4;
 const bgShadowOpacity = parseFloat($('bgShadowOpacity')?.value || 0.2) || 0.2;

 context.shadowColor = bgShadowColor;
 context.shadowOffsetX = bgShadowX;
 context.shadowOffsetY = bgShadowY;
 context.globalAlpha = Math.max(0, Math.min(1, bgShadowOpacity));

 const lineHeight = parseFloat($('bgTextLineHeight')?.value || 46) * dpiVal / 72;
 for (let y = bgTextY; y < context.canvas.height + bgTextSize; y += lineHeight) {
 for (let x = bgTextX; x < context.canvas.width + bgTextSize; x += context.measureText(bgText).width + bgTextSize) {
 drawText(context, bgText, fonts.avant, x + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), y + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), bgTextSize, bgTextSpacing, bgTextColor);
 }
 }

 context.shadowOffsetX = 0;
 context.shadowOffsetY = 0;
 context.globalAlpha = 1.0;
 } catch (e) {
 console.error('Error in drawBackground:', e);
 }
}

function drawArea1(context, dpiVal, bleed) {
 try {
 const rect1Color = $('rect1Color')?.value || '#2086D1';
 context.fillStyle = rect1Color;
 context.fillRect(bleed ? sizes.bleed * dpiVal / 25.4 : 0, bleed ? sizes.bleed * dpiVal / 25.4 : 0, 35 * dpiVal / 25.4, sizes.base.h * dpiVal / 25.4);

 const rect1Line1 = $('rect1Line1')?.value || 'AKB';
 const rect1Line1X = parseFloat($('rect1Line1X')?.value || 13.5) * dpiVal / 25.4;
 const rect1Line1Y = parseFloat($('rect1Line1Y')?.value || 12) * dpiVal / 25.4;
 const rect1Line2 = $('rect1Line2')?.value || '48';
 const rect1Line2X = parseFloat($('rect1Line2X')?.value || 13.5) * dpiVal / 25.4;
 const rect1Line2Y = parseFloat($('rect1Line2Y')?.value || 24) * dpiVal / 25.4;
 const rect1Spacing = parseFloat($('rect1Spacing')?.value || -7000);
 const rect1Line2Spacing = parseFloat($('rect1Line2Spacing')?.value || -7000);
 const rect1Size = parseFloat($('rect1Size')?.value || 47) * dpiVal / 72;
 const rect1Line2Size = parseFloat($('rect1Line2Size')?.value || 47) * dpiVal / 72;
 const rect1TextColor = $('rect1TextColor')?.value || '#FFFFFF';
 const font = fonts.customRect1 || fonts.ar;

 drawText(context, rect1Line1, font, rect1Line1X + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), rect1Line1Y + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), rect1Size, rect1Spacing, rect1TextColor);
 drawText(context, rect1Line2, font, rect1Line2X + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), rect1Line2Y + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), rect1Line2Size, rect1Line2Spacing, rect1TextColor);
 } catch (e) {
 console.error('Error in drawArea1:', e);
 }
}

function drawText2To6(context, dpiVal, bleed) {
 try {
 const text2 = $('text2')?.value || '「ここからだ」 公演';
 const text2X = parseFloat($('text2X')?.value || 37) * dpiVal / 25.4;
 const text2Y = parseFloat($('text2Y')?.value || 12) * dpiVal / 25.4;
 const text2Spacing = parseFloat($('text2Spacing')?.value || 2000);
 const text2Size = parseFloat($('text2Size')?.value || 14.2) * dpiVal / 72;
 const text3Line1 = $('text3Line1')?.value || '秋元康 生誕祭';
 const text3Line1X = parseFloat($('text3Line1X')?.value || 35) * dpiVal / 25.4;
 const text3Line1Y = parseFloat($('text3Line1Y')?.value || 19) * dpiVal / 25.4;
 const text3Line2 = $('text3Line2')?.value || 'AKB48劇場';
 const text3Line2X = parseFloat($('text3Line2X')?.value || 35) * dpiVal / 25.4;
 const text3Line2Y = parseFloat($('text3Line2Y')?.value || 25) * dpiVal / 25.4;
 const text3Spacing = parseFloat($('text3Spacing')?.value || 2000);
 const text3Line2Spacing = parseFloat($('text3Line2Spacing')?.value || 2000);
 const text3Size = parseFloat($('text3Size')?.value || 14.2) * dpiVal / 72;
 const text3Line2Size = parseFloat($('text3Line2Size')?.value || 14.2) * dpiVal / 72;
 const text4Line1 = $('text4Line1')?.value || '＜日付＞2025年05月02日（金）';
 const text4Line1X = parseFloat($('text4Line1X')?.value || 13) * dpiVal / 25.4;
 const text4Line1Y = parseFloat($('text4Line1Y')?.value || 43) * dpiVal / 25.4;
 const text4Line2 = $('text4Line2')?.value || 'OPEN：18時10分 START：18時30分 ￥3,400';
 const text4Spacing = parseFloat($('text4Spacing')?.value || 1000);
 const text4Size = parseFloat($('text4Size')?.value || 11) * dpiVal / 72;
 const text4LineHeight = parseFloat($('text4LineHeight')?.value || 14) * dpiVal / 72;
 const text5 = $('text5')?.value || '048番';
 const text5X = parseFloat($('text5X')?.value || 13) * dpiVal / 25.4;
 const text5Y = parseFloat($('text5Y')?.value || 55) * dpiVal / 25.4;
 const text5Spacing = parseFloat($('text5Spacing')?.value || 200);
 const text5Size = parseFloat($('text5Size')?.value || 16) * dpiVal / 72;
 const text6 = $('text6')?.value || '① ❘ 000－0000 ❘ ゴメン先生 様';
 const text6X = parseFloat($('text6X')?.value || 36) * dpiVal / 25.4;
 const text6Y = parseFloat($('text6Y')?.value || 55) * dpiVal / 25.4;
 const text6Spacing = parseFloat($('text6Spacing')?.value || 311);
 const text6Size = parseFloat($('text6Size')?.value || 13) * dpiVal / 72;
 const textColor = $('textColor')?.value || '#000000';
 const font2_3 = fonts.customText2_3 || fonts.kozgo;
 const font4_6 = fonts.customText4_6 || fonts.kozgo;

 drawText(context, text2, font2_3, text2X + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text2Y + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text2Size, text2Spacing, textColor);
 drawText(context, text3Line1, font2_3, text3Line1X + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text3Line1Y + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text3Size, text3Spacing, textColor);
 drawText(context, text3Line2, font2_3, text3Line2X + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text3Line2Y + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text3Line2Size, text3Line2Spacing, textColor);
 drawText(context, text4Line1, font4_6, text4Line1X + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text4Line1Y + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text4Size, text4Spacing, textColor);
 drawText(context, text4Line2, font4_6, text4Line1X + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text4Line1Y + text4LineHeight + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text4Size, text4Spacing, textColor);
 drawText(context, text5, font4_6, text5X + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text5Y + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text5Size, text5Spacing, textColor);
 drawText(context, text6, font4_6, text6X + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text6Y + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text6Size, text6Spacing, textColor);
 } catch (e) {
 console.error('Error in drawText2To6:', e);
 }
}

function drawArea9(context, dpiVal, bleed) {
 try {
 const rect9Color = $('rect9Color')?.value || '#2086D1';
 context.fillStyle = rect9Color;
 context.fillRect(bleed ? sizes.bleed * dpiVal / 25.4 : 0, (sizes.base.h - 5) * dpiVal / 25.4 + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), sizes.base.w * dpiVal / 25.4, 5 * dpiVal / 25.4);

 const text10 = $('text10')?.value || '<主催 ‧ お問い合せ>';
 const text10X = parseFloat($('text10X')?.value || 54) * dpiVal / 25.4;
 const text10Y = parseFloat($('text10Y')?.value || 63.5) * dpiVal / 25.4;
 const text10Spacing = parseFloat($('text10Spacing')?.value || 236);
 const text10Size = parseFloat($('text10Size')?.value || 7) * dpiVal / 72;
 const text11 = $('text11')?.value || 'AKB48 Theater';
 const text11X = parseFloat($('text11X')?.value || 80.5) * dpiVal / 25.4;
 const text11Y = parseFloat($('text11Y')?.value || 63.5) * dpiVal / 25.4;
 const text11Spacing = parseFloat($('text11Spacing')?.value || 238);
 const text11Size = parseFloat($('text11Size')?.value || 10) * dpiVal / 72;
 const text12 = $('text12')?.value || 'TEL:03-5298-8648';
 const text12X = parseFloat($('text12X')?.value || 108) * dpiVal / 25.4;
 const text12Y = parseFloat($('text12Y')?.value || 64) * dpiVal / 25.4;
 const text12Spacing = parseFloat($('text12Spacing')?.value || 236);
 const text12Size = parseFloat($('text12Size')?.value || 12.5) * dpiVal / 72;
 const footerTextColor = $('footerTextColor')?.value || '#FFFFFF';
 const font = fonts.customText10_12 || fonts.kozgo;

 drawText(context, text10, font, text10X + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text10Y + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text10Size, text10Spacing, footerTextColor);
 drawText(context, text11, font, text11X + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text11Y + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text11Size, text11Spacing, footerTextColor);
 drawText(context, text12, font, text12X + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text12Y + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), text12Size, text12Spacing, footerTextColor);
 } catch (e) {
 console.error('Error in drawArea9:', e);
 }
}

function drawQRCode(context, dpiVal, bleed) {
 try {
 const qrSquareColor = $('qrSquareColor')?.value || '#2086D1';
 const showQR = $('showQR')?.checked || false;
 const qrX = (sizes.base.w - 35) * dpiVal / 25.4;
 const qrY = 5 * dpiVal / 25.4;
 const qrSize = 25 * dpiVal / 25.4;

 if (showQR) {
 context.fillStyle = qrSquareColor;
 context.fillRect(qrX + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), qrY + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), qrSize, qrSize);
 }

 if (qrImage) {
 const qrPadding = 2 * dpiVal / 25.4;
 context.drawImage(qrImage, qrX + qrPadding + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), qrY + qrPadding + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), qrSize - 2 * qrPadding, qrSize - 2 * qrPadding);
 }
 } catch (e) {
 console.error('Error in drawQRCode:', e);
 }
}

function drawForegroundImage(context, dpiVal, bleed) {
 try {
 const imageLayer = $('imageLayer')?.value || 'background';
 if (customImage && imageLayer === 'foreground') {
 const customImageX = parseFloat($('customImageX')?.value || 0) * dpiVal / 25.4;
 const customImageY = parseFloat($('customImageY')?.value || 0) * dpiVal / 25.4;
 const customImageScale = parseFloat($('customImageScale')?.value || 1) || 1;
 const imgWidth = customImage.width * customImageScale;
 const imgHeight = customImage.height * customImageScale;
 context.drawImage(customImage, customImageX + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), customImageY + (bleed ? sizes.bleed * dpiVal / 25.4 : 0), imgWidth, imgHeight);
 }
 } catch (e) {
 console.error('Error in drawForegroundImage:', e);
 }
}

function drawTicket(dpiVal, bleed = false) {
 if (!ctx) {
 console.error('Canvas context not available');
 return;
 }
 try {
 const size = bleed ? dpi[dpiVal].bleed : dpi[dpiVal].base;
 canvas.width = size.w;
 canvas.height = size.h;
 canvas.style.width = `${size.w * previewScale}px`;
 canvas.style.height = `${size.h * previewScale}px`;

 drawBackground(ctx, dpiVal, bleed);
 drawArea1(ctx, dpiVal, bleed);
 drawText2To6(ctx, dpiVal, bleed);
 drawArea9(ctx, dpiVal, bleed);
 drawQRCode(ctx, dpiVal, bleed);
 drawForegroundImage(ctx, dpiVal, bleed);
 } catch (e) {
 console.error('Error in drawTicket:', e);
 }
}

const debouncedDrawTicket = debounce(() => drawTicket(70), 300);

function setPreviewScale(scale) {
 previewScale = scale;
 drawTicket(70);
}

function downloadTicket(dpiVal) {
 try {
 const bleed = $('bleedOption')?.checked || false;
 const tempCanvas = document.createElement('canvas');
 const tempCtx = tempCanvas.getContext('2d');
 const size = bleed ? dpi[dpiVal].bleed : dpi[dpiVal].base;
 tempCanvas.width = size.w;
 tempCanvas.height = size.h;

 drawBackground(tempCtx, dpiVal, bleed);
 drawArea1(tempCtx, dpiVal, bleed);
 drawText2To6(tempCtx, dpiVal, bleed);
 drawArea9(tempCtx, dpiVal, bleed);
 drawQRCode(tempCtx, dpiVal, bleed);
 drawForegroundImage(tempCtx, dpiVal, bleed);

 const link = document.createElement('a');
 link.download = `ticket_${dpiVal}dpi${bleed ? '_bleed' : ''}.png`;
 link.href = tempCanvas.toDataURL('image/png');
 link.click();
 } catch (e) {
 console.error('Error in downloadTicket:', e);
 alert(langs[currentLang].downloadError);
 }
}

function debounce(func, wait) {
 let timeout;
 return function (...args) {
 clearTimeout(timeout);
 timeout = setTimeout(() => func.apply(this, args), wait);
 };
}

function loadFont(file, fontKey) {
 try {
 const reader = new FileReader();
 reader.onload = e => {
 const font = new FontFace(fontKey, e.target.result);
 font.load().then(loadedFont => {
 document.fonts.add(loadedFont);
 fonts[fontKey] = fontKey;
 debouncedDrawTicket();
 }).catch(() => {
 console.warn(langs[currentLang].fontLoadError);
 debouncedDrawTicket();
 });
 };
 reader.readAsArrayBuffer(file);
 } catch (e) {
 console.error('Error in loadFont:', e);
 }
}

function changeLanguage() {
 currentLang = $('languageSelector')?.value || 'ja';
 document.querySelectorAll('[data-key]').forEach(el => {
 const key = el.dataset.key;
 if (langs[currentLang][key]) el.textContent = langs[currentLang][key];
 });
 document.querySelectorAll('label[data-key]').forEach(label => {
 const key = label.dataset.key;
 if (langs[currentLang][key]) {
 const input = label.querySelector('input') || label.querySelector('select');
 label.childNodes[0].textContent = langs[currentLang][key] + (input ? ': ' : '');
 }
 });
 document.title = langs[currentLang].title;
}

function toggleAdvancedMode() {
 const advancedElements = document.querySelectorAll('.advanced-mode');
 advancedElements.forEach(el => el.classList.toggle('active'));
 const btn = $('advancedModeBtn');
 if (btn) btn.textContent = btn.textContent === langs[currentLang].advancedMode ? '簡易設定' : langs[currentLang].advancedMode;
}

async function waitForFonts() {
 try {
 await Promise.all([
 document.fonts.load('1em ITC Avant Garde Gothic Std Extra Light'),
 document.fonts.load('1em AR ADGothicJP'),
 document.fonts.load('1em KozGoPr6N')
 ]);
 } catch (e) {
 console.warn('Font loading failed, proceeding with defaults:', e);
 }
}

// Event Listeners
if ($('languageSelector')) $('languageSelector').addEventListener('change', changeLanguage);
if ($('qrCodeInput')) $('qrCodeInput').addEventListener('change', e => {
 const file = e.target.files[0];
 if (!file || !file.type.startsWith('image/')) {
 alert(langs[currentLang].qrFormatError);
 return;
 }
 const img = new Image();
 img.onload = () => {
 qrImage = img;
 debouncedDrawTicket();
 };
 img.onerror = () => alert(langs[currentLang].qrLoadError);
 const reader = new FileReader();
 reader.onload = e => img.src = e.target.result;
 reader.onerror = () => alert(langs[currentLang].qrReadError);
 reader.readAsDataURL(file);
});
if ($('customImageInput')) $('customImageInput').addEventListener('change', e => {
 const file = e.target.files[0];
 if (!file || !file.type.startsWith('image/')) {
 alert(langs[currentLang].qrFormatError);
 return ;
 }
 const img = new Image();
 img.onload = () => {
 customImage = img;
 debouncedDrawTicket();
 };
 img.onerror = () => alert(langs[currentLang].qrLoadError);
 const reader = new FileReader();
 reader.onload = e => img.src = e.target.result;
 reader.onerror = () => alert(langs[currentLang].qrReadError);
 reader.readAsDataURL(file);
});
if ($('customFontRect1')) $('customFontRect1').addEventListener('change', e => loadFont(e.target.files[0], 'customRect1'));
if ($('customFontText2_3')) $('customFontText2_3').addEventListener('change', e => loadFont(e.target.files[0], 'customText2_3'));
if ($('customFontText4_6')) $('customFontText4_6').addEventListener('change', e => loadFont(e.target.files[0], 'customText4_6'));
if ($('customFontText10_12')) $('customFontText10_12').addEventListener('change', e => loadFont(e.target.files[0], 'customText10_12'));

document.querySelectorAll('input[type="number"]').forEach(input => {
 input.addEventListener('input', e => {
 const errorMsg = $(`${e.target.id}-error`);
 if (errorMsg) {
 if (e.target.value < 0) {
 errorMsg.textContent = langs[currentLang].inputError;
 errorMsg.style.display = 'inline';
 e.target.value = 0;
 } else if (e.target.classList.contains('opacity-input') && (e.target.value < 0 || e.target.value > 1)) {
 errorMsg.textContent = langs[currentLang].opacityError;
 errorMsg.style.display = 'inline';
 e.target.value = Math.max(0, Math.min(1, e.target.value));
 } else {
 errorMsg.style.display = 'none';
 }
 }
 debouncedDrawTicket();
 });
});

document.querySelectorAll('input:not([type="number"]), select').forEach(input => {
 input.addEventListener('input', debouncedDrawTicket);
});

if ($('scale50Button')) $('scale50Button').addEventListener('click', () => setPreviewScale(0.5));
if ($('scale100Button')) $('scale100Button').addEventListener('click', () => setPreviewScale(1.0));
if ($('scale150Button')) $('scale150Button').addEventListener('click', () => setPreviewScale(1.5));
if ($('scale200Button')) $('scale200Button').addEventListener('click', () => setPreviewScale(2.0));
if ($('download300Button')) $('download300Button').addEventListener('click', () => downloadTicket(300));
if ($('download70Button')) $('download70Button').addEventListener('click', () => downloadTicket(70));
if ($('advancedModeBtn')) $('advancedModeBtn').addEventListener('click', toggleAdvancedMode);

window.onload = async () => {
 await waitForFonts();
 changeLanguage();
 setPreviewScale(window.innerWidth <= 768 ? 0.5 : 1.0);
 drawTicket(70);
};
