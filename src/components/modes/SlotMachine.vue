<script setup>
import { ref } from 'vue'
import { Play } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const props = defineProps({
  names: { type: Array, required: true },
})
const emit = defineEmits(['winner'])

const ITEM_HEIGHT = 56
const STRIP_LENGTH = 26

const spinning = ref(false)

const reels = ref([
  { strip: [], offset: 0, duration: 0 },
  { strip: [], offset: 0, duration: 0 },
  { strip: [], offset: 0, duration: 0 },
])

function pickRandom(pool) {
  return pool[Math.floor(Math.random() * pool.length)]
}

function buildStrip(pool, target) {
  const strip = Array.from({ length: STRIP_LENGTH }, () => pickRandom(pool))
  const stopIndex = STRIP_LENGTH - 5
  strip[stopIndex] = target
  return { strip, stopIndex }
}

function reelStyle(reel) {
  return {
    transform: `translateY(-${reel.offset}px)`,
    transition: reel.duration
      ? `transform ${reel.duration}s cubic-bezier(0.12, 0.9, 0.2, 1)`
      : 'none',
  }
}

async function spin() {
  if (spinning.value || props.names.length < 2) return
  spinning.value = true

  const winner = pickRandom(props.names)
  const durations = [1.8, 2.3, 2.8]
  const targets = [pickRandom(props.names), winner, pickRandom(props.names)]

  reels.value = reels.value.map((reel, i) => {
    const { strip, stopIndex } = buildStrip(props.names, targets[i])
    return { strip, offset: 0, duration: 0, stopIndex }
  })

  await new Promise((resolve) => requestAnimationFrame(resolve))

  reels.value = reels.value.map((reel, i) => ({
    ...reel,
    offset: (reel.stopIndex - 1) * ITEM_HEIGHT,
    duration: durations[i],
  }))

  setTimeout(() => {
    spinning.value = false
    emit('winner', winner)
  }, durations[2] * 1000 + 150)
}
</script>

<template>
  <div class="flex flex-col items-center gap-5">
    <div class="rounded-2xl border-4 border-border bg-gradient-to-b from-secondary to-background p-4 shadow-md">
      <div class="flex gap-2">
        <div
          v-for="(reel, i) in reels"
          :key="i"
          class="relative w-28 overflow-hidden rounded-lg border border-border bg-card"
          :style="{ height: ITEM_HEIGHT * 3 + 'px' }"
        >
          <div
            class="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-14 -translate-y-1/2 border-y-2 border-primary/60"
          />
          <div :style="reelStyle(reel)">
            <div
              v-for="(item, idx) in reel.strip.length ? reel.strip : names"
              :key="idx"
              class="flex items-center justify-center px-1 text-center text-sm font-semibold"
              :style="{ height: ITEM_HEIGHT + 'px' }"
            >
              {{ item }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <Button size="lg" :disabled="names.length < 2 || spinning" @click="spin">
      <Play class="size-4" />
      {{ spinning ? '돌아가는 중…' : '슬롯 당기기' }}
    </Button>
    <p class="text-xs text-muted-foreground">가운데 릴 중앙 칸에 멈춘 이름이 당첨이에요.</p>
    <p v-if="names.length < 2" class="text-xs text-muted-foreground">
      2명 이상 입력하면 당길 수 있어요.
    </p>
  </div>
</template>
