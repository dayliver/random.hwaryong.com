<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Dices, RotateCcw, Sun, Moon, Trophy, History, Trash2, Maximize, Minimize, X } from 'lucide-vue-next'
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
import { decodeRoster, readSharedRosterCode, clearSharedRosterFromUrl } from '@/lib/share'

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

const mobilePanels = [
  { key: 'list', label: '명단' },
  { key: 'draw', label: '뽑기' },
  { key: 'status', label: '현황' },
]
const mobilePanel = ref('draw')

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
function handleNotify(payload, duration = 2600) {
  notice.value = payload
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = null), duration)
}

onMounted(() => {
  const shared = readSharedRosterCode()
  if (!shared) return
  try {
    const roster = decodeRoster(shared)
    rosterName.value = roster.name
    membersText.value = roster.membersText
    const count = parseMembers(roster.membersText).length
    handleNotify(
      {
        type: 'success',
        message: roster.name
          ? `공유된 명단 '${roster.name}'(${count}명)을 불러왔어요.`
          : `공유된 명단(${count}명)을 불러왔어요.`,
      },
      5000,
    )
  } catch {
    handleNotify(
      { type: 'error', message: 'QR/링크를 다시 스캔해보세요 - 명단 정보를 읽지 못했어요.' },
      6000,
    )
  } finally {
    clearSharedRosterFromUrl()
  }
})

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

const isFullscreen = ref(false)
const showFullscreenHint = ref(false)
function updateFullscreenState() {
  isFullscreen.value = !!document.fullscreenElement
}
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await document.documentElement.requestFullscreen()
    }
  } catch {
    // fullscreen may be blocked (e.g. embedded iframe) - ignore
  }
}
async function acceptFullscreenHint() {
  showFullscreenHint.value = false
  await toggleFullscreen()
}
onMounted(() => {
  updateFullscreenState()
  document.addEventListener('fullscreenchange', updateFullscreenState)
  if (!document.fullscreenElement) showFullscreenHint.value = true
})
onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', updateFullscreenState)
})
</script>

<template>
  <div class="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8 xl:max-w-[1600px] 2xl:max-w-[1800px]">
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
      <div class="flex items-center gap-2">
        <Button variant="outline" size="icon" @click="toggleFullscreen">
          <Minimize v-if="isFullscreen" class="size-4" />
          <Maximize v-else class="size-4" />
        </Button>
        <Button variant="outline" size="icon" @click="toggleDark">
          <Sun v-if="isDark" class="size-4" />
          <Moon v-else class="size-4" />
        </Button>
      </div>
    </header>

    <div
      v-if="showFullscreenHint && !isFullscreen"
      class="mb-6 flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
    >
      <span class="text-foreground">전체화면으로 보면 룰렛·슬롯머신이 훨씬 크고 실감나게 보여요.</span>
      <div class="flex shrink-0 items-center gap-2">
        <Button size="sm" @click="acceptFullscreenHint">
          <Maximize class="size-3.5" />
          전체화면으로 보기
        </Button>
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground"
          @click="showFullscreenHint = false"
        >
          <X class="size-4" />
        </button>
      </div>
    </div>

    <div class="mb-6 flex gap-1.5 rounded-lg bg-muted p-1 lg:hidden">
      <button
        v-for="panel in mobilePanels"
        :key="panel.key"
        type="button"
        @click="mobilePanel = panel.key"
        :class="[
          'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          mobilePanel === panel.key
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        ]"
      >
        {{ panel.label }}
      </button>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-12 xl:gap-8">
      <div
        :class="[
          mobilePanel === 'list' ? 'block' : 'hidden',
          'lg:col-start-1 lg:col-end-2 lg:block xl:col-start-1 xl:col-end-4',
        ]"
      >
        <ListManager
          v-model:name="rosterName"
          v-model:members-text="membersText"
          @notify="handleNotify"
        />
      </div>

      <div
        :class="[
          mobilePanel === 'draw' ? 'block' : 'hidden',
          'lg:col-start-2 lg:col-end-4 lg:block xl:col-start-4 xl:col-end-10',
        ]"
      >
        <Card class="p-5 xl:p-7">
          <div class="mb-5 flex gap-1.5 overflow-x-auto rounded-lg bg-muted p-1">
            <button
              v-for="mode in modes"
              :key="mode.key"
              type="button"
              @click="activeMode = mode.key"
              :class="[
                'min-w-[76px] flex-1 shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
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
      </div>

      <div
        :class="[
          mobilePanel === 'status' ? 'flex' : 'hidden',
          'flex-col gap-6 lg:col-start-2 lg:col-end-4 lg:flex xl:col-start-10 xl:col-end-13',
        ]"
      >
        <Card class="flex flex-col gap-3 p-5">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold">추첨 대상 ({{ pool.length }}/{{ names.length }})</h2>
            <Button variant="ghost" size="sm" @click="refillPool" :disabled="excludedCount === 0">
              <RotateCcw class="size-3.5" />
              다시 채우기
            </Button>
          </div>
          <button
            type="button"
            class="flex w-fit items-center gap-2 text-xs font-medium text-muted-foreground"
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
          <ul class="flex max-h-40 flex-col gap-1.5 overflow-y-auto text-sm xl:max-h-[28rem]">
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
