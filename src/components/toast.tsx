"use client";

// Toast provider + viewport (design_system §8.8): muncul dari atas di HP,
// kanan-bawah di desktop, hilang otomatis setelah 3 detik (TOAST_TTL_MS).
// Logika antrean murni ada di `@/lib/toast`; komponen ini hanya mengurus DOM.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  addToast,
  removeToast,
  TOAST_TTL_MS,
  type Toast,
  type ToastKind,
} from "@/lib/toast";

interface ToastContextValue {
  pushToast: (kind: ToastKind, message: string) => void;
  toasts: Toast[];
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Penghitung id agar unik walau dua toast dibuat di milidetik yang sama.
  const counter = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => removeToast(current, id));
  }, []);

  const pushToast = useCallback(
    (kind: ToastKind, message: string) => {
      const now = Date.now();
      const toast: Toast = { id: ++counter.current + now, kind, message, createdAt: now };
      setToasts((current) => {
        const next = addToast(current, toast);
        // Bersihkan timer toast yang terdorong keluar oleh cap MAX_TOASTS.
        for (const old of current) {
          if (!next.some((item) => item.id === old.id)) {
            const timer = timers.current.get(old.id);
            if (timer) clearTimeout(timer);
            timers.current.delete(old.id);
          }
        }
        return next;
      });
      // Auto-dismiss per-toast.
      timers.current.set(toast.id, setTimeout(() => dismiss(toast.id), TOAST_TTL_MS));
    },
    [dismiss],
  );

  // Bersihkan semua timer saat provider dilepas.
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ pushToast, toasts, dismiss }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast harus dipakai di dalam ToastProvider");
  return context;
}

// Warna per jenis status (design_system §8.8: ikon status + teks pendek).
const appearance: Record<ToastKind, { icon: string; className: string }> = {
  success: { icon: "✅", className: "bg-success-bg text-success border-success" },
  error: { icon: "⚠️", className: "bg-danger-bg text-danger border-danger" },
  info: { icon: "ℹ️", className: "bg-info-bg text-info border-info" },
};

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts?: Toast[];
  onDismiss?: (id: number) => void;
} = {}) {
  // Ambil dari context bila dipakai tanpa prop eksplisit.
  const context = useContext(ToastContext);
  const list = toasts ?? context?.toasts ?? [];
  const close = onDismiss ?? context?.dismiss ?? (() => {});

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-4 right-4 z-[60] flex flex-col gap-2 md:top-auto md:left-auto md:right-6 md:bottom-6 md:w-80"
    >
      {list.map((toast) => {
        const { icon, className } = appearance[toast.kind];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 text-[14px] leading-5 shadow-md ${className}`}
          >
            <span aria-hidden="true">{icon}</span>
            <p className="min-w-0 flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => close(toast.id)}
              aria-label="Tutup notifikasi"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-xl font-bold"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
