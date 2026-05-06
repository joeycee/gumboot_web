import { NextResponse } from "next/server";
import { getConfiguredE2ETestAccounts, isE2ETestModeEnabled } from "@/lib/e2eTestMode";

type AccountRecord = {
  id: string;
  key: "owner" | "worker" | "signup";
  phone: string;
  countryCode: string;
  token: string;
  firstname: string;
  lastname: string;
  email?: string;
  verified_user: number;
  admin_verification_status: "verified" | "unverified";
  role: number;
  idproof?: string;
  selfie?: string;
};

type AddressRecord = {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
};

type JobTypeRecord = {
  _id: string;
  name: string;
  description?: string;
};

type ApplicationRecord = {
  _id: string;
  jobId: string;
  workerId: string;
  message: string;
  offered_price: string;
  job_status: number;
  createdAt: string;
  updatedAt: string;
};

type JobRecord = {
  _id: string;
  job_title: string;
  description: string;
  price: string;
  exp_date: string;
  est_time: string;
  exact_time?: string;
  shift_time?: string;
  date?: string;
  date_type?: string;
  addressId: string;
  userId: string;
  job_type: string;
  job_status: number;
  createdAt: string;
};

type NotificationRecord = {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  type: string;
  status: string;
  jobId: string;
  jobStatus: number;
  createdAt: string;
};

type TransactionRecord = {
  _id: string;
  userId: string;
  jobId: string;
  acceptedRequestId: string;
  amount: string;
  currency: string;
  paymentPhase: "held" | "released";
  transactionStatus: number;
  createdAt: string;
  updatedAt: string;
};

type Store = {
  initialized: boolean;
  accountsByToken: Record<string, AccountRecord>;
  accountsByPhone: Record<string, AccountRecord>;
  jobTypes: JobTypeRecord[];
  addresses: Record<string, AddressRecord>;
  jobs: Record<string, JobRecord>;
  applications: Record<string, ApplicationRecord>;
  notifications: Record<string, NotificationRecord>;
  transactions: Record<string, TransactionRecord>;
  counters: {
    account: number;
    address: number;
    job: number;
    application: number;
    notification: number;
    transaction: number;
  };
};

const STORE_KEY = "__gumbootE2EStore";

function getStore(): Store {
  const globalStore = globalThis as typeof globalThis & { [STORE_KEY]?: Store };
  if (globalStore[STORE_KEY]?.initialized) return globalStore[STORE_KEY] as Store;

  const configured = getConfiguredE2ETestAccounts();
  const ownerConfig = configured.find((account) => account.key === "owner");
  const workerConfig = configured.find((account) => account.key === "worker");

  const accounts: AccountRecord[] = [];

  if (ownerConfig) {
    accounts.push({
      id: "user_owner",
      key: "owner",
      phone: ownerConfig.phone,
      countryCode: ownerConfig.countryCode,
      token: ownerConfig.token,
      firstname: "Olive",
      lastname: "Owner",
      email: "owner@example.com",
      verified_user: 1,
      admin_verification_status: "unverified",
      role: 1,
      idproof: "/images/owner-idproof.jpg",
      selfie: "/images/owner-selfie.jpg",
    });
  }

  if (workerConfig) {
    accounts.push({
      id: "user_worker",
      key: "worker",
      phone: workerConfig.phone,
      countryCode: workerConfig.countryCode,
      token: workerConfig.token,
      firstname: "Wally",
      lastname: "Worker",
      email: "worker@example.com",
      verified_user: 1,
      admin_verification_status: "verified",
      role: 2,
      idproof: "/images/worker-idproof.jpg",
      selfie: "/images/worker-selfie.jpg",
    });
  }

  globalStore[STORE_KEY] = {
    initialized: true,
    accountsByToken: Object.fromEntries(accounts.map((account) => [account.token, account])),
    accountsByPhone: Object.fromEntries(accounts.map((account) => [`${account.countryCode}:${account.phone}`, account])),
    jobTypes: [
      { _id: "jt_lawn", name: "Lawn Mowing", description: "Mow and tidy an outdoor area." },
      { _id: "jt_clean", name: "House Cleaning", description: "General cleaning support." },
    ],
    addresses: {},
    jobs: {},
    applications: {},
    notifications: {},
    transactions: {},
    counters: { account: 1, address: 1, job: 1, application: 1, notification: 1, transaction: 1 },
  };

  return globalStore[STORE_KEY] as Store;
}

