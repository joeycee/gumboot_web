import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type BackendEnvelope = {
  success?: boolean;
  code?: number;
  message?: string;
  body?: unknown;
};

function getBackendBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!value) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }
  return value;
}

function requestJobDetails(baseUrl: string, payload: { jobId: string }) {
  const url = new URL("/api/job_details", baseUrl);
  const body = JSON.stringify(payload);
  const transport = url.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise<{ statusCode: number; body: string; contentType: string | undefined }>((resolve, reject) => {
    const req = transport(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 500,
            body: Buffer.concat(chunks).toString("utf8"),
            contentType: typeof res.headers["content-type"] === "string" ? res.headers["content-type"] : undefined,
          });
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const response = await requestJobDetails(getBackendBaseUrl(), { jobId: id });

    let parsed: BackendEnvelope | { raw: string };
    try {
      parsed = JSON.parse(response.body) as BackendEnvelope;
    } catch {
      parsed = { raw: response.body };
    }

    return NextResponse.json(parsed, {
      status: response.statusCode,
      headers: response.contentType ? { "content-type": response.contentType } : undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Job details proxy failed";
    return NextResponse.json(
      {
        success: false,
        code: 500,
        message,
        body: {},
      },
      { status: 500 }
    );
  }
}
