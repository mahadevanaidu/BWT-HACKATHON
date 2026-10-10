import QRCode from 'qrcode';

export interface QRCodeResult {
  dataUrl: string;
  svgString: string;
}

/**
 * Generates a QR code pointing to the public verification URL.
 */
export async function generateQRCode(verificationId: string): Promise<QRCodeResult> {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verificationUrl = `${clientUrl}/verify/${verificationId}`;

  const [dataUrl, svgString] = await Promise.all([
    QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#080A09',
        light: '#FFFFFF',
      },
    }),
    QRCode.toString(verificationUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#080A09',
        light: '#FFFFFF',
      },
    }),
  ]);

  return { dataUrl, svgString };
}

/**
 * Returns the public verification URL for a given verification ID.
 */
export function getVerificationUrl(verificationId: string): string {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${clientUrl}/verify/${verificationId}`;
}
