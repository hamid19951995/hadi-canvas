/**
 * Hadi API Proxy — keeps provider key on the server
 * Usage: HADI_API_KEY=sk-... node server/index.mjs
 */
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = Number(process.env.HADI_PROXY_PORT || 8787)
const PROVIDER_BASE = process.env.HADI_PROVIDER_BASE || 'https://api.gapgpt.app/v1'

app.use(cors({ origin: true }))
app.use(express.json({ limit: '4mb' }))

function resolveKey(req) {
  return (
    process.env.HADI_API_KEY ||
    req.headers['x-api-key'] ||
    req.body?.apiKey ||
    ''
  )
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    hasServerKey: Boolean(process.env.HADI_API_KEY),
    provider: PROVIDER_BASE,
  })
})

app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = resolveKey(req)
    if (!apiKey) {
      return res.status(401).json({ error: 'API key missing. Set HADI_API_KEY or send apiKey.' })
    }
    const { model, messages, temperature, max_tokens } = req.body || {}
    const upstream = await fetch(`${PROVIDER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages: messages || [],
        temperature: temperature ?? 0.7,
        max_tokens,
      }),
    })
    const text = await upstream.text()
    res.status(upstream.status).type('application/json').send(text)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

app.post('/api/images', async (req, res) => {
  try {
    const apiKey = resolveKey(req)
    if (!apiKey) {
      return res.status(401).json({ error: 'API key missing. Set HADI_API_KEY or send apiKey.' })
    }
    const { prompt, model, size } = req.body || {}
    if (!prompt) return res.status(400).json({ error: 'prompt is required' })

    const upstream = await fetch(`${PROVIDER_BASE}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'dall-e-3',
        prompt,
        n: 1,
        size: size || '1024x1024',
      }),
    })
    const text = await upstream.text()
    res.status(upstream.status).type('application/json').send(text)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

app.listen(PORT, () => {
  console.log(`Hadi proxy listening on http://localhost:${PORT}`)
  console.log(`Server key configured: ${Boolean(process.env.HADI_API_KEY)}`)
})
