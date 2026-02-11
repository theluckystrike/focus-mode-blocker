# Section 4: declarativeNetRequest Blocking Engine

## 4.1 DNR vs webRequest: Why Focus Mode Uses DNR

### The MV3 Mandate

Manifest V3 removed the blocking variant of `webRequest.onBeforeRequest`. In MV2, extensions could intercept every network request, inspect it, and return `{ cancel: true }` to block it. That API is **gone** in MV3 for regular extensions. The replacement is `declarativeNetRequest` (DNR), a declarative, rule-based API where the browser itself evaluates rules before network requests are made.

Focus Mode - Blocker is built entirely on DNR. There is no webRequest usage anywhere in the codebase.

### DNR Advantages for Focus Mode

| Advantage | Impact on Focus Mode |
|-----------|---------------------|
| **Pre-network evaluation** | Rules fire before DNS resolution -- blocked sites never establish a connection, saving bandwidth and battery |
| **No persistent background** | Rules persist even when the service worker is inactive; blocking never stops |
| **Lower permissions** | `declarativeNetRequest` permission is less scary than `webRequest` + `<all_urls>` in the install prompt |
| **Battery efficient** | No JavaScript runs per-request; the browser's native C++ engine handles matching |
| **Tamper resistant** | Rules survive service worker termination, which is critical for Nuclear Mode |

### DNR Limitations and How Focus Mode Works Within Them

| Limitation | Focus Mode Mitigation |
|------------|----------------------|
| **30,000 dynamic rule limit** | Rule ID allocation strategy with monitoring; warn at 25,000 |
| **No dynamic content inspection** | Not needed -- Focus Mode blocks entire domains, not individual page elements |
| **Less flexible redirect** | Redirect to bundled `blocked.html` with query params for context |
| **No request body access** | Irrelevant for domain-level blocking |
| **Rule update is async** | Batch updates with queue system; UI shows pending state |
| **Static rulesets are immutable** | Pre-built category lists are static; user customizations use dynamic rules |

---

## 4.2 Rule Architecture

### File: `src/background/rule-engine.ts`

The `RuleEngine` is the central coordinator for all DNR rule operations. It manages three distinct rule types with separate budgets, priorities, and lifecycles.

### Rule Type Overview

```
Static Rules (manifest-declared, up to 5,000 per ruleset)
  -- Pre-built category blocklists
  -- Enabled/disabled by user preference
  -- Cannot be modified at runtime, only toggled

Dynamic Rules (up to 30,000, persist across sessions)
  -- User's custom blocklist entries
  -- Schedule-activated rules
  -- Nuclear Mode "block everything" rule + whitelist exceptions
  -- Persist across browser restarts and extension updates

Session Rules (up to 5,000, cleared on browser restart)
  -- Quick Focus temporary blocks
  -- Nuclear Mode redundant copies (tamper-resistance layer)
  -- Override rules for testing
```

### Rule ID Allocation Strategy

Each rule category gets a dedicated ID range to prevent collisions and enable efficient batch operations:

```typescript
// src/background/rule-engine.ts

/**
 * Rule ID ranges for each category of blocking rule.
 * Ranges are non-overlapping to prevent collisions across
 * different rule sources (user blocklist, schedules, nuclear, etc.).
 *
 * Total dynamic budget: 30,000 rules
 * Total session budget: 5,000 rules
 */
export const RULE_ID_RANGES = {
  /** User's custom blocklist: IDs 1 -- 9,999 (up to 9,999 rules) */
  CUSTOM_BLOCKLIST: { start: 1, end: 9_999 },

  /** Schedule-activated rules: IDs 10,000 -- 19,999 */
  SCHEDULE: { start: 10_000, end: 19_999 },

  /** Nuclear mode block-all + whitelist: IDs 20,000 -- 24,999 */
  NUCLEAR: { start: 20_000, end: 24_999 },

  /** Wildcard/pattern rules (Pro): IDs 25,000 -- 27,999 */
  WILDCARD: { start: 25_000, end: 27_999 },

  /** Path-based rules (Pro): IDs 28,000 -- 29,999 */
  PATH_BASED: { start: 28_000, end: 29_999 },

  /** Session-only temporary rules: IDs 1 -- 4,999 (session namespace) */
  SESSION_TEMP: { start: 1, end: 4_999 },
} as const;

export type RuleCategory = keyof typeof RULE_ID_RANGES;
```

### Rule Priority System

DNR evaluates rules by priority (higher number wins). Focus Mode uses a strict priority hierarchy:

```typescript
/**
 * Rule priorities -- higher number takes precedence.
 * Nuclear mode overrides everything; pre-built categories are lowest.
 *
 * Example: If a schedule rule blocks reddit.com (priority 3) but
 * Nuclear mode has a whitelist-allow for reddit.com (priority 5),
 * the allow rule wins because 5 > 3.
 */
export const RULE_PRIORITIES = {
  /** Pre-built category lists (social, news, etc.) */
  CATEGORY: 1,

  /** User's custom blocklist entries */
  CUSTOM: 2,

  /** Schedule-activated blocks */
  SCHEDULE: 3,

  /** Quick Focus temporary blocks */
  QUICK_FOCUS: 4,

  /** Nuclear mode "block everything" rule */
  NUCLEAR_BLOCK: 10,

  /** Nuclear mode whitelist exceptions (must beat the block-all) */
  NUCLEAR_ALLOW: 11,
} as const;
```

### Complete RuleEngine Class

