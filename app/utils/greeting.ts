import type { TFunc } from '#shared/i18n'
import { replyDuration } from '~/utils/time'

export function greetingTitle(t: TFunc, name: string, now = new Date()): string {
  const hour = now.getHours()
  const period = t(hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening')
  return t('greet', { period, name })
}

export function greetingFacts(
  t: TFunc,
  mine: number,
  merged: number,
  open: number,
  averageFirstReplyMs: number | null,
): Array<{ figure: string; label: string }> {
  return [
    { figure: String(mine), label: t('greetOnYou') },
    { figure: String(merged), label: t('greetMerged') },
    { figure: String(open), label: t('greetOpen') },
    { figure: replyDuration(t, averageFirstReplyMs), label: t('greetReply') },
  ]
}
