import type { Invoice } from "./invoice-types";

const KEY = "invoices:v1";

export const loadInvoices = (): Invoice[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Invoice[];
  } catch {
    return [];
  }
};

export const saveInvoices = (invoices: Invoice[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(invoices));
};
