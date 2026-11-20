/**
 * Pakistani mobile numbers. Accepts 03XXXXXXXXX, +923XXXXXXXXX, 923XXXXXXXXX and
 * common separators (spaces, dashes). Normalises to 03XXXXXXXXX for storage.
 */
export function normalizePakistaniPhone(input: string): string | null {
  const cleaned = input.trim().replace(/[\s\-().]/g, "");
  let digits: string;
  if (/^\+923\d{9}$/.test(cleaned)) digits = `0${cleaned.slice(3)}`;
  else if (/^00923\d{9}$/.test(cleaned)) digits = `0${cleaned.slice(4)}`;
  else if (/^923\d{9}$/.test(cleaned)) digits = `0${cleaned.slice(2)}`;
  else if (/^03\d{9}$/.test(cleaned)) digits = cleaned;
  else if (/^3\d{9}$/.test(cleaned)) digits = `0${cleaned}`;
  else return null;
  return digits;
}

export function isValidPakistaniPhone(input: string): boolean {
  return normalizePakistaniPhone(input) !== null;
}

/** 03001234567 → 0300 1234567 */
export function formatPhone(phone: string): string {
  return /^03\d{9}$/.test(phone) ? `${phone.slice(0, 4)} ${phone.slice(4)}` : phone;
}

/** Hide most digits for display, e.g. 0300 ****567 */
export function maskPhone(phone: string): string {
  return /^03\d{9}$/.test(phone) ? `${phone.slice(0, 4)} ****${phone.slice(-3)}` : "****";
}
