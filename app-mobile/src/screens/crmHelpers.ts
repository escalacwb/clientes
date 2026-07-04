import { Linking } from "react-native";

export function dateLabel(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

export function numberLabel(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0";
  return Math.round(Number(value)).toLocaleString("pt-BR");
}

export function normalizeBrazilPhone(value?: string | null) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("55")) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) {
    const phone = digits.slice(2);
    if (/^[6789]/.test(phone)) digits = `${digits.slice(0, 2)}9${phone}`;
  }
  if (![10, 11].includes(digits.length)) return "";
  return `55${digits}`;
}

export function openWhatsApp(phone: string | undefined, message: string) {
  const normalized = normalizeBrazilPhone(phone);
  const url = normalized
    ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  return Linking.openURL(url);
}