```typescript
// src/background/rule-engine.ts

import { RuleGenerator } from './rule-generator';
import { StorageManager } from './storage-manager';
import type { BlocklistData, ScheduleData, NuclearConfig } from '../shared/storage-schema';

interface RuleUpdateResult {
  added: number;
  removed: number;
  errors: string[];
  ruleCountAfter: number;
}

interface RuleCountStatus {
  dynamic: { used: number; max: number; percent: number };
  session: { used: number; max: number; percent: number };
  warning: boolean;
  critical: boolean;
}

/**
 * RuleEngine -- Central coordinator for all declarativeNetRequest operations.
 *
 * Responsibilities:
 * - Translating user intent (blocklist, schedules, nuclear) into DNR rules
 * - Managing rule ID allocation within defined ranges
 * - Batching updates for performance
 * - Monitoring rule budgets and warning before limits
 * - Ensuring Nuclear Mode rules survive service worker restarts
 *
 * This class never calls chrome.declarativeNetRequest directly for individual
 * rules. It builds changesets and applies them in bulk via applyRuleUpdate().
 */
export class RuleEngine {
  private static instance: RuleEngine | null = null;
  private ruleGenerator: RuleGenerator;
  private storage: StorageManager;

  /** In-memory cache of active dynamic rule IDs by category */
  private activeDynamicRules: Map<RuleCategory, number[]> = new Map();

  /** In-memory cache of active session rule IDs */
  private activeSessionRules: number[] = [];

  /** Queue for batching rapid rule updates */
  private updateQueue: Array<() => Promise<void>> = [];
  private updateFlushTimer: ReturnType<typeof setTimeout> | null = null;

  /** Rule count warning thresholds */
  private static readonly DYNAMIC_WARNING_THRESHOLD = 25_000;
  private static readonly DYNAMIC_CRITICAL_THRESHOLD = 28_000;
  private static readonly DYNAMIC_MAX = 30_000;
  private static readonly SESSION_MAX = 5_000;

  private constructor() {
    this.ruleGenerator = RuleGenerator.getInstance();
    this.storage = StorageManager.getInstance();
  }

  static getInstance(): RuleEngine {
    if (!RuleEngine.instance) {
      RuleEngine.instance = new RuleEngine();
    }
    return RuleEngine.instance;
  }

  // -------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------

  /**
   * Initialize the rule engine on service worker startup.
   * Loads cached rule IDs from storage and reconciles with actual DNR state.
   * Called from the main service worker entry point.
   */
  async initialize(): Promise<void> {
    console.log('[RuleEngine] Initializing...');

    // Load our cached rule tracking from storage
    const rulesData = await this.storage.get('rules');
    if (rulesData?.dynamicIds) {
      this.rebuildCacheFromIds(rulesData.dynamicIds);
    }

    // Reconcile with actual DNR state (rules may have been modified externally)
    await this.reconcileWithDNR();

    // Check Nuclear Mode integrity on every wake
    await this.verifyNuclearIntegrity();

    const status = await this.getRuleCountStatus();
    console.log(
      `[RuleEngine] Initialized. Dynamic: ${status.dynamic.used}/${status.dynamic.max}, ` +
      `Session: ${status.session.used}/${status.session.max}`
    );
  }

  /**
   * Rebuild the in-memory category-to-IDs cache from a flat list of rule IDs.
   * Uses the RULE_ID_RANGES to determine which category each ID belongs to.
   */
  private rebuildCacheFromIds(ids: number[]): void {
    this.activeDynamicRules.clear();

    for (const [category, range] of Object.entries(RULE_ID_RANGES)) {
      if (category === 'SESSION_TEMP') continue;
      const categoryIds = ids.filter(id => id >= range.start && id <= range.end);
      if (categoryIds.length > 0) {
        this.activeDynamicRules.set(category as RuleCategory, categoryIds);
      }
    }
  }

  /**
   * Reconcile our cached rule tracking with actual DNR state.
   * Handles cases where rules were removed externally (e.g., Chrome update).
   */
  private async reconcileWithDNR(): Promise<void> {
    const actualDynamic = await chrome.declarativeNetRequest.getDynamicRules();
    const actualIds = new Set(actualDynamic.map(r => r.id));

    // Remove any cached IDs that no longer exist in DNR
    for (const [category, ids] of this.activeDynamicRules.entries()) {
      const validIds = ids.filter(id => actualIds.has(id));
      if (validIds.length !== ids.length) {
        console.warn(
          `[RuleEngine] Reconcile: ${category} had ${ids.length} cached, ` +
          `${validIds.length} actual`
        );
        this.activeDynamicRules.set(category, validIds);
      }
    }

    // Detect orphaned rules (in DNR but not in our cache)
    const allCachedIds = new Set(
      Array.from(this.activeDynamicRules.values()).flat()
    );
    const orphanedIds = actualDynamic
      .map(r => r.id)
      .filter(id => !allCachedIds.has(id));

    if (orphanedIds.length > 0) {
      console.warn(`[RuleEngine] Found ${orphanedIds.length} orphaned rules, removing`);
      await this.removeRulesById(orphanedIds, 'dynamic');
    }

    // Persist the reconciled state
    await this.persistRuleTracking();
  }

  // -------------------------------------------------------------------
  // Custom Blocklist Rules
  // -------------------------------------------------------------------

  /**
   * Sync the user's custom blocklist to DNR dynamic rules.
   * Performs a diff against current rules and only applies changes.
   *
   * @param blocklist - The user's complete blocklist data
   * @returns Result of the rule update operation
   */
  async syncBlocklist(blocklist: BlocklistData): Promise<RuleUpdateResult> {
    const currentIds = this.activeDynamicRules.get('CUSTOM_BLOCKLIST') ?? [];
    const range = RULE_ID_RANGES.CUSTOM_BLOCKLIST;

    // Generate rules for each site in the blocklist
    const newRules: chrome.declarativeNetRequest.Rule[] = [];
    let nextId = range.start;

    for (const site of blocklist.sites) {
      if (nextId > range.end) {
        console.error('[RuleEngine] Custom blocklist exceeds ID range');
        break;
      }
      const rule = this.ruleGenerator.generateBlockRule(site, nextId, RULE_PRIORITIES.CUSTOM);
      newRules.push(rule);
      nextId++;
    }

    // Generate rules for Pro wildcard patterns
    for (const pattern of blocklist.customPatterns ?? []) {
      if (nextId > range.end) break;
      const rule = this.ruleGenerator.generateWildcardRule(
        pattern, nextId, RULE_PRIORITIES.CUSTOM
      );
      if (rule) {
        newRules.push(rule);
        nextId++;
      }
    }

    // Diff: determine which rules to add and which to remove
    const newIds = newRules.map(r => r.id);
    const toRemove = currentIds.filter(id => !newIds.includes(id));
    const toAdd = newRules.filter(r => !currentIds.includes(r.id));

    // If nothing changed, skip the update
    if (toRemove.length === 0 && toAdd.length === 0) {
      return { added: 0, removed: 0, errors: [], ruleCountAfter: currentIds.length };
    }

    return this.applyRuleUpdate({
      addRules: toAdd,
      removeRuleIds: toRemove,
      category: 'CUSTOM_BLOCKLIST',
      ruleType: 'dynamic',
    });
  }

  // -------------------------------------------------------------------
  // Static Ruleset (Category Lists) Management
  // -------------------------------------------------------------------

  /**
   * Enable or disable a pre-built category ruleset.
   * Static rulesets are declared in the manifest and toggled at runtime.
   *
   * @param categoryId - Ruleset ID from manifest (e.g., "social_media")
   * @param enabled - Whether to enable or disable
   */
  async toggleCategoryRuleset(categoryId: string, enabled: boolean): Promise<void> {
    const enableRulesetIds = enabled ? [categoryId] : [];
    const disableRulesetIds = enabled ? [] : [categoryId];

    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds,
      disableRulesetIds,
    });

    // Track enabled rulesets in storage
    const rulesData = await this.storage.get('rules');
    const staticEnabled = new Set(rulesData?.staticEnabled ?? []);

    if (enabled) {
      staticEnabled.add(categoryId);
    } else {
      staticEnabled.delete(categoryId);
    }

    await this.storage.set('rules', {
      ...rulesData,
      staticEnabled: Array.from(staticEnabled),
    });

    console.log(`[RuleEngine] Category "${categoryId}" ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get the current state of all pre-built category rulesets.
   */
  async getCategoryRulesetStatus(): Promise<Record<string, boolean>> {
    const enabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
    const allCategories = [
      'social_media', 'news', 'entertainment', 'gaming', 'shopping', 'adult'
    ];

    const status: Record<string, boolean> = {};
    for (const cat of allCategories) {
      status[cat] = enabledRulesets.includes(cat);
    }
    return status;
  }

  // -------------------------------------------------------------------
  // Schedule-Based Rules
  // -------------------------------------------------------------------

  /**
   * Activate blocking rules for a specific schedule.
   * Called by the schedule alarm handler when a schedule's start time arrives.
   *
   * @param schedule - The schedule to activate
   */
  async activateScheduleRules(schedule: ScheduleData): Promise<RuleUpdateResult> {
    const range = RULE_ID_RANGES.SCHEDULE;
    const existingIds = this.activeDynamicRules.get('SCHEDULE') ?? [];

    // Calculate the next available ID in the schedule range
    const startId = existingIds.length > 0
      ? Math.max(...existingIds) + 1
      : range.start;

    const newRules: chrome.declarativeNetRequest.Rule[] = [];
    let nextId = startId;

    for (const site of schedule.sites) {
      if (nextId > range.end) {
        console.error('[RuleEngine] Schedule rules exceed ID range');
        break;
      }
      const rule = this.ruleGenerator.generateBlockRule(
        site, nextId, RULE_PRIORITIES.SCHEDULE
      );
      // Tag the rule with the schedule ID via the rule condition
      newRules.push(rule);
      nextId++;
    }

    return this.applyRuleUpdate({
      addRules: newRules,
      removeRuleIds: [],
      category: 'SCHEDULE',
      ruleType: 'dynamic',
    });
  }

  /**
   * Deactivate blocking rules for a specific schedule.
   * Called when a schedule's end time arrives or the schedule is manually stopped.
   *
   * @param scheduleId - The schedule to deactivate
   * @param ruleIds - The specific rule IDs created for this schedule
   */
  async deactivateScheduleRules(ruleIds: number[]): Promise<RuleUpdateResult> {
    return this.applyRuleUpdate({
      addRules: [],
      removeRuleIds: ruleIds,
      category: 'SCHEDULE',
      ruleType: 'dynamic',
    });
  }

  // -------------------------------------------------------------------
  // Nuclear Mode
  // -------------------------------------------------------------------

  /**
   * Activate Nuclear Mode -- blocks ALL websites except whitelisted domains.
   *
   * Creates a priority-10 "block everything" rule and priority-11 "allow"
   * rules for each whitelisted domain. Rules are written to BOTH dynamic
   * and session storage for tamper resistance.
   *
   * @param config - Nuclear mode configuration (whitelist, duration, password)
   */
  async activateNuclearMode(config: NuclearConfig): Promise<RuleUpdateResult> {
    const range = RULE_ID_RANGES.NUCLEAR;
    const rules: chrome.declarativeNetRequest.Rule[] = [];

    // Rule 1: Block EVERYTHING at high priority
    const blockAllRule: chrome.declarativeNetRequest.Rule = {
      id: range.start,
      priority: RULE_PRIORITIES.NUCLEAR_BLOCK,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: {
          extensionPath: '/src/pages/blocked.html?nuclear=true&reason=nuclear_mode',
        },
      },
      condition: {
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
          chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
        ],
        // Match all URLs by using a broad pattern
        urlFilter: '*',
      },
    };
    rules.push(blockAllRule);

    // Rules 2+: Allow whitelisted domains (priority beats the block-all)
    let nextId = range.start + 1;
    const whitelist = config.whitelist ?? [];

    // Always whitelist the extension's own pages
    const internalAllowRule: chrome.declarativeNetRequest.Rule = {
      id: nextId++,
      priority: RULE_PRIORITIES.NUCLEAR_ALLOW,
      action: { type: chrome.declarativeNetRequest.RuleActionType.ALLOW },
      condition: {
        urlFilter: `chrome-extension://${chrome.runtime.id}/*`,
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
          chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
        ],
      },
    };
    rules.push(internalAllowRule);

    for (const domain of whitelist) {
      if (nextId > range.end) {
        console.error('[RuleEngine] Nuclear whitelist exceeds ID range');
        break;
      }

      const allowRule: chrome.declarativeNetRequest.Rule = {
        id: nextId,
        priority: RULE_PRIORITIES.NUCLEAR_ALLOW,
        action: { type: chrome.declarativeNetRequest.RuleActionType.ALLOW },
        condition: {
          requestDomains: [domain],
          resourceTypes: [
            chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
            chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
          ],
        },
      };
      rules.push(allowRule);
      nextId++;
    }

    // Apply to dynamic rules (persistent)
    const dynamicResult = await this.applyRuleUpdate({
      addRules: rules,
      removeRuleIds: this.activeDynamicRules.get('NUCLEAR') ?? [],
      category: 'NUCLEAR',
      ruleType: 'dynamic',
    });

    // TAMPER RESISTANCE LAYER 1: Also apply to session rules
    // Session rules use the SESSION_TEMP range but same rule structure
    const sessionRules = rules.map((rule, index) => ({
      ...rule,
      id: RULE_ID_RANGES.SESSION_TEMP.start + index,
    }));

    await chrome.declarativeNetRequest.updateSessionRules({
      addRules: sessionRules,
      removeRuleIds: this.activeSessionRules,
    });
    this.activeSessionRules = sessionRules.map(r => r.id);

    // TAMPER RESISTANCE LAYER 2: Set up alarm-based countdown
    await chrome.alarms.create('nuclear_countdown', {
      delayInMinutes: config.durationMinutes,
    });

    // TAMPER RESISTANCE LAYER 3: Lock settings
    await this.storage.set('settings', {
      ...(await this.storage.get('settings')),
      nuclearLocked: true,
      nuclearExpiresAt: Date.now() + config.durationMinutes * 60 * 1000,
      nuclearPasswordHash: config.passwordHash ?? null,
    });

    console.log(
      `[RuleEngine] Nuclear Mode ACTIVATED. ` +
      `${rules.length} rules, ${whitelist.length} whitelisted, ` +
      `${config.durationMinutes}min duration`
    );

    return dynamicResult;
  }

  /**
   * Deactivate Nuclear Mode. Only callable when:
   * - The countdown alarm fires (duration expired)
   * - The user provides the correct password/safe word
   *
   * @param force - Skip password check (used by alarm handler)
   */
  async deactivateNuclearMode(force = false): Promise<void> {
    if (!force) {
      const settings = await this.storage.get('settings');
      if (settings?.nuclearLocked && settings.nuclearExpiresAt > Date.now()) {
        throw new Error('Nuclear Mode is active. Provide password or wait for expiry.');
      }
    }

    // Remove dynamic nuclear rules
    const nuclearIds = this.activeDynamicRules.get('NUCLEAR') ?? [];
    if (nuclearIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: nuclearIds,
      });
      this.activeDynamicRules.delete('NUCLEAR');
    }

    // Remove session nuclear rules
    if (this.activeSessionRules.length > 0) {
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: this.activeSessionRules,
      });
      this.activeSessionRules = [];
    }

    // Clear the countdown alarm
    await chrome.alarms.clear('nuclear_countdown');

    // Unlock settings
    await this.storage.set('settings', {
      ...(await this.storage.get('settings')),
      nuclearLocked: false,
      nuclearExpiresAt: 0,
      nuclearPasswordHash: null,
    });

    await this.persistRuleTracking();
    console.log('[RuleEngine] Nuclear Mode DEACTIVATED');
  }

  /**
   * TAMPER RESISTANCE LAYER 6: Verify Nuclear Mode rule integrity.
   * Called on every service worker wake to ensure rules haven't been tampered with.
   * If dynamic rules are missing but Nuclear Mode is supposed to be active,
   * re-creates them from session rules or storage.
   */
  private async verifyNuclearIntegrity(): Promise<void> {
    const settings = await this.storage.get('settings');
    if (!settings?.nuclearLocked || !settings.nuclearExpiresAt) return;

    // Check if Nuclear Mode has expired
    if (Date.now() >= settings.nuclearExpiresAt) {
      console.log('[RuleEngine] Nuclear Mode expired during SW sleep, deactivating');
      await this.deactivateNuclearMode(true);
      return;
    }

    // Verify dynamic rules exist
    const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
    const nuclearDynamic = dynamicRules.filter(
      r => r.id >= RULE_ID_RANGES.NUCLEAR.start && r.id <= RULE_ID_RANGES.NUCLEAR.end
    );

    if (nuclearDynamic.length === 0) {
      console.warn('[RuleEngine] Nuclear dynamic rules MISSING -- restoring from session');

      // Try to restore from session rules
      const sessionRules = await chrome.declarativeNetRequest.getSessionRules();
      const nuclearSession = sessionRules.filter(
        r => r.id >= RULE_ID_RANGES.SESSION_TEMP.start
      );

      if (nuclearSession.length > 0) {
        // Re-create dynamic rules from session rules
        const restoredRules = nuclearSession.map((rule, index) => ({
          ...rule,
          id: RULE_ID_RANGES.NUCLEAR.start + index,
        }));

        await chrome.declarativeNetRequest.updateDynamicRules({
          addRules: restoredRules,
        });
        this.activeDynamicRules.set('NUCLEAR', restoredRules.map(r => r.id));
        console.log(`[RuleEngine] Restored ${restoredRules.length} nuclear rules from session`);
      } else {
        console.error('[RuleEngine] Both dynamic and session nuclear rules missing!');
        // Last resort: re-read config from storage and re-activate
        const nuclearConfig = await this.storage.get('nuclearConfig');
        if (nuclearConfig) {
          await this.activateNuclearMode(nuclearConfig);
        }
      }
    }

    // Verify session rules also exist (layer 1 redundancy)
    const sessionRules = await chrome.declarativeNetRequest.getSessionRules();
    if (sessionRules.length === 0 && nuclearDynamic.length > 0) {
      console.warn('[RuleEngine] Nuclear session rules missing -- restoring from dynamic');
      const sessionCopies = nuclearDynamic.map((rule, index) => ({
        ...rule,
        id: RULE_ID_RANGES.SESSION_TEMP.start + index,
      }));
      await chrome.declarativeNetRequest.updateSessionRules({
        addRules: sessionCopies,
      });
      this.activeSessionRules = sessionCopies.map(r => r.id);
    }
  }

  // -------------------------------------------------------------------
  // Quick Focus (Session Rules)
  // -------------------------------------------------------------------

  /**
   * Add temporary blocking rules for Quick Focus mode.
   * These use session rules, so they clear on browser restart.
   *
   * @param sites - Domains to temporarily block
   * @param durationMinutes - How long to block (alarm will clear)
   */
  async activateQuickFocus(
    sites: string[],
    durationMinutes: number
  ): Promise<RuleUpdateResult> {
    const range = RULE_ID_RANGES.SESSION_TEMP;

    // Avoid collision with nuclear session rules if active
    const nuclearSessionCount = this.activeSessionRules.length;
    const startId = range.start + nuclearSessionCount;

    const rules: chrome.declarativeNetRequest.Rule[] = [];
    let nextId = startId;

    for (const site of sites) {
      if (nextId > range.end) break;

      const rule = this.ruleGenerator.generateBlockRule(
        site, nextId, RULE_PRIORITIES.QUICK_FOCUS
      );
      rules.push(rule);
      nextId++;
    }

    // Apply as session rules
    await chrome.declarativeNetRequest.updateSessionRules({
      addRules: rules,
    });

    const newSessionIds = rules.map(r => r.id);
    this.activeSessionRules.push(...newSessionIds);

    // Set alarm to clear Quick Focus
    await chrome.alarms.create('quick_focus_end', {
      delayInMinutes: durationMinutes,
    });

    return {
      added: rules.length,
      removed: 0,
      errors: [],
      ruleCountAfter: this.activeSessionRules.length,
    };
  }

  /**
   * Clear Quick Focus session rules.
   * Called when the Quick Focus alarm fires or the user manually ends it.
   */
  async deactivateQuickFocus(): Promise<void> {
    // Remove only non-nuclear session rules
    const nuclearRange = RULE_ID_RANGES.SESSION_TEMP;
    const nuclearCount = (this.activeDynamicRules.get('NUCLEAR') ?? []).length;

    const quickFocusIds = this.activeSessionRules.filter(
      id => id >= nuclearRange.start + nuclearCount
    );

    if (quickFocusIds.length > 0) {
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: quickFocusIds,
      });
      this.activeSessionRules = this.activeSessionRules.filter(
        id => !quickFocusIds.includes(id)
      );
    }

    await chrome.alarms.clear('quick_focus_end');
    console.log('[RuleEngine] Quick Focus deactivated');
  }

  // -------------------------------------------------------------------
  // Core Rule Update Mechanism
  // -------------------------------------------------------------------

  /**
   * Apply a batched rule update to DNR.
   * All rule mutations flow through this method for consistency,
   * logging, error handling, and cache maintenance.
   */
  private async applyRuleUpdate(params: {
    addRules: chrome.declarativeNetRequest.Rule[];
    removeRuleIds: number[];
    category: RuleCategory;
    ruleType: 'dynamic' | 'session';
  }): Promise<RuleUpdateResult> {
    const { addRules, removeRuleIds, category, ruleType } = params;
    const errors: string[] = [];

    // Pre-flight: check we won't exceed limits
    const status = await this.getRuleCountStatus();
    const budget = ruleType === 'dynamic' ? status.dynamic : status.session;
    const netChange = addRules.length - removeRuleIds.length;

    if (budget.used + netChange > budget.max) {
      const msg = `Rule limit exceeded: ${budget.used} + ${netChange} > ${budget.max}`;
      console.error(`[RuleEngine] ${msg}`);
      errors.push(msg);
      return { added: 0, removed: 0, errors, ruleCountAfter: budget.used };
    }

    try {
      if (ruleType === 'dynamic') {
        await chrome.declarativeNetRequest.updateDynamicRules({
          addRules,
          removeRuleIds,
        });

        // Update cache
        const currentIds = this.activeDynamicRules.get(category) ?? [];
        const updatedIds = currentIds
          .filter(id => !removeRuleIds.includes(id))
          .concat(addRules.map(r => r.id));
        this.activeDynamicRules.set(category, updatedIds);
      } else {
        await chrome.declarativeNetRequest.updateSessionRules({
          addRules,
          removeRuleIds,
        });
      }

      // Persist tracking data
      await this.persistRuleTracking();

      const afterStatus = await this.getRuleCountStatus();
      if (afterStatus.warning) {
        console.warn(
          `[RuleEngine] WARNING: Dynamic rules at ${afterStatus.dynamic.percent}% capacity`
        );
      }

      return {
        added: addRules.length,
        removed: removeRuleIds.length,
        errors,
        ruleCountAfter: ruleType === 'dynamic'
          ? afterStatus.dynamic.used
          : afterStatus.session.used,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[RuleEngine] Update failed: ${msg}`);
      errors.push(msg);
      return {
        added: 0,
        removed: 0,
        errors,
        ruleCountAfter: budget.used,
      };
    }
  }

  /**
   * Remove rules by their IDs from either dynamic or session storage.
   */
  private async removeRulesById(
    ids: number[],
    ruleType: 'dynamic' | 'session'
  ): Promise<void> {
    if (ids.length === 0) return;

    if (ruleType === 'dynamic') {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ids,
      });
    } else {
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: ids,
      });
    }
  }

  // -------------------------------------------------------------------
  // Rule Count Monitoring
  // -------------------------------------------------------------------

  /**
   * Get the current rule count status across both dynamic and session budgets.
   * Used for UI display, quota warnings, and pre-flight checks.
   */
  async getRuleCountStatus(): Promise<RuleCountStatus> {
    const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
    const sessionRules = await chrome.declarativeNetRequest.getSessionRules();

    const dynamicUsed = dynamicRules.length;
    const sessionUsed = sessionRules.length;

    return {
      dynamic: {
        used: dynamicUsed,
        max: RuleEngine.DYNAMIC_MAX,
        percent: Math.round((dynamicUsed / RuleEngine.DYNAMIC_MAX) * 100),
      },
      session: {
        used: sessionUsed,
        max: RuleEngine.SESSION_MAX,
        percent: Math.round((sessionUsed / RuleEngine.SESSION_MAX) * 100),
      },
      warning: dynamicUsed >= RuleEngine.DYNAMIC_WARNING_THRESHOLD,
      critical: dynamicUsed >= RuleEngine.DYNAMIC_CRITICAL_THRESHOLD,
    };
  }

  // -------------------------------------------------------------------
  // Persistence
  // -------------------------------------------------------------------

  /**
   * Persist the current rule tracking state to storage.
   * Enables cache rebuilding after service worker restart.
   */
  private async persistRuleTracking(): Promise<void> {
    const allDynamicIds = Array.from(this.activeDynamicRules.values()).flat();
    const rulesData = await this.storage.get('rules');

    await this.storage.set('rules', {
      ...rulesData,
      dynamicIds: allDynamicIds,
      lastGenerated: Date.now(),
    });
  }

  /**
   * Full reset: remove all rules from both dynamic and session storage.
   * Used for extension reset, uninstall cleanup, or error recovery.
   */
  async removeAllRules(): Promise<void> {
    const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
    const sessionRules = await chrome.declarativeNetRequest.getSessionRules();

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: dynamicRules.map(r => r.id),
    });
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: sessionRules.map(r => r.id),
    });

    this.activeDynamicRules.clear();
    this.activeSessionRules = [];

    await this.storage.set('rules', {
      dynamicIds: [],
      staticEnabled: [],
      lastGenerated: Date.now(),
    });

    console.log('[RuleEngine] All rules removed');
  }
}
```

---

## 4.3 Rule Generation

### File: `src/background/rule-generator.ts`

The `RuleGenerator` transforms human-readable inputs (domain names, patterns, paths) into valid `chrome.declarativeNetRequest.Rule` objects. It handles the nuances of URL filter syntax, subdomain matching, redirect URLs, and rule validation.

```typescript
// src/background/rule-generator.ts

/**
 * Blocked page path within the extension package.
 * DNR redirects to this page with query parameters for context.
 */
const BLOCKED_PAGE_PATH = '/src/pages/blocked.html';

/**
 * Resource types that Focus Mode blocks.
 * MAIN_FRAME = top-level navigation (typing URL, clicking link)
 * SUB_FRAME = iframes (embedded content from blocked domains)
 */
const BLOCKED_RESOURCE_TYPES: chrome.declarativeNetRequest.ResourceType[] = [
  chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
  chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
];

interface RuleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * RuleGenerator -- Converts domain names, patterns, and paths into
 * valid declarativeNetRequest rules.
 *
 * Key responsibilities:
 * - Domain-to-urlFilter conversion with proper syntax
 * - Subdomain matching (facebook.com matches m.facebook.com, www.facebook.com)
 * - Redirect URL construction with blocked-page context params
 * - Wildcard pattern support (Pro feature)
 * - Path-based blocking support (Pro feature)
 * - Rule validation before submission to DNR API
 */
export class RuleGenerator {
  private static instance: RuleGenerator | null = null;

  private constructor() {}

  static getInstance(): RuleGenerator {
    if (!RuleGenerator.instance) {
      RuleGenerator.instance = new RuleGenerator();
    }
    return RuleGenerator.instance;
  }

  // -------------------------------------------------------------------
  // Domain Block Rules
  // -------------------------------------------------------------------

  /**
   * Generate a DNR rule that blocks a domain and all its subdomains,
   * redirecting to the extension's blocked page.
   *
   * How subdomain matching works:
   * - `requestDomains: ["facebook.com"]` matches facebook.com,
   *   www.facebook.com, m.facebook.com, and any other subdomain.
   * - This is a DNR built-in feature -- no wildcards needed.
   *
   * The redirect URL includes query parameters so the blocked page
   * can show which domain was blocked and provide an "unblock" option.
   *
   * @param domain - The domain to block (e.g., "facebook.com")
   * @param ruleId - Unique rule ID within the allocated range
   * @param priority - Rule priority from RULE_PRIORITIES
   * @returns A complete DNR rule ready for chrome.declarativeNetRequest
   */
  generateBlockRule(
    domain: string,
    ruleId: number,
    priority: number
  ): chrome.declarativeNetRequest.Rule {
    // Normalize domain: strip protocol, www prefix, trailing slash
    const normalizedDomain = this.normalizeDomain(domain);

    return {
      id: ruleId,
      priority,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: {
          // Use regexSubstitution approach for dynamic URL capture:
          // The blocked page receives the original URL so it can display it
          // and offer a "continue anyway" option (for non-nuclear blocks).
          extensionPath: `${BLOCKED_PAGE_PATH}?domain=${encodeURIComponent(normalizedDomain)}`,
        },
      },
      condition: {
        /**
         * requestDomains: DNR's built-in domain matching.
         * ["facebook.com"] matches:
         *   - facebook.com
         *   - www.facebook.com
         *   - m.facebook.com
         *   - any.subdomain.facebook.com
         *
         * This is more reliable and performant than urlFilter patterns
         * for domain-level blocking.
         */
        requestDomains: [normalizedDomain],
        resourceTypes: BLOCKED_RESOURCE_TYPES,
      },
    };
  }

  /**
   * Generate an allow rule for a specific domain.
   * Used for Nuclear Mode whitelist entries and schedule exceptions.
   *
   * @param domain - The domain to allow
   * @param ruleId - Unique rule ID
   * @param priority - Must be higher than the corresponding block rule
   */
  generateAllowRule(
    domain: string,
    ruleId: number,
    priority: number
  ): chrome.declarativeNetRequest.Rule {
    const normalizedDomain = this.normalizeDomain(domain);

    return {
      id: ruleId,
      priority,
      action: { type: chrome.declarativeNetRequest.RuleActionType.ALLOW },
      condition: {
        requestDomains: [normalizedDomain],
        resourceTypes: BLOCKED_RESOURCE_TYPES,
      },
    };
  }

  // -------------------------------------------------------------------
  // Wildcard Pattern Rules (Pro)
  // -------------------------------------------------------------------

  /**
   * Generate a rule from a wildcard pattern.
   * Pro feature: allows patterns like "*.social-media.com" or "news-*.com".
   *
   * DNR supports limited regex via regexFilter. We convert user-friendly
   * wildcard patterns into DNR-compatible regex patterns.
   *
   * @param pattern - User-entered wildcard pattern (e.g., "*.example.com")
   * @param ruleId - Unique rule ID
   * @param priority - Rule priority
   * @returns DNR rule or null if pattern is invalid
   */
  generateWildcardRule(
    pattern: string,
    ruleId: number,
    priority: number
  ): chrome.declarativeNetRequest.Rule | null {
    const validation = this.validateWildcardPattern(pattern);
    if (!validation.valid) {
      console.warn(`[RuleGenerator] Invalid wildcard pattern "${pattern}": ${validation.errors}`);
      return null;
    }

    // Convert user wildcard to DNR regexFilter:
    // "*" in user pattern becomes ".*" in regex
    // Dots are escaped, other special chars are escaped
    const regexPattern = this.wildcardToRegex(pattern);

    return {
      id: ruleId,
      priority,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: {
          extensionPath: `${BLOCKED_PAGE_PATH}?pattern=${encodeURIComponent(pattern)}`,
        },
      },
      condition: {
        regexFilter: regexPattern,
        resourceTypes: BLOCKED_RESOURCE_TYPES,
      },
    };
  }

  /**
   * Convert a user-friendly wildcard pattern to a DNR-compatible regex.
   *
   * Examples:
   *   "*.example.com" -> "^https?://([^/]*\\.)?example\\.com/"
   *   "news-*.com"    -> "^https?://news-[^/]*\\.com/"
   */
  private wildcardToRegex(pattern: string): string {
    // Escape regex special characters except our wildcard "*"
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '[^/]*');

    // Wrap in URL-matching regex
    return `^https?://(${escaped})(/|$)`;
  }

  /**
   * Validate a wildcard pattern before rule generation.
   */
  private validateWildcardPattern(pattern: string): RuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!pattern || pattern.trim().length === 0) {
      errors.push('Pattern cannot be empty');
    }

    if (pattern === '*' || pattern === '*.*') {
      errors.push('Pattern too broad -- use Nuclear Mode instead');
    }

    // DNR regex has a 1024 character limit
    const regex = this.wildcardToRegex(pattern);
    if (regex.length > 1024) {
      errors.push('Pattern converts to regex exceeding 1024 character DNR limit');
    }

    // Warn about patterns that might match too many domains
    const wildcardCount = (pattern.match(/\*/g) || []).length;
    if (wildcardCount > 2) {
      warnings.push('Multiple wildcards may match more domains than expected');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // -------------------------------------------------------------------
  // Path-Based Blocking (Pro)
  // -------------------------------------------------------------------

  /**
   * Generate a rule that blocks a specific path on a domain.
   * Pro feature: block reddit.com/r/funny but allow reddit.com/r/programming.
   *
   * Uses urlFilter with path matching instead of requestDomains,
   * since requestDomains only match at the domain level.
   *
   * @param domain - Base domain (e.g., "reddit.com")
   * @param path - Path to block (e.g., "/r/funny")
   * @param ruleId - Unique rule ID
   * @param priority - Rule priority
   */
  generatePathBlockRule(
    domain: string,
    path: string,
    ruleId: number,
    priority: number
  ): chrome.declarativeNetRequest.Rule {
    const normalizedDomain = this.normalizeDomain(domain);
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return {
      id: ruleId,
      priority,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: {
          extensionPath:
            `${BLOCKED_PAGE_PATH}` +
            `?domain=${encodeURIComponent(normalizedDomain)}` +
            `&path=${encodeURIComponent(normalizedPath)}`,
        },
      },
      condition: {
        /**
         * urlFilter syntax for path matching:
         * "||reddit.com/r/funny" matches:
         *   - https://reddit.com/r/funny
         *   - https://www.reddit.com/r/funny
         *   - https://reddit.com/r/funny/comments/...
         *
         * The "||" prefix means "match domain boundary"
         */
        urlFilter: `||${normalizedDomain}${normalizedPath}`,
        resourceTypes: BLOCKED_RESOURCE_TYPES,
      },
    };
  }

  // -------------------------------------------------------------------
  // Domain Normalization & Validation
  // -------------------------------------------------------------------

  /**
   * Normalize a domain input for consistent rule generation.
   *
   * Handles common user input variations:
   *   "https://www.facebook.com/" -> "facebook.com"
   *   "Facebook.com"              -> "facebook.com"
   *   "  reddit.com  "            -> "reddit.com"
   *   "http://m.twitter.com/home" -> "twitter.com"
   */
  normalizeDomain(input: string): string {
    let domain = input.trim().toLowerCase();

    // Strip protocol
    domain = domain.replace(/^https?:\/\//, '');

    // Strip www prefix (requestDomains handles subdomains automatically)
    domain = domain.replace(/^www\./, '');

    // Strip path and query string
    domain = domain.split('/')[0];
    domain = domain.split('?')[0];
    domain = domain.split('#')[0];

    // Strip port number
    domain = domain.split(':')[0];

    // Strip trailing dot (FQDN notation)
    domain = domain.replace(/\.$/, '');

    return domain;
  }

  /**
   * Validate a domain string before creating rules.
   * Catches common mistakes and invalid inputs.
   */
  validateDomain(domain: string): RuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const normalized = this.normalizeDomain(domain);

    if (!normalized) {
      errors.push('Domain cannot be empty');
      return { valid: false, errors, warnings };
    }

    // Basic domain format validation
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
    if (!domainRegex.test(normalized)) {
      errors.push(`"${normalized}" is not a valid domain format`);
    }

    // Warn about very broad domains
    const parts = normalized.split('.');
    if (parts.length === 2 && ['com', 'org', 'net', 'io'].includes(parts[1]) && parts[0].length <= 2) {
      warnings.push(`"${normalized}" is very short -- make sure this is correct`);
    }

    // Prevent blocking the extension's own domains or Chrome internals
    const blockedDomains = ['chrome.google.com', 'chromewebstore.google.com'];
    if (blockedDomains.includes(normalized)) {
      errors.push(`Cannot block "${normalized}" -- this is a protected Chrome domain`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // -------------------------------------------------------------------
  // Bulk Rule Generation
  // -------------------------------------------------------------------

  /**
   * Generate rules for an entire category blocklist.
   * Used for pre-built category lists (social media, news, etc.)
   * that are included as static rulesets in the manifest.
   *
   * @param sites - Array of domains in the category
   * @param startId - Starting rule ID
   * @param priority - Priority for all rules in this category
   */
  generateCategoryRules(
    sites: string[],
    startId: number,
    priority: number
  ): chrome.declarativeNetRequest.Rule[] {
    return sites.map((site, index) =>
      this.generateBlockRule(site, startId + index, priority)
    );
  }
}
```

### Pre-Built Category Static Rulesets

These are declared in the manifest and shipped with the extension. They cannot be modified at runtime, only enabled/disabled.

```json
// src/rules/social_media.json
[
  {
    "id": 1,
    "priority": 1,
    "action": {
      "type": "redirect",
      "redirect": {
        "extensionPath": "/src/pages/blocked.html?domain=facebook.com&category=social_media"
      }
    },
    "condition": {
      "requestDomains": ["facebook.com"],
      "resourceTypes": ["main_frame", "sub_frame"]
    }
  },
  {
    "id": 2,
    "priority": 1,
    "action": {
      "type": "redirect",
      "redirect": {
        "extensionPath": "/src/pages/blocked.html?domain=instagram.com&category=social_media"
      }
    },
    "condition": {
      "requestDomains": ["instagram.com"],
      "resourceTypes": ["main_frame", "sub_frame"]
    }
  },
  {
    "id": 3,
    "priority": 1,
    "action": {
      "type": "redirect",
      "redirect": {
        "extensionPath": "/src/pages/blocked.html?domain=twitter.com&category=social_media"
      }
    },
    "condition": {
      "requestDomains": ["twitter.com"],
      "resourceTypes": ["main_frame", "sub_frame"]
    }
  },
  {
    "id": 4,
    "priority": 1,
    "action": {
      "type": "redirect",
      "redirect": {
        "extensionPath": "/src/pages/blocked.html?domain=tiktok.com&category=social_media"
      }
    },
    "condition": {
      "requestDomains": ["tiktok.com"],
      "resourceTypes": ["main_frame", "sub_frame"]
    }
  },
  {
    "id": 5,
    "priority": 1,
    "action": {
      "type": "redirect",
      "redirect": {
        "extensionPath": "/src/pages/blocked.html?domain=snapchat.com&category=social_media"
      }
    },
    "condition": {
      "requestDomains": ["snapchat.com"],
      "resourceTypes": ["main_frame", "sub_frame"]
    }
  }
]
```

```json
// src/rules/news.json
[
  {
    "id": 1,
    "priority": 1,
    "action": {
      "type": "redirect",
      "redirect": {
        "extensionPath": "/src/pages/blocked.html?domain=cnn.com&category=news"
      }
    },
    "condition": {
      "requestDomains": ["cnn.com"],
      "resourceTypes": ["main_frame", "sub_frame"]
    }
  },
  {
    "id": 2,
    "priority": 1,
    "action": {
      "type": "redirect",
      "redirect": {
        "extensionPath": "/src/pages/blocked.html?domain=bbc.com&category=news"
      }
    },
    "condition": {
      "requestDomains": ["bbc.com"],
      "resourceTypes": ["main_frame", "sub_frame"]
    }
  },
  {
    "id": 3,
    "priority": 1,
    "action": {
      "type": "redirect",
      "redirect": {
        "extensionPath": "/src/pages/blocked.html?domain=reddit.com&category=news"
      }
    },
    "condition": {
      "requestDomains": ["reddit.com"],
      "resourceTypes": ["main_frame", "sub_frame"]
    }
  }
]
```

Manifest declaration for static rulesets:

```json
// Relevant section from manifest.json
{
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "social_media",
        "enabled": false,
        "path": "src/rules/social_media.json"
      },
      {
        "id": "news",
        "enabled": false,
        "path": "src/rules/news.json"
      },
      {
        "id": "entertainment",
        "enabled": false,
        "path": "src/rules/entertainment.json"
      },
      {
        "id": "gaming",
        "enabled": false,
        "path": "src/rules/gaming.json"
      },
      {
        "id": "shopping",
        "enabled": false,
        "path": "src/rules/shopping.json"
      },
      {
        "id": "adult",
        "enabled": false,
        "path": "src/rules/adult.json"
      }
    ]
  }
}
```

---

## 4.4 Nuclear Mode Implementation

Nuclear Mode is the most complex feature in Focus Mode - Blocker. It blocks **every website** except a user-defined whitelist and is designed to be tamper-resistant for the configured duration.

### The 6 Tamper-Resistance Layers

```
Layer 1: Dual Rule Storage
  Dynamic rules (persistent) + Session rules (redundant copy)
  If either set is deleted, the other restores it on next SW wake.

