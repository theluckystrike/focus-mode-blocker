# Section 5: Session Replay for Focus Mode

## 5.1 Privacy-Aware Session Recorder

`src/content/session-recorder.ts`

The SessionRecorder captures user interactions exclusively within Focus Mode extension UI pages (popup, options, block page, onboarding). It never activates on user-browsed web pages. All recording requires explicit opt-in consent and enforces strict privacy safeguards.

```typescript
// src/content/session-recorder.ts

import { PRIVACY_CONFIG, isRecordingAllowed } from '../config/privacy-settings';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReplayEventType =
  | 'click'
  | 'scroll'
  | 'input_interaction'
  | 'timer_start'
  | 'timer_pause'
  | 'timer_resume'
  | 'blocklist_edit'
  | 'settings_change'
  | 'slide_navigation'
  | 'page_enter'
  | 'page_leave'
  | 'focus_score_view'
  | 'back_to_work_click'
  | 'quote_interaction';

export interface ReplayEvent {
  /** Event type identifier */
  type: ReplayEventType;
  /** Monotonic timestamp in ms since recording start */
  timestamp: number;
  /** Sanitized page context */
  page: 'popup' | 'options' | 'block_page' | 'onboarding' | 'unknown';
  /** Event-specific payload — never contains user text or input values */
  data: Record<string, unknown>;
}

export interface ClickEventData {
  tag: string;
  id: string;
  classes: string[];
  /** Position relative to viewport */
  x: number;
  y: number;
}

export interface ScrollEventData {
  scrollX: number;
  scrollY: number;
  /** Maximum scroll depth reached as percentage */
  maxDepthPercent: number;
}

export interface InputInteractionData {
  /** Target element descriptor — never the value itself */
  targetTag: string;
  targetId: string;
  targetClasses: string[];
  /** Length of current input value — never the value itself */
  valueLength: number;
  inputType: string;
}

export interface TimerEventData {
  action: 'start' | 'pause' | 'resume';
  sessionType: 'focus' | 'short_break' | 'long_break';
  /** Elapsed seconds at time of event */
  elapsedSeconds: number;
}

export interface BlocklistEditData {
  action: 'add' | 'remove' | 'toggle';
  /** Number of items in blocklist after edit */
  listSize: number;
}

export interface SettingsChangeData {
  /** Settings section identifier — never the value */
  section: string;
  /** Setting key name */
  settingKey: string;
  /** Type of value changed */
  valueType: 'boolean' | 'number' | 'string' | 'enum';
}

export interface SlideNavigationData {
  fromSlide: number;
  toSlide: number;
  totalSlides: number;
  direction: 'forward' | 'backward' | 'skip';
}

export interface ReplaySession {
  sessionId: string;
  extensionVersion: string;
  startedAt: number;
  endedAt: number | null;
  page: string;
  events: ReplayEvent[];
  metadata: {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    popupDimensions?: { width: number; height: number };
    extensionState: 'idle' | 'focusing' | 'short_break' | 'long_break' | 'nuclear';
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_EVENTS = 500;
const MAX_RECORDING_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const SCROLL_THROTTLE_MS = 250;
const LAST_N_SECONDS_FOR_ERROR = 30;

/** Extension page URL patterns that are allowed for recording */
const ALLOWED_PAGE_PATTERNS: RegExp[] = [
  /^chrome-extension:\/\/[a-z]{32}\/popup\.html/,
  /^chrome-extension:\/\/[a-z]{32}\/options\.html/,
  /^chrome-extension:\/\/[a-z]{32}\/blocked\.html/,
  /^chrome-extension:\/\/[a-z]{32}\/onboarding\.html/,
];

// ---------------------------------------------------------------------------
// SessionRecorder
// ---------------------------------------------------------------------------

export class SessionRecorder {
  private events: ReplayEvent[] = [];
  private recording = false;
  private startTime = 0;
  private sessionId = '';
  private currentPage: ReplayEvent['page'] = 'unknown';
  private maxScrollDepth = 0;
  private scrollThrottleTimer: ReturnType<typeof setTimeout> | null = null;
  private durationTimer: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /**
   * Begin recording. Performs all safety and privacy checks before
   * activating any listeners. Returns false if recording is not allowed.
   */
  async start(): Promise<boolean> {
    if (this.recording) {
      return true;
    }

    // --- Safety gate: only extension pages ---
    if (!this.isExtensionPage()) {
      console.warn('[SessionRecorder] Blocked: not an extension page.');
      return false;
    }

    // --- Safety gate: incognito ---
    if (this.isIncognito()) {
      console.warn('[SessionRecorder] Blocked: incognito mode.');
      return false;
    }

    // --- Safety gate: password fields present ---
    if (this.hasPasswordFields()) {
      console.warn('[SessionRecorder] Blocked: page contains password fields.');
      return false;
    }

    // --- Privacy gate: explicit consent + region check ---
    const allowed = await isRecordingAllowed();
    if (!allowed) {
      console.warn('[SessionRecorder] Blocked: recording not allowed by privacy config.');
      return false;
    }

    this.sessionId = this.generateSessionId();
    this.startTime = performance.now();
    this.events = [];
    this.maxScrollDepth = 0;
    this.recording = true;
    this.currentPage = this.detectPage();

    this.addEvent('page_enter', { page: this.currentPage });
    this.attachListeners();

    // Auto-stop after max duration
    this.durationTimer = setTimeout(() => {
      this.stop('max_duration_reached');
    }, MAX_RECORDING_DURATION_MS);

    return true;
  }

  /**
   * Stop recording and return the completed session.
   */
  stop(reason: string = 'manual'): ReplaySession | null {
    if (!this.recording) {
      return null;
    }

    this.recording = false;
    this.addEvent('page_leave', { reason });
    this.detachListeners();

    if (this.durationTimer) {
      clearTimeout(this.durationTimer);
      this.durationTimer = null;
    }

    return this.buildSession();
  }

  /**
   * Returns whether the recorder is actively capturing events.
   */
  isRecording(): boolean {
    return this.recording;
  }

  // -----------------------------------------------------------------------
  // Event Capture
  // -----------------------------------------------------------------------

  private addEvent(type: ReplayEventType, data: Record<string, unknown>): void {
    if (!this.recording) return;

    if (this.events.length >= MAX_EVENTS) {
      // Drop oldest non-critical events to make room
      this.evictOldestEvent();
    }

    const event: ReplayEvent = {
      type,
      timestamp: Math.round(performance.now() - this.startTime),
      page: this.currentPage,
      data,
    };

    this.events.push(event);
  }

  /**
   * Remove the oldest event that is not a page_enter or page_leave marker.
   */
  private evictOldestEvent(): void {
    const idx = this.events.findIndex(
      (e) => e.type !== 'page_enter' && e.type !== 'page_leave'
    );
    if (idx !== -1) {
      this.events.splice(idx, 1);
    }
  }

  // -----------------------------------------------------------------------
  // DOM Listeners
  // -----------------------------------------------------------------------

  private attachListeners(): void {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    document.addEventListener('click', this.handleClick, { capture: true, signal });
    document.addEventListener('scroll', this.handleScroll, { capture: true, passive: true, signal });
    document.addEventListener('input', this.handleInput, { capture: true, signal });

    // Extension-specific custom events dispatched by our UI components
    document.addEventListener('fm:timer', this.handleTimerEvent as EventListener, { signal });
    document.addEventListener('fm:blocklist', this.handleBlocklistEvent as EventListener, { signal });
    document.addEventListener('fm:settings', this.handleSettingsEvent as EventListener, { signal });
    document.addEventListener('fm:slide', this.handleSlideEvent as EventListener, { signal });
    document.addEventListener('fm:focus-score-view', this.handleFocusScoreView as EventListener, { signal });
    document.addEventListener('fm:back-to-work', this.handleBackToWork as EventListener, { signal });
    document.addEventListener('fm:quote-interaction', this.handleQuoteInteraction as EventListener, { signal });
  }

  private detachListeners(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.scrollThrottleTimer) {
      clearTimeout(this.scrollThrottleTimer);
      this.scrollThrottleTimer = null;
    }
  }

  // --- Click ---

  private handleClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Never record text content — only structural identifiers
    if (this.isMaskedElement(target)) return;

    const data: ClickEventData = {
      tag: target.tagName.toLowerCase(),
      id: target.id || '',
      classes: Array.from(target.classList).slice(0, 5), // cap at 5 classes
      x: Math.round(e.clientX),
      y: Math.round(e.clientY),
    };

    this.addEvent('click', data as unknown as Record<string, unknown>);
  };

  // --- Scroll ---

  private handleScroll = (): void => {
    if (this.scrollThrottleTimer) return;

    this.scrollThrottleTimer = setTimeout(() => {
      this.scrollThrottleTimer = null;

      const scrollX = Math.round(window.scrollX);
      const scrollY = Math.round(window.scrollY);
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        1
      );
      const viewportHeight = window.innerHeight;
      const depthPercent = Math.min(
        100,
        Math.round(((scrollY + viewportHeight) / docHeight) * 100)
      );

      if (depthPercent > this.maxScrollDepth) {
        this.maxScrollDepth = depthPercent;
      }

      const data: ScrollEventData = {
        scrollX,
        scrollY,
        maxDepthPercent: this.maxScrollDepth,
      };

      this.addEvent('scroll', data as unknown as Record<string, unknown>);
    }, SCROLL_THROTTLE_MS);
  };

  // --- Input interaction ---

  private handleInput = (e: Event): void => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Never record values — only structural metadata
    if (this.isMaskedElement(target)) return;
    if (this.isBlockedElement(target)) return;

    const inputEl = target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    const data: InputInteractionData = {
      targetTag: target.tagName.toLowerCase(),
      targetId: target.id || '',
      targetClasses: Array.from(target.classList).slice(0, 5),
      valueLength: ('value' in inputEl) ? String(inputEl.value).length : 0,
      inputType: (target as HTMLInputElement).type || 'text',
    };

    this.addEvent('input_interaction', data as unknown as Record<string, unknown>);
  };

  // --- Extension-specific events ---

  private handleTimerEvent = (e: CustomEvent<TimerEventData>): void => {
    const { action, sessionType, elapsedSeconds } = e.detail;
    this.addEvent(
      action === 'start' ? 'timer_start' : action === 'pause' ? 'timer_pause' : 'timer_resume',
      { action, sessionType, elapsedSeconds }
    );
  };

  private handleBlocklistEvent = (e: CustomEvent<BlocklistEditData>): void => {
    this.addEvent('blocklist_edit', {
      action: e.detail.action,
      listSize: e.detail.listSize,
    });
  };

  private handleSettingsEvent = (e: CustomEvent<SettingsChangeData>): void => {
    this.addEvent('settings_change', {
      section: e.detail.section,
      settingKey: e.detail.settingKey,
      valueType: e.detail.valueType,
    });
  };

  private handleSlideEvent = (e: CustomEvent<SlideNavigationData>): void => {
    this.addEvent('slide_navigation', {
      fromSlide: e.detail.fromSlide,
      toSlide: e.detail.toSlide,
      totalSlides: e.detail.totalSlides,
      direction: e.detail.direction,
    });
  };

  private handleFocusScoreView = (_e: CustomEvent): void => {
    this.addEvent('focus_score_view', {});
  };

  private handleBackToWork = (_e: CustomEvent): void => {
    this.addEvent('back_to_work_click', {
      page: this.currentPage,
      timestamp: Date.now(),
    });
  };

  private handleQuoteInteraction = (e: CustomEvent<{ action: string }>): void => {
    this.addEvent('quote_interaction', {
      action: e.detail.action, // 'view', 'copy', 'refresh'
    });
  };

  // -----------------------------------------------------------------------
  // Safety & Privacy Checks
  // -----------------------------------------------------------------------

  /**
   * Only record on our own extension pages — never on user web pages.
   */
  private isExtensionPage(): boolean {
    const url = window.location.href;
    return ALLOWED_PAGE_PATTERNS.some((pattern) => pattern.test(url));
  }

  /**
   * Detect which extension page we are on.
   */
  private detectPage(): ReplayEvent['page'] {
    const url = window.location.href;
    if (url.includes('popup.html')) return 'popup';
    if (url.includes('options.html')) return 'options';
    if (url.includes('blocked.html')) return 'block_page';
    if (url.includes('onboarding.html')) return 'onboarding';
    return 'unknown';
  }

  /**
   * Never record in incognito windows.
   */
  private isIncognito(): boolean {
    try {
      // chrome.extension.inIncognitoContext is synchronous and available in
      // content scripts running in incognito tabs.
      return !!(chrome?.extension?.inIncognitoContext);
    } catch {
      return false;
    }
  }

  /**
   * Block recording entirely if password fields exist on the page.
   */
  private hasPasswordFields(): boolean {
    return document.querySelectorAll('input[type="password"]').length > 0;
  }

  /**
   * Check if an element should have its interactions masked.
   */
  private isMaskedElement(el: HTMLElement): boolean {
    const maskSelectors = PRIVACY_CONFIG.maskSelectors;
    return maskSelectors.some((selector) => {
      try {
        return el.matches(selector) || el.closest(selector) !== null;
      } catch {
        return false;
      }
    });
  }

  /**
   * Check if an element should block recording entirely.
   */
  private isBlockedElement(el: HTMLElement): boolean {
    const blockSelectors = PRIVACY_CONFIG.blockSelectors;
    return blockSelectors.some((selector) => {
      try {
        return el.matches(selector) || el.closest(selector) !== null;
      } catch {
        return false;
      }
    });
  }

  // -----------------------------------------------------------------------
  // URL Sanitization
  // -----------------------------------------------------------------------

  /**
   * Strip query params and hash from URLs before including them in replays.
   */
  private sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      return 'invalid-url';
    }
  }

  // -----------------------------------------------------------------------
  // Session Building
  // -----------------------------------------------------------------------

  private buildSession(): ReplaySession {
    return {
      sessionId: this.sessionId,
      extensionVersion: chrome.runtime.getManifest?.()?.version ?? 'unknown',
      startedAt: this.startTime,
      endedAt: performance.now(),
      page: this.sanitizeUrl(window.location.href),
      events: [...this.events],
      metadata: {
        userAgent: navigator.userAgent,
        screenWidth: screen.width,
        screenHeight: screen.height,
        popupDimensions: this.currentPage === 'popup'
          ? { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight }
          : undefined,
        extensionState: 'idle', // Will be enriched by caller via background message
      },
    };
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `replay_${timestamp}_${random}`;
  }

  // -----------------------------------------------------------------------
  // Replay Data Retrieval
  // -----------------------------------------------------------------------

  /**
   * Get the last N seconds of replay events — used to attach context
   * to error reports.
   */
  getLastNSeconds(seconds: number = LAST_N_SECONDS_FOR_ERROR): ReplayEvent[] {
    if (this.events.length === 0) return [];

    const now = performance.now() - this.startTime;
    const cutoff = now - seconds * 1000;

    return this.events.filter((e) => e.timestamp >= cutoff);
  }

  /**
   * Get the full replay event list — used for support tickets.
   */
  getFullReplay(): ReplayEvent[] {
    return [...this.events];
  }

  /**
   * Export the current session (or the last completed session) as JSON.
   */
  exportAsJson(): string {
    const session = this.buildSession();
    return JSON.stringify(session, null, 2);
  }

  /**
   * Return current event count (useful for diagnostics).
   */
  getEventCount(): number {
    return this.events.length;
  }
}
```

