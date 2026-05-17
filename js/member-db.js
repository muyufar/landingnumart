const STORAGE_KEY = 'numart_members_backup';

export function loadLocalMembers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveLocalMembers(members) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

export function findLocalMember({ telepon, id }) {
  const members = loadLocalMembers();
  const phone = telepon ? telepon.replace(/\D/g, '') : '';
  return members.find((m) => {
    if (id && m.id === id) return true;
    if (phone && m.telepon === phone) return true;
    return false;
  }) || null;
}

export function registerLocalMember(payload) {
  const members = loadLocalMembers();
  const email = payload.email.toLowerCase().trim();
  const telepon = payload.telepon.replace(/\D/g, '');

  if (members.some((m) => m.email === email)) {
    return { success: false, message: 'Email sudah terdaftar sebagai member.' };
  }
  if (members.some((m) => m.telepon === telepon)) {
    return { success: false, message: 'Nomor telepon sudah terdaftar sebagai member.' };
  }

  const year = new Date().getFullYear();
  let seq = 1;
  members.forEach((m) => {
    const match = /^NUM-(\d+)-(\d+)$/.exec(m.id || '');
    if (match && Number(match[1]) === year) {
      seq = Math.max(seq, Number(match[2]) + 1);
    }
  });

  const member = {
    id: `NUM-${year}-${String(seq).padStart(4, '0')}`,
    nama: payload.nama.trim(),
    email,
    telepon,
    alamat: payload.alamat.trim(),
    kecamatan: payload.kecamatan,
    gerai: payload.gerai || '',
    poin: 0,
    status: 'aktif',
    registered_at: new Date().toISOString(),
  };

  members.push(member);
  saveLocalMembers(members);

  return { success: true, message: 'Registrasi member berhasil! (disimpan lokal)', member };
}

export async function registerMember(payload) {
  try {
    const res = await fetch('api/register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const locals = loadLocalMembers();
      if (!locals.some((m) => m.id === data.member.id)) {
        locals.push(data.member);
        saveLocalMembers(locals);
      }
      return data;
    }
    if (res.status === 409 || res.status === 422) {
      return data;
    }
  } catch {
    /* fallback ke localStorage */
  }
  return registerLocalMember(payload);
}

export async function checkMember({ telepon, id }) {
  const phone = telepon ? telepon.replace(/\D/g, '') : '';

  try {
    const params = new URLSearchParams();
    if (phone) params.set('telepon', phone);
    if (id) params.set('id', id);
    const res = await fetch(`api/check-member.php?${params}`);
    const data = await res.json();
    if (res.ok && data.success) return data;
    if (res.status === 404) return data;
  } catch {
    /* fallback */
  }

  const member = findLocalMember({ telepon: phone, id });
  if (!member) {
    return { success: false, message: 'Member tidak ditemukan.' };
  }
  return { success: true, member };
}
