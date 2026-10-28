export type ParsedThread = {
  repo: string
  number: number
  threadId: string
}

const SUBJECT = /^https:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)\/(?:issues|pulls)\/(\d+)$/

export function parseNotificationSubject(
  threadId: string,
  url: string | null | undefined,
): ParsedThread | null {
  if (!threadId || !url) return null
  const match = SUBJECT.exec(url)
  if (!match) return null
  const repo = `${match[1]}/${match[2]}`
  const number = Number(match[3])
  if (!Number.isInteger(number)) return null
  return { repo, number, threadId }
}

export function unreadIndex(threads: readonly ParsedThread[]): Map<string, string[]> {
  const index = new Map<string, string[]>()
  for (const thread of threads) {
    const key = `${thread.repo}#${thread.number}`
    const list = index.get(key)
    if (list) list.push(thread.threadId)
    else index.set(key, [thread.threadId])
  }
  return index
}

export function cardNotification(
  members: readonly { repo: string; number: number }[],
  index: ReadonlyMap<string, readonly string[]>,
): { unread: boolean; notificationThreadIds: string[] } {
  const ids: string[] = []
  for (const member of members) {
    const found = index.get(`${member.repo}#${member.number}`)
    if (found) ids.push(...found)
  }
  return { unread: ids.length > 0, notificationThreadIds: ids }
}
