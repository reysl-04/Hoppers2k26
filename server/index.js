/**
 * FatSecret API Proxy
 * FatSecret requires OAuth from server-side. This proxy gets the token and forwards image requests.
 *
 * Run: node server/index.js
 * Requires: FATSECRET_CLIENT_ID and FATSECRET_CLIENT_SECRET in .env (or environment)
 */

import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const FATSECRET_CLIENT_ID = process.env.FATSECRET_CLIENT_ID
const FATSECRET_CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET

let cachedToken = null
let tokenExpiry = 0

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken
  }

  if (!FATSECRET_CLIENT_ID || !FATSECRET_CLIENT_SECRET) {
    throw new Error('FATSECRET_CLIENT_ID and FATSECRET_CLIENT_SECRET must be set')
  }

  const res = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${FATSECRET_CLIENT_ID}:${FATSECRET_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials&scope=image-recognition',
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token request failed: ${res.status} ${err}`)
  }

  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in ?? 86400) * 1000
  return cachedToken
}

app.post('/analyze', async (req, res) => {
  try {
    const { image_b64, include_food_data, region, language } = req.body
    if (!image_b64) {
      return res.status(400).json({ error: 'image_b64 is required' })
    }

    const token = await getAccessToken()

    const fsRes = await fetch('https://platform.fatsecret.com/rest/image-recognition/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        image_b64,
        include_food_data: include_food_data ?? true,
        region: region ?? 'US',
        language: language ?? 'en',
      }),
    })

    const data = await fsRes.json()

    if (!fsRes.ok) {
      return res.status(fsRes.status).json(data)
    }

    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err.message ?? 'Proxy error',
    })
  }
})

app.get('/health', (_, res) => res.json({ ok: true }))

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`FatSecret proxy running at http://localhost:${PORT}`)
  console.log('Set VITE_FATSECRET_PROXY_URL=http://localhost:' + PORT + ' in your .env')
})
