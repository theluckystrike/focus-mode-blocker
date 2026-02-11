# Focus Mode - Blocker: Build System & MV2-to-MV3 Migration Reference

> **Extension:** Focus Mode - Blocker v1.0.0
> **Architecture:** Chrome Manifest V3 native (no MV2 legacy)
> **Build tool:** Vite (primary), Webpack (alternative)
> **Language:** TypeScript -> JavaScript
> **Target:** Chrome 116+, Edge (Chromium), Brave

---

## Section 8: Build System & Project Structure

---

### 8.1 Project Structure

```
focus-mode-blocker/
├── src/
│   ├── background/                 # Service worker modules (18 files)
│   │   ├── service-worker.ts       # Entry point — registers listeners, imports modules
│   │   ├── alarm-manager.ts        # chrome.alarms scheduling and dispatch
│   │   ├── badge-manager.ts        # Icon badge text/color updates
│   │   ├── blocking-engine.ts      # DNR rule CRUD orchestration
│   │   ├── context-menu.ts         # Right-click context menu setup
│   │   ├── daily-reset.ts          # Midnight stats/streak reset logic
│   │   ├── focus-session.ts        # Session start/pause/stop state machine
│   │   ├── idle-detector.ts        # chrome.idle monitoring
│   │   ├── install-handler.ts      # onInstalled first-run / update handler
│   │   ├── message-router.ts       # chrome.runtime.onMessage dispatch
│   │   ├── notification-manager.ts # chrome.notifications wrapper
│   │   ├── offscreen-bridge.ts     # Offscreen document lifecycle
│   │   ├── quota-tracker.ts        # Daily DNR rule quota accounting
│   │   ├── rule-compiler.ts        # User blocklist -> DNR rule JSON
│   │   ├── schedule-engine.ts      # Recurring schedule evaluation
│   │   ├── state-manager.ts        # chrome.storage.session read/write
│   │   ├── stats-aggregator.ts     # Focus time / block count rollups
│   │   └── storage-sync.ts         # chrome.storage.sync read/write helpers
│   │
│   ├── content/                    # Content scripts (3 files, standalone)
│   │   ├── detector.ts             # DOM mutation observer — detects distractions
│   │   ├── blocker.ts              # Overlay injection when page is blocked
│   │   └── tracker.ts              # Time-on-page telemetry
│   │
│   ├── popup/                      # Popup UI
│   │   ├── popup.html
│   │   ├── popup.ts                # Popup entry point
│   │   ├── popup.css
│   │   ├── components/
│   │   │   ├── timer-display.ts    # Countdown ring component
│   │   │   ├── quick-block.ts      # One-click block current site
│   │   │   ├── session-controls.ts # Start / pause / stop buttons
│   │   │   └── stats-summary.ts    # Today's stats card
│   │   └── stores/
│   │       └── popup-state.ts      # Reactive popup state
│   │
│   ├── options/                    # Options page
│   │   ├── options.html
│   │   ├── options.ts
│   │   ├── options.css
│   │   ├── tabs/
│   │   │   ├── blocklist-tab.ts    # Manage blocked sites
│   │   │   ├── schedule-tab.ts     # Recurring schedules
│   │   │   ├── general-tab.ts      # Theme, notifications, sounds
│   │   │   └── data-tab.ts         # Import / export / reset
│   │   └── components/
│   │       ├── site-list.ts        # Editable site table
│   │       └── time-picker.ts      # Schedule time picker
│   │
│   ├── pages/                      # Full-page extension pages
│   │   ├── blocked/
│   │   │   ├── blocked.html        # "This site is blocked" interstitial
│   │   │   ├── blocked.ts
│   │   │   └── blocked.css
│   │   └── onboarding/
│   │       ├── onboarding.html     # First-run setup wizard
│   │       ├── onboarding.ts
│   │       └── onboarding.css
│   │
│   ├── shared/                     # Shared utilities, types, constants
│   │   ├── types/
│   │   │   ├── index.ts            # Re-exports
│   │   │   ├── blocking.ts         # BlockRule, BlockList, RuleAction
│   │   │   ├── focus-session.ts    # Session, SessionState, SessionConfig
│   │   │   ├── messages.ts         # MessageType enum, MessagePayloads
│   │   │   ├── settings.ts         # UserSettings, ScheduleConfig
│   │   │   └── stats.ts            # DailyStats, WeeklyReport
│   │   ├── constants.ts            # ALARM_NAMES, STORAGE_KEYS, LIMITS
│   │   ├── logger.ts              # Structured logger (dev/prod modes)
│   │   ├── url-utils.ts           # Domain extraction, pattern matching
│   │   ├── time-utils.ts          # Duration formatting, timezone helpers
│   │   ├── storage-helpers.ts     # Typed chrome.storage wrappers
│   │   ├── message-helpers.ts     # Typed sendMessage / onMessage helpers
│   │   └── validators.ts         # Input validation (URLs, schedules)
│   │
│   ├── assets/
│   │   ├── icons/
│   │   │   ├── icon-16.png
│   │   │   ├── icon-32.png
│   │   │   ├── icon-48.png
│   │   │   ├── icon-128.png
│   │   │   ├── icon-16-active.png  # Green tint — session active
│   │   │   ├── icon-32-active.png
│   │   │   ├── icon-48-active.png
│   │   │   └── icon-128-active.png
│   │   ├── images/
│   │   │   ├── blocked-illustration.svg
│   │   │   └── onboarding-hero.svg
│   │   └── sounds/
│   │       ├── session-start.mp3   # Short chime (<50KB)
│   │       ├── session-end.mp3
│   │       └── warning.mp3
│   │
│   └── _locales/
│       ├── en/
│       │   └── messages.json
│       ├── es/
│       │   └── messages.json
│       ├── fr/
│       │   └── messages.json
│       ├── de/
│       │   └── messages.json
│       └── ja/
│           └── messages.json
│
├── tests/
│   ├── unit/
│   │   ├── background/
│   │   │   ├── alarm-manager.test.ts
│   │   │   ├── blocking-engine.test.ts
│   │   │   ├── focus-session.test.ts
│   │   │   ├── rule-compiler.test.ts
│   │   │   ├── schedule-engine.test.ts
│   │   │   ├── state-manager.test.ts
│   │   │   └── stats-aggregator.test.ts
│   │   ├── content/
│   │   │   ├── detector.test.ts
│   │   │   ├── blocker.test.ts
│   │   │   └── tracker.test.ts
│   │   ├── shared/
│   │   │   ├── url-utils.test.ts
│   │   │   ├── time-utils.test.ts
│   │   │   ├── validators.test.ts
│   │   │   └── storage-helpers.test.ts
│   │   └── popup/
│   │       └── popup-state.test.ts
│   ├── integration/
│   │   ├── blocking-flow.test.ts
│   │   ├── session-lifecycle.test.ts
│   │   └── storage-sync.test.ts
│   ├── e2e/
│   │   ├── popup.spec.ts           # Playwright
│   │   ├── blocking.spec.ts
│   │   ├── options.spec.ts
│   │   └── onboarding.spec.ts
│   ├── fixtures/
│   │   ├── mock-chrome.ts          # Chrome API mocks
│   │   ├── sample-rules.ts         # Test DNR rules
│   │   └── sample-settings.ts      # Test user settings
│   └── setup.ts                    # Jest global setup
│
├── scripts/
│   ├── build.ts                    # Production build orchestrator
│   ├── dev.ts                      # Development server with reload
│   ├── package-extension.ts        # Create .zip / .xpi for store upload
│   ├── validate-manifest.ts        # Manifest schema validation
│   ├── validate-csp.ts             # CSP policy linter
│   ├── check-bundle-size.ts        # Size budget enforcement
│   ├── bump-version.ts             # Semver version bump
│   ├── generate-icons.ts           # Resize source icon to all sizes
│   ├── release.ts                  # Full release pipeline
│   └── transform-manifest.ts       # Chrome -> Firefox/Edge manifest
│
├── rules/
│   ├── static-rules.json           # Bundled DNR rules (common blocklist)
│   └── rule-schema.json            # JSON Schema for rule validation
│
├── docs/                           # Documentation
│   └── mv3-architecture/
│       ├── agent1-core-apis.md
│       ├── agent2-security-messaging.md
│       ├── agent3-storage-testing.md
│       └── agent4-build-migration.md  # This file
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                  # Lint, type-check, test, build, size check
│   │   ├── release.yml             # Tag-triggered CWS publish
│   │   └── codeql.yml              # Security scanning
│   └── PULL_REQUEST_TEMPLATE.md
│
├── dist/                           # Build output (gitignored)
│
├── manifest.json                   # Source manifest (Chrome MV3)
├── vite.config.ts                  # Vite build configuration
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.test.json              # TypeScript config for tests
├── jest.config.js                  # Jest test configuration
├── playwright.config.ts            # Playwright E2E configuration
├── package.json
├── .eslintrc.cjs                   # ESLint configuration
├── .prettierrc                     # Prettier configuration
├── .gitignore
├── .env.example                    # Environment variable template
└── LICENSE
```

---

### 8.2 Vite Build Configuration

