"use client";

// Dialog konfirmasi (design_system §8.9): modal tengah, fokus terperangkap,
// Esc menutup, fokus kembali ke pemicu. Logika trap murni ada di
// `@/lib/focus-trap`; komponen ini mengurus DOM + event.

import { useEffect, useId, useRef } from "react";
import { keyToFocusIndex, trapTabIndex } from "@/lib/focus-trap";

const FOCUSABLE =
  'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
  pending = false,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  // Simpan onCancel terbaru di ref agar effect tidak ikut jalan ulang saat
  // identitas callback berubah (parent re-render) — mencegah fokus "melompat"
  // ke pemicu lalu balik lagi saat status pending berubah.
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!open) return;

    // Simpan pemicu & kunci scroll body; fokus awal ke tombol Batal.
    restoreRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    const focusables = (): HTMLElement[] => {
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      return nodes ? Array.from(nodes).filter((el) => !el.hasAttribute("disabled")) : [];
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelRef.current();
        return;
      }
      const items = focusables();
      if (items.length === 0) return;

      if (event.key === "Tab") {
        event.preventDefault();
        const current = items.indexOf(document.activeElement as HTMLElement);
        const next = trapTabIndex(items.length, current, event.shiftKey);
        if (next !== null) items[next].focus();
        return;
      }

      const target = keyToFocusIndex(items.length, event.key);
      if (target !== null) {
        event.preventDefault();
        items[target].focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      // Kembalikan fokus ke pemicu saat dialog ditutup/dilepas.
      restoreRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink-900/50"
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-desc`}
        onClick={(event) => event.stopPropagation()}
        className="rpg-panel mx-4 mt-[20vh] max-w-[480px] p-4 md:mx-auto"
      >
        <h2 id={`${id}-title`} className="text-[16px] font-bold text-ink-900">
          {title}
        </h2>
        <p id={`${id}-desc`} className="mt-2 text-[14px] leading-5 text-ink-700">
          {description}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rpg-btn h-12 flex-1 border-2 border-border-strong bg-surface text-[15px] font-bold text-ink-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rpg-btn h-12 flex-1 bg-danger text-[15px] font-bold text-white disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Menghapus…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
