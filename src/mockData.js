/**
 * Mock detection data for demo mode.
 * Simulates realistic AI model detection results.
 */

const MODELS = {
  text: [
    {
      name: 'GPT-4o',
      provider: 'OpenAI',
      description: 'Large language model by OpenAI, known for fluent, structured text generation.',
      confidence: 89,
    },
    {
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      description: 'Anthropic\'s conversational AI known for nuanced, safety-aware text outputs.',
      confidence: 76,
    },
    {
      name: 'Gemini 2.0 Flash',
      provider: 'Google DeepMind',
      description: 'Google\'s multimodal model excelling at fast, high-quality text generation.',
      confidence: 72,
    },
    {
      name: 'LLaMA 3.1',
      provider: 'Meta',
      description: 'Meta\'s open-source LLM known for competitive performance at various sizes.',
      confidence: 65,
    },
  ],
  image: [
    {
      name: 'DALL·E 3',
      provider: 'OpenAI',
      description: 'OpenAI\'s image generation model with strong prompt following and text rendering.',
      confidence: 92,
    },
    {
      name: 'Midjourney v6',
      provider: 'Midjourney',
      description: 'Known for highly artistic, photorealistic image generation with distinctive aesthetics.',
      confidence: 87,
    },
    {
      name: 'Stable Diffusion XL',
      provider: 'Stability AI',
      description: 'Open-source diffusion model capable of high-resolution, detailed image synthesis.',
      confidence: 78,
    },
    {
      name: 'Adobe Firefly',
      provider: 'Adobe',
      description: 'Adobe\'s commercially-safe generative model trained on licensed content.',
      confidence: 68,
    },
  ],
  video: [
    {
      name: 'Sora',
      provider: 'OpenAI',
      description: 'OpenAI\'s video generation model creating realistic scenes from text prompts.',
      confidence: 85,
    },
    {
      name: 'Veo 2',
      provider: 'Google DeepMind',
      description: 'Google\'s video generation AI with high temporal coherence and motion fidelity.',
      confidence: 79,
    },
    {
      name: 'Runway Gen-3 Alpha',
      provider: 'Runway',
      description: 'Runway\'s latest video generation model offering fine-grained artistic control.',
      confidence: 74,
    },
    {
      name: 'Pika 1.5',
      provider: 'Pika Labs',
      description: 'Video synthesis model focused on creative and stylistic video generation.',
      confidence: 62,
    },
  ],
  audio: [
    {
      name: 'ElevenLabs',
      provider: 'ElevenLabs',
      description: 'Industry-leading AI voice synthesis with natural intonation and emotion.',
      confidence: 91,
    },
    {
      name: 'Bark',
      provider: 'Suno AI',
      description: 'Open-source text-to-audio model supporting speech, music, and sound effects.',
      confidence: 73,
    },
    {
      name: 'XTTS v2',
      provider: 'Coqui',
      description: 'Open-source voice cloning model supporting cross-lingual speech synthesis.',
      confidence: 66,
    },
    {
      name: 'Azure Neural TTS',
      provider: 'Microsoft',
      description: 'Microsoft\'s neural text-to-speech with highly natural-sounding voices.',
      confidence: 60,
    },
  ],
  web: [
    {
      name: 'GPT-4o',
      provider: 'OpenAI',
      description: 'Large language model by OpenAI, commonly used for blog/article generation.',
      confidence: 84,
    },
    {
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      description: 'Often used for long-form, well-structured web content creation.',
      confidence: 71,
    },
    {
      name: 'Jasper AI',
      provider: 'Jasper',
      description: 'Marketing-focused AI writing tool powered by multiple LLMs.',
      confidence: 68,
    },
  ],
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function getMockResult(contentType) {
  const pool = MODELS[contentType] || MODELS.text
  const model = pickRandom(pool)
  const isAi = Math.random() > 0.15 // 85% chance AI in demo
  const confidence = isAi ? randomBetween(65, 98) : randomBetween(8, 35)

  let verdict = 'human'
  if (confidence >= 60) verdict = 'ai'
  else if (confidence >= 30) verdict = 'mixed'

  return {
    isAiGenerated: isAi,
    confidence,
    verdict,
    detectedModel: isAi ? {
      ...model,
      confidence: randomBetween(model.confidence - 10, model.confidence),
    } : null,
    contentType,
    details: {
      analysisMethod: isAi ? 'Deep Neural Pattern Matching' : 'Heuristic Biological Scoring',
      processingTime: `${randomBetween(200, 1500)}ms`,
      patterns: isAi
        ? ['Micro-patterns indicative of generation', 'Extremely low variance in distribution', 'Predictable structural repetition']
        : ['High structural entropy', 'Natural biological variance in distribution'],
    },
  }
}
