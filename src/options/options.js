/**
 * Focus Mode - Blocker: Options Page
 * Reads/writes settings from chrome.storage.local and communicates
 * with the service worker for nuclear mode and schedule changes.
 */

import { getStorage, setStorage } from '../shared/storage.js';
import { getErrorLog } from '../shared/error-logger.js';
import { isPro } from '../shared/pro.js';

// ---------------------------------------------------------------------------
// DOM References
// ---------------------------------------------------------------------------

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
  // Theme
  themeRadios: $$('input[name="theme"]'),

  // Sound
  soundToggle: $('#soundToggle'),
  soundSelector: $('#soundSelector'),
  soundOptions: $('#soundOptions'),
  volumeRow: $('#volumeRow'),
  volumeSlider: $('#volumeSlider'),
  volumeValue: $('#volumeValue'),

  // Notifications
  mutingToggle: $('#mutingToggle'),

  // Schedule
  scheduleToggle: $('#scheduleToggle'),
  scheduleOptions: $('#scheduleOptions'),
  dayCheckboxes: $$('input[name="scheduleDay"]'),
  startTime: $('#startTime'),
  endTime: $('#endTime'),

  // Nuclear
  nuclearDurationRadios: $$('input[name="nuclearDuration"]'),
  nuclearActivateBtn: $('#nuclearActivateBtn'),
  nuclearStatus: $('#nuclearStatus'),
  nuclearTimeRemaining: $('#nuclearTimeRemaining'),

  // Dialog
  confirmDialog: $('#confirmDialog'),
  confirmDuration: $('#confirmDuration'),
  confirmCancel: $('#confirmCancel'),
  confirmActivate: $('#confirmActivate'),

  // About
  extensionVersion: $('#extensionVersion'),

  // Debug Log
  debugLogSection: $('#debugLogSection'),
  debugLogEmpty: $('#debugLogEmpty'),
  debugLogList: $('#debugLogList'),
  debugLogCopy: $('#debugLogCopy'),
  debugLogClear: $('#debugLogClear'),

  // Toast
  optionsToast: $('#optionsToast'),
  optionsToastMessage: $('#optionsToastMessage'),

  // Locked nuclear duration options
  lockedDurations: $$('.duration-option.locked'),

  // Upgrade section
  upgradeProSection: $('#upgradeProSection'),

  // Privacy & Data
  errorLoggingToggle: $('#errorLoggingToggle'),
  usageStatsToggle: $('#usageStatsToggle'),
  exportDataBtn: $('#exportDataBtn'),
  deleteAllDataBtn: $('#deleteAllDataBtn'),

  // Delete confirmation dialog
  deleteConfirmDialog: $('#deleteConfirmDialog'),
  deleteConfirmInput: $('#deleteConfirmInput'),
  deleteConfirmCancel: $('#deleteConfirmCancel'),
  deleteConfirmExecute: $('#deleteConfirmExecute'),

  // Footer
  privacyPolicyLink: $('#privacyPolicyLink'),
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentSettings = null;
let nuclearCheckInterval = null;
let privacyPreferences = null;

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Translate static strings from _locales via data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const msg = chrome.i18n.getMessage(el.dataset.i18n);
    if (msg) el.textContent = msg;
  });

  await loadSettings();
  await loadPrivacyPreferences();
  populateForm();
  bindEvents();
  applyTheme(currentSettings.theme || 'system');
  checkNuclearStatus();
  showVersion();
  initDebugLog();
  initLockedDurations();
  initPrivacyData();
  await initProSection();
}

// ---------------------------------------------------------------------------
// Options Toast
// ---------------------------------------------------------------------------

let optionsToastTimeout = null;

function showOptionsToast(text, durationMs = 2500) {
  if (!els.optionsToast || !els.optionsToastMessage) return;
  clearTimeout(optionsToastTimeout);
  els.optionsToastMessage.textContent = text;
  els.optionsToast.removeAttribute('hidden');
  void els.optionsToast.offsetWidth;
  els.optionsToast.classList.add('options-toast--visible');
  optionsToastTimeout = setTimeout(() => {
    els.optionsToast.classList.remove('options-toast--visible');
    setTimeout(() => {
      if (!els.optionsToast.classList.contains('options-toast--visible')) {
        els.optionsToast.setAttribute('hidden', '');
      }
    }, 300);
  }, durationMs);
}