---

## 5.2 Focus Mode Specific Replay Integration

Each Focus Mode UI surface has tailored replay capture to provide maximum debugging context while maintaining privacy boundaries.

```typescript
// src/content/replay-integration.ts

import { SessionRecorder } from './session-recorder';

// ---------------------------------------------------------------------------
// Types for integration layer
// ---------------------------------------------------------------------------

interface ReplayAttachment {
  replayId: string;
  events: import('./session-recorder').ReplayEvent[];
  page: string;
  durationMs: number;
  eventCount: number;
}

interface PopupReplayMetrics {
  timerInteractions: number;
  focusScoreViews: number;
  blocklistEdits: number;
  totalClicks: number;
  sessionDurationMs: number;
}

interface BlockPageReplayMetrics {
  timeOnPageMs: number;
  backToWorkClicked: boolean;
  backToWorkTimeMs: number | null;
  scrollDepthPercent: number;
  quoteInteractions: number;
}

interface OnboardingReplayMetrics {
  slidesViewed: number[];
  dropOffSlide: number | null;
  completedSetup: boolean;
  firstBlockAdded: boolean;
  totalTimeMs: number;
  slideTimesMs: Record<number, number>;
}

interface OptionsReplayMetrics {
  sectionsVisited: string[];
  settingsChanged: number;
  totalTimeMs: number;
}

// ---------------------------------------------------------------------------
// FocusModeReplayIntegration
// ---------------------------------------------------------------------------

export class FocusModeReplayIntegration {
  private recorder: SessionRecorder;
  private pageEnteredAt: number = 0;

  constructor(recorder: SessionRecorder) {
    this.recorder = recorder;
  }

  // -----------------------------------------------------------------------
  // Popup replay: Timer interactions, Focus Score, blocklist
  // -----------------------------------------------------------------------

  /**
   * Analyze captured popup replay events and produce debugging metrics.
   * Called when an error occurs in the popup to attach context.
   */
  getPopupReplayMetrics(): PopupReplayMetrics {
    const events = this.recorder.getFullReplay();

    return {
      timerInteractions: events.filter(
        (e) => e.type === 'timer_start' || e.type === 'timer_pause' || e.type === 'timer_resume'
      ).length,
      focusScoreViews: events.filter((e) => e.type === 'focus_score_view').length,
      blocklistEdits: events.filter((e) => e.type === 'blocklist_edit').length,
      totalClicks: events.filter((e) => e.type === 'click').length,
      sessionDurationMs: events.length > 0
        ? events[events.length - 1].timestamp - events[0].timestamp
        : 0,
    };
  }

  // -----------------------------------------------------------------------
  // Block page replay: Time on page, "Back to Work", quotes
  // -----------------------------------------------------------------------

  /**
   * Analyze captured block page replay events. The block page is shown
   * when a user visits a blocked site during a focus session. Key metrics
   * include how long they stayed and whether they clicked "Back to Work".
   */
  getBlockPageReplayMetrics(): BlockPageReplayMetrics {
    const events = this.recorder.getFullReplay();

    const backToWork = events.find((e) => e.type === 'back_to_work_click');
    const scrollEvents = events.filter((e) => e.type === 'scroll');
    const maxScroll = scrollEvents.length > 0
      ? Math.max(...scrollEvents.map((e) => (e.data as { maxDepthPercent: number }).maxDepthPercent))
      : 0;

    const quoteEvents = events.filter((e) => e.type === 'quote_interaction');

    const totalTime = events.length > 1
      ? events[events.length - 1].timestamp - events[0].timestamp
      : 0;

    return {
      timeOnPageMs: totalTime,
      backToWorkClicked: !!backToWork,
      backToWorkTimeMs: backToWork ? backToWork.timestamp : null,
      scrollDepthPercent: maxScroll,
      quoteInteractions: quoteEvents.length,
    };
  }

  // -----------------------------------------------------------------------
  // Options page replay: Settings navigation, config changes
  // -----------------------------------------------------------------------

  /**
   * Analyze options page replay. The options page has 8 sections
   * (General, Blocklist, Timer, Focus Score, Sounds, Appearance, Account, About).
   */
  getOptionsReplayMetrics(): OptionsReplayMetrics {
    const events = this.recorder.getFullReplay();

    const settingsEvents = events.filter((e) => e.type === 'settings_change');
    const sections = new Set<string>();
    settingsEvents.forEach((e) => {
      const section = (e.data as { section: string }).section;
      if (section) sections.add(section);
    });

    const totalTime = events.length > 1
      ? events[events.length - 1].timestamp - events[0].timestamp
      : 0;

    return {
      sectionsVisited: Array.from(sections),
      settingsChanged: settingsEvents.length,
      totalTimeMs: totalTime,
    };
  }

  // -----------------------------------------------------------------------
  // Onboarding replay: Slide progression, drop-off, first block
  // -----------------------------------------------------------------------

  /**
   * Analyze the onboarding flow replay. The onboarding has 5 slides:
   * 1. Welcome, 2. Quick Setup, 3. Focus Style, 4. Focus Score Intro,
   * 5. First Session CTA. Drop-off detection is critical here.
   */
  getOnboardingReplayMetrics(): OnboardingReplayMetrics {
    const events = this.recorder.getFullReplay();

    const slideEvents = events.filter((e) => e.type === 'slide_navigation');
    const slidesViewed = new Set<number>();
    const slideTimes: Record<number, number> = {};
    let lastSlideTimestamp = events.length > 0 ? events[0].timestamp : 0;
    let currentSlide = 1;

    slidesViewed.add(1); // User always sees slide 1

    slideEvents.forEach((e) => {
      const data = e.data as { fromSlide: number; toSlide: number };
      slidesViewed.add(data.toSlide);

      // Calculate time spent on previous slide
      const timeOnSlide = e.timestamp - lastSlideTimestamp;
      slideTimes[data.fromSlide] = (slideTimes[data.fromSlide] || 0) + timeOnSlide;

      lastSlideTimestamp = e.timestamp;
      currentSlide = data.toSlide;
    });

    // Time on last viewed slide
    if (events.length > 0) {
      const finalTimestamp = events[events.length - 1].timestamp;
      slideTimes[currentSlide] = (slideTimes[currentSlide] || 0) + (finalTimestamp - lastSlideTimestamp);
    }

    // Detect drop-off: if user never reached slide 5, they dropped off
    const maxSlide = Math.max(...Array.from(slidesViewed));
    const completedSetup = maxSlide >= 5;
    const dropOffSlide = completedSetup ? null : maxSlide;

    // Check if first block was added (blocklist_edit during onboarding)
    const blocklistEdits = events.filter((e) => e.type === 'blocklist_edit');
    const firstBlockAdded = blocklistEdits.some(
      (e) => (e.data as { action: string }).action === 'add'
    );

    const totalTime = events.length > 1
      ? events[events.length - 1].timestamp - events[0].timestamp
      : 0;

    return {
      slidesViewed: Array.from(slidesViewed).sort((a, b) => a - b),
      dropOffSlide,
      completedSetup,
      firstBlockAdded,
      totalTimeMs: totalTime,
      slideTimesMs: slideTimes,
    };
  }
}
```

---

## 5.3 Replay Data Attachment

Attach replay data to error reports, support tickets, and developer debugging exports.