Layer 2: Alarm-Based Countdown
  chrome.alarms API tracks remaining time.
  Cannot be cancelled without password.
  SW checks alarm on wake -- if alarm is missing but nuclear is active,
  the alarm is re-created from the stored expiry timestamp.

Layer 3: Settings Lock
  storage.local.settings.nuclearLocked = true
  All settings-modifying APIs check this flag and refuse changes.
  Popup shows locked state with countdown timer.

Layer 4: Popup Locked State
  Extension popup detects nuclear mode on load.
  Renders a locked interface with countdown, no unblock buttons.
  Only shows password entry for emergency exit.

Layer 5: Extension Management Detection
  chrome.management.onDisabled listener detects if another extension
  or the user tries to disable Focus Mode during nuclear.
  Logs the attempt and (if possible) shows a notification.

Layer 6: Rule Integrity Check
  verifyNuclearIntegrity() runs on EVERY service worker wake.
  Checks that dynamic rules exist. If not, restores from session.
  Checks that session rules exist. If not, restores from dynamic.
  If BOTH are missing, re-creates from stored configuration.
```

### Nuclear Mode Activation Flow

```
User clicks "Activate Nuclear Mode"
  |
  v
Popup validates: password set? whitelist configured? duration selected?
  |
  v
Message to service worker: { action: 'nuclear_activate', config }
  |
  v
RuleEngine.activateNuclearMode(config)
  |
  +-- Create block-all rule (priority 10, matches "*")
  +-- Create allow rules for each whitelisted domain (priority 11)
  +-- Create allow rule for extension's own pages (priority 11)
  |
  +-- Apply to dynamic rules (persistent)
  +-- Apply copy to session rules (tamper-resistance)
  |
  +-- Create alarm: 'nuclear_countdown' (fires at expiry)
  +-- Lock settings in storage
  |
  v
Service worker confirms activation
  |
  v
Popup switches to locked state with countdown
```

### Nuclear Mode Emergency Exit

```typescript
// src/background/nuclear-manager.ts

import { RuleEngine } from './rule-engine';
import { StorageManager } from './storage-manager';

/**
 * NuclearManager -- Handles Nuclear Mode lifecycle, including
 * the emergency exit mechanism.
 *
 * Emergency exit requires either:
 * 1. The pre-configured password/safe word
 * 2. Waiting for the countdown to expire
 *
 * There is no other way to exit Nuclear Mode. This is by design.
 */
export class NuclearManager {
  private static instance: NuclearManager | null = null;
  private ruleEngine: RuleEngine;
  private storage: StorageManager;

  private constructor() {
    this.ruleEngine = RuleEngine.getInstance();
    this.storage = StorageManager.getInstance();
  }

  static getInstance(): NuclearManager {
    if (!NuclearManager.instance) {
      NuclearManager.instance = new NuclearManager();
    }
    return NuclearManager.instance;
  }

  /**
   * Attempt emergency exit from Nuclear Mode.
   *
   * @param password - The user's password attempt
   * @returns Whether the exit was successful
   */
  async attemptEmergencyExit(password: string): Promise<{
    success: boolean;
    error?: string;
    remainingMinutes?: number;
  }> {
    const settings = await this.storage.get('settings');

    if (!settings?.nuclearLocked) {
      return { success: false, error: 'Nuclear Mode is not active' };
    }

    // Verify password
    const passwordHash = await this.hashPassword(password);
    if (passwordHash !== settings.nuclearPasswordHash) {
      // Log the failed attempt (for analytics / tamper detection)
      await this.logNuclearEvent('emergency_exit_failed', {
        timestamp: Date.now(),
      });

      const remainingMs = settings.nuclearExpiresAt - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60_000);

      return {
        success: false,
        error: 'Incorrect password',
        remainingMinutes,
      };
    }

    // Password correct -- deactivate Nuclear Mode
    await this.ruleEngine.deactivateNuclearMode(true);

    await this.logNuclearEvent('emergency_exit_success', {
      timestamp: Date.now(),
      remainingWhenExited: settings.nuclearExpiresAt - Date.now(),
    });

    return { success: true };
  }

  /**
   * Handle the nuclear countdown alarm firing (duration expired).
   * Called from the alarm handler in the service worker.
   */
  async handleCountdownExpired(): Promise<void> {
    console.log('[NuclearManager] Countdown expired, deactivating');
    await this.ruleEngine.deactivateNuclearMode(true);

    await this.logNuclearEvent('countdown_expired', {
      timestamp: Date.now(),
    });

    // Show notification that Nuclear Mode has ended
    await chrome.notifications.create('nuclear_ended', {
      type: 'basic',
      iconUrl: '/src/assets/icons/icon-128.png',
      title: 'Nuclear Mode Ended',
      message: 'Focus Mode Nuclear Mode has expired. Normal blocking rules are now active.',
    });
  }

  /**
   * Get the current Nuclear Mode status for the popup UI.
   */
  async getStatus(): Promise<{
    active: boolean;
    expiresAt: number | null;
    remainingMinutes: number | null;
    whitelistCount: number;
  }> {
    const settings = await this.storage.get('settings');

    if (!settings?.nuclearLocked) {
      return { active: false, expiresAt: null, remainingMinutes: null, whitelistCount: 0 };
    }

    const remainingMs = Math.max(0, settings.nuclearExpiresAt - Date.now());

    return {
      active: true,
      expiresAt: settings.nuclearExpiresAt,
      remainingMinutes: Math.ceil(remainingMs / 60_000),
      whitelistCount: (await this.storage.get('nuclearConfig'))?.whitelist?.length ?? 0,
    };
  }

  /**
   * TAMPER RESISTANCE LAYER 5: Detect if the extension is being disabled.
   * Register this listener in the service worker.
   */
  async handleExtensionDisableAttempt(info: chrome.management.ExtensionInfo): Promise<void> {
    if (info.id !== chrome.runtime.id) return;

    const settings = await this.storage.get('settings');
    if (!settings?.nuclearLocked) return;

    console.error('[NuclearManager] Extension disable attempted during Nuclear Mode!');
    await this.logNuclearEvent('disable_attempt', {
      timestamp: Date.now(),
    });

    // We can't prevent the disable, but we can notify
    await chrome.notifications.create('nuclear_tamper', {
      type: 'basic',
      iconUrl: '/src/assets/icons/icon-128.png',
      title: 'Focus Mode Warning',
      message: 'Someone tried to disable Focus Mode during Nuclear Mode.',
    });
  }

  /**
   * Hash a password using SHA-256 for comparison.
   * We never store the plaintext password.
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Log a Nuclear Mode event for analytics and tamper detection.
   */
  private async logNuclearEvent(
    type: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const analytics = await this.storage.get('analytics');
    const events = analytics?.events ?? [];

    events.push({
      type: `nuclear_${type}`,
      timestamp: Date.now(),
      data,
    });

    // Keep only last 500 events
    const trimmed = events.slice(-500);
    await this.storage.set('analytics', { ...analytics, events: trimmed });
  }
}
```

---

## 4.5 Schedule-Based Rule Activation

Schedules allow users to automatically activate blocking rules at specific times on specific days. Free users get 1 schedule; Pro users get unlimited.

### Schedule Alarm Architecture

```
Schedule created by user
  |
  v
ScheduleManager calculates next activation time
  |
  v
chrome.alarms.create('schedule_[id]_start', { when: nextStartMs })
chrome.alarms.create('schedule_[id]_end', { when: nextEndMs })
  |
  v
[Time passes, SW may sleep/wake multiple times]
  |
  v
Alarm fires -> SW wakes -> onAlarm handler
  |
  +-- If '_start' alarm: activate schedule rules via RuleEngine
  +-- If '_end' alarm: deactivate schedule rules, set next occurrence alarm
```

```typescript
// src/background/schedule-manager.ts

import { RuleEngine } from './rule-engine';
import { StorageManager } from './storage-manager';
import type { Schedule, ScheduleData } from '../shared/storage-schema';

/**
 * Days of the week as bit flags for compact storage.
 * Monday = 1, Tuesday = 2, Wednesday = 4, ..., Sunday = 64
 */
export const DAY_FLAGS = {
  MON: 1 << 0, // 1
  TUE: 1 << 1, // 2
  WED: 1 << 2, // 4
  THU: 1 << 3, // 8
  FRI: 1 << 4, // 16
  SAT: 1 << 5, // 32
  SUN: 1 << 6, // 64
  WEEKDAYS: 0b0011111, // Mon-Fri (31)
  WEEKENDS: 0b1100000, // Sat-Sun (96)
  ALL_DAYS: 0b1111111, // Every day (127)
} as const;

interface ScheduleAlarmData {
  scheduleId: string;
  type: 'start' | 'end';
}

