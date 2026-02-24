export type ApiEnvelope<T> = {
  success?: boolean;
  code?: number;
  message?: string;
  body?: T;
};
