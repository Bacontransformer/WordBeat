let voicesReady = false

function ensureVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const load = () => {
    voicesReady = window.speechSynthesis.getVoices().length > 0
  }
  load()
  if (!voicesReady) {
    window.speechSynthesis.addEventListener('voiceschanged', load, { once: true })
  }
}

ensureVoices()

/** Speak an English word via the browser Speech Synthesis API. */
export function speakWord(word: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  const text = word.trim()
  if (!text) return

  ensureVoices()
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
