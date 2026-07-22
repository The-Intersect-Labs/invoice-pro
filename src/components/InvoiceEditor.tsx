import { useMemo } from "react";
import { Trash2, Plus } from "lucide-react";
import type { Invoice, InvoiceItem } from "@/lib/invoice-types";
import { calcTotals, currencySymbol } from "@/lib/invoice-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type Props = {
  invoice: Invoice;
  onChange: (inv: Invoice) => void;
};

export function InvoiceEditor({ invoice, onChange }: Props) {
  const totals = useMemo(() => calcTotals(invoice), [invoice]);
  const sym = currencySymbol(invoice.currency);

  const set = <K extends keyof Invoice>(k: K, v: Invoice[K]) =>
    onChange({ ...invoice, [k]: v, updatedAt: Date.now() });

  const setItem = (id: string, patch: Partial<InvoiceItem>) =>
    onChange({
      ...invoice,
      items: invoice.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      updatedAt: Date.now(),
    });

  const addItem = () =>
    onChange({
      ...invoice,
      items: [
        ...invoice.items,
        { id: crypto.randomUUID(), description: "", quantity: 1, price: 0 },
      ],
      updatedAt: Date.now(),
    });

  const removeItem = (id: string) =>
    onChange({
      ...invoice,
      items: invoice.items.filter((it) => it.id !== id),
      updatedAt: Date.now(),
    });

  const fmt = (n: number) =>
    `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      {/* Meta */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Invoice #</Label>
          <Input value={invoice.number} onChange={(e) => set("number", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={invoice.status} onValueChange={(v) => set("status", v as Invoice["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Issue Date</Label>
          <Input type="date" value={invoice.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input type="date" value={invoice.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </div>
      </section>

      <Separator />

      {/* From / To */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">From</h3>
          <Input placeholder="Your name / company" value={invoice.fromName} onChange={(e) => set("fromName", e.target.value)} />
          <Input placeholder="Email" value={invoice.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} />
          <Textarea placeholder="Address" value={invoice.fromAddress} onChange={(e) => set("fromAddress", e.target.value)} rows={3} />
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Bill To</h3>
          <Input placeholder="Client name" value={invoice.toName} onChange={(e) => set("toName", e.target.value)} />
          <Input placeholder="Email" value={invoice.toEmail} onChange={(e) => set("toEmail", e.target.value)} />
          <Textarea placeholder="Address" value={invoice.toAddress} onChange={(e) => set("toAddress", e.target.value)} rows={3} />
        </div>
      </section>

      <Separator />

      {/* Items */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Items</h3>
          <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4" /> Add item</Button>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-12 gap-2 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-1 text-right">Amount</div>
            <div className="col-span-1" />
          </div>
          {invoice.items.map((it) => (
            <div key={it.id} className="grid grid-cols-12 gap-2 px-4 py-2 items-center border-t">
              <Input className="col-span-6" placeholder="Item description" value={it.description} onChange={(e) => setItem(it.id, { description: e.target.value })} />
              <Input className="col-span-2 text-right" type="number" min={0} value={it.quantity} onChange={(e) => setItem(it.id, { quantity: Number(e.target.value) })} />
              <Input className="col-span-2 text-right" type="number" min={0} step="0.01" value={it.price} onChange={(e) => setItem(it.id, { price: Number(e.target.value) })} />
              <div className="col-span-1 text-right text-sm tabular-nums">{fmt(it.quantity * it.price)}</div>
              <div className="col-span-1 flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => removeItem(it.id)} disabled={invoice.items.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Totals + settings */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={invoice.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["USD","EUR","GBP","INR","JPY","CAD","AUD"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Discount %</Label>
              <Input type="number" min={0} value={invoice.discount} onChange={(e) => set("discount", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Tax %</Label>
              <Input type="number" min={0} value={invoice.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea placeholder="Payment terms, thank-you note, bank details…" value={invoice.notes} onChange={(e) => set("notes", e.target.value)} rows={4} />
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-5 h-fit">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{fmt(totals.subtotal)}</span></div>
            {invoice.discount > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Discount ({invoice.discount}%)</span><span className="tabular-nums">-{fmt(totals.discount)}</span></div>
            )}
            {invoice.taxRate > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span><span className="tabular-nums">{fmt(totals.tax)}</span></div>
            )}
            <Separator className="my-3" />
            <div className="flex justify-between text-lg font-semibold"><span>Total</span><span className="tabular-nums">{fmt(totals.total)}</span></div>
          </div>
        </div>
      </section>
    </div>
  );
}
