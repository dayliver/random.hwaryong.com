<script setup>
import { ref, watch } from 'vue'
import { Play } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const props = defineProps({
  names: { type: Array, required: true },
})
const emit = defineEmits(['winner'])

const ROW_HEIGHT = 74
const OFFSETS = [-2, -1, 0, 1, 2]
const ANGLE_STEP = 38
const RADIUS = 170
const PERSPECTIVE = 320

const spinning = ref(false)
const visibleNames = ref([])

function pickRandom(pool) {
  return pool[Math.floor(Math.random() * pool.length)]
}

function cyclicWindow(pool, centerIndex) {
  const n = pool.length
  return OFFSETS.map((o) => pool[((centerIndex + o) % n + n) % n])
}

function resetVisible() {
  visibleNames.value = props.names.length ? cyclicWindow(props.names, 0) : []
}
resetVisible()

watch(
  () => props.names,
  () => {
    if (!spinning.value) resetVisible()
  },
)

// Places each row on a shared circular arc (rotateX + translateZ around one
// center) rather than stacking flat rows, so it reads as text wrapped around
// a spinning drum instead of a flat list that merely fades at the edges.
function rowStyle(offset) {
  const abs = Math.abs(offset)
  const opacity = abs === 0 ? 1 : abs === 1 ? 0.65 : 0.32
  const fontSize =
    abs === 0 ? 'clamp(2rem, 5.5vw, 3.5rem)' : abs === 1 ? 'clamp(1.2rem, 2.8vw, 1.65rem)' : 'clamp(0.8rem, 1.8vw, 1rem)'
  return {
    transform: `rotateX(${offset * -ANGLE_STEP}deg) translateZ(${RADIUS}px)`,
    opacity,
    fontSize,
    fontWeight: abs === 0 ? 800 : 600,
  }
}

function easeSteps(totalSteps) {
  const delays = []
  for (let i = 0; i < totalSteps; i++) {
    const t = i / (totalSteps - 1)
    delays.push(Math.round(45 + 360 * t * t))
  }
  return delays
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function spin() {
  if (spinning.value || props.names.length < 2) return
  spinning.value = true

  const n = props.names.length
  const winnerIndex = Math.floor(Math.random() * n)
  const totalTicks = 26
  const delays = easeSteps(totalTicks)

  let cursor = Math.floor(Math.random() * n)
  for (let t = 0; t < totalTicks; t++) {
    const isLast = t === totalTicks - 1
    cursor = isLast ? winnerIndex : (cursor + 1 + Math.floor(Math.random() * 2)) % n
    visibleNames.value = cyclicWindow(props.names, cursor)
    await sleep(delays[t])
  }

  spinning.value = false
  emit('winner', props.names[winnerIndex])
}
</script>

<template>
  <div class="flex flex-col items-center gap-5">
    <div
      class="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border-4 border-border bg-gradient-to-b from-secondary to-background shadow-md"
      :style="{ height: ROW_HEIGHT * 5 + 'px', perspective: PERSPECTIVE + 'px' }"
    >
      <div
        v-for="offset in OFFSETS"
        :key="offset"
        class="absolute inset-0 flex items-center justify-center px-4 text-center leading-tight [backface-visibility:hidden]"
        :style="rowStyle(offset)"
      >
        {{ visibleNames[offset + 2] }}
      </div>

      <div
        class="pointer-events-none absolute inset-x-0 top-1/2 h-[74px] -translate-y-1/2 border-y-2 border-primary/70"
      />
      <div class="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-background to-transparent" />
      <div class="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-background to-transparent" />
    </div>

    <Button size="lg" :disabled="names.length < 2 || spinning" @click="spin">
      <Play class="size-4" />
      {{ spinning ? '돌아가는 중…' : '슬롯 당기기' }}
    </Button>
    <p v-if="names.length < 2" class="text-xs text-muted-foreground">
      2명 이상 입력하면 당길 수 있어요.
    </p>
  </div>
</template>
