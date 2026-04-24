import { expect, type APIRequestContext, type Page } from "@playwright/test";

type ApiEnvelope<T> = {
  success?: boolean;
  code?: number;
  message?: string;
  body?: T;
};

type UnknownRecord = Record<string, unknown>;

type AccountKey = "owner" | "worker";

export type TestAccount = {
  key: AccountKey;
  phone: string;
  countryCode: string;
  otp?: string;
  token?: string;
};

export type SessionInfo = {
  token: string;
  userId: string;
};

export type CreatedJob = {
  id: string;
  title: string;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getApiBaseUrl() {
  return (
    process.env.PLAYWRIGHT_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    requiredEnv("NEXT_PUBLIC_API_BASE_URL")
  );
}

export function getAccount(key: AccountKey): TestAccount {
  const upper = key.toUpperCase();
  return {
    key,
    phone: requiredEnv(`PLAYWRIGHT_${upper}_PHONE`),
    countryCode: process.env[`PLAYWRIGHT_${upper}_COUNTRY_CODE`]?.trim() || "+64",
    otp: process.env[`PLAYWRIGHT_${upper}_OTP`]?.trim() || undefined,
    token: process.env[`PLAYWRIGHT_${upper}_TOKEN`]?.trim() || undefined,
  };
}

export function getTestAddress() {
  return {
    address: requiredEnv("PLAYWRIGHT_TEST_ADDRESS"),
    lat: Number(requiredEnv("PLAYWRIGHT_TEST_LAT")),
    lng: Number(requiredEnv("PLAYWRIGHT_TEST_LNG")),
  };
}

export function uniqueJobTitle(prefix: string) {
  return `${prefix} ${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

async function parseJson<T>(response: Awaited<ReturnType<APIRequestContext["get"]>>) {
  const text = await response.text();
  let parsed: T | UnknownRecord;
  try {
    parsed = JSON.parse(text) as T;
  } catch {
    throw new Error(`Expected JSON response but received: ${text.slice(0, 300)}`);
  }
  return parsed;
}

async function apiRequest<T>(
  request: APIRequestContext,
  path: string,
  options: {
    method?: "GET" | "POST" | "DELETE";
    token?: string;
    data?: UnknownRecord;
    multipart?: Record<string, string | number | boolean | { name: string; mimeType: string; buffer: Buffer }>;
  } = {}
) {
  const url = `${getApiBaseUrl()}${path}`;
  const response = await request.fetch(url, {
    method: options.method ?? "GET",
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    data: options.data,
    multipart: options.multipart,
  });

  const parsed = await parseJson<ApiEnvelope<T> | UnknownRecord>(response);
  const envelope = parsed as ApiEnvelope<T>;
  if (!response.ok || envelope.success === false) {
    const message =
      (parsed as { message?: string }).message ||
      `API request failed: ${options.method ?? "GET"} ${path} (${response.status()})`;
    throw new Error(message);
  }

  return envelope;
}

function normalizeServiceSid(payload: UnknownRecord | ApiEnvelope<unknown>) {
  const body = ((payload as ApiEnvelope<UnknownRecord>).body ?? payload) as UnknownRecord;
  return (
    (typeof body.serviceSid === "string" && body.serviceSid) ||
    (typeof body.service_sid === "string" && body.service_sid) ||
    process.env.NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_SID ||
    ""
  );
}

function normalizeOtp(payload: UnknownRecord | ApiEnvelope<unknown>) {
  const body = ((payload as ApiEnvelope<UnknownRecord>).body ?? payload) as UnknownRecord;
  return (
    (typeof body.otp === "string" && body.otp) ||
    (typeof body.code === "string" && body.code) ||
    ""
  );
}

export async function loginViaUi(page: Page, account: TestAccount) {
  await page.goto("/auth/login");
  await page.getByTestId("login-country-code").fill(account.countryCode);
  await page.getByTestId("login-phone-number").fill(account.phone);
  await page.getByTestId("login-send-code").click();

  await page.waitForURL((url) => !url.pathname.endsWith("/auth/login"), { timeout: 15000 });
  if (!page.url().includes("/auth/verify-otp")) {
    return;
  }

  const otp = account.otp;
  if (!otp) {
    throw new Error(`No OTP available for ${account.key}. Set PLAYWRIGHT_${account.key.toUpperCase()}_OTP.`);
  }
  await page.getByTestId("otp-code-input").fill(otp);
  await page.getByTestId("otp-verify-button").click();
  await expect(page).not.toHaveURL(/\/auth\/verify-otp/);
}

export async function authenticateViaApi(request: APIRequestContext, account: TestAccount): Promise<SessionInfo> {
  if (account.token) {
    const profileEnvelope = await apiRequest<{
      profiledata?: {
        _id?: string;
      };
      userDetail?: {
        _id?: string;
      };
      _id?: string;
    }>(request, "/profile", {
      token: account.token,
    });

    const userId =
      profileEnvelope.body?.profiledata?._id ||
      profileEnvelope.body?.userDetail?._id ||
      profileEnvelope.body?._id ||
      "";
    if (!userId) {
      throw new Error(`Could not resolve user id from configured token for ${account.key}.`);
    }

    return { token: account.token, userId };
  }

  const loginEnvelope = await apiRequest<UnknownRecord>(request, "/Login", {
    method: "POST",
    data: {
      phone: account.phone,
      country_code: account.countryCode,
    },
  });

  const serviceSid = normalizeServiceSid(loginEnvelope);
  const otp = account.otp || normalizeOtp(loginEnvelope);
  if (!otp) {
    throw new Error(`No OTP available for ${account.key}. Set PLAYWRIGHT_${account.key.toUpperCase()}_OTP.`);
  }

  const verifyEnvelope = await apiRequest<{
    token?: string;
    userDetail?: {
      token?: string;
    };
  }>(request, "/otpVerify", {
    method: "POST",
    data: {
      phone: account.phone,
      country_code: account.countryCode,
      otp,
      code: otp,
      serviceSid: serviceSid || undefined,
      service_sid: serviceSid || undefined,
      service_id: serviceSid || undefined,
    },
  });

  const token = verifyEnvelope.body?.userDetail?.token || verifyEnvelope.body?.token || "";
  if (!token) {
    throw new Error(`No auth token returned for ${account.key}.`);
  }

  const profileEnvelope = await apiRequest<{
    profiledata?: {
      _id?: string;
    };
    userDetail?: {
      _id?: string;
    };
    _id?: string;
  }>(request, "/profile", {
    token,
  });

  const userId =
    profileEnvelope.body?.profiledata?._id ||
    profileEnvelope.body?.userDetail?._id ||
    profileEnvelope.body?._id ||
    "";
  if (!userId) {
    throw new Error(`Could not resolve user id for ${account.key}.`);
  }

  return { token, userId };
}

export async function setAuthToken(page: Page, token: string) {
  await page.goto("/");
  await page.evaluate((value) => {
    window.localStorage.setItem("gumboot_token", value);
    window.dispatchEvent(new Event("gumboot-auth-changed"));
  }, token);
}

function normalizeJobTypes(payload: ApiEnvelope<unknown>) {
  const root = payload as ApiEnvelope<UnknownRecord>;
  const body = ((root.body as UnknownRecord | undefined) ?? root) as UnknownRecord;
  const listCandidates = [
    body.jobType,
    body.job_types,
    body.jobTypes,
    body.types,
    body.list,
    body.job_type,
    body.jobtype,
    body.category,
    body.categories,
    root.body,
  ];

  for (const candidate of listCandidates) {
    if (!Array.isArray(candidate)) continue;
    const normalized = candidate
      .map((entry) => {
        const row = (entry ?? {}) as UnknownRecord;
        const id = String(row._id ?? row.id ?? row.value ?? "").trim();
        const name = String(row.name ?? row.title ?? row.label ?? "").trim();
        return id && name ? { id, name } : null;
      })
      .filter((entry): entry is { id: string; name: string } => Boolean(entry));
    if (normalized.length > 0) return normalized;
  }

  return [] as Array<{ id: string; name: string }>;
}

export async function getJobTypeForTests(request: APIRequestContext) {
  const preferredName = process.env.PLAYWRIGHT_JOB_TYPE_NAME?.trim().toLowerCase();
  const envelope = await apiRequest<unknown>(request, "/get_job_types");
  const jobTypes = normalizeJobTypes(envelope);
  if (jobTypes.length === 0) {
    throw new Error("No job types were returned from /get_job_types.");
  }

  if (preferredName) {
    const exact = jobTypes.find((jobType) => jobType.name.toLowerCase() === preferredName);
    if (exact) return exact;
  }

  return jobTypes[0];
}

export async function createJobViaApi(
  request: APIRequestContext,
  session: SessionInfo,
  overrides: {
    title?: string;
    description?: string;
    budget?: string;
  } = {}
): Promise<CreatedJob> {
  const address = getTestAddress();
  const jobType = await getJobTypeForTests(request);

  const addressEnvelope = await apiRequest<{
    _id?: string;
    id?: string;
    address?: {
      _id?: string;
    };
  }>(request, "/add_address", {
    method: "POST",
    token: session.token,
    data: {
      address: address.address,
      latitude: String(address.lat),
      longitude: String(address.lng),
    },
  });

  const addressId =
    addressEnvelope.body?._id ||
    addressEnvelope.body?.id ||
    addressEnvelope.body?.address?._id ||
    "";
  if (!addressId) {
    throw new Error("Address creation succeeded but no address id was returned.");
  }

  const jobTitle = overrides.title ?? uniqueJobTitle("Playwright job");
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const jobDate = tomorrow.toISOString().slice(0, 10);

  await apiRequest<unknown>(request, "/add_job", {
    method: "POST",
    token: session.token,
    multipart: {
      job_title: jobTitle,
      job_type: jobType.id,
      address: addressId,
      price: overrides.budget ?? "125",
      description: overrides.description ?? "Playwright API-created job for production flow checks.",
      exp_date: jobDate,
      est_time: "anytime",
      latitude: String(address.lat),
      longitude: String(address.lng),
      tools_required: "false",
      isUrgent: "0",
      date: jobDate,
      date_type: "exact",
      shift_time: "anytime",
      price_assured: "0",
      userId: session.userId,
      image: {
        name: "placeholder.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sY4MZQAAAAASUVORK5CYII=",
          "base64"
        ),
      },
    },
  });

  const jobsEnvelope = await apiRequest<{ jobs?: Array<{ _id?: string; job_title?: string }> }>(
    request,
    "/user_job_listing?page=1&perPage=200",
    {
      token: session.token,
    }
  );

  const jobs = jobsEnvelope.body?.jobs ?? [];
  const match = jobs.find((job) => job.job_title === jobTitle);
  if (!match?._id) {
    throw new Error(`Could not find freshly created job titled "${jobTitle}".`);
  }

  return { id: match._id, title: jobTitle };
}

export async function applyToJobViaApi(
  request: APIRequestContext,
  session: SessionInfo,
  jobId: string,
  message = "Playwright worker application message",
  offeredPrice = "140"
) {
  await apiRequest(request, "/applyjob", {
    method: "POST",
    token: session.token,
    data: {
      jobid: jobId,
      message,
      offered_price: offeredPrice,
    },
  });
}

export async function getJobApplicationForWorker(
  request: APIRequestContext,
  token: string,
  jobId: string,
  workerId: string
) {
  const envelope = await apiRequest<unknown>(request, `/applications?jobId=${encodeURIComponent(jobId)}`, {
    token,
  });

  const root = (envelope.body ?? envelope) as UnknownRecord;
  const applications =
    (Array.isArray(envelope.body) ? envelope.body : null) ||
    (Array.isArray(root.jobData) ? root.jobData : null) ||
    (Array.isArray(root.jobsData) ? root.jobsData : null) ||
    (Array.isArray(root.body) ? root.body : null) ||
    [];

  const match = (applications as Array<UnknownRecord>).find((application) => {
    const worker = application.workerId;
    if (!worker) return false;
    if (typeof worker === "string") return worker === workerId;
    return String((worker as UnknownRecord)._id ?? "") === workerId;
  });

  if (!match || !String(match._id ?? "")) {
    throw new Error(`Could not find application for worker ${workerId} on job ${jobId}.`);
  }

  return {
    id: String(match._id),
  };
}

export async function waitForNotificationRow(page: Page, jobId: string) {
  const selector = `[data-testid="notification-row"][data-notification-job-id="${jobId}"]`;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.goto("/notifications");
    const row = page.locator(selector).first();
    if (await row.count()) return row;
    await page.waitForTimeout(1500);
  }

  throw new Error(`Notification row for job ${jobId} did not appear in time.`);
}

export async function selectAddressSuggestion(page: Page, address: string) {
  const input = page.getByPlaceholder("Start typing address...");
  await input.fill(address);
  const firstSuggestion = page.locator(".pac-item").first();
  if (await firstSuggestion.count()) {
    await firstSuggestion.waitFor({ state: "visible", timeout: 20000 });
    await firstSuggestion.click();
  }
  await expect(page.getByText("Pinned:", { exact: false })).toBeVisible();
}