// ---------------------------------------------------------------------------
// Locked Nuclear Duration Click Handlers
// ---------------------------------------------------------------------------

function initLockedDurations() {
  for (const label of els.lockedDurations) {
    label.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showOptionsToast('Upgrade to Pro for extended nuclear durations', 3000);
    });
  }
}

// ---------------------------------------------------------------------------
// Pro Upgrade Section
// ---------------------------------------------------------------------------

async function initProSection() {
  const proStatus = await isPro();
  if (proStatus && els.upgradeProSection) {
    // Hide upgrade section for Pro users
    els.upgradeProSection.hidden = true;
  }

  // Also unlock nuclear duration options for Pro users
  if (proStatus) {
    for (const label of els.lockedDurations) {
      label.classList.remove('locked');
      label.removeAttribute('aria-disabled');
      const input = label.querySelector('input');
      if (input) input.disabled = false;
    }
  }
}

// ---------------------------------------------------------------------------
// Load & Populate
// ---------------------------------------------------------------------------

async function loadSettings() {
  const { settings } = await getStorage('settings');
  currentSettings = settings;
}

function populateForm() {
  const s = currentSettings;

  // Theme
  for (const radio of els.themeRadios) {
    radio.checked = radio.value === (s.theme || 'system');
  }

  // Sound
  els.soundToggle.checked = s.soundEnabled || false;
  els.soundSelector.value = s.selectedSound || 'rain';
  els.volumeSlider.value = s.volume ?? 70;
  els.volumeValue.textContent = `${els.volumeSlider.value}%`;
  updateSoundVisibility(s.soundEnabled);

  // Notifications
  els.mutingToggle.checked = s.notificationMuting ?? true;

  // Schedule
  const schedule = s.schedule || null;
  const scheduleEnabled = schedule ? schedule.enabled : false;
  els.scheduleToggle.checked = scheduleEnabled;
  updateScheduleVisibility(scheduleEnabled);

  if (schedule) {
    const days = schedule.days || [];
    for (const cb of els.dayCheckboxes) {
      cb.checked = days.includes(parseInt(cb.value, 10));
    }
    els.startTime.value = schedule.startTime || '09:00';
    els.endTime.value = schedule.endTime || '17:00';
  }

  // Privacy controls
  if (privacyPreferences && els.errorLoggingToggle && els.usageStatsToggle) {
    els.errorLoggingToggle.checked = privacyPreferences.errorLogging !== false; // default true
    els.usageStatsToggle.checked = privacyPreferences.usageStats !== false; // default true
  }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

function bindEvents() {
  // Theme
  for (const radio of els.themeRadios) {
    radio.addEventListener('change', onThemeChange);
  }

  // Sound
  els.soundToggle.addEventListener('change', onSoundToggle);
  els.soundSelector.addEventListener('change', onSoundSelectorChange);
  els.volumeSlider.addEventListener('input', onVolumeInput);
  els.volumeSlider.addEventListener('change', onVolumeChange);

  // Notifications
  els.mutingToggle.addEventListener('change', onMutingToggle);

  // Schedule
  els.scheduleToggle.addEventListener('change', onScheduleToggle);
  for (const cb of els.dayCheckboxes) {
    cb.addEventListener('change', onScheduleChange);
  }
  els.startTime.addEventListener('change', onScheduleChange);
  els.endTime.addEventListener('change', onScheduleChange);

  // Nuclear
  els.nuclearActivateBtn.addEventListener('click', onNuclearClick);
  els.confirmCancel.addEventListener('click', onConfirmCancel);
  els.confirmActivate.addEventListener('click', onConfirmActivate);

  // Close dialog on backdrop click
  els.confirmDialog.addEventListener('click', (e) => {
    if (e.target === els.confirmDialog) {
      els.confirmDialog.close();
      els.nuclearActivateBtn.focus();
    }
  });

  // Restore focus when dialog closes via Escape
  els.confirmDialog.addEventListener('cancel', () => {
    els.nuclearActivateBtn.focus();
  });

  // Explicit focus trap within the dialog for Tab key
  els.confirmDialog.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = els.confirmDialog.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Privacy toggles
  if (els.errorLoggingToggle) {
    els.errorLoggingToggle.addEventListener('change', onErrorLoggingToggle);
  }
  if (els.usageStatsToggle) {
    els.usageStatsToggle.addEventListener('change', onUsageStatsToggle);
  }

  // Data management
  if (els.exportDataBtn) {
    els.exportDataBtn.addEventListener('click', onExportData);
  }
  if (els.deleteAllDataBtn) {
    els.deleteAllDataBtn.addEventListener('click', onDeleteAllDataClick);
  }

  // Footer links
  if (els.privacyPolicyLink) {
    els.privacyPolicyLink.addEventListener('click', onPrivacyPolicyClick);
  }
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

function onThemeChange(e) {
  const theme = e.target.value;
  currentSettings.theme = theme;
  saveSettings();
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// ---------------------------------------------------------------------------
// Sound Settings
// ---------------------------------------------------------------------------

function onSoundToggle() {
  const enabled = els.soundToggle.checked;
  currentSettings.soundEnabled = enabled;
  updateSoundVisibility(enabled);
  saveSettings();
}

function onSoundSelectorChange() {
  currentSettings.selectedSound = els.soundSelector.value;
  saveSettings();
}

function onVolumeInput() {
  els.volumeValue.textContent = `${els.volumeSlider.value}%`;
}

function onVolumeChange() {
  currentSettings.volume = parseInt(els.volumeSlider.value, 10);
  saveSettings();
}

function updateSoundVisibility(enabled) {
  els.soundOptions.hidden = !enabled;
  els.volumeRow.hidden = !enabled;
}

// ---------------------------------------------------------------------------
// Notification Muting
// ---------------------------------------------------------------------------

function onMutingToggle() {
  currentSettings.notificationMuting = els.mutingToggle.checked;
  saveSettings();
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

function onScheduleToggle() {
  const enabled = els.scheduleToggle.checked;
  updateScheduleVisibility(enabled);

  if (!currentSettings.schedule) {
    currentSettings.schedule = {
      enabled: false,
      days: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '17:00',
    };
    // Populate defaults into the form
    for (const cb of els.dayCheckboxes) {
      cb.checked = currentSettings.schedule.days.includes(parseInt(cb.value, 10));
    }
    els.startTime.value = currentSettings.schedule.startTime;
    els.endTime.value = currentSettings.schedule.endTime;
  }

  currentSettings.schedule.enabled = enabled;
  saveSettings();
  notifyScheduleChange();
}

function onScheduleChange() {
  if (!currentSettings.schedule) return;

  const days = [];
  for (const cb of els.dayCheckboxes) {
    if (cb.checked) days.push(parseInt(cb.value, 10));
  }

  const startTime = els.startTime.value;
  const endTime = els.endTime.value;

  // Validate: end must be after start
  if (endTime && startTime && endTime <= startTime) {
    els.endTime.setCustomValidity('End time must be after start time');
    els.endTime.reportValidity();
    return;
  } else {
    els.endTime.setCustomValidity('');
  }

  currentSettings.schedule.days = days;
  currentSettings.schedule.startTime = startTime;
  currentSettings.schedule.endTime = endTime;
  saveSettings();
  notifyScheduleChange();
}

function updateScheduleVisibility(enabled) {
  els.scheduleOptions.hidden = !enabled;
}

async function notifyScheduleChange() {
  try {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SCHEDULE',
      schedule: currentSettings.schedule,
    });
  } catch (err) {
    console.warn('Could not notify service worker of schedule change:', err);
  }
}

// ---------------------------------------------------------------------------
// Nuclear Mode
// ---------------------------------------------------------------------------

function getSelectedNuclearDuration() {
  for (const radio of els.nuclearDurationRadios) {
    if (radio.checked) return parseInt(radio.value, 10);
  }
  return 30;
}

function getDurationLabel(minutes) {
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes === 60) return '1 hour';
  if (minutes < 1440) return `${minutes / 60} hours`;
  return '24 hours';
}

function onNuclearClick() {
  const duration = getSelectedNuclearDuration();
  els.confirmDuration.textContent = getDurationLabel(duration);
  els.confirmDialog.showModal();
  // Focus the cancel button by default for safety
  els.confirmCancel.focus();
}

function onConfirmCancel() {
  els.confirmDialog.close();
  // Restore focus to the activate button
  els.nuclearActivateBtn.focus();
}

async function onConfirmActivate() {
  els.confirmDialog.close();

  const duration = getSelectedNuclearDuration();

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'ACTIVATE_NUCLEAR',
      duration: duration,
    });

    if (response && response.success) {
      // Reload settings to pick up nuclear state
      await loadSettings();
      checkNuclearStatus();
    }
  } catch (err) {
    console.error('Failed to activate nuclear mode:', err);
  }
}

