// frontend/js/ranking.js
// Admin candidate ranking page.
//
// ┌──────────────────────────────────────────────────────────────┐
// │ RANKING PROVIDER CONTRACT — READ BEFORE EDITING              │
// ├──────────────────────────────────────────────────────────────┤
// │                                                              │
// │ All ranking access is isolated in `rankingProvider` below.   │
// │                                                              │
// │ The backend/table schema is NOT yet finalized. This file     │
// │ does NOT assume a table name, column names, or response      │
// │ shape. Do NOT invent them here.                              │
// │                                                              │
// │ Teammate: map whatever the actual backend provides into      │
// │ the UI contract shape below, inside rankingProvider.         │
// │ Then set rankingProvider.isConfigured() to return true.      │
// │                                                              │
// │ The rest of the page (list, filters, detail panel, resume,   │
// │ status updates) does NOT depend on ranking internals and     │
// │ should not need to change.                                   │
// │                                                              │
// │ ── UI CONTRACT ─────────────────────────────────────────────│
// │                                                              │
// │ fetchRankingsForOpening(openingId) → Promise<Array<{        │
// │   application_id:            string,   // → applications.id │
// │   candidate_id?:             string,   // optional          │
// │                                                              │
// │   rank:                      number,   // 1-based            │
// │   match_score:               number,   // 0–100 overall     │
// │                                                              │
// │   keyword_score?:            number,   // 0–100             │
// │   semantic_score?:           number,   // 0–100             │
// │   evidence_score?:           number,   // 0–100             │
// │   must_have_coverage?:       number,   // 0–100             │
// │                                                              │
// │   evidence_confidence?:      number,   // 0–100             │
// │   parsing_confidence?:       number,   // 0–100             │
// │                                                              │
// │   matched_skills?:           string[],                      │
// │   missing_must_have_skills?: string[],                      │
// │   strengths?:                string[],                      │
// │   gaps?:                     string[],                      │
// │   evidence_snippets?:        Array<{                        │
// │     text:      string,                                      │
// │     source?:   string,   // e.g. 'resume', 'cover_letter'   │
// │     skill?:    string                                       │
// │   }>                                                         │
// │ }>>                                                          │
// │                                                              │
// │ isConfigured() → boolean                                    │
// │   Return false until the backend is connected. The page     │
// │   then shows "Ranking data unavailable" instead of          │
// │   pretending rankings exist.                                 │
// │                                                              │
// │ subscribeToRankingUpdates(openingId, handler) → unsubscribe │
// │   OPTIONAL. If your backend can push updates (Supabase      │
// │   Realtime, SSE, WebSocket), implement here. The page calls │
// │   this once on load. If not implemented, leave as-is — the  │
// │   page falls back to manual refresh.                        │
// │                                                              │
// │ IMPORTANT:                                                   │
// │ - Never compute ranking/scoring logic in the frontend.      │
// │ - Never fabricate ranks, scores, or explanations.           │
// │ - Never return fallback/mock data from these methods.       │
// │   Throw on failure. The UI handles all error states.        │
// │                                                              │
// │ REFRESH MODEL:                                               │
// │ Ranking is derived from JD + candidate/resume only.         │
// │ Application status changes do NOT trigger a ranking         │
// │ re-fetch. The full fetchRankingsForOpening(openingId) is    │
// │ the only ranking refresh path (plus optional live updates   │
// │ via subscribeToRankingUpdates).                             │
// └──────────────────────────────────────────────────────────────┘

