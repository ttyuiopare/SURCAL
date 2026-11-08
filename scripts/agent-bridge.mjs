#!/usr/bin/env node
// Surcal agent bridge — runs on the owner's PC.
//
// Polls the agent_messages table for undelivered owner messages, runs each one
// through the OpenClaw gateway agent (`openclaw agent --message ...`), and
// writes the reply back. The /agent web page displays the conversation.
//
//   node scripts/agent-bridge.mjs            (foreground)
//
// Credentials are read from .env.local (service-role key bypasses RLS).

import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Invoke ZCode's CLI entry script with node directly — going through a shell
// mangles messages that contain spaces/quotes/special characters.
const ZCODE_ENTRY = join(
  'C:', 'Program Files', 'ZCode', 'resources', 'glm', 'zcode.cjs'
);

function envLocal(key) {
  const m = readFileSync(join(ROOT, '.env.local'), 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith(key + '='));
  return m ? m.slice(key.length + 1).trim() : '';
}

const URL = envLocal('NEXT_PUBLIC_SUPABASE_URL');
const KEY = envLocal('SUPABASE_SERVICE_ROLE_KEY');
if (!URL || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const log = (...a) => console.log(new Date().toISOString(), ...a);

let adminIds = null;
async function getAdminIds(force = false) {
  if (adminIds && !force) return adminIds;
  const res = await fetch(`${URL}/rest/v1/profiles?is_admin=eq.true&select=id`, { headers: HEADERS });
  const rows = await res.json();
  adminIds = (rows || []).map((r) => r.id);
  return adminIds;
}

// Only serve the account owner(s).
async function poll() {
  const ids = await getAdminIds();
  if (!ids.length) return;

  const q = `role=eq.user&done=eq.false&order=created_at.asc&limit=1&` +
    `user_id=in.(${ids.join(',')})&select=*`;
  const res = await fetch(`${URL}/rest/v1/agent_messages?${q}`, { headers: HEADERS });
  if (!res.ok) {
    if (res.status === 404) log('agent_messages table missing — apply migration 26');
    return;
  }
  const rows = await res.json();
  if (!rows || !rows.length) return;

  const msg = rows[0];
  log('processing:', msg.content.slice(0, 80));
  const reply = await runAgent(msg.content);
  await writeReply(msg, reply);
}

function runAgent(content) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [ZCODE_ENTRY, '-p', content], {
      cwd: ROOT,
      env: process.env,
    });
    let out = '';
    const timer = setTimeout(() => {
      log('agent timed out after 10 min');
      child.kill();
      resolve('(agent timed out after 10 minutes)');
    }, 10 * 60 * 1000);

    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (out += d.toString()));
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve(clean(out, code));
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve('bridge error: ' + e.message);
    });
  });
}

function clean(out, code) {
  const text = out
    // ANSI escapes / cursor control / spinner frames
    .replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '')
    .replace(/[\u2591\u2592\u2593\u2588\u258C\u2590\u259F]/g, '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l && !/^(resolving|Preparing modules|Use `node --trace)/i.test(l));
  const joined = text.join('\n').trim();
  if (!joined) return code === 0 ? '(empty reply)' : `(agent exited with code ${code})`;
  return joined.slice(-6000); // keep replies within one row
}

async function writeReply(msg, content) {
  const res = await fetch(`${URL}/rest/v1/agent_messages`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ user_id: msg.user_id, role: 'assistant', content, done: true }),
  });
  if (!res.ok) {
    log('failed to write reply:', res.status, await res.text());
    return;
  }
  await fetch(`${URL}/rest/v1/agent_messages?id=eq.${msg.id}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ done: true }),
  });
  log('replied to', msg.id);
}

log('bridge started —', URL);
getAdminIds(true).then((ids) => log('serving admin ids:', ids.join(', ')));
setInterval(() => {
  poll().catch((e) => log('poll error:', e.message));
}, 3000);
