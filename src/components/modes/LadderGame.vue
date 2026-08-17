<script setup>
import { ref, computed } from 'vue'
import { Play } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const props = defineProps({
  names: { type: Array, required: true },
})
const emit = defineEmits(['winner'])

const ROWS = 9
const ROW_HEIGHT = 32
const COL_GAP = 64
const PAD = 24

const spinning = ref(false)
const rungs = ref([])
const startCol = ref(0)
const tokenPos = ref({ x: PAD, y: 0 })
const tokenTransition = ref(false)
const highlightCol = ref(null)

const width = computed(() => PAD * 2 + Math.max(0, props.names.length - 1) * COL_GAP)
const height = computed(() => ROWS * ROW_HEIGHT + 20)

function colX(col) {
  return PAD + col * COL_GAP
}

function generateRungs(n) {
  const rows = []
  for (let r = 0; r < ROWS; r++) {
    const row = new Array(Math.max(0, n - 1)).fill(false)
    let i = 0
    while (i < n - 1) {
      if (Math.random() < 0.38) {
        row[i] = true
        i += 2
      } else {
        i += 1
      }
    }
    rows.push(row)
  }
  return rows
}

function buildPath(rowRungsList, n, start) {
  let col = start
  const waypoints = [{ x: colX(col), y: 0 }]
  for (let r = 0; r < rowRungsList.length; r++) {
    const row = rowRungsList[r]
    const yMid = r * ROW_HEIGHT + ROW_HEIGHT / 2
    const yBottom = (r + 1) * ROW_HEIGHT
    waypoints.push({ x: colX(col), y: yMid })
    if (col > 0 && row[col - 1]) {
      col -= 1
      waypoints.push({ x: colX(col), y: yMid })
    } else if (col < n - 1 && row[col]) {
      col += 1
      waypoints.push({ x: colX(col), y: yMid })
    }
    waypoints.push({ x: colX(col), y: yBottom })
  }
  return { waypoints, finalCol: col }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function play() {
  if (spinning.value || props.names.length < 2) return
  spinning.value = true
  highlightCol.value = null

  const n = props.names.length
  rungs.value = generateRungs(n)
  startCol.value = Math.floor(Math.random() * n)

  const { waypoints, finalCol } = buildPath(rungs.value, n, startCol.value)

  tokenTransition.value = false
  tokenPos.value = waypoints[0]
  await new Promise((resolve) => requestAnimationFrame(resolve))
  tokenTransition.value = true

  for (let i = 1; i < waypoints.length; i++) {
    tokenPos.value = waypoints[i]
    await sleep(120)
  }

  highlightCol.value = finalCol
  spinning.value = false
  emit('winner', props.names[finalCol])
}
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="max-w-full overflow-x-auto rounded-lg border border-border bg-card p-4">
      <div class="relative" :style="{ width: width + 'px', height: height + 'px' }">
        <svg :width="width" :height="height" class="overflow-visible">
          <line
            v-for="(name, c) in names"
            :key="'col-' + c"
            :x1="colX(c)"
            :y1="0"
            :x2="colX(c)"
            :y2="ROWS * ROW_HEIGHT"
            stroke="var(--border)"
            stroke-width="3"
          />
          <template v-for="(row, r) in rungs" :key="'row-' + r">
            <line
              v-for="(has, c) in row"
              v-show="has"
              :key="'rung-' + r + '-' + c"
              :x1="colX(c)"
              :y1="r * ROW_HEIGHT + ROW_HEIGHT / 2"
              :x2="colX(c + 1)"
              :y2="r * ROW_HEIGHT + ROW_HEIGHT / 2"
              stroke="var(--muted-foreground)"
              stroke-width="3"
            />
          </template>
          <circle
            v-for="(name, c) in names"
            :key="'start-' + c"
            :cx="colX(c)"
            cy="0"
            r="5"
            :fill="c === startCol ? 'var(--primary)' : 'var(--muted-foreground)'"
          />
        </svg>

        <div
          class="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow"
          :style="{
            left: tokenPos.x + 'px',
            top: tokenPos.y + 'px',
            transition: tokenTransition ? 'left 0.12s linear, top 0.12s linear' : 'none',
          }"
        />

        <div
          v-for="(name, c) in names"
          :key="'label-' + c"
          class="absolute top-full mt-1.5 max-w-14 -translate-x-1/2 truncate text-center text-xs font-medium"
          :class="highlightCol === c ? 'text-primary font-bold' : 'text-foreground'"
          :style="{ left: colX(c) + 'px' }"
        >
          {{ name }}
        </div>
      </div>
    </div>

    <Button size="lg" :disabled="names.length < 2 || spinning" @click="play" class="mt-2">
      <Play class="size-4" />
      {{ spinning ? '내려가는 중…' : '사다리 타기' }}
    </Button>
    <p v-if="names.length < 2" class="text-xs text-muted-foreground">
      2명 이상 입력하면 탈 수 있어요.
    </p>
  </div>
</template>
