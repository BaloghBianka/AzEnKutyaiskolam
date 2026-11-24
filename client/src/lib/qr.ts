import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

export const passUrl = (token: string) => `${location.origin}/kikepzo/b/${token}`;

export function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } });
}
export function useQrSvg(text: string | null): string {
  const [svg, setSvg] = useState('');
  useEffect(() => { let on = true; if (text) qrSvg(text).then(s => on && setSvg(s)); return () => { on = false; }; }, [text]);
  return svg;
}
