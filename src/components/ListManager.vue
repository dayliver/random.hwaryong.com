<script setup>
import { ref, computed, onMounted } from 'vue'
import { Save, Plus, Trash2, Share2 } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Textarea from '@/components/ui/Textarea.vue'
import Badge from '@/components/ui/Badge.vue'
import Dialog from '@/components/ui/Dialog.vue'
import ShareDialog from '@/components/ShareDialog.vue'
import { getAllRosters, saveRoster, deleteRoster, parseMembers } from '@/lib/db'

const props = defineProps({
  name: { type: String, required: true },
  membersText: { type: String, required: true },
})
const emit = defineEmits(['update:name', 'update:membersText', 'notify'])

const rosters = ref([])
const selectedId = ref(null)
const saving = ref(false)
const confirmDeleteOpen = ref(false)
const shareOpen = ref(false)
const shareTarget = ref(null)

const parsedNames = computed(() => parseMembers(props.membersText))

async function refresh() {
  rosters.value = await getAllRosters()
}

onMounted(async () => {
  await refresh()
  // Reselect whichever saved roster matches what's currently loaded (e.g.
  // restored from last session) so the chip highlights and saving updates
  // it in place instead of creating a duplicate.
  if (selectedId.value === null) {
    const match = rosters.value.find(
      (r) => r.name === props.name && r.membersText === props.membersText,
    )
    if (match) selectedId.value = match.id
  }
})

function openShare(roster) {
  shareTarget.value = roster
  shareOpen.value = true
}

function selectRoster(roster) {
  selectedId.value = roster.id
  emit('update:name', roster.name)
  emit('update:membersText', roster.membersText)
}

function startNew() {
  selectedId.value = null
  emit('update:name', '')
  emit('update:membersText', '')
}

async function handleSave() {
  if (!props.name.trim()) {
    emit('notify', { type: 'error', message: '명단 이름을 입력해주세요.' })
    return
  }
  if (parsedNames.value.length === 0) {
    emit('notify', { type: 'error', message: '이름을 한 명 이상 입력해주세요.' })
    return
  }
  saving.value = true
  try {
    const id = await saveRoster({
      id: selectedId.value,
      name: props.name,
      membersText: props.membersText,
    })
    selectedId.value = id
    await refresh()
    emit('notify', { type: 'success', message: `'${props.name}' 명단을 저장했어요.` })
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (selectedId.value) {
    await deleteRoster(selectedId.value)
    await refresh()
    startNew()
  }
  confirmDeleteOpen.value = false
}
</script>

<template>
  <Card class="flex flex-col gap-4 p-5">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-foreground">명단 관리</h2>
      <Button variant="ghost" size="sm" @click="startNew">
        <Plus class="size-3.5" />
        새 명단
      </Button>
    </div>

    <div v-if="rosters.length" class="flex flex-wrap gap-1.5">
      <div
        v-for="roster in rosters"
        :key="roster.id"
        :class="[
          'flex items-stretch overflow-hidden rounded-md border text-xs transition-colors',
          selectedId === roster.id
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-input bg-background',
        ]"
      >
        <button
          type="button"
          @click="selectRoster(roster)"
          :class="[
            'px-2.5 py-1 transition-colors',
            selectedId === roster.id ? '' : 'hover:bg-accent hover:text-accent-foreground',
          ]"
        >
          {{ roster.name }}
          <span class="opacity-60">· {{ roster.members.length }}</span>
        </button>
        <button
          type="button"
          title="이 명단 공유"
          @click="openShare(roster)"
          :class="[
            'flex items-center border-l px-1.5 transition-colors',
            selectedId === roster.id
              ? 'border-primary-foreground/30 hover:bg-black/10'
              : 'border-input hover:bg-accent hover:text-accent-foreground',
          ]"
        >
          <Share2 class="size-3" />
        </button>
      </div>
    </div>
    <p v-else class="text-xs text-muted-foreground">
      저장된 명단이 없어요. 아래에 이름을 입력하고 저장해보세요.
    </p>

    <div class="flex flex-col gap-2">
      <label class="text-xs font-medium text-muted-foreground" for="roster-name">명단 이름</label>
      <Input
        id="roster-name"
        :model-value="name"
        @update:model-value="$emit('update:name', $event)"
        placeholder="예: 1반"
      />
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-xs font-medium text-muted-foreground" for="roster-members">
        이름 목록 <span class="opacity-70">(한 줄에 한 명씩 입력)</span>
      </label>
      <Textarea
        id="roster-members"
        :model-value="membersText"
        @update:model-value="$emit('update:membersText', $event)"
        rows="8"
        placeholder="홍길동
임꺽정
장길산"
      />
      <p class="text-xs text-muted-foreground">
        표에서 이름 목록을 복사해 붙여넣으면 줄바꿈 기준으로 자동 인식돼요.
      </p>
      <div class="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary">총 {{ parsedNames.length }}명</Badge>
        <Badge v-for="n in parsedNames.slice(0, 6)" :key="n" variant="outline">{{ n }}</Badge>
        <span v-if="parsedNames.length > 6" class="text-xs text-muted-foreground"
          >외 {{ parsedNames.length - 6 }}명</span
        >
      </div>
    </div>

    <div class="flex gap-2">
      <Button class="flex-1" :disabled="saving" @click="handleSave">
        <Save class="size-3.5" />
        {{ selectedId ? '수정 저장' : '새 명단 저장' }}
      </Button>
      <Button v-if="selectedId" variant="outline" size="icon" @click="confirmDeleteOpen = true">
        <Trash2 class="size-3.5" />
      </Button>
    </div>
    <p class="text-xs text-muted-foreground">
      명단을 저장한 뒤, 위 목록에서 <Share2 class="inline size-3 -translate-y-px" /> 아이콘을 누르면 공유할 수 있어요.
    </p>
  </Card>

  <ShareDialog
    v-model:open="shareOpen"
    :name="shareTarget?.name ?? ''"
    :members-text="shareTarget?.membersText ?? ''"
  />

  <Dialog v-model:open="confirmDeleteOpen">
    <template #default>
      <h3 class="text-base font-semibold">명단을 삭제할까요?</h3>
      <p class="mt-1.5 text-sm text-muted-foreground">
        '{{ name }}' 명단이 기기에서 완전히 삭제돼요. 이 동작은 되돌릴 수 없어요.
      </p>
      <div class="mt-5 flex justify-end gap-2">
        <Button variant="outline" @click="confirmDeleteOpen = false">취소</Button>
        <Button variant="destructive" @click="confirmDelete">
          <Trash2 class="size-3.5" />
          삭제
        </Button>
      </div>
    </template>
  </Dialog>
</template>
