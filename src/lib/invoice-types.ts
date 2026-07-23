export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  price: number;
};

export type Invoice = {
  id: string;
  number: string;
  status: "draft" | "sent" | "paid";
  currency: string;
  issueDate: string;
  dueDate: string;
  fromName: string;
  fromEmail: string;
  fromAddress: string;
  toName: string;
  toEmail: string;
  toAddress: string;
  items: InvoiceItem[];
  taxRate: number;
  discount: number;
  notes: string;
  updatedAt: number;
};

export const emptyInvoice = (): Invoice => ({
  id: crypto.randomUUID(),
  number: `INV-${String(Math.floor(Math.random() * 9000) + 1000)}`,
  status: "draft",
  currency: "NGN",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  fromName: "",
  fromEmail: "",
  fromAddress: "",
  toName: "",
  toEmail: "",
  toAddress: "",
  items: [
    { id: crypto.randomUUID(), description: "", quantity: 1, price: 0 },
  ],
  taxRate: 0,
  discount: 0,
  notes: "",
  updatedAt: Date.now(),
});

export const currencySymbol = (code: string) => {
  const map: Record<string, string> = {
    NGN: "₦",
    USD: "$",
  };
  return map[code] ?? code + " ";
};

export const calcTotals = (inv: Invoice) => {
  const subtotal = inv.items.reduce((s, i) => s + i.quantity * i.price, 0);
  const discount = (subtotal * (inv.discount || 0)) / 100;
  const taxable = subtotal - discount;
  const tax = (taxable * (inv.taxRate || 0)) / 100;
  const total = taxable + tax;
  return { subtotal, discount, tax, total };
};
