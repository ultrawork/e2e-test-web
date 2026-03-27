export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
}
