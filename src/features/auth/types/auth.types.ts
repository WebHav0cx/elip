import type { User } from "../../../types/user.types";

export type AuthUser = Pick<User, "id" | "name" | "email" | "role" | "status">;

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResult = { ok: true; user: AuthUser } | { ok: false; message: string };
