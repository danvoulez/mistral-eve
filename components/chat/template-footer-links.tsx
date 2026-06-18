"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const EVE_URL = "https://vercel.com/eve";
const GITHUB_URL = "https://github.com/vercel-labs/eve-chat-template";
const COPY_PROMPT = `You are helping me bootstrap and deploy my own Eve chat agent from the Vercel Eve chat template.

Source template:
https://github.com/vercel-labs/eve-chat-template

Goal:
Fork or clone the template into a new project, set it up end-to-end, customize the agent if I ask, verify it locally, deploy it to Vercel, and run production migrations.

Use the repository README, docs/setup-and-deploy.md, and scripts/setup.sh as the source of truth. Prefer the one-shot setup script when possible:

1. Confirm prerequisites: Node.js 24+, pnpm/Corepack, Vercel CLI, a Vercel account/team, and authentication with vercel login.
2. Create/fork/clone a new project from vercel-labs/eve-chat-template.
3. Install dependencies with pnpm install.
4. Link the Vercel project with vercel link, using --scope <team-slug> if I provide one.
5. Run ./scripts/setup.sh, or ./scripts/setup.sh --scope <team-slug> if scoped. This should provision Neon Postgres, provision Upstash Redis, create/set BETTER_AUTH_SECRET, create or reuse the Sign in with Vercel OAuth app, set NEXT_PUBLIC_VERCEL_APP_CLIENT_ID and VERCEL_APP_CLIENT_SECRET, set BETTER_AUTH_URL for production when available, optionally configure the Notion connector, pull .env.local, and run local database migrations.
6. If any step requires browser/manual completion, pause and tell me exactly what to finish, then rerun the idempotent setup script.
7. Start the app locally with pnpm dev and verify the chat page loads, setup checks pass, sign-in works, and sending a message creates a chat.
8. Deploy to Vercel.
9. After the first production deploy, run production migrations with vercel env run -e production -- pnpm db:migrate.
10. Report the local URL, production URL, any secrets or dashboard steps I still need to complete, and any files you changed.

Do not print secrets in the final answer. Ask before deleting or overwriting any existing project files.`;
const DEPLOY_PRODUCTS = [
  {
    type: "integration",
    protocol: "storage",
    productSlug: "neon",
    integrationSlug: "neon",
  },
  {
    type: "integration",
    protocol: "storage",
    productSlug: "upstash-kv",
    integrationSlug: "upstash",
  },
] as const;
const DEPLOY_ENV_VARS = [
  "BETTER_AUTH_SECRET",
  "NEXT_PUBLIC_VERCEL_APP_CLIENT_ID",
  "VERCEL_APP_CLIENT_SECRET",
] as const;
const DEPLOY_URL = (() => {
  const params = new URLSearchParams([
    ["project-name", "eve-chat-template"],
    ["repository-name", "eve-chat-template"],
    ["repository-url", `${GITHUB_URL}/tree/main`],
    ["env", DEPLOY_ENV_VARS.join(",")],
    [
      "envDescription",
      "Neon provisions DATABASE_URL. Upstash Redis provisions rate-limit storage. Add Better Auth secret and Sign in with Vercel credentials. After deploy, run production migrations from the setup guide.",
    ],
    ["envLink", `${GITHUB_URL}/blob/main/docs/setup-and-deploy.md`],
    ["products", JSON.stringify(DEPLOY_PRODUCTS)],
  ]);

  return `https://vercel.com/new/clone?${params.toString()}`;
})();

export function TemplateFooterLinks() {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current === null) {
      return;
    }

    window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = null;
  }, []);

  const handleCopyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(COPY_PROMPT);
      clearResetTimer();
      setCopied(true);
      resetTimerRef.current = window.setTimeout(() => {
        resetTimerRef.current = null;
        setCopied(false);
      }, 1600);
    } catch {
      setCopied(false);
    }
  }, [clearResetTimer]);

  useEffect(() => clearResetTimer, [clearResetTimer]);

  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 px-2 text-center text-[11px] leading-4 text-muted-foreground/50 sm:text-xs">
      <span>
        Build your own chat agent with <FooterLink href={EVE_URL}>Eve</FooterLink>:
      </span>
      <span>
        <FooterLink href={GITHUB_URL}>View GitHub</FooterLink>,
      </span>
      <span>
        <FooterLink href={DEPLOY_URL}>Deploy</FooterLink>,
      </span>
      <button
        aria-label={copied ? "Copied setup prompt" : "Copy setup prompt"}
        className="inline-grid cursor-pointer appearance-none justify-items-start border-0 bg-transparent p-0 text-[inherit] leading-[inherit] font-[inherit] underline underline-offset-4 transition-colors hover:text-foreground"
        onClick={handleCopyPrompt}
        title={copied ? "Copied" : "Copy setup prompt"}
        type="button"
      >
        <span className="invisible col-start-1 row-start-1">Copy Prompt</span>
        <span className="col-start-1 row-start-1">
          {copied ? "Copied!" : "Copy Prompt"}
        </span>
      </button>
    </footer>
  );
}

function FooterLink({
  children,
  href,
}: {
  readonly children: ReactNode;
  readonly href: string;
}) {
  return (
    <a
      className="underline underline-offset-4 transition-colors hover:text-foreground"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}
