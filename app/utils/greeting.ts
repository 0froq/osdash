import { copy } from '~/copy/zh-CN'
import { replyDuration } from '~/utils/time'

export function greetingTitle(name: string, now = new Date()): string {
  const hour = now.getHours()
  const period = hour < 12 ? copy.morning : hour < 18 ? copy.afternoon : copy.evening
  return copy.greet(period, name)
}

export function greetingCount(mine: number): string {
  return copy.yourTurn(mine)
}

export function statsLine(
  merged: number,
  open: number,
  averageFirstReplyMs: number | null,
): string {
  return copy.stats(merged, open, replyDuration(averageFirstReplyMs))
}
