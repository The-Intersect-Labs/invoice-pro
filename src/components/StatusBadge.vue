<script setup lang="ts">
import { computed } from "vue";
import type { Invoice } from "@/lib/invoice-types";

const props = defineProps<{
  status: Invoice["status"];
}>();

const variantClasses = computed(() => {
  switch (props.status) {
    case "sent":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    case "paid":
      return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
    case "draft":
    default:
      return "bg-muted text-muted-foreground";
  }
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors',
      variantClasses
    ]"
  >
    {{ status }}
  </span>
</template>
