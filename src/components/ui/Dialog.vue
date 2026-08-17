<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  open: { type: Boolean, default: false },
  class: { type: String, default: '' },
})
const emit = defineEmits(['update:open'])

function close() {
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="close"
      >
        <div
          :class="cn('animate-pop-in w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg', props.class)"
        >
          <slot :close="close" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
