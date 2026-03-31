// docmd.config.js
module.exports = {
  // --- Core Metadata ---
  siteTitle: 'Satori',
  siteUrl: 'https://nisoku.github.io/Satori/docs',

  // --- Branding ---
  logo: {
    light: 'assets/images/satori-logo-light.svg',
    dark: 'assets/images/satori-logo-dark.svg',
    alt: 'Satori',
    href: './',
  },
  favicon: 'assets/icons/favicon.svg',

  // --- Source & Output ---
  srcDir: 'docs',
  outputDir: 'site',

  // --- Theme & Layout ---
  theme: {
    name: 'ruby',
    defaultMode: 'system',
    enableModeToggle: true,
    positionMode: 'top',
    codeHighlight: true,
    customCss: [],
  },

  // --- Features ---
  search: true,
  minify: true,
  autoTitleFromH1: true,
  copyCode: true,
  pageNavigation: true,

  // --- Navigation (Sidebar) ---
  navigation: [
    { title: 'Home', path: '/', icon: 'home' },
    { title: 'Interactive Demo', path: 'https://nisoku.github.io/Satori/demo/', icon: 'play-circle', external: true },
    {
      title: 'Getting Started',
      icon: 'rocket',
      collapsible: false,
      children: [
        { title: 'Quick Start', path: '/getting-started/quickstart', icon: 'play' },
        { title: 'Configuration', path: '/getting-started/configuration', icon: 'settings' },
      ],
    },
    {
      title: 'Guide',
      icon: 'book-open',
      collapsible: false,
      children: [
        { title: 'Overview', path: '/guide/', icon: 'book' },
        { title: 'State Watching', path: '/guide/watching', icon: 'eye' },
        { title: 'Causal Linking', path: '/guide/causal', icon: 'git-branch' },
        { title: 'Filtering Events', path: '/guide/filtering', icon: 'filter' },
        { title: 'Advanced Features', path: '/guide/advanced', icon: 'zap' },
        { title: 'Examples', path: '/guide/examples', icon: 'code' },
      ],
    },
    {
      title: 'API Reference',
      icon: 'file-code',
      collapsible: false,
      children: [
        { title: 'Core API', path: '/api/core', icon: 'box' },
        { title: 'Filters', path: '/api/filters', icon: 'filter' },
      ],
    },
    { title: 'GitHub', path: 'https://github.com/Nisoku/Satori', icon: 'github', external: true },
  ],

  // --- Plugins ---
  plugins: {
    seo: {
      defaultDescription: 'Observable event logging library for JavaScript and TypeScript. Structured logging with state watching, causal linking, and advanced filtering.',
      openGraph: {
        defaultImage: '',
      },
      twitter: {
        cardType: 'summary_large_image',
      }
    },
    // analytics: {
    //   googleV4: {
    //     measurementId: 'G-X9WTDL262N' // Replace with your Google Analytics Measurement ID
    //   }
    // },
    sitemap: {
      defaultChangefreq: 'weekly',
      defaultPriority: 0.8
    }
  },

  // --- Footer ---
  footer: 'Built with [docmd](https://docmd.io). [View on GitHub](https://github.com/Nisoku/Satori).',

  // --- Edit Link ---
  editLink: {
    enabled: true,
    baseUrl: 'https://github.com/Nisoku/Satori/edit/main/Docs/docs',
    text: 'Edit this page'
  }
};