```typescript
// vite.config.ts
// Focus Mode - Blocker: Vite build configuration for Chrome MV3

import { defineConfig, type UserConfig } from 'vite';
import { resolve, join } from 'path';
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { cpSync, mkdirSync, existsSync } from 'fs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read package.json version for manifest injection */
function getPackageVersion(): string {
  const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
  return pkg.version; // e.g. "1.0.0"
}

/** Copy and transform manifest.json into dist/ */
function manifestPlugin() {
  return {
    name: 'focus-mode-manifest',
    writeBundle() {
      const src = resolve(__dirname, 'manifest.json');
      const dest = resolve(__dirname, 'dist', 'manifest.json');
      const manifest = JSON.parse(readFileSync(src, 'utf-8'));

      // Inject version from package.json (single source of truth)
      manifest.version = getPackageVersion();

      // Inject Sentry DSN into externally_connectable if present
      if (process.env.SENTRY_DSN) {
        manifest.externally_connectable = manifest.externally_connectable || {};
        // Sentry DSN is injected at runtime via env, not in manifest
      }

      writeFileSync(dest, JSON.stringify(manifest, null, 2));
    },
  };
}

/** Copy static assets that are not processed by Vite */
function copyStaticAssetsPlugin() {
  return {
    name: 'focus-mode-copy-assets',
    writeBundle() {
      const distDir = resolve(__dirname, 'dist');

      // Copy _locales/
      const localesSource = resolve(__dirname, 'src', '_locales');
      const localesDest = resolve(distDir, '_locales');
      if (existsSync(localesSource)) {
        cpSync(localesSource, localesDest, { recursive: true });
      }

      // Copy rules/
      const rulesSource = resolve(__dirname, 'rules');
      const rulesDest = resolve(distDir, 'rules');
      if (existsSync(rulesSource)) {
        cpSync(rulesSource, rulesDest, { recursive: true });
      }

      // Copy icons
      const iconsSource = resolve(__dirname, 'src', 'assets', 'icons');
      const iconsDest = resolve(distDir, 'src', 'assets', 'icons');
      if (existsSync(iconsSource)) {
        mkdirSync(iconsDest, { recursive: true });
        cpSync(iconsSource, iconsDest, { recursive: true });
      }

      // Copy images
      const imagesSource = resolve(__dirname, 'src', 'assets', 'images');
      const imagesDest = resolve(distDir, 'src', 'assets', 'images');
      if (existsSync(imagesSource)) {
        mkdirSync(imagesDest, { recursive: true });
        cpSync(imagesSource, imagesDest, { recursive: true });
      }

      // Copy sounds
      const soundsSource = resolve(__dirname, 'src', 'assets', 'sounds');
      const soundsDest = resolve(distDir, 'src', 'assets', 'sounds');
      if (existsSync(soundsSource)) {
        mkdirSync(soundsDest, { recursive: true });
        cpSync(soundsSource, soundsDest, { recursive: true });
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Environment variables exposed to extension code
// ---------------------------------------------------------------------------

function getDefines(mode: string): Record<string, string> {
  return {
    '__DEV__': JSON.stringify(mode === 'development'),
    '__VERSION__': JSON.stringify(getPackageVersion()),
    // Sentry DSN — only injected in production builds
    'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || ''),
    // Stripe key for premium features
    'process.env.STRIPE_KEY': JSON.stringify(process.env.STRIPE_KEY || ''),
    // API base URL for optional cloud sync
    'process.env.API_URL': JSON.stringify(
      process.env.API_URL || 'https://api.focusmodeblocker.com'
    ),
  };
}

// ---------------------------------------------------------------------------
// Main config
// ---------------------------------------------------------------------------

export default defineConfig(({ mode }): UserConfig => {
  const isProd = mode === 'production';

  return {
    // -----------------------------------------------------------------------
    // Resolve
    // -----------------------------------------------------------------------
    resolve: {
      alias: {
        '@background': resolve(__dirname, 'src/background'),
        '@content': resolve(__dirname, 'src/content'),
        '@popup': resolve(__dirname, 'src/popup'),
        '@options': resolve(__dirname, 'src/options'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@shared': resolve(__dirname, 'src/shared'),
        '@assets': resolve(__dirname, 'src/assets'),
      },
    },

    // -----------------------------------------------------------------------
    // Define (compile-time constants)
    // -----------------------------------------------------------------------
    define: getDefines(mode),

    // -----------------------------------------------------------------------
    // Build
    // -----------------------------------------------------------------------
    build: {
      outDir: 'dist',
      emptyOutDir: true,

      // Target Chrome 116+ — use modern JS freely
      target: 'es2022',

      // Disable Vite's default index.html entry; we use rollupOptions
      // to define multiple entry points
      rollupOptions: {
        input: {
          // ----- Service worker (single bundle from 18 modules) -----
          'src/background/service-worker': resolve(
            __dirname,
            'src/background/service-worker.ts'
          ),

          // ----- Content scripts (each standalone, no shared chunks) -----
          'src/content/detector': resolve(__dirname, 'src/content/detector.ts'),
          'src/content/blocker': resolve(__dirname, 'src/content/blocker.ts'),
          'src/content/tracker': resolve(__dirname, 'src/content/tracker.ts'),

          // ----- HTML entry points (Vite processes <script> tags) -----
          'src/popup/popup': resolve(__dirname, 'src/popup/popup.html'),
          'src/options/options': resolve(__dirname, 'src/options/options.html'),
          'src/pages/blocked': resolve(__dirname, 'src/pages/blocked/blocked.html'),
          'src/pages/onboarding': resolve(
            __dirname,
            'src/pages/onboarding/onboarding.html'
          ),
        },

        output: {
          // Preserve the src/ directory structure in dist/
          entryFileNames: '[name].js',
          chunkFileNames: 'src/shared/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            // CSS files go next to their HTML entry points
            if (assetInfo.name?.endsWith('.css')) {
              return '[name][extname]';
            }
            return 'src/assets/[name][extname]';
          },

          // CRITICAL: Content scripts MUST NOT share chunks.
          // Chrome loads each content script in isolation — shared chunks
          // would fail to load because there is no module loader on the page.
          manualChunks(id) {
            // Content script modules must be inlined, never split
            if (
              id.includes('src/content/detector') ||
              id.includes('src/content/blocker') ||
              id.includes('src/content/tracker')
            ) {
              return undefined; // No chunk — inline everything
            }

            // Service worker modules must be in a single bundle
            if (id.includes('src/background/')) {
              return undefined; // Rolled into the service-worker entry
            }

            // Shared utilities used by popup/options/pages can share a chunk
            if (id.includes('src/shared/')) {
              return 'src/shared/shared-utils';
            }

            return undefined;
          },
        },
      },

      // Source maps
      sourcemap: isProd ? 'hidden' : true,

      // Minification
      minify: isProd ? 'terser' : false,
      terserOptions: isProd
        ? {
            compress: {
              drop_console: true,    // Remove console.log in production
              drop_debugger: true,
              pure_funcs: ['console.debug', 'console.trace'],
              passes: 2,
            },
            mangle: {
              // Do not mangle Chrome API property names
              reserved: ['chrome', 'browser'],
            },
            format: {
              comments: false,       // Strip comments
            },
          }
        : undefined,

      // Do not inline assets — extensions need files on disk
      assetsInlineLimit: 0,

      // Chrome MV3 does NOT support ES modules in content scripts.
      // Service worker CAN use module type (declared in manifest).
      // Set to 'es' — Vite tree-shakes, and for content scripts we
      // ensure no chunk splitting via manualChunks above.
      // NOTE: We use IIFE format for content scripts via a post-build
      // wrapper step (see contentScriptIIFEPlugin below).
      modulePreload: false, // Not needed for extensions
    },

    // -----------------------------------------------------------------------
    // CSS
    // -----------------------------------------------------------------------
    css: {
      // Extract CSS into separate files (not inlined in JS)
      // Vite does this by default for multi-page builds.
      devSourcemap: true,
    },

    // -----------------------------------------------------------------------
    // Plugins
    // -----------------------------------------------------------------------
    plugins: [
      manifestPlugin(),
      copyStaticAssetsPlugin(),
      contentScriptIIFEPlugin(),
    ],

    // -----------------------------------------------------------------------
    // Dev server — not used directly (extensions load from disk)
    // but watch mode rebuilds on save
    // -----------------------------------------------------------------------
    server: {
      port: 5173,
      hmr: false, // HMR does not work with Chrome extensions
    },
  };
});

// ---------------------------------------------------------------------------
// Content Script IIFE Wrapper Plugin
// ---------------------------------------------------------------------------
// Chrome MV3 content scripts cannot use ES module syntax. This plugin
// wraps each content script output in an IIFE after Vite finishes bundling.

function contentScriptIIFEPlugin() {
  const contentScripts = [
    'src/content/detector.js',
    'src/content/blocker.js',
    'src/content/tracker.js',
  ];

  return {
    name: 'focus-mode-content-iife',
    writeBundle() {
      for (const script of contentScripts) {
        const filePath = resolve(__dirname, 'dist', script);
        if (!existsSync(filePath)) continue;

        const code = readFileSync(filePath, 'utf-8');

        // Skip if already wrapped
        if (code.startsWith('(function()')) continue;

        // Wrap in IIFE to prevent global scope pollution and avoid
        // top-level import/export statements that Chrome rejects
        const wrapped = `(function(){\n"use strict";\n${code}\n})();\n`;
        writeFileSync(filePath, wrapped);
      }
    },
  };
}
```

**Key Vite design decisions for MV3:**

| Decision | Rationale |
|---|---|
| Multiple `input` entries | Each script/page is a separate Chrome extension entry point |
| `manualChunks` returning `undefined` for content scripts | Content scripts run in page context without a module loader |
| IIFE wrapper plugin | Chrome MV3 content scripts reject top-level `import`/`export` |
| `assetsInlineLimit: 0` | Extension files must exist on disk for `chrome.runtime.getURL` |
| `target: 'es2022'` | Chrome 116+ supports all ES2022 features natively |
| `drop_console` in terser | Prevents debug logs from leaking to production |
| Hidden source maps | Uploaded to Sentry but not shipped in the `.zip` |
| `hmr: false` | Hot module replacement does not work in extension contexts |

---

### 8.3 Webpack Alternative Configuration

```javascript
// webpack.config.js
// Focus Mode - Blocker: Webpack 5 build configuration for Chrome MV3
// Use this if your team prefers Webpack over Vite.

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin } = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const pkg = require('./package.json');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  const analyze = env?.analyze === 'true';

  return {
    // -----------------------------------------------------------------------
    // Entry points
    // -----------------------------------------------------------------------
    entry: {
      // Service worker — single bundle from 18 modules
      'src/background/service-worker': './src/background/service-worker.ts',

      // Content scripts — each standalone
      'src/content/detector': './src/content/detector.ts',
      'src/content/blocker': './src/content/blocker.ts',
      'src/content/tracker': './src/content/tracker.ts',

      // UI entry points
      'src/popup/popup': './src/popup/popup.ts',
      'src/options/options': './src/options/options.ts',
      'src/pages/blocked': './src/pages/blocked/blocked.ts',
      'src/pages/onboarding': './src/pages/onboarding/onboarding.ts',
    },

    // -----------------------------------------------------------------------
    // Output
    // -----------------------------------------------------------------------
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },

    // -----------------------------------------------------------------------
    // Resolve
    // -----------------------------------------------------------------------
    resolve: {
      extensions: ['.ts', '.js', '.json'],
      alias: {
        '@background': path.resolve(__dirname, 'src/background'),
        '@content': path.resolve(__dirname, 'src/content'),
        '@popup': path.resolve(__dirname, 'src/popup'),
        '@options': path.resolve(__dirname, 'src/options'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@assets': path.resolve(__dirname, 'src/assets'),
      },
    },

    // -----------------------------------------------------------------------
    // Module rules
    // -----------------------------------------------------------------------
    module: {
      rules: [
        // TypeScript
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        // CSS extraction
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
        // Assets (images, sounds)
        {
          test: /\.(png|svg|jpg|jpeg|gif|mp3|wav|ogg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'src/assets/[name][ext]',
          },
        },
      ],
    },

    // -----------------------------------------------------------------------
    // Plugins
    // -----------------------------------------------------------------------
    plugins: [
      // Compile-time constants
      new DefinePlugin({
        '__DEV__': JSON.stringify(!isProd),
        '__VERSION__': JSON.stringify(pkg.version),
        'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || ''),
        'process.env.STRIPE_KEY': JSON.stringify(process.env.STRIPE_KEY || ''),
        'process.env.API_URL': JSON.stringify(
          process.env.API_URL || 'https://api.focusmodeblocker.com'
        ),
      }),

      // Extract CSS into separate files
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),

      // HTML pages
      new HtmlWebpackPlugin({
        template: './src/popup/popup.html',
        filename: 'src/popup/popup.html',
        chunks: ['src/popup/popup'],
        inject: 'body',
      }),
      new HtmlWebpackPlugin({
        template: './src/options/options.html',
        filename: 'src/options/options.html',
        chunks: ['src/options/options'],
        inject: 'body',
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/blocked/blocked.html',
        filename: 'src/pages/blocked.html',
        chunks: ['src/pages/blocked'],
        inject: 'body',
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/onboarding/onboarding.html',
        filename: 'src/pages/onboarding.html',
        chunks: ['src/pages/onboarding'],
        inject: 'body',
      }),

      // Copy static assets
      new CopyWebpackPlugin({
        patterns: [
          // Manifest — with version injection
          {
            from: 'manifest.json',
            to: 'manifest.json',
            transform(content) {
              const manifest = JSON.parse(content.toString());
              manifest.version = pkg.version;
              return JSON.stringify(manifest, null, 2);
            },
          },
          // Locales
          { from: 'src/_locales', to: '_locales' },
          // DNR rules
          { from: 'rules', to: 'rules' },
          // Icons
          { from: 'src/assets/icons', to: 'src/assets/icons' },
          // Images
          { from: 'src/assets/images', to: 'src/assets/images' },
          // Sounds
          { from: 'src/assets/sounds', to: 'src/assets/sounds' },
        ],
      }),

      // Bundle analyzer (opt-in)
      ...(analyze
        ? [
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              reportFilename: '../bundle-report.html',
              openAnalyzer: false,
            }),
          ]
        : []),
    ],

    // -----------------------------------------------------------------------
    // Optimization
    // -----------------------------------------------------------------------
    optimization: {
      minimize: isProd,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.debug', 'console.trace'],
              passes: 2,
            },
            mangle: {
              reserved: ['chrome', 'browser'],
            },
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],

      // CRITICAL: Do NOT split chunks for content scripts or service worker.
      // Content scripts have no module loader. Service worker must be a
      // single file declared in manifest.json.
      splitChunks: {
        cacheGroups: {
          // Shared utilities for popup + options + pages only
          shared: {
            test: /[\\/]src[\\/]shared[\\/]/,
            name: 'src/shared/shared-utils',
            // Only include chunks from UI entry points
            chunks(chunk) {
              return (
                chunk.name?.includes('popup') ||
                chunk.name?.includes('options') ||
                chunk.name?.includes('pages') ||
                chunk.name?.includes('blocked') ||
                chunk.name?.includes('onboarding')
              );
            },
            minSize: 0,
            minChunks: 2,
          },
        },
      },
    },

    // -----------------------------------------------------------------------
    // Source maps
    // -----------------------------------------------------------------------
    devtool: isProd ? 'hidden-source-map' : 'cheap-module-source-map',

    // -----------------------------------------------------------------------
    // Watch mode
    // -----------------------------------------------------------------------
    watchOptions: {
      ignored: /node_modules|dist/,
      poll: 1000, // Fallback polling for some file systems
    },

    // -----------------------------------------------------------------------
    // Performance
    // -----------------------------------------------------------------------
    performance: {
      hints: isProd ? 'error' : 'warning',
      maxEntrypointSize: 150 * 1024,   // 150KB per entry point
      maxAssetSize: 150 * 1024,
    },

    // Suppress node polyfill warnings (not needed in extensions)
    node: false,
  };
};
```

