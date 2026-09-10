"use client";

import { useState } from "react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { useLang } from "@/lib/i18n/context";
import { getIndustry } from "@/lib/industry/config";

export const dynamic = "force-dynamic";

interface PaymentSuccess {
  transactionId: string;
  reference: string;
  amount: number;
  currency: string;
}

export default function PaymentPage() {
  const { t } = useLang();
  const config = getIndustry();

  const [form, setForm] = useState({
    amount: "",
    email: "",
    fullName: "",
    phone: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<PaymentSuccess | null>(null);

  const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || "";

  const flutterwaveConfig = {
    public_key: publicKey,
    tx_ref: `DNT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount: parseFloat(form.amount) || 0,
    currency: "NGN" as const,
    payment_options: "card,banktransfer,ussd" as const,
    customer: {
      email: form.email,
      phone_number: form.phone,
      name: form.fullName,
    },
    customizations: {
      title: config.name,
      description: form.description || "Payment",
      logo: config.logo,
    },
  };

  const handleFlutterwavePayment = useFlutterwave(flutterwaveConfig);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!form.email) {
      setError("Please enter your email");
      return;
    }
    if (!form.fullName) {
      setError("Please enter your full name");
      return;
    }
    if (!publicKey) {
      setError("Payment gateway is not configured");
      return;
    }

    setLoading(true);

    try {
      handleFlutterwavePayment({
        callback: async (response) => {
          closePaymentModal();
          if (response.status === "successful") {
            try {
              await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  transactionId: String(response.transaction_id),
                  reference: response.tx_ref,
                  amount: parseFloat(form.amount),
                  currency: "NGN",
                  email: form.email,
                  name: form.fullName,
                  phone: form.phone,
                  description: form.description,
                  status: response.status,
                }),
              });
            } catch {
              // Payment recorded by Flutterwave even if save fails
            }
            setSuccess({
              transactionId: String(response.transaction_id),
              reference: response.tx_ref,
              amount: parseFloat(form.amount),
              currency: "NGN",
            });
          } else {
            setError("Payment was not successful. Please try again.");
          }
          setLoading(false);
        },
        onClose: () => {
          setLoading(false);
        },
      });
    } catch {
      setError("Failed to initialize payment. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600" />
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg shadow-emerald-500/20">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h1>
            <p className="text-gray-500 text-sm mb-8">Your payment has been processed successfully.</p>

            <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Reference</span>
                <span className="text-sm font-semibold text-gray-900 font-mono">{success.reference}</span>
              </div>
              <div className="h-px bg-gray-200/60" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Transaction ID</span>
                <span className="text-sm font-semibold text-gray-900">{success.transactionId}</span>
              </div>
              <div className="h-px bg-gray-200/60" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-bold text-gray-900">
                  ₦{success.amount.toLocaleString()}
                </span>
              </div>
              <div className="h-px bg-gray-200/60" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Successful
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccess(null);
                setForm({ amount: "", email: "", fullName: "", phone: "", description: "" });
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl shadow-blue-600/20 hover:shadow-2xl hover:shadow-blue-600/30 active:scale-[0.98]"
            >
              Make Another Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />

          <div className="p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Make a Payment</h1>
                <p className="text-sm text-gray-500">Secure payment powered by {config.name}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Amount (NGN)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₦</span>
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    required
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 font-semibold text-lg placeholder:text-gray-300 focus:border-blue-500 focus:bg-white focus:ring-0 outline-none transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-0 outline-none transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-0 outline-none transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+234 800 000 0000"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-0 outline-none transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="What is this payment for?"
                  rows={3}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-0 outline-none transition-all duration-300 resize-none"
                />
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/60 text-sm text-red-700 flex items-center gap-2.5 animate-scale-in">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 shadow-xl shadow-blue-600/20 hover:shadow-2xl hover:shadow-blue-600/30 active:scale-[0.98] mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Pay ₦${parseFloat(form.amount || "0").toLocaleString()}`
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                SSL Encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Secure Payment
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
