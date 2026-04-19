import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { addDays, format } from 'date-fns';

// Regex patterns for date/time parsing from voice
const TIME_PATTERNS = {
  tomorrow: () => addDays(new Date(), 1),
  today: () => new Date(),
  'next week': () => addDays(new Date(), 7),
  monday: () => nextWeekday(1),
  tuesday: () => nextWeekday(2),
  wednesday: () => nextWeekday(3),
  thursday: () => nextWeekday(4),
  friday: () => nextWeekday(5),
  saturday: () => nextWeekday(6),
  sunday: () => nextWeekday(0),
};

function nextWeekday(day) {
  const now = new Date();
  const diff = (day - now.getDay() + 7) % 7 || 7;
  return addDays(now, diff);
}

function parseTimeStr(str) {
  const match = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const mins = parseInt(match[2] || '0');
  const ampm = match[3]?.toLowerCase();
  if (ampm === 'pm' && hours < 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;
  return { hours, mins };
}

export function parseVoiceCommand(transcript) {
  const lower = transcript.toLowerCase().trim();
  const result = { title: '', dueDate: '', priority: 'Medium', description: '' };

  // Extract priority
  if (/\b(urgent|high priority|important|critical)\b/.test(lower)) result.priority = 'High';
  else if (/\b(low priority|whenever|sometime)\b/.test(lower)) result.priority = 'Low';

  // Try to find "add task" command
  const addMatch = lower.match(/(?:add|create|new|set)\s+(?:task|reminder|todo|item)?\s*[:\-]?\s*(.+)/);
  let titlePart = addMatch ? addMatch[1] : lower;

  // Extract date
  let dateFound = null;
  for (const [key, fn] of Object.entries(TIME_PATTERNS)) {
    if (titlePart.includes(key)) {
      dateFound = fn();
      titlePart = titlePart.replace(key, '').trim();
      break;
    }
  }

  // Extract time like "at 5 pm" or "at 17:00"
  const atMatch = titlePart.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
  let timeInfo = null;
  if (atMatch) {
    timeInfo = parseTimeStr(atMatch[1]);
    titlePart = titlePart.replace(atMatch[0], '').trim();
  }

  // Build dueDate string
  if (dateFound) {
    if (timeInfo) {
      dateFound.setHours(timeInfo.hours, timeInfo.mins, 0, 0);
    } else {
      dateFound.setHours(9, 0, 0, 0); // Default 9 AM
    }
    // Format to datetime-local input format
    result.dueDate = format(dateFound, "yyyy-MM-dd'T'HH:mm");
  }

  // Clean up title
  result.title = titlePart
    .replace(/\b(urgent|high priority|low priority|important|critical|whenever|sometime)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter
  if (result.title) {
    result.title = result.title.charAt(0).toUpperCase() + result.title.slice(1);
  }

  return result;
}

export const useVoice = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!supported) {
      toast.error('Voice input not supported in this browser. Try Chrome.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(final || interim);
      if (final && onResult) {
        const parsed = parseVoiceCommand(final);
        onResult(parsed, final);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      if (event.error !== 'no-speech') {
        toast.error(`Voice error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    toast('🎤 Listening... speak now!', { icon: '🎙️', duration: 2000 });
  }, [supported, onResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const clearTranscript = () => setTranscript('');

  return { isListening, transcript, supported, startListening, stopListening, clearTranscript };
};
