export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Only POST');

    const DIFY_API_BASE = process.env.DIFY_API_BASE || 'http://47.97.214.4/v1';
    const DIFY_API_KEY = process.env.DIFY_API_KEY || '';
    const DINGTALK_TOKEN = process.env.DINGTALK_TOKEN || 'abc123';

    const token = (req.headers['token'] || '').toString();
    if (DINGTALK_TOKEN && token !== DINGTALK_TOKEN) return res.status(403).send('Invalid token');

    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    let text = '';
    if (payload && payload.text && payload.text.content) text = payload.text.content;
    else if (payload && payload.markdown && payload.markdown.text) text = payload.markdown.text;
    text = (text || '').replace(/@/g, ' ').replace(/\s+/g, ' ').trim();

    const user = String((payload && (payload.senderId || payload.senderStaffId)) || 'dingtalk');

    const r = await fetch(`${DIFY_API_BASE.replace(/\/$/, '')}/chat-messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DIFY_API_KEY}` },
      body: JSON.stringify({ inputs: {}, query: text, response_mode: 'blocking', user })
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(200).send(`Dify error ${r.status}: ${errText}`);
    }

    const data = await r.json().catch(() => ({}));
    const answer = data && data.answer ? String(data.answer) : JSON.stringify(data);
    return res.status(200).send((answer || '').slice(0, 4000));
  } catch (e) {
    return res.status(200).send(`error: ${e && e.message ? e.message : String(e)}`);
  }
}