**Webpack vs Vite for MV3 extensions:**

| Aspect | Vite | Webpack |
|---|---|---|
| Build speed (cold) | ~2s | ~8s |
| Build speed (incremental) | ~200ms | ~1.5s |
| Config complexity | Lower | Higher |
| Plugin ecosystem for extensions | Growing | Mature |
| Content script IIFE wrapping | Custom plugin needed | Native via output.library |
| Bundle analysis | rollup-plugin-visualizer | webpack-bundle-analyzer |
| Chrome extension plugins | vite-plugin-crx, rollup-plugin-chrome-extension | webpack-extension-reloader |

---

### 8.4 TypeScript Configuration

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    // ---- Target ----
    // Chrome 116+ supports all ES2022 features natively.
    // Using ESNext module system for MV3 module service worker.
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    // ---- Strictness ----
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,

    // ---- Module interop ----
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false,

    // ---- Emit ----
    // Vite/Webpack handles transpilation; TS only type-checks.
    "noEmit": true,
    "declaration": false,
    "sourceMap": true,

    // ---- Path aliases ----
    // Must match vite.config.ts resolve.alias entries
    "baseUrl": ".",
    "paths": {
      "@background/*": ["src/background/*"],
      "@content/*": ["src/content/*"],
      "@popup/*": ["src/popup/*"],
      "@options/*": ["src/options/*"],
      "@pages/*": ["src/pages/*"],
      "@shared/*": ["src/shared/*"],
      "@assets/*": ["src/assets/*"]
    },

    // ---- Types ----
    // chrome-types provides complete Chrome extension API typings.
    // @anthropic: Do NOT use @types/chrome — chrome-types is more
    // up-to-date and covers MV3 APIs like declarativeNetRequest.
    "types": ["chrome-types"],

    // ---- Other ----
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": [
    "src/**/*.ts",
    "scripts/**/*.ts",
    "vite.config.ts",
    "vite-env.d.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests"
  ]
}
```

```jsonc
// tsconfig.test.json
// Separate config for test files — extends the main config but adds
// Jest types and includes the tests/ directory.
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["chrome-types", "jest", "@types/jest"],
    // Tests may use CommonJS require() for fixtures
    "module": "CommonJS",
    "moduleResolution": "node",
    // Slightly relaxed for test convenience
    "exactOptionalPropertyTypes": false,
    "noPropertyAccessFromIndexSignature": false
  },
  "include": [
    "src/**/*.ts",
    "tests/**/*.ts"
  ]
}
```

```typescript
// vite-env.d.ts
// Ambient type declarations for compile-time constants injected by Vite

/** True when mode === 'development' */
declare const __DEV__: boolean;

/** Extension version from package.json (e.g. "1.0.0") */
declare const __VERSION__: string;

// Environment variables injected at build time
declare namespace NodeJS {
  interface ProcessEnv {
    /** Sentry DSN for error reporting */
    SENTRY_DSN: string;
    /** Stripe publishable key for premium features */
    STRIPE_KEY: string;
    /** Cloud sync API base URL */
    API_URL: string;
  }
}
```

**Why `chrome-types` instead of `@types/chrome`:**

- `chrome-types` is auto-generated from Chromium source, always current
- Includes full `declarativeNetRequest` typings (MV3-critical)
- Includes `chrome.storage.session` types
- Includes `chrome.offscreen` types
- `@types/chrome` lags behind and has incomplete MV3 coverage

Install: `npm install -D chrome-types`

---

### 8.5 Package.json Scripts

```jsonc
// package.json
{
  "name": "focus-mode-blocker",
  "version": "1.0.0",
  "description": "Focus Mode - Blocker: Block distracting websites and stay focused",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "scripts": {
    // ---- Development ----
    "dev": "vite build --watch --mode development",
    "dev:verbose": "DEBUG=focus-mode:* vite build --watch --mode development",
    "dev:reload": "tsx scripts/dev.ts",

    // ---- Build ----
    "build": "vite build --mode production",
    "build:dev": "vite build --mode development",
    "build:staging": "SENTRY_DSN=$SENTRY_DSN_STAGING vite build --mode production",
    "build:firefox": "BROWSER_TARGET=firefox tsx scripts/build.ts",
    "build:edge": "BROWSER_TARGET=edge tsx scripts/build.ts",
    "build:all": "npm run build && npm run build:firefox && npm run build:edge",
    "build:analyze": "ANALYZE=true vite build --mode production",
    "build:profile": "vite build --mode production --profile",

    // ---- Type checking ----
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",

    // ---- Linting ----
    "lint": "eslint 'src/**/*.ts' 'tests/**/*.ts' 'scripts/**/*.ts'",
    "lint:fix": "eslint 'src/**/*.ts' 'tests/**/*.ts' 'scripts/**/*.ts' --fix",
    "lint:strict": "eslint 'src/**/*.ts' --max-warnings 0",
    "format": "prettier --write 'src/**/*.{ts,css,html,json}' 'tests/**/*.ts'",
    "format:check": "prettier --check 'src/**/*.{ts,css,html,json}' 'tests/**/*.ts'",

    // ---- Testing ----
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern='tests/unit'",
    "test:integration": "jest --testPathPattern='tests/integration'",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:ci": "jest --ci --coverage --maxWorkers=2",

    // ---- Validation ----
    "validate": "npm run type-check && npm run lint:strict && npm run test:ci && npm run build && npm run validate:manifest && npm run validate:csp && npm run check:size",
    "validate:manifest": "tsx scripts/validate-manifest.ts",
    "validate:csp": "tsx scripts/validate-csp.ts",
    "check:size": "tsx scripts/check-bundle-size.ts",
    "check:deps": "npx depcheck",
    "check:licenses": "npx license-checker --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC'",

    // ---- Packaging ----
    "package": "npm run build && tsx scripts/package-extension.ts --target chrome",
    "package:firefox": "npm run build:firefox && tsx scripts/package-extension.ts --target firefox",
    "package:edge": "npm run build:edge && tsx scripts/package-extension.ts --target edge",
    "package:all": "npm run package && npm run package:firefox && npm run package:edge",

    // ---- Release ----
    "version:patch": "tsx scripts/bump-version.ts patch",
    "version:minor": "tsx scripts/bump-version.ts minor",
    "version:major": "tsx scripts/bump-version.ts major",
    "release": "tsx scripts/release.ts",
    "release:dry-run": "tsx scripts/release.ts --dry-run",

    // ---- Utilities ----
    "icons:generate": "tsx scripts/generate-icons.ts",
    "manifest:transform": "tsx scripts/transform-manifest.ts",
    "clean": "rm -rf dist coverage .vite",
    "clean:all": "rm -rf dist coverage .vite node_modules",
    "prepare": "husky install"
  },

  // ---- Dependencies ----
  // Focus Mode limits runtime deps to 3 maximum (performance budget).
  "dependencies": {
    // Lightweight IndexedDB wrapper for stats storage
    "idb-keyval": "^6.2.1",
    // Tiny event emitter for internal pub/sub
    "mitt": "^3.0.1",
    // Date formatting without the weight of moment/dayjs
    "tinytime": "^0.2.6"
  },

  "devDependencies": {
    // TypeScript
    "typescript": "^5.4.0",
    "chrome-types": "^0.1.280",

    // Build
    "vite": "^5.2.0",
    "terser": "^5.30.0",
    "tsx": "^4.7.0",

    // Linting / Formatting
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.0",
    "prettier": "^3.2.0",

    // Testing
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "@types/jest": "^29.5.0",
    "@playwright/test": "^1.42.0",

    // Git hooks
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0",

    // Utilities
    "archiver": "^7.0.0",
    "@types/archiver": "^6.0.0",
    "rollup-plugin-visualizer": "^5.12.0"
  },

  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.{css,html,json}": ["prettier --write"],
    "manifest.json": ["tsx scripts/validate-manifest.ts"]
  }
}
```

---

### 8.6 ESLint & Prettier Configuration

```javascript
// .eslintrc.cjs
// Focus Mode - Blocker: ESLint configuration for Chrome MV3 TypeScript

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.test.json'],
  },

  plugins: ['@typescript-eslint', 'import'],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/typescript',
    'prettier', // Must be last — disables formatting rules
  ],

  env: {
    browser: true,
    es2022: true,
    webextensions: true, // Defines `chrome` and `browser` globals
  },

  rules: {
    // -----------------------------------------------------------------------
    // MV3-specific rules
    // -----------------------------------------------------------------------

    // CRITICAL: eval() and new Function() violate MV3 CSP.
    // These will cause the extension to be rejected from the Chrome Web Store.
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Prevent remote code execution — MV3 bans loading external scripts
    'no-restricted-globals': [
      'error',
      {
        name: 'fetch',
        message:
          'Use chrome.runtime.getURL() for local resources. ' +
          'Remote fetch is only allowed for data APIs, never for code.',
      },
    ],

    // Prevent document.write — violates CSP and is never needed
    'no-restricted-properties': [
      'error',
      {
        object: 'document',
        property: 'write',
        message: 'document.write violates MV3 CSP. Use DOM APIs instead.',
      },
      {
        object: 'document',
        property: 'writeln',
        message: 'document.writeln violates MV3 CSP. Use DOM APIs instead.',
      },
    ],

    // Prevent innerHTML with untrusted content (XSS risk in extensions)
    // This is a warning, not an error, because innerHTML with trusted
    // template literals is sometimes the clearest approach.
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'AssignmentExpression[left.property.name="innerHTML"]',
        message:
          'Prefer textContent or DOM APIs over innerHTML. ' +
          'If HTML is needed, ensure the content is trusted and sanitized.',
      },
    ],

    // -----------------------------------------------------------------------
    // TypeScript rules
    // -----------------------------------------------------------------------
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-floating-promises': 'error', // Catch unhandled promise rejections
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/strict-boolean-expressions': [
      'error',
      {
        allowString: false,
        allowNumber: false,
        allowNullableObject: true,
      },
    ],

    // -----------------------------------------------------------------------
    // Import rules
    // -----------------------------------------------------------------------
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
          'type',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
        pathGroups: [
          { pattern: '@background/**', group: 'internal', position: 'before' },
          { pattern: '@content/**', group: 'internal', position: 'before' },
          { pattern: '@popup/**', group: 'internal', position: 'before' },
          { pattern: '@options/**', group: 'internal', position: 'before' },
          { pattern: '@pages/**', group: 'internal', position: 'before' },
          { pattern: '@shared/**', group: 'internal', position: 'before' },
        ],
        pathGroupsExcludedImportTypes: ['type'],
      },
    ],
    'import/no-duplicates': 'error',
    'import/no-cycle': ['error', { maxDepth: 3 }],
    'import/no-self-import': 'error',

    // -----------------------------------------------------------------------
    // General best practices
    // -----------------------------------------------------------------------
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-throw-literal': 'error',
    'prefer-template': 'error',
    'no-param-reassign': ['error', { props: false }],
  },

  overrides: [
    // Test files — relaxed rules
    {
      files: ['tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
      env: { jest: true },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        'no-console': 'off',
      },
    },
    // Script files — Node.js environment
    {
      files: ['scripts/**/*.ts', 'vite.config.ts', 'jest.config.js'],
      env: { node: true, browser: false },
      rules: {
        'no-console': 'off',
      },
    },
    // Content scripts — allow some patterns needed for DOM manipulation
    {
      files: ['src/content/**/*.ts'],
      rules: {
        // Content scripts legitimately use innerHTML for overlay UI
        'no-restricted-syntax': 'off',
        // Content scripts may use fetch for page-context operations
        'no-restricted-globals': 'off',
      },
    },
  ],

  ignorePatterns: ['dist/', 'coverage/', 'node_modules/', '*.js', '!.eslintrc.cjs'],
};
```

```jsonc
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 90,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "htmlWhitespaceSensitivity": "css",
  "overrides": [
    {
      "files": "*.json",
      "options": {
        "printWidth": 120
      }
    },
    {
      "files": "manifest.json",
      "options": {
        "printWidth": 80
      }
    }
  ]
}
```

```yaml
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

