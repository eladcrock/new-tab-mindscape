// Helper that consumes a TanStack Start server function returning a streaming Response,
// and parses the OpenAI-style SSE token-by-token.
//
// Usage:
//   await streamServerFn(() => chatStream({ data: {...} }), {
//     onDelta: (s) => setText((t) => t + s),
//     onDone: () => save(),
//   });

type Opts = {
  onDelta: (chunk: string) => void;
  onDone?: () => void;
};

export async function streamServerFn(
  invoke: () => Promise<Response>,
  { onDelta, onDone }: Opts,
) {
  const res = await invoke();
  if (!res.body) throw new Error("No stream body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { value, done: d } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line || line.startsWith(":")) continue;
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) onDelta(delta);
      } catch {
        // partial JSON — put it back and wait
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone?.();
}
