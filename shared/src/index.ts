import { z } from 'zod';

export const RoleSchema = z.enum(["USER", "ADMIN"]);
export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(50),
  role: RoleSchema.default("USER"),
  displayName: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  createdAt: z.string().datetime()
});

export type User = z.infer<typeof UserSchema>;

export const UpdateProfileSchema = z.object({
  displayName: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
});
export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;

export const ChangePasswordSchema = z.object({
  // .max(72) prevents bcrypt from silently truncating long strings or exhausting CPU cycles
  currentPassword: z.string().max(72),
  newPassword: z.string().min(6).max(72),
});
export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>;

export const AdminCreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  // .max(72) prevents bcrypt from silently truncating long strings or exhausting CPU cycles
  password: z.string().min(6).max(72),
  role: RoleSchema.default("USER"),
});
export type AdminCreateUserDTO = z.infer<typeof AdminCreateUserSchema>;

export const AdminUpdateRoleSchema = z.object({
  role: RoleSchema,
});
export type AdminUpdateRoleDTO = z.infer<typeof AdminUpdateRoleSchema>;

export const CheckStatusSchema = z.enum(["NEW", "UP", "DOWN", "PAUSED"]);
export type CheckStatus = z.infer<typeof CheckStatusSchema>;

export const CheckSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).nullable().optional(),
  tags: z.string().optional(), // Comma separated tags
  intervalSeconds: z.number().int().min(60), // Minimum 1 minute
  graceSeconds: z.number().int().min(60), // Minimum 1 minute
  status: CheckStatusSchema,
  lastPing: z.string().datetime().nullable(),
  createdAt: z.string().datetime()
});

export type Check = z.infer<typeof CheckSchema>;

export const CreateCheckSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).nullable().optional(),
  userId: z.string().uuid().optional(), // Will be injected by backend
  tags: z.string().optional(),
  intervalSeconds: z.number().int().min(60),
  graceSeconds: z.number().int().min(60),
});

export type CreateCheckDTO = z.infer<typeof CreateCheckSchema>;

export const UpdateCheckSchema = CreateCheckSchema.partial();
export type UpdateCheckDTO = z.infer<typeof UpdateCheckSchema>;

export const PingSchema = z.object({
  id: z.string().uuid(),
  checkId: z.string().uuid(),
  remoteIp: z.string().nullable(),
  userAgent: z.string().nullable(),
  scheme: z.string().nullable(),
  method: z.string().nullable(),
  hasPayload: z.boolean(),
  mimeType: z.string().nullable(),
  createdAt: z.string().datetime()
});

export type Ping = z.infer<typeof PingSchema>;

export const LoginSchema = z.object({
  username: z.string(),
  // .max(72) prevents bcrypt from silently truncating long strings or exhausting CPU cycles
  password: z.string().max(72)
});

export type LoginDTO = z.infer<typeof LoginSchema>;
