import React, { useState, useEffect, useCallback } from "react";
import { X, Sparkles, Check, Loader2, RefreshCw, Eraser } from "lucide-react";
import { Button } from "../commons/Button";

// ── Canvas pipeline helpers ──────────────────────────────────────────────────

function enhanceOnCanvas(source: string | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const PAD  = Math.round(Math.max(img.naturalWidth, img.naturalHeight) * 0.08);
      const size = Math.max(img.naturalWidth, img.naturalHeight) + PAD * 2;

      const canvas = document.createElement("canvas");
      canvas.width  = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);

      const x = (size - img.naturalWidth)  / 2;
      const y = (size - img.naturalHeight) / 2;
      ctx.filter = "brightness(105%) contrast(110%) saturate(112%)";
      ctx.drawImage(img, x, y, img.naturalWidth, img.naturalHeight);

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
        "image/png"
      );
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src =
      typeof source === "string" ? source : URL.createObjectURL(source);
  });
}

// ── Component ────────────────────────────────────────────────────────────────

interface ImageEnhancementModalProps {
  open: boolean;
  file: File;
  onApply: (file: File) => void;
  onCancel: () => void;
}

type BgStatus = "idle" | "loading" | "done" | "error";

export const ImageEnhancementModal: React.FC<ImageEnhancementModalProps> = ({
  open,
  file,
  onApply,
  onCancel,
}) => {
  const [originalUrl,  setOriginalUrl]  = useState("");
  const [resultBlob,   setResultBlob]   = useState<Blob | null>(null);
  const [resultUrl,    setResultUrl]    = useState<string | null>(null);

  // Fast enhance — runs immediately
  const [enhancing,    setEnhancing]    = useState(false);

  // Optional BG removal
  const [bgStatus,     setBgStatus]     = useState<BgStatus>("idle");
  const [bgProgress,   setBgProgress]   = useState(0);
  const [bgError,      setBgError]      = useState("");

  const [compareMode,  setCompareMode]  = useState(false);

  // ── Setup: run fast enhance immediately on open ──────────────────────────
  useEffect(() => {
    if (!open || !file) return;

    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setResultBlob(null);
    setResultUrl(null);
    setEnhancing(true);
    setBgStatus("idle");
    setBgProgress(0);
    setBgError("");

    enhanceOnCanvas(url)
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        setResultBlob(blob);
        setResultUrl(blobUrl);
      })
      .catch(console.error)
      .finally(() => setEnhancing(false));

    return () => URL.revokeObjectURL(url);
  }, [open, file]);

  // ── Optional BG removal ──────────────────────────────────────────────────
  const handleRemoveBackground = useCallback(async () => {
    if (bgStatus === "loading") return;
    setBgStatus("loading");
    setBgProgress(0);
    setBgError("");

    try {
      const { removeBackground } = await import("@imgly/background-removal");

      const bgBlob: Blob = await removeBackground(file, {
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) setBgProgress(Math.round((current / total) * 100));
        },
      });

      // Re-enhance the bg-removed result (adds white bg + padding + filters)
      const finalBlob = await enhanceOnCanvas(bgBlob);
      const url = URL.createObjectURL(finalBlob);
      setResultBlob(finalBlob);
      setResultUrl(url);
      setBgStatus("done");
    } catch (err) {
      setBgStatus("error");
      setBgError(err instanceof Error ? err.message : "Xəta baş verdi");
    }
  }, [file, bgStatus]);

  const handleApply = () => {
    if (!resultBlob) return;
    const name = file.name.replace(/\.[^.]+$/, ".ecommerce.png");
    onApply(new File([resultBlob], name, { type: "image/png" }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">AI ilə E-commerce Hazırla</h2>
              <p className="text-xs text-neutral-400 max-w-[280px] truncate">{file.name}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Before / After ── */}
        <div className="grid grid-cols-2 border-b border-neutral-100">
          {/* Before */}
          <div className="flex flex-col items-center bg-neutral-50 p-4 gap-2">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Əvvəl</span>
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#f9fafb_0%_50%)] bg-[length:16px_16px] flex items-center justify-center">
              {originalUrl && (
                <img src={originalUrl} alt="original" className="max-w-full max-h-full object-contain" />
              )}
            </div>
          </div>

          {/* After */}
          <div className="flex flex-col items-center bg-white p-4 gap-2 border-l border-neutral-100">
            <span className="text-[11px] font-semibold text-violet-600 uppercase tracking-wide">Sonra</span>
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-white border border-neutral-100 flex items-center justify-center">
              {enhancing || bgStatus === "loading" ? (
                <div className="flex flex-col items-center gap-2 px-4 text-center">
                  <Loader2 size={28} className="text-violet-500 animate-spin" />
                  <p className="text-xs font-medium text-neutral-600">
                    {bgStatus === "loading"
                      ? bgProgress > 0
                        ? `Arxa fon silinir… ${bgProgress}%`
                        : "Model yüklənir…"
                      : "Yaxşılaşdırılır…"}
                  </p>
                </div>
              ) : resultUrl ? (
                <img
                  src={compareMode ? originalUrl : resultUrl}
                  alt={compareMode ? "original" : "enhanced"}
                  className={`max-w-full max-h-full object-contain ${compareMode ? "opacity-60" : ""}`}
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* ── What was applied ── */}
        <div className="px-6 py-4 border-b border-neutral-100 space-y-3">
          {/* Instant steps — always applied */}
          <div className="flex flex-col gap-1.5">
            {[
              "Ağ fon əlavə edildi",
              "Rəng optimallaşdırıldı",
              "Kənar boşluq tənzimləndi",
            ].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${
                  !enhancing ? "bg-green-500" : "bg-neutral-200"
                }`}>
                  {!enhancing
                    ? <Check size={10} className="text-white" />
                    : <Loader2 size={10} className="text-neutral-400 animate-spin" />
                  }
                </div>
                <span className={`text-xs font-medium ${!enhancing ? "text-green-700" : "text-neutral-400"}`}>
                  {label}
                </span>
              </div>
            ))}

            {/* BG removal status */}
            {bgStatus !== "idle" && (
              <div className="flex items-center gap-2">
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${
                  bgStatus === "done"    ? "bg-green-500"
                  : bgStatus === "error" ? "bg-red-400"
                  : "bg-violet-500"
                }`}>
                  {bgStatus === "done"    ? <Check size={10} className="text-white" />
                  : bgStatus === "error"  ? <X size={10} className="text-white" />
                  : <Loader2 size={10} className="text-white animate-spin" />}
                </div>
                <span className={`text-xs font-medium ${
                  bgStatus === "done"   ? "text-green-700"
                  : bgStatus === "error" ? "text-red-600"
                  : "text-violet-700"
                }`}>
                  {bgStatus === "done"   ? "Arxa fon silindi"
                  : bgStatus === "error" ? `Xəta: ${bgError}`
                  : bgProgress > 0      ? `Arxa fon silinir… ${bgProgress}%`
                  : "Model yüklənir (ilk dəfə ~30s)…"}
                </span>
              </div>
            )}
          </div>

          {/* Optional BG removal button */}
          {bgStatus !== "done" && (
            <button
              onClick={handleRemoveBackground}
              disabled={enhancing || bgStatus === "loading"}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                bgStatus === "loading"
                  ? "border-violet-200 bg-violet-50 text-violet-400 cursor-wait"
                  : bgStatus === "error"
                  ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  : "border-dashed border-neutral-300 text-neutral-600 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50"
              }`}
            >
              {bgStatus === "loading" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Eraser size={14} />
              )}
              {bgStatus === "error"
                ? "Yenidən cəhd et — Arxa fonu sil"
                : bgStatus === "loading"
                ? "Arxa fon silinir…"
                : "Arxa fonu da sil (AI · ~30s)"}
            </button>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-50/60">
          <div className="flex items-center gap-2">
            {resultUrl && !enhancing && (
              <>
                <button
                  onClick={() => setCompareMode((v) => !v)}
                  className="text-xs text-neutral-500 hover:text-neutral-700 underline transition-colors"
                >
                  {compareMode ? "Nəticəni göstər" : "Orijinalla müqayisə"}
                </button>
                <span className="text-neutral-300">·</span>
                <button
                  onClick={() => {
                    setResultBlob(null);
                    setResultUrl(null);
                    setEnhancing(true);
                    setBgStatus("idle");
                    enhanceOnCanvas(originalUrl)
                      .then((blob) => {
                        setResultBlob(blob);
                        setResultUrl(URL.createObjectURL(blob));
                      })
                      .catch(console.error)
                      .finally(() => setEnhancing(false));
                  }}
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-violet-600 transition-colors"
                >
                  <RefreshCw size={11} /> Yenilə
                </button>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} type="button">
              Ləğv et
            </Button>
            <Button
              variant="primary"
              onClick={handleApply}
              disabled={!resultBlob || enhancing}
              type="button"
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              <Check size={15} />
              Tətbiq et
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
