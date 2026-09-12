// frontend/js/opening.js
// Candidate opening details page.
// Fetches a single opening from Supabase using the `id` URL param.
//
// NOTE: This file expects a global `supabase` client to already exist.
// See ../js/supabase-client.js for the client initialization.
// Do NOT put your project URL or anon key in this file.

(function () {
  'use strict';

  // ============================================================
  // 0. SUPABASE CLIENT GUARD
  // ============================================================
  if (typeof supabase === 'undefined' || !supabase) {
    console.error(
      '[Opening] Supabase client not found. Ensure ../js/supabase-client.js is loaded and initializes a global `supabase`.'
    );
    showError("We couldn't connect to the server. Please try again later.");
    return;
  }

  // ============================================================
  // 1. DOM REFS
  // ============================================================
  const loadingState   = document.getElementById('loadingState');
  const errorState     = document.getElementById('errorState');
  const notFoundState  = document.getElementById('notFoundState');
  const openingDetail  = document.getElementById('openingDetail');
  const errorMessage   = document.getElementById('errorMessage');

  const applyBtn    = document.getElementById('applyBtn');
  const applyStatus = document.getElementById('applyStatus');
  const applyNote   = document.getElementById('applyNote');

  const navToggle = document.querySelector('.nav-toggle');
  const navLinks  = document.querySelector('.nav-links');

  // ============================================================
  // 2. STATE VIEW HELPERS
  // ============================================================
  function showLoading() {
    loadingState.hidden = false;
    errorState.hidden = true;
    notFoundState.hidden = true;
    openingDetail.hidden = true;
  }

  function showError(message) {
    loadingState.hidden = true;
    errorState.hidden = false;
    notFoundState.hidden = true;
    openingDetail.hidden = true;
    if (message) errorMessage.textContent = message;
  }

  function showNotFound() {
    loadingState.hidden = true;
    errorState.hidden = true;
    notFoundState.hidden = false;
    openingDetail.hidden = true;
  }

  function showOpening() {
    loadingState.hidden = true;
    errorState.hidden = true;
    notFoundState.hidden = true;
    openingDetail.hidden = false;
  }

  // ============================================================
  // 3. UTILITIES
  // ============================================================
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function isPastDeadline(deadline) {
    if (!deadline) return false;
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return false;
    // End of day comparison so the deadline day itself still counts.
    d.setHours(23, 59, 59, 999);
    return Date.now() > d.getTime();
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value == null || value === '' ? '—' : String(value);
  }

  function renderList(containerId, sectionId, items) {
    const container = document.getElementById(containerId);
    const section = document.getElementById(sectionId);
    if (!container || !section) return;

    const list = Array.isArray(items) ? items.filter(Boolean) : [];
    if (list.length === 0) {
      section.hidden = true;
      container.innerHTML = '';
      return;
    }

    section.hidden = false;
    container.innerHTML = list
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('');
  }

  function renderSkills(skills) {
    const section = document.getElementById('sectionSkills');
    const container = document.getElementById('dSkills');
    if (!section || !container) return;

    const list = Array.isArray(skills) ? skills.filter(Boolean) : [];
    if (list.length === 0) {
      section.hidden = true;
      container.innerHTML = '';
      return;
    }

    section.hidden = false;
    container.innerHTML = list
      .map((s) => `<span class="skill-chip">${escapeHtml(s)}</span>`)
      .join('');
  }

  // ============================================================
  // 4. RENDER OPENING
  // ============================================================
  function renderOpening(opening) {
    setText('dTitle', opening.title);
    setText('dOrganization', opening.organization);

    setText('dLocation', opening.location);
    setText('dJobType', opening.job_type);
    setText('dWorkMode', opening.work_mode);
    setText('dExperience', opening.experience);

    setText('dDeadline', formatDate(opening.application_deadline));
    setText('dPositions', opening.positions != null ? opening.positions : '—');

    setText('dDescription', opening.description || '—');

    renderList('dResponsibilities', 'sectionResponsibilities', opening.responsibilities);
    renderList('dRequired', 'sectionRequired', opening.required_qualifications);
    renderList('dPreferred', 'sectionPreferred', opening.preferred_qualifications);
    renderList('dBenefits', 'sectionBenefits', opening.benefits);
    renderSkills(opening.skills);

    // Document title
    document.title = `${opening.title || 'Opening'} · RecruitHub`;
  }

  // ============================================================
  // 5. APPLY BUTTON STATE
  // ============================================================
  function configureApplyButton(opening) {
    const status = (opening.status || '').toLowerCase();
    const deadlinePassed = isPastDeadline(opening.application_deadline);
    const openingId = opening.id;

    // Reset
    applyBtn.disabled = false;
    applyBtn.textContent = 'Apply Now';
    applyBtn.style.display = '';
    applyStatus.hidden = true;
    applyStatus.textContent = '';
    applyStatus.className = 'apply-status';
    applyNote.hidden = false;
    applyNote.textContent = 'Submit your application for this opening.';

    // Closed opening
    if (status === 'closed') {
      applyBtn.disabled = true;
      applyBtn.textContent = 'Applications Closed';
      applyStatus.hidden = false;
      applyStatus.textContent = 'Closed';
      applyStatus.classList.add('status-closed');
      applyNote.textContent = 'This opening is no longer accepting applications.';
      return;
    }

    // Draft (shouldn't normally be visible to candidates, but be safe)
    if (status === 'draft') {
      applyBtn.disabled = true;
      applyBtn.textContent = 'Not Yet Open';
      applyStatus.hidden = false;
      applyStatus.textContent = 'Draft';
      applyNote.textContent = 'This opening is not yet open for applications.';
      return;
    }

    // Deadline passed
    if (deadlinePassed) {
      applyBtn.disabled = true;
      applyBtn.textContent = 'Applications Closed';
      applyStatus.hidden = false;
      applyStatus.textContent = 'Deadline Passed';
      applyStatus.classList.add('status-expired');
      applyNote.textContent = 'The application deadline for this opening has passed.';
      return;
    }

    // Active and open — wire up navigation
    applyBtn.addEventListener('click', function () {
      window.location.href =
        'application.html?opening_id=' + encodeURIComponent(openingId);
    });
  }

  // ============================================================
  // 6. FETCH OPENING
  // ============================================================
  async function fetchOpening(openingId) {
    // .single() throws if 0 rows are returned, so we handle that
    // explicitly to show the "not found" state rather than the
    // generic error state.
    const { data, error } = await supabase
      .from('openings')
      .select('*')
      .eq('id', openingId)
      .single();

    if (error) {
      // PGRST116 = "JSON object requested, multiple (or no) rows returned"
      if (error.code === 'PGRST116') {
        return { data: null, notFound: true };
      }
      throw error;
    }

    return { data, notFound: false };
  }

  // ============================================================
  // 7. INIT
  // ============================================================
  async function init() {
    const openingId = new URLSearchParams(window.location.search).get('id');

    if (!openingId) {
      showNotFound();
      return;
    }

    showLoading();

    try {
      const { data, notFound } = await fetchOpening(openingId);

      if (notFound || !data) {
        showNotFound();
        return;
      }

      renderOpening(data);
      configureApplyButton(data);
      showOpening();
    } catch (err) {
      console.error('[Opening] Failed to load opening:', err);
      showError("We couldn't load this opening. Please try again.");
    }
  }

  // ============================================================
  // 8. MOBILE NAV
  // ============================================================
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.querySelectorAll('.nav-link').forEach((link) =>
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          navLinks.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      })
    );
  }

  // Run
  init();
})();