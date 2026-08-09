import { jsonResponse } from '../_utils/auth.js';

// 예: /api/vocab-words?level=elem_basic
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const levelCode = url.searchParams.get('level') || 'elem_basic';

  const level = await db.prepare('SELECT id, name, color_theme FROM vocab_levels WHERE code = ?').bind(levelCode).first();
  if (!level) {
    return jsonResponse({ ok: false, error: '존재하지 않는 단계예요.' }, 404);
  }

  const { results: words } = await db.prepare(
    'SELECT id, day_number, en_text, ko_text, sort_order FROM vocab_words WHERE level_id = ? ORDER BY day_number ASC, sort_order ASC'
  ).bind(level.id).all();

  // 일차(day)별로 묶어서 반환
  const dayMap = {};
  words.forEach(w => {
    if (!dayMap[w.day_number]) dayMap[w.day_number] = [];
    dayMap[w.day_number].push({ id: w.id, en: w.en_text, ko: w.ko_text });
  });

  const days = Object.keys(dayMap).sort((a, b) => a - b).map(dayNum => ({
    day: parseInt(dayNum),
    words: dayMap[dayNum]
  }));

  return jsonResponse({ ok: true, level: { code: levelCode, name: level.name, color_theme: level.color_theme }, days });
}