```yaml
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Type-check and test before pushing
npm run type-check && npm run test:ci
```

---

### 8.7 Bundle Size Optimization

#### 8.7.1 Performance Budget Enforcement

```typescript
// scripts/check-bundle-size.ts
// Focus Mode - Blocker: Bundle size budget enforcement
// Runs in CI to fail the build if any bundle exceeds its budget.

import { readFileSync, statSync, readdirSync } from 'fs';
import { resolve, join, relative } from 'path';

// ---------------------------------------------------------------------------
// Budget definitions (in bytes)
// ---------------------------------------------------------------------------

interface SizeBudget {
  /** Glob-like path relative to dist/ */
  path: string;
  /** Maximum allowed size in bytes */
  maxSize: number;
  /** Human-readable label */
  label: string;
}

const BUDGETS: SizeBudget[] = [
  {
    path: 'src/popup/popup.js',
    maxSize: 150 * 1024, // 150KB
    label: 'Popup JS',
  },
  {
    path: 'src/background/service-worker.js',
    maxSize: 100 * 1024, // 100KB
    label: 'Service Worker',
  },
  {
    path: 'src/content/detector.js',
    maxSize: 2 * 1024, // 2KB — must be ultra-lightweight
    label: 'Content: Detector',
  },
  {
    path: 'src/content/blocker.js',
    maxSize: 50 * 1024, // 50KB
    label: 'Content: Blocker',
  },
  {
    path: 'src/content/tracker.js',
    maxSize: 50 * 1024, // 50KB
    label: 'Content: Tracker',
  },
  {
    path: 'src/options/options.js',
    maxSize: 150 * 1024, // 150KB
    label: 'Options JS',
  },
  {
    path: 'src/pages/blocked.js',
    maxSize: 80 * 1024, // 80KB
    label: 'Blocked Page JS',
  },
  {
    path: 'src/pages/onboarding.js',
    maxSize: 80 * 1024, // 80KB
    label: 'Onboarding JS',
  },
];

/** Total extension budget (all files in dist/) */
const TOTAL_BUDGET = 500 * 1024; // 500KB

// ---------------------------------------------------------------------------
// Size calculation
// ---------------------------------------------------------------------------

function getFileSize(filePath: string): number {
  try {
    return statSync(filePath).size;
  } catch {
    return -1; // File not found
  }
}

function getDirectorySize(dirPath: string): number {
  let total = 0;

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        total += statSync(fullPath).size;
      }
    }
  }

  walk(dirPath);
  return total;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function percentOf(actual: number, budget: number): string {
  return `${((actual / budget) * 100).toFixed(0)}%`;
}

// ---------------------------------------------------------------------------
// Main check
// ---------------------------------------------------------------------------

function checkBudgets(): void {
  const distDir = resolve(process.cwd(), 'dist');
  let hasFailure = false;
  const results: Array<{
    label: string;
    actual: number;
    budget: number;
    status: 'pass' | 'warn' | 'fail' | 'missing';
  }> = [];

  console.log('\n--- Focus Mode - Blocker: Bundle Size Check ---\n');

  // Check individual budgets
  for (const budget of BUDGETS) {
    const filePath = resolve(distDir, budget.path);
    const actual = getFileSize(filePath);

    if (actual === -1) {
      results.push({
        label: budget.label,
        actual: 0,
        budget: budget.maxSize,
        status: 'missing',
      });
      continue;
    }

    const ratio = actual / budget.maxSize;
    let status: 'pass' | 'warn' | 'fail';

    if (ratio > 1.0) {
      status = 'fail';
      hasFailure = true;
    } else if (ratio > 0.85) {
      status = 'warn'; // Within 15% of budget — approaching limit
    } else {
      status = 'pass';
    }

    results.push({
      label: budget.label,
      actual,
      budget: budget.maxSize,
      status,
    });
  }

  // Print individual results
  for (const r of results) {
    const icon =
      r.status === 'pass'
        ? '[PASS]'
        : r.status === 'warn'
          ? '[WARN]'
          : r.status === 'fail'
            ? '[FAIL]'
            : '[SKIP]';

    if (r.status === 'missing') {
      console.log(`  ${icon}  ${r.label}: file not found`);
    } else {
      console.log(
        `  ${icon}  ${r.label}: ${formatBytes(r.actual)} / ${formatBytes(r.budget)} (${percentOf(r.actual, r.budget)})`,
      );
    }
  }

  // Check total size
  const totalSize = getDirectorySize(distDir);
  const totalRatio = totalSize / TOTAL_BUDGET;
  const totalStatus = totalRatio > 1.0 ? 'FAIL' : totalRatio > 0.85 ? 'WARN' : 'PASS';

  if (totalRatio > 1.0) {
    hasFailure = true;
  }

  console.log(
    `\n  [${totalStatus}]  TOTAL: ${formatBytes(totalSize)} / ${formatBytes(TOTAL_BUDGET)} (${percentOf(totalSize, TOTAL_BUDGET)})`,
  );

  // Exit with error if any budget exceeded
  if (hasFailure) {
    console.error(
      '\nBundle size budget exceeded! Reduce bundle sizes before merging.\n',
    );
    console.error('Tips:');
    console.error('  - Run `npm run build:analyze` to identify large modules');
    console.error('  - Check for accidental dependency imports');
    console.error('  - Ensure tree shaking is working (no side-effect imports)');
    console.error('  - Consider lazy loading for non-critical features\n');
    process.exit(1);
  }

  console.log('\nAll bundle size budgets passed.\n');
}

checkBudgets();
```

#### 8.7.2 Tree Shaking Configuration

```typescript
// src/shared/constants.ts
// EXAMPLE: Structure constants for optimal tree shaking.
// Export individual constants, NOT a single object.

// BAD: This prevents tree shaking — importing ANY constant pulls ALL of them
// export const CONSTANTS = { ALARM_SESSION: 'focus-session', ... };

// GOOD: Each export can be individually tree-shaken
export const ALARM_SESSION = 'focus-session-tick';
export const ALARM_DAILY_RESET = 'daily-reset';
export const ALARM_SCHEDULE_CHECK = 'schedule-check';
export const ALARM_IDLE_CHECK = 'idle-check';

export const STORAGE_KEY_SETTINGS = 'user-settings';
export const STORAGE_KEY_BLOCKLIST = 'blocklist';
export const STORAGE_KEY_STATS = 'daily-stats';
export const STORAGE_KEY_STREAK = 'streak-data';

export const MAX_DYNAMIC_RULES = 5000;
export const MAX_STATIC_RULESETS = 50;
export const MAX_BLOCKLIST_ENTRIES = 10000;
export const SESSION_TICK_INTERVAL_MINUTES = 1;
```

```typescript
// package.json — sideEffects field
// Tell bundlers which files have side effects and cannot be tree-shaken.
// Most Focus Mode modules are pure and can be safely removed if unused.
{
  "sideEffects": [
    "src/background/service-worker.ts",
    "src/content/detector.ts",
    "src/content/blocker.ts",
    "src/content/tracker.ts",
    "**/*.css"
  ]
}
```

#### 8.7.3 MV3 Dynamic Import Limitations

```typescript
// IMPORTANT: Dynamic import() limitations in MV3 service workers
//
// Chrome MV3 service workers DO support static imports (import ... from '...')
// when the manifest declares "type": "module".
//
// However, dynamic import() has RESTRICTIONS:
//
// 1. In service workers: dynamic import() works ONLY for extension-local URLs
//    (chrome-extension://...). It does NOT work for remote URLs.
//
// 2. In content scripts: dynamic import() does NOT work at all because
//    content scripts are injected into web pages, not extension pages.
//
// 3. In popup/options/pages: dynamic import() works normally because these
//    are extension pages loaded via chrome-extension:// URLs.

// --- Service Worker: Static imports ONLY (safest approach) ---
// The service worker entry bundles all 18 modules at build time.
// This is intentional — dynamic import in service workers is unreliable
// and adds startup latency.

// src/background/service-worker.ts
import { initAlarmManager } from './alarm-manager';
import { initBadgeManager } from './badge-manager';
import { initBlockingEngine } from './blocking-engine';
import { initContextMenu } from './context-menu';
import { initDailyReset } from './daily-reset';
import { initFocusSession } from './focus-session';
import { initIdleDetector } from './idle-detector';
import { initInstallHandler } from './install-handler';
import { initMessageRouter } from './message-router';
import { initNotificationManager } from './notification-manager';
import { initOffscreenBridge } from './offscreen-bridge';
import { initQuotaTracker } from './quota-tracker';
import { initRuleCompiler } from './rule-compiler';
import { initScheduleEngine } from './schedule-engine';
import { initStateManager } from './state-manager';
import { initStatsAggregator } from './stats-aggregator';
import { initStorageSync } from './storage-sync';

// Initialize all modules synchronously at service worker startup.
// Registration of event listeners MUST happen synchronously in the
// top-level scope — Chrome discards listeners registered asynchronously.
initStateManager();
initMessageRouter();
initInstallHandler();
initBlockingEngine();
initRuleCompiler();
initFocusSession();
initAlarmManager();
initScheduleEngine();
initDailyReset();
initBadgeManager();
initNotificationManager();
initContextMenu();
initIdleDetector();
initOffscreenBridge();
initQuotaTracker();
initStatsAggregator();
initStorageSync();

// --- Popup: Dynamic imports OK (for code splitting) ---
// src/popup/popup.ts
async function initPopup(): Promise<void> {
  const { renderTimerDisplay } = await import('./components/timer-display');
  const { renderQuickBlock } = await import('./components/quick-block');
  const { renderSessionControls } = await import('./components/session-controls');
  const { renderStatsSummary } = await import('./components/stats-summary');

  renderTimerDisplay();
  renderQuickBlock();
  renderSessionControls();
  renderStatsSummary();
}

document.addEventListener('DOMContentLoaded', () => {
  void initPopup();
});
```

