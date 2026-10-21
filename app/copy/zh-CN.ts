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
  preview: {
    empty: '选一张卡看时间线',
    close: '关闭',
    openGithub: '在 GitHub 打开 ↗',
    source: '原文 ↗',
    expand: '展开',
    collapse: '收起',
    truncated: '更早的动静没拉全',
    loading: '正在读取时间线',
    failed: '时间线没读出来',
    retry: '重试',
    you: '你',
    historySummary: '之前的 PR',
    botNoise: '机器人消息',
    ciPassed: '通过',
    ciFailed: '失败',
  },
  shortcuts: 'j / k 移动 · Enter / o 打开 · Esc 关闭 · s 星标 · l 稍后 · e 已读 · g h 回首页',
  shortcutsLabel: '快捷键',
  openedFor(age: string): string {
    return `已开 ${age}`
  },
  sharedWith(number: number): string {
    return `也被 #${number} 引用`
  },
  historyPr(number: number): string {
    return `#${number}（已关闭）`
  },
  sourcePr(number: number): string {
    return `PR #${number}`
  },
  sourceIssue(number: number): string {
    return `issue #${number}`
  },
  botGroup(count: number): string {
    return `${count} 条机器人消息`
  },
  ciGroup(passed: number, failed: number): string {
    return `CI 通过 ${passed} · 失败 ${failed}`
  },
  event: {
    opened: '打开了',
    comment: '评论了',
    reviewComment: '在代码上评论了',
    commit: '提交了',
    forcePush: '强推了',
    labeled: '加了标签',
    unlabeled: '去掉了标签',
    assigned: '指派了',
    unassigned: '取消了指派',
    reviewRequested: '请求了评审',
    crossRef: '提到了',
    connected: '关联了',
    renamed: '改了标题',
    merged: '合并了',
    closed: '关闭了',
    reopened: '重新打开了',
    approved: '批准了',
    changes: '要求修改',
    commented: '评论了',
    dismissed: '撤回了评审',
    pending: '有一条未提交的评审',
    ci: '跑了 CI',
    ciSuccess: '通过了',
    ciFailure: '失败了',
    ciCancelled: '取消了',
    ciSkipped: '跳过了',
    ciNeutral: '没有结论',
    ciAction: '等批准',
    ciTimedOut: '超时了',
    ciStale: '过期了',
  },
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
  settings: {
    title: '分类器',
    intro:
      '站点内置分类器只对部分账号开放。你可以填自己的 OpenAI 兼容接口，用来判断说不清楚的回合。',
    enabled: '已启用站点分类器',
    baseUrl: '接口地址',
    model: '模型',
    apiKey: '密钥',
    save: '保存',
    clear: '清除',
    close: '关闭',
    saved: '已保存',
    cleared: '已清除',
    loadFailed: '设置没读出来',
    saveFailed: '没保存上',
  },
  login: {
    tagline: '看你的 PR 和 issue 现在轮到谁',
    action: '用 GitHub 登录',
    scope: '只请求 read:user，只读公开数据，不会替你评论或合并',
    readOnly: '只读',
  },
}
