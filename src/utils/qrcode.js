
import qrcode from "qrcode"

async function generateQRCodeFromJSON(jsonData) {
  try {
    const jsonString = JSON.stringify(jsonData);

    const qrCodeDataUrl = await QRCode.toDataURL(jsonString);

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}


export {generateQRCodeFromJSON}