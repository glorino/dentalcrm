"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/context";

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
];

function getAvailableDates(): string[] {
  const dates: string[] = [];
  const now = new Date();
  let day = now.getDay();
  let date = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();

  while (dates.length < 5) {
    if (day !== 0 && day !== 6) {
      const d = new Date(year, month, date);
      dates.push(d.toISOString().split("T")[0]);
    }
    date++;
    day = (day + 1) % 7;
  }
  return dates;
}

export function BookDemoModal({ isOpen, onClose }: BookDemoModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const { t, locale } = useLang();

  const dates = getAvailableDates();

  const formatDateDisplay = (dateStr: string): string => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          phone: form.phone,
          date: selectedDate,
          time: selectedTime,
          message: form.message,
        }),
      });
    } catch {
      // Still show success even if email fails
    }
    setSubmitting(false);
    setStep("success");
  };

  const handleClose = () => {
    setStep("form");
    setSelectedDate("");
    setSelectedTime("");
    setForm({ name: "", email: "", company: "", phone: "", message: "" });
    onClose();
  };

  if (!isOpen) return null;

  const lang = locale === "fr" ? "fr-FR" : "en-US";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" style={{ animation: "modalSlideUp 0.3s ease-out" }}>
        <style>{`@keyframes modalSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">{t("bookDemo.title")}</h3>
              <p className="text-blue-100 text-sm mt-0.5">{t("bookDemo.subtitle")}</p>
            </div>
            <button onClick={handleClose} className="text-white/70 hover:text-white h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {step === "success" ? (
          <div className="p-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-green-100 mx-auto mb-5 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">{t("bookDemo.scheduled")}</h4>
            <p className="text-sm text-gray-500 mb-6">
              {t("bookDemo.scheduledDesc")}
            </p>
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 mb-6">
              <p className="text-xs text-blue-600 font-medium">{t("bookDemo.whatToExpect")}</p>
              <p className="text-sm text-gray-600 mt-1">{t("bookDemo.whatToExpectDesc")}</p>
            </div>
            <button onClick={handleClose} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-sm font-semibold hover:shadow-lg transition-all">
              {t("bookDemo.done")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Date Picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t("bookDemo.selectDate")}</label>
              <div className="grid grid-cols-5 gap-2">
                {dates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`rounded-xl px-2 py-3 text-center transition-all border-2 ${
                      selectedDate === d
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-100 hover:border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-[10px] font-medium uppercase">{new Date(d + "T00:00:00").toLocaleDateString(lang, { weekday: "short" })}</div>
                    <div className="text-lg font-bold mt-0.5">{new Date(d + "T00:00:00").getDate()}</div>
                    <div className="text-[10px] text-gray-400">{new Date(d + "T00:00:00").toLocaleDateString(lang, { month: "short" })}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Picker */}
            {selectedDate && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t("bookDemo.selectTime")}</label>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={`rounded-xl px-3 py-2 text-xs font-medium transition-all border-2 ${
                        selectedTime === slot
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-100 hover:border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Form */}
            {selectedDate && selectedTime && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{t("bookDemo.fullName")}</label>
                    <input type="text" required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t("bookDemo.namePlaceholder")} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{t("bookDemo.workEmail")}</label>
                    <input type="email" required value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder={t("bookDemo.emailPlaceholder")} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{t("bookDemo.company")}</label>
                    <input type="text" value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} placeholder={t("bookDemo.companyPlaceholder")} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{t("bookDemo.phone")}</label>
                    <input type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder={t("bookDemo.phonePlaceholder")} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t("bookDemo.message")}</label>
                  <textarea rows={2} value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} placeholder={t("bookDemo.messagePlaceholder")} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none" />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!selectedDate || !selectedTime || !form.name || !form.email || submitting}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  {t("bookDemo.scheduling")}
                </span>
              ) : (
                `Confirm Demo — ${formatDateDisplay(selectedDate)} at ${selectedTime || "..."}`
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
