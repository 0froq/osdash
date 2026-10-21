/** User-visible copy. Swap this module to change language. */

export const copy = {
  brand: 'osdash',
  loading: '正在读取',
  updating: '正在更新',
  truncated: '结果被截断，只显示最近的部分',
  githubDown: 'GitHub 暂时没响应，稍后刷新',
  rateLimited: 'GitHub 限流了',
  loadFailed: '没读出来，稍后刷新',
  emptyInbox:
    '还没找到你在别人仓库里的 PR 或 issue。osdash 只看公开仓库、最近 14 天关闭的和所有开着的。',
  emptySection: '没有',
  noPr: '还没有 PR',
  issuePrefix: 'issue',
  someone: '有人',
  justNow: '刚刚',
  morning: '早上好',
  afternoon: '下午好',
  evening: '晚上好',
  sections: {
    mine: '轮到我',
    activity: '有动静',
    waiting: '等别人',
    ended: '已结束',
  },
  nav: {
    home: '首页',
    later: '稍后',
    starred: '星标',
  },
  categories: {
    'claimed-fix': '认领修复',
    'direct-pr': '直接 PR',
    'reported': '只提 issue',
    'helped': '帮人排查',
  },
  tags: {
    'claim': '认领',
    'proposal': '提议',
    'help': '帮忙',
    'non-code': '非代码',
  },
  marks: {
    claimed: '说了要做还没动',
    stalled: '停了 14 天以上',
  },
  labels: {
    ciApproval: 'CI 等批准',
    selfClaimed: '自己认领的',
  },
  states: {
    open: '开着',
    closed: '已关闭',
    merged: '已合并',
  },
  waiting: {
    maintainer: '等维护者',
    author: '等提问者',
    other: '等其他人',
  },
  menu: {
    refresh: '刷新',
    refreshing: '正在刷新',
    theme: '主题',
    light: '浅色',
    dark: '深色',
    logout: '退出',
    open: '打开菜单',
    markRead: '标为已读',
    star: '星标',
    unstar: '取消星标',
    later: '稍后',
    clearLater: '取消稍后',
  },
  laterPresets: {
    tomorrow: '明天早上',
    threeDays: '3 天后',
    nextMonday: '下周一',
  },
  emptyLater: '没有稍后要看的',
  emptyStarred: '没有星标',
  greet(period: string, name: string): string {
    return `${period}，${name}`
  },
  yourTurn(count: number): string {
    return `轮到你 ${count} 件`
  },
  stats(merged: number, open: number, reply: string): string {
    return `近 14 天合并 ${merged} · 进行中 ${open} · 平均首次回复 ${reply}`
  },
  none: '—',
  days(count: number): string {
    return `${count} 天`
  },
  related(number: number): string {
    return `关联 #${number}`
  },
  fixedBy(login: string, number: number): string {
    return `已由 @${login} 的 #${number} 修复 ↗`
  },
  reason: {
    claimedOpenPr: '认领了还没开 PR',
    claimPending: '认领还在等批准',
    ciFailed: 'CI 失败了',
    ciLintFailed: 'lint 失败了',
    claFailed: 'CLA 检查没过',
    changesRequested: (actor: string) => `${actor} 要求修改`,
    coderabbit: 'CodeRabbit 要求修改',
    mentioned: (actor: string) => `${actor} 提到了你`,
    askedPr: (actor: string) => `${actor} 要你开 PR 或 rebase`,
    askedWaiting: '问过了，等维护者',
    alreadyFixed: '已经修好，等维护者',
    workaround: '记了变通办法，等维护者',
    openedWaiting: '刚开，等维护者',
    repliedWaiting: '回过了，等维护者',
    pushedWaiting: '推过了，等维护者',
    commented: (actor: string) => `${actor} 留了评论`,
    approved: (actor: string) => `${actor} 批准了`,
    reviewDismissed: (actor: string) => `${actor} 撤回了评审`,
    pushed: (actor: string) => `${actor} 推了新提交`,
    merged: '已合并',
    closed: '已关闭',
    clef: '需要你看一眼',
  },
  avatarLabel(name: string): string {
    return `${name} 的菜单`
  },
}
