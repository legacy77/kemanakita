import "./sentry.client.config";
import { captureRouterTransitionStart } from "@sentry/nextjs";

export const onRouterTransitionStart = captureRouterTransitionStart;
