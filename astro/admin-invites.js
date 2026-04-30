/**
 * Admin invites — list/add/remove rows in astro_invites. RLS enforces admin-only.
 */

import { supabase } from '../shared/supabase.js';
import { initAstroPage, showToast, escapeHtml } from './astro-shell.js';

let appUser = null;

document.addEventListener('DOMContentLoaded', () => {
  initAstroPage('dashboard', async (ctx) => {
    appUser = ctx.appUser;
    if (appUser.role !== 'admin') {
      document.getElementById('notAdmin').classList.remove('hidden');
      return;
    }
    document.getElementById('adminArea').classList.remove('hidden');
    document.getElementById('addForm').addEventListener('submit', addInvite);
    await loadInvites();
  });
});

async function loadInvites() {
  const { data, error } = await supabase
    .from('astro_invites')
    .select('*')
    .order('invited_at', { ascending: false });
  if (error) {
    showToast('Could not load invites.', 'error');
    return;
  }
  const tbody = document.getElementById('invitesBody');
  if (!data?.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--color-aap-text-muted)">No invites yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((row) => `
    <tr>
      <td>${escapeHtml(row.email)}</td>
      <td>${row.invited_at?.slice(0, 10) || ''}</td>
      <td>${row.accepted_at ? '<span style="color:var(--color-aap-success)">✓ ' + row.accepted_at.slice(0, 10) + '</span>' : '<span style="color:var(--color-aap-text-muted)">pending</span>'}</td>
      <td>${escapeHtml(row.notes || '')}</td>
      <td><button class="astro-btn astro-btn--ghost" data-email="${escapeHtml(row.email)}" data-action="remove">Remove</button></td>
    </tr>
  `).join('');
  tbody.querySelectorAll('button[data-action="remove"]').forEach((btn) => {
    btn.addEventListener('click', () => removeInvite(btn.dataset.email));
  });
}

async function addInvite(e) {
  e.preventDefault();
  const email = document.getElementById('emailInput').value.trim().toLowerCase();
  const notes = document.getElementById('notesInput').value.trim() || null;
  if (!email) return;
  const { error } = await supabase.from('astro_invites').upsert({
    email,
    notes,
    invited_by: appUser.id,
  }, { onConflict: 'email' });
  if (error) {
    showToast(error.message || 'Could not add invite.', 'error');
    return;
  }
  document.getElementById('emailInput').value = '';
  document.getElementById('notesInput').value = '';
  showToast('Invite saved.', 'success');
  await loadInvites();
}

async function removeInvite(email) {
  if (!confirm(`Remove invite for ${email}?`)) return;
  const { error } = await supabase.from('astro_invites').delete().eq('email', email);
  if (error) {
    showToast('Could not remove invite.', 'error');
    return;
  }
  showToast('Invite removed.', 'info');
  await loadInvites();
}
