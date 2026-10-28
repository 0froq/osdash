import { withMockQuery } from '#shared/mock-mode'
import type { UnitNote, UnitView } from '#shared/unit'

export function usePrefs(updateUnit: (id: string, patch: Partial<UnitView>) => void) {
  const { mock } = useMockMode()
  const bridge = useStorageDevice()
  const local = shallowRef<Record<string, UnitNote[]>>({})
  const ready = ref(new Set<string>())
  const noteError = ref('')
  const dirty = new Set<string>()
  const drafts = new Set<string>()
  const revisions = new Map<string, number>()
  const queues = new Map<string, Promise<void>>()
  const loads = new Map<string, Promise<void>>()
  const canEditNotes = computed(() => mock.value || bridge.canWriteNotes.value)
  watch(
    bridge.session,
    () => {
      local.value = {}
      ready.value = new Set()
      noteError.value = ''
      dirty.clear()
      drafts.clear()
      revisions.clear()
      queues.clear()
      loads.clear()
    },
    { flush: 'sync' },
  )

  function endpoint(path: string): string {
    return withMockQuery(path, mock.value)
  }
  function setLocal(unit: string, notes: UnitNote[]) {
    local.value = { ...local.value, [unit]: notes }
  }
  function notesOf(unit: UnitView): UnitNote[] {
    if (mock.value) return unit.notes ?? []
    return (local.value[unit.id] ?? []).map(note => ({
      ...note,
      unsaved: dirty.has(note.id) || drafts.has(note.id),
    }))
  }
  function canEditNotesFor(unit: UnitView): boolean {
    return mock.value || (canEditNotes.value && ready.value.has(unit.id))
  }
  function editableNoteIds(unit: UnitView): string[] {
    return mock.value
      ? (unit.notes ?? []).map(note => note.id)
      : (local.value[unit.id] ?? []).map(note => note.id)
  }
  async function loadNotes(unit: UnitView): Promise<void> {
    if (mock.value || !bridge.canWriteNotes.value) return
    const pending = loads.get(unit.id)
    if (pending) return pending
    const session = bridge.session.value
    const operation = (async () => {
      try {
        const notes = await bridge.listNotes(unit.id)
        if (session !== bridge.session.value) return
        const pendingNotes = (local.value[unit.id] ?? []).filter(
          note => dirty.has(note.id) || drafts.has(note.id),
        )
        setLocal(unit.id, [
          ...notes.filter(note => !pendingNotes.some(entry => entry.id === note.id)),
          ...pendingNotes,
        ])
        ready.value.add(unit.id)
        if (dirty.size === 0) noteError.value = ''
      } catch {
        if (session !== bridge.session.value) return
        ready.value.delete(unit.id)
        noteError.value =
          'Could not read local notes. Check the bridge, workspace files and permissions, then reload local notes.'
      }
    })()
    loads.set(unit.id, operation)
    try {
      await operation
    } finally {
      if (loads.get(unit.id) === operation) loads.delete(unit.id)
    }
  }
  function addNote(unit: UnitView) {
    if (!canEditNotesFor(unit)) return
    const note = {
      id: crypto.randomUUID(),
      text: '',
      at: new Date().toISOString(),
      anchor: new Date().toISOString(),
    }
    if (mock.value) updateUnit(unit.id, { notes: [...(unit.notes ?? []), note] })
    else {
      drafts.add(note.id)
      setLocal(unit.id, [...(local.value[unit.id] ?? []), note])
    }
  }
  function cancelNote(unit: UnitView, id: string) {
    if (mock.value) {
      if (unit.notes?.some(note => note.id === id && !note.text))
        updateUnit(unit.id, { notes: unit.notes.filter(note => note.id !== id) })
    } else if (drafts.has(id) && local.value[unit.id]?.some(note => note.id === id && !note.text)) {
      drafts.delete(id)
      setLocal(
        unit.id,
        local.value[unit.id]!.filter(note => note.id !== id),
      )
    }
  }
  async function enqueue(unit: string, session: number, operation: () => Promise<void>) {
    const result = (queues.get(unit) ?? Promise.resolve()).then(async () => {
      if (session === bridge.session.value) await operation()
    })
    const settled = result.catch(() => undefined)
    queues.set(unit, settled)
    try {
      await result
    } finally {
      if (queues.get(unit) === settled) queues.delete(unit)
    }
  }
  async function saveNote(unit: UnitView, note: UnitNote): Promise<void> {
    if (!canEditNotesFor(unit)) return
    if (mock.value) {
      const previous = unit.notes ?? []
      updateUnit(unit.id, { notes: [...previous.filter(entry => entry.id !== note.id), note] })
      try {
        await $fetch(endpoint('/api/prefs'), {
          method: 'PUT',
          body: { note: { id: unit.id, note } },
        })
      } catch {
        updateUnit(unit.id, { notes: previous })
      }
      return
    }
    if (!local.value[unit.id]?.some(entry => entry.id === note.id)) return
    const session = bridge.session.value
    const revision = (revisions.get(note.id) ?? 0) + 1
    revisions.set(note.id, revision)
    dirty.add(note.id)
    setLocal(
      unit.id,
      local.value[unit.id]!.map(entry => (entry.id === note.id ? note : entry)),
    )
    try {
      await enqueue(unit.id, session, async () => {
        const saved = await bridge.saveNote(unit.id, note)
        if (session !== bridge.session.value || revisions.get(note.id) !== revision) return
        setLocal(
          unit.id,
          (local.value[unit.id] ?? []).map(entry => (entry.id === note.id ? saved : entry)),
        )
        dirty.delete(note.id)
        drafts.delete(note.id)
        if (dirty.size === 0) noteError.value = ''
      })
    } catch (cause) {
      if (session !== bridge.session.value || revisions.get(note.id) !== revision) return
      if ((cause as { statusCode?: number }).statusCode === 409) {
        const copy = {
          ...note,
          id: crypto.randomUUID(),
          version: null,
          at: new Date().toISOString(),
        }
        dirty.delete(note.id)
        drafts.delete(note.id)
        drafts.add(copy.id)
        setLocal(unit.id, [
          ...(local.value[unit.id] ?? []).filter(entry => entry.id !== note.id),
          copy,
        ])
        await loadNotes(unit)
        noteError.value =
          'The original note changed. Your edit is kept as a separate unsaved draft. Compare it with the reloaded original before saving.'
      } else
        noteError.value =
          'Could not confirm the save. Keep this tab open. Reload notes to check the storage device before retrying.'
    }
  }
  async function moveNote(unit: UnitView, id: string, anchor: string): Promise<void> {
    if (!canEditNotesFor(unit)) return
    if (!mock.value) {
      const note = local.value[unit.id]?.find(entry => entry.id === id)
      if (note && drafts.has(id) && !note.text) {
        setLocal(
          unit.id,
          (local.value[unit.id] ?? []).map(entry =>
            entry.id === id ? { ...entry, anchor } : entry,
          ),
        )
      } else if (note) await saveNote(unit, { ...note, anchor })
      return
    }
    const previous = unit.notes ?? []
    updateUnit(unit.id, {
      notes: previous.map(entry => (entry.id === id ? { ...entry, anchor } : entry)),
    })
    try {
      await $fetch(endpoint('/api/prefs'), {
        method: 'PUT',
        body: { noteMove: { id: unit.id, noteId: id, anchor } },
      })
    } catch {
      updateUnit(unit.id, { notes: previous })
    }
  }
  async function deleteNote(unit: UnitView, id: string): Promise<void> {
    if (!canEditNotesFor(unit)) return
    if (mock.value) {
      const previous = unit.notes ?? []
      updateUnit(unit.id, { notes: previous.filter(entry => entry.id !== id) })
      try {
        await $fetch(endpoint('/api/prefs'), {
          method: 'PUT',
          body: { noteDelete: { id: unit.id, noteId: id } },
        })
      } catch {
        updateUnit(unit.id, { notes: previous })
      }
      return
    }
    if (!local.value[unit.id]?.some(note => note.id === id)) return
    if (drafts.has(id) && !dirty.has(id)) {
      drafts.delete(id)
      setLocal(
        unit.id,
        (local.value[unit.id] ?? []).filter(note => note.id !== id),
      )
      return
    }
    const session = bridge.session.value
    const revision = (revisions.get(id) ?? 0) + 1
    revisions.set(id, revision)
    try {
      await enqueue(unit.id, session, async () => {
        await bridge.deleteNote(
          unit.id,
          id,
          local.value[unit.id]?.find(note => note.id === id)?.version ?? null,
        )
        if (session !== bridge.session.value || revisions.get(id) !== revision) return
        setLocal(
          unit.id,
          (local.value[unit.id] ?? []).filter(note => note.id !== id),
        )
        drafts.delete(id)
        dirty.delete(id)
        if (dirty.size === 0) noteError.value = ''
      })
    } catch {
      if (session === bridge.session.value)
        noteError.value =
          'Could not confirm deletion. Check the bridge and reload local notes before retrying.'
    }
  }
  return {
    notesOf,
    canEditNotes,
    canEditNotesFor,
    editableNoteIds,
    noteError,
    loadNotes,
    addNote,
    cancelNote,
    saveNote,
    moveNote,
    deleteNote,
  }
}
