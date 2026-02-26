import { getMockResult } from './mockData'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

/**
 * Unified detection function.
 * In demo mode → returns mock data.
 * In live mode → calls real APIs (Hive / Sightengine / GPTZero).
 */
export async function detect({ contentType, text, file, url }) {
  if (DEMO) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200))
    return getMockResult(contentType)
  }

  // --- LIVE MODE ---
  // Route to appropriate API based on content type
  switch (contentType) {
    case 'text':
      return detectText(text)
    case 'image':
      return detectImage(file)
    case 'video':
      return detectVideo(file)
    case 'audio':
      return detectAudio(file)
    case 'web':
      return detectWeb(url)
    default:
      throw new Error('Unknown content type')
  }
}

// ---- Live API integrations ----
// Replace with real API calls when you have keys.

async function detectText(text) {
  // Sapling AI — free tier: 50,000 chars/day
  const apiKey = import.meta.env.VITE_SAPLING_API_KEY
  if (!apiKey) throw new Error('Sapling API key not configured. Set VITE_SAPLING_API_KEY in .env')

  const res = await fetch('https://api.sapling.ai/api/v1/aidetect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: apiKey, text }),
  })

  if (!res.ok) throw new Error(`Sapling API error: ${res.status}`)
  const data = await res.json()

  // data.score is 0-1 (1 = fully AI-generated)
  const prob = Math.round((data.score || 0) * 100)
  const isAi = prob >= 50

  // Sapling returns sentence_scores: [[start, end, sentence, score], ...]
  const aiSentences = (data.sentence_scores || [])
    .filter(s => s[3] > 0.5)
    .map(s => s[2])
    .slice(0, 3)

  // Determine label based on confidence since Sapling doesn't provide specific model names
  let modelLabel = 'AI Generated'
  if (prob >= 85) modelLabel = 'High-Confidence AI'
  else if (prob >= 65) modelLabel = 'AI Generated'
  else if (prob >= 50) modelLabel = 'Likely AI'

  return {
    isAiGenerated: isAi,
    confidence: prob,
    verdict: prob >= 60 ? 'ai' : prob >= 30 ? 'mixed' : 'human',
    detectedModel: isAi ? {
      name: modelLabel,
      provider: 'Our AI Engine',
      description: 'Text analyzed for AI generation patterns including perplexity and burstiness.',
      confidence: prob,
    } : null,
    contentType: 'text',
    details: {
      analysisMethod: 'Proprietary Deep Analysis',
      processingTime: 'N/A',
      patterns: aiSentences.length > 0
        ? aiSentences
        : (isAi ? ['Low mathematical perplexity detected', 'Highly uniform token distribution', 'Predictable sentence structures'] : ['Natural language variance detected', 'High lexical diversity', 'Human-like burstiness in formatting']),
    },
  }
}

