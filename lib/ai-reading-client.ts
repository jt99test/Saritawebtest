const GENERATION_POLL_DELAY_MS = 2500;
const GENERATION_POLL_ATTEMPTS = 36;
const GENERATION_FAILED_RETRY_ATTEMPTS = 2;
const TRANSIENT_ERROR_RETRY_ATTEMPTS = 2;

function isGenerationInProgress(response: Response) {
  return (
    response.status === 409 &&
    response.headers.get("X-Sarita-Generation-Status") === "generating"
  );
}

function isGenerationFailed(response: Response) {
  return (
    response.status === 422 &&
    response.headers.get("X-Sarita-Generation-Status") === "failed"
  );
}

function isTransientGenerationError(response: Response) {
  return response.status === 429 || response.status === 502 || response.status === 503 || response.status === 504;
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
  let failedRetries = 0;
  let transientRetries = 0;

  for (let attempt = 0; attempt < GENERATION_POLL_ATTEMPTS; attempt += 1) {
    response = await fetch(input, init);

    if (isGenerationFailed(response) && failedRetries < GENERATION_FAILED_RETRY_ATTEMPTS) {
      failedRetries += 1;
      await waitForGeneration(init.signal);
      continue;
    }

    if (isTransientGenerationError(response) && transientRetries < TRANSIENT_ERROR_RETRY_ATTEMPTS) {
      transientRetries += 1;
      await waitForGeneration(init.signal);
      continue;
    }

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
