<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Play } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const props = defineProps({
  names: { type: Array, required: true },
})
const emit = defineEmits(['winner'])

const COLORS = [
  '#f97316',
  '#22c55e',
  '#3b82f6',
  '#eab308',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#ef4444',
  '#0ea5e9',
  '#84cc16',
]

const canvasRef = ref(null)
const measureRef = ref(null)
const size = ref(320)
const rotation = ref(0)
const spinning = ref(false)
const transitionEnabled = ref(false)

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const n = props.names.length
  const r = size.value / 2
  ctx.clearRect(0, 0, size.value, size.value)
  if (n === 0) return

  const sliceAngle = (Math.PI * 2) / n
  for (let i = 0; i < n; i++) {
    const start = -Math.PI / 2 + i * sliceAngle
    const end = start + sliceAngle
    ctx.beginPath()
    ctx.moveTo(r, r)
    ctx.arc(r, r, r - 4, start, end)
    ctx.closePath()
    ctx.fillStyle = COLORS[i % COLORS.length]
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.save()
    ctx.translate(r, r)
    ctx.rotate(start + sliceAngle / 2)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    const fontSize = Math.max(12, Math.round(size.value / 22))
    ctx.font = `600 ${fontSize}px system-ui, sans-serif`
    const label =
      props.names[i].length > 8 ? props.names[i].slice(0, 7) + '…' : props.names[i]
    ctx.fillText(label, r - 16, 0)
    ctx.restore()
  }
}

watch(() => props.names, () => nextTick(draw), { deep: true })

let resizeObserver
onMounted(() => {
  draw()
  resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width
    if (!width) return
    size.value = Math.round(Math.max(240, Math.min(560, width)))
    nextTick(draw)
  })
  if (measureRef.value) resizeObserver.observe(measureRef.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())

function spin() {
  if (spinning.value || props.names.length < 2) return
  spinning.value = true

  const n = props.names.length
  const sliceAngle = 360 / n
  const winnerIndex = Math.floor(Math.random() * n)
  const targetInSlice = -winnerIndex * sliceAngle - sliceAngle / 2
  const normalized = ((targetInSlice % 360) + 360) % 360
  const spins = 6 + Math.floor(Math.random() * 3)
  const finalRotation = rotation.value - (rotation.value % 360) + spins * 360 + normalized

  transitionEnabled.value = true
  requestAnimationFrame(() => {
    rotation.value = finalRotation
  })

  setTimeout(() => {
    spinning.value = false
    emit('winner', props.names[winnerIndex])
  }, 4200)
}
</script>

<template>
  <div class="flex flex-col items-center gap-5">
    <div ref="measureRef" class="w-full max-w-[560px]">
      <div class="relative mx-auto" :style="{ width: size + 'px', height: size + 'px' }">
        <div
          class="absolute left-1/2 top-[-6px] z-10 h-0 w-0 -translate-x-1/2"
          style="
            border-left: 12px solid transparent;
            border-right: 12px solid transparent;
            border-top: 20px solid var(--foreground);
          "
        />
        <canvas
          ref="canvasRef"
          :width="size"
          :height="size"
          class="rounded-full border-4 border-border shadow-md"
          :style="{
            width: size + 'px',
            height: size + 'px',
            transform: `rotate(${rotation}deg)`,
            transition: transitionEnabled
              ? 'transform 4.1s cubic-bezier(0.17, 0.87, 0.15, 1)'
              : 'none',
          }"
        />
        <div
          class="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-background bg-foreground shadow"
        />
      </div>
    </div>

    <Button size="lg" :disabled="names.length < 2 || spinning" @click="spin">
      <Play class="size-4" />
      {{ spinning ? '돌아가는 중…' : '룰렛 돌리기' }}
    </Button>
    <p v-if="names.length < 2" class="text-xs text-muted-foreground">
      2명 이상 입력하면 돌릴 수 있어요.
    </p>
  </div>
</template>