```typescript
// src/content/replay-attachment.ts

import { SessionRecorder, ReplayEvent, ReplaySession } from './session-recorder';
import { FocusModeReplayIntegration } from './replay-integration';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorReportAttachment {
  /** Last 30 seconds of replay events for error context */
  recentEvents: ReplayEvent[];
  recentEventCount: number;
  /** Page where the error occurred */
  page: string;
  /** Total recording duration at time of error */
  totalRecordingDurationMs: number;
  /** Page-specific metrics snapshot */
  pageMetrics: Record<string, unknown>;
}

interface SupportTicketAttachment {
  /** Full replay session data */
  session: ReplaySession | null;
  /** Structured page metrics for support team */
  pageMetrics: Record<string, unknown>;
  /** Human-readable summary */
  summary: string;
}

interface DebugExport {
  /** Full JSON replay data */
  replayJson: string;
  /** Filename suggestion */
  suggestedFilename: string;
  /** MIME type */
  mimeType: string;
  /** Size in bytes */
  sizeBytes: number;
}

// ---------------------------------------------------------------------------
// ReplayAttachmentManager
// ---------------------------------------------------------------------------

export class ReplayAttachmentManager {
  private recorder: SessionRecorder;
  private integration: FocusModeReplayIntegration;

  constructor(recorder: SessionRecorder) {
    this.recorder = recorder;
    this.integration = new FocusModeReplayIntegration(recorder);
  }

  // -----------------------------------------------------------------------
  // Error report attachment (automatic — last 30 seconds)
  // -----------------------------------------------------------------------

  /**
   * Generate a replay attachment for an error report. Includes only the
   * last 30 seconds of events to provide debugging context without
   * transmitting the full session.
   */
  getErrorReportAttachment(): ErrorReportAttachment {
    const recentEvents = this.recorder.getLastNSeconds(30);
    const allEvents = this.recorder.getFullReplay();
    const page = this.detectCurrentPage();

    const totalDuration = allEvents.length > 1
      ? allEvents[allEvents.length - 1].timestamp - allEvents[0].timestamp
      : 0;

    return {
      recentEvents,
      recentEventCount: recentEvents.length,
      page,
      totalRecordingDurationMs: totalDuration,
      pageMetrics: this.getPageMetrics(page),
    };
  }

  // -----------------------------------------------------------------------
  // Support ticket attachment (user-initiated — full replay)
  // -----------------------------------------------------------------------

  /**
   * Generate a replay attachment for a user-initiated support ticket.
   * Includes the full replay session and a human-readable summary.
   * Only called with explicit user action (e.g., "Attach session replay"
   * button in the support form).
   */
  getSupportTicketAttachment(): SupportTicketAttachment {
    const session = this.recorder.stop('support_ticket_export');
    const page = this.detectCurrentPage();
    const metrics = this.getPageMetrics(page);

    return {
      session,
      pageMetrics: metrics,
      summary: this.generateHumanSummary(session, metrics, page),
    };
  }

  // -----------------------------------------------------------------------
  // Developer debug export (JSON file download)
  // -----------------------------------------------------------------------

  /**
   * Export the full replay session as a downloadable JSON file.
   * Used by developers for local debugging.
   */
  getDebugExport(): DebugExport {
    const json = this.recorder.exportAsJson();
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);

    return {
      replayJson: json,
      suggestedFilename: `focus-mode-replay-${dateStr}.json`,
      mimeType: 'application/json',
      sizeBytes: new Blob([json]).size,
    };
  }

  /**
   * Trigger a browser download of the debug export.
   */
  downloadDebugExport(): void {
    const exp = this.getDebugExport();
    const blob = new Blob([exp.replayJson], { type: exp.mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = exp.suggestedFilename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1000);
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private detectCurrentPage(): string {
    const url = window.location.href;
    if (url.includes('popup.html')) return 'popup';
    if (url.includes('options.html')) return 'options';
    if (url.includes('blocked.html')) return 'block_page';
    if (url.includes('onboarding.html')) return 'onboarding';
    return 'unknown';
  }

  private getPageMetrics(page: string): Record<string, unknown> {
    switch (page) {
      case 'popup':
        return this.integration.getPopupReplayMetrics() as unknown as Record<string, unknown>;
      case 'block_page':
        return this.integration.getBlockPageReplayMetrics() as unknown as Record<string, unknown>;
      case 'options':
        return this.integration.getOptionsReplayMetrics() as unknown as Record<string, unknown>;
      case 'onboarding':
        return this.integration.getOnboardingReplayMetrics() as unknown as Record<string, unknown>;
      default:
        return {};
    }
  }

  private generateHumanSummary(
    session: ReplaySession | null,
    metrics: Record<string, unknown>,
    page: string
  ): string {
    if (!session) return 'No replay session available.';

    const lines: string[] = [
      `Session Replay Summary`,
      `======================`,
      `Session ID: ${session.sessionId}`,
      `Extension Version: ${session.extensionVersion}`,
      `Page: ${page}`,
      `Events Recorded: ${session.events.length}`,
      `Duration: ${Math.round((session.endedAt ?? 0) - session.startedAt)}ms`,
      `Screen: ${session.metadata.screenWidth}x${session.metadata.screenHeight}`,
      `Extension State: ${session.metadata.extensionState}`,
      ``,
      `Page-Specific Metrics:`,
    ];

    for (const [key, value] of Object.entries(metrics)) {
      lines.push(`  ${key}: ${JSON.stringify(value)}`);
    }

    return lines.join('\n');
  }
}
```

---

## 5.4 Privacy Configuration

`src/config/privacy-settings.ts`

Centralized privacy configuration controlling all session recording behavior. Enforces GDPR compliance, consent requirements, and element-level masking.

```typescript
// src/config/privacy-settings.ts

// ---------------------------------------------------------------------------
// Privacy Configuration
// ---------------------------------------------------------------------------

export interface PrivacyConfig {
  /**
   * CSS selectors for elements whose input values should be masked.
   * Interactions are still recorded but values are replaced with asterisks.
   */
  maskSelectors: string[];

  /**
   * CSS selectors for elements that should completely block recording.
   * No events from these elements or their children are captured.
   */
  blockSelectors: string[];

  /**
   * URL patterns that should never be recorded. If the current page URL
   * matches any pattern, recording will not start.
   */
  excludeUrlPatterns: RegExp[];

  /**
   * Recording requires explicit user consent via the extension settings.
   * This is always true — cannot be overridden.
   */
  requireConsent: true;

  /**
   * Recording is always disabled in incognito/private browsing.
   * This is always true — cannot be overridden.
   */
  disableInIncognito: true;

  /**
   * Maximum recording duration in milliseconds. Recording auto-stops
   * after this duration.
   */
  maxRecordingDurationMs: number;

  /**
   * Maximum number of events per recording session. Oldest non-critical
   * events are evicted when this limit is reached.
   */
  maxEvents: number;

  /**
   * ISO 3166-1 alpha-2 country codes where recording is disabled
   * for GDPR/privacy regulation compliance.
   */
  disabledRegions: string[];
}

export const PRIVACY_CONFIG: PrivacyConfig = {
  // --- Mask selectors: record interaction but never the value ---
  maskSelectors: [
    'input[type="password"]',
    'input[type="email"]',
    'input[type="tel"]',
    'input[type="number"][name*="card"]',
    'input[name*="credit"]',
    'input[name*="card"]',
    'input[name*="cvv"]',
    'input[name*="cvc"]',
    'input[name*="expir"]',
    'input[autocomplete*="cc-"]',
    '[data-private]',
    '[data-sensitive]',
    '.private-input',
    '.sensitive-field',
  ],

  // --- Block selectors: no recording of any events ---
  blockSelectors: [
    'form[action*="payment"]',
    'form[action*="checkout"]',
    '.payment-form',
    '.checkout-form',
    '[data-no-record]',
    '[data-block-recording]',
    '.stripe-element',
    '.braintree-hosted-field',
    '#payment-section',
  ],

  // --- Exclude URL patterns: never start recording on these pages ---
  excludeUrlPatterns: [
    /bank/i,
    /checkout/i,
    /payment/i,
    /pay\./i,
    /login/i,
    /signin/i,
    /sign-in/i,
    /auth/i,
    /oauth/i,
    /account\/security/i,
    /password/i,
    /stripe\.com/i,
    /paypal\.com/i,
    /braintree/i,
  ],

  // --- Always require explicit consent ---
  requireConsent: true,

  // --- Always disable in incognito ---
  disableInIncognito: true,

  // --- Recording limits ---
  maxRecordingDurationMs: 30 * 60 * 1000, // 30 minutes
  maxEvents: 500,

  // --- GDPR: disable in EU/EEA, UK, and CA ---
  disabledRegions: [
    // EU member states
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    // EEA (non-EU)
    'IS', 'LI', 'NO',
    // UK (post-Brexit, still has equivalent data protection)
    'GB',
    // Canada (PIPEDA)
    'CA',
  ],
};

// ---------------------------------------------------------------------------
// Consent Storage Keys
// ---------------------------------------------------------------------------

const CONSENT_STORAGE_KEY = 'fm_session_replay_consent';
const CONSENT_TIMESTAMP_KEY = 'fm_session_replay_consent_timestamp';

// ---------------------------------------------------------------------------
// isRecordingAllowed — Async check combining all privacy gates
// ---------------------------------------------------------------------------

/**
 * Master check that determines whether session recording is currently
 * permitted. All conditions must pass:
 *
 * 1. User has explicitly opted in via extension settings
 * 2. Not in an incognito context
 * 3. User's detected region is not in the disabled list
 * 4. Current URL does not match excluded patterns
 * 5. Page does not contain password fields
 *
 * This function is called before every recording session starts.
 */
export async function isRecordingAllowed(): Promise<boolean> {
  try {
    // 1. Check explicit consent
    const consentGranted = await checkConsent();
    if (!consentGranted) {
      return false;
    }

    // 2. Incognito check (redundant with SessionRecorder, but defense-in-depth)
    if (isIncognitoContext()) {
      return false;
    }

    // 3. Region check
    const regionAllowed = await checkRegion();
    if (!regionAllowed) {
      return false;
    }

    // 4. URL exclusion check
    if (isExcludedUrl(window.location.href)) {
      return false;
    }

    // 5. Password field check (defense-in-depth)
    if (document.querySelectorAll('input[type="password"]').length > 0) {
      return false;
    }

    return true;
  } catch (error) {
    // If any check fails, default to NOT recording (fail-safe)
    console.warn('[PrivacySettings] Safety check failed, blocking recording:', error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Consent Management
// ---------------------------------------------------------------------------

/**
 * Check if the user has explicitly opted in to session recording.
 */
async function checkConsent(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([CONSENT_STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        resolve(false);
        return;
      }
      resolve(result[CONSENT_STORAGE_KEY] === true);
    });
  });
}

/**
 * Set the user's recording consent. Called from the extension options page.
 */
export async function setRecordingConsent(granted: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const data: Record<string, unknown> = {
      [CONSENT_STORAGE_KEY]: granted,
      [CONSENT_TIMESTAMP_KEY]: granted ? Date.now() : null,
    };

    chrome.storage.sync.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

/**
 * Get the timestamp when consent was last granted. Returns null if
 * consent has never been granted or was revoked.
 */
export async function getConsentTimestamp(): Promise<number | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([CONSENT_TIMESTAMP_KEY], (result) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(result[CONSENT_TIMESTAMP_KEY] ?? null);
    });
  });
}

// ---------------------------------------------------------------------------
// Region Detection
// ---------------------------------------------------------------------------

/**
 * Check if the user's detected region allows recording.
 * Uses the Intl API as a privacy-friendly region detection method
 * (no network requests, no IP geolocation).
 */
async function checkRegion(): Promise<boolean> {
  try {
    const region = detectRegionFromIntl();
    if (!region) {
      // If we cannot detect the region, default to blocking (fail-safe
      // for privacy). Users in non-restricted regions can still opt in
      // if we add a manual region override in the future.
      return false;
    }
    return !PRIVACY_CONFIG.disabledRegions.includes(region);
  } catch {
    // Fail-safe: block recording if region detection fails
    return false;
  }
}

/**
 * Detect user's country code from the Intl API. This is a heuristic
 * based on the browser's locale settings, not a precise geolocation.
 * Returns ISO 3166-1 alpha-2 country code or null.
 */
function detectRegionFromIntl(): string | null {
  try {
    // Try resolvedOptions first — most reliable
    const options = new Intl.DateTimeFormat().resolvedOptions();
    const timeZone = options.timeZone;

    // Map timezone to country code (simplified — a full mapping would
    // be maintained in a separate data file in production)
    const tzCountryMap: Record<string, string> = {
      'America/New_York': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Los_Angeles': 'US',
      'America/Anchorage': 'US',
      'Pacific/Honolulu': 'US',
      'America/Toronto': 'CA',
      'America/Vancouver': 'CA',
      'Europe/London': 'GB',
      'Europe/Berlin': 'DE',
      'Europe/Paris': 'FR',
      'Europe/Rome': 'IT',
      'Europe/Madrid': 'ES',
      'Europe/Amsterdam': 'NL',
      'Europe/Brussels': 'BE',
      'Europe/Vienna': 'AT',
      'Europe/Zurich': 'CH',
      'Europe/Stockholm': 'SE',
      'Europe/Oslo': 'NO',
      'Europe/Copenhagen': 'DK',
      'Europe/Helsinki': 'FI',
      'Europe/Warsaw': 'PL',
      'Europe/Prague': 'CZ',
      'Europe/Budapest': 'HU',
      'Europe/Bucharest': 'RO',
      'Europe/Sofia': 'BG',
      'Europe/Athens': 'GR',
      'Europe/Dublin': 'IE',
      'Europe/Lisbon': 'PT',
      'Europe/Tallinn': 'EE',
      'Europe/Riga': 'LV',
      'Europe/Vilnius': 'LT',
      'Europe/Ljubljana': 'SI',
      'Europe/Bratislava': 'SK',
      'Europe/Zagreb': 'HR',
      'Europe/Luxembourg': 'LU',
      'Europe/Valletta': 'MT',
      'Atlantic/Reykjavik': 'IS',
      'Europe/Vaduz': 'LI',
      'Asia/Nicosia': 'CY',
      'Australia/Sydney': 'AU',
      'Asia/Tokyo': 'JP',
      'Asia/Seoul': 'KR',
      'Asia/Singapore': 'SG',
      'Asia/Kolkata': 'IN',
      'Asia/Shanghai': 'CN',
      'America/Sao_Paulo': 'BR',
      'America/Mexico_City': 'MX',
    };

    if (timeZone && tzCountryMap[timeZone]) {
      return tzCountryMap[timeZone];
    }

    // Fallback: extract from navigator.language (less reliable)
    const lang = navigator.language || navigator.languages?.[0];
    if (lang && lang.includes('-')) {
      const parts = lang.split('-');
      const regionPart = parts[parts.length - 1].toUpperCase();
      if (regionPart.length === 2) {
        return regionPart;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Utility Checks
// ---------------------------------------------------------------------------

/**
 * Check if we are in an incognito context.
 */
function isIncognitoContext(): boolean {
  try {
    return !!(chrome?.extension?.inIncognitoContext);
  } catch {
    return false;
  }
}

/**
 * Check if the given URL matches any excluded pattern.
 */
function isExcludedUrl(url: string): boolean {
  return PRIVACY_CONFIG.excludeUrlPatterns.some((pattern) => pattern.test(url));
}

// ---------------------------------------------------------------------------
// Privacy Audit Helper
// ---------------------------------------------------------------------------

/**
 * Generate a privacy audit report for the current configuration.
 * Useful for compliance reviews and debugging.
 */
export function generatePrivacyAuditReport(): Record<string, unknown> {
  return {
    configVersion: '1.0.0',
    maskSelectorsCount: PRIVACY_CONFIG.maskSelectors.length,
    blockSelectorsCount: PRIVACY_CONFIG.blockSelectors.length,
    excludeUrlPatternsCount: PRIVACY_CONFIG.excludeUrlPatterns.length,
    requireConsent: PRIVACY_CONFIG.requireConsent,
    disableInIncognito: PRIVACY_CONFIG.disableInIncognito,
    maxRecordingDurationMs: PRIVACY_CONFIG.maxRecordingDurationMs,
    maxEvents: PRIVACY_CONFIG.maxEvents,
    disabledRegionsCount: PRIVACY_CONFIG.disabledRegions.length,
    disabledRegions: PRIVACY_CONFIG.disabledRegions,
    safeguards: [
      'Never records on non-extension pages',
      'All input values masked — only length recorded',
      'Password fields block all recording on page',
      'No DOM snapshots captured',
      'Auto-disabled in incognito mode',
      'Explicit opt-in consent required',
      'Max 500 events per session',
      '30-minute recording cap',
      'URL query params and hash stripped',
      'GDPR: disabled in EU/EEA/UK/CA regions',
      'Fail-safe: any check failure blocks recording',
    ],
  };
}
```

