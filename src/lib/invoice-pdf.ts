import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calcTotals, currencySymbol, type Invoice } from "./invoice-types";

const fmt = (n: number, sym: string) =>
  `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const downloadInvoicePDF = (inv: Invoice) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const sym = currencySymbol(inv.currency);
  const { subtotal, discount, tax, total } = calcTotals(inv);
  const pageW = doc.internal.pageSize.getWidth();
  const M = 48;

  // Header band
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageW, 110, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("INVOICE", M, 60);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`# ${inv.number}`, M, 82);

  doc.setFontSize(10);
  doc.text(`Issued: ${inv.issueDate}`, pageW - M, 60, { align: "right" });
  doc.text(`Due: ${inv.dueDate}`, pageW - M, 76, { align: "right" });
  doc.text(`Status: ${inv.status.toUpperCase()}`, pageW - M, 92, { align: "right" });

  // From / To
  let y = 150;
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(9);
  doc.text("FROM", M, y);
  doc.text("BILL TO", pageW / 2, y);

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(inv.fromName || "—", M, y + 18);
  doc.text(inv.toName || "—", pageW / 2, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  const fromLines = [inv.fromEmail, inv.fromAddress].filter(Boolean).join("\n").split("\n");
  const toLines = [inv.toEmail, inv.toAddress].filter(Boolean).join("\n").split("\n");
  doc.text(fromLines, M, y + 34);
  doc.text(toLines, pageW / 2, y + 34);

  // Items table
  const tableStart = y + 34 + Math.max(fromLines.length, toLines.length) * 12 + 30;

  autoTable(doc, {
    startY: tableStart,
    head: [["Description", "Qty", "Price", "Amount"]],
    body: inv.items.map((i) => [
      i.description || "—",
      String(i.quantity),
      fmt(i.price, sym),
      fmt(i.quantity * i.price, sym),
    ]),
    styles: { font: "helvetica", fontSize: 10, cellPadding: 8, textColor: [31, 41, 55] },
    headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 50 },
      2: { halign: "right", cellWidth: 80 },
      3: { halign: "right", cellWidth: 90 },
    },
    margin: { left: M, right: M },
    theme: "striped",
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  // Totals
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  const rightX = pageW - M;
  const labelX = pageW - M - 160;
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  let ty = finalY;
  const row = (label: string, val: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(bold ? 17 : 75, bold ? 24 : 85, bold ? 39 : 99);
    doc.text(label, labelX, ty);
    doc.text(val, rightX, ty, { align: "right" });
    ty += 18;
  };
  row("Subtotal", fmt(subtotal, sym));
  if (inv.discount) row(`Discount (${inv.discount}%)`, `-${fmt(discount, sym)}`);
  if (inv.taxRate) row(`Tax (${inv.taxRate}%)`, fmt(tax, sym));

  // Total line
  doc.setDrawColor(229, 231, 235);
  doc.line(labelX, ty - 8, rightX, ty - 8);
  doc.setFontSize(13);
  row("Total", fmt(total, sym), true);

  // Notes
  if (inv.notes) {
    ty += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text("Notes", M, ty);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    const notes = doc.splitTextToSize(inv.notes, pageW - M * 2);
    doc.text(notes, M, ty + 14);
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text("Thank you for your business.", M, doc.internal.pageSize.getHeight() - 30);

  doc.save(`${inv.number || "invoice"}.pdf`);
};
