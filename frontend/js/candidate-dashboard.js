// js/candidate-dashboard.js
// Candidate Dashboard — openings rendering, search, filters, and UI behavior.

(function () {
  'use strict';

  // ============================================================
  // 1. DATA — replace with a real fetch when the backend is ready
  // ============================================================
  // Example: fetch('../../api/openings.json').then(r => r.json())
  // For now, a local array keeps the UI fully functional.
  const OPENINGS = [
    {
      id: 'op-001',
      title: 'Software Engineering Intern',
      organization: 'TechNova',
      location: 'Bengaluru',
      jobType: 'Internship',
      department: 'Engineering',
      experience: 'Entry Level',
      description:
        'Work alongside senior engineers to build and ship features for a fast-growing SaaS platform. Strong fundamentals in JavaScript and problem-solving required.',
      postedAgo: 'Posted 2 days ago',
      deadline: 'Deadline: 30 Sep 2026',
      url: 'opening.html?id=op-001'
    },
    {
      id: 'op-002',
      title: 'Frontend Developer',
      organization: 'PixelWorks',
      location: 'Remote',
      jobType: 'Full-time',
      department: 'Engineering',
      experience: '1-2 Years',
      description:
        'Build polished, accessible user interfaces with React and modern CSS. Collaborate closely with designers and backend engineers.',
      postedAgo: 'Posted 5 days ago',
      deadline: 'Deadline: 15 Oct 2026',
      url: 'opening.html?id=op-002'
    },
    {
      id: 'op-003',
      title: 'Data Analyst Intern',
      organization: 'InsightLab',
      location: 'Mumbai',
      jobType: 'Internship',
      department: 'Data',
      experience: 'Entry Level',
      description:
        'Analyze product and customer data to surface actionable insights. Comfortable with SQL, Python, and basic statistics.',
      postedAgo: 'Posted 1 week ago',
      deadline: 'Deadline: 22 Sep 2026',
      url: 'opening.html?id=op-003'
    },
    {
      id: 'op-004',
      title: 'UI/UX Design Intern',
      organization: 'Craftly',
      location: 'Delhi',
      jobType: 'Internship',
      department: 'Design',
      experience: 'Entry Level',
      description:
        'Design clean, user-first interfaces for mobile and web. Portfolio and familiarity with Figma required.',
      postedAgo: 'Posted 3 days ago',
      deadline: 'Deadline: 05 Oct 2026',
      url: 'opening.html?id=op-004'
    },
    {
      id: 'op-005',
      title: 'Backend Engineer',
      organization: 'CloudMint',
      location: 'Bengaluru',
      jobType: 'Full-time',
      department: 'Engineering',
      experience: '2-5 Years',
      description:
        'Design and maintain scalable APIs and services. Experience with Node.js, PostgreSQL, and cloud deployment is a plus.',
      postedAgo: 'Posted 6 days ago',
      deadline: 'Deadline: 18 Oct 2026',
      url: 'opening.html?id=op-005'
    },
    {
      id: 'op-006',
      title: 'Marketing Intern',
      organization: 'BrightReach',
      location: 'Remote',
      jobType: 'Internship',
      department: 'Marketing',
      experience: 'Entry Level',
      description:
        'Support campaign planning, content creation, and social media analytics. Strong written communication skills needed.',
      postedAgo: 'Posted 4 days ago',
      deadline: 'Deadline: 10 Oct 2026',
      url: 'opening.html?id=op-006'
    },
    {
      id: 'op-007',
      title: 'Product Design Lead',
      organization: 'Northwind',
      location: 'Delhi',
      jobType: 'Full-time',
      department: 'Design',
      experience: '5+ Years',
      description:
        'Own end-to-end product design for a suite of B2B tools. Lead a small team and shape the design system.',
      postedAgo: 'Posted 2 weeks ago',
      deadline: 'Deadline: 28 Sep 2026',
      url: 'opening.html?id=op-007'
    },
    {
      id: 'op-008',
      title: 'Data Engineer',
      organization: 'InsightLab',
      location: 'Mumbai',
      jobType: 'Contract',
      department: 'Data',
      experience: '2-5 Years',
      description:
        'Build reliable data pipelines and warehouses. Strong SQL and experience with Airflow or dbt preferred.',
      postedAgo: 'Posted 8 days ago',
      deadline: 'Deadline: 20 Oct 2026',
      url: 'opening.html?id=op-008'
    }
  ];

  // ============================================================
  // 2. DOM REFERENCES
  // ============================================================
  const grid = document.getElementById('openingsGrid');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterLocation = document.getElementById('filterLocation');
  const filterJobType = document.getElementById('filterJobType');
  const filterDepartment = document.getElementById('filterDepartment');
  const filterExperience = document.getElementById('filterExperience');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const statAvailable = document.getElementById('statAvailable');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  // ============================================================
  // 3. HELPERS
  // ============================================================
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Build a single card element for an opening
  function buildCard(opening) {
    const card = document.createElement('article');
    card.className = 'opening-card';

    card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(opening.title)}</h3>
        <p class="card-org">${escapeHtml(opening.organization)}</p>
      </div>

      <div class="card-tags">
        <span class="card-tag tag-location">${escapeHtml(opening.location)}</span>
        <span class="card-tag">${escapeHtml(opening.jobType)}</span>
        <span class="card-tag">${escapeHtml(opening.experience)}</span>
      </div>

      <p class="card-description">${escapeHtml(opening.description)}</p>

      <div class="card-footer">
        <div class="card-dates">
          <span class="card-date">${escapeHtml(opening.postedAgo)}</span>
          <span class="card-date">${escapeHtml(opening.deadline)}</span>
        </div>
        <a class="btn-view" href="${escapeHtml(opening.url)}">View Opening</a>
      </div>
    `;

    return card;
  }

  // ============================================================
  // 4. FILTERING
  // ============================================================
  function getFilteredOpenings() {
    const query = (searchInput.value || '').trim().toLowerCase();
    const location = filterLocation.value;
    const jobType = filterJobType.value;
    const department = filterDepartment.value;
    const experience = filterExperience.value;

    return OPENINGS.filter((op) => {
      // Free-text search across title, org, description, location
      if (query) {
        const haystack = [
          op.title,
          op.organization,
          op.description,
          op.location,
          op.jobType,
          op.department,
          op.experience
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (location && op.location !== location) return false;
      if (jobType && op.jobType !== jobType) return false;
      if (department && op.department !== department) return false;
      if (experience && op.experience !== experience) return false;

      return true;
    });
  }

  // ============================================================
  // 5. RENDER
  // ============================================================
  function render() {
    const results = getFilteredOpenings();

    // Clear grid
    grid.innerHTML = '';

    // Toggle empty state vs grid
    if (results.length === 0) {
      grid.hidden = true;
      emptyState.hidden = false;
    } else {
      grid.hidden = false;
      emptyState.hidden = true;

      const frag = document.createDocumentFragment();
      results.forEach((op) => frag.appendChild(buildCard(op)));
      grid.appendChild(frag);
    }

    // Keep the "Available Opportunities" stat in sync with reality
    if (statAvailable) {
      statAvailable.textContent = String(OPENINGS.length);
    }
  }

  // ============================================================
  // 6. EVENT LISTENERS — search & filters
  // ============================================================
  // Debounce search so we don't re-render on every keystroke.
  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(render, 150);
  });

  [filterLocation, filterJobType, filterDepartment, filterExperience].forEach(
    (el) => el.addEventListener('change', render)
  );

  // Clear filters
  clearFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    filterLocation.value = '';
    filterJobType.value = '';
    filterDepartment.value = '';
    filterExperience.value = '';
    render();
    searchInput.focus();
  });

  // ============================================================
  // 7. MOBILE NAV TOGGLE
  // ============================================================
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close the menu when a link is clicked (mobile UX)
    navLinks.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          navLinks.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // ============================================================
  // 8. INIT
  // ============================================================
  render();
})();