---

# Section 6: Alerting & Dashboards for Focus Mode

## 6.1 Slack Notification System

`server/notifications/slack.ts`

The SlackNotifier delivers structured, actionable alerts to Slack channels using Block Kit formatting. Each alert type includes Focus Mode specific context to enable rapid triage.

```typescript
// server/notifications/slack.ts

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertType =
  | 'error_spike'
  | 'new_error'
  | 'critical_threshold'
  | 'focus_session_failures'
  | 'paywall_conversion_drop'
  | 'blocking_failures';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface AlertPayload {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface ErrorSpikePayload extends AlertPayload {
  type: 'error_spike';
  metadata: {
    currentRate: number;
    normalRate: number;
    spikeMultiplier: number;
    version: string;
    topErrorMessage: string;
    dashboardUrl: string;
    timeWindowMinutes: number;
  };
}

export interface NewErrorPayload extends AlertPayload {
  type: 'new_error';
  metadata: {
    errorMessage: string;
    stackTrace: string;
    fingerprint: string;
    version: string;
    firstSeenAt: number;
    affectedUsers: number;
    sentryUrl?: string;
  };
}

export interface CriticalThresholdPayload extends AlertPayload {
  type: 'critical_threshold';
  metadata: {
    errorCount: number;
    timeWindowMinutes: number;
    threshold: number;
    topErrors: Array<{ message: string; count: number }>;
    version: string;
    immediateActionRequired: boolean;
  };
}

export interface FocusSessionFailurePayload extends AlertPayload {
  type: 'focus_session_failures';
  metadata: {
    failureRate: number;
    normalRate: number;
    totalSessions: number;
    failedSessions: number;
    topFailureReasons: Array<{ reason: string; count: number }>;
    version: string;
    timeWindowMinutes: number;
  };
}

export interface PaywallConversionDropPayload extends AlertPayload {
  type: 'paywall_conversion_drop';
  metadata: {
    currentRate: number;
    normalRate: number;
    dropPercent: number;
    paywallViews: number;
    conversions: number;
    timeWindowHours: number;
  };
}

export interface BlockingFailurePayload extends AlertPayload {
  type: 'blocking_failures';
  metadata: {
    failureRate: number;
    totalAttempts: number;
    failedAttempts: number;
    topFailedDomains: Array<{ domain: string; count: number }>;
    dnrRuleErrors: number;
    version: string;
  };
}

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: Array<Record<string, unknown>>;
  fields?: Array<{ type: string; text: string }>;
  accessory?: Record<string, unknown>;
}

interface SlackMessage {
  channel: string;
  text: string;
  blocks: SlackBlock[];
  unfurl_links: boolean;
  unfurl_media: boolean;
}

interface SlackNotifierConfig {
  webhookUrl: string;
  channel: string;
  dashboardBaseUrl: string;
  sentryBaseUrl: string;
  environment: 'production' | 'staging' | 'development';
}

// ---------------------------------------------------------------------------
// Severity → Emoji mapping
// ---------------------------------------------------------------------------

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  critical: ':rotating_light:',
  high: ':warning:',
  medium: ':large_yellow_circle:',
  low: ':information_source:',
};

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#CA8A04',
  low: '#2563EB',
};

// ---------------------------------------------------------------------------
// SlackNotifier
// ---------------------------------------------------------------------------

export class SlackNotifier {
  private config: SlackNotifierConfig;

  constructor(config: SlackNotifierConfig) {
    this.config = config;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Send an alert to Slack. Routes to the appropriate formatter based
   * on alert type.
   */
  async sendAlert(payload: AlertPayload): Promise<boolean> {
    try {
      const message = this.formatMessage(payload);
      return await this.postToSlack(message);
    } catch (error) {
      console.error('[SlackNotifier] Failed to send alert:', error);
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Message Formatting
  // -----------------------------------------------------------------------

  private formatMessage(payload: AlertPayload): SlackMessage {
    switch (payload.type) {
      case 'error_spike':
        return this.formatErrorSpike(payload as ErrorSpikePayload);
      case 'new_error':
        return this.formatNewError(payload as NewErrorPayload);
      case 'critical_threshold':
        return this.formatCriticalThreshold(payload as CriticalThresholdPayload);
      case 'focus_session_failures':
        return this.formatFocusSessionFailures(payload as FocusSessionFailurePayload);
      case 'paywall_conversion_drop':
        return this.formatPaywallConversionDrop(payload as PaywallConversionDropPayload);
      case 'blocking_failures':
        return this.formatBlockingFailures(payload as BlockingFailurePayload);
      default:
        return this.formatGenericAlert(payload);
    }
  }

  // --- Error Spike ---

  private formatErrorSpike(payload: ErrorSpikePayload): SlackMessage {
    const { currentRate, normalRate, spikeMultiplier, version, topErrorMessage, dashboardUrl, timeWindowMinutes } = payload.metadata;

    return {
      channel: this.config.channel,
      text: `${SEVERITY_EMOJI[payload.severity]} Error Spike Detected — Focus Mode Blocker`,
      unfurl_links: false,
      unfurl_media: false,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${SEVERITY_EMOJI[payload.severity]} Error Spike Detected`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Focus Mode Blocker* — Error rate is *${spikeMultiplier.toFixed(1)}x* above normal`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Current Rate:*\n${currentRate.toFixed(1)} errors/min` },
            { type: 'mrkdwn', text: `*Normal Rate:*\n${normalRate.toFixed(1)} errors/min` },
            { type: 'mrkdwn', text: `*Version:*\n${version}` },
            { type: 'mrkdwn', text: `*Window:*\n${timeWindowMinutes} minutes` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Top Error:*\n\`\`\`${this.truncate(topErrorMessage, 200)}\`\`\``,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Dashboard', emoji: true },
              url: dashboardUrl || `${this.config.dashboardBaseUrl}/d/focus-mode-errors`,
              style: 'primary',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View in Sentry', emoji: true },
              url: `${this.config.sentryBaseUrl}/issues/?query=is%3Aunresolved`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `${this.config.environment} | ${new Date(payload.timestamp).toISOString()}`,
            },
          ],
        },
      ],
    };
  }

  // --- New Error ---

  private formatNewError(payload: NewErrorPayload): SlackMessage {
    const { errorMessage, stackTrace, fingerprint, version, affectedUsers, sentryUrl } = payload.metadata;

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${SEVERITY_EMOJI[payload.severity]} New Error Detected`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Focus Mode Blocker* — A new error type has been detected`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Fingerprint:*\n\`${fingerprint}\`` },
          { type: 'mrkdwn', text: `*Version:*\n${version}` },
          { type: 'mrkdwn', text: `*Affected Users:*\n${affectedUsers}` },
          { type: 'mrkdwn', text: `*First Seen:*\n<!date^${Math.floor(payload.metadata.firstSeenAt / 1000)}^{date_short_pretty} at {time}|${new Date(payload.metadata.firstSeenAt).toISOString()}>` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error:*\n\`\`\`${this.truncate(errorMessage, 300)}\`\`\``,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Stack Trace:*\n\`\`\`${this.truncate(stackTrace, 500)}\`\`\``,
        },
      },
    ];

    const actionButtons: Array<Record<string, unknown>> = [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'View Dashboard', emoji: true },
        url: `${this.config.dashboardBaseUrl}/d/focus-mode-errors`,
        style: 'primary',
      },
    ];

    if (sentryUrl) {
      actionButtons.push({
        type: 'button',
        text: { type: 'plain_text', text: 'View in Sentry', emoji: true },
        url: sentryUrl,
      });
    }

    blocks.push({ type: 'actions', elements: actionButtons });
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${this.config.environment} | ${new Date(payload.timestamp).toISOString()}`,
        },
      ],
    });

    return {
      channel: this.config.channel,
      text: `${SEVERITY_EMOJI[payload.severity]} New Error: ${this.truncate(errorMessage, 100)}`,
      unfurl_links: false,
      unfurl_media: false,
      blocks,
    };
  }

  // --- Critical Threshold ---

  private formatCriticalThreshold(payload: CriticalThresholdPayload): SlackMessage {
    const { errorCount, timeWindowMinutes, threshold, topErrors, version } = payload.metadata;

    const topErrorsList = topErrors
      .slice(0, 5)
      .map((e, i) => `${i + 1}. \`${this.truncate(e.message, 80)}\` (${e.count}x)`)
      .join('\n');

    return {
      channel: this.config.channel,
      text: `:rotating_light: CRITICAL — ${errorCount} errors in ${timeWindowMinutes}min — Focus Mode Blocker`,
      unfurl_links: false,
      unfurl_media: false,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: ':rotating_light: CRITICAL THRESHOLD BREACHED',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Focus Mode Blocker* — *${errorCount}* errors in *${timeWindowMinutes}* minutes (threshold: ${threshold})\n*Immediate action required!*`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Error Count:*\n${errorCount}` },
            { type: 'mrkdwn', text: `*Threshold:*\n${threshold}` },
            { type: 'mrkdwn', text: `*Version:*\n${version}` },
            { type: 'mrkdwn', text: `*Window:*\n${timeWindowMinutes} min` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Top Errors:*\n${topErrorsList}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Dashboard', emoji: true },
              url: `${this.config.dashboardBaseUrl}/d/focus-mode-errors`,
              style: 'danger',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View in Sentry', emoji: true },
              url: `${this.config.sentryBaseUrl}/issues/?query=is%3Aunresolved&sort=freq`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `${this.config.environment} | ${new Date(payload.timestamp).toISOString()}`,
            },
          ],
        },
      ],
    };
  }

  // --- Focus Session Failures ---

  private formatFocusSessionFailures(payload: FocusSessionFailurePayload): SlackMessage {
    const { failureRate, normalRate, totalSessions, failedSessions, topFailureReasons, version, timeWindowMinutes } = payload.metadata;

    const reasonsList = topFailureReasons
      .slice(0, 5)
      .map((r, i) => `${i + 1}. ${r.reason} (${r.count}x)`)
      .join('\n');

    return {
      channel: this.config.channel,
      text: `${SEVERITY_EMOJI[payload.severity]} Focus Session Failures — ${(failureRate * 100).toFixed(1)}% failure rate`,
      unfurl_links: false,
      unfurl_media: false,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${SEVERITY_EMOJI[payload.severity]} Elevated Focus Session Failures`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Focus Mode Blocker* — Session failure rate is *${(failureRate * 100).toFixed(1)}%* (normal: ${(normalRate * 100).toFixed(1)}%)`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Failed:*\n${failedSessions} / ${totalSessions}` },
            { type: 'mrkdwn', text: `*Failure Rate:*\n${(failureRate * 100).toFixed(1)}%` },
            { type: 'mrkdwn', text: `*Version:*\n${version}` },
            { type: 'mrkdwn', text: `*Window:*\n${timeWindowMinutes} min` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Top Failure Reasons:*\n${reasonsList}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Dashboard', emoji: true },
              url: `${this.config.dashboardBaseUrl}/d/focus-mode-sessions`,
              style: 'primary',
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `${this.config.environment} | ${new Date(payload.timestamp).toISOString()}`,
            },
          ],
        },
      ],
    };
  }

  // --- Paywall Conversion Drop ---

  private formatPaywallConversionDrop(payload: PaywallConversionDropPayload): SlackMessage {
    const { currentRate, normalRate, dropPercent, paywallViews, conversions, timeWindowHours } = payload.metadata;

    return {
      channel: this.config.channel,
      text: `${SEVERITY_EMOJI[payload.severity]} Paywall Conversion Drop — ${dropPercent.toFixed(1)}% below normal`,
      unfurl_links: false,
      unfurl_media: false,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${SEVERITY_EMOJI[payload.severity]} Paywall Conversion Drop`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Focus Mode Blocker* — Pro conversion rate dropped *${dropPercent.toFixed(1)}%* below baseline`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Current Rate:*\n${(currentRate * 100).toFixed(2)}%` },
            { type: 'mrkdwn', text: `*Normal Rate:*\n${(normalRate * 100).toFixed(2)}%` },
            { type: 'mrkdwn', text: `*Views:*\n${paywallViews}` },
            { type: 'mrkdwn', text: `*Conversions:*\n${conversions}` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_Potential causes: paywall UI error, pricing issue, broken checkout flow, A/B test regression_`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Dashboard', emoji: true },
              url: `${this.config.dashboardBaseUrl}/d/focus-mode-conversions`,
              style: 'primary',
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `${this.config.environment} | Last ${timeWindowHours}h | ${new Date(payload.timestamp).toISOString()}`,
            },
          ],
        },
      ],
    };
  }

  // --- Blocking Failures ---

  private formatBlockingFailures(payload: BlockingFailurePayload): SlackMessage {
    const { failureRate, totalAttempts, failedAttempts, topFailedDomains, dnrRuleErrors, version } = payload.metadata;

    const domainsList = topFailedDomains
      .slice(0, 5)
      .map((d, i) => `${i + 1}. \`${d.domain}\` (${d.count}x)`)
      .join('\n');

    return {
      channel: this.config.channel,
      text: `${SEVERITY_EMOJI[payload.severity]} Blocking Failures — ${(failureRate * 100).toFixed(1)}% of blocks failing`,
      unfurl_links: false,
      unfurl_media: false,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${SEVERITY_EMOJI[payload.severity]} Site Blocking Failures`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Focus Mode Blocker* — Blocked sites are not being blocked correctly. *${(failureRate * 100).toFixed(1)}%* failure rate.`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Failed:*\n${failedAttempts} / ${totalAttempts}` },
            { type: 'mrkdwn', text: `*DNR Errors:*\n${dnrRuleErrors}` },
            { type: 'mrkdwn', text: `*Version:*\n${version}` },
            { type: 'mrkdwn', text: `*Failure Rate:*\n${(failureRate * 100).toFixed(1)}%` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Top Failed Domains:*\n${domainsList}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Dashboard', emoji: true },
              url: `${this.config.dashboardBaseUrl}/d/focus-mode-blocking`,
              style: 'danger',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View in Sentry', emoji: true },
              url: `${this.config.sentryBaseUrl}/issues/?query=DNR+rule`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `${this.config.environment} | ${new Date(payload.timestamp).toISOString()}`,
            },
          ],
        },
      ],
    };
  }

  // --- Generic fallback ---

  private formatGenericAlert(payload: AlertPayload): SlackMessage {
    return {
      channel: this.config.channel,
      text: `${SEVERITY_EMOJI[payload.severity]} ${payload.title}`,
      unfurl_links: false,
      unfurl_media: false,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${SEVERITY_EMOJI[payload.severity]} ${payload.title}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: payload.message,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `${this.config.environment} | ${new Date(payload.timestamp).toISOString()}`,
            },
          ],
        },
      ],
    };
  }

  // -----------------------------------------------------------------------
  // HTTP Transport
  // -----------------------------------------------------------------------

  private async postToSlack(message: SlackMessage): Promise<boolean> {
    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(
        `[SlackNotifier] Slack API returned ${response.status}: ${await response.text()}`
      );
      return false;
    }

    return true;
  }

  // -----------------------------------------------------------------------
  // Utilities
  // -----------------------------------------------------------------------

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  }
}
```

---

## 6.2 Discord Notification System

`server/notifications/discord.ts`

The DiscordNotifier mirrors the Slack notification system but uses Discord embeds with color-coded severity indicators.

```typescript
// server/notifications/discord.ts

import type { AlertPayload, AlertSeverity, AlertType } from './slack';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
  timestamp?: string;
  url?: string;
}

interface DiscordMessage {
  content: string;
  embeds: DiscordEmbed[];
}

interface DiscordNotifierConfig {
  webhookUrl: string;
  dashboardBaseUrl: string;
  sentryBaseUrl: string;
  environment: 'production' | 'staging' | 'development';
  /** Optional role ID to mention on critical alerts */
  criticalMentionRoleId?: string;
}

// ---------------------------------------------------------------------------
// Severity → Color mapping (Discord uses decimal color codes)
// ---------------------------------------------------------------------------

const SEVERITY_COLOR_DECIMAL: Record<AlertSeverity, number> = {
  critical: 0xDC2626, // Red
  high: 0xEA580C,     // Orange
  medium: 0xCA8A04,   // Yellow
  low: 0x2563EB,      // Blue
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

// ---------------------------------------------------------------------------
// DiscordNotifier
// ---------------------------------------------------------------------------

export class DiscordNotifier {
  private config: DiscordNotifierConfig;

  constructor(config: DiscordNotifierConfig) {
    this.config = config;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  async sendAlert(payload: AlertPayload): Promise<boolean> {
    try {
      const message = this.formatMessage(payload);
      return await this.postToDiscord(message);
    } catch (error) {
      console.error('[DiscordNotifier] Failed to send alert:', error);
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Message Formatting
  // -----------------------------------------------------------------------

  private formatMessage(payload: AlertPayload): DiscordMessage {
    const embed = this.buildEmbed(payload);

    // Mention role on critical alerts
    let content = '';
    if (payload.severity === 'critical' && this.config.criticalMentionRoleId) {
      content = `<@&${this.config.criticalMentionRoleId}> `;
    }
    content += `**[${SEVERITY_LABEL[payload.severity]}]** ${payload.title}`;

    return {
      content,
      embeds: [embed],
    };
  }

  private buildEmbed(payload: AlertPayload): DiscordEmbed {
    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

    // Add type-specific fields
    switch (payload.type) {
      case 'error_spike':
        this.addErrorSpikeFields(fields, payload.metadata);
        break;
      case 'new_error':
        this.addNewErrorFields(fields, payload.metadata);
        break;
      case 'critical_threshold':
        this.addCriticalThresholdFields(fields, payload.metadata);
        break;
      case 'focus_session_failures':
        this.addFocusSessionFailureFields(fields, payload.metadata);
        break;
      case 'paywall_conversion_drop':
        this.addPaywallConversionDropFields(fields, payload.metadata);
        break;
      case 'blocking_failures':
        this.addBlockingFailureFields(fields, payload.metadata);
        break;
    }

    // Add common link fields
    fields.push({
      name: 'Links',
      value: [
        `[Dashboard](${this.config.dashboardBaseUrl}/d/focus-mode-errors)`,
        `[Sentry](${this.config.sentryBaseUrl}/issues/)`,
      ].join(' | '),
      inline: false,
    });

    return {
      title: `Focus Mode Blocker — ${payload.title}`,
      description: payload.message,
      color: SEVERITY_COLOR_DECIMAL[payload.severity],
      fields,
      footer: {
        text: `${this.config.environment} | Focus Mode Blocker`,
      },
      timestamp: new Date(payload.timestamp).toISOString(),
    };
  }

  // --- Type-specific field builders ---

  private addErrorSpikeFields(
    fields: Array<{ name: string; value: string; inline?: boolean }>,
    metadata: Record<string, unknown>
  ): void {
    const m = metadata as {
      currentRate: number; normalRate: number; spikeMultiplier: number;
      version: string; topErrorMessage: string; timeWindowMinutes: number;
    };
    fields.push(
      { name: 'Current Rate', value: `${m.currentRate.toFixed(1)} errors/min`, inline: true },
      { name: 'Normal Rate', value: `${m.normalRate.toFixed(1)} errors/min`, inline: true },
      { name: 'Spike', value: `${m.spikeMultiplier.toFixed(1)}x`, inline: true },
      { name: 'Version', value: m.version, inline: true },
      { name: 'Window', value: `${m.timeWindowMinutes} min`, inline: true },
      { name: 'Top Error', value: `\`\`\`${this.truncate(m.topErrorMessage, 200)}\`\`\``, inline: false }
    );
  }

  private addNewErrorFields(
    fields: Array<{ name: string; value: string; inline?: boolean }>,
    metadata: Record<string, unknown>
  ): void {
    const m = metadata as {
      errorMessage: string; stackTrace: string; fingerprint: string;
      version: string; affectedUsers: number;
    };
    fields.push(
      { name: 'Fingerprint', value: `\`${m.fingerprint}\``, inline: true },
      { name: 'Version', value: m.version, inline: true },
      { name: 'Affected Users', value: `${m.affectedUsers}`, inline: true },
      { name: 'Error', value: `\`\`\`${this.truncate(m.errorMessage, 300)}\`\`\``, inline: false },
      { name: 'Stack Trace', value: `\`\`\`${this.truncate(m.stackTrace, 500)}\`\`\``, inline: false }
    );
  }

  private addCriticalThresholdFields(
    fields: Array<{ name: string; value: string; inline?: boolean }>,
    metadata: Record<string, unknown>
  ): void {
    const m = metadata as {
      errorCount: number; timeWindowMinutes: number; threshold: number;
      topErrors: Array<{ message: string; count: number }>; version: string;
    };
    const topList = m.topErrors
      .slice(0, 5)
      .map((e, i) => `${i + 1}. \`${this.truncate(e.message, 60)}\` (${e.count}x)`)
      .join('\n');
    fields.push(
      { name: 'Error Count', value: `${m.errorCount}`, inline: true },
      { name: 'Threshold', value: `${m.threshold}`, inline: true },
      { name: 'Version', value: m.version, inline: true },
      { name: 'Top Errors', value: topList || 'None', inline: false }
    );
  }

  private addFocusSessionFailureFields(
    fields: Array<{ name: string; value: string; inline?: boolean }>,
    metadata: Record<string, unknown>
  ): void {
    const m = metadata as {
      failureRate: number; normalRate: number; totalSessions: number;
      failedSessions: number; topFailureReasons: Array<{ reason: string; count: number }>;
      version: string;
    };
    const reasonsList = m.topFailureReasons
      .slice(0, 5)
      .map((r, i) => `${i + 1}. ${r.reason} (${r.count}x)`)
      .join('\n');
    fields.push(
      { name: 'Failure Rate', value: `${(m.failureRate * 100).toFixed(1)}%`, inline: true },
      { name: 'Normal Rate', value: `${(m.normalRate * 100).toFixed(1)}%`, inline: true },
      { name: 'Sessions', value: `${m.failedSessions}/${m.totalSessions}`, inline: true },
      { name: 'Version', value: m.version, inline: true },
      { name: 'Top Reasons', value: reasonsList || 'None', inline: false }
    );
  }

  private addPaywallConversionDropFields(
    fields: Array<{ name: string; value: string; inline?: boolean }>,
    metadata: Record<string, unknown>
  ): void {
    const m = metadata as {
      currentRate: number; normalRate: number; dropPercent: number;
      paywallViews: number; conversions: number; timeWindowHours: number;
    };
    fields.push(
      { name: 'Current Rate', value: `${(m.currentRate * 100).toFixed(2)}%`, inline: true },
      { name: 'Normal Rate', value: `${(m.normalRate * 100).toFixed(2)}%`, inline: true },
      { name: 'Drop', value: `${m.dropPercent.toFixed(1)}%`, inline: true },
      { name: 'Views', value: `${m.paywallViews}`, inline: true },
      { name: 'Conversions', value: `${m.conversions}`, inline: true },
      { name: 'Window', value: `${m.timeWindowHours}h`, inline: true }
    );
  }

  private addBlockingFailureFields(
    fields: Array<{ name: string; value: string; inline?: boolean }>,
    metadata: Record<string, unknown>
  ): void {
    const m = metadata as {
      failureRate: number; totalAttempts: number; failedAttempts: number;
      topFailedDomains: Array<{ domain: string; count: number }>; dnrRuleErrors: number;
      version: string;
    };
    const domainsList = m.topFailedDomains
      .slice(0, 5)
      .map((d, i) => `${i + 1}. \`${d.domain}\` (${d.count}x)`)
      .join('\n');
    fields.push(
      { name: 'Failure Rate', value: `${(m.failureRate * 100).toFixed(1)}%`, inline: true },
      { name: 'Failed', value: `${m.failedAttempts}/${m.totalAttempts}`, inline: true },
      { name: 'DNR Errors', value: `${m.dnrRuleErrors}`, inline: true },
      { name: 'Version', value: m.version, inline: true },
      { name: 'Top Failed Domains', value: domainsList || 'None', inline: false }
    );
  }

  // -----------------------------------------------------------------------
  // HTTP Transport
  // -----------------------------------------------------------------------

  private async postToDiscord(message: DiscordMessage): Promise<boolean> {
    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(
        `[DiscordNotifier] Discord API returned ${response.status}: ${await response.text()}`
      );
      return false;
    }

    return true;
  }

  // -----------------------------------------------------------------------
  // Utilities
  // -----------------------------------------------------------------------

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  }
}
```

---

## 6.3 Error Rate Monitor

`server/monitoring/error-rate.ts`

The ErrorRateMonitor tracks error rates in sliding windows, detects spikes against a rolling baseline, and triggers alerts through the notification system. Includes Focus Mode specific monitors for blocking failures, session crashes, storage write failures, and license validation failures.

```typescript
// server/monitoring/error-rate.ts

import { SlackNotifier, AlertPayload, AlertSeverity } from '../notifications/slack';
import { DiscordNotifier } from '../notifications/discord';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorEvent {
  timestamp: number;
  message: string;
  fingerprint: string;
  version: string;
  category: ErrorCategory;
  userId?: string;
}

type ErrorCategory =
  | 'general'
  | 'blocking_failure'
  | 'session_crash'
  | 'storage_write'
  | 'license_validation'
  | 'dnr_rule'
  | 'popup_render'
  | 'options_render'
  | 'block_page_render'
  | 'onboarding_render';

interface RateWindow {
  /** Timestamps of errors in the current window */
  timestamps: number[];
  /** Window duration in ms */
  windowMs: number;
}

interface BaselineData {
  /** Hourly error counts for the last 24 hours */
  hourlyCounts: number[];
  /** Average errors per minute over the baseline period */
  avgPerMinute: number;
  /** Standard deviation of per-minute error rate */
  stdDevPerMinute: number;
  /** Last updated timestamp */
  lastUpdated: number;
}

interface AlertCooldown {
  /** Alert type key */
  key: string;
  /** Timestamp when the cooldown expires */
  expiresAt: number;
}

interface FocusSessionEvent {
  timestamp: number;
  sessionId: string;
  outcome: 'completed' | 'abandoned' | 'errored';
  errorMessage?: string;
  version: string;
}

interface BlockingAttemptEvent {
  timestamp: number;
  domain: string;
  success: boolean;
  errorType?: string;
  version: string;
}

interface ErrorRateMonitorConfig {
  /** Sliding window duration in ms (default: 5 minutes) */
  windowMs: number;
  /** Baseline period in ms (default: 24 hours) */
  baselinePeriodMs: number;
  /** Spike multiplier threshold (default: 3x) */
  spikeThreshold: number;
  /** Critical threshold: errors in window (default: 100) */
  criticalThreshold: number;
  /** Cooldown between same alert type in ms (default: 15 minutes) */
  alertCooldownMs: number;
  /** Focus session failure rate threshold (default: 0.15 = 15%) */
  sessionFailureThreshold: number;
  /** Blocking failure rate threshold (default: 0.05 = 5%) */
  blockingFailureThreshold: number;
  /** Storage write failure rate threshold (default: 0.02 = 2%) */
  storageFailureThreshold: number;
  /** License validation failure rate threshold (default: 0.10 = 10%) */
  licenseFailureThreshold: number;
}

const DEFAULT_CONFIG: ErrorRateMonitorConfig = {
  windowMs: 5 * 60 * 1000,            // 5 minutes
  baselinePeriodMs: 24 * 60 * 60 * 1000, // 24 hours
  spikeThreshold: 3,                    // 3x normal
  criticalThreshold: 100,               // 100 errors in window
  alertCooldownMs: 15 * 60 * 1000,     // 15 minutes
  sessionFailureThreshold: 0.15,        // 15%
  blockingFailureThreshold: 0.05,       // 5%
  storageFailureThreshold: 0.02,        // 2%
  licenseFailureThreshold: 0.10,        // 10%
};

// ---------------------------------------------------------------------------
// ErrorRateMonitor
// ---------------------------------------------------------------------------

export class ErrorRateMonitor {
  private config: ErrorRateMonitorConfig;
  private slackNotifier: SlackNotifier | null;
  private discordNotifier: DiscordNotifier | null;

  // Sliding windows
  private errorWindow: RateWindow;
  private blockingFailureWindow: RateWindow;
  private sessionWindow: { events: FocusSessionEvent[] };
  private storageFailureWindow: RateWindow;
  private licenseFailureWindow: RateWindow;

  // Baseline
  private baseline: BaselineData;

  // Known error fingerprints (for new error detection)
  private knownFingerprints: Set<string> = new Set();

  // Alert cooldowns
  private cooldowns: Map<string, AlertCooldown> = new Map();

  // Blocking attempt tracking
  private blockingAttempts: BlockingAttemptEvent[] = [];

  constructor(
    config: Partial<ErrorRateMonitorConfig> = {},
    slackNotifier: SlackNotifier | null = null,
    discordNotifier: DiscordNotifier | null = null
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.slackNotifier = slackNotifier;
    this.discordNotifier = discordNotifier;

    this.errorWindow = { timestamps: [], windowMs: this.config.windowMs };
    this.blockingFailureWindow = { timestamps: [], windowMs: this.config.windowMs };
    this.storageFailureWindow = { timestamps: [], windowMs: this.config.windowMs };
    this.licenseFailureWindow = { timestamps: [], windowMs: this.config.windowMs };
    this.sessionWindow = { events: [] };

    this.baseline = {
      hourlyCounts: new Array(24).fill(0),
      avgPerMinute: 0,
      stdDevPerMinute: 0,
      lastUpdated: Date.now(),
    };
  }

  // -----------------------------------------------------------------------
  // Event Ingestion
  // -----------------------------------------------------------------------

  /**
   * Record an error event. Performs spike detection, critical threshold
   * check, and new error type detection.
   */
  async recordError(event: ErrorEvent): Promise<void> {
    const now = Date.now();

    // Add to sliding window
    this.errorWindow.timestamps.push(now);
    this.pruneWindow(this.errorWindow, now);

    // Route to category-specific window
    switch (event.category) {
      case 'blocking_failure':
      case 'dnr_rule':
        this.blockingFailureWindow.timestamps.push(now);
        this.pruneWindow(this.blockingFailureWindow, now);
        break;
      case 'storage_write':
        this.storageFailureWindow.timestamps.push(now);
        this.pruneWindow(this.storageFailureWindow, now);
        break;
      case 'license_validation':
        this.licenseFailureWindow.timestamps.push(now);
        this.pruneWindow(this.licenseFailureWindow, now);
        break;
    }

    // Update baseline hourly count
    const hour = new Date(now).getUTCHours();
    this.baseline.hourlyCounts[hour]++;

    // --- Check: Critical threshold ---
    const windowCount = this.errorWindow.timestamps.length;
    if (windowCount >= this.config.criticalThreshold) {
      await this.triggerAlert({
        type: 'critical_threshold',
        severity: 'critical',
        title: 'Critical Error Threshold Breached',
        message: `${windowCount} errors in ${this.config.windowMs / 60000} minutes`,
        timestamp: now,
        metadata: {
          errorCount: windowCount,
          timeWindowMinutes: this.config.windowMs / 60000,
          threshold: this.config.criticalThreshold,
          topErrors: this.getTopErrors(5),
          version: event.version,
          immediateActionRequired: true,
        },
      });
    }

    // --- Check: Spike detection ---
    const currentRate = this.getCurrentRatePerMinute();
    if (this.baseline.avgPerMinute > 0) {
      const spikeMultiplier = currentRate / this.baseline.avgPerMinute;
      if (spikeMultiplier >= this.config.spikeThreshold) {
        await this.triggerAlert({
          type: 'error_spike',
          severity: spikeMultiplier >= 5 ? 'critical' : 'high',
          title: 'Error Spike Detected',
          message: `Error rate is ${spikeMultiplier.toFixed(1)}x above normal`,
          timestamp: now,
          metadata: {
            currentRate,
            normalRate: this.baseline.avgPerMinute,
            spikeMultiplier,
            version: event.version,
            topErrorMessage: event.message,
            dashboardUrl: '',
            timeWindowMinutes: this.config.windowMs / 60000,
          },
        });
      }
    }

    // --- Check: New error type ---
    if (!this.knownFingerprints.has(event.fingerprint)) {
      this.knownFingerprints.add(event.fingerprint);
      await this.triggerAlert({
        type: 'new_error',
        severity: 'medium',
        title: 'New Error Type Detected',
        message: `First occurrence of error: ${event.message}`,
        timestamp: now,
        metadata: {
          errorMessage: event.message,
          stackTrace: '', // Caller should provide via extended event
          fingerprint: event.fingerprint,
          version: event.version,
          firstSeenAt: now,
          affectedUsers: 1,
        },
      });
    }

    // --- Check: Category-specific thresholds ---
    await this.checkBlockingFailureRate(event.version, now);
    await this.checkStorageFailureRate(event.version, now);
    await this.checkLicenseFailureRate(event.version, now);
  }

  /**
   * Record a focus session outcome for session failure rate monitoring.
   */
  async recordSessionOutcome(event: FocusSessionEvent): Promise<void> {
    const now = Date.now();
    this.sessionWindow.events.push(event);

    // Prune session events older than the monitoring window
    this.sessionWindow.events = this.sessionWindow.events.filter(
      (e) => now - e.timestamp <= this.config.windowMs
    );

    await this.checkSessionFailureRate(event.version, now);
  }

  /**
   * Record a blocking attempt (success or failure) for DNR rule monitoring.
   */
  async recordBlockingAttempt(event: BlockingAttemptEvent): Promise<void> {
    const now = Date.now();
    this.blockingAttempts.push(event);

    // Prune old attempts
    this.blockingAttempts = this.blockingAttempts.filter(
      (e) => now - e.timestamp <= this.config.windowMs
    );

    if (!event.success) {
      this.blockingFailureWindow.timestamps.push(now);
      this.pruneWindow(this.blockingFailureWindow, now);
    }
  }

  // -----------------------------------------------------------------------
  // Threshold Checks (Focus Mode Specific)
  // -----------------------------------------------------------------------