/**
 * ScheduleManager -- Manages time-based rule activation/deactivation.
 *
 * Schedules define when blocking rules should be active. For example:
 * - "Block social media Mon-Fri 9am-5pm"
 * - "Block gaming every day 8pm-6am"
 *
 * Implementation uses chrome.alarms for reliable time-based triggers.
 * The alarm fires at the exact start/end time, and the handler
 * activates/deactivates the corresponding DNR rules.
 *
 * Edge cases handled:
 * - Browser closed during scheduled period (reconcile on startup)
 * - Overlapping schedules (rules stack, all active rules apply)
 * - Schedule boundary (what happens at exactly the start/end time)
 * - Timezone changes (recalculate alarms)
 */
export class ScheduleManager {
  private static instance: ScheduleManager | null = null;
  private ruleEngine: RuleEngine;
  private storage: StorageManager;

  /** Map of schedule ID to its currently active rule IDs */
  private activeScheduleRules: Map<string, number[]> = new Map();

  private constructor() {
    this.ruleEngine = RuleEngine.getInstance();
    this.storage = StorageManager.getInstance();
  }

  static getInstance(): ScheduleManager {
    if (!ScheduleManager.instance) {
      ScheduleManager.instance = new ScheduleManager();
    }
    return ScheduleManager.instance;
  }

  /**
   * Initialize schedule manager: reconcile active schedules,
   * set up alarms for upcoming transitions.
   * Called during service worker initialization.
   */
  async initialize(): Promise<void> {
    const schedulesData = await this.storage.get('schedules');
    const schedules = schedulesData?.items ?? [];

    for (const schedule of schedules) {
      if (!schedule.enabled) continue;

      const isCurrentlyActive = this.isScheduleActiveNow(schedule);

      if (isCurrentlyActive) {
        // Should be blocking -- ensure rules are active
        const existingRules = this.activeScheduleRules.get(schedule.id);
        if (!existingRules || existingRules.length === 0) {
          console.log(`[ScheduleManager] Activating missed schedule: ${schedule.name}`);
          await this.activateSchedule(schedule);
        }
      }

      // Always ensure the next alarm is set
      await this.setNextAlarm(schedule);
    }
  }

  /**
   * Determine if a schedule should be active at the current moment.
   * Checks day-of-week and time-of-day against the schedule definition.
   */
  isScheduleActiveNow(schedule: Schedule): boolean {
    const now = new Date();
    const currentDay = this.getDayFlag(now.getDay());
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Check if today is a scheduled day
    if ((schedule.days & currentDay) === 0) return false;

    // Handle overnight schedules (e.g., 22:00 to 06:00)
    if (schedule.startMinutes > schedule.endMinutes) {
      // Overnight: active if AFTER start OR BEFORE end
      return currentMinutes >= schedule.startMinutes || currentMinutes < schedule.endMinutes;
    }

    // Same-day schedule: active if between start and end
    return currentMinutes >= schedule.startMinutes && currentMinutes < schedule.endMinutes;
  }

  /**
   * Convert JS Date.getDay() (0=Sunday) to our bit flag system.
   */
  private getDayFlag(jsDay: number): number {
    // JS: 0=Sun, 1=Mon, ..., 6=Sat
    // Our flags: 0=Mon, 1=Tue, ..., 6=Sun
    const mapped = jsDay === 0 ? 6 : jsDay - 1;
    return 1 << mapped;
  }

  /**
   * Activate a schedule: create DNR rules for all sites in the schedule.
   */
  private async activateSchedule(schedule: Schedule): Promise<void> {
    const scheduleData: ScheduleData = {
      id: schedule.id,
      sites: schedule.sites,
    };

    const result = await this.ruleEngine.activateScheduleRules(scheduleData);
    if (result.errors.length === 0) {
      // Track which rule IDs belong to this schedule
      // The IDs are derived from the range allocation
      const range = await this.getScheduleRuleIds(schedule.id);
      this.activeScheduleRules.set(schedule.id, range);

      await this.storage.set('schedules', {
        ...(await this.storage.get('schedules')),
        active: schedule.id,
      });

      console.log(`[ScheduleManager] Schedule "${schedule.name}" activated with ${result.added} rules`);
    }
  }

  /**
   * Deactivate a schedule: remove its DNR rules.
   */
  private async deactivateSchedule(scheduleId: string): Promise<void> {
    const ruleIds = this.activeScheduleRules.get(scheduleId) ?? [];
    if (ruleIds.length > 0) {
      await this.ruleEngine.deactivateScheduleRules(ruleIds);
      this.activeScheduleRules.delete(scheduleId);
    }

    const schedulesData = await this.storage.get('schedules');
    if (schedulesData?.active === scheduleId) {
      await this.storage.set('schedules', {
        ...schedulesData,
        active: null,
      });
    }

    console.log(`[ScheduleManager] Schedule "${scheduleId}" deactivated`);
  }

  /**
   * Get the rule IDs associated with a schedule.
   */
  private async getScheduleRuleIds(scheduleId: string): Promise<number[]> {
    return this.activeScheduleRules.get(scheduleId) ?? [];
  }

  /**
   * Set the next alarm for a schedule's start or end transition.
   * Calculates the next occurrence considering day-of-week and time.
   */
  private async setNextAlarm(schedule: Schedule): Promise<void> {
    const now = new Date();
    const nextStart = this.calculateNextOccurrence(schedule, 'start', now);
    const nextEnd = this.calculateNextOccurrence(schedule, 'end', now);

    if (nextStart) {
      await chrome.alarms.create(`schedule_${schedule.id}_start`, {
        when: nextStart.getTime(),
      });
    }

    if (nextEnd) {
      await chrome.alarms.create(`schedule_${schedule.id}_end`, {
        when: nextEnd.getTime(),
      });
    }
  }

  /**
   * Calculate the next occurrence of a schedule's start or end time.
   *
   * @param schedule - The schedule definition
   * @param type - Whether to find the next 'start' or 'end' time
   * @param from - The reference time (usually now)
   * @returns Date of next occurrence, or null if schedule has no upcoming events
   */
  private calculateNextOccurrence(
    schedule: Schedule,
    type: 'start' | 'end',
    from: Date
  ): Date | null {
    const targetMinutes = type === 'start' ? schedule.startMinutes : schedule.endMinutes;
    const targetHour = Math.floor(targetMinutes / 60);
    const targetMinute = targetMinutes % 60;

    // Check today and the next 7 days
    for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
      const candidate = new Date(from);
      candidate.setDate(candidate.getDate() + dayOffset);
      candidate.setHours(targetHour, targetMinute, 0, 0);

      // Skip if this time has already passed today
      if (candidate.getTime() <= from.getTime()) continue;

      // Check if this day is in the schedule
      const dayFlag = this.getDayFlag(candidate.getDay());
      if ((schedule.days & dayFlag) === 0) continue;

      return candidate;
    }

    return null;
  }

  /**
   * Handle a schedule alarm firing.
   * Called from the main alarm handler in the service worker.
   */
  async handleAlarm(alarmName: string): Promise<void> {
    const match = alarmName.match(/^schedule_(.+)_(start|end)$/);
    if (!match) return;

    const [, scheduleId, type] = match;
    const schedulesData = await this.storage.get('schedules');
    const schedule = schedulesData?.items?.find((s: Schedule) => s.id === scheduleId);

    if (!schedule || !schedule.enabled) {
      console.log(`[ScheduleManager] Alarm for disabled/deleted schedule: ${scheduleId}`);
      return;
    }

    if (type === 'start') {
      await this.activateSchedule(schedule);
    } else {
      await this.deactivateSchedule(scheduleId);
    }

    // Set the next occurrence alarm
    await this.setNextAlarm(schedule);
  }
}
```

---

## 4.6 Block Page Redirect

When DNR blocks a navigation, the user sees a redirect to the extension's bundled block page rather than a blank error screen. This page is part of the extension package and requires no network access.

### How the Redirect Works

```
User navigates to facebook.com
  |
  v
Browser matches DNR rule:
  condition: { requestDomains: ["facebook.com"] }
  action: { type: "redirect", redirect: { extensionPath: "/src/pages/blocked.html?domain=facebook.com" } }
  |
  v
Browser redirects to:
  chrome-extension://[extension-id]/src/pages/blocked.html?domain=facebook.com
  |
  v
blocked.html loads from extension package (no network)
  |
  v
JavaScript reads URL params and renders:
  - Which domain was blocked
  - Which rule triggered it (category, custom, schedule, nuclear)
  - Motivational message or focus timer
  - "Go back" button
  - "Unblock" option (not in nuclear mode)
```

### Block Page Security

```typescript
// src/pages/blocked.ts -- Block page initialization script

/**
 * Block page security: verify this page was loaded via a legitimate
 * DNR redirect and not by direct navigation or injection.
 *
 * Security checks:
 * 1. Must be loaded within the extension context (chrome.runtime.id exists)
 * 2. Must have valid query parameters (domain or pattern)
 * 3. The claimed domain must actually be in the active blocklist/rules
 */
async function initBlockedPage(): Promise<void> {
  // Check 1: Extension context
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
    document.body.textContent = 'Invalid context';
    return;
  }

  // Parse query parameters
  const params = new URLSearchParams(window.location.search);
  const domain = params.get('domain');
  const pattern = params.get('pattern');
  const path = params.get('path');
  const category = params.get('category');
  const isNuclear = params.get('nuclear') === 'true';
  const reason = params.get('reason');

  // Check 2: Valid parameters
  if (!domain && !pattern && !isNuclear) {
    document.body.textContent = 'Missing block parameters';
    return;
  }

  // Check 3: Verify the block is legitimate by querying the service worker
  const verification = await chrome.runtime.sendMessage({
    action: 'verify_block',
    domain,
    pattern,
  });

  if (!verification?.legitimate) {
    console.warn('[BlockedPage] Block verification failed');
    // Still show the page but log the anomaly
  }

  // Render the block page
  renderBlockedUI({
    domain: domain ?? pattern ?? 'all sites',
    category,
    isNuclear,
    reason,
    path,
  });
}

interface BlockedUIConfig {
  domain: string;
  category: string | null;
  isNuclear: boolean;
  reason: string | null;
  path: string | null;
}

/**
 * Render the blocked page UI with context about why the site was blocked.
 */
function renderBlockedUI(config: BlockedUIConfig): void {
  const container = document.getElementById('blocked-content');
  if (!container) return;

  // Set the blocked domain display
  const domainEl = document.getElementById('blocked-domain');
  if (domainEl) {
    domainEl.textContent = config.path
      ? `${config.domain}${config.path}`
      : config.domain;
  }

  // Set the reason display
  const reasonEl = document.getElementById('block-reason');
  if (reasonEl) {
    if (config.isNuclear) {
      reasonEl.textContent = 'Nuclear Mode is active. All sites are blocked.';
    } else if (config.category) {
      const categoryNames: Record<string, string> = {
        social_media: 'Social Media',
        news: 'News',
        entertainment: 'Entertainment',
        gaming: 'Gaming',
        shopping: 'Shopping',
        adult: 'Adult Content',
      };
      reasonEl.textContent = `Blocked by ${categoryNames[config.category] ?? config.category} category filter`;
    } else {
      reasonEl.textContent = 'This site is on your blocklist';
    }
  }

  // Show/hide the unblock button (hidden during nuclear mode)
  const unblockBtn = document.getElementById('unblock-btn') as HTMLButtonElement | null;
  if (unblockBtn) {
    unblockBtn.style.display = config.isNuclear ? 'none' : 'block';
    unblockBtn.addEventListener('click', () => handleUnblockRequest(config.domain));
  }

  // Set up the "Go Back" button
  const goBackBtn = document.getElementById('go-back-btn');
  if (goBackBtn) {
    goBackBtn.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'chrome://newtab';
      }
    });
  }

  // Load and display motivational message
  loadMotivationalMessage();
}

/**
 * Handle an unblock request from the block page.
 * Sends a message to the service worker to temporarily allow the site.
 */
async function handleUnblockRequest(domain: string): Promise<void> {
  const response = await chrome.runtime.sendMessage({
    action: 'request_unblock',
    domain,
  });

  if (response?.allowed) {
    // Navigate to the originally blocked URL
    window.location.href = `https://${domain}`;
  } else if (response?.error) {
    const errorEl = document.getElementById('unblock-error');
    if (errorEl) {
      errorEl.textContent = response.error;
      errorEl.style.display = 'block';
    }
  }
}

/**
 * Display a random motivational message to encourage focus.
 */
function loadMotivationalMessage(): void {
  const messages = [
    'Stay focused. Your future self will thank you.',
    'Every minute of focus is a step toward your goal.',
    'Distraction is the enemy of progress.',
    'You chose to block this site for a reason. Trust yourself.',
    'The best time to focus was yesterday. The second best is now.',
    'Deep work creates deep results.',
    'Your attention is your most valuable resource.',
  ];

  const messageEl = document.getElementById('motivational-message');
  if (messageEl) {
    const randomIndex = Math.floor(Math.random() * messages.length);
    messageEl.textContent = messages[randomIndex];
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initBlockedPage);
```

---

## 4.7 Rule Performance Optimization

### Batch Rule Updates

All rule changes in Focus Mode go through the `RuleEngine.applyRuleUpdate()` method, which batches operations into a single `updateDynamicRules()` or `updateSessionRules()` call. This is critical because:

1. Each DNR API call has overhead (IPC to browser process)
2. Rules are re-indexed after each call
3. Batching 100 rule changes into 1 call is faster than 100 separate calls

```typescript
// src/background/rule-optimizer.ts

/**
 * RuleOptimizer -- Handles performance optimization for rule updates.
 *
 * Key optimizations:
 * 1. Diff-based updates: only modify rules that changed
 * 2. Batch queue: accumulate rapid changes and flush once
 * 3. Rule count monitoring with proactive warnings
 * 4. In-memory rule cache for fast lookup without DNR API calls
 */
export class RuleOptimizer {
  private static instance: RuleOptimizer | null = null;

  /** Pending rule changes waiting to be flushed */
  private pendingAdds: chrome.declarativeNetRequest.Rule[] = [];
  private pendingRemoves: number[] = [];

  /** Timer for batch flush */
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  /** Debounce interval for batching rapid updates (ms) */
  private static readonly FLUSH_DELAY_MS = 100;

  /** In-memory cache: domain -> rule ID for fast lookup */
  private domainToRuleId: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): RuleOptimizer {
    if (!RuleOptimizer.instance) {
      RuleOptimizer.instance = new RuleOptimizer();
    }
    return RuleOptimizer.instance;
  }

  /**
   * Initialize the in-memory cache from current DNR state.
   */
  async initializeCache(): Promise<void> {
    const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();

    this.domainToRuleId.clear();
    for (const rule of dynamicRules) {
      const domains = rule.condition.requestDomains;
      if (domains) {
        for (const domain of domains) {
          this.domainToRuleId.set(domain, rule.id);
        }
      }
    }

    console.log(`[RuleOptimizer] Cache initialized with ${this.domainToRuleId.size} domains`);
  }

  /**
   * Check if a domain is currently blocked, using the in-memory cache.
   * Much faster than calling chrome.declarativeNetRequest.getDynamicRules().
   */
  isDomainBlocked(domain: string): boolean {
    // Check exact match
    if (this.domainToRuleId.has(domain)) return true;

    // Check parent domains (e.g., "m.facebook.com" -> "facebook.com")
    const parts = domain.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      const parent = parts.slice(i).join('.');
      if (this.domainToRuleId.has(parent)) return true;
    }

    return false;
  }

  /**
   * Compute the diff between current rules and desired rules.
   * Returns only the rules that need to be added or removed.
   *
   * @param currentRuleIds - IDs of currently active rules
   * @param desiredRules - The full set of rules we want active
   * @returns Object with rules to add and IDs to remove
   */
  computeDiff(
    currentRuleIds: number[],
    desiredRules: chrome.declarativeNetRequest.Rule[]
  ): {
    toAdd: chrome.declarativeNetRequest.Rule[];
    toRemove: number[];
    unchanged: number;
  } {
    const currentSet = new Set(currentRuleIds);
    const desiredSet = new Set(desiredRules.map(r => r.id));

    const toAdd = desiredRules.filter(r => !currentSet.has(r.id));
    const toRemove = currentRuleIds.filter(id => !desiredSet.has(id));
    const unchanged = currentRuleIds.filter(id => desiredSet.has(id)).length;

    return { toAdd, toRemove, unchanged };
  }

  /**
   * Queue a rule addition for batched execution.
   * The rule will be applied after FLUSH_DELAY_MS of inactivity.
   */
  queueAdd(rule: chrome.declarativeNetRequest.Rule): void {
    this.pendingAdds.push(rule);
    this.scheduleFlush();
  }

  /**
   * Queue a rule removal for batched execution.
   */
  queueRemove(ruleId: number): void {
    this.pendingRemoves.push(ruleId);
    this.scheduleFlush();
  }

  /**
   * Schedule a flush of pending changes.
   * Resets the timer on each call (debounce pattern).
   */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(async () => {
      await this.flush();
    }, RuleOptimizer.FLUSH_DELAY_MS);
  }

  /**
   * Flush all pending rule changes in a single DNR API call.
   */
  async flush(): Promise<{ added: number; removed: number }> {
    const adds = [...this.pendingAdds];
    const removes = [...this.pendingRemoves];

    this.pendingAdds = [];
    this.pendingRemoves = [];
    this.flushTimer = null;

    if (adds.length === 0 && removes.length === 0) {
      return { added: 0, removed: 0 };
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: adds,
      removeRuleIds: removes,
    });

    // Update cache
    for (const rule of adds) {
      const domains = rule.condition.requestDomains;
      if (domains) {
        for (const domain of domains) {
          this.domainToRuleId.set(domain, rule.id);
        }
      }
    }
    for (const id of removes) {
      for (const [domain, ruleId] of this.domainToRuleId.entries()) {
        if (ruleId === id) {
          this.domainToRuleId.delete(domain);
        }
      }
    }

    console.log(`[RuleOptimizer] Flushed: +${adds.length} -${removes.length} rules`);
    return { added: adds.length, removed: removes.length };
  }

  /**
   * Monitor rule count and return warnings if approaching limits.
   * Called periodically and after each batch update.
   */
  async checkQuota(): Promise<{
    dynamicUsed: number;
    dynamicMax: number;
    warningLevel: 'ok' | 'warning' | 'critical';
    message: string | null;
  }> {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    const used = rules.length;
    const max = 30_000;

    let warningLevel: 'ok' | 'warning' | 'critical' = 'ok';
    let message: string | null = null;

    if (used >= 28_000) {
      warningLevel = 'critical';
      message = `Critical: ${used.toLocaleString()} of ${max.toLocaleString()} dynamic rules used (${Math.round((used / max) * 100)}%). Remove some rules to avoid failures.`;
    } else if (used >= 25_000) {
      warningLevel = 'warning';
      message = `Warning: ${used.toLocaleString()} of ${max.toLocaleString()} dynamic rules used (${Math.round((used / max) * 100)}%). Consider removing unused rules.`;
    }

    return { dynamicUsed: used, dynamicMax: max, warningLevel, message };
  }
}
```

---
---

# Section 5: Storage Architecture

## 5.1 Storage Tier Strategy

Focus Mode - Blocker uses three distinct Chrome storage tiers. Each tier has different performance characteristics, persistence behavior, and quota limits. Choosing the right tier for each piece of data is critical for both performance and reliability.

### Three-Tier Overview

```
+------------------------------------------------------------------+
|  Tier               | Quota  | Persists?     | Syncs?  | Speed   |
|---------------------|--------|---------------|---------|---------|
|  chrome.storage.    |        |               |         |         |
|    session          | 10 MB  | No (cleared   | No      | Fastest |
|                     |        | on restart)   |         |         |
|---------------------|--------|---------------|---------|---------|
|  chrome.storage.    |        |               |         |         |
|    local            | 5 MB   | Yes           | No      | Fast    |
|---------------------|--------|---------------|---------|---------|
|  chrome.storage.    |        |               |         |         |
|    sync             | 100 KB | Yes           | Yes     | Slow    |
|                     |        |               | (Pro)   |         |
+------------------------------------------------------------------+
```

### chrome.storage.session (10 MB, ephemeral)

Session storage is cleared every time the browser restarts. It is the fastest tier because data never touches disk. Focus Mode uses it for:

- **Active timer state** -- the current countdown value, which updates every second. Writing this to `local` storage every second would be wasteful.
- **Current focus session** -- the in-progress session object. If the browser crashes, the session is lost, which is acceptable (we record completed sessions in `local`).
- **Temporary UI state** -- expanded/collapsed panel states, last-viewed tab in popup.
- **Nuclear Mode redundant rules** -- a copy of nuclear DNR rules for tamper-resistance (see Section 4.4).
- **Cached computations** -- focus score breakdown, rule count status, schedule state.

### chrome.storage.local (5 MB, persistent)

Local storage persists across browser restarts and extension updates. It is the primary data store for Focus Mode. All user data that must survive a restart lives here:

- **User's blocklist** -- sites, categories, custom patterns
- **Settings** -- theme, language, sound preferences, timer defaults, privacy options
- **Session history** -- completed focus sessions (last 90 days)
- **Streak data** -- current streak, longest streak, milestones
- **Focus score** -- current score, daily history, scoring factors
- **Analytics** -- 500-event rolling buffer of user actions
- **License** -- tier (free/pro), key, expiry, verification cache
- **Onboarding** -- completion state, seen features
- **Rules tracking** -- which dynamic rule IDs are active, by category
- **Schedules** -- schedule definitions, active schedule
- **Notifications** -- notification preferences, queued notifications
- **Monitoring** -- error queue, memory samples, debug mode flag

### chrome.storage.sync (100 KB, synced -- Pro only)

Sync storage synchronizes data across all Chrome instances where the user is signed in. The 100 KB quota is very tight, so Focus Mode only syncs essential data for Pro users:

- **Settings** (compressed) -- theme, language, core preferences
- **Blocklist** (compressed) -- site list and category toggles
- **Schedules** (compressed) -- schedule definitions
- **Streak data** -- current streak (so streaks don't break when switching devices)

---

## 5.2 Complete Storage Schema

### File: `src/shared/storage-schema.ts`

Every storage key in Focus Mode is defined in a single TypeScript schema file. This is the single source of truth for all stored data, including types, default values, size estimates, and which storage tier each key belongs to.

```typescript
// src/shared/storage-schema.ts

