import { type NextRequest, NextResponse } from "next/server"
import { app } from "@/app/backend"

// Convert Express app to handle Next.js API routes
async function handler(req: NextRequest) {
  return new Promise<NextResponse>((resolve, reject) => {
    // Create a mock response object that Express can work with
    const mockRes = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      body: "",
      status: function (code: number) {
        this.statusCode = code
        return this
      },
      json: function (data: any) {
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
      send: function (data: any) {
        this.body = typeof data === "string" ? data : JSON.stringify(data)
        resolve(
          new NextResponse(this.body, {
            status: this.statusCode,
            headers: this.headers,
          }),
        )
        return this
      },
      setHeader: function (name: string, value: string) {
        this.headers[name] = value
        return this
      },
      cookie: function (name: string, value: string, options: any = {}) {
        const cookieString = `${name}=${value}; Path=${options.path || "/"}; ${options.httpOnly ? "HttpOnly; " : ""}${options.secure ? "Secure; " : ""}${options.sameSite ? `SameSite=${options.sameSite}; ` : ""}${options.maxAge ? `Max-Age=${options.maxAge}; ` : ""}`
        this.headers["Set-Cookie"] = cookieString
        return this
      },
      clearCookie: function (name: string, options: any = {}) {
        const cookieString = `${name}=; Path=${options.path || "/"}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${options.httpOnly ? "HttpOnly; " : ""}${options.secure ? "Secure; " : ""}`
        this.headers["Set-Cookie"] = cookieString
        return this
      },
      redirect: function (url: string) {
        resolve(NextResponse.redirect(new URL(url, req.url)))
        return this
      },
    }

    // Create a mock request object
    const mockReq = {
      method: req.method,
      url: req.url.replace(new URL(req.url).origin, "").replace("/api", ""),
      headers: Object.fromEntries(req.headers.entries()),
      body: undefined as any,
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
    }

    // Handle request body for POST/PUT requests
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      req
        .json()
        .then((body) => {
          mockReq.body = body
          // Pass to Express app
          app(mockReq as any, mockRes as any, (err: any) => {
            if (err) {
              reject(err)
            } else {
              resolve(new NextResponse("Not Found", { status: 404 }))
            }
          })
        })
        .catch((err) => {
          mockReq.body = {}
          app(mockReq as any, mockRes as any, (err: any) => {
            if (err) {
              reject(err)
            } else {
              resolve(new NextResponse("Not Found", { status: 404 }))
            }
          })
        })
    } else {
      // Pass to Express app
      app(mockReq as any, mockRes as any, (err: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(new NextResponse("Not Found", { status: 404 }))
        }
      })
    }
  })
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH }
