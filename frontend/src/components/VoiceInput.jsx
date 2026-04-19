import React, { useCallback } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';

const VoiceInput = ({ onParsed }) => {
  const handleResult = useCallback((parsed, rawText) => {
    onParsed(parsed, rawText);
  }, [onParsed]);

  const { isListening, transcript, supported, startListening, stopListening, clearTranscript } = useVoice(handleResult);

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200
          ${isListening
            ? 'bg-red-500 text-white mic-pulse shadow-lg shadow-red-500/30'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-500'
          }`}
        title={isListening ? 'Stop listening' : 'Voice input'}
      >
        {isListening ? (
          <>
            <MicOff size={16} />
            <span>Stop</span>
            <span className="flex gap-0.5 ml-1">
              {[0, 0.2, 0.4].map((delay) => (
                <span
                  key={delay}
                  className="w-0.5 bg-white rounded-full animate-bounce"
                  style={{ height: '12px', animationDelay: `${delay}s` }}
                />
              ))}
            </span>
          </>
        ) : (
          <>
            <Mic size={16} />
            <span>Voice</span>
          </>
        )}
      </button>

      {transcript && (
        <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
          <span className="truncate italic">"{transcript}"</span>
          <button onClick={clearTranscript} className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
