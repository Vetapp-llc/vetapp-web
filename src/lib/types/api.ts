// Re-exports from generated types + frontend-only types.
//
// Generated types come from the Go backend's swagger.json via:
//   npm run generate:types
//
// This file re-exports them as convenience aliases so existing imports
// continue to work. Frontend-only types (not in the API) are defined here.

export type { components } from "./api.generated";

// Convenience aliases for generated schema types.
import type { components } from "./api.generated";
type Schemas = components["schemas"];

export type LoginRequest = Schemas["internal_handlers.LoginRequest"];
export type LoginResponse = Schemas["internal_handlers.LoginResponse"];
export type RegisterRequest = Schemas["internal_handlers.RegisterRequest"];
export type RefreshRequest = Schemas["internal_handlers.RefreshRequest"];
export type UserResponse = Schemas["internal_handlers.UserResponse"];
export type ErrorResponse = Schemas["internal_handlers.ErrorResponse"];
export type MessageResponse = Schemas["internal_handlers.MessageResponse"];

export type PetListItem = Schemas["internal_handlers.PetListItem"];
export type Pet = Schemas["internal_handlers.PetDetail"];
export type PetDetail = Schemas["internal_handlers.PetDetail"];
export type CreatePetRequest = Schemas["internal_handlers.CreatePetRequest"];
export type MedicalRecord = Schemas["internal_handlers.MedicalRecord"];
export type CertificateResponse = Schemas["internal_handlers.CertificateResponse"];

export type Owner = Omit<Schemas["internal_handlers.OwnerWithPets"], "pets">;
export type OwnerWithPets = Schemas["internal_handlers.OwnerWithPets"];

export type ClinicStats = Schemas["internal_handlers.ClinicStats"];

// PaginatedResponse is generic on the frontend side since Go uses interface{} for Data.
export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ProcedureTypeItem = Schemas["internal_handlers.ProcedureTypeItem"];
export type SelectOption = Schemas["internal_handlers.SelectOption"];
export type VaccineOptionsResponse = Schemas["internal_handlers.VaccineOptionsResponse"];
export type EctoOptionsResponse = Schemas["internal_handlers.EctoOptionsResponse"];

export type CreateProcedureRequest = Schemas["internal_handlers.CreateProcedureRequest"];

// Phase 5 types
export type OTPSendRequest = Schemas["internal_handlers.OTPSendRequest"];
export type OTPSendResponse = Schemas["internal_handlers.OTPSendResponse"];
export type OTPVerifyRequest = Schemas["internal_handlers.OTPVerifyRequest"];
export type OTPVerifyResponse = Schemas["internal_handlers.OTPVerifyResponse"];
export type PasswordResetRequest = Schemas["internal_handlers.PasswordResetRequest"];
export type AdminStats = Schemas["internal_handlers.AdminStats"];
export type PackageResponse = Schemas["internal_handlers.PackageResponse"];
export type CheckoutRequest = Schemas["internal_handlers.CheckoutRequest"];
export type CheckoutResponse = Schemas["internal_handlers.CheckoutResponse"];
export type ReminderResult = Schemas["internal_handlers.ReminderResult"];

/* ─── Frontend-only types (not in swagger) ─── */

export interface ClinicInfo {
  zip: string;
  companyName: string;
  groupId: string;
}

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  clinic?: ClinicInfo;
}

export interface AuthUser {
  id: string | number;
  email: string;
  name: string;
}

export interface Operation {
  id: string;
  date: string | null;
  type: string;
  description: string;
  vetName: string;
  price: string;
}
