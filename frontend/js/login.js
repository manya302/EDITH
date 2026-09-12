// js/login.js — role selection, email check, auth flow, and redirect
// Structure:
//   1. UI & role-selection logic
//   2. Authentication logic (Supabase-ready, no hardcoded credentials)
//   3. Dashboard redirection

(function() {
  'use strict';

  // ============================================================
  // 1. UI & ROLE-SELECTION LOGIC
  // ============================================================

  // DOM references
  const roleButtons = document.querySelectorAll('.role-btn');
  const formTitle = document.getElementById('formTitle');
  const formSubtitle = document.getElementById('formSubtitle');

  // Form elements
  const emailForm = document.getElementById('emailForm');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  // Input elements
  const emailInput = document.getElementById('email');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const signupEmail = document.getElementById('signupEmail');
  const signupPassword = document.getElementById('signupPassword');
  const signupConfirm = document.getElementById('signupConfirm');

  // Buttons
  const backToEmailFromLogin = document.getElementById('backToEmailFromLogin');
  const backToEmailFromSignup = document.getElementById('backToEmailFromSignup');

  // State
  let currentRole = 'student'; // 'student' | 'admin'
  let currentStep = 'email';    // 'email' | 'login' | 'signup'
  let pendingEmail = '';        // email captured in the first step

  // ---- Role switching ----
  function setActiveRole(role) {
    currentRole = role;
    roleButtons.forEach(btn => {
      const isActive = btn.dataset.role === role;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive);
    });
  }

  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // If the user changes role mid-flow, reset back to the email step.
      if (currentRole !== btn.dataset.role) {
        setActiveRole(btn.dataset.role);
        showStep('email');
      }
    });
  });

  // ---- Step switching (UI) ----
  function showStep(step) {
    currentStep = step;

    // Hide all forms
    emailForm.classList.remove('active');
    loginForm.classList.remove('active');
    signupForm.classList.remove('active');

    // Update headings
    if (step === 'email') {
      formTitle.textContent = 'Welcome';
      formSubtitle.textContent = 'Enter your email to continue';
      emailForm.classList.add('active');
      emailInput.focus();
    } else if (step === 'login') {
      formTitle.textContent = 'Welcome back';
      formSubtitle.textContent = 'Sign in to your account';
      loginForm.classList.add('active');
      loginPassword.focus();
    } else if (step === 'signup') {
      formTitle.textContent = 'Create your account';
      formSubtitle.textContent = 'Get started in seconds';
      signupForm.classList.add('active');
      signupPassword.focus();
    }
  }

  // Prefill the readonly email fields when moving to login/signup
  function prefillEmailFields(email) {
    loginEmail.value = email;
    signupEmail.value = email;
  }

  // Back to email step from login or signup
  backToEmailFromLogin.addEventListener('click', () => {
    emailInput.value = pendingEmail;
    showStep('email');
  });

  backToEmailFromSignup.addEventListener('click', () => {
    emailInput.value = pendingEmail;
    showStep('email');
  });

  // ============================================================
  // 2. AUTHENTICATION LOGIC (Supabase-ready)
  // ============================================================
  //
  // These functions are intentionally thin wrappers. Replace the
  // bodies with real Supabase calls when the backend is connected.
  //
  // The goal is to keep the UI free of direct Supabase imports so
  // the auth layer can be swapped or mocked cleanly.
  // ============================================================

  const AuthService = {
    /**
     * Check whether an email belongs to an existing account.
     *
     * IMPORTANT: Do NOT query the database directly from the frontend
     * to check if an arbitrary email exists. Instead, call a Supabase
     * RPC / Edge Function that safely performs this check server-side,
     * OR rely on the sign-in attempt itself to reveal account existence.
     *
     * This stub simulates the decision so the UI flow can be wired up.
     * Replace with something like:
     *
     *   const { data, error } = await supabase.rpc('email_exists', { email });
     *   if (error) throw error;
     *   return data; // true | false
     *
     * @param {string} email
     * @returns {Promise<boolean>} true if the user already exists
     */

    // ============================================================
    // SUPABASE TODO:
    // Replace this demo email-existence check with the real
    // Supabase/backend implementation.
    //
    // DO NOT keep this demo logic in production.
    // ============================================================
    async emailExists(email) {
      // --- REPLACE WITH REAL SUPABASE LOGIC ---
      // Placeholder: treat any email containing "new" as a first-time user,
      // and everything else as an existing user. This is ONLY a mock so the
      // UI can be demonstrated. Do not ship this.
      console.warn('[AuthService] emailExists is a stub. Connect Supabase here.');
      await new Promise(resolve => setTimeout(resolve, 350));
      return !email.toLowerCase().includes('new');
    },

    /**
     * Sign in an existing user.
     *
     * Replace with:
     *   const { data, error } = await supabase.auth.signInWithPassword({
     *     email, password
     *   });
     *   if (error) throw error;
     *   return data.user;
     *
     * @param {string} email
     * @param {string} password
     * @returns {Promise<object>} the authenticated user
     */
    // ============================================================
    // SUPABASE TODO:
    // Replace this demo sign-in with Supabase Auth.
    // Authenticate using email + password and retrieve the
    // authenticated user's role/profile.
    //
    // ============================================================
    async signIn(email, password) {
      console.warn('[AuthService] signIn is a stub. Connect Supabase here.');
      await new Promise(resolve => setTimeout(resolve, 500));
      // Simulate a successful sign-in
      return { email, role: currentRole };
    },

    /**
     * Create a new account.
     *
     * Replace with:
     *   const { data, error } = await supabase.auth.signUp({
     *     email, password
     *   });
     *   if (error) throw error;
     *   // Optionally store the chosen role in a profile table.
     *   return data.user;
     *
     * @param {string} email
     * @param {string} password
     * @returns {Promise<object>} the newly created user
     */
    // ============================================================
    // SUPABASE TODO:
    // Replace this demo signup with Supabase Auth.
    //
    // After signup, the user's role must be stored/associated
    // with their account in Supabase.
    //
    // IMPORTANT:
    // If email confirmation is enabled in Supabase, signup may
    // require email verification before a session exists.
    // ============================================================
    async signUp(email, password) {
      console.warn('[AuthService] signUp is a stub. Connect Supabase here.');
      await new Promise(resolve => setTimeout(resolve, 500));
      // Simulate a successful sign-up
      return { email, role: currentRole };
    }
  };

  // ============================================================
  // 3. DASHBOARD REDIRECTION
  // ============================================================

  function redirectToDashboard(role) {
    if (role === 'student') {
      window.location.href = 'student-dashboard.html';
    } else if (role === 'admin') {
      window.location.href = 'admin-dashboard.html';
    } else {
      console.error('[Redirect] Unknown role:', role);
    }
  }

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  // ---- Step 1: Email submission ----
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert('Please enter your email.');
      return;
    }

    pendingEmail = email;
    prefillEmailFields(email);

    const submitBtn = document.getElementById('emailContinueBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking…';

    try {
      const exists = await AuthService.emailExists(email);
      if (exists) {
        showStep('login');
      } else {
        showStep('signup');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong while checking your email. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Continue';
    }
  });

  // ---- Step 2a: Login submission ----
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!password) {
      alert('Please enter your password.');
      return;
    }

    const loginBtn = document.getElementById('loginBtn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in…';

    try {
      await AuthService.signIn(email, password);
      // On success, continue straight to the dashboard.
      redirectToDashboard(currentRole);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Log in';
    }
  });

  // ---- Step 2b: Sign up submission ----
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const confirm = signupConfirm.value;

    if (!password || !confirm) {
      alert('Please fill in both password fields.');
      return;
    }

    if (password !== confirm) {
      alert('Passwords do not match. Please try again.');
      return;
    }

    const signupBtn = document.getElementById('signupBtn');
    signupBtn.disabled = true;
    signupBtn.textContent = 'Creating account…';

    try {
      await AuthService.signUp(email, password);
      // After successful sign-up, do NOT send the user back to login.
      // Continue directly into the dashboard.
      redirectToDashboard(currentRole);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Unable to create your account. Please try again.');
    } finally {
      signupBtn.disabled = false;
      signupBtn.textContent = 'Create account';
    }
  });

  // ---- Initialize ----
  setActiveRole('student');
  showStep('email');
})();