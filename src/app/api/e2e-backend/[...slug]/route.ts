import { NextResponse } from "next/server";
import { getConfiguredE2ETestAccounts, isE2ETestModeEnabled } from "@/lib/e2eTestMode";

type AccountRecord = {
  id: string;
  key: "owner" | "worker";
  phone: string;
  countryCode: string;
  token: string;
  firstname: string;
  lastname: string;
  verified_user: number;
  role: number;
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

type Store = {
  initialized: boolean;
  accountsByToken: Record<string, AccountRecord>;
  accountsByPhone: Record<string, AccountRecord>;
  jobTypes: JobTypeRecord[];
  addresses: Record<string, AddressRecord>;
  jobs: Record<string, JobRecord>;
  applications: Record<string, ApplicationRecord>;
  notifications: Record<string, NotificationRecord>;
  counters: {
    address: number;
    job: number;
    application: number;
    notification: number;
  };
};

const STORE_KEY = "__gumbootE2EStore";

function getStore(): Store {
  const globalStore = globalThis as typeof globalThis & { [STORE_KEY]?: Store };
  if (globalStore[STORE_KEY]?.initialized) return globalStore[STORE_KEY] as Store;

  const configured = getConfiguredE2ETestAccounts();
  const ownerConfig = configured.find((account) => account.key === "owner");
  const workerConfig = configured.find((account) => account.key === "worker");

  const accounts = [
    ownerConfig
      ? {
          id: "user_owner",
          key: "owner" as const,
          phone: ownerConfig.phone,
          countryCode: ownerConfig.countryCode,
          token: ownerConfig.token,
          firstname: "Olive",
          lastname: "Owner",
          verified_user: 1,
          role: 1,
        }
      : null,
    workerConfig
      ? {
          id: "user_worker",
          key: "worker" as const,
          phone: workerConfig.phone,
          countryCode: workerConfig.countryCode,
          token: workerConfig.token,
          firstname: "Wally",
          lastname: "Worker",
          verified_user: 1,
          role: 2,
        }
      : null,
  ].filter((account): account is AccountRecord => Boolean(account));

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
    counters: { address: 1, job: 1, application: 1, notification: 1 },
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
    verified_user: account.verified_user,
    role: account.role,
    rating: 5,
    reviews: 3,
    image: "",
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

  if (path === "profile") {
    if (!account) return unauthorized();
    return ok({ profiledata: serializeAccount(account) });
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
    const jobId = url.searchParams.get("jobId") || "";
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

    application.job_status = nextStatus;
    application.updatedAt = new Date().toISOString();
    const job = store.jobs[application.jobId];
    if (job && nextStatus === 2) job.job_status = 2;
    return ok({ _id: applicationId, job_status: nextStatus });
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
