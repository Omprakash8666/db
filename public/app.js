/**
 * NexusAuth Client Application Logic
 * Connects Frontend Form -> Express API -> SQLite Database
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('registration-form');
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const togglePwdBtn = document.getElementById('toggle-pwd-btn');
  const submitBtn = document.getElementById('submit-btn');
  const btnSpinner = document.getElementById('btn-spinner');
  const btnText = submitBtn.querySelector('.btn-text');

  // Views
  const formContainer = document.getElementById('form-container');
  const successContainer = document.getElementById('success-container');
  const registerAnotherBtn = document.getElementById('register-another-btn');
  const viewRecordsBtn = document.getElementById('view-records-btn');

  // Preview elements
  const previewId = document.getElementById('preview-id');
  const previewName = document.getElementById('preview-name');
  const previewEmail = document.getElementById('preview-email');

  // Modal elements
  const dbModal = document.getElementById('db-modal');
  const toggleDbModalBtn = document.getElementById('toggle-db-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const closeModalFooterBtn = document.getElementById('close-modal-footer-btn');
  const refreshDbBtn = document.getElementById('refresh-db-btn');
  const dbTableBody = document.getElementById('db-table-body');
  const tableEmptyState = document.getElementById('table-empty-state');
  const usersCountBadge = document.getElementById('users-count-badge');

  // Status Pill
  const dbStatusPill = document.getElementById('db-status-pill');
  const dbStatusText = document.getElementById('db-status-text');

  // Determine Backend API Base URL
  // If user opens index.html directly from Windows file explorer (file:///), point to localhost:5000
  const API_BASE = (window.location.protocol === 'file:' || !window.location.origin.includes(':5000'))
    ? 'http://localhost:5000'
    : '';

  // Password Strength Elements
  const strengthBar = document.getElementById('strength-bar');
  const strengthDesc = document.getElementById('strength-desc');
  const reqLength = document.getElementById('req-length');
  const reqNumber = document.getElementById('req-number');
  const reqUpper = document.getElementById('req-upper');

  // --- 1. Check Backend & Database Health on Load ---
  async function checkConnection() {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (response.ok) {
        const data = await response.json();
        dbStatusPill.className = 'status-pill status-connected';
        dbStatusText.textContent = 'SQLite Connected';
        dbStatusPill.title = `Database: ${data.database} | Status: Online`;
        fetchUserCount();
      } else {
        throw new Error('Health check returned non-200');
      }
    } catch (err) {
      dbStatusPill.className = 'status-pill status-error';
      dbStatusText.textContent = 'DB Disconnected';
      console.error('Database connection check failed:', err);
    }
  }

  // --- 2. Fetch User Count for Navbar Badge ---
  async function fetchUserCount() {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      const data = await res.json();
      if (data.success) {
        usersCountBadge.textContent = data.count || 0;
      }
    } catch (err) {
      console.warn('Could not fetch user count:', err);
    }
  }

  // --- 3. Toggle Password Visibility ---
  togglePwdBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    togglePwdBtn.innerHTML = isPassword
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  });

  // --- 4. Password Strength Meter Calculation ---
  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    const hasLength = val.length >= 6;
    const hasNumber = /\d/.test(val);
    const hasUpper = /[A-Z]/.test(val);

    // Update requirements items
    updateRequirement(reqLength, hasLength);
    updateRequirement(reqNumber, hasNumber);
    updateRequirement(reqUpper, hasUpper);

    // Score calculation
    let score = 0;
    if (val.length >= 6) score += 30;
    if (val.length >= 10) score += 20;
    if (hasNumber) score += 25;
    if (hasUpper) score += 25;

    strengthBar.style.width = `${score}%`;

    if (val.length === 0) {
      strengthBar.style.width = '0%';
      strengthDesc.textContent = 'None';
      strengthDesc.style.color = 'var(--text-muted)';
      strengthBar.style.backgroundColor = 'var(--danger)';
    } else if (score < 40) {
      strengthDesc.textContent = 'Weak';
      strengthDesc.style.color = '#ef4444';
      strengthBar.style.backgroundColor = '#ef4444';
    } else if (score < 75) {
      strengthDesc.textContent = 'Medium';
      strengthDesc.style.color = '#f59e0b';
      strengthBar.style.backgroundColor = '#f59e0b';
    } else {
      strengthDesc.textContent = 'Strong';
      strengthDesc.style.color = '#10b981';
      strengthBar.style.backgroundColor = '#10b981';
    }
  });

  function updateRequirement(el, isValid) {
    if (isValid) {
      el.classList.add('valid');
      el.querySelector('.req-icon').textContent = '✓';
    } else {
      el.classList.remove('valid');
      el.querySelector('.req-icon').textContent = '✕';
    }
  }

  // --- 5. Real-time Field Validation & Error Clearing ---
  [fullNameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
    input.addEventListener('input', () => {
      clearFieldError(input);
    });
  });

  function setFieldError(input, message) {
    input.classList.add('input-error');
    const errSpan = document.getElementById(`${input.id}-error`) || 
                    (input.id === 'confirmPassword' ? document.getElementById('confirm-password-error') : null);
    if (errSpan) errSpan.textContent = message;
  }

  function clearFieldError(input) {
    input.classList.remove('input-error');
    const errSpan = document.getElementById(`${input.id}-error`) || 
                    (input.id === 'confirmPassword' ? document.getElementById('confirm-password-error') : null);
    if (errSpan) errSpan.textContent = '';
  }

  // --- 6. Form Submission (Frontend -> Backend API -> SQLite) ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validate Full Name
    if (!fullName) {
      setFieldError(fullNameInput, 'Please enter your full name.');
      isValid = false;
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setFieldError(emailInput, 'Please enter your email address.');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setFieldError(emailInput, 'Please provide a valid email address.');
      isValid = false;
    }

    // Validate Password
    if (!password) {
      setFieldError(passwordInput, 'Please enter a password.');
      isValid = false;
    } else if (password.length < 6) {
      setFieldError(passwordInput, 'Password must be at least 6 characters.');
      isValid = false;
    }

    // Validate Confirm Password
    if (password !== confirmPassword) {
      setFieldError(confirmPasswordInput, 'Passwords do not match.');
      isValid = false;
    }

    if (!isValid) return;

    // Set UI to loading state
    setSubmitting(true);

    try {
      // Send HTTP POST request to Express backend
      const response = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          fullName,
          email,
          password
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success: Show toast & update UI
        showToast('Account registered and saved to database!', 'success');
        
        // Populate preview card
        previewId.textContent = `#${result.user.id}`;
        previewName.textContent = result.user.fullName;
        previewEmail.textContent = result.user.email;

        // Switch views
        formContainer.classList.remove('active');
        successContainer.classList.add('active');

        // Update record count badge
        fetchUserCount();
      } else {
        // Handle server-side validation / duplicate email error
        showToast(result.message || 'Registration failed.', 'error');
        if (result.message && result.message.toLowerCase().includes('email')) {
          setFieldError(emailInput, result.message);
        }
      }
    } catch (error) {
      console.error('Registration network error:', error);
      showToast('Could not reach backend server. Ensure Express is running.', 'error');
    } finally {
      setSubmitting(false);
    }
  });

  function setSubmitting(loading) {
    submitBtn.disabled = loading;
    if (loading) {
      btnSpinner.classList.remove('hidden');
      btnText.textContent = 'Saving to Database...';
    } else {
      btnSpinner.classList.add('hidden');
      btnText.textContent = 'Register & Save to Database';
    }
  }

  // --- 7. Reset Form for Another Registration ---
  registerAnotherBtn.addEventListener('click', () => {
    form.reset();
    strengthBar.style.width = '0%';
    strengthDesc.textContent = 'None';
    strengthDesc.style.color = 'var(--text-muted)';
    [reqLength, reqNumber, reqUpper].forEach(el => updateRequirement(el, false));
    successContainer.classList.remove('active');
    formContainer.classList.add('active');
    fullNameInput.focus();
  });

  // --- 8. Live Database Records Modal ---
  async function loadDatabaseRecords() {
    dbTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading records from SQLite...</td></tr>`;
    tableEmptyState.classList.add('hidden');

    try {
      const res = await fetch(`${API_BASE}/api/users`);
      const data = await res.json();

      if (data.success && data.users && data.users.length > 0) {
        usersCountBadge.textContent = data.users.length;
        dbTableBody.innerHTML = '';
        data.users.forEach(u => {
          const row = document.createElement('tr');
          const formattedDate = new Date(u.createdAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
          });

          row.innerHTML = `
            <td><span class="db-id-badge">#${u.id}</span></td>
            <td><strong>${escapeHtml(u.fullName)}</strong></td>
            <td><span class="code-pill">${escapeHtml(u.email)}</span></td>
            <td><span style="color: var(--text-muted); font-size: 0.78rem;">${formattedDate}</span></td>
            <td><span class="badge-security">Persisted</span></td>
          `;
          dbTableBody.appendChild(row);
        });
      } else {
        usersCountBadge.textContent = '0';
        dbTableBody.innerHTML = '';
        tableEmptyState.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Error fetching database records:', err);
      dbTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 2rem;">Failed to load records from database.</td></tr>`;
    }
  }

  function openModal() {
    dbModal.classList.remove('hidden');
    loadDatabaseRecords();
  }

  function closeModal() {
    dbModal.classList.add('hidden');
  }

  toggleDbModalBtn.addEventListener('click', openModal);
  viewRecordsBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  closeModalFooterBtn.addEventListener('click', closeModal);

  refreshDbBtn.addEventListener('click', () => {
    refreshDbBtn.style.transform = 'rotate(360deg)';
    refreshDbBtn.style.transition = 'transform 500ms ease';
    loadDatabaseRecords();
    setTimeout(() => {
      refreshDbBtn.style.transform = 'none';
      refreshDbBtn.style.transition = 'none';
    }, 500);
  });

  dbModal.addEventListener('click', (e) => {
    if (e.target === dbModal) closeModal();
  });

  // --- 9. Toast Notification Helper ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Initial connection check
  checkConnection();
});
