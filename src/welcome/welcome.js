/**
 * Focus Mode - Blocker: Welcome / Onboarding Page
 *
 * Three-step quick setup:
 * 1. Feature overview
 * 2. Add first blocked sites
 * 3. Summary and launch
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const selectedSites = new Set();
let currentStep = 1;

// ---------------------------------------------------------------------------
// DOM References
// ---------------------------------------------------------------------------

const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');
const stepIndicator = document.getElementById('step-indicator');

const btnStep1Next = document.getElementById('btn-step1-next');
const btnStep2Back = document.getElementById('btn-step2-back');
const btnStep2Next = document.getElementById('btn-step2-next');
const btnStep3Back = document.getElementById('btn-step3-back');
const btnStep3Finish = document.getElementById('btn-step3-finish');

const quickAddBtns = document.querySelectorAll('.quick-add-btn');
const welcomeSiteInput = document.getElementById('welcome-site-input');
const btnCustomAdd = document.getElementById('btn-custom-add');
const welcomeAddedList = document.getElementById('welcome-added-list');
const welcomeSitesUl = document.getElementById('welcome-sites-ul');
const readySiteCount = document.getElementById('ready-site-count');

// ---------------------------------------------------------------------------
// Step Navigation
// ---------------------------------------------------------------------------

function goToStep(step) {
  currentStep = step;

  step1.hidden = step !== 1;
  step2.hidden = step !== 2;
  step3.hidden = step !== 3;

  // Update step indicator dots
  const dots = stepIndicator.querySelectorAll('.step-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('step-dot--active', i < step);
  });
  stepIndicator.setAttribute('aria-valuenow', String(step));

  // If going to step 3, update the summary
  if (step === 3) {
    readySiteCount.textContent = String(selectedSites.size);
  }

  // Scroll to top
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------------------
// Site Management
// ---------------------------------------------------------------------------

/**
 * Clean a user-entered domain string.
 * @param {string} input
 * @returns {string|null}
 */
function cleanDomain(input) {
  if (!input) return null;
  let cleaned = input.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/^www\./, '');
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0].split(':')[0];
  if (!cleaned || !cleaned.includes('.')) return null;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(cleaned)) return null;
  return cleaned;
}

function addSite(domain) {
  if (selectedSites.has(domain)) return;
  selectedSites.add(domain);
  renderSiteList();
}

function removeSite(domain) {
  selectedSites.delete(domain);
  renderSiteList();

  // Update quick-add button state
  quickAddBtns.forEach(btn => {
    if (btn.dataset.domain === domain) {
      btn.classList.remove('quick-add-btn--selected');
    }
  });
}

function renderSiteList() {
  if (selectedSites.size === 0) {
    welcomeAddedList.hidden = true;
    return;
  }

  welcomeAddedList.hidden = false;
  welcomeSitesUl.replaceChildren();

  for (const domain of selectedSites) {
    const li = document.createElement('li');
    li.className = 'welcome-site-tag';

    const text = document.createTextNode(domain);
    li.appendChild(text);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.setAttribute('aria-label', 'Remove ' + domain);
    removeBtn.textContent = '\u00D7';
    removeBtn.addEventListener('click', () => removeSite(domain));
    li.appendChild(removeBtn);

    welcomeSitesUl.appendChild(li);
  }
}

// ---------------------------------------------------------------------------
// Save and Finish
// ---------------------------------------------------------------------------

async function saveBlocklistAndFinish() {
  if (selectedSites.size > 0) {
    try {
      const sitesArray = Array.from(selectedSites);
      await chrome.runtime.sendMessage({
        type: 'UPDATE_BLOCKLIST',
        sites: sitesArray
      });
    } catch (err) {
      console.warn('[Welcome] Failed to save blocklist:', err);
    }
  }

  // Mark onboarding as complete
  try {
    await chrome.storage.local.set({ onboardingComplete: true });
  } catch (err) {
    console.warn('[Welcome] Failed to save onboarding state:', err);
  }

  // Close the welcome tab
  window.close();
}

// ---------------------------------------------------------------------------
// Event Binding
// ---------------------------------------------------------------------------

function bindEvents() {
  // Step navigation
  btnStep1Next.addEventListener('click', () => goToStep(2));
  btnStep2Back.addEventListener('click', () => goToStep(1));
  btnStep2Next.addEventListener('click', () => goToStep(3));
  btnStep3Back.addEventListener('click', () => goToStep(2));
  btnStep3Finish.addEventListener('click', saveBlocklistAndFinish);

  // Quick-add buttons
  quickAddBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const domain = btn.dataset.domain;
      if (selectedSites.has(domain)) {
        removeSite(domain);
        btn.classList.remove('quick-add-btn--selected');
      } else {
        addSite(domain);
        btn.classList.add('quick-add-btn--selected');
      }
    });
  });

  // Custom site input
  function handleCustomAdd() {
    const domain = cleanDomain(welcomeSiteInput.value);
    if (domain) {
      addSite(domain);
      welcomeSiteInput.value = '';
      // Also update the quick-add button if it matches
      quickAddBtns.forEach(btn => {
        if (btn.dataset.domain === domain) {
          btn.classList.add('quick-add-btn--selected');
        }
      });
    }
    welcomeSiteInput.focus();
  }

  btnCustomAdd.addEventListener('click', handleCustomAdd);
  welcomeSiteInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomAdd();
    }
  });
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  goToStep(1);
});
