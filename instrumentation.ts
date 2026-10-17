import * as Sentry from "@sentry/nextjs";

/**
 * Close codes considered benign for Supabase Realtime.
 * `WS_CLOSE_NORMAL` (1000) is the only code the installed `@supabase/realtime-js`
 * defines (`src/lib/constants.ts`); any other code, including 1011, is reported.
 */
const BENIGN_SOCKET_CLOSE_CODES = ["1000"];

/**
 * `@supabase/realtime-js` throws `socket closed: ${obj.code}${detail}`
 * (`src/lib/normalizeChannelError.ts`). Only a benign close code is dropped;
 * a message-prefix match alone would also hide genuine failures such as 1011.
 */
function isBenignSocketClose(event: Sentry.ErrorEvent): boolean {
  const exception = event.exception?.values?.[0];
  const message = [event.message, exception?.value].filter((v) => typeof v === "string" && v.length > 0).join(" ");
  const match = /^socket closed:\s*(\d{3,4})/i.exec(message.trim());
  if (!match) return false;
  return BENIGN_SOCKET_CLOSE_CODES.includes(match[1]);
}

/**
 * The invite code (`/join?code=<code>`) is a join capability, not just an identifier.
 * Redact the value while keeping the parameter name and the rest of the string intact.
 */
const CODE_PARAM_PATTERN = /([?&;"'\s]|^)(code=)([^&#;"'\s)\]}]+)/gi;
const REDACTED = "$1$2[Filtered]";

function scrubString(value: string): string {
  return value.replace(CODE_PARAM_PATTERN, REDACTED);
}

function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.message) event.message = scrubString(event.message);

  if (event.logentry?.message) event.logentry.message = scrubString(event.logentry.message);

  if (event.request?.url) event.request.url = scrubString(event.request.url);

  const query = event.request?.query_string;
  if (typeof query === "string") {
    event.request!.query_string = scrubString(query);
  } else if (Array.isArray(query)) {
    event.request!.query_string = query.map(([key, val]) =>
      (key.toLowerCase() === "code" ? [key, "[Filtered]"] : [key, val]) as [string, string],
    );
  } else if (query && typeof query === "object") {
    for (const key of Object.keys(query)) {
      if (key.toLowerCase() === "code") query[key] = "[Filtered]";
    }
  }

  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = scrubString(exception.value);
    for (const frame of exception.stacktrace?.frames ?? []) {
      if (frame.filename) frame.filename = scrubString(frame.filename);
      if (frame.abs_path) frame.abs_path = scrubString(frame.abs_path);
      if (frame.context_line) frame.context_line = scrubString(frame.context_line);
    }
  }

  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (breadcrumb.message) breadcrumb.message = scrubString(breadcrumb.message);
    const data = breadcrumb.data;
    if (data) {
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (typeof val === "string") data[key] = scrubString(val);
      }
    }
  }

  return event;
}

function scrubTransaction(event: Parameters<NonNullable<Parameters<typeof Sentry.init>[0]["beforeSendTransaction"]>>[0]): Parameters<NonNullable<Parameters<typeof Sentry.init>[0]["beforeSendTransaction"]>>[0] {
  if (event.request?.url) event.request.url = scrubString(event.request.url);

  for (const span of event.spans ?? []) {
    if (span.description) span.description = scrubString(span.description);
    const data = span.data as Record<string, unknown> | undefined;
    if (data) {
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (typeof val === "string") data[key] = scrubString(val);
      }
    }
  }

  return event;
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    const release = process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA;

    Sentry.init({
      dsn,
      ...(release ? { release } : {}),
      tracesSampleRate: 0.1,
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        urlQueryParams: false,
        httpBodies: [],
      },
      ignoreErrors: [/favicon\.ico/i],
      beforeSend(event) {
        if (isBenignSocketClose(event)) return null;
        return scrubEvent(event);
      },
      beforeSendTransaction(event) {
        return scrubTransaction(event);
      },
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
