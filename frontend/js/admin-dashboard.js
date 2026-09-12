// frontend/js/admin-dashboard.js
// Admin Dashboard — JD upload → extract → review → publish workflow.
//
// Architecture (see spec):
//   ADMIN → SUPABASE STORAGE → EDGE FUNCTION → STRUCTURED JSON
//         → REVIEW/EDIT → SUPABASE DB → CANDIDATE DASHBOARD
//
// The stubs below (uploadJdToStorage, extractJobDetails, publishOpening)
// are the ONLY places you need to edit when connecting Supabase.
// Do NOT expose Supabase credentials in this file — import the client
// from a separate config module (e.g. ../js/supabase-client.js).

(function () {
  'use strict';

  // ============================================================
  // 0. DOM REFS
  // ============================================================
  const stepUpload      = document.getElementById('stepUpload');
  const stepProcessing  = document.getElementById('stepProcessing');
  const stepReview      = document.getElementById('stepReview');
  const stepSuccess     = document.getElementById('stepSuccess');

  const uploadCard      = document.getElementById('uploadCard');
  const pdfInput        = document.getElementById('pdfInput');
  const choosePdfBtn    = document.getElementById('choosePdfBtn');

  const filePreview     = document.getElementById('filePreview');
  const fileNameEl      = document.getElementById('fileName');
  const fileMetaEl      = document.getElementById('fileMeta');
  const replaceFileBtn  = document.getElementById('replaceFileBtn');
  const removeFileBtn   = document.getElementById('removeFileBtn');

  const extractActions  = document.getElementById('extractActions');
  const extractBtn      = document.getElementById('extractBtn');

  const openingForm     = document.getElementById('openingForm');
  const publishBtn      = document.getElementById('publishBtn');
  const saveDraftBtn    = document.getElementById('saveDraftBtn');

  const viewOpeningBtn   = document.getElementById('viewOpeningBtn');
  const previewOpeningBtn = document.getElementById('previewOpeningBtn');
  const backToDashboard  = document.getElementById('backToDashboardBtn');

  const skillsEditor    = document.getElementById('skillsEditor');
  const skillInput      = document.getElementById('skillInput');
  const addSkillBtn     = document.getElementById('addSkillBtn');

  const publishedTbody  = document.getElementById('publishedTbody');
  const recentAppsList  = document.getElementById('recentAppsList');
  const toastContainer  = document.getElementById('toastContainer');

  const navToggle       = document.querySelector('.nav-toggle');
  const navLinks        = document.querySelector('.nav-links');

  // ============================================================
  // 1. STATE
  // ============================================================
  const state = {
    file: null,               // the selected File object
    currentOpening: null,     // structured JSON populated into the review form
    publishedId: null         // ID returned by Supabase after publish
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  // ============================================================
  // 2. UTILITIES
  // ============================================================
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function showToast(message, type) {
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' error' : '');
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  function setStep(step) {
    [stepUpload, stepProcessing, stepReview, stepSuccess].forEach(
      (el) => (el.hidden = true)
    );
    if (step === 'upload')     stepUpload.hidden = false;
    if (step === 'processing') stepProcessing.hidden = false;
    if (step === 'review')     stepReview.hidden = false;
    if (step === 'success')    stepSuccess.hidden = false;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ============================================================
  // 3. FILE SELECTION
  // ============================================================
  function isPdf(file) {
    if (!file) return false;
    // Accept by MIME or extension (some browsers report empty MIME for .pdf)
    return (
      file.type === 'application/pdf' ||
      /\.pdf$/i.test(file.name)
    );
  }

  function handleFile(file) {
    if (!file) return;

    if (!isPdf(file)) {
      showToast('Please upload a PDF file.', 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast('The PDF is larger than 10 MB. Please choose a smaller file.', 'error');
      return;
    }

    state.file = file;
    fileNameEl.textContent = file.name;
    fileMetaEl.textContent = 'PDF · ' + formatFileSize(file.size);

    uploadCard.hidden = true;
    filePreview.hidden = false;
    extractActions.hidden = false;
  }

  function resetFileSelection() {
    state.file = null;
    pdfInput.value = '';
    filePreview.hidden = true;
    extractActions.hidden = true;
    uploadCard.hidden = false;
  }

  choosePdfBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pdfInput.click();
  });
  uploadCard.addEventListener('click', () => pdfInput.click());
  uploadCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pdfInput.click();
    }
  });

  pdfInput.addEventListener('change', () => {
    handleFile(pdfInput.files[0]);
  });

  // Drag and drop
  ['dragenter', 'dragover'].forEach((evt) =>
    uploadCard.addEventListener(evt, (e) => {
      e.preventDefault();
      uploadCard.classList.add('dragover');
    })
  );
  ['dragleave', 'drop'].forEach((evt) =>
    uploadCard.addEventListener(evt, (e) => {
      e.preventDefault();
      uploadCard.classList.remove('dragover');
    })
  );
  uploadCard.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  });

  replaceFileBtn.addEventListener('click', () => pdfInput.click());
  removeFileBtn.addEventListener('click', resetFileSelection);

  // ============================================================
  // 4. SUPABASE INTEGRATION STUBS
  //    ── Replace the bodies below with real Supabase calls. ──
  //    Keep the function signatures so the rest of the code
  //    does not need to change.
  // ============================================================

  /**
   * STEP 1 — Upload the JD PDF to Supabase Storage.
   *
   * Real implementation:
   *   const path = `job-descriptions/${Date.now()}-${file.name}`;
   *   const { data, error } = await supabase.storage
   *     .from('job-descriptions')
   *     .upload(path, file);
   *   if (error) throw error;
   *   return data.path;
   *
   * @param {File} file
   * @returns {Promise<string>} the storage path / file reference
   */
  async function uploadJdToStorage(file) {
    console.warn('[AdminDashboard] uploadJdToStorage is a stub — connect Supabase Storage here.');
    // Simulated delay so the processing state is visible in the prototype.
    await new Promise((r) => setTimeout(r, 600));
    return `job-descriptions/${Date.now()}-${file.name}`;
  }

  /**
   * STEP 2 — Send the uploaded file reference to the Edge Function
   *           that extracts structured job details.
   *
   * Real implementation:
   *   const { data, error } = await supabase.functions.invoke(
   *     'extract-job-description',
   *     { body: { filePath } }
   *   );
   *   if (error) throw error;
   *   return data; // structured JSON
   *
   * @param {string} filePath
   * @returns {Promise<object>} structured opening JSON
   */
  async function extractJobDetails(filePath) {
    console.warn('[AdminDashboard] extractJobDetails is a stub — connect Supabase Edge Function here.');
    // Simulated delay so the processing state is visible.
    await new Promise((r) => setTimeout(r, 1400));

    // Placeholder shape — matches the expected JSON contract.
    // Replace entirely with the real Edge Function response.
    return {
      title: 'Software Engineering Intern',
      organization: 'TechNova',
      department: 'Engineering',
      location: 'Bengaluru, India',
      jobType: 'Internship',
      workMode: 'On-site',
      experience: 'Entry Level',
      description:
        'We are looking for a motivated Software Engineering Intern to join our platform team. You will work alongside senior engineers to design, build, and ship features used by thousands of customers.',
      responsibilities: [
        'Build and maintain frontend and backend features.',
        'Write clean, well-tested code.',
        'Collaborate with designers and product managers.'
      ],
      requiredQualifications: [
        'Currently pursuing a degree in Computer Science or related field.',
        'Strong fundamentals in JavaScript and data structures.'
      ],
      preferredQualifications: [
        'Familiarity with React or a similar framework.',
        'Prior internship experience.'
      ],
      skills: ['JavaScript', 'React', 'Node.js', 'Git'],
      benefits: ['Mentorship', 'Flexible hours', 'Learning stipend'],
      applicationDeadline: '2026-09-30'
    };
  }

  /**
   * STEP 3 — Persist the reviewed opening JSON to Supabase.
   *
   * Real implementation:
   *   const { data, error } = await supabase
   *     .from('openings')
   *     .insert([opening])
   *     .select()
   *     .single();
   *   if (error) throw error;
   *   return data; // includes the new id
   *
   * @param {object} opening
   * @returns {Promise<{id: string}>}
   */
  async function publishOpening(opening) {
    console.warn('[AdminDashboard] publishOpening is a stub — connect Supabase DB here.');
    await new Promise((r) => setTimeout(r, 700));
    return { id: 'op-' + Math.random().toString(36).slice(2, 9) };
  }

  // ============================================================
  // 5. EXTRACT FLOW
  // ============================================================
  extractBtn.addEventListener('click', async () => {
    if (!state.file) {
      showToast('Please upload a PDF file first.', 'error');
      return;
    }

    setStep('processing');

    try {
      const filePath = await uploadJdToStorage(state.file);
      const data = await extractJobDetails(filePath);

      state.currentOpening = data;
      populateForm(data);
      setStep('review');
    } catch (err) {
      console.error(err);
      showToast(
        "We couldn't extract the job details from this file. Please try again or enter the details manually.",
        'error'
      );
      setStep('upload');
    }
  });

  // ============================================================
  // 6. FORM POPULATION & EDITING
  // ============================================================
  function populateForm(d) {
    document.getElementById('fTitle').value         = d.title || '';
    document.getElementById('fOrganization').value  = d.organization || '';
    document.getElementById('fDepartment').value    = d.department || '';
    document.getElementById('fLocation').value      = d.location || '';
    document.getElementById('fJobType').value       = d.jobType || '';
    document.getElementById('fWorkMode').value      = d.workMode || '';
    document.getElementById('fExperience').value    = d.experience || '';
    document.getElementById('fDescription').value   = d.description || '';
    document.getElementById('fDeadline').value      = d.applicationDeadline || '';
    document.getElementById('fStatus').value        = 'active';

    renderList('responsibilities', d.responsibilities || []);
    renderList('requiredQualifications', d.requiredQualifications || []);
    renderList('preferredQualifications', d.preferredQualifications || []);
    renderList('benefits', d.benefits || []);
    renderSkills(d.skills || []);

    updatePublishState();
  }

  // ---- List editor (responsibilities, quals, benefits) ----
  function renderList(listName, items) {
    const container = document.querySelector(`.list-editor[data-list="${listName}"]`);
    if (!container) return;
    container.innerHTML = '';

    items.forEach((value) => {
      container.appendChild(buildListItem(listName, value));
    });
  }

  function buildListItem(listName, value) {
    const row = document.createElement('div');
    row.className = 'list-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.setAttribute('data-list', listName);
    input.addEventListener('input', updatePublishState);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'icon-btn';
    remove.setAttribute('aria-label', 'Remove item');
    remove.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    remove.addEventListener('click', () => {
      row.remove();
      updatePublishState();
    });

    row.appendChild(input);
    row.appendChild(remove);
    return row;
  }

  document.querySelectorAll('.add-item-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const listName = btn.dataset.add;
      const container = document.querySelector(`.list-editor[data-list="${listName}"]`);
      if (!container) return;
      const row = buildListItem(listName, '');
      container.appendChild(row);
      row.querySelector('input').focus();
    });
  });

  function collectList(listName) {
    const container = document.querySelector(`.list-editor[data-list="${listName}"]`);
    if (!container) return [];
    return Array.from(container.querySelectorAll('input'))
      .map((i) => i.value.trim())
      .filter(Boolean);
  }

  // ---- Skills tag editor ----
  function renderSkills(skills) {
    skillsEditor.innerHTML = '';
    skills.forEach((s) => skillsEditor.appendChild(buildSkillTag(s)));
  }

  function buildSkillTag(skill) {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.innerHTML = `<span>${escapeHtml(skill)}</span>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tag-remove';
    btn.setAttribute('aria-label', 'Remove skill');
    btn.textContent = '×';
    btn.addEventListener('click', () => tag.remove());
    tag.appendChild(btn);
    return tag;
  }

  function addSkillFromInput() {
    const value = skillInput.value.trim();
    if (!value) return;
    skillsEditor.appendChild(buildSkillTag(value));
    skillInput.value = '';
    skillInput.focus();
  }

  addSkillBtn.addEventListener('click', addSkillFromInput);
  skillInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkillFromInput();
    }
  });

  function collectSkills() {
    return Array.from(skillsEditor.querySelectorAll('.skill-tag > span'))
      .map((s) => s.textContent.trim())
      .filter(Boolean);
  }

  // ============================================================
  // 7. BUILD OPENING JSON FROM FORM
  // ============================================================
  function buildOpeningFromForm(status) {
    return {
      title:                   document.getElementById('fTitle').value.trim(),
      organization:            document.getElementById('fOrganization').value.trim(),
      department:              document.getElementById('fDepartment').value.trim(),
      location:                document.getElementById('fLocation').value.trim(),
      jobType:                 document.getElementById('fJobType').value,
      workMode:                document.getElementById('fWorkMode').value,
      experience:              document.getElementById('fExperience').value,
      description:             document.getElementById('fDescription').value.trim(),
      responsibilities:        collectList('responsibilities'),
      requiredQualifications:  collectList('requiredQualifications'),
      preferredQualifications: collectList('preferredQualifications'),
      skills:                  collectSkills(),
      benefits:                collectList('benefits'),
      applicationDeadline:     document.getElementById('fDeadline').value,
      positions:               Number(document.getElementById('fPositions').value) || 1,
      status:                  status || document.getElementById('fStatus').value
    };
  }

  // ---- Publish button state ----
  const REQUIRED_FIELDS = ['fTitle', 'fOrganization', 'fLocation', 'fJobType', 'fDescription', 'fDeadline'];

  function updatePublishState() {
    const allFilled = REQUIRED_FIELDS.every((id) => {
      const el = document.getElementById(id);
      return el && el.value && el.value.trim() !== '';
    });
    publishBtn.disabled = !allFilled;
  }

  // Re-evaluate whenever a required field changes
  REQUIRED_FIELDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updatePublishState);
      el.addEventListener('change', updatePublishState);
    }
  });

  // ============================================================
  // 8. SUBMIT HANDLERS
  // ============================================================
  openingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const opening = buildOpeningFromForm('active');

    // Basic sanity check (button state already prevents most cases)
    if (!opening.title || !opening.organization || !opening.location ||
        !opening.jobType || !opening.description || !opening.applicationDeadline) {
      showToast('Please fill in all required fields before publishing.', 'error');
      return;
    }

    publishBtn.disabled = true;
    publishBtn.textContent = 'Publishing…';

    try {
      const result = await publishOpening(opening);
      state.publishedId = result.id;

      // Success UI
      // Admin action: go to the ranking page for this opening
    viewOpeningBtn.href = `ranking.html?opening_id=${encodeURIComponent(result.id)}`;

    // Optional admin convenience: preview the candidate-facing page in a new tab
    previewOpeningBtn.href =
    `../candidate/opening.html?id=${encodeURIComponent(result.id)}`;
      setStep('success');

      // Prepend the new opening to the published table.
      addPublishedRow(opening, result.id);
    } catch (err) {
      console.error(err);
      showToast("The opening couldn't be published. Please try again.", 'error');
    } finally {
      publishBtn.disabled = false;
      publishBtn.textContent = 'Publish Opening';
      updatePublishState();
    }
  });

  saveDraftBtn.addEventListener('click', async () => {
    const opening = buildOpeningFromForm('draft');

    if (!opening.title) {
      showToast('A draft needs at least a job title.', 'error');
      return;
    }

    saveDraftBtn.disabled = true;
    saveDraftBtn.textContent = 'Saving…';

    try {
      await publishOpening(opening);
      showToast('Draft saved successfully.');
    } catch (err) {
      console.error(err);
      showToast("The draft couldn't be saved. Please try again.", 'error');
    } finally {
      saveDraftBtn.disabled = false;
      saveDraftBtn.textContent = 'Save as Draft';
    }
  });

  backToDashboard.addEventListener('click', () => {
    // Reset the workflow but keep the published table intact.
    resetFileSelection();
    setStep('upload');
    openingForm.reset();
    skillsEditor.innerHTML = '';
    document.querySelectorAll('.list-editor').forEach((el) => (el.innerHTML = ''));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ============================================================
  // 9. PUBLISHED OPENINGS TABLE (prototype data)
  //    Replace this with a Supabase fetch when connected:
  //      const { data } = await supabase.from('openings').select('*');
  // ============================================================
  const PROTOTYPE_OPENINGS = [
    { id: 'op-101', title: 'Software Engineering Intern', organization: 'TechNova', location: 'Bengaluru', jobType: 'Internship', applications: 42, deadline: '30 Sep 2026', status: 'active' },
    { id: 'op-102', title: 'Frontend Developer', organization: 'PixelWorks', location: 'Remote', jobType: 'Full-time', applications: 28, deadline: '15 Oct 2026', status: 'active' },
    { id: 'op-103', title: 'Data Analyst Intern', organization: 'InsightLab', location: 'Mumbai', jobType: 'Internship', applications: 19, deadline: '22 Sep 2026', status: 'active' },
    { id: 'op-104', title: 'Product Design Lead', organization: 'Northwind', location: 'Delhi', jobType: 'Full-time', applications: 7, deadline: '28 Sep 2026', status: 'draft' },
    { id: 'op-105', title: 'Marketing Intern', organization: 'BrightReach', location: 'Remote', jobType: 'Internship', applications: 33, deadline: '10 Oct 2026', status: 'closed' }
  ];

  function statusBadge(status) {
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return `<span class="status-badge status-${status}">${label}</span>`;
  }

  function addPublishedRow(opening, id) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td data-label="Job Title">${escapeHtml(opening.title)}</td>
        <td data-label="Organization">${escapeHtml(opening.organization)}</td>
        <td data-label="Location">${escapeHtml(opening.location)}</td>
        <td data-label="Job Type">${escapeHtml(opening.jobType)}</td>
        <td data-label="Applications">0</td>
        <td data-label="Deadline">${escapeHtml(opening.applicationDeadline)}</td>
        <td data-label="Status">${statusBadge(opening.status || 'active')}</td>
        <td data-label="Actions" class="align-right">
        <div class="row-actions">
            <a class="row-action" href="ranking.html?opening_id=${encodeURIComponent(id)}">View Candidates</a>
            <button type="button" class="row-action">Edit</button>
            <button type="button" class="row-action">Manage Applications</button>
            <button type="button" class="row-action danger">Close</button>
        </div>
        </td>
    `;
    publishedTbody.insertBefore(tr, publishedTbody.firstChild);
    }

  function renderPublishedTable() {
  publishedTbody.innerHTML = '';
  PROTOTYPE_OPENINGS.forEach((op) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Job Title">${escapeHtml(op.title)}</td>
      <td data-label="Organization">${escapeHtml(op.organization)}</td>
      <td data-label="Location">${escapeHtml(op.location)}</td>
      <td data-label="Job Type">${escapeHtml(op.jobType)}</td>
      <td data-label="Applications">${op.applications}</td>
      <td data-label="Deadline">${escapeHtml(op.deadline)}</td>
      <td data-label="Status">${statusBadge(op.status)}</td>
      <td data-label="Actions" class="align-right">
        <div class="row-actions">
          <a class="row-action" href="ranking.html?opening_id=${encodeURIComponent(op.id)}">View Candidates</a>
          <button type="button" class="row-action">Edit</button>
          <button type="button" class="row-action">Manage Applications</button>
          <button type="button" class="row-action danger">Close</button>
        </div>
      </td>
    `;
    publishedTbody.appendChild(tr);
  });
}

  // ============================================================
  // 10. RECENT APPLICATIONS (prototype data)
  //     Replace with a Supabase fetch when connected.
  // ============================================================
  const PROTOTYPE_APPLICATIONS = [
    { candidate: 'Aarav Mehta',   opening: 'Software Engineering Intern', applied: '12 Sep 2026', status: 'review' },
    { candidate: 'Priya Nair',    opening: 'Frontend Developer',          applied: '11 Sep 2026', status: 'shortlisted' },
    { candidate: 'Rohan Sharma',  opening: 'Data Analyst Intern',         applied: '10 Sep 2026', status: 'submitted' },
    { candidate: 'Sneha Iyer',    opening: 'UI/UX Design Intern',         applied: '09 Sep 2026', status: 'interview' }
  ];

  function renderRecentApplications() {
    recentAppsList.innerHTML = '';
    PROTOTYPE_APPLICATIONS.forEach((app) => {
      const item = document.createElement('div');
      item.className = 'app-item';
      item.innerHTML = `
        <div class="app-info">
          <div class="app-title">${escapeHtml(app.candidate)}</div>
          <div class="app-org">${escapeHtml(app.opening)}</div>
        </div>
        <div class="app-meta">
          <span class="app-date">Applied ${escapeHtml(app.applied)}</span>
          <span class="status-badge status-${app.status}">${app.status.charAt(0).toUpperCase() + app.status.slice(1)}</span>
          <button type="button" class="row-action">View</button>
        </div>
      `;
      recentAppsList.appendChild(item);
    });
  }

  // ============================================================
  // 11. MOBILE NAV
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

  // ============================================================
  // 12. INIT
  // ============================================================
  setStep('upload');
  renderPublishedTable();
  renderRecentApplications();
  updatePublishState();
})();