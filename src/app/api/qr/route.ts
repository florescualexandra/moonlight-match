import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    const { eventId, formUrl } = await req.json();

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(formUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: {
        dark: '#D4AF37',
        light: '#181c24'
      }
    });

    return NextResponse.json({
      qrCode: qrCodeDataUrl
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate QR code'
    }, { status: 500 });
  }
} 