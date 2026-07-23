<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  FileText,
  Plus,
  Download,
  Trash2,
  Save,
  ArrowLeft,
  Search,
  CheckCircle2,
  Sun,
  Moon,
} from "@lucide/vue";
import type { Invoice } from "@/lib/invoice-types";
import { emptyInvoice, calcTotals, currencySymbol } from "@/lib/invoice-types";
import { loadInvoices, saveInvoices } from "@/lib/invoice-storage";
import { downloadInvoicePDF } from "@/lib/invoice-pdf";
import InvoiceEditor from "@/components/InvoiceEditor.vue";
import StatusBadge from "@/components/StatusBadge.vue";

const invoices = ref<Invoice[]>([]);
const editingId = ref<string | null>(null);
const draft = ref<Invoice | null>(null);
const query = ref("");
const isDark = ref(false);

const toast = ref<{ message: string; visible: boolean }>({
  message: "",
  visible: false,
});

let toastTimer: number | undefined;

const triggerToast = (msg: string) => {
  if (toastTimer) clearTimeout(toastTimer);
  toast.value = { message: msg, visible: true };
  toastTimer = window.setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("invoice_app_theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("invoice_app_theme", "light");
  }
};

onMounted(() => {
  invoices.value = loadInvoices();
  const saved = localStorage.getItem("invoice_app_theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (saved === "dark" || (!saved && prefersDark)) {
    isDark.value = true;
    document.documentElement.classList.add("dark");
  } else {
    isDark.value = false;
    document.documentElement.classList.remove("dark");
  }
});

const startNew = () => {
  const inv = emptyInvoice();
  draft.value = inv;
  editingId.value = inv.id;
};

const startEdit = (inv: Invoice) => {
  draft.value = JSON.parse(JSON.stringify(inv));
  editingId.value = inv.id;
};

const saveDraft = () => {
  if (!draft.value) return;
  const exists = invoices.value.some((i) => i.id === draft.value!.id);
  const next = exists
    ? invoices.value.map((i) => (i.id === draft.value!.id ? draft.value! : i))
    : [draft.value!, ...invoices.value];

  invoices.value = next;
  saveInvoices(next);
  triggerToast("Invoice saved");
};

const closeEditor = () => {
  editingId.value = null;
  draft.value = null;
};

const removeInvoice = (id: string) => {
  const next = invoices.value.filter((i) => i.id !== id);
  invoices.value = next;
  saveInvoices(next);
  triggerToast("Invoice deleted");
};

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return invoices.value;
  return invoices.value.filter(
    (i) =>
      i.number.toLowerCase().includes(q) ||
      i.toName.toLowerCase().includes(q) ||
      i.fromName.toLowerCase().includes(q)
  );
});

const getTotals = (inv: Invoice) => calcTotals(inv);
const getSymbol = (code: string) => currencySymbol(code);
const formatMoney = (amount: number) =>
  amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
</script>

<template>
  <div class="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
    <!-- Toast Notification Banner -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div
        v-if="toast.visible"
        class="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg"
      >
        <CheckCircle2 class="h-4 w-4" />
        <span>{{ toast.message }}</span>
      </div>
    </transition>

    <!-- Editor View -->
    <div v-if="draft" class="min-h-screen bg-background">
      <header class="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="closeEditor"
              class="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent transition-colors"
              title="Back to invoices"
            >
              <ArrowLeft class="h-4 w-4" />
            </button>
            <div>
              <h1 class="font-semibold leading-tight">
                {{ draft.number || "New invoice" }}
              </h1>
              <p class="text-xs text-muted-foreground">Editing invoice</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="toggleTheme"
              class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
              :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <Sun v-if="isDark" class="h-4 w-4" />
              <Moon v-else class="h-4 w-4" />
            </button>
            <button
              type="button"
              @click="downloadInvoicePDF(draft)"
              class="inline-flex items-center gap-1.5 justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Download class="h-4 w-4" /> Download PDF
            </button>
            <button
              type="button"
              @click="saveDraft"
              class="inline-flex items-center gap-1.5 justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
            >
              <Save class="h-4 w-4" /> Save
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-5xl px-6 py-8">
        <InvoiceEditor v-model:invoice="draft" />
      </main>
    </div>

    <!-- Main List View -->
    <div v-else class="min-h-screen bg-background">
      <header class="border-b bg-card">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div class="flex items-center gap-3">
            <div
              class="flex h-9 w-9 items-center justify-center"
            >
              <img src="/icon.png" alt="">
            </div>
            <div>
              <h1 class="text-lg font-semibold leading-tight">Invoice Pro</h1>
              <p class="text-xs text-muted-foreground">
                Create, save & download professional invoices
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="toggleTheme"
              class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
              :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <Sun v-if="isDark" class="h-4 w-4" />
              <Moon v-else class="h-4 w-4" />
            </button>

            <button
              type="button"
              @click="startNew"
              class="inline-flex items-center gap-1.5 justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
            >
              <Plus class="h-4 w-4" /> New invoice
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-6 py-8">
        <div class="mb-6 flex items-center gap-3">
          <div class="relative flex-1 max-w-sm">
            <Search
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search invoices…"
              v-model="query"
              class="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <span class="text-sm text-muted-foreground">
            {{ invoices.length }} total
          </span>
        </div>

        <!-- Empty State -->
        <div
          v-if="filtered.length === 0"
          class="rounded-xl border border-dashed border-border p-16 text-center"
        >
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted"
          >
            <FileText class="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 class="mt-4 font-semibold text-foreground">No invoices yet</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            Create your first invoice to get started.
          </p>
          <button
            type="button"
            @click="startNew"
            class="mt-6 inline-flex items-center gap-1.5 justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            <Plus class="h-4 w-4" /> New invoice
          </button>
        </div>

        <!-- Invoices List -->
        <div v-else class="grid gap-3">
          <div
            v-for="inv in filtered"
            :key="inv.id"
            class="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm"
          >
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted"
            >
              <FileText class="h-5 w-5 text-muted-foreground" />
            </div>

            <button
              type="button"
              class="flex-1 text-left cursor-pointer"
              @click="startEdit(inv)"
            >
              <div class="flex items-center gap-2">
                <span class="font-semibold text-foreground">{{ inv.number }}</span>
                <StatusBadge :status="inv.status" />
              </div>
              <p class="text-sm text-muted-foreground">
                {{ inv.toName || "No client" }} · Due {{ inv.dueDate }}
              </p>
            </button>

            <div class="text-right">
              <div class="font-semibold tabular-nums text-foreground">
                {{ getSymbol(inv.currency) }}{{ formatMoney(getTotals(inv).total) }}
              </div>
              <div class="text-xs text-muted-foreground uppercase">
                {{ inv.currency }}
              </div>
            </div>

            <div class="flex gap-1">
              <button
                type="button"
                @click="downloadInvoicePDF(inv)"
                title="Download PDF"
                class="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Download class="h-4 w-4" />
              </button>
              <button
                type="button"
                @click="removeInvoice(inv.id)"
                title="Delete invoice"
                class="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