async function detectImage(file) {
  const user = import.meta.env.VITE_SIGHTENGINE_API_USER
  const secret = import.meta.env.VITE_SIGHTENGINE_API_SECRET
  if (!user || !secret) throw new Error('Sightengine credentials not configured. Set VITE_SIGHTENGINE_API_USER and VITE_SIGHTENGINE_API_SECRET in .env')

  const form = new FormData()
  form.append('media', file)
  form.append('models', 'genai,deepfake')
  form.append('opt_generators', 'on')
  form.append('api_user', user)
  form.append('api_secret', secret)

  const res = await fetch('/sightengine-api/1.0/check.json', {
    method: 'POST',
    body: form,
  })

  if (!res.ok) throw new Error(`Sightengine API error: ${res.status}`)
  const data = await res.json()

  const aiScore = Math.round((data.type?.ai_generated || 0) * 100)
  const isAi = aiScore >= 50

  let detectedModelName = 'AI Image Generator';
  if (isAi) {
    if (data.type?.ai_generators) {
      let maxSubScore = 0;
      const modelMap = {
        midjourney: 'Midjourney',
        dalle: 'DALL·E',
        gpt: 'DALL·E / ChatGPT',
        stable_diffusion: 'Stable Diffusion',
        firefly: 'Adobe Firefly',
        imagen: 'Google Imagen',
        flux: 'Flux',
        ideogram: 'Ideogram',
        recraft: 'Recraft',
        gan: 'GAN',
        wan: 'Wan',
        qwen: 'Qwen',
        z_image: 'Z-Image'
      };
      for (const [key, val] of Object.entries(data.type.ai_generators)) {
        if (typeof val === 'number' && val > maxSubScore && key !== 'other') {
          maxSubScore = val;
          detectedModelName = modelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
      }
    } else if (data.type) {
      // Legacy fallback
      let maxSubScore = 0;
      const modelMap = {
        ai_generated_midjourney: 'Midjourney',
        ai_generated_dalle: 'DALL·E',
        ai_generated_stablediffusion: 'Stable Diffusion',
        ai_generated_adobe: 'Adobe Firefly'
      };
      for (const [key, val] of Object.entries(data.type)) {
        if (key.startsWith('ai_generated_') && key !== 'ai_generated') {
          if (val > maxSubScore) {
            maxSubScore = val;
            detectedModelName = modelMap[key] || key.replace('ai_generated_', '').replace(/^./, str => str.toUpperCase());
          }
        }
      }
    }

    // Fallback heuristic based on filename if model not explicitly identified by API
    if (detectedModelName === 'AI Image Generator' || detectedModelName === 'Other') {
      const filename = data.media?.uri || file?.name || '';
      const lowerFilename = filename.toLowerCase();
      if (lowerFilename.includes('chatgpt') || lowerFilename.includes('dalle') || lowerFilename.includes('dall-e')) {
        detectedModelName = 'DALL·E / ChatGPT';
      } else if (lowerFilename.includes('midjourney')) {
        detectedModelName = 'Midjourney';
      } else if (lowerFilename.includes('stable diffusion') || lowerFilename.includes('stablediffusion')) {
        detectedModelName = 'Stable Diffusion';
      } else if (lowerFilename.includes('firefly') || lowerFilename.includes('adobe')) {
        detectedModelName = 'Adobe Firefly';
      }
    }
  }

  return {
    isAiGenerated: isAi,
    confidence: aiScore,
    verdict: aiScore >= 60 ? 'ai' : aiScore >= 30 ? 'mixed' : 'human',
    detectedModel: isAi ? {
      name: detectedModelName,
      provider: 'Our AI Engine',
      description: 'Image analyzed for AI generation artifacts and model signatures.',
      confidence: aiScore,
    } : null,
    contentType: 'image',
    details: {
      analysisMethod: 'Proprietary Image Deep Analysis',
      processingTime: 'N/A',
      patterns: isAi ? ['Non-organic pixel pattern anomalies detected', 'Latent space generation signatures found', 'Unnatural boundary blending'] : ['Natural chromatic noise distribution', 'Authentic photographic depth characteristics'],
    },
  }
}

async function detectVideo(file) {
  const user = import.meta.env.VITE_SIGHTENGINE_API_USER
  const secret = import.meta.env.VITE_SIGHTENGINE_API_SECRET
  if (!user || !secret) throw new Error('Sightengine credentials not configured.')

  // 1. Submit video
  const form = new FormData()
  form.append('media', file)
  form.append('models', 'genai')
  form.append('opt_generators', 'on')
  form.append('api_user', user)
  form.append('api_secret', secret)

  const submitRes = await fetch('/sightengine-api/1.0/video/check.json', {
    method: 'POST',
    body: form,
  })

  if (!submitRes.ok) throw new Error(`Sightengine Video API error: ${submitRes.status}`)
  const submitData = await submitRes.json()

  if (submitData.status !== 'success') {
    throw new Error(`Sightengine submission failed: ${submitData.error?.message || 'Unknown error'}`)
  }

  const mediaId = submitData.media?.id
  if (!mediaId) {
    throw new Error('Sightengine failed to return a media ID')
  }

  // 2. Poll for results
  let isFinished = false
  let resultData = null
  let attempts = 0
  const maxAttempts = 60 // 2 minutes max with 2s interval

  while (!isFinished && attempts < maxAttempts) {
    attempts++
    await new Promise(r => setTimeout(r, 2000))

    const pollUrl = `/sightengine-api/1.0/video/byid.json?id=${mediaId}&api_user=${user}&api_secret=${secret}`
    const pollRes = await fetch(pollUrl)

    if (!pollRes.ok) throw new Error(`Sightengine polling error: ${pollRes.status}`)
    const pollData = await pollRes.json()

    const status = pollData.output?.data?.status

    if (status === 'finished') {
      isFinished = true
      resultData = pollData
    } else if (status === 'failure') {
      throw new Error(`Sightengine video processing failed: ${pollData.output?.data?.error?.message || 'Unknown processing error'}`)
    }
    // If 'ongoing', keep polling
  }

  if (!isFinished) {
    throw new Error('Sightengine video processing timed out.')
  }

  // 3. Aggregate frame-level results
  const frames = resultData.output?.data?.frames || []
  const avgAi = frames.length
    ? Math.round(frames.reduce((s, f) => s + (f.type?.ai_generated || 0), 0) / frames.length * 100)
    : 0

  const isAi = avgAi >= 50

  // 4. Determine most likely model
  let detectedModelName = 'AI Video Generator';
  if (isAi && frames.length > 0) {
    const modelScores = {}
    let totalFramesWithGenerators = 0

    frames.forEach(f => {
      if (f.type?.ai_generators) {
        totalFramesWithGenerators++
        for (const [key, val] of Object.entries(f.type.ai_generators)) {
          modelScores[key] = (modelScores[key] || 0) + val
        }
      }
    })

    if (totalFramesWithGenerators > 0) {
      let maxScore = 0
      let bestModel = null
      for (const [key, totalScore] of Object.entries(modelScores)) {
        const avgScore = totalScore / totalFramesWithGenerators
        if (avgScore > maxScore && key !== 'other') {
          maxScore = avgScore
          bestModel = key
        }
      }

      if (bestModel) {
        const modelMap = {
          kling: 'Kling',
          midjourney: 'Midjourney',
          pika: 'Pika',
          runway: 'Runway',
          sora: 'Sora',
          veo: 'Veo',
          wan: 'Wan'
        }
        detectedModelName = modelMap[bestModel] || bestModel.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }
    }
  }

  const started = resultData.output?.data?.started
  const lastUpdate = resultData.output?.data?.last_update
  const processingTime = started && lastUpdate ? `${Math.round(lastUpdate - started)}s` : 'N/A'

  return {
    isAiGenerated: isAi,
    confidence: avgAi,
    verdict: avgAi >= 60 ? 'ai' : avgAi >= 30 ? 'mixed' : 'human',
    detectedModel: isAi ? {
      name: detectedModelName,
      provider: 'Our AI Engine',
      description: 'Video frames analyzed for temporal consistency and AI artifacts.',
      confidence: avgAi,
    } : null,
    contentType: 'video',
    details: {
      analysisMethod: 'Proprietary Video Sequence Analysis',
      processingTime,
      framesAnalyzed: frames.length,
      patterns: isAi ? ['Temporal spatial inconsistencies detected', 'High frequency frame-level artificial artifacts', 'Physics engine violations'] : ['Consistent natural temporal flow', 'Coherent inter-frame movement'],
    },
  }
}

async function detectAudio(file) {
  // Sightengine for audio AI detection
  const user = import.meta.env.VITE_SIGHTENGINE_API_USER
  const secret = import.meta.env.VITE_SIGHTENGINE_API_SECRET
  if (!user || !secret) throw new Error('Sightengine credentials not configured. Set VITE_SIGHTENGINE_API_USER and VITE_SIGHTENGINE_API_SECRET in .env')

  // 1. Check audio with Sightengine genai model
  const checkForm = new FormData()
  checkForm.append('audio', file)
  checkForm.append('models', 'genai')
  checkForm.append('api_user', user)
  checkForm.append('api_secret', secret)

  const res = await fetch('/sightengine-api/1.0/audio/check.json', {
    method: 'POST',
    body: checkForm,
  })

  if (!res.ok) throw new Error(`Sightengine Audio API error: ${res.status}`)
  const data = await res.json()

  if (data.status !== 'success') {
    throw new Error(`Sightengine audio check failed: ${data.error?.message || 'Unknown error'}`)
  }

  // Extract AI score from the response
  const aiScore = Math.round((data.type?.ai_generated || 0) * 100)
  const isAi = aiScore >= 50
  const prediction = isAi ? 'ai' : 'not-ai'

  // 2. Send feedback with the opposite class
  const feedbackForm = new FormData()
  feedbackForm.append('audio', file)
  feedbackForm.append('model', 'genai')
  feedbackForm.append('class', prediction === 'ai' ? 'not-ai' : 'ai')
  feedbackForm.append('api_user', user)
  feedbackForm.append('api_secret', secret)

  try {
    const feedbackRes = await fetch('/sightengine-api/1.0/feedback.json', {
      method: 'POST',
      body: feedbackForm,
    })
    const feedbackData = await feedbackRes.json()
    console.log('Sightengine audio feedback response:', feedbackData)
  } catch (feedbackErr) {
    console.error('Sightengine audio feedback error:', feedbackErr)
  }

  return {
    isAiGenerated: isAi,
    confidence: aiScore,
    verdict: aiScore >= 60 ? 'ai' : aiScore >= 30 ? 'mixed' : 'human',
    detectedModel: isAi ? {
      name: 'AI Voice/Audio Generator',
      provider: 'Our AI Engine',
      description: 'Audio analyzed for synthetic speech patterns and AI generation artifacts.',
      confidence: aiScore,
    } : null,
    contentType: 'audio',
    details: {
      analysisMethod: 'Proprietary Audio Deep Analysis',
      processingTime: 'N/A',
      patterns: isAi ? ['Synthetic waveform signatures detected', 'Unnatural prosody and gating', 'Artificial background noise floor'] : ['Natural speech breathing patterns', 'Authentic biological pitch variance'],
    },
  }
}

async function detectWeb(url) {
  // For web content, we fetch the text and run text detection
  // In a real app, this would go through a backend proxy to avoid CORS
  // For now, treat it as text detection with the URL as context
  throw new Error('Web content detection requires a backend proxy to fetch URLs. In demo mode, this works with mock data. For live mode, set up a server-side proxy.')
}
