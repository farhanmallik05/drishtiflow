"use client";

import React, { useState } from "react";
import { Mic, Sparkles, Send, HelpCircle, CheckCircle2, ArrowRight, BookOpen, Clock, AlertCircle } from "lucide-react";

interface RuleBuilderProps {
  onWorkflowCompiled: (workflow: any) => void;
  selectedCameraId?: string;
}

const BHARAT_PRESETS = [
  {
    id: "mandi-godown",
    title: "Mandi / Godown Security",
    title_hi: "गोदाम अनधिकृत प्रवेश",
    prompt: "Raat 10 baje ke baad godown mein koi aaye toh alert karo",
    icon: "🏭",
  },
  {
    id: "msme-machinery",
    title: "MSME Machinery Zone",
    title_hi: "मशीनरी सुरक्षा क्षेत्र",
    prompt: "When anyone enters the restricted cutting machinery bay notify supervisor",
    icon: "⚙️",
  },
  {
    id: "hospital-fall",
    title: "Hospital Fall Assist",
    title_hi: "अस्पताल मरीज गिरावट",
    prompt: "Agar ward 3 mein koi patient gir jaye toh staff ko check karne bolo",
    icon: "🏥",
  },
  {
    id: "kirana-counter",
    title: "Kirana Counter Security",
    title_hi: "किराना काउंटर निगरानी",
    prompt: "Dukaan band hone ke baad counter ke paas koi dikhe toh WhatsApp bhejo",
    icon: "🏪",
  },
];

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  onWorkflowCompiled,
  selectedCameraId,
}) => {
  const [prompt, setPrompt] = useState("Raat 10 baje ke baad godown mein koi aaye toh alert karo");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [compiledResult, setCompiledResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompile = async (textToCompile?: string) => {
    const text = textToCompile || prompt;
    if (!text.trim()) return;

    setIsCompiling(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/api/v1/workflows/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          camera_id: selectedCameraId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Compiler returned HTTP ${res.status}`);
      }

      const workflow = await res.json();
      setCompiledResult(workflow);
      onWorkflowCompiled(workflow);
    } catch (err: any) {
      setError(err.message || "Failed to compile prompt");
    } finally {
      setIsCompiling(false);
    }
  };

  const handleSelectPreset = (p: typeof BHARAT_PRESETS[0]) => {
    setPrompt(p.prompt);
    handleCompile(p.prompt);
  };

  const handleToggleVoice = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Browser speech recognition is not supported in this browser. Please type your prompt.");
      return;
    }

    setIsRecording(!isRecording);
    // In a live browser, initiate SpeechRecognition with Hindi/English language setting
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-slate-100 flex items-center gap-2">
              Vernacular Rule Builder <span className="text-xs text-orange-400 font-normal">(भाषा आधारित नियम)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Speak or type instructions in Hindi, Hinglish, or English.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Pills */}
      <div>
        <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
          Bharat Presets (त्वरित टेम्पलेट):
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {BHARAT_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className="text-left p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-orange-500/40 transition group"
            >
              <div className="text-base mb-1">{p.icon}</div>
              <div className="text-xs font-semibold text-slate-200 group-hover:text-orange-400">
                {p.title}
              </div>
              <div className="text-[10px] text-slate-500">{p.title_hi}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input Area */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Raat 10 baje ke baad godown mein koi aaye toh alert karo..."
          rows={3}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
        />

        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          <button
            onClick={handleToggleVoice}
            type="button"
            className={`p-2 rounded-full border transition ${
              isRecording
                ? "bg-red-500 text-white animate-pulse border-red-400"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
            title="Speech input"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleCompile()}
            disabled={isCompiling || !prompt.trim()}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-semibold rounded-lg shadow-lg flex items-center gap-1.5 disabled:opacity-50 transition"
          >
            {isCompiling ? (
              <span>Compiling...</span>
            ) : (
              <>
                <span>Compile Rule</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Compilation Result Card */}
      {compiledResult && (
        <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-lg flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-xs text-emerald-300">
                Workflow Proposed: {compiledResult.title?.en}
              </span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono uppercase">
              {compiledResult.status}
            </span>
          </div>

          {/* Trigger Details */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800">
            <div>
              <span className="text-slate-500 block">Detector Class:</span>
              <span className="font-mono text-orange-400">{compiledResult.trigger?.classes?.join(", ")}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Schedule Window:</span>
              <span className="font-mono text-blue-400">
                {compiledResult.trigger?.schedule
                  ? `${compiledResult.trigger.schedule.start} - ${compiledResult.trigger.schedule.end} (${compiledResult.trigger.schedule.timezone})`
                  : "24/7 Active"}
              </span>
            </div>
          </div>

          {/* Verification & Clarification */}
          {compiledResult.clarification_questions?.length > 0 && (
            <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-900 p-2.5 rounded">
              <span className="font-semibold flex items-center gap-1 mb-1">
                <HelpCircle className="w-3.5 h-3.5" /> Clarification Needed:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                {compiledResult.clarification_questions.map((q: string, idx: number) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
