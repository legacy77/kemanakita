export const WHATSAPP_TITLE_MAX_LENGTH = 200;

export function truncateWhatsAppTitle(title: string): string {
  return Array.from(title).slice(0, WHATSAPP_TITLE_MAX_LENGTH).join("");
}

export function buildShareMessage(title: string, url: string): string {
  return `Yuk gabung ke trip “${title}” di KemanaKita: ${url}`;
}
