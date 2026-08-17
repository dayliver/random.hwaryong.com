<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Dices, RotateCcw, Sun, Moon, Trophy, History, Trash2 } from 'lucide-vue-next'
import ListManager from '@/components/ListManager.vue'
import WheelSpin from '@/components/modes/WheelSpin.vue'
import SlotMachine from '@/components/modes/SlotMachine.vue'
import LadderGame from '@/components/modes/LadderGame.vue'
import SortBattle from '@/components/modes/SortBattle.vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import { parseMembers } from '@/lib/db'

const rosterName = ref('')
const membersText = ref('홍길동\n임꺽정\n장길산\n전우치\n일지매')

const names = computed(() => parseMembers(membersText.value))
const pool = ref([...names.value])
const noRepeat = ref(false)

watch(names, (next) => {
  pool.value = [...next]
})

const excludedCount = computed(() => names.value.length - pool.value.length)

const modes = [
  { key: 'wheel', label: '룰렛 휠', component: WheelSpin },
  { key: 'slot', label: '슬롯머신', component: SlotMachine },
  { key: 'ladder', label: '사다리타기', component: LadderGame },
  { key: 'sort', label: '정렬 배틀', component: SortBattle },
]
const activeMode = ref('wheel')
const activeComponent = computed(
  () => modes.find((m) => m.key === activeMode.value)?.component,
)

const winner = ref('')
const winnerDialogOpen = ref(false)
const history = ref([])

function handleWinner(name) {
  winner.value = name
  winnerDialogOpen.value = true
  history.value.unshift({
    name,
    mode: modes.find((m) => m.key === activeMode.value)?.label,
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  })
  if (noRepeat.value) {
    const idx = pool.value.indexOf(name)
    if (idx !== -1) pool.value.splice(idx, 1)
  }
}

function refillPool() {
  pool.value = [...names.value]
}

function clearHistory() {
  history.value = []
}

const notice = ref(null)
let noticeTimer = null
function handleNotify(payload) {
  notice.value = payload
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = null), 2600)
}

const isDark = ref(false)
onMounted(() => {
  const stored = localStorage.getItem('theme')
  isDark.value = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', isDark.value)
})
function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}
</script>

<template>
  <div class="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <header class="mb-8 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Dices class="size-5" />
        </div>
        <div>
          <h1 class="text-lg font-bold leading-tight">랜덤 셀렉터</h1>
          <p class="text-xs text-muted-foreground">명단을 저장하고, 룰렛·슬롯·사다리·정렬로 랜덤 추첨하세요</p>
        </div>
      </div>
      <Button variant="outline" size="icon" @click="toggleDark">
        <Sun v-if="isDark" class="size-4" />
        <Moon v-else class="size-4" />
      </Button>
    </header>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-1">
        <ListManager
          v-model:name="rosterName"
          v-model:members-text="membersText"
          @notify="handleNotify"
        />
      </div>

      <div class="flex flex-col gap-6 lg:col-span-2">
        <Card class="p-5">
          <div class="mb-5 flex flex-wrap gap-1.5 rounded-lg bg-muted p-1">
            <button
              v-for="mode in modes"
              :key="mode.key"
              type="button"
              @click="activeMode = mode.key"
              :class="[
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                activeMode === mode.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              ]"
            >
              {{ mode.label }}
            </button>
          </div>

          <component :is="activeComponent" :names="pool" @winner="handleWinner" />
        </Card>

        <Card class="flex flex-col gap-3 p-5">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold">추첨 대상 ({{ pool.length }}/{{ names.length }})</h2>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                @click="noRepeat = !noRepeat"
              >
                뽑히면 제외
                <span
                  :class="[
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                    noRepeat ? 'bg-primary' : 'bg-input',
                  ]"
                >
                  <span
                    :class="[
                      'inline-block size-3.5 rounded-full bg-background shadow transition-transform',
                      noRepeat ? 'translate-x-[18px]' : 'translate-x-1',
                    ]"
                  />
                </span>
              </button>
              <Button variant="ghost" size="sm" @click="refillPool" :disabled="excludedCount === 0">
                <RotateCcw class="size-3.5" />
                다시 채우기
              </Button>
            </div>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <Badge v-for="n in names" :key="n" :variant="pool.includes(n) ? 'secondary' : 'outline'"
              :class="pool.includes(n) ? '' : 'text-muted-foreground line-through opacity-50'"
            >
              {{ n }}
            </Badge>
            <span v-if="names.length === 0" class="text-xs text-muted-foreground">
              왼쪽에서 이름을 입력해주세요.
            </span>
          </div>
          <p v-if="noRepeat && pool.length < 2 && names.length >= 2" class="text-xs text-primary">
            추첨 가능한 인원이 부족해요. '다시 채우기'를 눌러주세요.
          </p>
        </Card>

        <Card v-if="history.length" class="flex flex-col gap-3 p-5">
          <div class="flex items-center justify-between">
            <h2 class="flex items-center gap-1.5 text-sm font-semibold">
              <History class="size-4" />
              추첨 기록
            </h2>
            <Button variant="ghost" size="sm" @click="clearHistory">
              <Trash2 class="size-3.5" />
              지우기
            </Button>
          </div>
          <ul class="flex max-h-40 flex-col gap-1.5 overflow-y-auto text-sm">
            <li
              v-for="(item, idx) in history"
              :key="idx"
              class="flex items-center justify-between rounded-md bg-muted px-3 py-1.5"
            >
              <span class="font-medium">{{ item.name }}</span>
              <span class="text-xs text-muted-foreground">{{ item.mode }} · {{ item.time }}</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>

    <Dialog v-model:open="winnerDialogOpen">
      <div class="flex flex-col items-center gap-3 py-2 text-center">
        <div class="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Trophy class="size-8" />
        </div>
        <p class="text-sm text-muted-foreground">당첨자</p>
        <p class="text-3xl font-bold">{{ winner }}</p>
        <Button class="mt-3 w-full" @click="winnerDialogOpen = false">확인</Button>
      </div>
    </Dialog>

    <Transition name="dialog-fade">
      <div
        v-if="notice"
        :class="[
          'fixed bottom-5 right-5 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg',
          notice.type === 'error'
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-foreground text-background',
        ]"
      >
        {{ notice.message }}
      </div>
    </Transition>
  </div>
</template>