async function checkNuclearStatus() {
  const { settings } = await getStorage('settings');
  const nuclear = settings.nuclearMode;

  if (nuclear && nuclear.active && Date.now() < nuclear.endsAt) {
    showNuclearActive(nuclear.endsAt);
  } else {
    hideNuclearActive();
  }
}

function showNuclearActive(endsAt) {
  els.nuclearStatus.hidden = false;
  els.nuclearActivateBtn.disabled = true;
  els.nuclearActivateBtn.textContent = 'Nuclear Mode Active';

  updateNuclearCountdown(endsAt);

  // Clear any existing interval
  if (nuclearCheckInterval) clearInterval(nuclearCheckInterval);
  nuclearCheckInterval = setInterval(() => {
    updateNuclearCountdown(endsAt);
  }, 1000);
}

function hideNuclearActive() {
  els.nuclearStatus.hidden = true;
  els.nuclearActivateBtn.disabled = false;
  els.nuclearActivateBtn.textContent = 'Activate Nuclear Mode';

  if (nuclearCheckInterval) {
    clearInterval(nuclearCheckInterval);
    nuclearCheckInterval = null;
  }
}

function updateNuclearCountdown(endsAt) {
  const remaining = endsAt - Date.now();

  if (remaining <= 0) {
    hideNuclearActive();
    return;
  }

  const totalSeconds = Math.ceil(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let timeStr;
  if (hours > 0) {
    timeStr = `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s remaining`;
  } else {
    timeStr = `${minutes}m ${String(seconds).padStart(2, '0')}s remaining`;
  }

  els.nuclearTimeRemaining.textContent = timeStr;
}

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

async function saveSettings() {
  // DATA: Stores user preferences (theme, sound, schedule, etc.). User-initiated. Not transmitted externally.
  await setStorage({ settings: currentSettings });
}

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------

function showVersion() {
  try {
    const manifest = chrome.runtime.getManifest();
    els.extensionVersion.textContent = manifest.version;
  } catch (err) {
    // Fallback if running outside extension context
    els.extensionVersion.textContent = '1.0.0';
  }
}

// ---------------------------------------------------------------------------
// Debug Log
// ---------------------------------------------------------------------------

function initDebugLog() {
  if (!els.debugLogSection) return;

  // Load log when the details element is opened
  els.debugLogSection.addEventListener('toggle', () => {
    if (els.debugLogSection.open) {
      renderDebugLog();
    }
  });

  els.debugLogCopy.addEventListener('click', onCopyLog);
  els.debugLogClear.addEventListener('click', onClearLog);
}

async function renderDebugLog() {
  try {
    const log = await getErrorLog();
    els.debugLogList.replaceChildren();

    // Show last 10 entries, newest first
    const recent = log.slice(-10).reverse();

    if (recent.length === 0) {
      els.debugLogEmpty.hidden = false;
      return;
    }

    els.debugLogEmpty.hidden = true;

    for (const entry of recent) {
      const li = document.createElement('li');
      li.className = 'debug-log__item';

      const time = document.createElement('span');
      time.className = 'debug-log__time';
      time.textContent = new Date(entry.ts).toLocaleString();

      const src = document.createElement('span');
      src.className = 'debug-log__source';
      src.textContent = `[${entry.src}]`;

      const msg = document.createElement('span');
      msg.textContent = entry.msg;

      li.appendChild(time);
      li.appendChild(src);
      li.appendChild(msg);
      els.debugLogList.appendChild(li);
    }
  } catch (err) {
    console.warn('Failed to load debug log:', err);
  }
}

async function onCopyLog() {
  try {
    const log = await getErrorLog();
    const text = log.map(e => {
      const t = new Date(e.ts).toISOString();
      return `${t} [${e.src}] ${e.msg}${e.stack ? '\n  ' + e.stack : ''}`;
    }).join('\n');

    await navigator.clipboard.writeText(text || 'No errors recorded.');
    els.debugLogCopy.textContent = 'Copied!';
    setTimeout(() => { els.debugLogCopy.textContent = 'Copy Log'; }, 1500);
  } catch (err) {
    console.warn('Failed to copy log:', err);
  }
}

async function onClearLog() {
  try {
    // DATA: Clears the local error log. User-initiated. Not transmitted externally.
    await chrome.storage.local.set({ errorLog: [] });
    els.debugLogList.replaceChildren();
    els.debugLogEmpty.hidden = false;
  } catch (err) {
    console.warn('Failed to clear log:', err);
  }
}

// ---------------------------------------------------------------------------
// Privacy Preferences
// ---------------------------------------------------------------------------

const PRIVACY_DEFAULTS = {
  errorLogging: true,
  usageStats: true,
};

async function loadPrivacyPreferences() {
  try {
    const result = await chrome.storage.local.get('privacyPreferences');
    privacyPreferences = result.privacyPreferences || { ...PRIVACY_DEFAULTS };
  } catch (err) {
    console.warn('Failed to load privacy preferences:', err);
    privacyPreferences = { ...PRIVACY_DEFAULTS };
  }
}

async function savePrivacyPreferences() {
  try {
    await chrome.storage.local.set({ privacyPreferences });
  } catch (err) {
    console.warn('Failed to save privacy preferences:', err);
  }
}

function onErrorLoggingToggle() {
  const enabled = els.errorLoggingToggle.checked;
  privacyPreferences.errorLogging = enabled;
  savePrivacyPreferences();

  if (!enabled) {
    // Clear the error log when disabling
    chrome.storage.local.set({ errorLog: [] });
    showOptionsToast('Error logging disabled. Log cleared.', 2500);
  } else {
    showOptionsToast('Error logging enabled.', 2000);
  }
}

function onUsageStatsToggle() {
  const enabled = els.usageStatsToggle.checked;
  privacyPreferences.usageStats = enabled;
  savePrivacyPreferences();

  if (!enabled) {
    showOptionsToast('Usage statistics disabled.', 2500);
  } else {
    showOptionsToast('Usage statistics enabled.', 2000);
  }
}

// ---------------------------------------------------------------------------
// Privacy & Data Section Init
// ---------------------------------------------------------------------------

function initPrivacyData() {
  if (!els.deleteConfirmDialog) return;

  // Delete confirmation dialog events
  els.deleteConfirmCancel.addEventListener('click', () => {
    els.deleteConfirmDialog.close();
    els.deleteConfirmInput.value = '';
    els.deleteConfirmExecute.disabled = true;
    els.deleteConfirmInput.classList.remove('delete-confirm-input--valid');
    els.deleteAllDataBtn.focus();
  });

  els.deleteConfirmInput.addEventListener('input', () => {
    const isValid = els.deleteConfirmInput.value.trim().toUpperCase() === 'DELETE';
    els.deleteConfirmExecute.disabled = !isValid;
    if (isValid) {
      els.deleteConfirmInput.classList.add('delete-confirm-input--valid');
    } else {
      els.deleteConfirmInput.classList.remove('delete-confirm-input--valid');
    }
  });

  els.deleteConfirmExecute.addEventListener('click', onDeleteAllDataConfirmed);

  // Close on backdrop click
  els.deleteConfirmDialog.addEventListener('click', (e) => {
    if (e.target === els.deleteConfirmDialog) {
      els.deleteConfirmDialog.close();
      els.deleteConfirmInput.value = '';
      els.deleteConfirmExecute.disabled = true;
      els.deleteConfirmInput.classList.remove('delete-confirm-input--valid');
      els.deleteAllDataBtn.focus();
    }
  });

  // Reset on Escape
  els.deleteConfirmDialog.addEventListener('cancel', () => {
    els.deleteConfirmInput.value = '';
    els.deleteConfirmExecute.disabled = true;
    els.deleteConfirmInput.classList.remove('delete-confirm-input--valid');
    els.deleteAllDataBtn.focus();
  });
}

// ---------------------------------------------------------------------------
// Data Export
// ---------------------------------------------------------------------------

async function onExportData() {
  try {
    els.exportDataBtn.disabled = true;
    els.exportDataBtn.textContent = 'Exporting...';

    // Gather all data from chrome.storage.local
    const localData = await chrome.storage.local.get(null);

    // Build the export object
    let extensionName = 'Focus Mode - Blocker';
    let extensionVersion = '1.0.0';
    try {
      const manifest = chrome.runtime.getManifest();
      extensionName = manifest.name;
      extensionVersion = manifest.version;
    } catch (_) { /* fallback values used */ }

    const exportData = {
      exportDate: new Date().toISOString(),
      extensionName: extensionName,
      extensionVersion: extensionVersion,
      localStorage: localData,
    };

    // Convert to pretty JSON
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `focus-mode-blocker-data-export-${dateStr}.json`;

    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    showOptionsToast('Data exported successfully.', 2500);
  } catch (err) {
    console.error('Failed to export data:', err);
    showOptionsToast('Export failed. Please try again.', 3000);
  } finally {
    els.exportDataBtn.disabled = false;
    // Use DOM APIs instead of innerHTML to satisfy CWS code safety requirements
    els.exportDataBtn.textContent = '';
    const svgNS = 'http://www.w3.org/2000/svg';
    const exportSvg = document.createElementNS(svgNS, 'svg');
    exportSvg.setAttribute('width', '16');
    exportSvg.setAttribute('height', '16');
    exportSvg.setAttribute('viewBox', '0 0 24 24');
    exportSvg.setAttribute('fill', 'none');
    exportSvg.setAttribute('stroke', 'currentColor');
    exportSvg.setAttribute('stroke-width', '2');
    exportSvg.setAttribute('stroke-linecap', 'round');
    exportSvg.setAttribute('stroke-linejoin', 'round');
    exportSvg.setAttribute('aria-hidden', 'true');
    const exportPath = document.createElementNS(svgNS, 'path');
    exportPath.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
    const exportPolyline = document.createElementNS(svgNS, 'polyline');
    exportPolyline.setAttribute('points', '7 10 12 15 17 10');
    const exportLine = document.createElementNS(svgNS, 'line');
    exportLine.setAttribute('x1', '12');
    exportLine.setAttribute('y1', '15');
    exportLine.setAttribute('x2', '12');
    exportLine.setAttribute('y2', '3');
    exportSvg.appendChild(exportPath);
    exportSvg.appendChild(exportPolyline);
    exportSvg.appendChild(exportLine);
    els.exportDataBtn.appendChild(exportSvg);
    els.exportDataBtn.appendChild(document.createTextNode(' Export My Data'));
  }
}

// ---------------------------------------------------------------------------
// Data Delete
// ---------------------------------------------------------------------------

function onDeleteAllDataClick() {
  // Reset the dialog state
  els.deleteConfirmInput.value = '';
  els.deleteConfirmExecute.disabled = true;
  els.deleteConfirmInput.classList.remove('delete-confirm-input--valid');

  // Open the confirmation dialog
  els.deleteConfirmDialog.showModal();
  els.deleteConfirmInput.focus();
}

async function onDeleteAllDataConfirmed() {
  // Double check the input value
  if (els.deleteConfirmInput.value.trim().toUpperCase() !== 'DELETE') {
    return;
  }

  try {
    els.deleteConfirmExecute.disabled = true;
    els.deleteConfirmExecute.textContent = 'Deleting...';

    // Clear all storage
    await chrome.storage.local.clear();

    els.deleteConfirmDialog.close();
    showOptionsToast('All data has been deleted. Reloading...', 2000);

    // Reload the page after a brief delay so the extension re-initializes
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (err) {
    console.error('Failed to delete data:', err);
    els.deleteConfirmExecute.disabled = false;
    els.deleteConfirmExecute.textContent = 'Delete Everything';
    showOptionsToast('Deletion failed. Please try again.', 3000);
  }
}

// ---------------------------------------------------------------------------
// Footer Links
// ---------------------------------------------------------------------------

function onPrivacyPolicyClick(e) {
  e.preventDefault();
  try {
    const url = chrome.runtime.getURL('src/legal/privacy-policy.html');
    window.open(url, '_blank');
  } catch (err) {
    console.warn('Failed to open privacy policy:', err);
  }
}
