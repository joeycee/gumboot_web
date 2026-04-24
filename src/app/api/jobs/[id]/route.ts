import { NextResponse } from "next/server";
import { requestJobDetails } from "@/lib/jobShare";

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

export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const requestUrl = new URL(_.url);
    const userId = requestUrl.searchParams.get("userId") || undefined;
    const response = await requestJobDetails(id, userId);

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
