import { getUserFromRequest, jsonResponse } from '../_utils/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB;

  const user = await getUserFromRequest(request, db);
  if (!user) {
    return jsonResponse({ ok: false, error: '로그인이 필요해요.' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ ok: false, error: '잘못된 요청이에요.' }, 400);
  }

  const { word_id, is_pass, picked_answer } = body;
  if (!word_id) {
    return jsonResponse({ ok: false, error: 'word_id가 필요해요.' }, 400);
  }

  const now = new Date().toISOString();

  await db.prepare(
    'INSERT INTO vocab_attempts (user_id, word_id, is_pass, picked_answer, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(user.id, word_id, is_pass ? 1 : 0, picked_answer || null, now).run();

  await db.prepare(
    `INSERT INTO vocab_progress (user_id, word_id, completed, attempt_count, last_attempt_at)
     VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(user_id, word_id) DO UPDATE SET
       attempt_count = attempt_count + 1,
       completed = MAX(completed, excluded.completed),
       last_attempt_at = excluded.last_attempt_at`
  ).bind(user.id, word_id, is_pass ? 1 : 0, now).run();

  return jsonResponse({ ok: true });
}