#### 8.7.4 Dependency Analysis and CI Integration

```typescript
// scripts/analyze-deps.ts
// Focus Mode - Blocker: Analyze which dependencies contribute to bundle size

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface DepInfo {
  name: string;
  version: string;
  sizeKB: number;
  usedBy: string[];
}

/**
 * Checks that Focus Mode stays within the 3-dependency runtime limit.
 * Verifies each dependency's contribution to the bundle.
 */
function analyzeDependencies(): void {
  const pkgPath = resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const runtimeDeps = Object.keys(pkg.dependencies || {});

  console.log('\n--- Focus Mode: Runtime Dependency Analysis ---\n');

  // Enforce 3-dependency limit
  if (runtimeDeps.length > 3) {
    console.error(
      `ERROR: Focus Mode allows a maximum of 3 runtime dependencies.`,
    );
    console.error(
      `Found ${runtimeDeps.length}: ${runtimeDeps.join(', ')}`,
    );
    console.error(
      '\nRemove unnecessary dependencies or move them to devDependencies.\n',
    );
    process.exit(1);
  }

  console.log(`Runtime dependencies (${runtimeDeps.length}/3 max):`);

  for (const dep of runtimeDeps) {
    // Get installed size
    try {
      const depPkgPath = resolve(
        process.cwd(),
        'node_modules',
        dep,
        'package.json',
      );
      const depPkg = JSON.parse(readFileSync(depPkgPath, 'utf-8'));

      // Estimate bundled size using the main/module entry
      const mainFile = depPkg.module || depPkg.main || 'index.js';
      console.log(`  - ${dep}@${depPkg.version} (entry: ${mainFile})`);
    } catch {
      console.log(`  - ${dep}: not installed`);
    }
  }

  console.log('\nDependency check passed.\n');
}

analyzeDependencies();
```

```yaml
# .github/workflows/ci.yml (size check step)
# This step runs after the build step and fails the CI pipeline
# if any bundle exceeds its performance budget.

name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint:strict
      - run: npm run test:ci
      - run: npm run build

      # Size budget enforcement
      - name: Check bundle sizes
        run: npm run check:size

      # Upload size report as PR comment
      - name: Report bundle sizes
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const { execSync } = require('child_process');
            const output = execSync('npm run check:size 2>&1', {
              encoding: 'utf-8',
            });
            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Bundle Size Report\n\`\`\`\n${output}\n\`\`\``,
            });

      # Archive built extension
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: focus-mode-blocker-${{ github.sha }}
          path: dist/
          retention-days: 7

      # Validate manifest
      - name: Validate manifest
        run: npm run validate:manifest

      # Validate CSP
      - name: Validate CSP
        run: npm run validate:csp

      # Dependency audit
      - name: Check dependencies
        run: |
          npm audit --production --audit-level=high
          npx tsx scripts/analyze-deps.ts
```

#### 8.7.5 Bundle Analyzer Integration

```typescript
// vite.config.ts — Add analyzer plugin (opt-in via ANALYZE env var)
import { visualizer } from 'rollup-plugin-visualizer';

// Inside plugins array:
const plugins = [
  manifestPlugin(),
  copyStaticAssetsPlugin(),
  contentScriptIIFEPlugin(),

  // Bundle analyzer — generates dist/stats.html
  // Run: ANALYZE=true npm run build
  ...(process.env.ANALYZE === 'true'
    ? [
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap', // 'treemap' | 'sunburst' | 'network'
        }),
      ]
    : []),
];
```

**Common bundle size problems and fixes for Focus Mode:**

| Problem | Symptom | Fix |
|---|---|---|
| Importing entire lodash | `service-worker.js` > 100KB | Use native JS or import specific functions: `lodash-es/debounce` |
| Unused exports in shared/ | Shared chunk includes dead code | Mark files as side-effect-free in `package.json` |
| CSS in JS (styled-components) | Popup JS inflated | Use plain CSS files extracted by Vite |
| Large icon assets in JS | Bundler inlines PNGs as data URIs | Set `assetsInlineLimit: 0` (already configured) |
| Polyfills for modern APIs | Unnecessary code for Chrome 116+ | Set `target: 'es2022'` — no polyfills needed |
| Duplicate dependencies | Same lib bundled in multiple entries | Use `splitChunks` / `manualChunks` for UI entries |
| Source maps in production .zip | .zip file is 3x expected size | Use `hidden-source-map` and exclude `.map` from .zip |

---

## Section 9: MV2 to MV3 Migration Guide & Browser Compatibility

---

### 9.1 MV3 Breaking Changes Reference

The following table documents every MV2 to MV3 breaking change relevant to a website blocker extension like Focus Mode. Focus Mode was built MV3-native, but this reference is essential for teams migrating existing MV2 blockers or for understanding why Focus Mode's architecture differs from older extensions.

| # | MV2 Approach | MV3 Replacement | Impact on Website Blockers |
|---|---|---|---|
| 1 | **Background pages** (persistent HTML) | **Service workers** (non-persistent JS) | Cannot hold state in global variables. Must persist state to `chrome.storage.session` or `chrome.storage.local`. Service worker terminates after ~30s of inactivity. |
| 2 | **`webRequest.onBeforeRequest`** (blocking) | **`declarativeNetRequest`** (DNR) | The single largest migration pain point. Blocking is now declarative via JSON rules, not imperative code. Cannot inspect request bodies. Cannot make async decisions per-request. |
| 3 | **`browser_action`** | **`action`** | Simple rename. `chrome.browserAction.*` becomes `chrome.action.*`. Manifest key changes from `browser_action` to `action`. |
| 4 | **Persistent background timers** (`setInterval`) | **`chrome.alarms`** + storage | `setInterval`/`setTimeout` stop when service worker terminates. Must use `chrome.alarms` (minimum 1-minute granularity) for recurring tasks. |
| 5 | **`tabs.executeScript()`** | **`chrome.scripting.executeScript()`** | New API namespace. Requires `scripting` permission. Supports `func` parameter (pass a function reference, not a string). |
| 6 | **`tabs.insertCSS()`** | **`chrome.scripting.insertCSS()`** | Same namespace move as `executeScript`. |
| 7 | **Callback-based APIs** | **Promise-based APIs** | All Chrome extension APIs now return Promises. Callbacks still work but are deprecated. |
| 8 | **`permissions` includes hosts** | **`host_permissions` separated** | Host permissions moved to a separate `host_permissions` array in manifest. This affects how users grant site access. |
| 9 | **`content_security_policy` (string)** | **`content_security_policy` (object)** | CSP is now an object with `extension_pages` and `sandbox` keys. Stricter defaults: no `unsafe-eval`, no remote scripts. |
| 10 | **Remote code execution** | **Banned entirely** | Cannot load JS from remote URLs. Cannot use `eval()`, `new Function()`, or `document.write()` with script content. All code must be bundled in the extension package. |
| 11 | **Background page DOM** | **No DOM in service workers** | Cannot use `document`, `window`, `XMLHttpRequest`, `Image`, or `Audio` in service workers. Use `chrome.offscreen` for DOM-dependent operations. |
| 12 | **Persistent WebSocket connections** | **Reconnecting WebSockets + keepalive** | Service worker termination kills WebSocket connections. Must reconnect on wake and use `chrome.alarms` for keepalive pings. |
| 13 | **`web_accessible_resources` (array)** | **`web_accessible_resources` (object array)** | Now requires specifying which pages can access each resource via `matches` patterns. More secure but more verbose. |
| 14 | **Unlimited background runtime** | **30-second idle timeout** | Service worker terminates after ~30s with no activity. Event listeners extend this. Long-running operations need `chrome.offscreen`. |
| 15 | **`chrome.extension.getBackgroundPage()`** | **Removed** | Cannot get a reference to background context. Use `chrome.runtime.sendMessage()` for popup-to-background communication. |

---

### 9.2 Migration Patterns for Common Operations

#### 9.2.1 Blocking a URL

```typescript
// ============================================================
// MV2: webRequest.onBeforeRequest (IMPERATIVE blocking)
// ============================================================
// This code ran in a persistent background page.
// It could make async decisions, inspect headers, and use any logic.

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = new URL(details.url);
    const domain = url.hostname;

    // Could do async lookups, regex matching, etc.
    if (blockedDomains.includes(domain)) {
      return { cancel: true }; // or { redirectUrl: blockPageUrl }
    }
    return {};
  },
  { urls: ['<all_urls>'] },
  ['blocking'] // The 'blocking' flag is removed in MV3
);

// ============================================================
// MV3: declarativeNetRequest (DECLARATIVE blocking)
// ============================================================
// Focus Mode compiles user blocklist into DNR rules at save time,
// not at request time. Chrome evaluates rules natively (faster).

import type { BlockRule } from '@shared/types/blocking';

/**
 * Add a URL blocking rule via declarativeNetRequest.
 * Called when the user adds a site to their blocklist.
 */
async function blockDomain(
  domain: string,
  ruleId: number,
  redirectUrl?: string,
): Promise<void> {
  const rule: chrome.declarativeNetRequest.Rule = {
    id: ruleId,
    priority: 1,
    action: redirectUrl
      ? {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: { url: redirectUrl },
        }
      : { type: chrome.declarativeNetRequest.RuleActionType.BLOCK },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: [
        chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
        chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
      ],
    },
  };

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [rule],
    removeRuleIds: [ruleId], // Remove old version of this rule if it exists
  });
}

/**
 * Remove a URL blocking rule.
 * Called when the user removes a site from their blocklist.
 */
async function unblockDomain(ruleId: number): Promise<void> {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [ruleId],
  });
}

/**
 * Bulk update: Replace all dynamic rules at once.
 * Called when the user imports a blocklist or session starts/stops.
 */
async function replaceAllRules(
  rules: chrome.declarativeNetRequest.Rule[],
): Promise<void> {
  // Get existing rule IDs to remove
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map((r) => r.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingIds,
    addRules: rules,
  });
}
```

#### 9.2.2 Persistent Timer

```typescript
// ============================================================
// MV2: setInterval in persistent background page
// ============================================================
let sessionSeconds = 0;

// This worked because the background page never unloaded.
setInterval(() => {
  sessionSeconds++;
  chrome.browserAction.setBadgeText({
    text: formatTime(sessionSeconds),
  });
}, 1000);

// ============================================================
// MV3: chrome.alarms + chrome.storage.session
// ============================================================
// Focus Mode uses alarms with 1-minute granularity.
// For sub-minute precision, we store the session start timestamp
// and calculate elapsed time on demand.

import {
  ALARM_SESSION,
  SESSION_TICK_INTERVAL_MINUTES,
} from '@shared/constants';

interface SessionState {
  isActive: boolean;
  startedAt: number;        // Date.now() when session started
  pausedAt: number | null;  // Date.now() when paused, or null
  totalPausedMs: number;    // Accumulated pause duration
  durationMinutes: number;  // Target session duration
}

/**
 * Start a focus session.
 * Creates an alarm that fires every minute to update the badge.
 */
