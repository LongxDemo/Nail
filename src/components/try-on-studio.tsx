"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Camera, History, ImageIcon, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { localize, formatPrice, timestamp, type NailLength, type NailShape } from "@/lib/format";
import { DesignPlaceholder } from "@/components/design-placeholder";
import type { GalleryDesign } from "@/components/design-card";
import { useTryOnHistory } from "@/lib/try-on-history";
import { runTryOn } from "@/app/[locale]/try-on/actions";

type Status = "idle" | "checking" | "processing" | "done" | "error";
type ErrorKind = "no_hand" | "generic";
type View = "browse" | "history";

const SHAPES: NailShape[] = ["round", "oval", "almond", "square", "coffin", "stiletto"];
const LENGTHS: NailLength[] = ["short", "medium", "long"];
const PROCESSING_MESSAGE_KEYS = ["processing1", "processing2", "processing3"] as const;

interface Category {
  id: string;
  nameEn: string;
  nameKm: string;
}

export function TryOnStudio({
  designs,
  categories,
  initialDesignId,
}: {
  designs: GalleryDesign[];
  categories: Category[];
  initialDesignId?: string;
}) {
  const t = useTranslations("TryOn");
  const common = useTranslations("Common");
  const shapes_t = useTranslations("Shapes");
  const locale = useLocale();
  const { history, addEntry, loaded: historyLoaded } = useTryOnHistory();

  const [view, setView] = useState<View>("browse");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const [handPhotoFile, setHandPhotoFile] = useState<File | null>(null);
  const [handPhotoUrl, setHandPhotoUrl] = useState<string | null>(null);
  const [shape, setShape] = useState<NailShape>("oval");
  const [length, setLength] = useState<NailLength>("medium");

  const [status, setStatus] = useState<Status>("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [showBefore, setShowBefore] = useState(false);
  const [activeDesign, setActiveDesign] = useState<GalleryDesign | null>(
    designs.find((d) => d.id === initialDesignId) ?? null,
  );
  const [pendingDesign, setPendingDesign] = useState<GalleryDesign | null>(null);
  const [processingMsgIndex, setProcessingMsgIndex] = useState(0);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status !== "processing") return;
    const interval = setInterval(() => {
      setProcessingMsgIndex((i) => (i + 1) % PROCESSING_MESSAGE_KEYS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [status]);

  async function startTryOn(design: GalleryDesign, file: File) {
    setActiveDesign(design);
    setStatus("checking");
    setErrorKind(null);

    const { detectHandPresent } = await import("@/lib/try-on/hand-detection");
    const hasHand = await detectHandPresent(file);
    if (!hasHand) {
      setStatus("error");
      setErrorKind("no_hand");
      return;
    }

    setStatus("processing");
    setProcessingMsgIndex(0);

    const formData = new FormData();
    formData.append("handPhoto", file);
    formData.append("designId", design.id);
    formData.append("shape", shape);
    formData.append("length", length);

    const result = await runTryOn(formData);
    if (!result.ok) {
      setStatus("error");
      setErrorKind("generic");
      return;
    }

    setResultUrl(result.resultUrl);
    setShowBefore(false);
    setStatus("done");
    addEntry({
      id: result.id,
      designId: design.id,
      designName: localize(locale, design.nameEn, design.nameKm),
      resultUrl: result.resultUrl,
      handPhotoUrl: result.handPhotoUrl,
      shape,
      length,
      createdAt: timestamp(),
    });
  }

  function handlePhotoChosen(file: File) {
    setHandPhotoFile(file);
    setHandPhotoUrl(URL.createObjectURL(file));
    setStatus("idle");
    setResultUrl(null);
    setErrorKind(null);
    if (pendingDesign) {
      const design = pendingDesign;
      setPendingDesign(null);
      void startTryOn(design, file);
    }
  }

  function handleTryOnTap(design: GalleryDesign) {
    if (!handPhotoFile) {
      setPendingDesign(design);
      galleryInputRef.current?.click();
      return;
    }
    void startTryOn(design, handPhotoFile);
  }

  function handleTryAgain() {
    if (activeDesign && handPhotoFile) void startTryOn(activeDesign, handPhotoFile);
  }

  const filteredDesigns = categoryId ? designs.filter((d) => d.categoryId === categoryId) : designs;

  return (
    <div className="flex flex-col">
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePhotoChosen(file);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePhotoChosen(file);
          e.target.value = "";
        }}
      />

      {/* Top half: photo / result stage */}
      <div className="bg-brand-50 px-4 pb-5 pt-4">
        <h1 className="font-display mb-3 text-center text-2xl text-brand-900">{t("title")}</h1>

        {!handPhotoUrl ? (
          <UploadPrompt
            onChooseGallery={() => galleryInputRef.current?.click()}
            onTakePhoto={() => cameraInputRef.current?.click()}
          />
        ) : (
          <div>
            <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={status === "done" && resultUrl && !showBefore ? resultUrl : handPhotoUrl}
                alt=""
                className="h-full w-full object-cover"
              />

              {(status === "checking" || status === "processing") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 text-white">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="px-6 text-center text-sm font-medium">
                    {t(PROCESSING_MESSAGE_KEYS[processingMsgIndex])}
                  </p>
                </div>
              )}

              {status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-6 text-center text-white">
                  <p className="text-sm">{t(errorKind === "no_hand" ? "errorNoHand" : "errorGeneric")}</p>
                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-700"
                  >
                    {t("tryAgain")}
                  </button>
                </div>
              )}

              {status !== "checking" && status !== "processing" && (
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t("retake")}
                </button>
              )}

              {status === "done" && resultUrl && (
                <div className="absolute left-3 top-3 flex overflow-hidden rounded-full bg-black/40 text-xs font-medium text-white backdrop-blur">
                  <button
                    type="button"
                    onClick={() => setShowBefore(true)}
                    className={`px-3 py-1 ${showBefore ? "bg-white text-brand-700" : ""}`}
                  >
                    {t("beforeLabel")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBefore(false)}
                    className={`px-3 py-1 ${!showBefore ? "bg-white text-brand-700" : ""}`}
                  >
                    {t("afterLabel")}
                  </button>
                </div>
              )}
            </div>

            {status !== "checking" && status !== "processing" && (
              <ShapeLengthPicker
                shape={shape}
                length={length}
                onShapeChange={setShape}
                onLengthChange={setLength}
                t={t}
                shapesT={shapes_t}
              />
            )}

            {status === "done" && activeDesign && (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-center text-sm text-foreground/70">
                  {localize(locale, activeDesign.nameEn, activeDesign.nameKm)}
                </p>
                <Link
                  href={{ pathname: "/booking", query: { designId: activeDesign.id } }}
                  className="rounded-full bg-brand-500 px-6 py-3.5 text-center text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
                >
                  {t("bookThis")}
                </Link>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="rounded-full border border-brand-300 px-6 py-2.5 text-center text-sm font-medium text-brand-700 hover:bg-brand-50"
                >
                  {t("tryAnother")}
                </button>
              </div>
            )}

            {status === "idle" && (
              <p className="mt-3 text-center text-xs text-foreground/50">{t("uploadFirstHint")}</p>
            )}
          </div>
        )}

        <p className="mx-auto mt-4 max-w-sm text-center text-[11px] leading-snug text-foreground/50">
          {t("privacyNotice")}
        </p>
      </div>

      {/* Bottom half: browse / history */}
      <div className="flex-1 px-4 py-4">
        <div className="mb-3 flex gap-2">
          <SegmentButton active={view === "browse"} onClick={() => setView("browse")}>
            <Sparkles className="h-4 w-4" />
            {t("browseTab")}
          </SegmentButton>
          <SegmentButton active={view === "history"} onClick={() => setView("history")}>
            <History className="h-4 w-4" />
            {t("historyTab")}
          </SegmentButton>
        </div>

        {view === "browse" ? (
          <div>
            <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
              <CategoryChip active={!categoryId} onClick={() => setCategoryId(null)}>
                {common("viewAll")}
              </CategoryChip>
              {categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  active={categoryId === cat.id}
                  onClick={() => setCategoryId(cat.id)}
                >
                  {localize(locale, cat.nameEn, cat.nameKm)}
                </CategoryChip>
              ))}
            </div>

            <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              {filteredDesigns.map((design) => (
                <div
                  key={design.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-2"
                >
                  {design.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={design.imageUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <DesignPlaceholder
                      color={design.swatchHex}
                      className="h-16 w-16 shrink-0 rounded-xl"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground/90">
                      {localize(locale, design.nameEn, design.nameKm)}
                    </p>
                    <p className="text-xs text-brand-600">{formatPrice(design.priceCents)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTryOnTap(design)}
                    className="shrink-0 rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600"
                  >
                    {t("tryOnButton")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <HistoryView
            history={history}
            loaded={historyLoaded}
            emptyLabel={t("historyEmpty")}
            compareSelectLabel={t("compareSelect")}
            compareButtonLabel={t("compareButton")}
            compareTitleLabel={t("compareTitle")}
            exitCompareLabel={t("exitCompare")}
            clearSelectionLabel={t("clearSelection")}
          />
        )}
      </div>
    </div>
  );
}

function UploadPrompt({
  onChooseGallery,
  onTakePhoto,
}: {
  onChooseGallery: () => void;
  onTakePhoto: () => void;
}) {
  const t = useTranslations("TryOn");
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-brand-300 bg-surface/60 px-6 py-10 text-center">
      <Camera className="h-10 w-10 text-brand-500" />
      <p className="text-sm text-foreground/70">{t("uploadTip")}</p>
      <div className="flex w-full flex-col gap-2">
        <button
          type="button"
          onClick={onTakePhoto}
          className="flex items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Camera className="h-4 w-4" />
          {t("takePhoto")}
        </button>
        <button
          type="button"
          onClick={onChooseGallery}
          className="flex items-center justify-center gap-2 rounded-full border border-brand-300 px-5 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
        >
          <ImageIcon className="h-4 w-4" />
          {t("choosePhoto")}
        </button>
      </div>
    </div>
  );
}

function ShapeLengthPicker({
  shape,
  length,
  onShapeChange,
  onLengthChange,
  t,
  shapesT,
}: {
  shape: NailShape;
  length: NailLength;
  onShapeChange: (s: NailShape) => void;
  onLengthChange: (l: NailLength) => void;
  t: ReturnType<typeof useTranslations<"TryOn">>;
  shapesT: ReturnType<typeof useTranslations<"Shapes">>;
}) {
  return (
    <div className="mx-auto mt-4 max-w-sm space-y-2">
      <div>
        <p className="mb-1 text-xs font-semibold text-foreground/60">{t("shapeLabel")}</p>
        <div className="flex flex-wrap gap-1.5">
          {SHAPES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onShapeChange(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                shape === s
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-border bg-surface text-foreground/70"
              }`}
            >
              {shapesT(s)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold text-foreground/60">{t("lengthLabel")}</p>
        <div className="flex gap-1.5">
          {LENGTHS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onLengthChange(l)}
              className={`flex-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                length === l
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-border bg-surface text-foreground/70"
              }`}
            >
              {t(`length${l.charAt(0).toUpperCase()}${l.slice(1)}` as "lengthShort")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
        active ? "border-brand-900 bg-brand-900 text-white" : "border-border bg-surface text-foreground/70"
      }`}
    >
      {children}
    </button>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-border bg-surface text-foreground/70"
      }`}
    >
      {children}
    </button>
  );
}

function HistoryView({
  history,
  loaded,
  emptyLabel,
  compareSelectLabel,
  compareButtonLabel,
  compareTitleLabel,
  exitCompareLabel,
  clearSelectionLabel,
}: {
  history: ReturnType<typeof useTryOnHistory>["history"];
  loaded: boolean;
  emptyLabel: string;
  compareSelectLabel: string;
  compareButtonLabel: string;
  compareTitleLabel: string;
  exitCompareLabel: string;
  clearSelectionLabel: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  if (!loaded) return null;

  if (history.length === 0) {
    return <p className="py-10 text-center text-sm text-foreground/60">{emptyLabel}</p>;
  }

  if (comparing) {
    const items = history.filter((h) => selected.includes(h.id));
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground/80">{compareTitleLabel}</p>
          <button
            type="button"
            onClick={() => setComparing(false)}
            className="text-sm font-medium text-brand-600"
          >
            {exitCompareLabel}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.resultUrl} alt="" className="aspect-square w-full object-cover" />
              <p className="truncate p-2 text-xs font-medium text-foreground/80">
                {item.designName}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-foreground/50">{compareSelectLabel}</p>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-xs font-medium text-foreground/50 underline"
          >
            {clearSelectionLabel}
          </button>
        )}
      </div>
      <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto pb-1 sm:grid-cols-3">
        {history.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleSelect(item.id)}
              className={`overflow-hidden rounded-2xl border-2 text-left transition-colors ${
                isSelected ? "border-brand-500" : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.resultUrl} alt="" className="aspect-square w-full object-cover" />
              <p className="truncate bg-surface p-2 text-xs font-medium text-foreground/80">
                {item.designName}
              </p>
            </button>
          );
        })}
      </div>
      {selected.length === 2 && (
        <button
          type="button"
          onClick={() => setComparing(true)}
          className="mt-3 w-full rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          {compareButtonLabel}
        </button>
      )}
    </div>
  );
}