function nextId(store: Store, kind: keyof Store["counters"]) {
  const value = store.counters[kind];
  store.counters[kind] += 1;
  return `${kind}_${value}`;
}

function ok(body: unknown) {
  return NextResponse.json({ success: true, body });
}

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

function unauthorized(message = "invalid token") {
  return fail(message, 401);
}

function getToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
}

function getAccountFromRequest(store: Store, request: Request) {
  const token = getToken(request);
  return token ? store.accountsByToken[token] ?? null : null;
}

function getAccountById(store: Store, id: string) {
  return Object.values(store.accountsByToken).find((account) => account.id === id) ?? null;
}

function serializeAccount(account: AccountRecord) {
  return {
    _id: account.id,
    firstname: account.firstname,
    lastname: account.lastname,
    name: `${account.firstname} ${account.lastname}`.trim(),
    email: account.email ?? "",
    verified_user: account.verified_user,
    admin_verification_status: account.admin_verification_status,
    role: account.role,
    rating: 5,
    reviews: 3,
    image: "",
    idproof: account.idproof ?? "",
    selfie: account.selfie ?? "",
  };
}

function serializeApplication(store: Store, application: ApplicationRecord) {
  const worker = getAccountById(store, application.workerId);
  return {
    _id: application._id,
    jobId: application.jobId,
    workerId: worker ? serializeAccount(worker) : application.workerId,
    message: application.message,
    offered_price: application.offered_price,
    job_status: application.job_status,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}

function serializeJobDetails(store: Store, job: JobRecord) {
  const owner = getAccountById(store, job.userId);
  const address = store.addresses[job.addressId];
  const applications = Object.values(store.applications)
    .filter((application) => application.jobId === job._id)
    .map((application) => serializeApplication(store, application));

  return {
    getdetails: {
      _id: job._id,
      job_title: job.job_title,
      title: job.job_title,
      description: job.description,
      job_description: job.description,
      exp_date: job.exp_date,
      date: job.date ?? job.exp_date,
      est_time: job.est_time,
      exact_time: job.exact_time ?? "",
      shift_time: job.shift_time ?? "",
      job_status: job.job_status,
      price: job.price,
      offered_price: job.price,
      userId: owner ? serializeAccount(owner) : job.userId,
      address: address
        ? {
            _id: address.id,
            address: address.address,
            city: "Auckland",
            state: "Auckland",
            country: "New Zealand",
            location: { coordinates: [address.longitude, address.latitude] },
          }
        : null,
      location: address ? { coordinates: [address.longitude, address.latitude] } : null,
      job_type: store.jobTypes.find((jobType) => jobType._id === job.job_type) ?? { _id: job.job_type, name: "General" },
      image: [{ url: "/job-types/lawn-mowing.jpg" }],
      image_before_job: [],
      image_after_job: [],
      jobRequestedData: applications,
      jobRequestedDataNew: null,
      ratedbyme: 0,
      jobreviewData: null,
    },
    jobRequestedData: applications,
    jobRequestedDataNew: null,
  };
}

function serializeManagedJob(store: Store, job: JobRecord) {
  const address = store.addresses[job.addressId];
  return {
    _id: job._id,
    job_title: job.job_title,
    description: job.description,
    price: job.price,
    job_status: job.job_status,
    exp_date: job.exp_date,
    est_time: job.est_time,
    exact_time: job.exact_time ?? "",
    shift_time: job.shift_time ?? "",
    address: address
      ? {
          _id: address.id,
          address: address.address,
          city: "Auckland",
          location: { coordinates: [address.longitude, address.latitude] },
        }
      : null,
    image: [{ url: "/job-types/lawn-mowing.jpg" }],
    job_type: store.jobTypes.find((jobType) => jobType._id === job.job_type) ?? { _id: job.job_type, name: "General" },
  };
}

function serializeNotification(store: Store, notification: NotificationRecord) {
  const sender = getAccountById(store, notification.senderId);
  return {
    notification: {
      _id: notification._id,
      sender: sender ? serializeAccount(sender) : undefined,
      receiver: notification.receiverId,
      message: notification.message,
      type: notification.type,
      status: notification.status,
      jobStatus: notification.jobStatus,
      createdAt: notification.createdAt,
      jobId: {
        _id: notification.jobId,
        job_status: notification.jobStatus,
      },
    },
    senderRatingData: {
      count: 3,
      averageRating: 5,
    },
  };
}

async function parseBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const record: Record<string, FormDataEntryValue | FormDataEntryValue[] | undefined> = {};
    for (const [key, value] of formData.entries()) {
      const current = record[key];
      if (typeof current === "undefined") {
        record[key] = value;
      } else if (Array.isArray(current)) {
        record[key] = [...current, value];
      } else {
        record[key] = [current, value];
      }
    }
    return record;
  }

  if (contentType.includes("application/json")) {
    return (await request.json()) as Record<string, unknown>;
  }

  return {};
}

