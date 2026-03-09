import { Role } from "@/types";

export function isAdmin(role: Role | undefined): boolean {
  return role === "admin";
}

export function isContributor(role: Role | undefined): boolean {
  return role === "contributor" || role === "admin";
}

export function isApproved(role: Role | undefined, is_approved: boolean): boolean {
  return is_approved && role !== "pending";
}