// =====================================================================
// Storage Tier Enum
// =====================================================================

/**
 * Which chrome.storage area a key belongs to.
 * A key may belong to multiple tiers (e.g., blocklist is in both
 * local and sync for Pro users).
 */
export type StorageTier = 'session' | 'local' | 'sync';

// =====================================================================
// Blocklist Types
// =====================================================================

/**
 * A single site entry in the blocklist.
 * Includes metadata for display and rule generation.
 */
export interface BlockedSite {
  /** The domain to block (normalized, e.g., "facebook.com") */
  domain: string;

  /** When this site was added to the blocklist */
  addedAt: number;

  /** Optional: which category this site belongs to */
  category?: string;

  /** Optional: specific paths to block (Pro feature) */
  blockedPaths?: string[];

  /** Optional: specific paths to allow even when domain is blocked (Pro) */
  allowedPaths?: string[];

  /** Whether this site is currently active in the blocklist */
  enabled: boolean;
}

/**
 * Complete blocklist data stored in chrome.storage.local.
 *
 * Storage key: "blocklist"
 * Tier: local (primary), sync (Pro, compressed)
 * Estimated size: ~50 bytes per site, 500B for 10 sites (free), ~5KB for 100 sites (Pro)
 */
export interface BlocklistData {
  /** User's custom blocked sites */
  sites: BlockedSite[];

  /** Pre-built categories: category ID -> enabled */
  categories: Record<string, boolean>;

  /** Wildcard patterns (Pro): e.g., ["*.social-media.com"] */
  customPatterns: string[];

  /** Timestamp of last blocklist modification */
  lastModified: number;
}

export const BLOCKLIST_DEFAULTS: BlocklistData = {
  sites: [],
  categories: {
    social_media: false,
    news: false,
    entertainment: false,
    gaming: false,
    shopping: false,
    adult: false,
  },
  customPatterns: [],
  lastModified: 0,
};

// =====================================================================
// Settings Types
// =====================================================================

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ko' | 'pt';
export type TimerSound = 'none' | 'bell' | 'chime' | 'gong' | 'digital';
export type TimerDisplay = 'countdown' | 'countup' | 'percentage';

/**
 * User settings for Focus Mode.
 *
 * Storage key: "settings"
 * Tier: local (primary), sync (Pro, compressed)
 * Estimated size: ~1KB
 */
export interface SettingsData {
  /** Visual theme */
  theme: ThemeMode;

  /** UI language */
  language: Language;

  /** Sound configuration */
  sounds: {
    enabled: boolean;
    timerComplete: TimerSound;
    focusStart: TimerSound;
    volume: number; // 0-100
  };

  /** Notification preferences */
  notifications: {
    enabled: boolean;
    sessionComplete: boolean;
    streakReminder: boolean;
    scheduleTransition: boolean;
    nuclearCountdown: boolean;
    dailySummary: boolean;
    quietHoursStart: number | null; // minutes from midnight, null = disabled
    quietHoursEnd: number | null;
  };

  /** Timer defaults */
  timer: {
    defaultDurationMinutes: number;
    display: TimerDisplay;
    showInBadge: boolean;
    breakDurationMinutes: number;
    autoStartBreak: boolean;
    longBreakInterval: number; // After N sessions
    longBreakDurationMinutes: number;
  };

  /** Privacy settings */
  privacy: {
    collectAnalytics: boolean;
    shareAnonymousUsage: boolean;
    clearDataOnUninstall: boolean;
  };

  /** Nuclear Mode lock state (managed by NuclearManager) */
  nuclearLocked: boolean;
  nuclearExpiresAt: number;
  nuclearPasswordHash: string | null;

  /** Extension badge behavior */
  badge: {
    showBlockCount: boolean;
    showTimer: boolean;
    color: string; // hex color for badge background
  };

  /** Keyboard shortcuts */
  shortcuts: {
    toggleFocus: string; // e.g., "Alt+Shift+F"
    quickBlock: string;
    openPopup: string;
  };
}

export const SETTINGS_DEFAULTS: SettingsData = {
  theme: 'system',
  language: 'en',
  sounds: {
    enabled: true,
    timerComplete: 'bell',
    focusStart: 'chime',
    volume: 70,
  },
  notifications: {
    enabled: true,
    sessionComplete: true,
    streakReminder: true,
    scheduleTransition: true,
    nuclearCountdown: true,
    dailySummary: false,
    quietHoursStart: null,
    quietHoursEnd: null,
  },
  timer: {
    defaultDurationMinutes: 25,
    display: 'countdown',
    showInBadge: true,
    breakDurationMinutes: 5,
    autoStartBreak: false,
    longBreakInterval: 4,
    longBreakDurationMinutes: 15,
  },
  privacy: {
    collectAnalytics: true,
    shareAnonymousUsage: false,
    clearDataOnUninstall: false,
  },
  nuclearLocked: false,
  nuclearExpiresAt: 0,
  nuclearPasswordHash: null,
  badge: {
    showBlockCount: true,
    showTimer: true,
    color: '#E53E3E',
  },
  shortcuts: {
    toggleFocus: 'Alt+Shift+F',
    quickBlock: 'Alt+Shift+B',
    openPopup: '',
  },
};

// =====================================================================
// Session / Timer Types
// =====================================================================

/**
 * A completed focus session.
 */
export interface FocusSession {
  /** Unique session ID */
  id: string;

  /** When the session started (epoch ms) */
  startedAt: number;

  /** When the session ended (epoch ms) */
  endedAt: number;

  /** Planned duration in minutes */
  plannedMinutes: number;

  /** Actual duration in minutes */
  actualMinutes: number;

  /** Whether the session was completed without early exit */
  completed: boolean;

  /** Number of blocked site visits during this session */
  blockedAttempts: number;

  /** Which sites were attempted during the session */
  attemptedDomains: string[];

  /** Tags/labels for the session (Pro) */
  tags: string[];

  /** Optional notes (Pro) */
  note: string;
}

/**
 * An in-progress focus session (stored in session storage).
 */
export interface ActiveSession {
  /** Unique session ID */
  id: string;

  /** When the session started */
  startedAt: number;

  /** Planned duration in minutes */
  plannedMinutes: number;

  /** Time remaining in seconds */
  remainingSeconds: number;

  /** Whether the session is paused */
  paused: boolean;

  /** Pause timestamp (if paused) */
  pausedAt: number | null;

  /** Total accumulated pause time in seconds */
  totalPausedSeconds: number;

  /** Running count of blocked attempts */
  blockedAttempts: number;

  /** Sites attempted during this session */
  attemptedDomains: string[];

  /** Current break state */
  onBreak: boolean;

  /** Number of completed pomodoro cycles in this session */
  completedCycles: number;
}

/**
 * Session history stored in chrome.storage.local.
 *
 * Storage key: "sessions"
 * Tier: local
 * Estimated size: ~200 bytes per session, ~18KB for 90 days (1/day avg)
 */
export interface SessionsData {
  /** Completed session history (last 90 days) */
  history: FocusSession[];

  /** Currently active session (also in session storage for fast access) */
  current: ActiveSession | null;

  /** Total completed sessions ever */
  totalCompleted: number;

  /** Total focus minutes ever */
  totalMinutes: number;
}

export const SESSIONS_DEFAULTS: SessionsData = {
  history: [],
  current: null,
  totalCompleted: 0,
  totalMinutes: 0,
};

// =====================================================================
// Streak Types
// =====================================================================

/**
 * Milestone definitions for streak achievements.
 */
export interface StreakMilestone {
  /** Number of days for this milestone */
  days: number;

  /** Display label */
  label: string;

  /** Whether the user has reached this milestone */
  achieved: boolean;

  /** When this milestone was first achieved */
  achievedAt: number | null;
}

/**
 * Streak tracking data.
 *
 * Storage key: "streaks"
 * Tier: local (primary), sync (Pro)
 * Estimated size: ~500 bytes
 */
export interface StreakData {
  /** Current consecutive days with at least one completed session */
  current: number;

  /** Longest streak ever achieved */
  longest: number;

  /** Date string (YYYY-MM-DD) of the last day a session was completed */
  lastActiveDate: string;

  /** Streak milestones */
  milestones: StreakMilestone[];

  /** Whether a grace period has been used this streak (1 missed day allowed) */
  graceUsed: boolean;

  /** Vacation mode: streak is frozen, not counting or breaking */
  vacationMode: boolean;

  /** When vacation mode was activated */
  vacationStartDate: string | null;
}

export const STREAK_DEFAULTS: StreakData = {
  current: 0,
  longest: 0,
  lastActiveDate: '',
  milestones: [
    { days: 3, label: 'Getting Started', achieved: false, achievedAt: null },
    { days: 7, label: 'One Week Strong', achieved: false, achievedAt: null },
    { days: 14, label: 'Two Week Warrior', achieved: false, achievedAt: null },
    { days: 30, label: 'Monthly Master', achieved: false, achievedAt: null },
    { days: 60, label: 'Focus Champion', achieved: false, achievedAt: null },
    { days: 90, label: 'Quarterly Legend', achieved: false, achievedAt: null },
    { days: 180, label: 'Half-Year Hero', achieved: false, achievedAt: null },
    { days: 365, label: 'Annual Achiever', achieved: false, achievedAt: null },
  ],
  graceUsed: false,
  vacationMode: false,
  vacationStartDate: null,
};

// =====================================================================
// Focus Score Types
// =====================================================================

/**
 * Factors that contribute to the daily focus score (0-100).
 */
export interface ScoreFactors {
  /** Points from completed sessions (max 40) */
  sessionsCompleted: number;

  /** Points from total focus time (max 25) */
  focusTime: number;

  /** Points from blocked site resistance (max 15) */
  resistance: number;

  /** Points from maintaining streak (max 10) */
  streakBonus: number;

  /** Points from consistency (same time each day) (max 10) */
  consistency: number;
}

export interface DailyScore {
  /** Date string (YYYY-MM-DD) */
  date: string;

  /** Composite score (0-100) */
  score: number;

  /** Breakdown of factors */
  factors: ScoreFactors;
}

/**
 * Focus score tracking.
 *
 * Storage key: "focusScore"
 * Tier: local
 * Estimated size: ~100 bytes per day, ~9KB for 90 days
 */
export interface FocusScoreData {
  /** Current day's score (computed, updates throughout the day) */
  current: number;

  /** Current day's factor breakdown */
  currentFactors: ScoreFactors;

  /** Daily score history (last 90 days) */
  history: DailyScore[];

  /** All-time high score */
  highScore: number;

  /** Date of all-time high */
  highScoreDate: string;
}

export const FOCUS_SCORE_DEFAULTS: FocusScoreData = {
  current: 0,
  currentFactors: {
    sessionsCompleted: 0,
    focusTime: 0,
    resistance: 0,
    streakBonus: 0,
    consistency: 0,
  },
  history: [],
  highScore: 0,
  highScoreDate: '',
};

// =====================================================================
// Analytics Types
// =====================================================================

/**
 * A single analytics event in the rolling buffer.
 */
export interface AnalyticsEvent {
  /** Event type identifier */
  type: string;

  /** When the event occurred (epoch ms) */
  timestamp: number;

  /** Event-specific payload */
  data: Record<string, unknown>;
}

/**
 * Analytics data -- rolling buffer of the last 500 events.
 *
 * Storage key: "analytics"
 * Tier: local
 * Estimated size: ~100 bytes per event, ~50KB at capacity
 */
export interface AnalyticsData {
  /** Rolling event buffer (max 500 events) */
  events: AnalyticsEvent[];

  /** Timestamp of last pruning operation */
  lastPruned: number;

  /** Daily aggregated stats (more compact than raw events) */
  dailyStats: Record<string, {
    blockedAttempts: number;
    sessionsCompleted: number;
    totalFocusMinutes: number;
    topBlockedDomains: Record<string, number>;
  }>;
}

export const ANALYTICS_DEFAULTS: AnalyticsData = {
  events: [],
  lastPruned: 0,
  dailyStats: {},
};

// =====================================================================
// License Types
// =====================================================================

export type LicenseTier = 'free' | 'pro' | 'trial';

/**
 * License and subscription data.
 *
 * Storage key: "license"
 * Tier: local
 * Estimated size: ~300 bytes
 */
export interface LicenseData {
  /** Current license tier */
  tier: LicenseTier;

  /** License key (Pro only) */
  key: string | null;

  /** Expiry timestamp (Pro/trial) */
  expiry: number | null;

  /** Cached license validation result */
  cached: {
    valid: boolean;
    checkedAt: number;
    features: string[];
  };

  /** Last time the license was verified with the server */
  lastVerified: number;

  /** Whether the user has seen the Pro upgrade prompt */
  upgradePromptSeen: boolean;

  /** Number of times the upgrade prompt has been dismissed */
  upgradePromptDismissals: number;
}

export const LICENSE_DEFAULTS: LicenseData = {
  tier: 'free',
  key: null,
  expiry: null,
  cached: {
    valid: true,
    checkedAt: 0,
    features: ['basic_blocking', 'single_schedule', 'focus_timer'],
  },
  lastVerified: 0,
  upgradePromptSeen: false,
  upgradePromptDismissals: 0,
};

// =====================================================================
// Onboarding Types
// =====================================================================

/**
 * Onboarding progress tracking.
 *
 * Storage key: "onboarding"
 * Tier: local
 * Estimated size: ~200 bytes
 */
export interface OnboardingData {
  /** Whether the full onboarding flow has been completed */
  completed: boolean;

  /** Index of the current/last-viewed onboarding slide */
  currentSlide: number;

  /** Feature discovery tooltips the user has seen */
  seenFeatures: string[];

  /** Whether the user completed the initial blocklist setup */
  initialBlocklistConfigured: boolean;

  /** Whether the user has started their first focus session */
  firstSessionCompleted: boolean;

  /** Extension install timestamp */
  installedAt: number;

  /** Extension version at install time */
  installedVersion: string;
}

export const ONBOARDING_DEFAULTS: OnboardingData = {
  completed: false,
  currentSlide: 0,
  seenFeatures: [],
  initialBlocklistConfigured: false,
  firstSessionCompleted: false,
  installedAt: 0,
  installedVersion: '',
};

// =====================================================================
// Rules Tracking Types
// =====================================================================

/**
 * Tracking data for active DNR rules.
 * Used to rebuild the RuleEngine's in-memory cache after SW restart.
 *
 * Storage key: "rules"
 * Tier: local
 * Estimated size: ~4 bytes per rule ID, ~120KB at max capacity
 */
export interface RulesTrackingData {
  /** IDs of all active dynamic rules */
  dynamicIds: number[];

  /** IDs of enabled static rulesets */
  staticEnabled: string[];

  /** Timestamp of last rule generation */
  lastGenerated: number;
}

export const RULES_TRACKING_DEFAULTS: RulesTrackingData = {
  dynamicIds: [],
  staticEnabled: [],
  lastGenerated: 0,
};

// =====================================================================
// Schedule Types
// =====================================================================

/**
 * A blocking schedule definition.
 */
export interface Schedule {
  /** Unique schedule ID */
  id: string;

  /** User-assigned name (e.g., "Work Hours") */
  name: string;

  /** Sites to block during this schedule */
  sites: string[];

  /** Days of the week as bit flags (see DAY_FLAGS) */
  days: number;

  /** Start time as minutes from midnight (e.g., 540 = 9:00 AM) */
  startMinutes: number;

  /** End time as minutes from midnight (e.g., 1020 = 5:00 PM) */
  endMinutes: number;

  /** Whether this schedule is enabled */
  enabled: boolean;

  /** When this schedule was created */
  createdAt: number;

  /** Category rulesets to enable during this schedule */
  enableCategories: string[];
}

/**
 * Data payload for schedule rule activation.
 */
export interface ScheduleData {
  id: string;
  sites: string[];
}

/**
 * Schedule storage.
 *
 * Storage key: "schedules"
 * Tier: local (primary), sync (Pro, compressed)
 * Estimated size: ~200 bytes per schedule
 */
export interface SchedulesStorageData {
  /** All schedule definitions */
  items: Schedule[];

  /** ID of the currently active schedule (null if none) */
  active: string | null;
}

export const SCHEDULES_DEFAULTS: SchedulesStorageData = {
  items: [],
  active: null,
};

// =====================================================================
// Nuclear Mode Config
// =====================================================================

/**
 * Nuclear Mode configuration (stored separately from settings
 * so it can be used to re-create rules if tampered with).
 *
 * Storage key: "nuclearConfig"
 * Tier: local
 * Estimated size: ~500 bytes
 */
export interface NuclearConfig {
  /** Domains to whitelist (allow) during nuclear mode */
  whitelist: string[];

  /** Duration in minutes */
  durationMinutes: number;

  /** SHA-256 hash of the emergency exit password */
  passwordHash: string | null;

  /** When nuclear mode was activated */
  activatedAt: number;
}

export const NUCLEAR_CONFIG_DEFAULTS: NuclearConfig = {
  whitelist: [],
  durationMinutes: 60,
  passwordHash: null,
  activatedAt: 0,
};

// =====================================================================
// Monitoring Types
// =====================================================================

/**
 * Extension health monitoring data.
 *
 * Storage key: "monitoring"
 * Tier: local
 * Estimated size: ~2KB
 */
export interface MonitoringData {
  /** Queue of errors to report */
  errorQueue: Array<{
    message: string;
    stack?: string;
    timestamp: number;
    context: string;
  }>;

  /** Memory usage samples (for leak detection) */
  memorySamples: Array<{
    timestamp: number;
    usedJSHeapSize: number;
    totalJSHeapSize: number;
  }>;

  /** Service worker lifecycle stats */
  swStats: {
    lastWakeAt: number;
    wakeCount: number;
    lastSleepAt: number;
    averageActiveMs: number;
  };

  /** Whether debug mode is enabled (verbose logging) */
  debugMode: boolean;

  /** Performance timing samples */
  performanceSamples: Array<{
    operation: string;
    durationMs: number;
    timestamp: number;
  }>;
}

export const MONITORING_DEFAULTS: MonitoringData = {
  errorQueue: [],
  memorySamples: [],
  swStats: {
    lastWakeAt: 0,
    wakeCount: 0,
    lastSleepAt: 0,
    averageActiveMs: 0,
  },
  debugMode: false,
  performanceSamples: [],
};

// =====================================================================
// Sounds & Notification Storage Types
// =====================================================================

/**
 * Sound preferences (subset of settings, stored separately for
 * quick access by the notification system).
 *
 * Storage key: "sounds"
 * Tier: session (cached from settings for fast access)
 * Estimated size: ~100 bytes
 */
export interface SoundsCache {
  enabled: boolean;
  timerComplete: TimerSound;
  focusStart: TimerSound;
  volume: number;
}

/**
 * Notification queue for deferred notifications.
 *
 * Storage key: "notifications"
 * Tier: session
 * Estimated size: ~200 bytes per queued notification
 */
export interface NotificationsData {
  /** Queued notifications waiting for quiet hours to end */
  queue: Array<{
    id: string;
    title: string;
    message: string;
    scheduledFor: number;
  }>;

  /** Last notification sent (to prevent duplicates) */
  lastSentId: string | null;
  lastSentAt: number;
}

export const NOTIFICATIONS_DEFAULTS: NotificationsData = {
  queue: [],
  lastSentId: null,
  lastSentAt: 0,
};

// =====================================================================
// Master Storage Schema Map
// =====================================================================

/**
 * Complete map of all storage keys, their types, defaults,
 * tiers, and size estimates.
 *
 * This is the single source of truth used by StorageManager
 * for type-safe access, default values, and quota monitoring.
 */
export interface StorageSchema {
  // --- chrome.storage.local ---
  blocklist: BlocklistData;
  settings: SettingsData;
  sessions: SessionsData;
  streaks: StreakData;
  focusScore: FocusScoreData;
  analytics: AnalyticsData;
  license: LicenseData;
  onboarding: OnboardingData;
  rules: RulesTrackingData;
  schedules: SchedulesStorageData;
  nuclearConfig: NuclearConfig;
  monitoring: MonitoringData;

  // --- chrome.storage.session ---
  activeSession: ActiveSession | null;
  soundsCache: SoundsCache;
  notifications: NotificationsData;
  uiState: Record<string, unknown>;
}

/**
 * Default values for every storage key.
 * Used by StorageManager.get() when a key has never been set.
 */
export const STORAGE_DEFAULTS: { [K in keyof StorageSchema]: StorageSchema[K] } = {
  blocklist: BLOCKLIST_DEFAULTS,
  settings: SETTINGS_DEFAULTS,
  sessions: SESSIONS_DEFAULTS,
  streaks: STREAK_DEFAULTS,
  focusScore: FOCUS_SCORE_DEFAULTS,
  analytics: ANALYTICS_DEFAULTS,
  license: LICENSE_DEFAULTS,
  onboarding: ONBOARDING_DEFAULTS,
  rules: RULES_TRACKING_DEFAULTS,
  schedules: SCHEDULES_DEFAULTS,
  nuclearConfig: NUCLEAR_CONFIG_DEFAULTS,
  monitoring: MONITORING_DEFAULTS,
  activeSession: null,
  soundsCache: { enabled: true, timerComplete: 'bell', focusStart: 'chime', volume: 70 },
  notifications: NOTIFICATIONS_DEFAULTS,
  uiState: {},
};

/**
 * Which storage tier each key belongs to.
 * Keys listed under 'sync' are only synced for Pro users.
 */
export const STORAGE_TIERS: Record<keyof StorageSchema, StorageTier[]> = {
  blocklist: ['local', 'sync'],
  settings: ['local', 'sync'],
  sessions: ['local'],
  streaks: ['local', 'sync'],
  focusScore: ['local'],
  analytics: ['local'],
  license: ['local'],
  onboarding: ['local'],
  rules: ['local'],
  schedules: ['local', 'sync'],
  nuclearConfig: ['local'],
  monitoring: ['local'],
  activeSession: ['session'],
  soundsCache: ['session'],
  notifications: ['session'],
  uiState: ['session'],
};

/**
 * Approximate size estimates per key (in bytes) for quota monitoring.
 * These are rough maximums to help detect when we're approaching limits.
 */
export const STORAGE_SIZE_ESTIMATES: Record<keyof StorageSchema, number> = {
  blocklist: 5_000,       // ~100 sites max for Pro
  settings: 1_000,
  sessions: 20_000,       // ~90 days of sessions
  streaks: 500,
  focusScore: 10_000,     // ~90 days of scores
  analytics: 50_000,      // 500 events at ~100 bytes each
  license: 300,
  onboarding: 200,
  rules: 120_000,         // 30,000 rule IDs at 4 bytes each (extreme case)
  schedules: 2_000,       // ~10 schedules
  nuclearConfig: 500,
  monitoring: 2_000,
  activeSession: 500,
  soundsCache: 100,
  notifications: 1_000,
  uiState: 500,
};
```

---

## 5.3 Storage Manager

### File: `src/background/storage-manager.ts`

The `StorageManager` provides type-safe, centralized access to all Chrome storage operations. Every read and write in Focus Mode goes through this class to ensure consistent defaults, change tracking, quota monitoring, and migration support.

```typescript
// src/background/storage-manager.ts

import {
  StorageSchema,
  STORAGE_DEFAULTS,
  STORAGE_TIERS,
  STORAGE_SIZE_ESTIMATES,
  type StorageTier,
} from '../shared/storage-schema';

/**
 * Listener callback type for storage changes.
 */
type StorageChangeListener<K extends keyof StorageSchema> = (
  newValue: StorageSchema[K],
  oldValue: StorageSchema[K] | undefined
) => void;

/**
 * Options for the atomic update operation.
 */
interface AtomicUpdateOptions {
  /** Maximum retries if the value changed between read and write */
  maxRetries?: number;
  /** Delay between retries in ms */
  retryDelayMs?: number;
}

/**
 * StorageManager -- Type-safe wrapper around chrome.storage.
 *
 * Responsibilities:
 * - Type-safe get/set with generics tied to StorageSchema
 * - Automatic default value population for unset keys
 * - Batch operations for reading/writing multiple keys
 * - Typed change listeners with old/new value pairs
 * - Quota monitoring with configurable warning thresholds
 * - Atomic read-modify-write with retry logic
 * - Automatic tier routing (session vs local vs sync)
 *
 * Every storage operation in Focus Mode goes through this class.
 * Direct chrome.storage calls are prohibited outside of this module.
 */
export class StorageManager {
  private static instance: StorageManager | null = null;

  /** Registered change listeners by key */
  private listeners: Map<keyof StorageSchema, Set<StorageChangeListener<any>>> = new Map();

  /** Lock tracking for atomic operations */
  private locks: Set<keyof StorageSchema> = new Set();

  /** Quota warning threshold (percentage of 5MB local) */
  private static readonly QUOTA_WARNING_PERCENT = 80;
  private static readonly LOCAL_QUOTA_BYTES = 5_242_880; // 5MB
  private static readonly SYNC_QUOTA_BYTES = 102_400;    // 100KB

  private constructor() {
    // Register the global change listener that dispatches to key-specific listeners
    chrome.storage.onChanged.addListener(this.handleStorageChange.bind(this));
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // -------------------------------------------------------------------
  // Core Get / Set
  // -------------------------------------------------------------------

  /**
   * Get a value from storage with type safety and automatic defaults.
   *
   * @param key - Storage key (must be a key of StorageSchema)
   * @returns The stored value, or the default if not set
   *
   * @example
   * const blocklist = await storage.get('blocklist');
   * // Type: BlocklistData (never undefined)
   */
  async get<K extends keyof StorageSchema>(key: K): Promise<StorageSchema[K]> {
    const tier = this.getPrimaryTier(key);
    const area = this.getStorageArea(tier);

    const result = await area.get(key as string);
    const value = result[key as string];

    if (value === undefined) {
      return structuredClone(STORAGE_DEFAULTS[key]);
    }

    return value as StorageSchema[K];
  }

  /**
   * Set a value in storage with type safety.
   * Automatically writes to the correct storage tier.
   * Triggers change listeners if the value changed.
   *
   * @param key - Storage key
   * @param value - The value to store (must match the schema type)
   *
   * @example
   * await storage.set('settings', { ...settings, theme: 'dark' });
   */
  async set<K extends keyof StorageSchema>(
    key: K,
    value: StorageSchema[K]
  ): Promise<void> {
    const tier = this.getPrimaryTier(key);
    const area = this.getStorageArea(tier);

    await area.set({ [key]: value });
  }

  /**
   * Remove a key from storage, resetting it to its default value.
   */
  async remove<K extends keyof StorageSchema>(key: K): Promise<void> {
    const tier = this.getPrimaryTier(key);
    const area = this.getStorageArea(tier);
    await area.remove(key as string);
  }

  // -------------------------------------------------------------------
  // Batch Operations
  // -------------------------------------------------------------------

  /**
   * Get multiple keys in a single storage read.
   * More efficient than individual get() calls.
   *
   * @param keys - Array of storage keys to read
   * @returns Object with all requested values (defaults for unset keys)
   *
   * @example
   * const { blocklist, settings } = await storage.getMultiple(['blocklist', 'settings']);
   */
  async getMultiple<K extends keyof StorageSchema>(
    keys: K[]
  ): Promise<Pick<StorageSchema, K>> {
    // Group keys by tier for efficient batching
    const tierGroups = new Map<StorageTier, K[]>();

    for (const key of keys) {
      const tier = this.getPrimaryTier(key);
      const group = tierGroups.get(tier) ?? [];
      group.push(key);
      tierGroups.set(tier, group);
    }

    const result: Partial<StorageSchema> = {};

    for (const [tier, tierKeys] of tierGroups) {
      const area = this.getStorageArea(tier);
      const stored = await area.get(tierKeys as string[]);

      for (const key of tierKeys) {
        const value = stored[key as string];
        result[key] = value !== undefined
          ? value
          : structuredClone(STORAGE_DEFAULTS[key]);
      }
    }

    return result as Pick<StorageSchema, K>;
  }

  /**
   * Set multiple keys in a single storage write.
   * Groups keys by tier for efficient batching.
   *
   * @param data - Object with key-value pairs to write
   *
   * @example
   * await storage.setMultiple({
   *   settings: updatedSettings,
   *   blocklist: updatedBlocklist,
   * });
   */
  async setMultiple<K extends keyof StorageSchema>(
    data: Partial<Pick<StorageSchema, K>>
  ): Promise<void> {
    const tierGroups = new Map<StorageTier, Record<string, unknown>>();

    for (const [key, value] of Object.entries(data)) {
      const tier = this.getPrimaryTier(key as keyof StorageSchema);
      const group = tierGroups.get(tier) ?? {};
      group[key] = value;
      tierGroups.set(tier, group);
    }

    const writes = Array.from(tierGroups.entries()).map(([tier, items]) => {
      const area = this.getStorageArea(tier);
      return area.set(items);
    });

    await Promise.all(writes);
  }

  // -------------------------------------------------------------------
  // Change Listeners
  // -------------------------------------------------------------------

  /**
   * Register a listener for changes to a specific storage key.
   * The listener is called with the new and old values whenever
   * the key is modified (from any source, including sync).
   *
   * @param key - Storage key to watch
   * @param listener - Callback function
   * @returns Unsubscribe function
   *
   * @example
   * const unsubscribe = storage.onChange('blocklist', (newList, oldList) => {
   *   console.log('Blocklist changed:', newList.sites.length, 'sites');
   * });
   * // Later: unsubscribe();
   */
  onChange<K extends keyof StorageSchema>(
    key: K,
    listener: StorageChangeListener<K>
  ): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  /**
   * Internal handler for chrome.storage.onChanged events.
   * Dispatches changes to key-specific listeners.
   */
  private handleStorageChange(
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ): void {
    for (const [key, change] of Object.entries(changes)) {
      const listeners = this.listeners.get(key as keyof StorageSchema);
      if (!listeners || listeners.size === 0) continue;

      for (const listener of listeners) {
        try {
          listener(change.newValue, change.oldValue);
        } catch (error) {
          console.error(`[StorageManager] Listener error for "${key}":`, error);
        }
      }
    }
  }

  // -------------------------------------------------------------------
  // Atomic Updates
  // -------------------------------------------------------------------

  /**
   * Perform an atomic read-modify-write operation.
   *
   * Reads the current value, applies a transform function, and writes
   * the result. If the value changed between read and write (race condition),
   * retries the operation up to maxRetries times.
   *
   * @param key - Storage key to update
   * @param transform - Function that takes the current value and returns the new value
   * @param options - Retry configuration
   *
   * @example
   * // Atomically increment the blocked attempts counter
   * await storage.atomicUpdate('sessions', (sessions) => ({
   *   ...sessions,
   *   current: sessions.current
   *     ? { ...sessions.current, blockedAttempts: sessions.current.blockedAttempts + 1 }
   *     : null,
   * }));
   */
  async atomicUpdate<K extends keyof StorageSchema>(
    key: K,
    transform: (current: StorageSchema[K]) => StorageSchema[K],
    options: AtomicUpdateOptions = {}
  ): Promise<StorageSchema[K]> {
    const { maxRetries = 3, retryDelayMs = 50 } = options;

    // Acquire lock
    if (this.locks.has(key)) {
      // Wait for lock to release
      await this.waitForLock(key, maxRetries * retryDelayMs);
    }

    this.locks.add(key);

    try {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const current = await this.get(key);
        const updated = transform(current);

        // Verify the value hasn't changed since we read it
        const recheck = await this.get(key);
        if (JSON.stringify(current) !== JSON.stringify(recheck) && attempt < maxRetries) {
          console.warn(`[StorageManager] Atomic update conflict on "${String(key)}", retry ${attempt + 1}`);
          await this.sleep(retryDelayMs);
          continue;
        }

        await this.set(key, updated);
        return updated;
      }

      throw new Error(`Atomic update failed for "${String(key)}" after ${maxRetries} retries`);
    } finally {
      this.locks.delete(key);
    }
  }

