"use client";

import React, { useState } from "react";
import { MessageSquare, Phone, Send, CheckCircle, AlertCircle, X } from "lucide-react";

interface ActionTesterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActionTester: React.FC<ActionTesterProps> = ({ isOpen, onClose }) => {
  const [actionType, setActionType] = useState<"whatsapp_message" | "voice_call">("whatsapp_message");
  const [phone, setPhone] = useState("+919999999999");
  const [message, setMessage] = useState("DrishtiFlow Test Alert: Intrusion detected at Bhiwandi Central Warehouse Bay A.");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    setIsSending(true);
    setError(null);
    setResult(null);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

    try {
      const res = await fetch(`${apiBase}/api/v1/actions/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_type: actionType,
          recipient_phone: phone,
          message: message,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Failed to trigger test alert");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl relative flex flex-col gap-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
            Test Alert Dispatcher (सुरक्षित परीक्षण सूचना)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch a test alert to verify notification channels without triggering emergency protocols.
          </p>
        </div>

        {/* Channel Selection */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActionType("whatsapp_message")}
            className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
              actionType === "whatsapp_message"
                ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp Alert
          </button>

          <button
            onClick={() => setActionType("voice_call")}
            className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
              actionType === "voice_call"
                ? "bg-orange-950/40 border-orange-500 text-orange-300"
                : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
          >
            <Phone className="w-4 h-4 text-orange-400" /> Outbound Call (Vapi)
          </button>
        </div>

        {/* Phone Input */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Test Recipient Mobile:
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Message Input */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Message Payload:
          </label>
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex flex-col gap-1">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Alert Dispatch Successful
            </div>
            <div className="font-mono text-[10px] text-slate-400">
              Provider Ref: {result.provider_reference} • Idempotency: {result.idempotency_key?.slice(0, 16)}...
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSend}
          disabled={isSending}
          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {isSending ? (
            <span>Dispatching...</span>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" /> Send Test Notification
            </>
          )}
        </button>
      </div>
    </div>
  );
};

