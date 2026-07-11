import { Capacitor } from '@capacitor/core'

let voicesReady = false

function ensureWebVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const load = () => {
    voicesReady = window.speechSynthesis.getVoices().length > 0
  }
  load()
  if (!voicesReady) {
    window.speechSynthesis.addEventListener('voiceschanged', load, { once: true })
  }
}

ensureWebVoices()

function speakWithWeb(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  ensureWebVoices()
  window.speechSynthesis.cancel()

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-US'
  utter.rate = 0.92
  utter.pitch = 1

  const voices = window.speechSynthesis.getVoices()
  const en =
    voices.find((v) => v.lang === 'en-US' && /Google|Microsoft|Samantha|Neural/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith('en'))
  if (en) utter.voice = en

  window.speechSynthesis.speak(utter)
}

/** Speak an English word: native TTS on Capacitor, Web Speech elsewhere. */
export async function speakWord(word: string) {
  const text = word.trim()
  if (!text) return

  if (Capacitor.isNativePlatform()) {
    try {
      const { TextToSpeech } = await import('@capacitor-community/text-to-speech')
      await TextToSpeech.stop()
      await TextToSpeech.speak({
        text,
        lang: 'en-US',
        rate: 0.95,
        pitch: 1.0,
        volume: 1.0,
        category: 'playback',
      })
      return
    } catch (err) {
      console.warn('Native TTS failed, falling back to Web Speech', err)
    }
  }

  speakWithWeb(text)
}
