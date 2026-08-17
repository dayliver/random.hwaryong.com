<script setup>
import { ref, watch } from 'vue'
import { Play } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const props = defineProps({
  names: { type: Array, required: true },
})
const emit = defineEmits(['winner'])

const spinning = ref(false)
const winnerId = ref(null)
const cards = ref(buildCards(props.names))

function buildCards(names) {
  return names.map((name, id) => ({ id, name }))
}

watch(
  () => props.names,
  (next) => {
    if (!spinning.value) {
      cards.value = buildCards(next)
      winnerId.value = null
    }
  },
)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function easeSteps(totalSteps) {
  const delays = []
  for (let i = 0; i < totalSteps; i++) {
    const t = i / (totalSteps - 1)
    delays.push(Math.round(45 + 420 * t * t))
  }
  return delays
}

async function play() {
  if (spinning.value || props.names.length < 2) return
  spinning.value = true
  winnerId.value = null
  cards.value = buildCards(props.names)

  const n = cards.value.length
  const totalSteps = Math.max(24, n * 4)
  const delays = easeSteps(totalSteps)

  for (const delay of delays) {
    const i = Math.floor(Math.random() * (n - 1))
    const arr = cards.value.slice()
    ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
    cards.value = arr
    await sleep(delay)
  }

  winnerId.value = cards.value[0].id
  spinning.value = false
  emit('winner', cards.value[0].name)
}
</script>

<template>
  <div class="flex flex-col items-center gap-5">
    <p class="text-xs text-muted-foreground">
      카드들이 계속 자리를 바꾸다가 점점 느려지며 멈춰요. 맨 왼쪽 칸에 남은 이름이 당첨이에요.
    </p>
    <div class="min-h-24 w-full rounded-lg border border-border bg-card p-4">
      <TransitionGroup name="sort" tag="div" class="flex flex-wrap justify-center gap-2">
        <div
          v-for="(card, idx) in cards"
          :key="card.id"
          class="sort-card flex h-12 min-w-16 items-center justify-center rounded-md border px-3 text-sm font-semibold"
          :class="[
            idx === 0
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-secondary text-secondary-foreground',
            winnerId === card.id ? 'animate-pop-in ring-2 ring-primary' : '',
          ]"
        >
          {{ card.name }}
        </div>
      </TransitionGroup>
    </div>

    <Button size="lg" :disabled="names.length < 2 || spinning" @click="play">
      <Play class="size-4" />
      {{ spinning ? '섞는 중…' : '셔플 시작' }}
    </Button>
    <p v-if="names.length < 2" class="text-xs text-muted-foreground">
      2명 이상 입력하면 섞을 수 있어요.
    </p>
  </div>
</template>

<style scoped>
.sort-move {
  transition: transform 0.24s ease;
}
</style>
