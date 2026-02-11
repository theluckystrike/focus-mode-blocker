/**
 * Focus Mode - Blocker: Options Page
 * Reads/writes settings from chrome.storage.local and communicates
 * with the service worker for nuclear mode and schedule changes.
 */

import { getStorage, setStorage } from '../shared/storage.js';

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
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentSettings = null;
let nuclearCheckInterval = null;

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadSettings();
  populateForm();
  bindEvents();
  applyTheme(currentSettings.theme || 'system');
  checkNuclearStatus();
  showVersion();
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
    }
  });

  // Close dialog on Escape
  els.confirmDialog.addEventListener('cancel', (e) => {
    // Default behavior is fine; dialog closes.
  });
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
}

function onConfirmCancel() {
  els.confirmDialog.close();
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
