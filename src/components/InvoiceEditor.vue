<script setup lang="ts">
import { computed } from "vue";
import { Plus, Trash2 } from "@lucide/vue";
import type { Invoice, InvoiceItem } from "@/lib/invoice-types";
import { calcTotals, currencySymbol } from "@/lib/invoice-types";

const props = defineProps<{
  invoice: Invoice;
}>();

const emit = defineEmits<{
  (e: "update:invoice", val: Invoice): void;
}>();

const totals = computed(() => calcTotals(props.invoice));
const sym = computed(() => currencySymbol(props.invoice.currency));

const currencies = ["NGN", "USD"];

const setField = <K extends keyof Invoice>(field: K, value: Invoice[K]) => {
  emit("update:invoice", {
    ...props.invoice,
    [field]: value,
    updatedAt: Date.now(),
  });
};

const setItem = (id: string, patch: Partial<InvoiceItem>) => {
  const updatedItems = props.invoice.items.map((it) =>
    it.id === id ? { ...it, ...patch } : it
  );
  setField("items", updatedItems);
};

const addItem = () => {
  const newItem: InvoiceItem = {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    price: 0,
  };
  setField("items", [...props.invoice.items, newItem]);
};

const removeItem = (id: string) => {
  if (props.invoice.items.length <= 1) return;
  setField(
    "items",
    props.invoice.items.filter((it) => it.id !== id)
  );
};

const fmt = (n: number) =>
  `${sym.value}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
</script>

<template>
  <div class="space-y-8">
    <!-- Meta Section -->
    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="space-y-2">
        <label class="text-sm font-medium leading-none">Invoice #</label>
        <input
          type="text"
          :value="invoice.number"
          @input="setField('number', ($event.target as HTMLInputElement).value)"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium leading-none">Status</label>
        <select
          :value="invoice.status"
          @change="setField('status', ($event.target as HTMLSelectElement).value as Invoice['status'])"
          class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium leading-none">Issue Date</label>
        <input
          type="date"
          :value="invoice.issueDate"
          @input="setField('issueDate', ($event.target as HTMLInputElement).value)"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium leading-none">Due Date</label>
        <input
          type="date"
          :value="invoice.dueDate"
          @input="setField('dueDate', ($event.target as HTMLInputElement).value)"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
    </section>

    <div class="h-px bg-border my-6"></div>

    <!-- From / Bill To Section -->
    <section class="grid gap-6 md:grid-cols-2">
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          From
        </h3>
        <input
          type="text"
          placeholder="Your name / company"
          :value="invoice.fromName"
          @input="setField('fromName', ($event.target as HTMLInputElement).value)"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <input
          type="email"
          placeholder="Email"
          :value="invoice.fromEmail"
          @input="setField('fromEmail', ($event.target as HTMLInputElement).value)"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <textarea
          placeholder="Address"
          :value="invoice.fromAddress"
          @input="setField('fromAddress', ($event.target as HTMLTextAreaElement).value)"
          rows="3"
          class="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        ></textarea>
      </div>

      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Bill To
        </h3>
        <input
          type="text"
          placeholder="Client name"
          :value="invoice.toName"
          @input="setField('toName', ($event.target as HTMLInputElement).value)"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <input
          type="email"
          placeholder="Email"
          :value="invoice.toEmail"
          @input="setField('toEmail', ($event.target as HTMLInputElement).value)"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <textarea
          placeholder="Address"
          :value="invoice.toAddress"
          @input="setField('toAddress', ($event.target as HTMLTextAreaElement).value)"
          rows="3"
          class="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        ></textarea>
      </div>
    </section>

    <div class="h-px bg-border my-6"></div>

    <!-- Items Section -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Items
        </h3>
        <button
          type="button"
          @click="addItem"
          class="inline-flex items-center gap-1.5 justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Plus class="h-3.5 w-3.5" /> Add item
        </button>
      </div>

      <div class="rounded-lg border overflow-hidden">
        <div class="grid grid-cols-12 gap-2 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
          <div class="col-span-6">Description</div>
          <div class="col-span-2 text-right">Qty</div>
          <div class="col-span-2 text-right">Price</div>
          <div class="col-span-1 text-right">Amount</div>
          <div class="col-span-1" />
        </div>

        <div
          v-for="it in invoice.items"
          :key="it.id"
          class="grid grid-cols-12 gap-2 px-4 py-2 items-center border-t border-border"
        >
          <input
            type="text"
            placeholder="Item description"
            :value="it.description"
            @input="setItem(it.id, { description: ($event.target as HTMLInputElement).value })"
            class="col-span-6 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <input
            type="number"
            min="0"
            :value="it.quantity"
            @input="setItem(it.id, { quantity: Number(($event.target as HTMLInputElement).value) })"
            class="col-span-2 text-right flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            :value="it.price"
            @input="setItem(it.id, { price: Number(($event.target as HTMLInputElement).value) })"
            class="col-span-2 text-right flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div class="col-span-1 text-right text-sm tabular-nums font-medium">
            {{ fmt(it.quantity * it.price) }}
          </div>
          <div class="col-span-1 flex justify-end">
            <button
              type="button"
              @click="removeItem(it.id)"
              :disabled="invoice.items.length === 1"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="Delete item"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Totals + Settings -->
    <section class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none">Currency</label>
          <select
            :value="invoice.currency"
            @change="setField('currency', ($event.target as HTMLSelectElement).value)"
            class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">Discount %</label>
            <input
              type="number"
              min="0"
              :value="invoice.discount"
              @input="setField('discount', Number(($event.target as HTMLInputElement).value))"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">Tax %</label>
            <input
              type="number"
              min="0"
              :value="invoice.taxRate"
              @input="setField('taxRate', Number(($event.target as HTMLInputElement).value))"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium leading-none">Notes</label>
          <textarea
            placeholder="Payment terms, thank-you note, bank details…"
            :value="invoice.notes"
            @input="setField('notes', ($event.target as HTMLTextAreaElement).value)"
            rows="4"
            class="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          ></textarea>
        </div>
      </div>

      <!-- Live Summary Card -->
      <div class="rounded-lg border bg-muted/30 p-5 h-fit">
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Subtotal</span>
            <span class="tabular-nums font-medium">{{ fmt(totals.subtotal) }}</span>
          </div>
          <div v-if="invoice.discount > 0" class="flex justify-between">
            <span class="text-muted-foreground">Discount ({{ invoice.discount }}%)</span>
            <span class="tabular-nums font-medium text-destructive">
              -{{ fmt(totals.discount) }}
            </span>
          </div>
          <div v-if="invoice.taxRate > 0" class="flex justify-between">
            <span class="text-muted-foreground">Tax ({{ invoice.taxRate }}%)</span>
            <span class="tabular-nums font-medium">{{ fmt(totals.tax) }}</span>
          </div>
          <div class="h-px bg-border my-3"></div>
          <div class="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span class="tabular-nums">{{ fmt(totals.total) }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
