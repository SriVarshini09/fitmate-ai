import { useState, useRef, useCallback } from 'react';
import { VoiceRecognizer, isSpeechRecognitionSupported } from '@/lib/voiceRecognition';
import { parseVoiceCommand, VoiceParsedData } from '@/lib/naturalLanguageParser';

export type VoiceState = 'idle' | 'listening' | 'confirming' | 'error';

export function useVoiceInput() {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [parsedData, setParsedData] = useState<VoiceParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognizerRef = useRef<VoiceRecognizer | null>(null);

  const isSupported = isSpeechRecognitionSupported();

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Voice input is not supported on this browser. Try Chrome or Safari.');
      setState('error');
      return;
    }

    setTranscript('');
    setInterimTranscript('');
    setParsedData(null);
    setError(null);
    setState('listening');

    recognizerRef.current = new VoiceRecognizer({
      lang: 'en-US',
      continuous: false,
      interimResults: true,
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          setTranscript(text);
          setInterimTranscript('');
          const parsed = parseVoiceCommand(text);
          setParsedData(parsed);
          setState('confirming');
        } else {
          setInterimTranscript(text);
        }
      },
      onEnd: () => {
        // If we ended without a final transcript, go back to idle
        setState(prev => prev === 'listening' ? 'idle' : prev);
        setInterimTranscript('');
      },
      onError: (msg) => {
        setError(msg);
        setState('error');
        setInterimTranscript('');
      },
    });

    recognizerRef.current.start();
  }, [isSupported]);

  const stopListening = useCallback(() => {
    recognizerRef.current?.stop();
    setState('idle');
    setInterimTranscript('');
  }, []);

  const dismiss = useCallback(() => {
    recognizerRef.current?.abort();
    setState('idle');
    setTranscript('');
    setInterimTranscript('');
    setParsedData(null);
    setError(null);
  }, []);

  const confirm = useCallback(() => {
    setState('idle');
    setTranscript('');
    setParsedData(null);
  }, []);

  return {
    isSupported,
    state,
    transcript,
    interimTranscript,
    parsedData,
    error,
    startListening,
    stopListening,
    dismiss,
    confirm,
  };
}