(function () {
  'use strict';

  // ============================================================
  // 0. GUARD — Supabase client must exist
  // ============================================================
  if (typeof supabase === 'undefined' || !supabase) {
    showPageError(
      'Connection error',
      "We couldn't connect to the server. Please try again later."
    );
    return;
  }

  // ============================================================
  // 1. CONSTANTS (NON-RANKING)
  // ============================================================
  const BACKEND = {
    openingsTable: 'openings',
    applicationsTable: 'applications',
    resumeBucket: 'candidate-resumes'
  };

  const ALLOWED_STATUSES = ['submitted', 'review', 'shortlisted', 'rejected'];

  // ============================================================
  // 2. RANKING PROVIDER — THE ONLY RANKING-SPECIFIC CODE
  //    ┌──────────────────────────────────────────────────────┐
  //    │  TEAMMATE: Replace the bodies below once the actual  │
  //    │  Supabase table / Node.js endpoint is available.     │
  //    │  Map whatever shape the backend returns into the UI  │
  //    │  contract documented at the top of this file.        │
  //    │  Do NOT change the surrounding UI code.              │
  //    └──────────────────────────────────────────────────────┘
  // ============================================================
  const rankingProvider = {

    /**
     * Return true once the real ranking backend is connected.
     * Until then, the page shows "Ranking data unavailable"
     * instead of pretending rankings exist.
     *
     * @returns {boolean}
     */
    isConfigured() {
      // TODO(teammate): return true once fetchRankingsForOpening
      // is implemented below.
      return false;
    },

    /**
     * Fetch all ranking results for an opening.
     *
     * The UI calls this on page load and on manual refresh.
     * Rows must be associated to applications via `application_id`.
     *
     * Example implementation shapes (pick ONE once you know
     * your backend):
     *
     *   // A) Supabase table
     *   const { data, error } = await supabase
     *     .from('YOUR_RANKING_TABLE')
     *     .select('*')
     *     .eq('opening_id', openingId);
     *   if (error) throw error;
     *   return data.map(mapYourRowShape);
     *
     *   // B) Node.js endpoint
     *   const res = await fetch(`/api/openings/${openingId}/rankings`);
     *   if (!res.ok) throw new Error('Ranking fetch failed');
     *   return (await res.json()).map(mapYourRowShape);
     *
     *   // C) Supabase Edge Function
     *   const { data, error } = await supabase.functions.invoke(
     *     'your-ranking-function',
     *     { body: { opening_id: openingId } }
     *   );
     *   if (error) throw error;
     *   return data.map(mapYourRowShape);
     *
     * `mapYourRowShape` must return objects matching the UI
     * contract documented at the top of this file. Any missing
     * optional field should be omitted or set to null — the UI
     * hides empty sections automatically.
     *
     * @param {string} openingId
     * @returns {Promise<Array<object>>}
     */
    async fetchRankingsForOpening(openingId) {
      // TODO(teammate): implement.
      throw new Error('RANKING_PROVIDER_NOT_CONFIGURED');
    },

    /**
     * OPTIONAL: subscribe to live ranking updates.
     *
     * If your backend can push new rankings as candidates are
     * processed (Supabase Realtime on the ranking table, SSE, or
     * a WebSocket), implement it here.
     *
     * The page calls this ONCE on load and calls the returned
     * unsubscribe function on unload.
     *
     * If not implemented, leave as-is (returns a no-op) — the page
     * falls back to manual refresh via the "Refresh rankings"
     * button.
     *
     * @param {string} openingId
     * @param {(payload: any) => void} onUpdate  // signal to reload
     * @returns {() => void}  unsubscribe
     */
    subscribeToRankingUpdates(openingId, onUpdate) {
      // TODO(teammate): optionally implement.
      // Example Supabase Realtime:
      //   const channel = supabase
      //     .channel('ranking-updates')
      //     .on('postgres_changes',
      //         { event: '*', schema: 'public', table: 'YOUR_RANKING_TABLE',
      //           filter: `opening_id=eq.${openingId}` },
      //         () => onUpdate())
      //     .subscribe();
      //   return () => supabase.removeChannel(channel);
      return () => {};
    }
  };

  // ============================================================
  // 3. DOM REFS
  // ============================================================
  const $ = (id) => document.getElementById(id);

  const stateLoading     = $('stateLoading');
  const stateMissingId   = $('stateMissingId');
  const stateNotFound    = $('stateNotFound');
  const stateError       = $('stateError');
  const errorTitle       = $('errorTitle');
  const errorText        = $('errorText');
  const mainContent      = $('mainContent');

  const openingTitle        = $('openingTitle');
  const openingMeta         = $('openingMeta');
  const openingApplicants   = $('openingApplicantCount');
  const openingPositions    = $('openingPositions');
  const openingDeadline     = $('openingDeadline');

  const searchInput         = $('searchInput');
  const sortSelect          = $('sortSelect');
  const filterChips         = document.querySelectorAll('.chip');

  const candidateList       = $('candidateList');
  const stateRankingUnavailable = $('stateRankingUnavailable');
  const stateNoApplicants   = $('stateNoApplicants');
  const stateNoMatch        = $('stateNoMatch');
  const clearFiltersBtn     = $('clearFiltersBtn');

  const detailPane          = $('detailPane');
  const detailCloseBtn      = $('detailCloseBtn');
  const detailEmpty         = $('detailEmpty');
  const detailContent       = $('detailContent');

  const detailName          = $('detailName');
  const detailContact       = $('detailContact');
  const detailRank          = $('detailRank');
  const detailScore         = $('detailScore');
  const detailStatusBadge   = $('detailStatusBadge');

  const matchGrid           = $('matchGrid');
  const strengthsCol        = $('strengthsCol');
  const gapsCol             = $('gapsCol');
  const strengthsList       = $('strengthsList');
  const gapsList            = $('gapsList');
  const reasonUnavailable   = $('reasonUnavailable');

  const skillsBlock         = $('skillsBlock');
  const detailSkills        = $('detailSkills');

  const educationBlock      = $('educationBlock');
  const educationList       = $('educationList');

  const experienceBlock     = $('experienceBlock');
  const experienceList      = $('experienceList');

  const linksBlock          = $('linksBlock');
  const detailLinks         = $('detailLinks');

  const appInfoList         = $('appInfoList');

  const resumeUnavailable   = $('resumeUnavailable');
  const viewResumeBtn       = $('viewResumeBtn');

  const statusSelect        = $('statusSelect');
  const updateStatusBtn     = $('updateStatusBtn');
  const statusUpdateNote    = $('statusUpdateNote');

  const drawerBackdrop      = $('drawerBackdrop');
  const toastContainer      = $('toastContainer');

  const navToggle = document.querySelector('.nav-toggle');
  const navLinks  = document.querySelector('.nav-links');

  // ============================================================
  // 4. STATE
  // ============================================================
  const state = {
    openingId: null,
    opening: null,

    // Map keyed by application_id → ranking object (or null).
    rankingsByApplicationId: new Map(),

    // Raw applications from Supabase.
    applications: [],

    // True once we've successfully talked to the ranking provider.
    rankingAvailable: false,

    // Currently opened application id.
    selectedApplicationId: null,

    // Whether we're currently re-fetching rankings.
    rankingRefreshing: false,

    // Unsubscribe function for the optional live updates channel.
    unsubscribeRankingUpdates: null,

    filters: {
      search: '',
      status: 'all',
      sort: 'rank'
    }
  };

  // ============================================================
  // 5. UTILITIES
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
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  function statusLabel(status) {
    if (!status) return '—';
    const s = String(status).toLowerCase();
    const map = {
      submitted: 'Submitted',
      review: 'Under Review',
      shortlisted: 'Shortlisted',
      interview: 'Interview',
      selected: 'Selected',
      rejected: 'Rejected'
    };
    return map[s] || (s.charAt(0).toUpperCase() + s.slice(1));
  }

  function statusClass(status) {
    const s = String(status || '').toLowerCase();
    return ['submitted','review','shortlisted','interview','selected','rejected']
      .includes(s) ? `status-${s}` : 'status-submitted';
  }

  function asArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string' && value.trim() !== '') {
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }

  function showToast(message, type) {
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' error' : '');
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  function showPageError(title, text) {
    stateLoading.hidden = true;
    stateMissingId.hidden = true;
    stateNotFound.hidden = true;
    mainContent.hidden = true;
    stateError.hidden = false;
    errorTitle.textContent = title;
    errorText.textContent = text;
  }

  function showPageState(name) {
    stateLoading.hidden = name !== 'loading';
    stateMissingId.hidden = name !== 'missing';
    stateNotFound.hidden = name !== 'notfound';
    stateError.hidden = name !== 'error';
    mainContent.hidden = name !== 'ready';
  }

  // ============================================================
  // 6. OPENING + APPLICATION LOADERS (non-ranking Supabase)
  // ============================================================
  async function loadOpening(openingId) {
    const { data, error } = await supabase
      .from(BACKEND.openingsTable)
      .select('*')
      .eq('id', openingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async function loadApplicationsForOpening(openingId) {
    const { data, error } = await supabase
      .from(BACKEND.applicationsTable)
      .select('*')
      .eq('opening_id', openingId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async function updateApplicationStatus(applicationId, status) {
    const { data, error } = await supabase
      .from(BACKEND.applicationsTable)
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async function getResumeSignedUrl(resumePath, expiresInSeconds = 300) {
    if (!resumePath) throw new Error('NO_RESUME');
    const { data, error } = await supabase
      .storage
      .from(BACKEND.resumeBucket)
      .createSignedUrl(resumePath, expiresInSeconds);

    if (error) throw error;
    if (!data || !data.signedUrl) throw new Error('NO_SIGNED_URL');
    return data.signedUrl;
  }

  // ============================================================
  // 7. RANKING FETCH ORCHESTRATION
  // ============================================================

  /**
   * Reload rankings from the provider and update state.
   * This is the ONLY ranking refresh path (aside from optional
   * live updates via subscribeToRankingUpdates).
   *
   * Ranking is based on JD + candidate/resume; application
   * status changes do NOT trigger a per-candidate re-fetch.
   *
   * @param {{ silent?: boolean }} [options]
   */
  async function refreshRankings(options) {
    const silent = options && options.silent;

    if (state.rankingRefreshing) return;
    state.rankingRefreshing = true;
    if (!silent) setRefreshIndicator(true);

    try {
      if (!rankingProvider.isConfigured()) {
        state.rankingsByApplicationId = new Map();
        state.rankingAvailable = false;
        return;
      }

      const rows = await rankingProvider.fetchRankingsForOpening(state.openingId);
      const map = new Map();

      (rows || []).forEach((row) => {
        if (!row || !row.application_id) return;
        map.set(String(row.application_id), row);
      });

      state.rankingsByApplicationId = map;
      state.rankingAvailable = true;
    } catch (err) {
      console.warn('[ranking] ranking refresh failed:', err);
      state.rankingsByApplicationId = new Map();
      state.rankingAvailable = false;
    } finally {
      state.rankingRefreshing = false;
      if (!silent) setRefreshIndicator(false);
    }
  }

  function setRefreshIndicator(active) {
    const btn = document.getElementById('refreshRankingsBtn');
    if (!btn) return;
    btn.disabled = active;
    btn.dataset.state = active ? 'loading' : 'idle';
    btn.textContent = active ? 'Refreshing…' : 'Refresh rankings';
  }

  // ============================================================
  // 8. MERGE — application + ranking row for the UI
  // ============================================================
  function getMergedRows() {
    return state.applications.map((app) => {
      const r = state.rankingsByApplicationId.get(String(app.id)) || null;
      return {
        application: app,

        rank: r && r.rank != null ? r.rank : null,
        match_score: r && r.match_score != null ? r.match_score : null,

        // Model scorecard breakdown
        keyword_score: r && r.keyword_score != null ? r.keyword_score : null,
        semantic_score: r && r.semantic_score != null ? r.semantic_score : null,
        evidence_score: r && r.evidence_score != null ? r.evidence_score : null,
        must_have_coverage: r && r.must_have_coverage != null ? r.must_have_coverage : null,

        evidence_confidence: r && r.evidence_confidence != null ? r.evidence_confidence : null,
        parsing_confidence: r && r.parsing_confidence != null ? r.parsing_confidence : null,

        // Skill / evidence lists
        matched_skills: r ? asArray(r.matched_skills) : [],
        missing_must_have_skills: r ? asArray(r.missing_must_have_skills) : [],
        strengths: r ? asArray(r.strengths) : [],
        gaps: r ? asArray(r.gaps) : [],
        evidence_snippets: r && Array.isArray(r.evidence_snippets) ? r.evidence_snippets : []
      };
    });
  }

  // ============================================================
  // 9. RENDER — OPENING CONTEXT
  // ============================================================
  function renderOpeningContext(opening, applicantCount) {
    openingTitle.textContent = opening.title || 'Untitled opening';

    const parts = [opening.organization, opening.location, opening.job_type]
      .filter(Boolean);
    openingMeta.textContent = parts.length ? parts.join(' · ') : '—';

    openingApplicants.textContent = String(applicantCount);
    openingPositions.textContent =
      opening.positions != null ? String(opening.positions) : '—';
    openingDeadline.textContent = formatDate(opening.application_deadline);
  }

  // ============================================================
  // 10. FILTER / SORT / SEARCH
  // ============================================================
  function applyFiltersAndSort(rows) {
    const q = state.filters.search.toLowerCase();
    const statusFilter = state.filters.status;

    let filtered = rows.filter((row) => {
      const app = row.application;

      if (statusFilter !== 'all') {
        if (String(app.status || '').toLowerCase() !== statusFilter) return false;
      }

      if (q) {
        const skills = asArray(app.skills).join(' ');
        const matched = row.matched_skills.join(' ');
        const haystack = [app.full_name, app.email, skills, matched]
          .join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    const sort = state.filters.sort;
    filtered.sort((a, b) => {
      if (sort === 'rank') {
        const ra = a.rank == null ? Number.POSITIVE_INFINITY : a.rank;
        const rb = b.rank == null ? Number.POSITIVE_INFINITY : b.rank;
        return ra - rb;
      }
      if (sort === 'match_score') {
        const sa = a.match_score == null ? -1 : a.match_score;
        const sb = b.match_score == null ? -1 : b.match_score;
        return sb - sa;
      }
      if (sort === 'applied_date') {
        const da = new Date(a.application.created_at || 0).getTime();
        const db = new Date(b.application.created_at || 0).getTime();
        return db - da;
      }
      return 0;
    });

    return filtered;
  }

  // ============================================================
  // 11. RENDER — CANDIDATE LIST
  // ============================================================
  function renderCandidateList() {
    stateRankingUnavailable.hidden = true;
    stateNoApplicants.hidden = true;
    stateNoMatch.hidden = true;

    const rows = getMergedRows();

    if (rows.length === 0) {
      candidateList.innerHTML = '';
      stateNoApplicants.hidden = false;
      return;
    }

    if (!state.rankingAvailable) {
      candidateList.innerHTML = '';
      stateRankingUnavailable.hidden = false;
      return;
    }

    const visible = applyFiltersAndSort(rows);

    if (visible.length === 0) {
      candidateList.innerHTML = '';
      stateNoMatch.hidden = false;
      return;
    }

    candidateList.innerHTML = visible.map(renderCandidateRow).join('');

    candidateList.querySelectorAll('.candidate-row').forEach((el) => {
      el.addEventListener('click', () =>
        selectCandidate(el.dataset.applicationId));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectCandidate(el.dataset.applicationId);
        }
      });
    });

    if (state.selectedApplicationId) {
      const sel = candidateList.querySelector(
        `.candidate-row[data-application-id="${CSS.escape(state.selectedApplicationId)}"]`
      );
      if (sel) sel.classList.add('selected');
    }
  }

  function renderCandidateRow(row) {
    const app = row.application;
    const rankLabel = row.rank != null ? `#${row.rank}` : '—';
    const scoreLabel = row.match_score != null
      ? `${Math.round(row.match_score)}% Match`
      : '—';

    const skills = asArray(app.skills).slice(0, 3).join(' · ') || '—';
    const expYears = app.experience_years;
    const expLabel = expYears == null ? '—'
      : expYears === 0 ? 'Fresher'
      : `${expYears} year${expYears === 1 ? '' : 's'} experience`;

    const status = String(app.status || 'submitted').toLowerCase();
    const isSelected = state.selectedApplicationId === app.id;

    return `
      <div class="candidate-row${isSelected ? ' selected' : ''}"
           role="option"
           tabindex="0"
           aria-selected="${isSelected}"
           data-application-id="${escapeHtml(app.id)}">
        <div class="row-rank">${escapeHtml(rankLabel)}</div>
        <div class="row-main">
          <div class="row-name">${escapeHtml(app.full_name || 'Unnamed candidate')}</div>
          <div class="row-meta">
            <span>${escapeHtml(expLabel)}</span>
            <span class="row-meta-sep">·</span>
            <span class="status-badge ${statusClass(status)}">${escapeHtml(statusLabel(status))}</span>
          </div>
          <div class="row-skills">${escapeHtml(skills)}</div>
        </div>
        <div class="row-side">
          <div class="row-score">${escapeHtml(scoreLabel)}</div>
          <div class="row-date">${escapeHtml(formatDate(app.created_at))}</div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // 12. CANDIDATE SELECTION & DETAIL PANEL
  // ============================================================
  function findRowByApplicationId(applicationId) {
    return getMergedRows()
      .find((row) => row.application.id === applicationId) || null;
  }

  function selectCandidate(applicationId) {
    state.selectedApplicationId = applicationId;

    candidateList.querySelectorAll('.candidate-row').forEach((el) => {
      const isSel = el.dataset.applicationId === applicationId;
      el.classList.toggle('selected', isSel);
      el.setAttribute('aria-selected', String(isSel));
    });

    if (window.innerWidth <= 1024) {
      detailPane.classList.add('open');
      drawerBackdrop.hidden = false;
      detailPane.setAttribute('aria-hidden', 'false');
    }

    renderCandidateDetails();
  }

  function renderCandidateDetails() {
    const row = findRowByApplicationId(state.selectedApplicationId);

    detailEmpty.hidden = true;
    detailContent.hidden = false;

    if (!row) {
      detailContent.hidden = true;
      detailEmpty.hidden = false;
      return;
    }

    const app = row.application;

    // A. Header
    detailName.textContent = app.full_name || 'Unnamed candidate';

    const contactParts = [];
    if (app.email) contactParts.push(
      `<a href="mailto:${escapeHtml(app.email)}">${escapeHtml(app.email)}</a>`);
    if (app.phone) contactParts.push(
      `<span>${escapeHtml(app.phone)}</span>`);
    detailContact.innerHTML =
      contactParts.join(' · ') || '<span>—</span>';

    detailRank.textContent = row.rank != null ? `Rank #${row.rank}` : 'Rank —';
    detailScore.textContent = row.match_score != null
      ? `${Math.round(row.match_score)}% Match` : 'Match —';

    const status = String(app.status || 'submitted').toLowerCase();
    detailStatusBadge.textContent = statusLabel(status);
    detailStatusBadge.className = `badge badge-status ${statusClass(status)}`;

    // B. Reasoning / scorecard
    renderReasoning(row);

    // C. Skills (candidate's own skills from application)
    const skills = asArray(app.skills);
    if (skills.length) {
      skillsBlock.hidden = false;
      detailSkills.innerHTML = skills
        .map((s) => `<span class="skill-chip">${escapeHtml(s)}</span>`)
        .join('');
    } else skillsBlock.hidden = true;

    // D. Education
    const eduRows = [];
    if (app.university) eduRows.push(['University', app.university]);
    if (app.degree) eduRows.push(['Degree', app.degree]);
    if (app.graduation_year) eduRows.push(['Graduation Year', app.graduation_year]);

    if (eduRows.length) {
      educationBlock.hidden = false;
      educationList.innerHTML = eduRows
        .map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`)
        .join('');
    } else educationBlock.hidden = true;

    // E. Experience
    const expRows = [];
    if (app.experience_years != null) {
      expRows.push(['Years of Experience',
        app.experience_years === 0 ? 'Fresher' : String(app.experience_years)]);
    }
    if (expRows.length) {
      experienceBlock.hidden = false;
      experienceList.innerHTML = expRows
        .map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`)
        .join('');
    } else experienceBlock.hidden = true;

    // F. Links
    const linkDefs = [
      ['LinkedIn', app.linkedin_url],
      ['GitHub', app.github_url],
      ['Portfolio', app.portfolio_url]
    ].filter(([, url]) => url);

    if (linkDefs.length) {
      linksBlock.hidden = false;
      detailLinks.innerHTML = linkDefs.map(([label, url]) => `
        <a class="link-pill" href="${escapeHtml(url)}"
           target="_blank" rel="noopener noreferrer">
          ${escapeHtml(label)}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 17L17 7M7 7h10v10"/>
          </svg>
        </a>
      `).join('');
    } else linksBlock.hidden = true;

    // G. Application info
    const appRows = [
      ['Application ID', app.id],
      ['Applied Date', formatDate(app.created_at)],
      ['Status', statusLabel(status)],
      ['Opening', state.opening ? state.opening.title : '—']
    ];
    appInfoList.innerHTML = appRows
      .map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`)
      .join('');

    // Resume
    if (app.resume_path) {
      resumeUnavailable.hidden = true;
      viewResumeBtn.hidden = false;
      viewResumeBtn.onclick = () => openResume(app.resume_path, viewResumeBtn);
    } else {
      resumeUnavailable.hidden = false;
      viewResumeBtn.hidden = true;
      viewResumeBtn.onclick = null;
    }

    // Status update
    renderStatusUpdater(app);
  }

  // ------------------------------------------------------------
  // Reasoning block — uses model scorecard fields
  // ------------------------------------------------------------
  function renderReasoning(row) {
    matchGrid.innerHTML = '';
    strengthsList.innerHTML = '';
    gapsList.innerHTML = '';
    strengthsCol.hidden = true;
    gapsCol.hidden = true;
    reasonUnavailable.hidden = true;

    // Scorecard metrics
    const scoreItems = [
      ['Overall', row.match_score],
      ['Keyword', row.keyword_score],
      ['Semantic', row.semantic_score],
      ['Evidence', row.evidence_score],
      ['Must-have coverage', row.must_have_coverage],
      ['Evidence confidence', row.evidence_confidence],
      ['Parsing confidence', row.parsing_confidence]
    ].filter(([, v]) => v != null);

    if (scoreItems.length) {
      matchGrid.innerHTML = scoreItems.map(([label, value]) => `
        <div class="match-item">
          <span class="match-label">${escapeHtml(label)}</span>
          <span class="match-value">${Math.round(Number(value))}%</span>
        </div>
      `).join('');
    }

    // Matched skills
    if (row.matched_skills.length) {
      const el = document.createElement('div');
      el.className = 'reason-col';
      el.innerHTML = `
        <h4 class="reason-title">Matched skills</h4>
        <div class="skill-chips" style="margin-top:0.35rem;">
          ${row.matched_skills
            .map((s) => `<span class="skill-chip">${escapeHtml(s)}</span>`)
            .join('')}
        </div>
      `;
      matchGrid.parentNode.insertBefore(el, matchGrid.nextSibling);
    }

    // Missing must-have skills
    if (row.missing_must_have_skills.length) {
      const el = document.createElement('div');
      el.className = 'reason-col';
      el.style.marginTop = '0.6rem';
      el.innerHTML = `
        <h4 class="reason-title">Missing must-have skills</h4>
        <div class="skill-chips" style="margin-top:0.35rem;">
          ${row.missing_must_have_skills
            .map((s) => `<span class="skill-chip" style="color:#64748B;background:#F1F5F9;border-color:#E2E8F0;">${escapeHtml(s)}</span>`)
            .join('')}
        </div>
      `;
      matchGrid.parentNode.insertBefore(el, matchGrid.nextSibling);
    }

    // Strengths
    if (row.strengths.length) {
      strengthsCol.hidden = false;
      strengthsList.innerHTML = row.strengths
        .map((s) => `<li>${escapeHtml(s)}</li>`).join('');
    }

    // Gaps
    if (row.gaps.length) {
      gapsCol.hidden = false;
      gapsList.innerHTML = row.gaps
        .map((g) => `<li>${escapeHtml(g)}</li>`).join('');
    }

    // Evidence snippets
    if (row.evidence_snippets.length) {
      const el = document.createElement('div');
      el.className = 'reason-col';
      el.style.marginTop = '0.85rem';
      el.innerHTML = `
        <h4 class="reason-title">Evidence</h4>
        <ul class="reason-list">
          ${row.evidence_snippets.map((snip) => {
            const text = typeof snip === 'string'
              ? snip
              : (snip && snip.text) || '';
            const source = snip && snip.source
              ? ` <span style="color:#94A3B8;font-weight:500;">— ${escapeHtml(snip.source)}</span>`
              : '';
            return `<li>${escapeHtml(text)}${source}</li>`;
          }).join('')}
        </ul>
      `;
      matchGrid.parentNode.insertBefore(el, matchGrid.nextSibling);
    }

    // If nothing at all was provided, say so — no fabricated explanation.
    if (
      scoreItems.length === 0 &&
      row.matched_skills.length === 0 &&
      row.missing_must_have_skills.length === 0 &&
      row.strengths.length === 0 &&
      row.gaps.length === 0 &&
      row.evidence_snippets.length === 0
    ) {
      reasonUnavailable.hidden = false;
    }
  }

  // ============================================================
  // 13. STATUS UPDATER
  //     Status changes do NOT recalculate ranking.
  //     Ranking is derived from JD + candidate/resume only.
  // ============================================================
  function renderStatusUpdater(app) {
    const current = String(app.status || 'submitted').toLowerCase();

    statusSelect.innerHTML =
      '<option value="">Change status…</option>' +
      ALLOWED_STATUSES.map((s) =>
        `<option value="${s}"${s === current ? ' selected' : ''}>${statusLabel(s)}</option>`
      ).join('');

    statusSelect.value = '';
    updateStatusBtn.disabled = true;
    statusUpdateNote.hidden = true;
    statusUpdateNote.textContent = '';

    statusSelect.onchange = () => {
      updateStatusBtn.disabled =
        !statusSelect.value || statusSelect.value === current;
    };

    updateStatusBtn.onclick = async () => {
      const newStatus = statusSelect.value;
      if (!newStatus || newStatus === current) return;

      updateStatusBtn.disabled = true;
      updateStatusBtn.textContent = 'Updating…';

      try {
        const updated = await updateApplicationStatus(app.id, newStatus);
        app.status = updated.status;

        // NOTE: Deliberately NOT re-fetching rankings here.
        // Ranking is based on JD + candidate/resume, not status.

        renderCandidateList();
        renderCandidateDetails();
        showToast('Status updated successfully.');
      } catch (err) {
        console.error('[ranking] status update failed:', err);
        showToast("We couldn't update the status. Please try again.", 'error');
        statusSelect.value = '';
        updateStatusBtn.disabled = true;
      } finally {
        updateStatusBtn.textContent = 'Update';
      }
    };
  }

  // ============================================================
  // 14. RESUME
  // ============================================================
  async function openResume(resumePath, btn) {
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML =
      '<div class="spinner" style="width:16px;height:16px;margin:0;border-width:2px;"></div><span>Opening…</span>';

    try {
      const url = await getResumeSignedUrl(resumePath);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('[ranking] resume signed URL failed:', err);
      showToast('Unable to open resume. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  // ============================================================
  // 15. DETAIL PANE — OPEN/CLOSE
  // ============================================================
  function closeDetailPane() {
    detailPane.classList.remove('open');
    drawerBackdrop.hidden = true;

    if (window.innerWidth <= 1024) {
      detailPane.setAttribute('aria-hidden', 'true');
    }

    state.selectedApplicationId = null;
    candidateList.querySelectorAll('.candidate-row').forEach((el) => {
      el.classList.remove('selected');
      el.setAttribute('aria-selected', 'false');
    });

    detailContent.hidden = true;
    detailEmpty.hidden = false;
  }

  detailCloseBtn.addEventListener('click', closeDetailPane);
  drawerBackdrop.addEventListener('click', closeDetailPane);

  // ============================================================
  // 16. CONTROLS
  // ============================================================
  searchInput.addEventListener('input', () => {
    state.filters.search = searchInput.value.trim();
    renderCandidateList();
  });

  sortSelect.addEventListener('change', () => {
    state.filters.sort = sortSelect.value;
    renderCandidateList();
  });

  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.filters.status = chip.dataset.filter;
      renderCandidateList();
    });
  });

  clearFiltersBtn.addEventListener('click', () => {
    state.filters.search = '';
    state.filters.status = 'all';
    searchInput.value = '';
    filterChips.forEach((c) =>
      c.classList.toggle('active', c.dataset.filter === 'all'));
    renderCandidateList();
  });

  // Manual ranking refresh — the primary refresh mechanism
  const refreshRankingsBtn = document.getElementById('refreshRankingsBtn');
  if (refreshRankingsBtn) {
    refreshRankingsBtn.addEventListener('click', async () => {
      await refreshRankings({ silent: false });
      renderCandidateList();
      if (state.selectedApplicationId) renderCandidateDetails();
    });
  }

  // ============================================================
  // 17. MOBILE NAV
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
      }));
  }

  // ============================================================
  // 18. INIT
  // ============================================================
  async function init() {
    const openingId =
      new URLSearchParams(window.location.search).get('opening_id');

    if (!openingId) {
      showPageState('missing');
      return;
    }
    state.openingId = openingId;

    showPageState('loading');

    let opening;
    try {
      opening = await loadOpening(openingId);
    } catch (err) {
      console.error('[ranking] loadOpening failed:', err);
      showPageError(
        'Something went wrong',
        "We couldn't load this opening. Please try again."
      );
      return;
    }

    if (!opening) { showPageState('notfound'); return; }
    state.opening = opening;

    let applications;
    try {
      applications = await loadApplicationsForOpening(openingId);
    } catch (err) {
      console.error('[ranking] load applications failed:', err);
      showPageError(
        'Something went wrong',
        "We couldn't load candidates for this opening. Please try again."
      );
      return;
    }

    state.applications = applications;

    await refreshRankings({ silent: true });

    // Optional live updates (no-op if not implemented by provider)
    state.unsubscribeRankingUpdates =
      rankingProvider.subscribeToRankingUpdates(openingId, async () => {
        await refreshRankings({ silent: true });
        renderCandidateList();
        if (state.selectedApplicationId) renderCandidateDetails();
      });

    renderOpeningContext(opening, state.applications.length);
    renderCandidateList();
    showPageState('ready');
  }

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    if (typeof state.unsubscribeRankingUpdates === 'function') {
      try { state.unsubscribeRankingUpdates(); } catch (_) {}
    }
  });

  init();
})();