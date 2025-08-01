import { type NextRequest, NextResponse } from "next/server"
import type { Request, Response } from "express"
import { app } from "@/app/backend"

<<<<<<< HEAD
type MockResponse = {
=======
interface MockResponse extends Partial<Response> {
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
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

<<<<<<< HEAD
interface MockRequest {
=======
interface MockRequest extends Partial<Request> {
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
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

<<<<<<< HEAD
async function handler(req: NextRequest) {
  return new Promise<NextResponse>((resolve, reject) => {
=======
// Convert Express app to handle Next.js API routes
async function handler(req: NextRequest) {
  return new Promise<NextResponse>((resolve, reject) => {
    // Create a mock response object that Express can work with
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
    const mockRes: MockResponse = {
      statusCode: 200,
      headers: {},
      body: "",
      status(code) {
        this.statusCode = code
        return this
      },
<<<<<<< HEAD
      json(data) {
=======
      json: function (data: unknown) {
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
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
<<<<<<< HEAD
      send(data) {
=======
      send: function (data: unknown) {
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
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
<<<<<<< HEAD
      cookie(name, value, options = {}) {
=======
      cookie: function (name: string, value: string, options: Record<string, unknown> = {}) {
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
        const cookieString = `${name}=${value}; Path=${options.path || "/"}; ${options.httpOnly ? "HttpOnly; " : ""}${options.secure ? "Secure; " : ""}${options.sameSite ? `SameSite=${options.sameSite}; ` : ""}${options.maxAge ? `Max-Age=${options.maxAge}; ` : ""}`
        this.headers["Set-Cookie"] = cookieString
        return this
      },
<<<<<<< HEAD
      clearCookie(name, options = {}) {
=======
      clearCookie: function (name: string, options: Record<string, unknown> = {}) {
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
        const cookieString = `${name}=; Path=${options.path || "/"}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${options.httpOnly ? "HttpOnly; " : ""}${options.secure ? "Secure; " : ""}`
        this.headers["Set-Cookie"] = cookieString
        return this
      },
      redirect(url) {
        resolve(NextResponse.redirect(new URL(url, req.url)))
        return this
      },
    }

<<<<<<< HEAD
=======
    // Create a mock request object
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
    const mockReq: MockRequest = {
      method: req.method,
      url: req.url.replace(new URL(req.url).origin, "").replace("/api", ""),
      headers: Object.fromEntries(req.headers.entries()),
<<<<<<< HEAD
      body: undefined,
=======
      body: undefined as unknown,
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
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
<<<<<<< HEAD
      get(name) {
=======
      get: function(name: string) {
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
        return this.headers[name.toLowerCase()]
      },
    }

<<<<<<< HEAD
    const handle = () =>
      app(mockReq as Request, mockRes as unknown as Response, (err: unknown) => {
=======
    // Handle request body for POST/PUT requests
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      req
        .json()
        .then((body) => {
          mockReq.body = body
          // Pass to Express app
          app(mockReq as Request, mockRes as Response, (err: unknown) => {
            if (err) {
              reject(err)
            } else {
              resolve(new NextResponse("Not Found", { status: 404 }))
            }
          })
        })
        .catch((err) => {
          mockReq.body = {}
          app(mockReq as Request, mockRes as Response, (err: unknown) => {
            if (err) {
              reject(err)
            } else {
              resolve(new NextResponse("Not Found", { status: 404 }))
            }
          })
        })
    } else {
      // Pass to Express app
      app(mockReq as Request, mockRes as Response, (err: unknown) => {
>>>>>>> afd9a5d4366b9dde9da7ba6eed1080cf8b0f9b20
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
