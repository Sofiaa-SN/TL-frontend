import { ApiError } from "@/lib/curriculum/api";
import type { ApiErrorBody } from "@/lib/curriculum/types";

export type StaffRecord = Record<string, unknown> & { id: string | number };
export type StaffSummaryRecord = {
  key: string;
  label: string;
  count: number;
  href: string;
};

export type ReportsOverview = {
  generated_at: string;
  inactive_after_days: number;
  totals: {
    learners: number;
    active_enrollments: number;
    completed_enrollments: number;
    completion_rate: number;
    average_progress: number;
    check_attempts: number;
    check_pass_rate: number | null;
    average_check_score: number | null;
    learning_hours: number | null;
  };
  courses: {
    id: string;
    name: string;
    code: string;
    enrolled: number;
    completed: number;
    in_progress: number;
    not_started: number;
    average_progress: number;
    check_attempts: number;
    check_pass_rate: number | null;
    average_check_score: number | null;
  }[];
  activity: { week: string; learners: number; activities: number }[];
  attention: {
    enrollment_id: string;
    student_id: string;
    student: string;
    email: string;
    course: string;
    progress: number;
    last_seen: string | null;
    enrolled_at: string;
  }[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const response = await fetch(`/api/staff/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      ...(init?.body && !isForm ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {}
    throw new ApiError(response.status, body);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export const staffApi = {
  list: <T extends StaffRecord>(path: string) => request<T[]>(path),
  get: <T extends StaffRecord>(path: string) => request<T>(path),
  create: <T extends StaffRecord>(
    path: string,
    data: Record<string, unknown> | FormData,
  ) =>
    request<T>(path, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  update: <T extends StaffRecord>(
    path: string,
    data: Record<string, unknown> | FormData,
  ) =>
    request<T>(path, {
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  summary: () =>
    request<{ records: StaffSummaryRecord[] }>("auth/staff-summary"),
  reports: () => request<ReportsOverview>("reports/overview"),
};
