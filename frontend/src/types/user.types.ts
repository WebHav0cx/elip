export type UserRole =
  | "Administrator"
  | "Operations Coordinator"
  | "Monitoring Analyst"
  | "Planning Analyst";

export type AccountStatus = "ACTIVE" | "INACTIVE";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
};
