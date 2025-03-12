const generateQRCode = () => {
    const text = $('qrCodeText').value.trim();
    if (!text) {
        alert(langs.ja.qrFormatError);
        return;
    }
    try {
        const qrCanvas = document.createElement('canvas');
        if (qrCodeInstance) {
            qrCodeInstance.clear();
            qrCodeInstance.makeCode(text);
        } else {
            qrCodeInstance = new QRCode(qrCanvas, {
                text: text,
                width: 300,
                height: 300,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
        qrImage = new Image();
        qrImage.src = qrCanvas.toDataURL('image/png');
        qrImage.onload = () => {
            console.log('QR碼生成並加載成功');
            drawTicket(70);
        };
        qrImage.onerror = () => {
            console.error('QR圖像加載錯誤');
            alert(langs.ja.qrLoadError);
        };
    } catch (e) {
        console.error('QR生成錯誤:', e);
        alert(langs.ja.qrGenerateError);
    }
};