  /**
   * Check if the blocking failure rate exceeds the threshold.
   * Blocking failures = DNR rule errors, sites not being blocked.
   */
  private async checkBlockingFailureRate(version: string, now: number): Promise<void> {
    if (this.blockingAttempts.length < 10) return; // Not enough data

    const failed = this.blockingAttempts.filter((e) => !e.success);
    const rate = failed.length / this.blockingAttempts.length;

    if (rate >= this.config.blockingFailureThreshold) {
      const domainCounts = new Map<string, number>();
      failed.forEach((e) => {
        domainCounts.set(e.domain, (domainCounts.get(e.domain) || 0) + 1);
      });

      const topDomains = Array.from(domainCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([domain, count]) => ({ domain, count }));

      await this.triggerAlert({
        type: 'blocking_failures',
        severity: rate >= 0.20 ? 'critical' : 'high',
        title: 'Site Blocking Failures',
        message: `${(rate * 100).toFixed(1)}% of blocking attempts are failing`,
        timestamp: now,
        metadata: {
          failureRate: rate,
          totalAttempts: this.blockingAttempts.length,
          failedAttempts: failed.length,
          topFailedDomains: topDomains,
          dnrRuleErrors: this.blockingFailureWindow.timestamps.length,
          version,
        },
      });
    }
  }

  /**
   * Check if the focus session failure rate is elevated.
   * Session failures = sessions that error or are abandoned unexpectedly.
   */
  private async checkSessionFailureRate(version: string, now: number): Promise<void> {
    const events = this.sessionWindow.events;
    if (events.length < 5) return; // Not enough data

    const failed = events.filter((e) => e.outcome === 'errored');
    const rate = failed.length / events.length;

    if (rate >= this.config.sessionFailureThreshold) {
      const reasonCounts = new Map<string, number>();
      failed.forEach((e) => {
        const reason = e.errorMessage || 'unknown';
        reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
      });

      const topReasons = Array.from(reasonCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count }));

      await this.triggerAlert({
        type: 'focus_session_failures',
        severity: rate >= 0.30 ? 'critical' : 'high',
        title: 'Focus Session Failures Elevated',
        message: `${(rate * 100).toFixed(1)}% of focus sessions are failing`,
        timestamp: now,
        metadata: {
          failureRate: rate,
          normalRate: 0.05, // 5% baseline
          totalSessions: events.length,
          failedSessions: failed.length,
          topFailureReasons: topReasons,
          version,
          timeWindowMinutes: this.config.windowMs / 60000,
        },
      });
    }
  }

  /**
   * Check storage write failure rate. Storage failures prevent saving
   * blocklists, settings, focus session data, and Focus Scores.
   */
  private async checkStorageFailureRate(version: string, now: number): Promise<void> {
    this.pruneWindow(this.storageFailureWindow, now);
    const failureCount = this.storageFailureWindow.timestamps.length;
    const totalErrors = this.errorWindow.timestamps.length;

    if (totalErrors < 5) return;

    const rate = failureCount / Math.max(totalErrors, 1);
    if (rate >= this.config.storageFailureThreshold && failureCount >= 3) {
      await this.triggerAlert({
        type: 'critical_threshold',
        severity: 'high',
        title: 'Storage Write Failures',
        message: `${failureCount} storage write failures detected — user data at risk`,
        timestamp: now,
        metadata: {
          errorCount: failureCount,
          timeWindowMinutes: this.config.windowMs / 60000,
          threshold: 3,
          topErrors: [{ message: 'chrome.storage.local.set failed', count: failureCount }],
          version,
          immediateActionRequired: true,
        },
      });
    }
  }

  /**
   * Check license validation failure rate. Elevated failures may indicate
   * an issue with the license server or API.
   */
  private async checkLicenseFailureRate(version: string, now: number): Promise<void> {
    this.pruneWindow(this.licenseFailureWindow, now);
    const failureCount = this.licenseFailureWindow.timestamps.length;

    if (failureCount < 3) return;

    // Calculate rate against total errors (rough proxy)
    const totalErrors = this.errorWindow.timestamps.length;
    const rate = failureCount / Math.max(totalErrors, 1);

    if (rate >= this.config.licenseFailureThreshold) {
      await this.triggerAlert({
        type: 'critical_threshold',
        severity: 'high',
        title: 'License Validation Failures',
        message: `${failureCount} license validation failures — Pro users may be impacted`,
        timestamp: now,
        metadata: {
          errorCount: failureCount,
          timeWindowMinutes: this.config.windowMs / 60000,
          threshold: 3,
          topErrors: [{ message: 'License validation API failed', count: failureCount }],
          version,
          immediateActionRequired: false,
        },
      });
    }
  }

  // -----------------------------------------------------------------------
  // Baseline Management
  // -----------------------------------------------------------------------

  /**
   * Recalculate the 24-hour rolling baseline. Should be called periodically
   * (e.g., every hour) by a scheduled job.
   */
  recalculateBaseline(): void {
    const counts = this.baseline.hourlyCounts;
    const totalErrors = counts.reduce((sum, c) => sum + c, 0);
    const totalMinutes = 24 * 60;

    this.baseline.avgPerMinute = totalErrors / totalMinutes;

    // Standard deviation of per-hour rates converted to per-minute
    const avgPerHour = totalErrors / 24;
    const variance =
      counts.reduce((sum, c) => sum + Math.pow(c - avgPerHour, 2), 0) / 24;
    this.baseline.stdDevPerMinute = Math.sqrt(variance) / 60;
    this.baseline.lastUpdated = Date.now();
  }

  /**
   * Reset the baseline (e.g., after a new version deploy).
   */
  resetBaseline(): void {
    this.baseline = {
      hourlyCounts: new Array(24).fill(0),
      avgPerMinute: 0,
      stdDevPerMinute: 0,
      lastUpdated: Date.now(),
    };
    this.knownFingerprints.clear();
  }

  // -----------------------------------------------------------------------
  // Alert Dispatch with Cooldown
  // -----------------------------------------------------------------------

  private async triggerAlert(payload: AlertPayload): Promise<void> {
    const cooldownKey = `${payload.type}_${payload.severity}`;
    const now = Date.now();

    // Check cooldown
    const existing = this.cooldowns.get(cooldownKey);
    if (existing && existing.expiresAt > now) {
      return; // Still in cooldown
    }

    // Set cooldown
    this.cooldowns.set(cooldownKey, {
      key: cooldownKey,
      expiresAt: now + this.config.alertCooldownMs,
    });

    // Send to all configured notifiers in parallel
    const promises: Promise<boolean>[] = [];
    if (this.slackNotifier) {
      promises.push(this.slackNotifier.sendAlert(payload));
    }
    if (this.discordNotifier) {
      promises.push(this.discordNotifier.sendAlert(payload));
    }

    await Promise.allSettled(promises);
  }

  // -----------------------------------------------------------------------
  // Window Management
  // -----------------------------------------------------------------------

  private pruneWindow(window: RateWindow, now: number): void {
    const cutoff = now - window.windowMs;
    window.timestamps = window.timestamps.filter((t) => t > cutoff);
  }

  private getCurrentRatePerMinute(): number {
    const windowMinutes = this.config.windowMs / 60000;
    return this.errorWindow.timestamps.length / windowMinutes;
  }

  // -----------------------------------------------------------------------
  // Reporting Helpers
  // -----------------------------------------------------------------------

  private errorMessages: Map<string, { message: string; count: number }> = new Map();

  /**
   * Track error messages for "top errors" reporting. Called externally
   * alongside recordError.
   */
  trackErrorMessage(fingerprint: string, message: string): void {
    const existing = this.errorMessages.get(fingerprint);
    if (existing) {
      existing.count++;
    } else {
      this.errorMessages.set(fingerprint, { message, count: 1 });
    }
  }

  private getTopErrors(limit: number): Array<{ message: string; count: number }> {
    return Array.from(this.errorMessages.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // -----------------------------------------------------------------------
  // Diagnostics
  // -----------------------------------------------------------------------

  /**
   * Get current monitor state for debugging / health checks.
   */
  getStatus(): Record<string, unknown> {
    const now = Date.now();
    this.pruneWindow(this.errorWindow, now);

    return {
      currentWindowErrors: this.errorWindow.timestamps.length,
      currentRatePerMinute: this.getCurrentRatePerMinute(),
      baselineAvgPerMinute: this.baseline.avgPerMinute,
      baselineLastUpdated: this.baseline.lastUpdated,
      knownFingerprints: this.knownFingerprints.size,
      activeCooldowns: Array.from(this.cooldowns.entries())
        .filter(([, v]) => v.expiresAt > now)
        .map(([k, v]) => ({ key: k, expiresIn: v.expiresAt - now })),
      blockingFailures: this.blockingFailureWindow.timestamps.length,
      sessionEvents: this.sessionWindow.events.length,
      storageFailures: this.storageFailureWindow.timestamps.length,
      licenseFailures: this.licenseFailureWindow.timestamps.length,
    };
  }
}
```

---

## 6.4 Grafana Dashboard Configuration

Complete Grafana dashboard JSON for Focus Mode Blocker monitoring. This dashboard provides 10 panels covering error rates, version distribution, session health, Focus Score metrics, paywall conversion, blocking effectiveness, and memory usage.

```json
{
  "dashboard": {
    "id": null,
    "uid": "focus-mode-blocker-monitoring",
    "title": "Focus Mode Blocker — Monitoring Dashboard",
    "description": "Crash analytics and health monitoring for Focus Mode Blocker Chrome Extension",
    "tags": ["focus-mode", "chrome-extension", "monitoring"],
    "timezone": "browser",
    "refresh": "30s",
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "templating": {
      "list": [
        {
          "name": "version",
          "type": "query",
          "datasource": "Prometheus",
          "query": "label_values(fm_errors_total, version)",
          "refresh": 2,
          "multi": true,
          "includeAll": true,
          "current": { "text": "All", "value": "$__all" }
        },
        {
          "name": "environment",
          "type": "custom",
          "options": [
            { "text": "production", "value": "production" },
            { "text": "staging", "value": "staging" }
          ],
          "current": { "text": "production", "value": "production" }
        }
      ]
    },
    "panels": [
      {
        "id": 1,
        "title": "Error Rate",
        "description": "Errors per minute over time, bucketed in 1-minute intervals",
        "type": "timeseries",
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(rate(fm_errors_total{environment=\"$environment\", version=~\"$version\"}[1m])) * 60",
            "legendFormat": "Errors/min",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": { "mode": "palette-classic" },
            "custom": {
              "drawStyle": "line",
              "lineInterpolation": "smooth",
              "fillOpacity": 15,
              "pointSize": 5,
              "lineWidth": 2
            },
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 10 },
                { "color": "red", "value": 50 }
              ]
            },
            "unit": "errors/min"
          }
        },
        "options": {
          "legend": { "displayMode": "list", "placement": "bottom" },
          "tooltip": { "mode": "single" }
        }
      },
      {
        "id": 2,
        "title": "Errors by Version",
        "description": "Distribution of errors across extension versions",
        "type": "piechart",
        "gridPos": { "h": 8, "w": 6, "x": 12, "y": 0 },
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum by (version) (increase(fm_errors_total{environment=\"$environment\"}[$__range]))",
            "legendFormat": "v{{version}}",
            "refId": "A"
          }
        ],
        "options": {
          "legend": { "displayMode": "list", "placement": "right" },
          "pieType": "donut",
          "tooltip": { "mode": "single" }
        }
      },
      {
        "id": 3,
        "title": "Top Errors",
        "description": "Most frequent errors by fingerprint, message, count, last_seen, and version",
        "type": "table",
        "gridPos": { "h": 8, "w": 6, "x": 18, "y": 0 },
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "topk(20, sum by (fingerprint, message, version) (increase(fm_errors_total{environment=\"$environment\"}[$__range])))",
            "format": "table",
            "instant": true,
            "refId": "A"
          }
        ],
        "transformations": [
          {
            "id": "organize",
            "options": {
              "renameByName": {
                "fingerprint": "Fingerprint",
                "message": "Error Message",
                "version": "Version",
                "Value": "Count"
              },
              "indexByName": {
                "Fingerprint": 0,
                "Error Message": 1,
                "Count": 2,
                "Version": 3
              }
            }
          }
        ],
        "fieldConfig": {
          "overrides": [
            {
              "matcher": { "id": "byName", "options": "Count" },
              "properties": [
                { "id": "custom.width", "value": 80 }
              ]
            }
          ]
        },
        "options": {
          "showHeader": true,
          "sortBy": [{ "displayName": "Count", "desc": true }]
        }
      },
      {
        "id": 4,
        "title": "Active Users (24h)",
        "description": "Unique active users in the last 24 hours",
        "type": "stat",
        "gridPos": { "h": 4, "w": 6, "x": 0, "y": 8 },
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "count(count by (user_id) (fm_events_total{environment=\"$environment\"}[24h]))",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": { "mode": "thresholds" },
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "color": "blue", "value": null }
              ]
            },
            "unit": "users"
          }
        },
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "textMode": "auto"
        }
      },
      {
        "id": 5,
        "title": "Error-Free Sessions",
        "description": "Percentage of focus sessions that completed without errors",
        "type": "gauge",
        "gridPos": { "h": 4, "w": 6, "x": 6, "y": 8 },
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "(sum(fm_sessions_total{environment=\"$environment\", outcome=\"completed\", version=~\"$version\"}) / sum(fm_sessions_total{environment=\"$environment\", version=~\"$version\"})) * 100",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "min": 0,
            "max": 100,
            "unit": "percent",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "color": "red", "value": null },
                { "color": "yellow", "value": 85 },
                { "color": "green", "value": 95 }
              ]
            }
          }
        },
        "options": {
          "showThresholdLabels": true,
          "showThresholdMarkers": true
        }
      },
      {
        "id": 6,
        "title": "Focus Session Completion Rate",
        "description": "Percentage of started focus sessions that reach completion (not abandoned or errored)",
        "type": "gauge",
        "gridPos": { "h": 4, "w": 6, "x": 12, "y": 8 },
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "(sum(fm_sessions_total{environment=\"$environment\", outcome=\"completed\", version=~\"$version\"}) / sum(fm_sessions_total{environment=\"$environment\", version=~\"$version\"})) * 100",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "min": 0,
            "max": 100,
            "unit": "percent",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "color": "red", "value": null },
                { "color": "orange", "value": 60 },
                { "color": "yellow", "value": 75 },
                { "color": "green", "value": 85 }
              ]
            }
          }
        },
        "options": {
          "showThresholdLabels": true,
          "showThresholdMarkers": true
        }
      },
      {
        "id": 7,
        "title": "Average Focus Score",
        "description": "Mean Focus Score across all active users (0-100 scale)",
        "type": "stat",
        "gridPos": { "h": 4, "w": 6, "x": 18, "y": 8 },
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "avg(fm_focus_score{environment=\"$environment\", version=~\"$version\"})",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": { "mode": "thresholds" },
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "color": "red", "value": null },
                { "color": "orange", "value": 30 },
                { "color": "yellow", "value": 50 },
                { "color": "green", "value": 70 }
              ]
            },
            "unit": "none",
            "min": 0,
            "max": 100
          }
        },
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "textMode": "value_and_name"
        }
      },
      {
        "id": 8,
        "title": "Paywall Conversion Rate",
        "description": "Rate of users who view the paywall and convert to Pro",
        "type": "stat",
        "gridPos": { "h": 4, "w": 8, "x": 0, "y": 12 },
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "(sum(rate(fm_paywall_conversions_total{environment=\"$environment\"}[1h])) / sum(rate(fm_paywall_views_total{environment=\"$environment\"}[1h]))) * 100",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": { "mode": "thresholds" },
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "color": "red", "value": null },
                { "color": "yellow", "value": 2 },
                { "color": "green", "value": 5 }
              ]
            },
            "unit": "percent",
            "decimals": 2
          }
        },
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "textMode": "value_and_name"
        }
      },
      {
        "id": 9,
        "title": "Blocking Effectiveness",
        "description": "Success rate of site blocking attempts over time using DNR rules",
        "type": "timeseries",
        "gridPos": { "h": 8, "w": 8, "x": 8, "y": 12 },
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "(sum(rate(fm_blocking_success_total{environment=\"$environment\", version=~\"$version\"}[5m])) / sum(rate(fm_blocking_attempts_total{environment=\"$environment\", version=~\"$version\"}[5m]))) * 100",
            "legendFormat": "Success Rate %",
            "refId": "A"
          },
          {
            "expr": "sum(rate(fm_blocking_failures_total{environment=\"$environment\", version=~\"$version\"}[5m])) * 60",
            "legendFormat": "Failures/min",
            "refId": "B"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": { "mode": "palette-classic" },
            "custom": {
              "drawStyle": "line",
              "lineInterpolation": "smooth",
              "fillOpacity": 10,
              "lineWidth": 2
            }
          },
          "overrides": [
            {
              "matcher": { "id": "byName", "options": "Success Rate %" },
              "properties": [
                { "id": "unit", "value": "percent" },
                { "id": "custom.axisPlacement", "value": "left" },
                { "id": "color", "value": { "fixedColor": "green", "mode": "fixed" } }
              ]
            },
            {
              "matcher": { "id": "byName", "options": "Failures/min" },
              "properties": [
                { "id": "unit", "value": "errors/min" },
                { "id": "custom.axisPlacement", "value": "right" },
                { "id": "color", "value": { "fixedColor": "red", "mode": "fixed" } }
              ]
            }
          ]
        },
        "options": {
          "legend": { "displayMode": "list", "placement": "bottom" },
          "tooltip": { "mode": "multi" }
        }
      },
      {
        "id": 10,
        "title": "Memory Usage Trend",
        "description": "Service worker and popup memory usage over time (MB)",
        "type": "timeseries",
        "gridPos": { "h": 8, "w": 8, "x": 16, "y": 12 },
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "avg(fm_memory_usage_bytes{environment=\"$environment\", context=\"service_worker\", version=~\"$version\"}) / 1024 / 1024",
            "legendFormat": "Service Worker (MB)",
            "refId": "A"
          },
          {
            "expr": "avg(fm_memory_usage_bytes{environment=\"$environment\", context=\"popup\", version=~\"$version\"}) / 1024 / 1024",
            "legendFormat": "Popup (MB)",
            "refId": "B"
          },
          {
            "expr": "avg(fm_memory_usage_bytes{environment=\"$environment\", context=\"block_page\", version=~\"$version\"}) / 1024 / 1024",
            "legendFormat": "Block Page (MB)",
            "refId": "C"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "decmbytes",
            "color": { "mode": "palette-classic" },
            "custom": {
              "drawStyle": "line",
              "lineInterpolation": "smooth",
              "fillOpacity": 10,
              "lineWidth": 2,
              "gradientMode": "scheme"
            },
            "thresholds": {
              "mode": "absolute",
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 50 },
                { "color": "red", "value": 100 }
              ]
            }
          }
        },
        "options": {
          "legend": { "displayMode": "list", "placement": "bottom" },
          "tooltip": { "mode": "multi" }
        }
      }
    ],
    "annotations": {
      "list": [
        {
          "name": "Deployments",
          "datasource": "Prometheus",
          "enable": true,
          "expr": "changes(fm_deployment_info{environment=\"$environment\"}[1m]) > 0",
          "iconColor": "purple",
          "titleFormat": "Deploy: v{{version}}",
          "textFormat": "Deployed version {{version}}"
        }
      ]
    }
  }
}
```

---

## 6.5 PagerDuty Integration (Optional)

`server/notifications/pagerduty.ts`

For critical alerts that require immediate on-call response. Triggers PagerDuty incidents for critical threshold breaches and blocking failures.

```typescript
// server/notifications/pagerduty.ts

