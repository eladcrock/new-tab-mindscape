import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Focal Lens — a thoughtful new tab" },
      { name: "description", content: "A new-tab companion that asks meaningful questions inspired by Jesse Schell's Deck of Lenses, paired with a fresh color palette every time." },
      { property: "og:title", content: "Focal Lens — a thoughtful new tab" },
      { property: "og:description", content: "A new-tab companion that asks meaningful questions inspired by Jesse Schell's Deck of Lenses, paired with a fresh color palette every time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      // Installable web app
      { name: "theme-color", content: "#0f0a1f" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Focal Lens" },
      // Baseline security headers (the ones that browsers honor via <meta>).
      // X-Frame-Options / X-Content-Type-Options must be set as real HTTP headers
      // by the hosting layer; these meta equivalents cover the in-document risks.
      { name: "referrer", content: "strict-origin-when-cross-origin" },
      {
        httpEquiv: "Content-Security-Policy",
        content:
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob: https:; " +
          "font-src 'self' data:; " +
          "connect-src 'self' https://*.supabase.co https://ai.gateway.lovable.dev wss://*.supabase.co; " +
          "frame-ancestors 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self';",
      },
      { name: "twitter:title", content: "Focal Lens — a thoughtful new tab" },
      { name: "twitter:description", content: "A new-tab companion that asks meaningful questions inspired by Jesse Schell's Deck of Lenses, paired with a fresh color palette every time." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8ac3b8b3-fa93-4caa-b389-9edbded92c1a/id-preview-8aebef71--f0e76f01-2bf2-43d0-a08b-455020dc5658.lovable.app-1777223278189.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8ac3b8b3-fa93-4caa-b389-9edbded92c1a/id-preview-8aebef71--f0e76f01-2bf2-43d0-a08b-455020dc5658.lovable.app-1777223278189.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
