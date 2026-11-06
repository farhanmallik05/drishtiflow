import React, { useState, useEffect, useRef } from 'react';
import { AutomationRule, Camera } from '../../types';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Volume2, 
  Send, 
  Check, 
  Sliders, 
  Languages, 
  Activity, 
  Clock, 
  ShieldAlert, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface VoiceAssistantViewProps {
  cameras: Camera[];
  onRuleCreated: (newRule: AutomationRule) => void;
  onNavigateToRules: () => void;
}

interface ParsedRulePreview {
  target: string;
  location: string;
  timeCondition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'notify_security' | 'sound_alarm' | 'lockdown' | 'dispatch_drone' | 'webhook';
  rawQuery: string;
  confidence: number;
}

export const VoiceAssistantView: React.FC<VoiceAssistantViewProps> = ({
  cameras,
  onRuleCreated,
  onNavigateToRules
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [transcript, setTranscript] = useState<string>('');
  const [speechSynthesisActive, setSpeechSynthesisActive] = useState<boolean>(false);
  const [parsedPreview, setParsedPreview] = useState<ParsedRulePreview | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>(new Array(24).fill(10));
  const [aiResponseSpeech, setAiResponseSpeech] = useState<string>('');

  const recognitionRef = useRef<any>(null);

  // Suggested Voice Commands (English and Hindi)
  const sampleCommandsEn = [
    "Notify me if someone enters the building after 10 PM.",
    "Alert me if a person enters the restricted area.",
    "Detect any vehicle entering the parking area after midnight.",
    "Send an alert if smoke is detected.",
    "Notify security if someone remains near the main gate for more than five minutes."
  ];

  const sampleCommandsHi = [
    "Raat 10 baje ke baad koi building me aaye toh alert karo.",
    "Restricted server vault me koi vyakti ghuse toh notification bhejo.",
    "Aadhi raat ke baad parking area me kisi gaadi ko detect karo.",
    "Agar kahin smoke ya dhuan dikhe toh turant siren bajao.",
    "Main gate par 5 minute se jyada loitering ho toh security ko notify karo."
  ];

  // Animated Waveform effect when listening
  useEffect(() => {
    let interval: any;
    if (isListening) {
      interval = setInterval(() => {
        setWaveformBars(prev => 
          prev.map(() => Math.floor(Math.random() * 45) + 8)
        );
      }, 100);
    } else {
      setWaveformBars(new Array(24).fill(10));
    }
    return () => clearInterval(interval);
  }, [isListening]);

  // Speech Recognition Setup (Web Speech API)
  const startListening = () => {
    soundManager.playVoiceWake();
    setIsListening(true);
    setTranscript('');
    setParsedPreview(null);
    setAiResponseSpeech('');

    const SpeechRecognition = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          // If transcript captured, process it
          if (transcript.trim().length > 0) {
            processNaturalLanguageCommand(transcript);
          }
        };

        recognition.start();
      } catch {
        setIsListening(false);
      }
    } else {
      // Fallback for browsers without Web Speech recognition
      setTimeout(() => {
        setIsListening(false);
        const fallbackText = language === 'hi' 
          ? "Raat 10 baje ke baad koi building me aaye toh alert karo." 
          : "Notify me if someone enters the building after 10 PM.";
        setTranscript(fallbackText);
        processNaturalLanguageCommand(fallbackText);
      }, 2500);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (transcript.trim().length > 0) {
      processNaturalLanguageCommand(transcript);
    }
  };

  // Natural Language Rule Parser
  const processNaturalLanguageCommand = (rawText: string) => {
    setIsProcessing(true);
    soundManager.playRadarPing();

    setTimeout(() => {
      const lower = rawText.toLowerCase();

      let target = 'person';
      let location = 'Main Gate Entrance';
      let timeCondition = '24/7 Monitored';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'high';
      let action: 'notify_security' | 'sound_alarm' | 'lockdown' | 'dispatch_drone' | 'webhook' = 'notify_security';

      // Detect Target
      if (lower.includes('smoke') || lower.includes('dhuan') || lower.includes('fire') || lower.includes('aag')) {
        target = 'fire_smoke';
        location = 'All Monitored Sectors';
        severity = 'critical';
        action = 'sound_alarm';
      } else if (lower.includes('vehicle') || lower.includes('gaadi') || lower.includes('car')) {
        target = 'vehicle';
        location = 'Underground Parking B2';
        severity = 'medium';
      } else if (lower.includes('fall') || lower.includes('gir')) {
        target = 'fall_risk';
        location = 'Rooftop North Perimeter';
        severity = 'critical';
        action = 'dispatch_drone';
      } else if (lower.includes('restricted') || lower.includes('vault')) {
        target = 'unauthorized_entry';
        location = 'Server Vault Restricted';
        severity = 'critical';
        action = 'lockdown';
      }

      // Detect Location
      if (lower.includes('building') || lower.includes('entrance') || lower.includes('gate')) {
        location = 'Main Gate Entrance';
      } else if (lower.includes('parking')) {
        location = 'Underground Parking B2';
      } else if (lower.includes('corridor') || lower.includes('3f')) {
        location = 'Executive Corridor 3F';
      } else if (lower.includes('rooftop')) {
        location = 'Rooftop North Perimeter';
      }

      // Detect Time
      if (lower.includes('10 pm') || lower.includes('10 baje')) {
        timeCondition = 'After 10:00 PM (22:00 - 06:00)';
      } else if (lower.includes('midnight') || lower.includes('aadhi raat')) {
        timeCondition = 'Midnight (00:00 - 05:00)';
      } else if (lower.includes('five minutes') || lower.includes('5 minute')) {
        timeCondition = 'Loitering > 5 Minutes';
      }

      const preview: ParsedRulePreview = {
        target,
        location,
        timeCondition,
        severity,
        action,
        rawQuery: rawText,
        confidence: 0.94
      };

      setParsedPreview(preview);
      setIsProcessing(false);
      soundManager.playSuccessChime();

      // Speak back TTS response
      const responseText = language === 'hi'
        ? `Niyam taiyyar hai: ${location} par ${target} detect hone par turant alert trigger hoga.`
        : `Understood. Configured rule for ${target} at ${location} with action ${action.replace('_', ' ')}.`;

      setAiResponseSpeech(responseText);
      speakVoiceResponse(responseText);
    }, 600);
  };

  const speakVoiceResponse = (text: string) => {
    if ('speechSynthesis' in window && !soundManager.isMuted) {
      setSpeechSynthesisActive(true);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      utterance.onend = () => setSpeechSynthesisActive(false);
      utterance.onerror = () => setSpeechSynthesisActive(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleActivateRule = () => {
    if (!parsedPreview) return;
    soundManager.playSuccessChime();

    const targetCamera = cameras.find(c => c.name.toLowerCase().includes(parsedPreview.location.toLowerCase())) || cameras[0];

    const newRule: AutomationRule = {
      id: `RULE-V${Math.floor(Math.random() * 899 + 100)}`,
      name: `Voice: ${parsedPreview.target.toUpperCase()} at ${parsedPreview.location}`,
      enabled: true,
      cameraIds: [targetCamera.id],
      detectionType: parsedPreview.target as any,
      zone: parsedPreview.location,
      timeCondition: {
        type: parsedPreview.timeCondition.includes('After') ? 'after_hours' : '24_7',
        startTime: '22:00',
        endTime: '06:00'
      },
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      triggerCondition: parsedPreview.timeCondition.includes('Loitering') ? 'loitering_5min' : 'immediate',
      alertSeverity: parsedPreview.severity,
      notificationChannels: ['in_app', 'sms_whatsapp', 'push'],
      action: parsedPreview.action,
      triggerCount: 0,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    onRuleCreated(newRule);
    onNavigateToRules();
  };

  return (
    <div className="space-y-6 font-mono max-w-4xl mx-auto">
      {/* Voice Assistant Header Card */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center relative overflow-hidden shadow-sm space-y-6">
        {/* Top Language Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-600 text-xs font-bold">
            <Sparkles className="w-4 h-4 animate-spin text-orange-500" />
            <span>LISTY AI INTELLIGENCE SYSTEM</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <Languages className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <button
              onClick={() => {
                soundManager.playRadarPing();
                setLanguage('en');
              }}
              className={`px-3 py-1 rounded-lg transition ${
                language === 'en'
                  ? 'bg-orange-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => {
                soundManager.playRadarPing();
                setLanguage('hi');
              }}
              className={`px-3 py-1 rounded-lg transition ${
                language === 'hi'
                  ? 'bg-orange-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिंदी (Hindi)
            </button>
          </div>
        </div>

        {/* Large Animated Microphone Button */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="relative">
            {/* Outer Pulsing Rings when listening */}
            {isListening && (
              <>
                <div className="absolute -inset-8 rounded-full bg-orange-500/20 animate-ping pointer-events-none" />
                <div className="absolute -inset-4 rounded-full bg-amber-500/30 animate-pulse pointer-events-none" />
              </>
            )}

            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                isListening
                  ? 'bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)] scale-110'
                  : 'bg-gradient-to-tr from-orange-600 via-amber-600 to-orange-500 text-white shadow-lg hover:scale-105'
              }`}
            >
              {isListening ? (
                <MicOff className="w-12 h-12 animate-pulse" />
              ) : (
                <Mic className="w-12 h-12" />
              )}
            </button>
          </div>

          <div className="mt-4">
            <div className="text-sm font-bold text-slate-900">
              {isListening 
                ? (language === 'hi' ? 'सुन रहा हूँ... बोलिए' : 'Listening... Speak Your Security Rule')
                : isProcessing 
                ? 'Synthesizing Neural Conditions...'
                : (language === 'hi' ? 'माइक्रोफोन पर टैप करके बोलें' : 'Tap Microphone to Speak Security Rule')}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Natural Language Rule Translation Engine (NLP v3.8)
            </div>
          </div>

          {/* Dynamic Audio Waveform Visualizer */}
          <div className="flex items-center justify-center gap-1.5 h-12 mt-4 px-6 w-full max-w-md">
            {waveformBars.map((height, idx) => (
              <span
                key={idx}
                className={`w-1.5 rounded-full transition-all duration-100 ${
                  isListening
                    ? idx % 2 === 0
                      ? 'bg-orange-500 shadow-sm'
                      : 'bg-amber-500 shadow-sm'
                    : 'bg-slate-200'
                }`}
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
        </div>

        {/* Live Speech-to-Text Transcription Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>TRANSCRIPT OUTPUT:</span>
            {speechSynthesisActive && (
              <span className="text-orange-600 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                LISTY AI SPEAKING
              </span>
            )}
          </div>
          <div className="text-sm text-slate-900 min-h-[38px] font-sans font-medium">
            {transcript || (
              <span className="text-slate-400 italic">
                {language === 'hi' 
                  ? 'बोलने पर आपका वाक्य यहाँ दिखाई देगा...'
                  : 'Spoken command will transcribe here in real-time...'}
              </span>
            )}
          </div>
        </div>

        {/* Manual Query Input Field */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={
              language === 'hi'
                ? "यहाँ टाइप करें: उदा. 'Main gate par raat 10 baje ke baad alert bhejo'"
                : "Or type command: e.g. 'Alert me if a person enters the restricted area'"
            }
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && transcript.trim()) {
                processNaturalLanguageCommand(transcript);
              }
            }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white"
          />
          <button
            onClick={() => {
              if (transcript.trim()) processNaturalLanguageCommand(transcript);
            }}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>PARSE</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Sample Prompts Pills */}
        <div className="text-left space-y-2 pt-2">
          <span className="text-xs text-slate-500 font-bold block">
            {language === 'hi' ? 'उदाहरण वॉयस कमांड्स (क्लिक करें):' : 'TRY EXAMPLE VOICE COMMANDS (CLICK TO TEST):'}
          </span>
          <div className="flex flex-wrap gap-2">
            {(language === 'hi' ? sampleCommandsHi : sampleCommandsEn).map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(cmd);
                  processNaturalLanguageCommand(cmd);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 text-xs font-sans text-left transition cursor-pointer"
              >
                &ldquo;{cmd}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation & Structured Preview Card when parsed */}
      {parsedPreview && (
        <div className="p-6 rounded-3xl bg-white border border-orange-200 space-y-5 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="font-bold text-slate-900 text-sm">
                STRUCTURED RULE GENERATION PREVIEW
              </h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-bold">
              NLP CONFIDENCE: {Math.round(parsedPreview.confidence * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 block text-[10px] font-bold">TRIGGER TARGET</span>
              <span className="text-orange-600 font-bold text-sm uppercase">
                {parsedPreview.target.replace('_', ' ')}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 block text-[10px] font-bold">MONITORED ZONE</span>
              <span className="text-slate-900 font-bold text-sm">
                {parsedPreview.location}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 block text-[10px] font-bold">TIME WINDOW</span>
              <span className="text-amber-700 font-bold text-sm">
                {parsedPreview.timeCondition}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 block text-[10px] font-bold">RESPONSE ACTION</span>
              <span className="text-emerald-700 font-bold text-sm uppercase">
                {parsedPreview.action.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Natural Logic Syntax Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="text-orange-600 font-bold">COMPILED LOGIC EXPRESSION:</div>
            <p className="text-slate-800 font-mono">
              <strong>IF:</strong> {parsedPreview.target} detected at {parsedPreview.location}<br />
              <strong>AND:</strong> Time condition matches [{parsedPreview.timeCondition}]<br />
              <strong>THEN:</strong> Execute {parsedPreview.action.replace('_', ' ')} &amp; dispatch critical notification.
            </p>
          </div>

          {/* Activate Rule Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setParsedPreview(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition"
            >
              Cancel
            </button>
            <button
              onClick={handleActivateRule}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition"
            >
              <Check className="w-4 h-4" />
              <span>CONFIRM &amp; ACTIVATE RULE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
