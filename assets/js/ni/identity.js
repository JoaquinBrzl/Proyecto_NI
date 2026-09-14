import { getClient } from './client.js';

/**
 * Role + membership reads (app tables with RLS).
 * Role and membership are NOT profile fields.
 */

export async function fetchUserRole(userId) {
  if (!userId) return null;
  const insforge = getClient();
  const { data, error } = await insforge.database
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .limit(1);

  if (error) return { role: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { role: row?.role || 'user', error: null };
}

export async function fetchActiveMembership(userId) {
  if (!userId) return null;
  const insforge = getClient();
  const { data, error } = await insforge.database
    .from('memberships')
    .select('id,plan,level,status,starts_at,ends_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('level', { ascending: false })
    .limit(1);

  if (error) return { membership: null, level: 0, error };
  const row = Array.isArray(data) ? data[0] : data;
  return {
    membership: row || null,
    level: row?.level ?? 0,
    error: null,
  };
}

export async function fetchIdentity(userId) {
  const [roleResult, membershipResult] = await Promise.all([
    fetchUserRole(userId),
    fetchActiveMembership(userId),
  ]);
  return {
    role: roleResult?.role || 'user',
    membership: membershipResult?.membership || null,
    level: membershipResult?.level ?? 0,
    error: roleResult?.error || membershipResult?.error || null,
  };
}

/** RPC helpers for future module gating */
export async function rpcIsAdmin() {
  const insforge = getClient();
  return insforge.database.rpc('is_admin');
}

export async function rpcMembershipLevel() {
  const insforge = getClient();
  return insforge.database.rpc('membership_level');
}