async function startSession(durationMinutes: number): Promise<void> {
  const state: SessionState = {
    isActive: true,
    startedAt: Date.now(),
    pausedAt: null,
    totalPausedMs: 0,
    durationMinutes,
  };

  // Persist to session storage (survives service worker restart,
  // cleared when browser closes)
  await chrome.storage.session.set({ focusSession: state });

  // Create recurring alarm — fires every minute
  await chrome.alarms.create(ALARM_SESSION, {
    periodInMinutes: SESSION_TICK_INTERVAL_MINUTES,
  });

  // Immediately update badge
  await updateBadge(state);
}

/**
 * Handle alarm tick — update badge and check if session is complete.
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_SESSION) return;

  const { focusSession } = await chrome.storage.session.get('focusSession');
  if (!focusSession?.isActive) {
    await chrome.alarms.clear(ALARM_SESSION);
    return;
  }

  const state = focusSession as SessionState;
  const elapsedMs = Date.now() - state.startedAt - state.totalPausedMs;
  const elapsedMinutes = elapsedMs / 60_000;

  if (elapsedMinutes >= state.durationMinutes) {
    // Session complete
    await endSession(state);
    return;
  }

  await updateBadge(state);
});

/**
 * Update the extension badge with remaining time.
 */
async function updateBadge(state: SessionState): Promise<void> {
  const elapsedMs = Date.now() - state.startedAt - state.totalPausedMs;
  const remainingMs = state.durationMinutes * 60_000 - elapsedMs;
  const remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60_000));

  await chrome.action.setBadgeText({ text: `${remainingMinutes}m` });
  await chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
}

/**
 * End the session — clear alarm, update storage, notify user.
 */
async function endSession(state: SessionState): Promise<void> {
  await chrome.alarms.clear(ALARM_SESSION);
  await chrome.storage.session.set({
    focusSession: { ...state, isActive: false },
  });
  await chrome.action.setBadgeText({ text: '' });

  // Notify the user
  chrome.notifications.create('session-complete', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('src/assets/icons/icon-128.png'),
    title: 'Focus Session Complete',
    message: `Great work! You focused for ${state.durationMinutes} minutes.`,
  });
}
```

#### 9.2.3 Background State Management

```typescript
// ============================================================
// MV2: Global variables in persistent background page
// ============================================================
// These variables lived forever because the background page never unloaded.
let currentBlocklist: string[] = [];
let sessionActive = false;
let totalBlocksToday = 0;

// ============================================================
// MV3: chrome.storage.session for ephemeral state
// ============================================================
// Focus Mode uses a typed state manager that wraps chrome.storage.session.
// State survives service worker restarts but clears when browser closes.

// src/background/state-manager.ts

/** Shape of all ephemeral state kept in session storage */
interface EphemeralState {
  /** Current active blocklist (domain strings) */
  activeBlocklist: string[];
  /** Whether a focus session is currently running */
  sessionActive: boolean;
  /** Block count for today (resets at midnight) */
  todayBlockCount: number;
  /** Timestamp of last DNR rule update */
  lastRuleUpdateAt: number;
  /** IDs of currently active DNR dynamic rules */
  activeRuleIds: number[];
}

const DEFAULT_STATE: EphemeralState = {
  activeBlocklist: [],
  sessionActive: false,
  todayBlockCount: 0,
  lastRuleUpdateAt: 0,
  activeRuleIds: [],
};

/**
 * Read a single key from ephemeral state.
 * Falls back to default if not set.
 */
async function getState<K extends keyof EphemeralState>(
  key: K,
): Promise<EphemeralState[K]> {
  const result = await chrome.storage.session.get(key);
  return (result[key] as EphemeralState[K]) ?? DEFAULT_STATE[key];
}

/**
 * Write one or more keys to ephemeral state.
 */
async function setState(
  updates: Partial<EphemeralState>,
): Promise<void> {
  await chrome.storage.session.set(updates);
}

/**
 * Read the full ephemeral state object.
 */
async function getFullState(): Promise<EphemeralState> {
  const result = await chrome.storage.session.get(null);
  return { ...DEFAULT_STATE, ...result } as EphemeralState;
}

/**
 * Initialize state on service worker startup.
 * Merges defaults with any surviving session state.
 */
export function initStateManager(): void {
  // Set quota for session storage (Focus Mode uses ~10KB max)
  chrome.storage.session.setAccessLevel({
    accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
  });

  // Log state recovery on startup
  if (__DEV__) {
    getFullState().then((state) => {
      console.log('[StateManager] Recovered state:', state);
    });
  }
}

export { getState, setState, getFullState };
export type { EphemeralState };
```

#### 9.2.4 Content Script Injection

```typescript
// ============================================================
// MV2: chrome.tabs.executeScript()
// ============================================================
chrome.tabs.executeScript(tabId, {
  file: 'content/blocker.js',
  runAt: 'document_start',
});

chrome.tabs.insertCSS(tabId, {
  file: 'content/blocker.css',
});

// ============================================================
// MV3: chrome.scripting.executeScript()
// ============================================================
// Focus Mode uses the new scripting API for programmatic injection.
// Static injection via manifest content_scripts is preferred where possible.

/**
 * Programmatically inject the blocker overlay into a tab.
 * Used when a user blocks a site while the tab is already open.
 */
async function injectBlockerOverlay(tabId: number): Promise<void> {
  // Inject CSS first (non-blocking)
  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ['src/content/blocker.css'],
  });

  // Inject the blocker script
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['src/content/blocker.js'],
    world: 'ISOLATED', // Run in isolated world (default, safest)
  });
}

/**
 * Inject a function directly (no file needed).
 * Useful for one-off operations like reading page title.
 */
async function getPageTitle(tabId: number): Promise<string> {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => document.title,
    world: 'ISOLATED',
  });

  return results[0]?.result ?? '';
}

/**
 * Inject into all frames of a tab (for blocking embedded content).
 */
async function injectIntoAllFrames(tabId: number): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    files: ['src/content/blocker.js'],
    world: 'ISOLATED',
  });
}

/**
 * Remove injected CSS (when unblocking a site).
 */
async function removeBlockerCSS(tabId: number): Promise<void> {
  await chrome.scripting.removeCSS({
    target: { tabId },
    files: ['src/content/blocker.css'],
  });
}
```

#### 9.2.5 Badge Updates

```typescript
// ============================================================
// MV2: chrome.browserAction.setBadgeText()
// ============================================================
chrome.browserAction.setBadgeText({ text: '5' });
chrome.browserAction.setBadgeBackgroundColor({ color: '#FF0000' });
chrome.browserAction.setIcon({
  path: {
    16: 'icons/icon-16-active.png',
    32: 'icons/icon-32-active.png',
    48: 'icons/icon-48-active.png',
    128: 'icons/icon-128-active.png',
  },
});

// ============================================================
// MV3: chrome.action.setBadgeText()
// ============================================================
// Simple rename from browserAction to action.
// Focus Mode's badge manager handles all badge updates.

// src/background/badge-manager.ts

type BadgeMode = 'idle' | 'active' | 'paused' | 'blocked';

interface BadgeConfig {
  text: string;
  color: string;
  iconPrefix: string; // 'icon' or 'icon-active'
}

const BADGE_CONFIGS: Record<BadgeMode, Omit<BadgeConfig, 'text'>> = {
  idle: { color: '#9E9E9E', iconPrefix: 'icon' },
  active: { color: '#4CAF50', iconPrefix: 'icon-active' },
  paused: { color: '#FF9800', iconPrefix: 'icon' },
  blocked: { color: '#F44336', iconPrefix: 'icon-active' },
};

/**
 * Update the extension badge to reflect current state.
 */
async function updateBadgeForMode(
  mode: BadgeMode,
  text: string = '',
): Promise<void> {
  const config = BADGE_CONFIGS[mode];

  await Promise.all([
    chrome.action.setBadgeText({ text }),
    chrome.action.setBadgeBackgroundColor({ color: config.color }),
    chrome.action.setIcon({
      path: {
        16: `src/assets/icons/${config.iconPrefix}-16.png`,
        32: `src/assets/icons/${config.iconPrefix}-32.png`,
        48: `src/assets/icons/${config.iconPrefix}-48.png`,
        128: `src/assets/icons/${config.iconPrefix}-128.png`,
      },
    }),
  ]);
}

/**
 * Show remaining time on badge during active session.
 */
async function showTimeRemaining(minutes: number): Promise<void> {
  const text = minutes > 99 ? `${Math.floor(minutes / 60)}h` : `${minutes}m`;
  await updateBadgeForMode('active', text);
}

/**
 * Show block count on badge.
 */
async function showBlockCount(count: number): Promise<void> {
  const text = count > 999 ? '999+' : `${count}`;
  await updateBadgeForMode('blocked', text);
}

/**
 * Clear the badge (idle state).
 */
async function clearBadge(): Promise<void> {
  await updateBadgeForMode('idle', '');
}

export function initBadgeManager(): void {
  // Set initial badge state on service worker startup
  clearBadge();
}

export { updateBadgeForMode, showTimeRemaining, showBlockCount, clearBadge };
```

#### 9.2.6 Dynamic CSS Injection

```typescript
// ============================================================
// MV2: chrome.tabs.insertCSS()
// ============================================================
chrome.tabs.insertCSS(tabId, {
  code: `
    .distraction-element { display: none !important; }
    .focus-mode-overlay { position: fixed; inset: 0; z-index: 999999; }
  `,
  runAt: 'document_start',
});

// ============================================================
// MV3: chrome.scripting.insertCSS()
// ============================================================
// Focus Mode uses scripting.insertCSS for dynamic style injection.
// Static CSS is declared in manifest content_scripts.

/**
 * Hide specific elements on a page (e.g., social media feeds,
 * comment sections, recommendation sidebars).
 */
async function hideDistractingElements(
  tabId: number,
  selectors: string[],
): Promise<void> {
  const css = selectors
    .map((s) => `${s} { display: none !important; }`)
    .join('\n');

  await chrome.scripting.insertCSS({
    target: { tabId },
    css, // Inline CSS string
  });
}

/**
 * Apply a visual dimming effect to indicate the site is tracked.
 */
async function applyTrackingOverlay(tabId: number): Promise<void> {
  await chrome.scripting.insertCSS({
    target: { tabId },
    css: `
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.03);
        pointer-events: none;
        z-index: 2147483647;
        transition: background 0.3s ease;
      }
    `,
  });
}

/**
 * Inject a CSS file (for more complex styling).
 */
async function injectBlockedPageStyles(tabId: number): Promise<void> {
  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ['src/content/blocker.css'],
  });
}
```

---

### 9.3 Focus Mode MV3-Native Design Decisions

Focus Mode - Blocker was designed from day one as an MV3-native extension. This section documents the architectural decisions that benefit from having no MV2 migration debt.

#### 9.3.1 Service Worker from Day 1

```typescript
// Focus Mode's service worker was designed for non-persistence from the start.
// There are zero assumptions about persistent global state.

// ARCHITECTURE PRINCIPLE: Every piece of state is either:
// 1. In chrome.storage.session  (ephemeral, survives SW restart)
// 2. In chrome.storage.local    (persistent, survives browser restart)
// 3. In chrome.storage.sync     (persistent, syncs across devices)
// 4. Derived on demand          (computed from stored state)

// The service worker's top-level scope ONLY contains:
// - Import statements
// - Event listener registrations
// - Module initialization calls
// No variables, no cached data, no assumptions about lifetime.

