import { registerMember, checkMember } from './member-db.js';

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const yearEl = document.getElementById('year');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    navToggle.classList.toggle('is-active', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      navToggle.classList.remove('is-active');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const formRegister = document.getElementById('form-register');
const formCheck = document.getElementById('form-check');
const registerSuccess = document.getElementById('register-success');
const successMemberId = document.getElementById('success-member-id');
const checkResult = document.getElementById('check-result');
const btnSubmit = document.getElementById('btn-submit');

function showAlert(el, message, type = 'error') {
  if (!el) return;
  el.hidden = false;
  el.className = `check-result is-${type}`;
  el.textContent = message;
}

function hideAlert(el) {
  if (el) el.hidden = true;
}

function formatDate(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

if (formRegister) {
  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(checkResult);

    if (!formRegister.reportValidity()) return;

    const payload = {
      nama: formRegister.nama.value,
      email: formRegister.email.value,
      telepon: formRegister.telepon.value,
      alamat: formRegister.alamat.value,
      kecamatan: formRegister.kecamatan.value,
      gerai: formRegister.gerai.value,
    };

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Memproses...';

    const result = await registerMember(payload);

    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Daftar Sekarang';

    if (result.success) {
      registerSuccess.hidden = false;
      successMemberId.textContent = result.member.id;
      formRegister.reset();
      registerSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      registerSuccess.hidden = true;
      showAlert(checkResult, result.message || 'Registrasi gagal. Coba lagi.', 'error');
    }
  });
}

if (formCheck) {
  formCheck.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerSuccess.hidden = true;

    const input = document.getElementById('cek-telepon').value.trim();
    if (!input) {
      showAlert(checkResult, 'Masukkan nomor telepon atau ID member.', 'error');
      return;
    }

    const isId = /^NUM-\d{4}-\d{4}$/i.test(input);
    const result = await checkMember(
      isId ? { id: input.toUpperCase() } : { telepon: input }
    );

    if (result.success) {
      const m = result.member;
      checkResult.innerHTML = `
        <p class="result-title">Member Ditemukan</p>
        <dl class="result-dl">
          <dt>ID Member</dt><dd>${m.id}</dd>
          <dt>Nama</dt><dd>${m.nama}</dd>
          <dt>Telepon</dt><dd>${m.telepon}</dd>
          <dt>Kecamatan</dt><dd>${m.kecamatan}</dd>
          <dt>Poin</dt><dd>${m.poin ?? 0}</dd>
          <dt>Status</dt><dd class="status-${m.status}">${m.status}</dd>
          <dt>Terdaftar</dt><dd>${formatDate(m.registered_at)}</dd>
        </dl>
      `;
      checkResult.hidden = false;
      checkResult.className = 'check-result is-success';
    } else {
      showAlert(checkResult, result.message || 'Member tidak ditemukan.', 'error');
    }
  });
}
