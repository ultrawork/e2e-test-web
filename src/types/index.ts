export interface Note {
  id: string;
  title: string;
  content: string;
  isFavorited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
}
