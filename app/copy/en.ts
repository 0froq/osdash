/** User-visible copy. Swap this module to change language. */

export const copy = {
  brand: 'osdash',
  loading: 'Loading',
  updating: 'Updating',
  truncated: 'Results were cut off. Showing the newest part.',
  githubDown: 'GitHub is not responding. Refresh in a moment.',
  rateLimited: 'GitHub rate limit reached',
  loadFailed: 'Could not load. Refresh in a moment.',
  emptyInbox:
    "No PRs or issues in other people's repos yet. osdash looks at public repos: everything still open, and anything closed in the last 14 days.",
  emptySection: 'None',
  noPr: 'No PR yet',
  issuePrefix: 'issue',
  someone: 'someone',
  justNow: 'just now',
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  sections: {
    mine: 'Your turn',
    activity: 'New activity',
    waiting: 'Not my turn',
    ended: 'Done',
  },
  nav: {
    home: 'Home',
    later: 'Later',
    starred: 'Starred',
  },
  categories: {
    'claimed-fix': 'Claimed fix',
    'direct-pr': 'Direct PR',
    'reported': 'Issue only',
    'helped': 'Helped',
  },
  tags: {
    'claim': 'Claim',
    'proposal': 'Proposal',
    'help': 'Help',
    'non-code': 'Non-code',
  },
  marks: {
    claimed: "Said I'd do it",
    stalled: 'Stalled over 14 days',
  },
  labels: {
    ciApproval: 'CI awaiting approval',
    selfClaimed: 'Self-claimed',
  },
  states: {
    open: 'Open',
    closed: 'Closed',
    merged: 'Merged',
  },
  status: {
    open: 'Open',
    justOpened: 'Just opened',
  },
  menu: {
    refresh: 'Refresh',
    refreshing: 'Refreshing',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    logout: 'Log out',
    open: 'Open menu',
    markRead: 'Mark as read',
    star: 'Star',
    unstar: 'Unstar',
    later: 'Later',
    clearLater: 'Clear later',
  },
  laterPresets: {
    tomorrow: 'Tomorrow morning',
    threeDays: 'In 3 days',
    nextMonday: 'Next Monday',
  },
  emptyLater: 'Nothing saved for later',
  emptyStarred: 'No starred cards',
  repos: {
    showAll: 'Show all',
    showLess: 'Show less',
  },
  preview: {
    empty: 'Select a card to see its timeline',
    close: 'Close',
    openGithub: 'Open on GitHub ↗',
    source: 'Source ↗',
    expand: 'Expand',
    collapse: 'Collapse',
    truncated: 'Older activity was not loaded',
    loading: 'Loading timeline',
    failed: 'Could not load the timeline',
    retry: 'Retry',
    you: 'you',
    historySummary: 'Earlier PRs',
    botNoise: 'Bot messages',
    ciPassed: 'passed',
    ciFailed: 'failed',
  },
  shortcuts: 'j / k move · Enter / o open · Esc close · s star · l later · e read · g h home',
  shortcutsLabel: 'Shortcuts',
  openedFor(age: string): string {
    return `Opened ${age}`
  },
  sharedWith(number: number): string {
    return `Also referenced by #${number}`
  },
  historyPr(number: number): string {
    return `#${number} (closed)`
  },
  sourcePr(number: number): string {
    return `PR #${number}`
  },
  sourceIssue(number: number): string {
    return `issue #${number}`
  },
  botGroup(count: number): string {
    return count === 1 ? '1 bot message' : `${count} bot messages`
  },
  ciGroup(passed: number, failed: number): string {
    return `CI passed ${passed} · failed ${failed}`
  },
  event: {
    opened: 'opened',
    comment: 'commented',
    reviewComment: 'commented on the code',
    commit: 'committed',
    forcePush: 'force-pushed',
    labeled: 'added',
    unlabeled: 'removed',
    assigned: 'assigned',
    unassigned: 'unassigned',
    reviewRequested: 'requested review',
    crossRef: 'mentioned',
    connected: 'linked',
    renamed: 'renamed',
    merged: 'merged',
    closed: 'closed',
    reopened: 'reopened',
    approved: 'approved',
    changes: 'requested changes',
    commented: 'commented',
    dismissed: 'dismissed the review',
    pending: 'has a pending review',
    ci: 'ran CI',
    ciSuccess: 'passed',
    ciFailure: 'failed',
    ciCancelled: 'cancelled',
    ciSkipped: 'skipped',
    ciNeutral: 'was inconclusive',
    ciAction: 'awaiting approval',
    ciTimedOut: 'timed out',
    ciStale: 'went stale',
  },
  greet(period: string, name: string): string {
    return `${period}, ${name}`
  },
  yourTurn(count: number): string {
    return `Your turn · ${count}`
  },
  stats(merged: number, open: number, reply: string): string {
    return `Merged ${merged} in 14 days · ${open} open · Avg first reply ${reply}`
  },
  none: '—',
  days(count: number): string {
    return count === 1 ? '1 day' : `${count} days`
  },
  related(number: number): string {
    return `Related #${number}`
  },
  fixedBy(login: string, number: number): string {
    return `Fixed by @${login} in #${number} ↗`
  },
  reason: {
    claimedOpenPr: 'Claimed, no PR yet',
    claimPending: 'Claim awaiting approval',
    ciFailed: 'CI failed',
    ciLintFailed: 'Lint failed',
    claFailed: 'CLA check failed',
    changesRequested: (actor: string) => `${actor} requested changes`,
    coderabbit: 'CodeRabbit requested changes',
    mentioned: (actor: string) => `${actor} mentioned you`,
    askedPr: (actor: string) => `${actor} asked for a PR or rebase`,
    askedWaiting: 'Asked a question',
    alreadyFixed: 'Noted a fix',
    workaround: 'Noted a workaround',
    openedWaiting: 'Just opened',
    repliedWaiting: 'Replied',
    pushedWaiting: 'Pushed',
    commented: (actor: string) => `${actor} commented`,
    approved: (actor: string) => `${actor} approved`,
    reviewDismissed: (actor: string) => `${actor} dismissed the review`,
    pushed: (actor: string) => `${actor} pushed commits`,
    merged: 'Merged',
    closed: 'Closed',
    clef: 'Needs a look',
  },
  avatarLabel(name: string): string {
    return `${name} menu`
  },
  settings: {
    title: 'Classifier',
    intro:
      'The built-in classifier is only enabled for some accounts. You can add your own OpenAI-compatible endpoint for turns the rules cannot decide.',
    enabled: 'Site classifier is enabled',
    baseUrl: 'Endpoint',
    model: 'Model',
    apiKey: 'API key',
    save: 'Save',
    clear: 'Clear',
    close: 'Close',
    saved: 'Saved',
    cleared: 'Cleared',
    loadFailed: 'Could not load settings',
    saveFailed: 'Could not save',
  },
  login: {
    tagline: 'See where your PRs and issues stand',
    action: 'Sign in with GitHub',
    scope: 'Requests read:user only. Reads public data. Does not comment or merge for you.',
    readOnly: 'Read-only',
  },
}
