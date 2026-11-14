import { API_BASE_URL, IS_DEMO_MODE } from "../config"
import { demoControls } from "../demo/controls"

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number | null = null,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface RequestOptions<T> extends Omit<RequestInit, "body"> {
  body?: BodyInit | Record<string, unknown>
  /** Responder used only in demo mode (no NEXT_PUBLIC_API_BASE_URL configured). */
  demo: () => T | null
}

/**
 * Single entry point for every backend call. In demo mode it resolves DEMO DATA locally;
 * otherwise it calls the Java backend at NEXT_PUBLIC_API_BASE_URL.
 */
export async function apiRequest<T>(path: string, { demo, body, headers, ...init }: RequestOptions<T>): Promise<T> {
  if (IS_DEMO_MODE) {
    const { latencyMs, simulateFailure } = demoControls.get()
    await delay(latencyMs)
    if (simulateFailure) {
      throw new ApiError("Simulated backend failure (demo control enabled in Settings).", 503)
    }
    const result = demo()
    if (result === null) throw new ApiError("Resource not found in demo dataset.", 404)
    return result
  }

  const isForm = typeof FormData !== "undefined" && body instanceof FormData
  const isJsonBody = body !== undefined && !isForm && typeof body === "object" && !(body instanceof Blob)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: isJsonBody ? JSON.stringify(body) : (body as BodyInit | undefined),
    })
  } catch {
    throw new ApiError(`Unable to reach backend at ${API_BASE_URL}.`)
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const data = await response.json()
      if (data?.message) message = data.message
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