async function handleRequest(request: Request, slug: string[]) {
  if (!isE2ETestModeEnabled()) {
    return fail("E2E backend is disabled.", 404);
  }

  const store = getStore();
  const path = slug.join("/");
  const method = request.method.toUpperCase();
  const account = getAccountFromRequest(store, request);
  const url = new URL(request.url);

  if (path === "get_job_types") {
    return ok({ jobType: store.jobTypes });
  }

  if (path === "signup" && method === "POST") {
    const body = (await parseBody(request)) as Record<string, unknown>;
    const phone = String(body.phone ?? "").trim();
    const countryCode = String(body.country_code ?? "+64").trim();
    const key = `${countryCode}:${phone}`;
    const existingAccount = store.accountsByPhone[key];

    if (!phone) return fail("Phone number is required.");
    if (existingAccount && existingAccount.verified_user === 1) return fail("Mobile number already exists");
    if (existingAccount) {
      delete store.accountsByToken[existingAccount.token];
      delete store.accountsByPhone[key];
    }

    const id = nextId(store, "account");
    const accountRecord: AccountRecord = {
      id: `user_${id}`,
      key: "signup",
      phone,
      countryCode,
      token: `token_${id}`,
      firstname: String(body.firstname ?? "").trim(),
      lastname: String(body.lastname ?? "").trim(),
      email: String(body.email ?? "").trim(),
      verified_user: 0,
      admin_verification_status: "unverified",
      role: 1,
      idproof: "",
      selfie: "",
    };

    store.accountsByPhone[key] = accountRecord;
    store.accountsByToken[accountRecord.token] = accountRecord;

    return ok({ serviceSid: "e2e-service-sid", otp: "123456" });
  }

  if (path === "Login" && method === "POST") {
    const body = (await parseBody(request)) as Record<string, unknown>;
    const phone = String(body.phone ?? "").trim();
    const countryCode = String(body.country_code ?? "+64").trim();
    const accountByPhone = store.accountsByPhone[`${countryCode}:${phone}`];
    if (!accountByPhone) return fail("Invalid phone number or country code", 404);
    return ok({ serviceSid: "e2e-service-sid", otp: "123456" });
  }

  if (path === "otpVerify" && method === "POST") {
    const body = (await parseBody(request)) as Record<string, unknown>;
    const phone = String(body.phone ?? "").trim();
    const countryCode = String(body.country_code ?? "+64").trim();
    const otp = String(body.otp ?? body.code ?? "").trim();
    const accountByPhone = store.accountsByPhone[`${countryCode}:${phone}`];

    if (!accountByPhone) return fail("User does not exist", 404);
    if (otp !== "123456") return fail("OTP is invalid or expired");

    accountByPhone.verified_user = 1;

    return ok({
      userDetail: {
        ...serializeAccount(accountByPhone),
        token: accountByPhone.token,
      },
      token: accountByPhone.token,
    });
  }

  if (path === "resend_otp" && method === "POST") {
    return ok({ serviceSid: "e2e-service-sid", otp: "123456" });
  }

  if (path === "profile") {
    if (!account) return unauthorized();
    return ok({ profiledata: serializeAccount(account) });
  }

  if (path === "worker_public_profile") {
    const workerId = String(url.searchParams.get("workerId") ?? "");
    const jobRequestedId = String(url.searchParams.get("jobrequestedId") ?? "");
    const worker = getAccountById(store, workerId);
    if (!worker) return fail("Worker not found.", 404);

    const application = jobRequestedId ? store.applications[jobRequestedId] : null;
    const completedJobs = Object.values(store.applications)
      .filter((entry) => entry.workerId === workerId && entry.job_status === 7)
      .map((entry) => {
        const job = store.jobs[entry.jobId];
        return {
          _id: entry._id,
          workerId,
          job_status: String(entry.job_status),
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          jobId: job
            ? {
                _id: job._id,
                job_title: job.job_title,
                price: job.price,
                offered_price: entry.offered_price || job.price,
                description: job.description,
                createdAt: job.createdAt,
                job_status: job.job_status,
                image: [{ url: "/job-types/lawn-mowing.jpg" }],
                job_type: store.jobTypes.find((jobType) => jobType._id === job.job_type) ?? { _id: job.job_type, name: "General" },
              }
            : undefined,
        };
      });

    return ok({
      workerDetails: serializeAccount(worker),
      userDetail: serializeAccount(worker),
      verificationStatus: {
        badge: worker.admin_verification_status,
        documentsUploaded: Boolean(worker.idproof && worker.selfie),
      },
      ratingdata: {
        count: 3,
        averageRating: 5,
      },
      offerPrice: application
        ? {
            message: application.message,
            offered_price: application.offered_price,
            admin_charges: "0",
          }
        : undefined,
      completedJobs,
      newJobs: [],
    });
  }

  if (path === "billing/payment-methods") {
    if (!account) return unauthorized();
    return ok([
      {
        id: account.key === "owner" ? "pm_owner_default" : "pm_worker_default",
        brand: "visa",
        last4: account.key === "owner" ? "4242" : "1111",
        exp_month: 12,
        exp_year: 2030,
        isDefault: true,
      },
    ]);
  }

  if (path === "add_address" && method === "POST") {
    if (!account) return unauthorized();
    const body = (await parseBody(request)) as Record<string, unknown>;
    const id = nextId(store, "address");
    store.addresses[id] = {
      id,
      address: String(body.address ?? ""),
      latitude: Number(body.latitude ?? 0),
      longitude: Number(body.longitude ?? 0),
    };
    return ok({ _id: id, address: { _id: id } });
  }

  if (path === "add_job" && method === "POST") {
    if (!account) return unauthorized();
    const body = (await parseBody(request)) as Record<string, FormDataEntryValue | FormDataEntryValue[] | undefined>;
    const id = nextId(store, "job");
    store.jobs[id] = {
      _id: id,
      job_title: String(body.job_title ?? "Untitled job"),
      description: String(body.description ?? ""),
      price: String(body.price ?? "0"),
      exp_date: String(body.exp_date ?? new Date().toISOString().slice(0, 10)),
      est_time: String(body.est_time ?? "anytime"),
      exact_time: String(body.exact_time ?? ""),
      shift_time: String(body.shift_time ?? "anytime"),
      date: String(body.date ?? body.exp_date ?? ""),
      date_type: String(body.date_type ?? "exact"),
      addressId: String(body.address ?? ""),
      userId: account.id,
      job_type: String(body.job_type ?? "jt_lawn"),
      job_status: 0,
      createdAt: new Date().toISOString(),
    };
    return ok({ _id: id });
  }

  if (path === "user_job_listing") {
    if (!account) return unauthorized();
    const jobs = Object.values(store.jobs)
      .filter((job) => job.userId === account.id)
      .map((job) => serializeManagedJob(store, job));
    return ok({ jobs });
  }

  if (path === "home_job_listing") {
    const jobs = Object.values(store.jobs).map((job) => {
      const owner = getAccountById(store, job.userId);
      const address = store.addresses[job.addressId];
      const jobType = store.jobTypes.find((entry) => entry._id === job.job_type);
      return {
        _id: job._id,
        title: job.job_title,
        price: Number(job.price),
        description: job.description,
        address: address
          ? { address: address.address, city: "Auckland", location: { coordinates: [address.longitude, address.latitude] } }
          : null,
        location: address ? { coordinates: [address.longitude, address.latitude] } : null,
        userId: owner ? serializeAccount(owner) : undefined,
        job_type: jobType ? { _id: jobType._id, name: jobType.name } : { _id: job.job_type, name: "General" },
        image: [{ url: "/job-types/lawn-mowing.jpg" }],
        date: job.date,
        exp_date: job.exp_date,
        shift_time: job.shift_time,
        job_status: job.job_status,
      };
    });
    return ok({ jobs });
  }

  if (path === "job_details") {
    let body: Record<string, unknown> = {};
    try {
      body = (await parseBody(request)) as Record<string, unknown>;
    } catch {
      body = {};
    }

    const jobId = String(body.jobId ?? url.searchParams.get("jobId") ?? "");
    if (!jobId) return fail("The job id field is mandatory.");
    const job = store.jobs[jobId];
    if (!job) return fail("Job not found.", 404);
    return ok(serializeJobDetails(store, job));
  }

  if (path === "applyjob" && method === "POST") {
    if (!account) return unauthorized();
    const body = (await parseBody(request)) as Record<string, unknown>;
    const jobId = String(body.jobid ?? "");
    const job = store.jobs[jobId];
    if (!job) return fail("Job not found.", 404);

    const applicationId = nextId(store, "application");
    const now = new Date().toISOString();
    store.applications[applicationId] = {
      _id: applicationId,
      jobId,
      workerId: account.id,
      message: String(body.message ?? ""),
      offered_price: String(body.offered_price ?? ""),
      job_status: 1,
      createdAt: now,
      updatedAt: now,
    };

    const notificationId = nextId(store, "notification");
    store.notifications[notificationId] = {
      _id: notificationId,
      senderId: account.id,
      receiverId: job.userId,
      message: String(body.message ?? "New application received."),
      type: "3",
      status: "0",
      jobId,
      jobStatus: 1,
      createdAt: now,
    };

    return ok({ _id: applicationId });
  }

  if (path === "applications") {
    if (!account) return unauthorized();
    const jobId = url.searchParams.get("jobId") || "";
    const applications = Object.values(store.applications)
      .filter((application) => application.jobId === jobId)
      .map((application) => serializeApplication(store, application));
    return ok({ jobData: applications });
  }

  if (path === "updateJobStatus" && method === "POST") {
    if (!account) return unauthorized();
    const body = (await parseBody(request)) as Record<string, unknown>;
    const applicationId = String(body.jobRequested_id ?? "");
    const nextStatus = Number(body.job_status ?? 0);
    const application = store.applications[applicationId];
    if (!application) return fail("Application not found.", 404);
    if (nextStatus === 2) {
      const heldTransaction = Object.values(store.transactions).find(
        (transaction) =>
          transaction.jobId === application.jobId &&
          transaction.acceptedRequestId === applicationId &&
          transaction.paymentPhase === "held"
      );
      if (!heldTransaction) {
        return fail("Secure payment before accepting this offer");
      }
    }

    application.job_status = nextStatus;
    application.updatedAt = new Date().toISOString();
    const job = store.jobs[application.jobId];
    if (job && nextStatus === 2) job.job_status = 2;
    return ok({ _id: applicationId, job_status: nextStatus });
  }

  if (path === "billing/acceptance-payment-intent" && method === "POST") {
    if (!account) return unauthorized();
    const body = (await parseBody(request)) as Record<string, unknown>;
    const jobId = String(body.jobId ?? "");
    const jobRequestedId = String(body.jobRequestedId ?? "");
    const job = store.jobs[jobId];
    const application = store.applications[jobRequestedId];
    if (!job) return fail("Job not found.", 404);
    if (!application || application.jobId !== jobId) return fail("Job request not found.", 404);

    const existing = Object.values(store.transactions).find(
      (transaction) => transaction.jobId === jobId && transaction.acceptedRequestId === jobRequestedId
    );
    if (existing?.paymentPhase === "held") {
      return ok({
        alreadyHeld: true,
        transactionId: existing._id,
        amount: Number(existing.amount),
        currency: existing.currency,
      });
    }

    const transactionId = existing?._id ?? nextId(store, "transaction");
    const now = new Date().toISOString();
    store.transactions[transactionId] = {
      _id: transactionId,
      userId: account.id,
      jobId,
      acceptedRequestId: jobRequestedId,
      amount: application.offered_price || job.price,
      currency: "nzd",
      paymentPhase: "held",
      transactionStatus: 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    return ok({
      alreadyHeld: true,
      transactionId,
      amount: Number(store.transactions[transactionId].amount),
      currency: "nzd",
    });
  }

  if (path === "billing/release-held-payment" && method === "POST") {
    if (!account) return unauthorized();
    const body = (await parseBody(request)) as Record<string, unknown>;
    const jobId = String(body.jobId ?? "");
    const jobRequestedId = String(body.jobRequestedId ?? "");
    const transaction = Object.values(store.transactions).find(
      (entry) => entry.jobId === jobId && entry.acceptedRequestId === jobRequestedId
    );
    if (!transaction) return fail("No payment is ready to release for this job yet", 404);

    transaction.paymentPhase = "released";
    transaction.updatedAt = new Date().toISOString();
    return ok({
      released: true,
      transactionId: transaction._id,
    });
  }

  if (path === "notificationList") {
    if (!account) return unauthorized();
    const items = Object.values(store.notifications)
      .filter((notification) => notification.receiverId === account.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((notification) => serializeNotification(store, notification));
    return ok(items);
  }

  if (path === "unread_notification_count") {
    if (!account) return unauthorized();
    const count = Object.values(store.notifications).filter(
      (notification) => notification.receiverId === account.id && notification.status !== "1"
    ).length;
    return ok({ count });
  }

  if (path === "read_notification" && method === "POST") {
    if (!account) return unauthorized();
    for (const notification of Object.values(store.notifications)) {
      if (notification.receiverId === account.id) notification.status = "1";
    }
    return ok({});
  }

  if ((path === "UserNotificationStatus" || path === "updateLocation") && method === "POST") {
    if (!account) return unauthorized();
    return ok({});
  }

  return fail(`Unhandled E2E backend route: ${method} ${path}`, 404);
}

type RouteContext = {
  params: Promise<{
    slug?: string[];
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const params = await context.params;
  return handleRequest(request, params.slug ?? []);
}

export async function POST(request: Request, context: RouteContext) {
  const params = await context.params;
  return handleRequest(request, params.slug ?? []);
}

export async function DELETE(request: Request, context: RouteContext) {
  const params = await context.params;
  return handleRequest(request, params.slug ?? []);
}
