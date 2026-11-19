/**
 * Gerador oficial de PIX BR Code (padrão EMVCo / Banco Central do Brasil)
 * com cálculo exato de tamanhos TLV e checksum CRC16-CCITT (polinômio 0x1021).
 */

export const OFFICIAL_PIX_KEY = 'contato@yahhope.org';

function stripAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

function formatTlv(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16Ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadParams {
  pixKey?: string;
  merchantName?: string;
  merchantCity?: string;
  amount?: number;
  txid?: string;
}

export function generatePixPayload({
  pixKey = OFFICIAL_PIX_KEY,
  merchantName = 'YAH HOPE',
  merchantCity = 'SAO PAULO',
  amount,
  txid = '***'
}: PixPayloadParams): string {
  const cleanKey = pixKey.trim();
  const cleanName = stripAccents(merchantName).toUpperCase().slice(0, 25) || 'YAH HOPE';
  const cleanCity = stripAccents(merchantCity).toUpperCase().slice(0, 15) || 'SAO PAULO';
  const cleanTxid = (txid === '***' ? '***' : stripAccents(txid).replace(/[^a-zA-Z0-9]/g, '').slice(0, 25)) || '***';

  // 26: Merchant Account Information (GUI + Chave PIX)
  const merchantAccountInfo =
    formatTlv('00', 'br.gov.bcb.pix') +
    formatTlv('01', cleanKey);

  // 62: Additional Data Field Template (txid)
  const additionalDataField = formatTlv('05', cleanTxid);

  let payload = '';
  payload += formatTlv('00', '01'); // Payload Format Indicator
  payload += formatTlv('26', merchantAccountInfo); // Merchant Account Info
  payload += formatTlv('52', '0000'); // Merchant Category Code
  payload += formatTlv('53', '986'); // Currency: BRL (986)

  if (typeof amount === 'number' && !isNaN(amount) && amount > 0) {
    payload += formatTlv('54', amount.toFixed(2)); // Transaction Amount
  }

  payload += formatTlv('58', 'BR'); // Country Code
  payload += formatTlv('59', cleanName); // Merchant Name
  payload += formatTlv('60', cleanCity); // Merchant City
  payload += formatTlv('62', additionalDataField); // Additional Data Field
  payload += '6304'; // CRC16 header

  const crc = crc16Ccitt(payload);
  return `${payload}${crc}`;
}