  /**
   * Wait for a lock to be released.
   */
  private async waitForLock(key: keyof StorageSchema, timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (this.locks.has(key)) {
      if (Date.now() - start > timeoutMs) {
        console.warn(`[StorageManager] Lock timeout for "${String(key)}", proceeding`);
        this.locks.delete(key);
        return;
      }
      await this.sleep(10);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // -------------------------------------------------------------------
  // Quota Monitoring
  // -------------------------------------------------------------------

  /**
   * Get the current storage usage across all tiers.
   * Used for the Options page quota display and proactive warnings.
   */
  async getQuotaStatus(): Promise<{
    local: { used: number; max: number; percent: number; warning: boolean };
    sync: { used: number; max: number; percent: number; warning: boolean };
    session: { used: number; max: number; percent: number };
    breakdown: Record<string, number>;
  }> {
    // Get local storage usage
    const localUsage = await chrome.storage.local.getBytesInUse();

    // Get sync storage usage
    const syncUsage = await chrome.storage.sync.getBytesInUse();

    // Estimate per-key breakdown
    const breakdown: Record<string, number> = {};
    for (const [key, estimate] of Object.entries(STORAGE_SIZE_ESTIMATES)) {
      try {
        const keyUsage = await chrome.storage.local.getBytesInUse(key);
        breakdown[key] = keyUsage;
      } catch {
        breakdown[key] = estimate; // Fallback to estimate
      }
    }

    const localPercent = Math.round((localUsage / StorageManager.LOCAL_QUOTA_BYTES) * 100);
    const syncPercent = Math.round((syncUsage / StorageManager.SYNC_QUOTA_BYTES) * 100);

    return {
      local: {
        used: localUsage,
        max: StorageManager.LOCAL_QUOTA_BYTES,
        percent: localPercent,
        warning: localPercent >= StorageManager.QUOTA_WARNING_PERCENT,
      },
      sync: {
        used: syncUsage,
        max: StorageManager.SYNC_QUOTA_BYTES,
        percent: syncPercent,
        warning: syncPercent >= StorageManager.QUOTA_WARNING_PERCENT,
      },
      session: {
        used: 0, // Session storage doesn't expose bytesInUse
        max: 10_485_760, // 10MB
        percent: 0,
      },
      breakdown,
    };
  }

  /**
   * Proactively prune data to stay under quota.
   * Called when quota monitoring detects high usage.
   */
  async pruneIfNeeded(): Promise<{ pruned: boolean; freedBytes: number }> {
    const quota = await this.getQuotaStatus();
    if (!quota.local.warning) {
      return { pruned: false, freedBytes: 0 };
    }

    console.warn(
      `[StorageManager] Local storage at ${quota.local.percent}%, pruning...`
    );

    let freedBytes = 0;

    // 1. Prune analytics events (oldest first)
    const analytics = await this.get('analytics');
    if (analytics.events.length > 200) {
      const before = JSON.stringify(analytics.events).length;
      analytics.events = analytics.events.slice(-200);
      analytics.lastPruned = Date.now();
      await this.set('analytics', analytics);
      const after = JSON.stringify(analytics.events).length;
      freedBytes += before - after;
    }

    // 2. Prune old session history (keep last 60 days instead of 90)
    const sessions = await this.get('sessions');
    const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const beforeCount = sessions.history.length;
    sessions.history = sessions.history.filter(s => s.endedAt > sixtyDaysAgo);
    if (sessions.history.length < beforeCount) {
      await this.set('sessions', sessions);
      freedBytes += (beforeCount - sessions.history.length) * 200; // ~200 bytes per session
    }

    // 3. Prune old focus score history (keep last 60 days)
    const focusScore = await this.get('focusScore');
    const beforeScoreCount = focusScore.history.length;
    focusScore.history = focusScore.history.slice(-60);
    if (focusScore.history.length < beforeScoreCount) {
      await this.set('focusScore', focusScore);
      freedBytes += (beforeScoreCount - focusScore.history.length) * 100;
    }

    // 4. Prune monitoring data
    const monitoring = await this.get('monitoring');
    monitoring.errorQueue = monitoring.errorQueue.slice(-20);
    monitoring.memorySamples = monitoring.memorySamples.slice(-50);
    monitoring.performanceSamples = monitoring.performanceSamples.slice(-50);
    await this.set('monitoring', monitoring);

    // 5. Prune old daily stats from analytics
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const dateThreshold = new Date(thirtyDaysAgo).toISOString().split('T')[0];
    const updatedAnalytics = await this.get('analytics');
    for (const date of Object.keys(updatedAnalytics.dailyStats)) {
      if (date < dateThreshold) {
        delete updatedAnalytics.dailyStats[date];
        freedBytes += 100;
      }
    }
    await this.set('analytics', updatedAnalytics);

    console.log(`[StorageManager] Pruned ~${freedBytes.toLocaleString()} bytes`);
    return { pruned: true, freedBytes };
  }

  // -------------------------------------------------------------------
  // Tier Routing
  // -------------------------------------------------------------------

  /**
   * Get the primary storage tier for a key.
   * Session keys use session storage; everything else uses local.
   */
  private getPrimaryTier(key: keyof StorageSchema): StorageTier {
    const tiers = STORAGE_TIERS[key];
    if (tiers.includes('session')) return 'session';
    return 'local';
  }

  /**
   * Get the chrome.storage area for a given tier.
   */
  private getStorageArea(tier: StorageTier): chrome.storage.StorageArea {
    switch (tier) {
      case 'session': return chrome.storage.session;
      case 'sync': return chrome.storage.sync;
      case 'local':
      default: return chrome.storage.local;
    }
  }

  // -------------------------------------------------------------------
  // Reset & Debug
  // -------------------------------------------------------------------

  /**
   * Reset all storage to defaults.
   * Used for extension reset or dev/testing.
   */
  async resetAll(): Promise<void> {
    await chrome.storage.local.clear();
    await chrome.storage.session.clear();
    // Do NOT clear sync -- that would affect other devices

    // Re-set defaults
    const localDefaults: Record<string, unknown> = {};
    for (const [key, tiers] of Object.entries(STORAGE_TIERS)) {
      if ((tiers as StorageTier[]).includes('local')) {
        localDefaults[key] = STORAGE_DEFAULTS[key as keyof StorageSchema];
      }
    }
    await chrome.storage.local.set(localDefaults);

    console.log('[StorageManager] All storage reset to defaults');
  }

  /**
   * Export all storage data as a JSON object.
   * Used for data export/backup feature.
   */
  async exportAll(): Promise<Record<string, unknown>> {
    const allKeys = Object.keys(STORAGE_DEFAULTS) as (keyof StorageSchema)[];
    const localKeys = allKeys.filter(k =>
      STORAGE_TIERS[k].includes('local')
    );

    const localData = await chrome.storage.local.get(localKeys as string[]);
    return localData;
  }

  /**
   * Import storage data from a JSON export.
   * Used for data restore/import feature.
   */
  async importAll(data: Record<string, unknown>): Promise<{
    imported: string[];
    skipped: string[];
    errors: string[];
  }> {
    const imported: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (!(key in STORAGE_DEFAULTS)) {
        skipped.push(key);
        continue;
      }

      try {
        await this.set(
          key as keyof StorageSchema,
          value as StorageSchema[keyof StorageSchema]
        );
        imported.push(key);
      } catch (error) {
        errors.push(`${key}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { imported, skipped, errors };
  }
}
```

---

## 5.4 Data Migration System

### File: `src/background/migration-manager.ts`

The migration system handles schema changes between extension versions. When the extension updates (detected via `chrome.runtime.onInstalled` with `reason === 'update'`), the migration manager runs any pending migrations in sequence.

```typescript
// src/background/migration-manager.ts

import { StorageManager } from './storage-manager';

/**
 * A single migration step.
 * Each migration has a version tag, an "up" function, and an optional "down" function.
 */
interface Migration {
  /** Semantic version this migration targets (e.g., "1.1.0") */
  version: string;

  /** Human-readable description of what this migration does */
  description: string;

  /** Forward migration function */
  up: (storage: StorageManager) => Promise<void>;

  /** Rollback function (optional, best-effort) */
  down?: (storage: StorageManager) => Promise<void>;
}

/**
 * Internal migration state, stored in chrome.storage.local
 * under the key "__migration_state".
 */
interface MigrationState {
  /** The last successfully applied migration version */
  currentVersion: string;

  /** History of applied migrations */
  history: Array<{
    version: string;
    appliedAt: number;
    direction: 'up' | 'down';
    success: boolean;
    error?: string;
  }>;
}

const MIGRATION_STATE_KEY = '__migration_state';

/**
 * MigrationManager -- Versioned data migration system.
 *
 * How it works:
 * 1. Extension updates trigger chrome.runtime.onInstalled with reason "update"
 * 2. Service worker calls MigrationManager.runPendingMigrations()
 * 3. Manager compares stored version against registered migrations
 * 4. Runs any migrations newer than the stored version, in order
 * 5. Records each migration result in the migration history
 *
 * Migrations are idempotent where possible -- running the same migration
 * twice should not cause errors or data corruption.
 */
export class MigrationManager {
  private static instance: MigrationManager | null = null;
  private storage: StorageManager;

  /**
   * Migration registry: all known migrations, in version order.
   * New migrations are added to the end of this array.
   */
  private migrations: Migration[] = [];

  private constructor() {
    this.storage = StorageManager.getInstance();
    this.registerMigrations();
  }

  static getInstance(): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager();
    }
    return MigrationManager.instance;
  }

  /**
   * Register all known migrations.
   * Each migration transforms data from the previous version's schema
   * to the new version's schema.
   */
  private registerMigrations(): void {
    // -----------------------------------------------------------------
    // v1.0.0 -> v1.1.0: Add focus score system
    // -----------------------------------------------------------------
    this.migrations.push({
      version: '1.1.0',
      description: 'Add focus score tracking and daily score history',
      up: async (storage) => {
        // Check if focusScore already exists (idempotent)
        const existing = await storage.get('focusScore');
        if (existing && existing.history && existing.history.length > 0) {
          return; // Already migrated
        }

        // Initialize focus score from existing session data
        const sessions = await storage.get('sessions');
        const score = {
          current: 0,
          currentFactors: {
            sessionsCompleted: 0,
            focusTime: 0,
            resistance: 0,
            streakBonus: 0,
            consistency: 0,
          },
          history: [] as Array<{ date: string; score: number; factors: any }>,
          highScore: 0,
          highScoreDate: '',
        };

        // Backfill scores from session history (if available)
        if (sessions.history.length > 0) {
          const byDate = new Map<string, typeof sessions.history>();

          for (const session of sessions.history) {
            const date = new Date(session.endedAt).toISOString().split('T')[0];
            const daySessions = byDate.get(date) ?? [];
            daySessions.push(session);
            byDate.set(date, daySessions);
          }

          for (const [date, daySessions] of byDate) {
            const completed = daySessions.filter(s => s.completed).length;
            const totalMinutes = daySessions.reduce((sum, s) => sum + s.actualMinutes, 0);

            const dayScore = Math.min(100, completed * 10 + Math.floor(totalMinutes / 5));
            score.history.push({
              date,
              score: dayScore,
              factors: {
                sessionsCompleted: Math.min(40, completed * 10),
                focusTime: Math.min(25, Math.floor(totalMinutes / 10)),
                resistance: 0,
                streakBonus: 0,
                consistency: 0,
              },
            });

            if (dayScore > score.highScore) {
              score.highScore = dayScore;
              score.highScoreDate = date;
            }
          }
        }

        await storage.set('focusScore', score);
      },
      down: async (storage) => {
        await storage.remove('focusScore');
      },
    });

    // -----------------------------------------------------------------
    // v1.1.0 -> v1.2.0: Add streak milestones and vacation mode
    // -----------------------------------------------------------------
    this.migrations.push({
      version: '1.2.0',
      description: 'Add streak milestones and vacation mode to streak data',
      up: async (storage) => {
        const streaks = await storage.get('streaks');

        // Add milestones if not present
        if (!streaks.milestones || streaks.milestones.length === 0) {
          const milestones = [
            { days: 3, label: 'Getting Started', achieved: false, achievedAt: null as number | null },
            { days: 7, label: 'One Week Strong', achieved: false, achievedAt: null as number | null },
            { days: 14, label: 'Two Week Warrior', achieved: false, achievedAt: null as number | null },
            { days: 30, label: 'Monthly Master', achieved: false, achievedAt: null as number | null },
            { days: 60, label: 'Focus Champion', achieved: false, achievedAt: null as number | null },
            { days: 90, label: 'Quarterly Legend', achieved: false, achievedAt: null as number | null },
            { days: 180, label: 'Half-Year Hero', achieved: false, achievedAt: null as number | null },
            { days: 365, label: 'Annual Achiever', achieved: false, achievedAt: null as number | null },
          ];

          // Mark milestones as achieved based on current longest streak
          for (const milestone of milestones) {
            if (streaks.longest >= milestone.days) {
              milestone.achieved = true;
              milestone.achievedAt = Date.now(); // Approximate
            }
          }

          await storage.set('streaks', {
            ...streaks,
            milestones,
            graceUsed: streaks.graceUsed ?? false,
            vacationMode: false,
            vacationStartDate: null,
          });
        }
      },
      down: async (storage) => {
        const streaks = await storage.get('streaks');
        const { milestones, vacationMode, vacationStartDate, ...rest } = streaks as any;
        await storage.set('streaks', rest);
      },
    });

    // -----------------------------------------------------------------
    // v1.2.0 -> v1.3.0: Add analytics daily stats aggregation
    // -----------------------------------------------------------------
    this.migrations.push({
      version: '1.3.0',
      description: 'Add daily stats aggregation to analytics for efficient querying',
      up: async (storage) => {
        const analytics = await storage.get('analytics');

        if (analytics.dailyStats && Object.keys(analytics.dailyStats).length > 0) {
          return; // Already has daily stats
        }

        // Build daily stats from existing events
        const dailyStats: Record<string, {
          blockedAttempts: number;
          sessionsCompleted: number;
          totalFocusMinutes: number;
          topBlockedDomains: Record<string, number>;
        }> = {};

        for (const event of analytics.events) {
          const date = new Date(event.timestamp).toISOString().split('T')[0];
          if (!dailyStats[date]) {
            dailyStats[date] = {
              blockedAttempts: 0,
              sessionsCompleted: 0,
              totalFocusMinutes: 0,
              topBlockedDomains: {},
            };
          }

          const day = dailyStats[date];

          if (event.type === 'site_blocked') {
            day.blockedAttempts++;
            const domain = (event.data as any).domain as string;
            if (domain) {
              day.topBlockedDomains[domain] = (day.topBlockedDomains[domain] ?? 0) + 1;
            }
          } else if (event.type === 'session_completed') {
            day.sessionsCompleted++;
            day.totalFocusMinutes += ((event.data as any).minutes as number) ?? 0;
          }
        }

        await storage.set('analytics', {
          ...analytics,
          dailyStats,
        });
      },
      down: async (storage) => {
        const analytics = await storage.get('analytics');
        await storage.set('analytics', {
          ...analytics,
          dailyStats: {},
        });
      },
    });
  }

  // -------------------------------------------------------------------
  // Migration Execution
  // -------------------------------------------------------------------

  /**
   * Run all pending migrations in sequence.
   * Called from the service worker's onInstalled handler when reason is "update".
   *
   * @param fromVersion - The previous extension version (from onInstalled details)
   * @returns Summary of migration results
   */
  async runPendingMigrations(fromVersion?: string): Promise<{
    ran: string[];
    skipped: string[];
    errors: Array<{ version: string; error: string }>;
  }> {
    const state = await this.getMigrationState();
    const currentVersion = fromVersion ?? state.currentVersion;

    const ran: string[] = [];
    const skipped: string[] = [];
    const errors: Array<{ version: string; error: string }> = [];

    console.log(`[MigrationManager] Running pending migrations from ${currentVersion}`);

    for (const migration of this.migrations) {
      if (this.compareVersions(migration.version, currentVersion) <= 0) {
        skipped.push(migration.version);
        continue;
      }

      console.log(`[MigrationManager] Running migration ${migration.version}: ${migration.description}`);

      try {
        await migration.up(this.storage);

        // Record success
        state.history.push({
          version: migration.version,
          appliedAt: Date.now(),
          direction: 'up',
          success: true,
        });
        state.currentVersion = migration.version;

        ran.push(migration.version);
        console.log(`[MigrationManager] Migration ${migration.version} completed`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[MigrationManager] Migration ${migration.version} FAILED: ${errorMsg}`);

        state.history.push({
          version: migration.version,
          appliedAt: Date.now(),
          direction: 'up',
          success: false,
          error: errorMsg,
        });

        errors.push({ version: migration.version, error: errorMsg });

        // Stop on failure -- don't run later migrations that may depend on this one
        break;
      }
    }

    // Persist migration state
    await this.saveMigrationState(state);

    console.log(
      `[MigrationManager] Complete. Ran: ${ran.length}, Skipped: ${skipped.length}, Errors: ${errors.length}`
    );

    return { ran, skipped, errors };
  }

  /**
   * Rollback the last N migrations.
   * Used for emergency rollback if a migration causes issues.
   *
   * @param count - Number of migrations to roll back (default: 1)
   */
  async rollback(count = 1): Promise<{
    rolledBack: string[];
    errors: Array<{ version: string; error: string }>;
  }> {
    const state = await this.getMigrationState();
    const rolledBack: string[] = [];
    const errors: Array<{ version: string; error: string }> = [];

    // Get the migrations to roll back (in reverse order)
    const appliedMigrations = this.migrations.filter(
      m => this.compareVersions(m.version, state.currentVersion) <= 0
    );
    const toRollBack = appliedMigrations.slice(-count).reverse();

    for (const migration of toRollBack) {
      if (!migration.down) {
        errors.push({
          version: migration.version,
          error: 'No rollback function defined',
        });
        continue;
      }

      console.log(`[MigrationManager] Rolling back ${migration.version}`);

      try {
        await migration.down(this.storage);

        state.history.push({
          version: migration.version,
          appliedAt: Date.now(),
          direction: 'down',
          success: true,
        });

        rolledBack.push(migration.version);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push({ version: migration.version, error: errorMsg });

        state.history.push({
          version: migration.version,
          appliedAt: Date.now(),
          direction: 'down',
          success: false,
          error: errorMsg,
        });
        break;
      }
    }

    // Update current version to the one before the rollbacks
    if (rolledBack.length > 0) {
      const remainingMigrations = this.migrations.filter(
        m => !rolledBack.includes(m.version) &&
             this.compareVersions(m.version, state.currentVersion) <= 0
      );
      state.currentVersion = remainingMigrations.length > 0
        ? remainingMigrations[remainingMigrations.length - 1].version
        : '1.0.0';
    }

    await this.saveMigrationState(state);
    return { rolledBack, errors };
  }

  // -------------------------------------------------------------------
  // Migration State Persistence
  // -------------------------------------------------------------------

  /**
   * Get the current migration state from storage.
   */
  private async getMigrationState(): Promise<MigrationState> {
    const result = await chrome.storage.local.get(MIGRATION_STATE_KEY);
    return result[MIGRATION_STATE_KEY] ?? {
      currentVersion: '1.0.0',
      history: [],
    };
  }

  /**
   * Save the migration state to storage.
   */
  private async saveMigrationState(state: MigrationState): Promise<void> {
    await chrome.storage.local.set({ [MIGRATION_STATE_KEY]: state });
  }

  // -------------------------------------------------------------------
  // Version Comparison
  // -------------------------------------------------------------------

  /**
   * Compare two semantic version strings.
   * Returns negative if a < b, 0 if a === b, positive if a > b.
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] ?? 0;
      const numB = partsB[i] ?? 0;
      if (numA !== numB) return numA - numB;
    }
    return 0;
  }

  // -------------------------------------------------------------------
  // Testing Helpers
  // -------------------------------------------------------------------

  /**
   * Run a specific migration in isolation for testing.
   * Does NOT update the migration state.
   */
  async testMigration(version: string, direction: 'up' | 'down' = 'up'): Promise<{
    success: boolean;
    error?: string;
    durationMs: number;
  }> {
    const migration = this.migrations.find(m => m.version === version);
    if (!migration) {
      return { success: false, error: `Migration ${version} not found`, durationMs: 0 };
    }

    const fn = direction === 'up' ? migration.up : migration.down;
    if (!fn) {
      return { success: false, error: `No ${direction} function for ${version}`, durationMs: 0 };
    }

    const start = performance.now();
    try {
      await fn(this.storage);
      return { success: true, durationMs: performance.now() - start };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs: performance.now() - start,
      };
    }
  }