import type { AlertPayload, AlertSeverity } from './slack';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PagerDutyEvent {
  routing_key: string;
  event_action: 'trigger' | 'acknowledge' | 'resolve';
  dedup_key: string;
  payload: {
    summary: string;
    source: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    component: string;
    group: string;
    class: string;
    timestamp: string;
    custom_details: Record<string, unknown>;
  };
  links?: Array<{ href: string; text: string }>;
  images?: Array<{ src: string; href: string; alt: string }>;
}

interface PagerDutyConfig {
  /** PagerDuty Events API v2 routing key (integration key) */
  routingKey: string;
  /** Base URL for the monitoring dashboard */
  dashboardBaseUrl: string;
  /** Base URL for Sentry */
  sentryBaseUrl: string;
  /** Environment label */
  environment: 'production' | 'staging' | 'development';
  /** Only trigger PagerDuty for these severity levels */
  triggerSeverities: AlertSeverity[];
}

// ---------------------------------------------------------------------------
// Severity mapping
// ---------------------------------------------------------------------------

const SEVERITY_MAP: Record<AlertSeverity, PagerDutyEvent['payload']['severity']> = {
  critical: 'critical',
  high: 'error',
  medium: 'warning',
  low: 'info',
};

// ---------------------------------------------------------------------------
// PagerDutyNotifier
// ---------------------------------------------------------------------------

export class PagerDutyNotifier {
  private config: PagerDutyConfig;
  private static readonly EVENTS_API_URL = 'https://events.pagerduty.com/v2/enqueue';

  constructor(config: PagerDutyConfig) {
    this.config = config;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Send an alert to PagerDuty. Only triggers for configured severity
   * levels (typically only 'critical').
   */
  async sendAlert(payload: AlertPayload): Promise<boolean> {
    // Gate: only trigger for configured severities
    if (!this.config.triggerSeverities.includes(payload.severity)) {
      return false;
    }

    try {
      const event = this.buildEvent(payload);
      return await this.postToPagerDuty(event);
    } catch (error) {
      console.error('[PagerDutyNotifier] Failed to send alert:', error);
      return false;
    }
  }

  /**
   * Resolve a previously triggered incident.
   */
  async resolveAlert(dedupKey: string): Promise<boolean> {
    try {
      const event: PagerDutyEvent = {
        routing_key: this.config.routingKey,
        event_action: 'resolve',
        dedup_key: dedupKey,
        payload: {
          summary: 'Resolved',
          source: 'focus-mode-blocker',
          severity: 'info',
          component: 'chrome-extension',
          group: 'focus-mode',
          class: 'resolved',
          timestamp: new Date().toISOString(),
          custom_details: {},
        },
      };

      return await this.postToPagerDuty(event);
    } catch (error) {
      console.error('[PagerDutyNotifier] Failed to resolve alert:', error);
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Event Building
  // -----------------------------------------------------------------------

  private buildEvent(payload: AlertPayload): PagerDutyEvent {
    const dedupKey = `fm-blocker-${payload.type}-${this.config.environment}`;

    const links: Array<{ href: string; text: string }> = [
      {
        href: `${this.config.dashboardBaseUrl}/d/focus-mode-blocker-monitoring`,
        text: 'Grafana Dashboard',
      },
      {
        href: `${this.config.sentryBaseUrl}/issues/?query=is%3Aunresolved`,
        text: 'Sentry Issues',
      },
    ];

    return {
      routing_key: this.config.routingKey,
      event_action: 'trigger',
      dedup_key: dedupKey,
      payload: {
        summary: `[Focus Mode Blocker] ${payload.title} — ${payload.message}`,
        source: `focus-mode-blocker-${this.config.environment}`,
        severity: SEVERITY_MAP[payload.severity],
        component: 'chrome-extension',
        group: 'focus-mode-blocker',
        class: payload.type,
        timestamp: new Date(payload.timestamp).toISOString(),
        custom_details: {
          alert_type: payload.type,
          environment: this.config.environment,
          ...payload.metadata,
        },
      },
      links,
    };
  }

  // -----------------------------------------------------------------------
  // HTTP Transport
  // -----------------------------------------------------------------------

  private async postToPagerDuty(event: PagerDutyEvent): Promise<boolean> {
    const response = await fetch(PagerDutyNotifier.EVENTS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `[PagerDutyNotifier] PagerDuty API returned ${response.status}: ${body}`
      );
      return false;
    }

    const result = await response.json();
    console.log(`[PagerDutyNotifier] Incident created: ${result.dedup_key}`);
    return true;
  }

  // -----------------------------------------------------------------------
  // Dedup Key Generator
  // -----------------------------------------------------------------------

  /**
   * Generate a dedup key for a given alert type. Use this to resolve
   * incidents after the issue is fixed.
   */
  getDedupKey(alertType: string): string {
    return `fm-blocker-${alertType}-${this.config.environment}`;
  }
}
```
