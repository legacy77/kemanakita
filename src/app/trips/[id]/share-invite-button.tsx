"use client";

import { useToast } from "@/components/toast";
import { useRef, useState } from "react";
import { buildShareMessage, truncateWhatsAppTitle } from "@/lib/share";

interface ShareInviteButtonProps {
  inviteUrl: string;
  tripTitle: string;
  className?: string;
}

function copyFallback(text: string): boolean {
  const input = document.createElement("input");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  try {
    input.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    }
  } finally {
    input.remove();
  }
}

function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    try {
      return navigator.clipboard.writeText(text).then(() => true, () => false);
    } catch {
      return Promise.resolve(copyFallback(text));
    }
  }

  return Promise.resolve(copyFallback(text));
}

export function ShareInviteButton({ inviteUrl, tripTitle, className }: ShareInviteButtonProps) {
  const { pushToast } = useToast();
  const inFlight = useRef(false);
  const [isSharing, setIsSharing] = useState(false);
  const message = buildShareMessage(tripTitle, inviteUrl);

  function handleShare() {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsSharing(true);
    const reset = () => {
      inFlight.current = false;
      setIsSharing(false);
    };

    if (typeof navigator.share === "function") {
      try {
        navigator.share({ title: tripTitle, text: message, url: inviteUrl }).then(
          () => undefined,
          (error: unknown) => {
            if (!(error instanceof DOMException && error.name === "AbortError")) {
              pushToast("error", "Berbagi undangan gagal.");
            }
          },
        ).finally(reset);
      } catch {
        pushToast("error", "Berbagi undangan gagal.");
        reset();
      }
      return;
    }

    copyText(inviteUrl).then((copied) => {
      pushToast(copied ? "success" : "error", copied ? "Tautan undangan disalin." : "Tautan undangan gagal disalin.");
    }).finally(reset);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={isSharing}
      className={`${className ?? ""} disabled:opacity-60`}
      aria-label={`Bagikan undangan trip ${tripTitle}`}
    >
      🔗 Undang teman
    </button>
  );
}

export function WhatsAppInviteButton({ inviteUrl, tripTitle }: Omit<ShareInviteButtonProps, "className">) {
  // Batasi judul khusus WhatsApp agar URL tidak ditolak browser atau WhatsApp.
  const whatsappTitle = truncateWhatsAppTitle(tripTitle);
  const message = buildShareMessage(whatsappTitle, inviteUrl);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-11 items-center justify-center rounded-md border-2 border-action px-4 text-[14px] font-bold text-action hover:bg-sky-100"
      aria-label={`Bagikan undangan trip ${tripTitle} lewat WhatsApp`}
    >
      WhatsApp
    </a>
  );
}
