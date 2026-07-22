import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Plus, Download, Trash2, Save, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { emptyInvoice, calcTotals, currencySymbol, type Invoice } from "@/lib/invoice-types";
import { loadInvoices, saveInvoices } from "@/lib/invoice-storage";
import { downloadInvoicePDF } from "@/lib/invoice-pdf";
import { InvoiceEditor } from "@/components/InvoiceEditor";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Invoice Maker — Create, save & download professional invoices" },
      { name: "description", content: "Free invoice maker. Create, edit, save, and download beautiful PDF invoices in seconds." },
      { property: "og:title", content: "Invoice Maker" },
      { property: "og:description", content: "Create, edit, save, and download beautiful PDF invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvoicesPage,
});

function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Invoice | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setInvoices(loadInvoices());
  }, []);

  

  const startNew = () => {
    const inv = emptyInvoice();
    setDraft(inv);
    setEditingId(inv.id);
  };

  const startEdit = (inv: Invoice) => {
    setDraft({ ...inv });
    setEditingId(inv.id);
  };

  const saveDraft = () => {
    if (!draft) return;
    const exists = invoices.some((i) => i.id === draft.id);
    const next = exists
      ? invoices.map((i) => (i.id === draft.id ? draft : i))
      : [draft, ...invoices];
    setInvoices(next);
    saveInvoices(next);
    toast.success("Invoice saved");
  };

  const closeEditor = () => {
    setEditingId(null);
    setDraft(null);
  };

  const removeInvoice = (id: string) => {
    const next = invoices.filter((i) => i.id !== id);
    setInvoices(next);
    saveInvoices(next);
    toast.success("Invoice deleted");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (i) =>
        i.number.toLowerCase().includes(q) ||
        i.toName.toLowerCase().includes(q) ||
        i.fromName.toLowerCase().includes(q),
    );
  }, [invoices, query]);

  if (draft) {
    return (
      <EditorScreen
        draft={draft}
        onChange={setDraft}
        onSave={saveDraft}
        onDownload={() => downloadInvoicePDF(draft)}
        onBack={closeEditor}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Invoice Maker</h1>
              <p className="text-xs text-muted-foreground">Create, save & download professional invoices</p>
            </div>
          </div>
          <Button onClick={startNew}><Plus className="h-4 w-4" /> New invoice</Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search invoices…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <span className="text-sm text-muted-foreground">{invoices.length} total</span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed p-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-semibold">No invoices yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create your first invoice to get started.</p>
            <Button className="mt-6" onClick={startNew}><Plus className="h-4 w-4" /> New invoice</Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((inv) => {
              const totals = calcTotals(inv);
              return (
                <div
                  key={inv.id}
                  className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <button className="flex-1 text-left" onClick={() => startEdit(inv)}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{inv.number}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {inv.toName || "No client"} · Due {inv.dueDate}
                    </p>
                  </button>
                  <div className="text-right">
                    <div className="font-semibold tabular-nums">
                      {currencySymbol(inv.currency)}
                      {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-muted-foreground">{inv.currency}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => downloadInvoicePDF(inv)} title="Download PDF">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeInvoice(inv.id)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const variants: Record<Invoice["status"], string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    paid: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  };
  return (
    <Badge variant="secondary" className={variants[status]}>
      {status}
    </Badge>
  );
}

function EditorScreen({
  draft,
  onChange,
  onSave,
  onDownload,
  onBack,
}: {
  draft: Invoice;
  onChange: (inv: Invoice) => void;
  onSave: () => void;
  onDownload: () => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="font-semibold">{draft.number || "New invoice"}</h1>
              <p className="text-xs text-muted-foreground">Editing invoice</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onDownload}><Download className="h-4 w-4" /> Download PDF</Button>
            <Button onClick={onSave}><Save className="h-4 w-4" /> Save</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <InvoiceEditor invoice={draft} onChange={onChange} />
      </main>
    </div>
  );
}
