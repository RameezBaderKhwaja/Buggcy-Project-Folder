import { type NextRequest, NextResponse } from "next/server"
import type { Request, Response } from "express"
import { app } from "@/app/backend"

type MockResponse = {
  statusCode: number
  headers: Record<string, string>
  body: string
  status: (code: number) => MockResponse
  json: (data: unknown) => MockResponse
  send: (data: unknown) => MockResponse
  setHeader: (name: string, value: string) => MockResponse
  cookie: (name: string, value: string, options?: Record<string, unknown>) => MockResponse
  clearCookie: (name: string, options?: Record<string, unknown>) => MockResponse
  redirect: (url: string) => MockResponse
}

interface MockRequest {
  method: string
  url: string
  headers: Record<string, string>
  body: unknown
  query: Record<string, string>
  params: Record<string, string>
  cookies: Record<string, string>
  user?: unknown
  ip?: string
  get: (name: string) => string | undefined
}

async function handler(req: NextRequest) {
  return new Promise<NextResponse>((resolve, reject) => {
    const mockRes: MockResponse = {
      statusCode: 200,
      headers: {},
      body: "",
      status(code) {
        this.statusCode = code
        return this
      },
      json(data) {
        this.body = JSON.stringify(data)
        this.headers["Content-Type"] = "application/json"
        resolve(
          new NextResponse(this.body, {
            status: this.statusCode,
            headers: this.headers,
          }),
        )
        return this
      },
      send(data) {
        this.body = typeof data === "string" ? data : JSON.stringify(data)
        resolve(
          new NextResponse(this.body, {
            status: this.statusCode,
            headers: this.headers,
          }),
        )
        return this
      },
      setHeader(name, value) {
        this.headers[name] = value
        return this
      },
      cookie(name, value, options = {}) {
        const cookieString = `${name}=${value}; Path=${options.path || "/"}; ${options.httpOnly ? "HttpOnly; " : ""}${options.secure ? "Secure; " : ""}${options.sameSite ? `SameSite=${options.sameSite}; ` : ""}${options.maxAge ? `Max-Age=${options.maxAge}; ` : ""}`
        this.headers["Set-Cookie"] = cookieString
        return this
      },
      clearCookie(name, options = {}) {
        const cookieString = `${name}=; Path=${options.path || "/"}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${options.httpOnly ? "HttpOnly; " : ""}${options.secure ? "Secure; " : ""}`
        this.headers["Set-Cookie"] = cookieString
        return this
      },
      redirect(url) {
        resolve(NextResponse.redirect(new URL(url, req.url)))
        return this
      },
    }

    const mockReq: MockRequest = {
      method: req.method,
      url: req.url.replace(new URL(req.url).origin, "").replace("/api", ""),
      headers: Object.fromEntries(req.headers.entries()),
      body: undefined,
      query: Object.fromEntries(new URL(req.url).searchParams.entries()),
      params: {},
      cookies: Object.fromEntries(
        req.headers
          .get("cookie")
          ?.split(";")
          .map((cookie) => {
            const [name, value] = cookie.trim().split("=")
            return [name, value]
          }) || [],
      ),
      user: undefined,
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      get(name) {
        return this.headers[name.toLowerCase()]
      },
    }

    const handle = () =>
      app(mockReq as Request, mockRes as unknown as Response, (err: unknown) => {
        if (err) {
          reject(err)
        } else {
          resolve(new NextResponse("Not Found", { status: 404 }))
        }
      })

    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      req
        .json()
        .then((body) => {
          mockReq.body = body
          handle()
        })
        .catch(() => {
          mockReq.body = {}
          handle()
        })
    } else {
      handle()
    }
  })
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH }
