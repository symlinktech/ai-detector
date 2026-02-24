import fetch from 'node-fetch'
import FormData from 'form-data'

const accessKey = 'HX5spkB1gbfoAG8u'
const secretKey = 'kxAZX9NsStyA36dQ6F443A=='

async function test(authHeader) {
  try {
    const form = new FormData()
    form.append('text_data', 'This is a test sentence.')

    const res = await fetch('https://api.thehive.ai/api/v2/task/sync', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: form
    })

    const body = await res.text()
    console.log(`[${authHeader}] -> Status: ${res.status}, Body: ${body.substring(0, 100)}...`)
  } catch (e) {
    console.error(`Error with ${authHeader}:`, e.message)
  }
}

async function runTests() {
  console.log('Testing different auth formats...')
  await test(`token ${secretKey}`)
  await test(`Token ${secretKey}`)
  await test(`token ${accessKey}:${secretKey}`)
  await test(`Token ${accessKey}:${secretKey}`)
  await test(`Bearer ${secretKey}`)
}

runTests()
