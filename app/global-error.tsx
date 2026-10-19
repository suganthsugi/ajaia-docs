"use client";

// Replaces the root layout when it fails, so it brings its own <html> and plain styles.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", paddingTop: "6rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ color: "#666" }}>Ajaia Docs couldn&apos;t load. Please try again.</p>
        <button
          onClick={reset}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: 6, border: "1px solid #ccc" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
