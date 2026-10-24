export default defineAppConfig({
  ogCovers: {
    mark: 'froQ',
    colors: {
      title: '#1a1917',
      paper: '#f4f2ec',
      border: 'rgba(26, 25, 23, 0.12)',
      mark: 'rgba(26, 25, 23, 0.11)',
      meta: '#85837c',
      evergreen: 'rgba(22, 163, 74, 0.8)',
    },
  },
  site: {
    nav: [
      { label: 'nav.docs', to: '/docs', external: false },
      { label: 'nav.components', to: '/components', external: false },
      { label: 'nav.changelog', to: '/changelog', external: false },
      { label: 'nav.github', to: 'https://github.com/0froq/ui', external: true },
    ],
    docs: [
      {
        label: 'docs.groups.start',
        items: ['/docs', '/docs/install'],
      },
      {
        label: 'docs.groups.contract',
        items: ['/docs/tokens'],
      },
    ],
  },
})
