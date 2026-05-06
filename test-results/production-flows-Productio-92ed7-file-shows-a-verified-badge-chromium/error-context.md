# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production-flows.spec.ts >> Production Flow Smoke Tests >> worker public profile shows a verified badge
- Location: tests/e2e/production-flows.spec.ts:189:7

# Error details

```
Error: apiRequestContext.fetch: connect ECONNREFUSED 127.0.0.1:3001
Call log:
  - → GET http://127.0.0.1:3001/api/e2e-backend/profile
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.7727.15 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - Authorization: Bearer worker_test_token_123

```

# Test source

```ts
  1   | import { expect, type APIRequestContext, type Page } from "@playwright/test";
  2   | 
  3   | type ApiEnvelope<T> = {
  4   |   success?: boolean;
  5   |   code?: number;
  6   |   message?: string;
  7   |   body?: T;
  8   | };
  9   | 
  10  | type UnknownRecord = Record<string, unknown>;
  11  | 
  12  | type AccountKey = "owner" | "worker";
  13  | 
  14  | export type TestAccount = {
  15  |   key: AccountKey;
  16  |   phone: string;
  17  |   countryCode: string;
  18  |   otp?: string;
  19  |   token?: string;
  20  | };
  21  | 
  22  | export type SessionInfo = {
  23  |   token: string;
  24  |   userId: string;
  25  | };
  26  | 
  27  | export type CreatedJob = {
  28  |   id: string;
  29  |   title: string;
  30  | };
  31  | 
  32  | function requiredEnv(name: string) {
  33  |   const value = process.env[name]?.trim();
  34  |   if (!value) {
  35  |     throw new Error(`Missing required environment variable: ${name}`);
  36  |   }
  37  |   return value;
  38  | }
  39  | 
  40  | export function getApiBaseUrl() {
  41  |   return (
  42  |     process.env.PLAYWRIGHT_API_BASE_URL?.trim() ||
  43  |     process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  44  |     requiredEnv("NEXT_PUBLIC_API_BASE_URL")
  45  |   );
  46  | }
  47  | 
  48  | export function getAccount(key: AccountKey): TestAccount {
  49  |   const upper = key.toUpperCase();
  50  |   return {
  51  |     key,
  52  |     phone: requiredEnv(`PLAYWRIGHT_${upper}_PHONE`),
  53  |     countryCode: process.env[`PLAYWRIGHT_${upper}_COUNTRY_CODE`]?.trim() || "+64",
  54  |     otp: process.env[`PLAYWRIGHT_${upper}_OTP`]?.trim() || undefined,
  55  |     token: process.env[`PLAYWRIGHT_${upper}_TOKEN`]?.trim() || undefined,
  56  |   };
  57  | }
  58  | 
  59  | export function getTestAddress() {
  60  |   return {
  61  |     address: requiredEnv("PLAYWRIGHT_TEST_ADDRESS"),
  62  |     lat: Number(requiredEnv("PLAYWRIGHT_TEST_LAT")),
  63  |     lng: Number(requiredEnv("PLAYWRIGHT_TEST_LNG")),
  64  |   };
  65  | }
  66  | 
  67  | export function uniqueJobTitle(prefix: string) {
  68  |   return `${prefix} ${new Date().toISOString().replace(/[:.]/g, "-")}`;
  69  | }
  70  | 
  71  | async function parseJson<T>(response: Awaited<ReturnType<APIRequestContext["get"]>>) {
  72  |   const text = await response.text();
  73  |   let parsed: T | UnknownRecord;
  74  |   try {
  75  |     parsed = JSON.parse(text) as T;
  76  |   } catch {
  77  |     throw new Error(`Expected JSON response but received: ${text.slice(0, 300)}`);
  78  |   }
  79  |   return parsed;
  80  | }
  81  | 
  82  | async function apiRequest<T>(
  83  |   request: APIRequestContext,
  84  |   path: string,
  85  |   options: {
  86  |     method?: "GET" | "POST" | "DELETE";
  87  |     token?: string;
  88  |     data?: UnknownRecord;
  89  |     multipart?: Record<string, string | number | boolean | { name: string; mimeType: string; buffer: Buffer }>;
  90  |   } = {}
  91  | ) {
  92  |   const url = `${getApiBaseUrl()}${path}`;
> 93  |   const response = await request.fetch(url, {
      |                                  ^ Error: apiRequestContext.fetch: connect ECONNREFUSED 127.0.0.1:3001
  94  |     method: options.method ?? "GET",
  95  |     headers: {
  96  |       ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
  97  |     },
  98  |     data: options.data,
  99  |     multipart: options.multipart,
  100 |   });
  101 | 
  102 |   const parsed = await parseJson<ApiEnvelope<T> | UnknownRecord>(response);
  103 |   const envelope = parsed as ApiEnvelope<T>;
  104 |   if (!response.ok || envelope.success === false) {
  105 |     const message =
  106 |       (parsed as { message?: string }).message ||
  107 |       `API request failed: ${options.method ?? "GET"} ${path} (${response.status()})`;
  108 |     throw new Error(message);
  109 |   }
  110 | 
  111 |   return envelope;
  112 | }
  113 | 
  114 | function normalizeServiceSid(payload: UnknownRecord | ApiEnvelope<unknown>) {
  115 |   const body = ((payload as ApiEnvelope<UnknownRecord>).body ?? payload) as UnknownRecord;
  116 |   return (
  117 |     (typeof body.serviceSid === "string" && body.serviceSid) ||
  118 |     (typeof body.service_sid === "string" && body.service_sid) ||
  119 |     process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_SID ||
  120 |     ""
  121 |   );
  122 | }
  123 | 
  124 | function normalizeOtp(payload: UnknownRecord | ApiEnvelope<unknown>) {
  125 |   const body = ((payload as ApiEnvelope<UnknownRecord>).body ?? payload) as UnknownRecord;
  126 |   return (
  127 |     (typeof body.otp === "string" && body.otp) ||
  128 |     (typeof body.code === "string" && body.code) ||
  129 |     ""
  130 |   );
  131 | }
  132 | 
  133 | export async function loginViaUi(page: Page, account: TestAccount) {
  134 |   await page.goto("/auth/login");
  135 |   await page.getByTestId("login-country-code").fill(account.countryCode);
  136 |   await page.getByTestId("login-phone-number").fill(account.phone);
  137 |   await page.getByTestId("login-send-code").click();
  138 | 
  139 |   await page.waitForURL((url) => !url.pathname.endsWith("/auth/login"), { timeout: 15000 });
  140 |   if (!page.url().includes("/auth/verify-otp")) {
  141 |     return;
  142 |   }
  143 | 
  144 |   const otp = account.otp;
  145 |   if (!otp) {
  146 |     throw new Error(`No OTP available for ${account.key}. Set PLAYWRIGHT_${account.key.toUpperCase()}_OTP.`);
  147 |   }
  148 |   await page.getByTestId("otp-code-input").fill(otp);
  149 |   await page.getByTestId("otp-verify-button").click();
  150 |   await expect(page).not.toHaveURL(/\/auth\/verify-otp/);
  151 | }
  152 | 
  153 | export async function authenticateViaApi(request: APIRequestContext, account: TestAccount): Promise<SessionInfo> {
  154 |   if (account.token) {
  155 |     const profileEnvelope = await apiRequest<{
  156 |       profiledata?: {
  157 |         _id?: string;
  158 |       };
  159 |       userDetail?: {
  160 |         _id?: string;
  161 |       };
  162 |       _id?: string;
  163 |     }>(request, "/profile", {
  164 |       token: account.token,
  165 |     });
  166 | 
  167 |     const userId =
  168 |       profileEnvelope.body?.profiledata?._id ||
  169 |       profileEnvelope.body?.userDetail?._id ||
  170 |       profileEnvelope.body?._id ||
  171 |       "";
  172 |     if (!userId) {
  173 |       throw new Error(`Could not resolve user id from configured token for ${account.key}.`);
  174 |     }
  175 | 
  176 |     return { token: account.token, userId };
  177 |   }
  178 | 
  179 |   const loginEnvelope = await apiRequest<UnknownRecord>(request, "/Login", {
  180 |     method: "POST",
  181 |     data: {
  182 |       phone: account.phone,
  183 |       country_code: account.countryCode,
  184 |     },
  185 |   });
  186 | 
  187 |   const serviceSid = normalizeServiceSid(loginEnvelope);
  188 |   const otp = account.otp || normalizeOtp(loginEnvelope);
  189 |   if (!otp) {
  190 |     throw new Error(`No OTP available for ${account.key}. Set PLAYWRIGHT_${account.key.toUpperCase()}_OTP.`);
  191 |   }
  192 | 
  193 |   const verifyEnvelope = await apiRequest<{
```