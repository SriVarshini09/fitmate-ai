/**
 * Web Speech API wrapper for voice recognition
 */

export type VoiceRecognitionStatus = 'idle' | 'listening' | 'processing' | 'error';

export interface VoiceRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );
}

export class VoiceRecognizer {
  private recognition: any = null;
  private options: VoiceRecognitionOptions;
  private isListening = false;

  constructor(options: VoiceRecognitionOptions = {}) {
    this.options = {
      lang: 'en-US',
      continuous: false,
      interimResults: true,
      ...options,
    };
  }

  init(): boolean {
    if (!isSpeechRecognitionSupported()) return false;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.options.lang || 'en-US';
    this.recognition.continuous = this.options.continuous ?? false;
    this.recognition.interimResults = this.options.interimResults ?? true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.options.onTranscript?.(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        this.options.onTranscript?.(interimTranscript.trim(), false);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.options.onEnd?.();
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      const errorMap: Record<string, string> = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'Microphone not found. Please check your device.',
        'not-allowed': 'Microphone permission denied. Please allow microphone access.',
        'network': 'Network error. Please check your connection.',
        'aborted': 'Voice input was cancelled.',
      };
      this.options.onError?.(errorMap[event.error] || `Error: ${event.error}`);
    };

    return true;
  }

  start(): boolean {
    if (!this.recognition && !this.init()) return false;
    if (this.isListening) return true;

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}