  /**
   * Get the full migration history for debugging.
   */
  async getHistory(): Promise<MigrationState> {
    return this.getMigrationState();
  }
}
```

---

## 5.5 Storage Quota Management

Focus Mode operates within Chrome's strict storage quotas. The `StorageManager.pruneIfNeeded()` method (defined in Section 5.3) handles automatic pruning, but the overall quota strategy is broader.

### Quota Budget Allocation

```
chrome.storage.local: 5 MB total
  |-  blocklist:     ~5 KB   (100 sites max Pro)
  |-  settings:      ~1 KB
  |-  sessions:     ~20 KB   (90 days of history)
  |-  streaks:       ~0.5 KB
  |-  focusScore:   ~10 KB   (90 days of scores)
  |-  analytics:    ~50 KB   (500 events + daily stats)
  |-  license:       ~0.3 KB
  |-  onboarding:    ~0.2 KB
  |-  rules:       ~120 KB   (worst case: 30K rule IDs)
  |-  schedules:     ~2 KB
  |-  nuclearConfig:  ~0.5 KB
  |-  monitoring:    ~2 KB
  |---------------------------
     Total typical:  ~212 KB  (4.1% of quota)
     Total worst:    ~500 KB  (9.7% of quota)
     Headroom:       ~4.5 MB
```

### Pruning Strategy

Pruning activates when local storage exceeds 80% capacity. Items are pruned in order of least importance:

```typescript
// src/background/quota-manager.ts

/**
 * QuotaManager -- Monitors and manages storage quota across all tiers.
 *
 * Pruning priority (first to prune -> last to prune):
 * 1. Analytics events (reduce from 500 to 200)
 * 2. Monitoring data (trim error queue, memory samples)
 * 3. Daily analytics stats (keep last 30 days instead of all)
 * 4. Focus score history (keep 60 days instead of 90)
 * 5. Session history (keep 60 days instead of 90)
 * 6. User alert: "Storage is almost full, please export and clear data"
 */
export class QuotaManager {
  private static instance: QuotaManager | null = null;
  private storage: StorageManager;

  /** Periodic check interval (every 30 minutes) */
  private static readonly CHECK_INTERVAL_MS = 30 * 60 * 1000;

  private constructor(storage: StorageManager) {
    this.storage = storage;
  }

  static getInstance(storage: StorageManager): QuotaManager {
    if (!QuotaManager.instance) {
      QuotaManager.instance = new QuotaManager(storage);
    }
    return QuotaManager.instance;
  }

  /**
   * Set up periodic quota checks via chrome.alarms.
   */
  async setupPeriodicCheck(): Promise<void> {
    await chrome.alarms.create('quota_check', {
      periodInMinutes: 30,
    });
  }

  /**
   * Handle the periodic quota check alarm.
   */
  async handleCheck(): Promise<void> {
    const result = await this.storage.pruneIfNeeded();
    if (result.pruned) {
      console.log(`[QuotaManager] Pruned ${result.freedBytes} bytes`);
    }
  }

  /**
   * Get a user-friendly quota summary for the Options page.
   */
  async getDisplaySummary(): Promise<{
    localUsedMB: string;
    localMaxMB: string;
    localPercent: number;
    syncUsedKB: string;
    syncMaxKB: string;
    syncPercent: number;
    topConsumers: Array<{ key: string; sizeKB: string; percent: number }>;
    status: 'healthy' | 'warning' | 'critical';
    message: string;
  }> {
    const quota = await this.storage.getQuotaStatus();

    const topConsumers = Object.entries(quota.breakdown)
      .map(([key, bytes]) => ({
        key,
        sizeKB: (bytes / 1024).toFixed(1),
        percent: Math.round((bytes / quota.local.max) * 100),
      }))
      .sort((a, b) => parseFloat(b.sizeKB) - parseFloat(a.sizeKB))
      .slice(0, 5);

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let message = 'Storage usage is within normal limits.';

    if (quota.local.percent >= 90) {
      status = 'critical';
      message = 'Storage is almost full. Consider exporting your data and clearing old sessions.';
    } else if (quota.local.percent >= 80) {
      status = 'warning';
      message = 'Storage usage is high. Automatic pruning is active.';
    }

    return {
      localUsedMB: (quota.local.used / 1_048_576).toFixed(2),
      localMaxMB: (quota.local.max / 1_048_576).toFixed(2),
      localPercent: quota.local.percent,
      syncUsedKB: (quota.sync.used / 1024).toFixed(1),
      syncMaxKB: (quota.sync.max / 1024).toFixed(1),
      syncPercent: quota.sync.percent,
      topConsumers,
      status,
      message,
    };
  }

  /**
   * Compress data for sync storage.
   * Uses a simple JSON compression strategy to fit within 100KB.
   */
  async compressForSync<T>(data: T): Promise<string> {
    const json = JSON.stringify(data);

    // Use LZ-string style compression (simplified for extension context)
    // In production, use the 'lz-string' npm package
    const encoder = new TextEncoder();
    const encoded = encoder.encode(json);

    // Convert to base64 for sync-safe storage
    const binary = String.fromCharCode(...encoded);
    return btoa(binary);
  }

  /**
   * Decompress data from sync storage.
   */
  async decompressFromSync<T>(compressed: string): Promise<T> {
    const binary = atob(compressed);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    const json = decoder.decode(bytes);
    return JSON.parse(json);
  }
}
```

---

## 5.6 Sync Architecture (Pro)

Sync storage enables Pro users to share their Focus Mode configuration across all Chrome instances. The sync system handles the tight 100 KB quota, conflict resolution, and offline scenarios.

### What Syncs

Only essential, user-configured data syncs. Derived data (scores, analytics, monitoring) never syncs.

```
Synced (Pro only):
  - settings (compressed): ~400 bytes
  - blocklist (compressed): ~2 KB (100 sites)
  - schedules (compressed): ~1 KB (10 schedules)
  - streaks: ~200 bytes (so streaks don't break on device switch)
  -----------------------------------------------
  Total: ~3.6 KB (3.5% of 100 KB sync quota)
```

### Sync Manager

```typescript
// src/background/sync-manager.ts

import { StorageManager } from './storage-manager';
import { QuotaManager } from './quota-manager';
import type { StorageSchema } from '../shared/storage-schema';

/** Keys that are eligible for sync (Pro only) */
const SYNCABLE_KEYS: (keyof StorageSchema)[] = [
  'settings',
  'blocklist',
  'schedules',
  'streaks',
];

/**
 * SyncManager -- Handles bidirectional sync of Pro user data
 * across Chrome instances via chrome.storage.sync.
 *
 * Sync protocol:
 * 1. On local change: debounce 5s, then push to sync
 * 2. On startup: pull from sync, merge with local
 * 3. On chrome.storage.sync change event: pull and merge
 *
 * Conflict resolution: last-write-wins for scalar values,
 * union merge for arrays (e.g., blocklist sites).
 *
 * Quota management: data is compressed before writing to sync.
 * The 100 KB limit is monitored and enforced.
 */
export class SyncManager {
  private static instance: SyncManager | null = null;
  private storage: StorageManager;
  private quotaManager: QuotaManager;

  /** Debounce timer for sync writes */
  private syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Debounce delay in ms (wait 5s after last change before syncing) */
  private static readonly SYNC_DEBOUNCE_MS = 5_000;

  /** Keys that have pending changes to sync */
  private pendingSyncKeys: Set<keyof StorageSchema> = new Set();

  /** Whether sync is currently in progress */
  private syncing = false;

  /** Whether the user has Pro license (sync only works for Pro) */
  private proEnabled = false;

  private constructor(storage: StorageManager, quotaManager: QuotaManager) {
    this.storage = storage;
    this.quotaManager = quotaManager;
  }

  static getInstance(storage: StorageManager, quotaManager: QuotaManager): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager(storage, quotaManager);
    }
    return SyncManager.instance;
  }

  /**
   * Initialize the sync manager.
   * Sets up change listeners and performs initial sync pull.
   */
  async initialize(): Promise<void> {
    // Check if user has Pro license
    const license = await this.storage.get('license');
    this.proEnabled = license.tier === 'pro';

    if (!this.proEnabled) {
      console.log('[SyncManager] Sync disabled (not Pro)');
      return;
    }

    // Set up change listeners for syncable keys
    for (const key of SYNCABLE_KEYS) {
      this.storage.onChange(key, () => {
        if (!this.syncing) {
          this.queueSync(key);
        }
      });
    }

    // Listen for incoming sync changes from other devices
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync') {
        this.handleIncomingSyncChanges(changes);
      }
    });

    // Initial pull from sync
    await this.pullFromSync();

    console.log('[SyncManager] Initialized for Pro user');
  }

  // -------------------------------------------------------------------
  // Push (Local -> Sync)
  // -------------------------------------------------------------------

  /**
   * Queue a key for sync after the debounce period.
   * Multiple rapid changes are batched into a single sync write.
   */
  private queueSync(key: keyof StorageSchema): void {
    this.pendingSyncKeys.add(key);

    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    this.syncDebounceTimer = setTimeout(async () => {
      await this.flushSyncQueue();
    }, SyncManager.SYNC_DEBOUNCE_MS);
  }

  /**
   * Flush all pending sync changes to chrome.storage.sync.
   * Compresses data before writing to stay within the 100 KB quota.
   */
  private async flushSyncQueue(): Promise<void> {
    if (this.pendingSyncKeys.size === 0 || !this.proEnabled) return;

    this.syncing = true;
    const keysToSync = Array.from(this.pendingSyncKeys);
    this.pendingSyncKeys.clear();

    try {
      const syncData: Record<string, string> = {};

      for (const key of keysToSync) {
        const value = await this.storage.get(key);
        const compressed = await this.quotaManager.compressForSync(value);

        // Check individual item size (sync has per-item limits too)
        if (compressed.length > 8_192) {
          console.warn(`[SyncManager] Key "${String(key)}" exceeds 8KB item limit after compression, skipping`);
          continue;
        }

        syncData[`sync_${String(key)}`] = compressed;
      }

      // Add timestamp for conflict resolution
      syncData['sync_timestamp'] = String(Date.now());

      // Check total sync usage before writing
      const currentUsage = await chrome.storage.sync.getBytesInUse();
      const newDataSize = JSON.stringify(syncData).length;
      if (currentUsage + newDataSize > 100_000) {
        console.warn(`[SyncManager] Sync would exceed quota (${currentUsage} + ${newDataSize} > 100KB)`);
        return;
      }

      await chrome.storage.sync.set(syncData);

      console.log(
        `[SyncManager] Pushed ${keysToSync.length} keys to sync ` +
        `(${newDataSize} bytes)`
      );
    } catch (error) {
      console.error('[SyncManager] Push failed:', error);
      // Re-queue failed keys for retry
      for (const key of keysToSync) {
        this.pendingSyncKeys.add(key);
      }
    } finally {
      this.syncing = false;
    }
  }

  // -------------------------------------------------------------------
  // Pull (Sync -> Local)
  // -------------------------------------------------------------------

  /**
   * Pull data from sync storage and merge with local data.
   * Called on startup and when sync changes are detected.
   */
  async pullFromSync(): Promise<void> {
    if (!this.proEnabled) return;

    this.syncing = true;

    try {
      const syncKeys = SYNCABLE_KEYS.map(k => `sync_${String(k)}`);
      syncKeys.push('sync_timestamp');

      const syncData = await chrome.storage.sync.get(syncKeys);

      if (!syncData['sync_timestamp']) {
        console.log('[SyncManager] No sync data found');
        return;
      }

      for (const key of SYNCABLE_KEYS) {
        const syncKey = `sync_${String(key)}`;
        const compressed = syncData[syncKey];
        if (!compressed) continue;

        const remoteValue = await this.quotaManager.decompressFromSync(compressed);
        const localValue = await this.storage.get(key);

        const merged = this.mergeValues(key, localValue, remoteValue);
        await this.storage.set(key, merged);
      }

      console.log('[SyncManager] Pull complete');
    } catch (error) {
      console.error('[SyncManager] Pull failed:', error);
    } finally {
      this.syncing = false;
    }
  }

  // -------------------------------------------------------------------
  // Conflict Resolution
  // -------------------------------------------------------------------

  /**
   * Merge local and remote values for a given key.
   *
   * Strategy:
   * - Scalar values: last-write-wins (remote wins since it's from another device)
   * - Array values: union merge (combine both, deduplicate)
   * - Nested objects: deep merge with last-write-wins for leaf values
   */
  private mergeValues<K extends keyof StorageSchema>(
    key: K,
    local: StorageSchema[K],
    remote: StorageSchema[K]
  ): StorageSchema[K] {
    // Special merge strategies per key
    switch (key) {
      case 'blocklist':
        return this.mergeBlocklist(
          local as any,
          remote as any
        ) as StorageSchema[K];

      case 'schedules':
        return this.mergeSchedules(
          local as any,
          remote as any
        ) as StorageSchema[K];

      case 'streaks':
        return this.mergeStreaks(
          local as any,
          remote as any
        ) as StorageSchema[K];

      case 'settings':
        // Settings: remote wins (last-write-wins)
        return remote;

      default:
        // Default: remote wins
        return remote;
    }
  }

  /**
   * Merge blocklists: union of sites, OR of categories.
   * If a site exists in either list, it's in the merged list.
   */
  private mergeBlocklist(local: any, remote: any): any {
    // Union merge for sites array (deduplicate by domain)
    const siteDomains = new Set<string>();
    const mergedSites = [];

    for (const site of [...(local.sites ?? []), ...(remote.sites ?? [])]) {
      if (!siteDomains.has(site.domain)) {
        siteDomains.add(site.domain);
        mergedSites.push(site);
      }
    }

    // OR merge for categories (if enabled on either device, keep enabled)
    const mergedCategories: Record<string, boolean> = {};
    const allCategoryKeys = new Set([
      ...Object.keys(local.categories ?? {}),
      ...Object.keys(remote.categories ?? {}),
    ]);
    for (const cat of allCategoryKeys) {
      mergedCategories[cat] = (local.categories?.[cat] ?? false) ||
                               (remote.categories?.[cat] ?? false);
    }

    // Union merge for custom patterns
    const mergedPatterns = Array.from(new Set([
      ...(local.customPatterns ?? []),
      ...(remote.customPatterns ?? []),
    ]));

    return {
      sites: mergedSites,
      categories: mergedCategories,
      customPatterns: mergedPatterns,
      lastModified: Math.max(local.lastModified ?? 0, remote.lastModified ?? 0),
    };
  }

  /**
   * Merge schedules: union by ID, remote wins for conflicts on same ID.
   */
  private mergeSchedules(local: any, remote: any): any {
    const scheduleMap = new Map<string, any>();

    // Add local schedules
    for (const schedule of (local.items ?? [])) {
      scheduleMap.set(schedule.id, schedule);
    }

    // Remote wins for same-ID conflicts
    for (const schedule of (remote.items ?? [])) {
      scheduleMap.set(schedule.id, schedule);
    }

    return {
      items: Array.from(scheduleMap.values()),
      active: remote.active ?? local.active,
    };
  }

  /**
   * Merge streaks: take the higher current streak and longer longest streak.
   * This prevents a device that hasn't been used recently from resetting
   * a streak that's active on another device.
   */
  private mergeStreaks(local: any, remote: any): any {
    return {
      current: Math.max(local.current ?? 0, remote.current ?? 0),
      longest: Math.max(local.longest ?? 0, remote.longest ?? 0),
      // Use the more recent lastActiveDate
      lastActiveDate: (local.lastActiveDate ?? '') > (remote.lastActiveDate ?? '')
        ? local.lastActiveDate
        : remote.lastActiveDate,
      milestones: this.mergeMilestones(local.milestones ?? [], remote.milestones ?? []),
      graceUsed: local.graceUsed || remote.graceUsed,
      vacationMode: remote.vacationMode ?? local.vacationMode,
      vacationStartDate: remote.vacationStartDate ?? local.vacationStartDate,
    };
  }

  /**
   * Merge milestones: if achieved on either device, mark as achieved.
   */
  private mergeMilestones(local: any[], remote: any[]): any[] {
    const milestoneMap = new Map<number, any>();

    for (const m of local) {
      milestoneMap.set(m.days, m);
    }

    for (const m of remote) {
      const existing = milestoneMap.get(m.days);
      if (!existing) {
        milestoneMap.set(m.days, m);
      } else if (m.achieved && !existing.achieved) {
        milestoneMap.set(m.days, m); // Remote achieved first
      }
    }

    return Array.from(milestoneMap.values()).sort((a, b) => a.days - b.days);
  }

  // -------------------------------------------------------------------
  // Incoming Sync Changes
  // -------------------------------------------------------------------

  /**
   * Handle incoming changes from chrome.storage.sync (another device pushed).
   */
  private async handleIncomingSyncChanges(
    changes: Record<string, chrome.storage.StorageChange>
  ): Promise<void> {
    if (this.syncing) return; // Ignore our own writes

    console.log('[SyncManager] Incoming sync changes detected');
    await this.pullFromSync();
  }

  // -------------------------------------------------------------------
  // Sync Status
  // -------------------------------------------------------------------

  /**
   * Get the current sync status for the UI.
   */
  async getStatus(): Promise<{
    enabled: boolean;
    lastSyncAt: number | null;
    pendingChanges: number;
    quotaUsedKB: number;
    quotaMaxKB: number;
  }> {
    const syncData = await chrome.storage.sync.get('sync_timestamp');
    const lastSync = syncData['sync_timestamp']
      ? Number(syncData['sync_timestamp'])
      : null;

    const usedBytes = await chrome.storage.sync.getBytesInUse();

    return {
      enabled: this.proEnabled,
      lastSyncAt: lastSync,
      pendingChanges: this.pendingSyncKeys.size,
      quotaUsedKB: Math.round(usedBytes / 1024),
      quotaMaxKB: 100,
    };
  }
}
```
