"use client";

import { useState, useCallback } from "react";
import { useLang } from "@/lib/i18n/context";

interface XrayFinding {
  condition: string;
  confidence: number;
  severity: string;
  description: string;
}

interface XrayResult {
  findings: XrayFinding[];
  overallHealthScore: number;
  recommendations: string[];
  urgentCareWarning: string | null;
  imageType: string;
  analyzedAt: string;
}

export default function XrayPage() {
  const { t } = useLang();
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<XrayResult | null>(null);
  const [history, setHistory] = useState<XrayResult[]>([]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setUploadedImage(base64);
      setAnalyzing(true);
      setResult(null);

      try {
        const res = await fetch("/api/ai/multimodal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "analyze_xray", imageBase64: base64 }),
        });
        const data = await res.json();
        if (data.result) {
          setResult(data.result);
          setHistory((prev) => [data.result, ...prev].slice(0, 10));
        }
      } catch {
        console.error("Failed to analyze X-ray");
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const severityColor: Record<string, string> = {
    normal: "bg-green-100/80 text-green-700 border-green-200/60",
    mild: "bg-blue-100/80 text-blue-700 border-blue-200/60",
    moderate: "bg-amber-100/80 text-amber-700 border-amber-200/60",
    severe: "bg-red-100/80 text-red-700 border-red-200/60",
    critical: "bg-red-200/80 text-red-800 border-red-300/60",
  };

  const healthScoreColor = (score: number) => {
    if (score >= 80) return { text: "text-green-600", stroke: "stroke-green-500", bg: "bg-green-50" };
    if (score >= 60) return { text: "text-amber-600", stroke: "stroke-amber-500", bg: "bg-amber-50" };
    return { text: "text-red-600", stroke: "stroke-red-500", bg: "bg-red-50" };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
            X-Ray Analysis
          </h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered dental image analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer ${
              dragOver
                ? "border-blue-400 bg-blue-50/80 shadow-lg shadow-blue-500/10"
                : "border-gray-200 bg-white/80 hover:border-blue-300 hover:bg-blue-50/30"
            }`}
            onClick={() => document.getElementById("xray-upload")?.click()}
          >
            <input
              id="xray-upload"
              type="file"
              accept="image/*"
              onChange={onFileSelect}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-lg font-semibold text-gray-900 mb-1">Upload X-Ray</div>
            <div className="text-sm text-gray-500">Drag & drop or click to browse</div>
            <div className="text-xs text-gray-400 mt-2">Supports PNG, JPG, DICOM</div>
          </div>

          {uploadedImage && (
            <div className="rounded-3xl border border-gray-200/60 bg-white/80 overflow-hidden">
              <div className="p-4 border-b border-gray-100/80">
                <div className="text-sm font-semibold text-gray-900">Uploaded Image</div>
              </div>
              <div className="p-4">
                <img
                  src={uploadedImage}
                  alt="X-Ray"
                  className="w-full h-64 object-contain rounded-2xl bg-gray-50"
                />
              </div>
            </div>
          )}

          {analyzing && (
            <div className="rounded-3xl border border-blue-200/60 bg-blue-50/80 p-8 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 border-r-cyan-600" />
                <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-transparent border-t-blue-400 opacity-30" />
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">Analyzing X-Ray...</div>
              <div className="text-sm text-gray-500">AI is examining the image</div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {result && (
            <>
              {result.urgentCareWarning && (
                <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-5 flex items-start gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-red-800">Urgent Care Required</div>
                    <div className="text-sm text-red-700 mt-0.5">{result.urgentCareWarning}</div>
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-6">
                <div className="text-center mb-6">
                  <div className="text-sm text-gray-500 mb-2">Overall Health Score</div>
                  <div className={`relative w-24 h-24 mx-auto ${healthScoreColor(result.overallHealthScore).bg} rounded-full flex items-center justify-center`}>
                    <svg className="w-24 h-24 -rotate-90 absolute" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" className="stroke-gray-100" strokeWidth="2.5" />
                      <circle
                        cx="18" cy="18" r="15" fill="none"
                        className={healthScoreColor(result.overallHealthScore).stroke}
                        strokeWidth="2.5"
                        strokeDasharray={`${(result.overallHealthScore / 100) * 94.25} 94.25`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={`text-2xl font-bold ${healthScoreColor(result.overallHealthScore).text}`}>
                      {result.overallHealthScore}
                    </span>
                  </div>
                </div>

                <div className="text-sm font-semibold text-gray-900 mb-3">Findings</div>
                <div className="space-y-2 mb-6">
                  {result.findings.map((finding, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900">{finding.condition}</div>
                        <div className="text-xs text-gray-500 truncate">{finding.description}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs font-bold text-gray-700">{Math.round(finding.confidence * 100)}%</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${severityColor[finding.severity] || severityColor.mild}`}>
                          {finding.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm font-semibold text-gray-900 mb-3">Recommendations</div>
                <div className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50/60 rounded-xl border border-blue-100/60">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!result && !analyzing && (
            <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-16 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No analysis yet</h3>
              <p className="text-sm text-gray-500">Upload an X-ray image to get started</p>
            </div>
          )}
        </div>
      </div>

      {history.length > 1 && (
        <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-6">
          <div className="text-sm font-semibold text-gray-900 mb-4">Recent Analyses</div>
          <div className="space-y-2">
            {history.slice(1, 6).map((h, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <div className="text-sm font-medium text-gray-700">Analysis #{idx + 2}</div>
                  <div className="text-xs text-gray-500">{new Date(h.analyzedAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">Score: {h.overallHealthScore}</span>
                  <span className="text-xs text-gray-500">{h.findings.length} findings</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
