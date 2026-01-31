/**
 * Better Auth HTTP Adapter
 *
 * Converts Node.js IncomingMessage/ServerResponse to Fetch API Request/Response
 * Pattern from: https://dev.to/danimydev/authentication-with-nodehttp-and-better-auth-2l2g
 */

import type { IncomingMessage, ServerResponse } from "node:http"
import { auth } from "../auth.js"

/**
 * Convert Node.js IncomingMessage to Fetch API Request
 */
async function incomingMessageToRequest(
  incomingMessage: IncomingMessage,
  baseUrl: URL
): Promise<Request> {
  const method = incomingMessage.method || "GET"
  const url = new URL(incomingMessage.url || "/", baseUrl)

  const headers = new Headers()
  for (const [key, value] of Object.entries(incomingMessage.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value)
    }
  }

  // Convert IncomingMessage to ReadableStream for body
  let body: BodyInit | null = null
  if (method !== "GET" && method !== "HEAD") {
    const chunks: Buffer[] = []
    for await (const chunk of incomingMessage) {
      chunks.push(chunk)
    }
    body = Buffer.concat(chunks)
  }

  return new Request(url.toString(), { method, headers, body })
}

/**
 * Better Auth handler for node:http integration
 */
export async function betterAuthHandler(
  incomingMessage: IncomingMessage,
  serverResponse: ServerResponse
): Promise<void> {
  const baseUrl = new URL(
    process.env.BETTER_AUTH_URL || "http://localhost:4000"
  )
  const request = await incomingMessageToRequest(incomingMessage, baseUrl)

  const response = await auth.handler(request)

  serverResponse.statusCode = response.status

  response.headers.forEach((value, key) => {
    serverResponse.setHeader(key, value)
  })

  if (response.body) {
    const reader = response.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      serverResponse.write(value)
    }
  }

  serverResponse.end()
}
