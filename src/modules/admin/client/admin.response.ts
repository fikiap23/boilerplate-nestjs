export interface AdminClientResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface AdminAuthResponse {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  status: string;
}
