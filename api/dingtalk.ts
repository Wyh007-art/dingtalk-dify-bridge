// 文件：api/dingtalk.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

const DIFY_API_BASE = process.env.DIFY_API_BASE || 'http://30.113.152.152/v1'
const DIFY_API_KEY = process.env.DIFY_API_KEY || ''
const DINGTALK_TOKEN = process.env.DINGTALK_TOKEN || 'abc123'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Only POST')

    const token = (req.headers['token'] as string) || ''
    if (DINGTALK_TOKEN && token !== DINGTALK_TOKEN) return res.status(403).send('Invalid token')

    const payload: any = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    let text = ''
    if (payload?.text?.content) text = payload.text.content
    else if (payload?.markdown?.text) text = payload.markdown.text
    text = (text || '').replace(/@/g, ' ').replace(/\s+/g, ' ').trim()

    const user = String(payload?.senderId || payload?.senderStaffId || 'dingtalk')

    const difyResp = await fetch(`${DIFY_API_BASE.replace(/\/$/, '')}/chat-messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DIFY_API_KEY}` },
      body: JSON.stringify({ inputs: {}, query: text, response_mode: 'blocking', user })
    })

    if (!difyResp.ok) return res.status(200).send(`Dify error ${difyResp.status}: ${await difyResp.text()}`)
    const data = await difyResp.json().catch(() => ({} as any))
    const answer = data?.answer ? String(data.answer) : JSON.stringify(data)
    return res.status(200).send(answer.slice(0, 4000))
  } catch (e: any) {
    return res.status(200).send(`error: ${e?.message || String(e)}`)
  }
}
