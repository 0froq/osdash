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
    kinds: 'Kinds',
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
    later: 'Later',
    laterHour: 'In 1 hour',
    laterTonight: 'Tonight',
    laterTomorrow: 'Tomorrow',
    laterWeek: 'Next week',
  },
  repos: {
    label: 'Repository',
    all: 'All',
    showAll: 'Show all',
    showLess: 'Show less',
    invert: 'Invert',
  },
  note: {
    add: 'Add a note',
    placeholder: 'Write a note',
    save: 'Save',
    cancel: 'Cancel',
    remove: 'Delete note',
    move: 'Move note',
    edit: 'Edit',
    at: 'at',
    current: 'Current position',
    label: 'Note',
    unsaved: 'Unsaved',
    requiresLocal:
      'Bind a storage device to your GitHub account to use notes. Existing cloud notes are read-only.',
    storageOffline:
      'Your storage device is offline. Start os- serve on that device. Changes are not queued.',
    loadingLocal: 'Local notes are loading. Check the connection if editing stays unavailable.',
    legacyReadOnly:
      'Existing cloud notes remain read-only. New notes are saved only in your local workspace.',
    reloadLocal: 'Reload local notes',
    deviceSettings: 'Device settings',
  },
  preview: {
    empty: 'Select a card to see its timeline',
    close: 'Close',
    openGithub: 'Open on GitHub',
    source: 'Source ↗',
    truncated: 'Older activity was not loaded',
    loading: 'Loading timeline',
    failed: 'Could not load the timeline',
    retry: 'Retry',
    you: 'you',
  },
  story: {
    you: 'You',
    justNow: 'now',
    permalink: 'Open on GitHub',
    now: 'Now',
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
    readComment: 'Read comment',
    readLess: 'Hide comment',
    foldLabel(count: number, open: boolean): string {
      return `${open ? 'Hide' : 'Show'} ${count} events`
    },
    events(count: number): string {
      return count === 1 ? '1 event' : `${count} events`
    },
    related: 'Related',
    kind: { pr: 'PR', issue: 'issue' },
    state: { open: 'open', closed: 'closed', merged: 'merged' },
    tag: { maintainer: 'maintainer' },
    on(number: number): string {
      return `on #${number}`
    },
    openedItem: 'opened',
    opened(kind: 'pr' | 'issue', number: number): string {
      return `opened ${kind === 'pr' ? 'PR' : 'issue'} #${number}`
    },
    closes(number: number): string {
      return `closes #${number}`
    },
    mentions(number: number): string {
      return `mentions #${number}`
    },
    merged(number: number): string {
      return `merged #${number}`
    },
    closed(number: number): string {
      return `closed #${number}`
    },
    reopened(number: number): string {
      return `reopened #${number}`
    },
    commented: 'commented',
    commentedOnCode: 'commented on the code',
    approved: 'approved',
    changes: 'requested changes',
    reviewed: 'reviewed',
    dismissed: 'dismissed a review',
    committed: 'pushed a commit',
    forcePushed: 'force-pushed',
    assigned(login: string): string {
      return `assigned ${login}`
    },
    unassigned(login: string): string {
      return `unassigned ${login}`
    },
    reviewRequested(login: string): string {
      return `requested review from ${login}`
    },
    addedLabel: 'added',
    removedLabel: 'removed',
    crossRef(): string {
      return 'mentioned this in'
    },
    connected(): string {
      return 'linked'
    },
    renamed: 'renamed the title',
    checksPassed(count: number): string {
      return count === 1 ? '1 check passed' : `${count} checks passed`
    },
    checksFailed(names: string[]): string {
      return `checks failed: ${names.join(', ')}`
    },
    checksOther(count: number): string {
      return count === 1 ? '1 check finished' : `${count} checks finished`
    },
    relation: {
      yourPr: 'your PR',
      yourIssue: 'your issue',
      theirIssue: 'issue you joined',
      closes(number: number): string {
        return `#${number} closes it`
      },
      mention: 'mentioned',
      history: 'earlier PR, same issue',
      fixedBy(login: string): string {
        return login ? `${login}'s PR` : 'fixing PR'
      },
    },
    summary: {
      comments(count: number): string {
        return count === 1 ? '1 comment' : `${count} comments`
      },
      commits(count: number): string {
        return count === 1 ? '1 commit' : `${count} commits`
      },
      checksPassed: 'checks passed',
      checksFailed: 'checks failed',
      reviews(count: number): string {
        return count === 1 ? '1 review' : `${count} reviews`
      },
      reviewRequested: 'review requested',
      labels(count: number): string {
        return count === 1 ? '1 label' : `${count} labels`
      },
      mentions(numbers: number[]): string {
        return `mentioned in ${numbers.map(number => `#${number}`).join(', ')}`
      },
      bots(count: number): string {
        return count === 1 ? '1 bot' : `${count} bots`
      },
      other(count: number): string {
        return `${count} other`
      },
    },
    next: {
      you: 'You',
      maintainers: 'Maintainers',
      anyone: 'Anyone',
      reviewer: 'Reviewer',
      push(number: number): string {
        return `push to #${number}`
      },
      reviewAgain: 'reviews again',
      fixCheck(number: number): string {
        return `fix the failing check on #${number}`
      },
      signCla(number: number): string {
        return `sign the CLA on #${number}`
      },
      answerBot: 'answer the CodeRabbit comments',
      reply(number: number): string {
        return `reply on #${number}`
      },
      openPr(number: number): string {
        return `open a PR for #${number}`
      },
      openClosingPr(number: number): string {
        return `open a PR that closes #${number}`
      },
      confirmClaim(number: number): string {
        return `confirm the claim on #${number}`
      },
      merge(number: number): string {
        return `merge #${number}`
      },
      reviewCommits: 'review the new commits',
    },
  },
  shortcuts: 'j / k move · Enter / o open · Esc close · e read · g h home',
  shortcutsLabel: 'Shortcuts',
  openedFor(age: string): string {
    return `Opened ${age}`
  },
  sourcePr(number: number): string {
    return `PR #${number}`
  },
  sourceIssue(number: number): string {
    return `issue #${number}`
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
    ciNeutral: 'inconclusive',
    ciAction: 'awaiting approval',
    ciTimedOut: 'timed out',
    ciStale: 'stale',
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
  localConnection: {
    title: 'Storage device',
    optional:
      'Bind one storage device to your GitHub account. Every signed-in browser uses its files while it is online.',
    online: 'Storage device online',
    offline: 'Storage device offline. Start os- serve there. Writes are not queued.',
    name: 'Device name',
    refreshStatus: 'Refresh device status',
    unlink: 'Unlink storage device',
    unlinkWarning:
      'Unlink this device from your account? Its local files are kept, but other browsers lose access.',
    confirmUnlink: 'Confirm unlink',
    keepDevice: 'Keep device',
    unlinkFailed: 'Could not confirm unlinking. Refresh device status before retrying.',
    disconnected: 'Not connected',
    connecting: 'Waiting for this device…',
    connected: 'Paired with this browser tab',
    signedOut: 'Sign in with GitHub before connecting this device.',
    setup: 'Run the local bridge',
    install:
      'Install on the machine that will store your notes, then open this site there for initial binding. Requires curl and Node 24.21.0 or Node 26+:',
    workspace: 'Change to your chosen workspace directory, then run:',
    account: 'GitHub account',
    source: 'View source on GitHub',
    instructions:
      'The command starts a background service, so Terminal can close. Paste its one-use code below within five minutes. Other computers only need to sign in afterward.',
    permissions:
      'Initial binding needs local network permission on the storage machine. Other browsers use the account relay and do not need local pairing.',
    scope:
      'Your files stay on the storage device. Cloudflare stores binding metadata and relays note content without persisting note bodies. GitHub tokens are never sent to the device.',
    pairingCode: 'Pairing code',
    connect: 'Bind this storage device',
    disconnect: 'Forget local setup permission',
    cancel: 'Cancel connection',
    refresh: 'Read configuration again',
    locale: 'Language',
    notesDirectory: 'Notes directory setting',
    configured: 'Workspace ready',
    notConfigured: 'Not configured',
    configFailed: 'Could not read local configuration. Check that the bridge is still running.',
    troubleshooting:
      'Check os- status and browser local network permission. Run os- restart for a new pairing code. The code only works on the storage machine.',
    lifetime:
      'Storage runs in the background and starts after OS login. Use os- stop to stop it and disable automatic startup. Unlink to revoke remote access. Local setup permission expires after eight hours.',
  },
  settings: {
    title: 'Settings',
    classifier: 'Classifier',
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
    scope:
      'Requests read:user and notifications. Marks a card read on GitHub too. Does not comment or merge for you.',
    readOnly: 'Read-only',
  },
}
