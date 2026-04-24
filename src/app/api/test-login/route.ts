import { NextResponse } from "next/server";
import { isE2ETestModeEnabled, isLocalHostname, matchE2ETestAccount } from "@/lib/e2eTestMode";
import { normalizeCountryCode, normalizePhoneNumber } from "@/lib/otp";

type RequestBody = {
  phone?: string;
  country_code?: string;
};

export async function POST(request: Request) {
  if (!isE2ETestModeEnabled()) {
    return NextResponse.json({ success: false, message: "Test mode is disabled." }, { status: 404 });
  }

  const requestUrl = new URL(request.url);
  if (!isLocalHostname(requestUrl.hostname)) {
    return NextResponse.json({ success: false, message: "Test login is only available on localhost." }, { status: 403 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const phone = normalizePhoneNumber(body.phone ?? "");
  const countryCode = normalizeCountryCode(body.country_code ?? "+64");
  const account = matchE2ETestAccount({ phone, countryCode });

  if (!account) {
    return NextResponse.json({ success: false, message: "No matching test account configured." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    body: {
      token: account.token,
      account: account.key,
    },
  });
}
