const GENERATION_POLL_DELAY_MS = 2500;
const GENERATION_POLL_ATTEMPTS = 36;

function isGenerationInProgress(response: Response) {
  return (
    response.status === 409 &&
    response.headers.get("X-Sarita-Generation-Status") === "generating"
  );
}

function waitForGeneration(signal?: AbortSignal | null) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, GENERATION_POLL_DELAY_MS);

    if (!signal) return;

    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export async function fetchAiReadingWithPolling(
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<Response> {
  let response: Response | null = null;

  for (let attempt = 0; attempt < GENERATION_POLL_ATTEMPTS; attempt += 1) {
    response = await fetch(input, init);

    if (!isGenerationInProgress(response)) {
      return response;
    }

    await waitForGeneration(init.signal);
  }

  if (!response) {
    throw new Error("AI reading request did not start.");
  }

  return response;
}
