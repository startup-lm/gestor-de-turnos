import {
  Banknote,
  Wallet,
  ArrowRightLeft,
  Coins,
  CreditCard,
  DollarSign,
} from "lucide-react";

export function getPaymentMethodIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("efectivo")) return Banknote;
  if (lower.includes("mercado") || lower.includes("mp")) return Wallet;
  if (lower.includes("transfer")) return ArrowRightLeft;
  if (lower.includes("crédito") || lower.includes("credito")) return Coins;
  if (lower.includes("débito") || lower.includes("debito") || lower.includes("tarjeta")) return CreditCard;
  return DollarSign;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