// Example: Migrated extensions often have code like this:
//   let blocklist = []; // THIS WILL BE EMPTY AFTER SW RESTART
//
// Focus Mode never had this problem because it was never designed
// with persistent state. Every read goes through storage:
//   const blocklist = await getState('activeBlocklist');
```

#### 9.3.2 declarativeNetRequest from Day 1

```typescript
// Focus Mode's blocking engine was built on DNR from the start.
// There is no webRequest adapter, no compatibility layer, no "legacy mode."

// Benefits of DNR-native design:
//
// 1. PERFORMANCE: DNR rules are evaluated by Chrome's network stack
//    in native code, not by JavaScript. Blocking is instant.
//
// 2. PRIVACY: Focus Mode never sees request URLs in the background.
//    Blocking happens without the extension being notified.
//    This makes privacy review for the Chrome Web Store trivial.
//
// 3. BATTERY: No JavaScript wakes up for each network request.
//    The service worker stays asleep while blocking works.
//
// 4. RELIABILITY: Blocking works even if the service worker has
//    been terminated. Rules persist in Chrome's internal storage.

// Focus Mode's rule compiler translates user-friendly blocklist entries
// into optimized DNR rules:

interface UserBlockEntry {
  domain: string;           // e.g., "reddit.com"
  includeSubdomains: boolean; // e.g., true → also blocks old.reddit.com
  action: 'block' | 'redirect';
  schedule?: {
    days: number[];         // 0=Sun, 1=Mon, ...
    startTime: string;      // "09:00"
    endTime: string;        // "17:00"
  };
}

// Compiled to DNR rule:
// {
//   id: 1001,
//   priority: 1,
//   action: { type: "redirect", redirect: { extensionPath: "/src/pages/blocked.html" } },
//   condition: {
//     urlFilter: "||reddit.com",
//     resourceTypes: ["main_frame", "sub_frame"]
//   }
// }
```

#### 9.3.3 Module Type Service Worker

```typescript
// Focus Mode declares its service worker as a module in manifest.json:
//
// "background": {
//   "service_worker": "src/background/service-worker.js",
//   "type": "module"
// }
//
// Benefits of module type:
//
// 1. Clean imports — no global namespace pollution
// 2. Strict mode by default
// 3. Top-level await (Chrome 116+)
// 4. Better tree shaking in bundler (ESM output format)
// 5. Code organization across 18 modules with clear dependency graph
//
// Without "type": "module", the service worker would need to be a
// single concatenated file with no import/export statements.
// That approach works but makes code organization much harder.
```

#### 9.3.4 Modern JS Target

```typescript
// Focus Mode targets ES2022 because Chrome 116+ supports it fully.
// This means the build output contains zero polyfills.

// Features used freely (no transpilation needed):
// - Optional chaining: obj?.prop?.nested
// - Nullish coalescing: value ?? defaultValue
// - Promise.allSettled()
// - Object.fromEntries()
// - Array.prototype.at()
// - structuredClone()
// - String.prototype.replaceAll()
// - Top-level await (in module service worker)
// - Private class fields: #privateField
// - Static class blocks: static { }
// - Error.cause
// - Array.prototype.findLast() / findLastIndex()

// Estimated bundle size savings from no polyfills: ~15-20KB
// This is significant when the total budget is 500KB.
```

#### 9.3.5 chrome.storage.session for Ephemeral State

```typescript
// Focus Mode uses chrome.storage.session extensively for state that:
// - Must survive service worker restarts
// - Should NOT survive browser restarts
// - Is too large for chrome.runtime port messaging
//
// Typical contents during an active focus session:
//
// chrome.storage.session contents:
// {
//   "focusSession": {
//     "isActive": true,
//     "startedAt": 1708444800000,
//     "pausedAt": null,
//     "totalPausedMs": 0,
//     "durationMinutes": 25
//   },
//   "activeBlocklist": ["reddit.com", "twitter.com", "youtube.com"],
//   "activeRuleIds": [1001, 1002, 1003],
//   "todayBlockCount": 14,
//   "lastRuleUpdateAt": 1708444800000
// }
//
// chrome.storage.session quota: 10MB (more than enough)
// Access level: TRUSTED_AND_UNTRUSTED_CONTEXTS
// (allows popup/options to read without messaging the service worker)

// MV2 extensions stored this in global variables (lost on restart)
// or in chrome.storage.local (persisted unnecessarily across restarts).
// chrome.storage.session is the correct tool for this use case.
```

---

### 9.4 Browser Compatibility Matrix

| Feature | Chrome 116+ | Edge (Chromium) | Firefox 128+ (MV3) | Brave | Opera |
|---|---|---|---|---|---|
| **Manifest V3** | Full support | Full support | Partial (MV3 since 128) | Full support | Full support |
| **declarativeNetRequest** | Full (5000 dynamic rules) | Full (same as Chrome) | Partial (limited rule types) | Full | Full |
| **Service Worker background** | Full | Full | Event pages (not SW) | Full | Full |
| **`"type": "module"` SW** | Yes | Yes | N/A (uses scripts) | Yes | Yes |
| **chrome.storage.session** | Full | Full | `browser.storage.session` | Full | Full |
| **chrome.offscreen** | Full | Full | Not supported | Full | Full |
| **chrome.scripting** | Full | Full | `browser.scripting` | Full | Full |
| **chrome.action** | Full | Full | `browser.action` | Full | Full |
| **chrome.alarms** (min interval) | 30s (dev) / 1min (prod) | Same as Chrome | 1min | Same as Chrome | Same as Chrome |
| **chrome.sidePanel** | Full | Full | Not supported | Partial | Partial |
| **Notification behavior** | Standard | Standard | Different UI, `browser.notifications` | Standard | Standard |
| **DNR: regexFilter** | Yes (RE2 syntax) | Yes | Limited | Yes | Yes |
| **DNR: static rulesets** | 50 rulesets, 300K rules | Same | Limited | Same | Same |
| **DNR: session rules** | 5000 rules | Same | Not supported | Same | Same |
| **Extension store** | Chrome Web Store | Edge Add-ons | Firefox Add-ons (AMO) | Chrome Web Store | Opera Addons |
| **Store review time** | 1-3 days | 1-5 days | 1-7 days | (uses CWS) | 3-7 days |
| **MV2 deprecation** | June 2024 (started) | Following Chrome | MV2 still supported | Following Chrome | Following Chrome |

**Key compatibility notes for Focus Mode:**

1. **Firefox** is the most different. It uses `browser.*` namespace, event pages instead of service workers, and has limited DNR support. Focus Mode requires a dedicated Firefox build.

2. **Edge** is nearly identical to Chrome. The same build works with minimal manifest changes (store URLs, update URLs).

3. **Brave** is Chrome-compatible. The same Chrome build works as-is, installed from the Chrome Web Store.

4. **Opera** is Chromium-based but has its own extension store. The Chrome build works, but needs separate store submission.

---

### 9.5 Cross-Browser Manifest Transformation

```typescript
// scripts/transform-manifest.ts
// Focus Mode - Blocker: Transform Chrome manifest.json for other browsers.
// Usage: BROWSER_TARGET=firefox tsx scripts/transform-manifest.ts

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

type BrowserTarget = 'chrome' | 'firefox' | 'edge';

interface ChromeManifest {
  manifest_version: number;
  name: string;
  version: string;
  description: string;
  permissions: string[];
  host_permissions: string[];
  background: {
    service_worker: string;
    type: string;
  };
  action: Record<string, unknown>;
  content_scripts: Array<Record<string, unknown>>;
  content_security_policy: {
    extension_pages: string;
  };
  web_accessible_resources: Array<{
    resources: string[];
    matches: string[];
  }>;
  declarative_net_request: {
    rule_resources: Array<{
      id: string;
      enabled: boolean;
      path: string;
    }>;
  };
  [key: string]: unknown;
}

/**
 * Read the Chrome manifest and transform it for the target browser.
 */
function transformManifest(target: BrowserTarget): void {
  const srcPath = resolve(process.cwd(), 'manifest.json');
  const manifest: ChromeManifest = JSON.parse(
    readFileSync(srcPath, 'utf-8'),
  );

  let output: Record<string, unknown>;

  switch (target) {
    case 'firefox':
      output = transformForFirefox(manifest);
      break;
    case 'edge':
      output = transformForEdge(manifest);
      break;
    case 'chrome':
    default:
      output = manifest;
      break;
  }

  // Write to dist-{target}/manifest.json
  const outDir = resolve(process.cwd(), `dist-${target}`);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  writeFileSync(
    resolve(outDir, 'manifest.json'),
    JSON.stringify(output, null, 2),
  );

  console.log(`Manifest transformed for ${target} -> dist-${target}/manifest.json`);
}

// ---------------------------------------------------------------------------
// Firefox Transformation
// ---------------------------------------------------------------------------

function transformForFirefox(
  manifest: ChromeManifest,
): Record<string, unknown> {
  const firefox: Record<string, unknown> = { ...manifest };

  // Firefox MV3 uses "background.scripts" instead of "service_worker"
  // Firefox runs event pages, not service workers
  firefox.background = {
    scripts: ['src/background/service-worker.js'],
    // "type": "module" is supported in Firefox 128+ for background scripts
    type: 'module',
  };

  // Firefox uses "browser_specific_settings" for extension ID
  firefox.browser_specific_settings = {
    gecko: {
      id: 'focus-mode-blocker@example.com',
      strict_min_version: '128.0',
    },
  };

  // Firefox MV3 supports declarativeNetRequest but with limitations.
  // Remove session rules (not supported) and keep static/dynamic rules.
  // The DNR rule files are compatible, but some rule types may need adjustment.

  // Firefox uses "optional_permissions" differently
  // Host permissions in Firefox MV3 are requested at install time
  // (no separate host_permissions key in some versions)

  // Content Security Policy format is the same in Firefox MV3
  // but Firefox is stricter about wasm-unsafe-eval

  // Remove chrome-specific keys
  delete firefox.minimum_chrome_version;

  // web_accessible_resources format is compatible in Firefox MV3

  return firefox;
}

// ---------------------------------------------------------------------------
// Edge Transformation
// ---------------------------------------------------------------------------

