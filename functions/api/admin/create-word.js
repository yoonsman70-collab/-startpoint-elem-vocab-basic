import { getUserFromRequest, jsonResponse } from '../../_utils/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB;
  const requester = await getUserFromRequest(request, db);
  if (!requester || requester.role !== 'admin') {
    return jsonResponse({ ok: false, error: '관리자만 할 수 있어요.' }, 403);
  }

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ ok: false, error: '잘못된 요청이에요.' }, 400); }

  const { level_code, day_number, en_text, ko_text } = body;
  if (!level_code || !day_number || !en_text || !ko_text) {
    return jsonResponse({ ok: false, error: '레벨, 일차, 영단어, 뜻은 필수예요.' }, 400);
  }

  const level = await db.prepare('SELECT id FROM vocab_levels WHERE code = ?').bind(level_code).first();
  if (!level) return jsonResponse({ ok: false, error: '존재하지 않는 레벨이에요.' }, 404);

  const countRow = await db.prepare(
    'SELECT COUNT(*) as cnt FROM vocab_words WHERE level_id = ? AND day_number = ?'
  ).bind(level.id, day_number).first();
  const sortOrder = (countRow?.cnt || 0) + 1;

  const result = await db.prepare(
    'INSERT INTO vocab_words (level_id, day_number, en_text, ko_text, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).bind(level.id, day_number, en_text, ko_text, sortOrder).run();

  return jsonResponse({ ok: true, id: result.meta.last_row_id });
}
