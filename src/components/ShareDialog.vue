<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import QRCode from 'qrcode'
import { Copy, Check } from 'lucide-vue-next'
import Dialog from '@/components/ui/Dialog.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { buildShareUrl } from '@/lib/share'

const props = defineProps({
  open: { type: Boolean, default: false },
  name: { type: String, default: '' },
  membersText: { type: String, default: '' },
})
const emit = defineEmits(['update:open'])

const canvasRef = ref(null)
const copied = ref(false)

const shareUrl = computed(() => buildShareUrl(props.name, props.membersText))

async function renderQr() {
  await nextTick()
  if (!canvasRef.value) return
  await QRCode.toCanvas(canvasRef.value, shareUrl.value, {
    width: 420,
    margin: 4,
    errorCorrectionLevel: 'H',
    color: { dark: '#18181b', light: '#ffffff' },
  })
  // The qrcode lib sets inline width/height styles matching the pixel
  // buffer, which outrank the Tailwind classes below and block the QR
  // from shrinking to fit narrow screens. Clear them so `h-auto w-full`
  // (in the template) takes over for responsive display sizing.
  canvasRef.value.style.removeProperty('width')
  canvasRef.value.style.removeProperty('height')
}

watch([() => props.open, shareUrl], ([isOpen]) => {
  if (isOpen) {
    copied.value = false
    renderQr()
  }
})

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  } catch {
    // clipboard API may be unavailable - the input is still selectable for manual copy
  }
}
</script>

<template>
  <Dialog :open="open" class="max-w-lg min-w-0" @update:open="$emit('update:open', $event)">
    <div class="flex min-w-0 w-full flex-col items-center gap-4 text-center">
      <div>
        <h3 class="text-base font-semibold">명단 공유</h3>
        <p class="mt-1 text-sm text-muted-foreground">
          모바일에서 QR을 스캔하면
          <span v-if="name" class="font-medium text-foreground">'{{ name }}'</span>
          명단이 그대로 열려요.
        </p>
      </div>

      <div class="w-full min-w-0 max-w-[420px] rounded-xl border border-border bg-white p-3">
        <canvas ref="canvasRef" class="h-auto w-full" />
      </div>

      <div class="flex w-full items-center gap-2">
        <Input :model-value="shareUrl" readonly class="text-xs" @focus="$event.target.select()" />
        <Button variant="outline" size="icon" @click="copyUrl">
          <Check v-if="copied" class="size-3.5" />
          <Copy v-else class="size-3.5" />
        </Button>
      </div>

      <Button class="w-full" @click="$emit('update:open', false)">닫기</Button>
    </div>
  </Dialog>
</template>