function transformForEdge(
  manifest: ChromeManifest,
): Record<string, unknown> {
  const edge: Record<string, unknown> = { ...manifest };

  // Edge is Chromium-based — minimal changes needed

  // Update update_url if using self-hosting
  if (edge.update_url) {
    // Replace Chrome Web Store update URL with Edge's
    edge.update_url =
      'https://edge.microsoft.com/extensionwebstorebase/v1/crx';
  }

  // Remove chrome-specific keys that Edge doesn't recognize
  // (Edge generally accepts all Chrome keys, but for clean submission)

  return edge;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const target = (process.env.BROWSER_TARGET || 'chrome') as BrowserTarget;
transformManifest(target);
```

**Complete build script for cross-browser builds:**

```typescript
// scripts/build.ts
// Focus Mode - Blocker: Cross-browser build orchestrator

import { execSync } from 'child_process';
import { cpSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

type BrowserTarget = 'chrome' | 'firefox' | 'edge';

const target = (process.env.BROWSER_TARGET || 'chrome') as BrowserTarget;

console.log(`\nBuilding Focus Mode - Blocker for ${target}...\n`);

// Step 1: Run Vite build (outputs to dist/)
execSync('vite build --mode production', {
  stdio: 'inherit',
  env: { ...process.env, BROWSER_TARGET: target },
});

// Step 2: Transform manifest for target browser
execSync(`BROWSER_TARGET=${target} tsx scripts/transform-manifest.ts`, {
  stdio: 'inherit',
});

// Step 3: Copy build output to target-specific directory
const distDir = resolve(process.cwd(), 'dist');
const targetDir = resolve(process.cwd(), `dist-${target}`);

if (target !== 'chrome') {
  // Copy all dist/ files into dist-{target}/
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }
  cpSync(distDir, targetDir, { recursive: true });

  // The transformed manifest.json is already in dist-{target}/
  // (written by transform-manifest.ts)
}

// Step 4: Firefox-specific adjustments
if (target === 'firefox') {
  console.log('Applying Firefox-specific adjustments...');

  // Firefox does not support chrome.offscreen — remove offscreen document
  // The build should tree-shake this out, but verify:
  const offscreenPath = resolve(targetDir, 'src/background/offscreen-bridge.js');
  // offscreen-bridge.js may still exist but will be a no-op on Firefox

  // Firefox needs web-ext for local testing:
  console.log('\nTo test in Firefox:');
  console.log(`  npx web-ext run --source-dir ${targetDir}`);
}

// Step 5: Edge-specific adjustments
if (target === 'edge') {
  console.log('Applying Edge-specific adjustments...');
  // Edge is Chromium — no additional adjustments needed
}

console.log(`\nBuild complete: ${target === 'chrome' ? distDir : targetDir}\n`);
```

---

### 9.6 Polyfill Strategy

#### 9.6.1 webextension-polyfill for Firefox

```typescript
// src/shared/browser-compat.ts
// Focus Mode - Blocker: Browser compatibility layer
//
// Strategy:
// - Chrome/Edge/Brave/Opera: Use chrome.* APIs directly (native)
// - Firefox: Use webextension-polyfill to normalize browser.* to Promise-based
//
// The polyfill is ONLY included in Firefox builds via conditional bundling.
// Chrome builds have zero polyfill overhead.

// ---------------------------------------------------------------------------
// Type-safe browser API accessor
// ---------------------------------------------------------------------------

/**
 * Returns the browser extension API namespace.
 * On Chrome/Chromium: returns `chrome` (global)
 * On Firefox with polyfill: returns `browser` (polyfill-provided)
 */
function getBrowserAPI(): typeof chrome {
  // In Firefox with webextension-polyfill, `browser` is the Promise-based API.
  // In Chrome, `chrome` already returns Promises (MV3).
  if (typeof globalThis.browser !== 'undefined') {
    return globalThis.browser as unknown as typeof chrome;
  }
  return chrome;
}

// Export a single `api` reference used throughout Focus Mode.
// This is the ONLY place the chrome/browser decision is made.
export const api = getBrowserAPI();

// ---------------------------------------------------------------------------
// Usage in Focus Mode code
// ---------------------------------------------------------------------------
// Instead of:  chrome.storage.local.get('key')
// Write:       api.storage.local.get('key')
//
// This works identically on Chrome and Firefox.
// On Chrome, `api` === `chrome`.
// On Firefox, `api` === `browser` (polyfill).
```

```typescript
// Conditional polyfill import for Firefox builds
// This import is only included when BROWSER_TARGET=firefox

// src/shared/firefox-polyfill.ts
// This file is the Firefox build entry point that loads the polyfill
// BEFORE any extension code runs.

// Only import the polyfill in Firefox builds.
// Vite's define plugin replaces __BROWSER_TARGET__ at build time.
declare const __BROWSER_TARGET__: string;

if (__BROWSER_TARGET__ === 'firefox') {
  // webextension-polyfill is a devDependency, only bundled for Firefox.
  // It provides a Promise-based `browser.*` namespace that matches
  // Chrome's MV3 Promise-based `chrome.*` APIs.
  //
  // Install: npm install -D webextension-polyfill
  // Size: ~15KB minified (acceptable for Firefox-only builds)
  import('webextension-polyfill').then((browserPolyfill) => {
    (globalThis as Record<string, unknown>).browser = browserPolyfill.default;
  });
}
```

```typescript
// vite.config.ts — Firefox-specific define
// Add to the getDefines() function:

function getDefines(mode: string): Record<string, string> {
  return {
    '__DEV__': JSON.stringify(mode === 'development'),
    '__VERSION__': JSON.stringify(getPackageVersion()),
    '__BROWSER_TARGET__': JSON.stringify(
      process.env.BROWSER_TARGET || 'chrome'
    ),
    'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || ''),
    'process.env.STRIPE_KEY': JSON.stringify(process.env.STRIPE_KEY || ''),
    'process.env.API_URL': JSON.stringify(
      process.env.API_URL || 'https://api.focusmodeblocker.com'
    ),
  };
}
```

#### 9.6.2 Feature Detection Patterns

```typescript
// src/shared/feature-detect.ts
// Focus Mode - Blocker: Runtime feature detection for cross-browser support.
//
// These functions detect API availability at runtime, allowing Focus Mode
// to gracefully degrade on browsers that lack specific features.

/**
 * Check if declarativeNetRequest is available.
 * Chrome 116+: yes. Firefox 128+: partially.
 */
export function hasDNR(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.declarativeNetRequest !== 'undefined' &&
    typeof chrome.declarativeNetRequest.updateDynamicRules === 'function'
  );
}

/**
 * Check if session storage is available.
 * Chrome 116+: yes. Firefox 128+: yes (as browser.storage.session).
 */
export function hasSessionStorage(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.storage !== 'undefined' &&
    typeof chrome.storage.session !== 'undefined'
  );
}

/**
 * Check if the offscreen API is available.
 * Chrome 116+: yes. Firefox: no. Edge: yes.
 */
export function hasOffscreen(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.offscreen !== 'undefined' &&
    typeof chrome.offscreen.createDocument === 'function'
  );
}

/**
 * Check if the sidePanel API is available.
 * Chrome 116+: yes. Firefox: no. Edge: yes.
 */
export function hasSidePanel(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.sidePanel !== 'undefined'
  );
}

/**
 * Check if DNR session-scoped rules are supported.
 * Chrome 116+: yes. Firefox: no.
 */
export function hasDNRSessionRules(): boolean {
  return (
    hasDNR() &&
    typeof chrome.declarativeNetRequest.updateSessionRules === 'function'
  );
}

/**
 * Check if the scripting API supports the 'world' parameter.
 * Chrome 116+: yes (ISOLATED, MAIN). Firefox 128+: partial.
 */
export function hasScriptingWorlds(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.scripting !== 'undefined' &&
    typeof chrome.scripting.executeScript === 'function'
    // The 'world' parameter is supported but we can't detect it statically.
    // We rely on the target Chrome version (116+) for this.
  );
}

/**
 * Check if chrome.alarms supports sub-minute intervals.
 * Dev mode (unpacked extensions): minimum 30 seconds.
 * Production (CWS): minimum 1 minute.
 */
export function getMinAlarmInterval(): number {
  // In development (unpacked), Chrome allows 30-second alarms.
  // In production (CWS), minimum is 1 minute.
  // We default to 1 minute for safety.
  return 1; // minutes
}

// ---------------------------------------------------------------------------
// Feature-gated initialization
// ---------------------------------------------------------------------------

/**
 * Initialize Focus Mode features based on browser capabilities.
 * Called from the service worker entry point.
 */
export function detectFeatures(): Record<string, boolean> {
  const features = {
    dnr: hasDNR(),
    dnrSessionRules: hasDNRSessionRules(),
    sessionStorage: hasSessionStorage(),
    offscreen: hasOffscreen(),
    sidePanel: hasSidePanel(),
    scriptingWorlds: hasScriptingWorlds(),
  };

  if (__DEV__) {
    console.log('[FeatureDetect] Browser capabilities:', features);
  }

  return features;
}
```

#### 9.6.3 Graceful Degradation

```typescript
// src/background/offscreen-bridge.ts
// Focus Mode - Blocker: Offscreen document bridge with graceful fallback.
//
// chrome.offscreen is used for:
// - Playing notification sounds (Audio API not available in SW)
// - Clipboard operations
// - DOM parsing (for import/export features)
//
// On browsers that don't support offscreen (Firefox), we fall back to
// alternative approaches.

import { hasOffscreen } from '@shared/feature-detect';

/**
 * Play a notification sound.
 * Chrome: Uses offscreen document with Audio API.
 * Firefox fallback: Uses Notifications API with sound, or skips.
 */
export async function playSound(soundFile: string): Promise<void> {
  if (hasOffscreen()) {
    // Chrome path: create offscreen document and play sound
    await ensureOffscreenDocument();

    await chrome.runtime.sendMessage({
      type: 'OFFSCREEN_PLAY_SOUND',
      target: 'offscreen',
      data: { soundFile },
    });
  } else {
    // Firefox fallback: use notification with default sound
    // Browsers without offscreen cannot play custom sounds from
    // service workers. The notification itself may play a system sound.
    if (__DEV__) {
      console.log(
        '[OffscreenBridge] Offscreen not available, skipping custom sound',
      );
    }
  }
}

/**
 * Parse HTML content (for blocklist import).
 * Chrome: Uses offscreen document with DOMParser.
 * Firefox fallback: Uses content script injection.
 */
export async function parseHTML(html: string): Promise<string[]> {
  if (hasOffscreen()) {
    await ensureOffscreenDocument();

    const response = await chrome.runtime.sendMessage({
      type: 'OFFSCREEN_PARSE_HTML',
      target: 'offscreen',
      data: { html },
    });

    return response.urls as string[];
  } else {
    // Firefox fallback: parse in a hidden tab or use regex
    // Simple regex extraction of URLs (less robust but functional)
    const urlRegex = /https?:\/\/[^\s<>"']+/g;
    return html.match(urlRegex) || [];
  }
}

// ---------------------------------------------------------------------------
// Offscreen document lifecycle
// ---------------------------------------------------------------------------

let offscreenCreated = false;

async function ensureOffscreenDocument(): Promise<void> {
  if (offscreenCreated) return;

  // Check if already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });

  if (existingContexts.length > 0) {
    offscreenCreated = true;
    return;
  }

  await chrome.offscreen.createDocument({
    url: 'src/offscreen/offscreen.html',
    reasons: [
      chrome.offscreen.Reason.AUDIO_PLAYBACK,
      chrome.offscreen.Reason.DOM_PARSER,
      chrome.offscreen.Reason.CLIPBOARD,
    ],
    justification:
      'Play notification sounds, parse HTML for blocklist import, clipboard operations',
  });

  offscreenCreated = true;
}

export function initOffscreenBridge(): void {
  // Reset state on service worker startup
  offscreenCreated = false;

  if (__DEV__) {
    console.log(
      `[OffscreenBridge] Initialized (offscreen supported: ${hasOffscreen()})`,
    );
  }
}
```

#### 9.6.4 Namespace Bridging Summary

```
Browser API Namespace Resolution in Focus Mode:

  Chrome / Edge / Brave / Opera
  ┌─────────────────────────────────┐
  │  import { api } from           │
  │    '@shared/browser-compat';    │
  │                                 │
  │  api === chrome (native)        │
  │  All APIs return Promises       │
  │  No polyfill needed             │
  │  Bundle overhead: 0 bytes       │
  └─────────────────────────────────┘

  Firefox (with webextension-polyfill)
  ┌─────────────────────────────────┐
  │  import { api } from           │
  │    '@shared/browser-compat';    │
  │                                 │
  │  api === browser (polyfill)     │
  │  Polyfill normalizes to         │
  │    Promise-based APIs           │
  │  Bundle overhead: ~15KB         │
  │  (Firefox build only)           │
  └─────────────────────────────────┘

  Approach:
  1. All Focus Mode code uses `api.*` instead of `chrome.*`
  2. `api` resolves to the correct namespace at runtime
  3. Feature detection gates browser-specific APIs (offscreen, sidePanel)
  4. The polyfill is only bundled in Firefox builds (zero cost for Chrome)
```

---

**End of Sections 8-9: Build System & MV2-to-MV3 Migration Reference**

