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

  const { id } = body;
  if (!id) return jsonResponse({ ok: false, error: '삭제할 단어 정보가 없어요.' }, 400);

  await db.prepare('DELETE FROM vocab_words WHERE id = ?').bind(id).run();

  return jsonResponse({ ok: true });
}
