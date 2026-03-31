export interface Note {
  id: number;
  title: string;
}

export interface ApiError {
  message: string;
  status: number;
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };
