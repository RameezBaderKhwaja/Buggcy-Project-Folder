import { type NextRequest, NextResponse } from "next/server"
import type { Request, Response } from "express"
import { app } from "@/app/backend/index"

type MockResponse = {
  statusCode: number
  headers: Record<string, string | string[]>
  body: string
  status: (code: number) => MockResponse
  json: (data: unknown) => MockResponse
  send: (data: unknown) => MockResponse
  setHeader: (name: string, value: string | string[]) => MockResponse
  removeHeader: (name: string) => MockResponse
  getHeader: (name: string) => string | string[] | undefined
  cookie: (name: string, value: string, options?: Record<string, unknown>) => MockResponse
  clearCookie: (name: string, options?: Record<string, unknown>) => MockResponse
  redirect: (url: string) => MockResponse
}

interface MockRequest {
  method: string
  url: string
  headers: Record<string, string | string[]>
  body: unknown
  query: Record<string, string>
  params: Record<string, string>
  cookies: Record<string, string>
  user?: unknown
  ip?: string
  get: (name: string) => string | undefined
}

async function handler(req: NextRequest) {
  return new Promise<NextResponse>(async (resolve, reject) => {
    // Normalize headers to lowercase
    const normalizedHeaders = Object.fromEntries(
      Array.from(req.headers.entries()).map(([k, v]) => [k.toLowerCase(), v])
    );

    // Extract params from pathname if needed 
    const pathname = req.nextUrl ? req.nextUrl.pathname : req.url.replace(new URL(req.url).origin, "");
    // Example: /api/user/123 -> { id: "123" } for /api/user/[id]
    let params: Record<string, string> = {};
    const paramMatch = pathname.match(/\/(\w+)\/(\w+)/);
    if (paramMatch) {
      params = { [paramMatch[1]]: paramMatch[2] };
    }

    const mockRes: MockResponse = {
      statusCode: 200,
      headers: {},
      body: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = JSON.stringify(data);
        this.headers["Content-Type"] = "application/json";
        // Handle Set-Cookie as array for NextResponse
        const response = new NextResponse(this.body, {
          status: this.statusCode,
        });
        Object.entries(this.headers).forEach(([key, value]) => {
          if (key === "Set-Cookie" && Array.isArray(value)) {
            value.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
          } else if (typeof value === "string") {
            response.headers.set(key, value);
          }
        });
        resolve(response);
        return this;
      },
      send(data) {
        this.body = typeof data === "string" ? data : JSON.stringify(data);
        // Handle Set-Cookie as array for NextResponse
        const response = new NextResponse(this.body, {
          status: this.statusCode,
        });
        Object.entries(this.headers).forEach(([key, value]) => {
          if (key === "Set-Cookie" && Array.isArray(value)) {
            value.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
          } else if (typeof value === "string") {
            response.headers.set(key, value);
          }
        });
        resolve(response);
        return this;
      },
      setHeader(name, value) {
        // Support multi-value headers 
        if (name.toLowerCase() === "set-cookie") {
          if (!Array.isArray(this.headers["Set-Cookie"])) this.headers["Set-Cookie"] = [];
          if (Array.isArray(value)) {
            (this.headers["Set-Cookie"] as string[]).push(...value);
          } else {
            (this.headers["Set-Cookie"] as string[]).push(value);
          }
        } else {
          this.headers[name] = value;
        }
        return this;
      },
      removeHeader(name) {
        delete this.headers[name];
        return this;
      },
      getHeader(name) {
        return this.headers[name];
      },
      cookie(name, value, options = {}) {
        const cookieString = `${name}=${value}; Path=${options.path || "/"}; ${options.httpOnly ? "HttpOnly; " : ""}${options.secure ? "Secure; " : ""}${options.sameSite ? `SameSite=${options.sameSite}; ` : ""}${options.maxAge ? `Max-Age=${options.maxAge}; ` : ""}`;
        if (!Array.isArray(this.headers["Set-Cookie"])) this.headers["Set-Cookie"] = [];
        (this.headers["Set-Cookie"] as string[]).push(cookieString);
        return this;
      },
      clearCookie(name, options = {}) {
        const cookieString = `${name}=; Path=${options.path || "/"}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${options.httpOnly ? "HttpOnly; " : ""}${options.secure ? "Secure; " : ""}`;
        if (!Array.isArray(this.headers["Set-Cookie"])) this.headers["Set-Cookie"] = [];
        (this.headers["Set-Cookie"] as string[]).push(cookieString);
        return this;
      },
      redirect(url) {
        resolve(NextResponse.redirect(new URL(url, req.url)));
        return this;
      },
    };

    const mockReq: MockRequest = {
      method: req.method,
      url: pathname.replace("/api", ""),
      headers: normalizedHeaders,
      body: {},
      query: Object.fromEntries(new URL(req.url).searchParams.entries()),
      params,
      cookies: Object.fromEntries(
        (normalizedHeaders["cookie"] || "")
          .split(";")
          .filter(Boolean)
          .map((cookie: string) => {
            const [name, ...rest] = cookie.trim().split("=");
            return [name, rest.join("=")];
          })
      ),
      user: undefined,
      ip: normalizedHeaders["x-forwarded-for"] || normalizedHeaders["x-real-ip"] || "unknown",
      get(name) {
        return this.headers[name.toLowerCase()] as string;
      },
    };

    const handle = () => {
      try {
        app(mockReq as Request, mockRes as unknown as Response, (err: unknown) => {
          if (err) {
            console.error("Express error:", err);
            reject(err);
          } else {
            console.warn("No route matched for", mockReq.url);
            resolve(new NextResponse("Not Found", { status: 404 }));
          }
        });
      } catch (err) {
        console.error("Handler crashed:", err);
        resolve(new NextResponse("Internal Server Error", { status: 500 }));
      }
    };

    // Improved body parsing
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      const contentType = normalizedHeaders["content-type"] || "";
      if (contentType.includes("application/json")) {
        try {
          mockReq.body = await req.json();
        } catch {
          mockReq.body = {};
        }
        handle();
      } else if (contentType.includes("text/plain")) {
        try {
          mockReq.body = await req.text();
        } catch {
          mockReq.body = {};
        }
        handle();
      } else if (contentType.includes("form")) {
        try {
          mockReq.body = Object.fromEntries(await req.formData());
        } catch {
          mockReq.body = {};
        }
        handle();
      } else {
        mockReq.body = {};
        handle();
      }
    } else {
      handle();
    }
  });
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH }
