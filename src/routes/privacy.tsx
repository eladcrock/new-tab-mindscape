import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · Focal Lens" },
      { name: "description", content: "How Focal Lens collects, stores, and protects your data." },
      { property: "og:title", content: "Privacy Policy · Focal Lens" },
      { property: "og:description", content: "Plain-English summary of what data Focal Lens stores and how it's protected." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mt-1">Last updated: April 26, 2026</p>

        <section className="prose prose-sm dark:prose-invert max-w-none mt-8 space-y-6">
          <p>
            Focal Lens is a personal reflection companion. This policy explains, in plain
            English, what we collect, why, and the controls you have. By using the app you
            agree to this policy.
          </p>

          <h2>1. What we store</h2>
          <ul>
            <li>
              <strong>Account info</strong> — your email address and (when you sign in with
              Google) your name and profile picture, supplied by your identity provider.
            </li>
            <li>
              <strong>Your content</strong> — goals, lenses, reflections (questions and
              answers you write), chat conversations with the agent, and the durable
              insights the agent extracts about you.
            </li>
            <li>
              <strong>Operational metadata</strong> — timestamps, row IDs, and standard web
              server logs (IP address, user agent) for security and abuse prevention.
            </li>
          </ul>
          <p>
            We do <strong>not</strong> collect analytics events, build advertising profiles,
            or sell your data. We do not use your reflections to train any third-party AI
            model.
          </p>

          <h2>2. How your data is used</h2>
          <ul>
            <li>To render your goals, lenses, reflections, chats, and insights to you.</li>
            <li>
              To send a redacted snapshot of your <em>active</em> goals, recent reflections,
              and prior insights as in-context grounding when the agent generates a question
              or chat reply. This snapshot is sent to the AI Gateway only at the moment of
              the request; it is not retained by the gateway for training.
            </li>
            <li>
              To extract durable insights about you (working style, struggles, suggested
              next actions) so future questions are more personal.
            </li>
          </ul>

          <h2>3. Where it lives</h2>
          <p>
            Your data is stored in our managed backend (powered by Lovable Cloud /
            Supabase). Every table uses row-level security policies that scope reads and
            writes to your own user ID. Server functions and the chat streaming endpoint
            verify your session token before doing anything that touches your data or our
            AI credits.
          </p>

          <h2>4. AI processing</h2>
          <p>
            Chat messages, reflection answers, and the context blocks above are sent to the
            Lovable AI Gateway, which forwards them to a large-language-model provider
            (currently Google Gemini). We do not retain prompts or completions outside of
            what is required to display the conversation back to you and to store extracted
            insights in your account.
          </p>

          <h2>5. Authentication & session security</h2>
          <ul>
            <li>Sign-in is handled by Google OAuth or email/password via our auth provider.</li>
            <li>Sessions are stored in your browser's local storage as a short-lived JWT.</li>
            <li>Every privileged endpoint requires a valid session token.</li>
            <li>
              The app sends standard hardening headers (Content-Security-Policy,
              X-Content-Type-Options, X-Frame-Options, Referrer-Policy) on all responses.
            </li>
          </ul>

          <h2>6. Your rights</h2>
          <ul>
            <li>
              <strong>Export</strong> — request a copy of everything we have on you by
              emailing us (see contact below).
            </li>
            <li>
              <strong>Delete</strong> — you can delete individual goals, lenses,
              reflections, conversations, and insights from inside the app at any time.
            </li>
            <li>
              <strong>Account deletion</strong> — request full account and data deletion
              by email. We will erase your row-level data within 30 days.
            </li>
          </ul>

          <h2>7. Children</h2>
          <p>Focal Lens is not directed to children under 13 and we do not knowingly collect their data.</p>

          <h2>8. Changes</h2>
          <p>
            If we materially change this policy we'll update the date above and, where
            reasonable, notify you in-app.
          </p>

          <h2>9. Contact</h2>
          <p>
            Questions or data requests: reach out via the support channel for this
            deployment. For Lovable-hosted instances, contact{" "}
            <a href="mailto:support@lovable.dev">support@lovable.dev</a>.
          </p>
        </section>

        <div className="mt-10 flex gap-4 text-sm">
          <Link to="/" className="text-primary underline-offset-4 hover:underline">← Back to app</Link>
          <Link to="/credits" className="text-primary underline-offset-4 hover:underline">Credits & attribution</Link>
        </div>
      </main>
    </div>
  );
}
