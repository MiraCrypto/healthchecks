import { z } from 'zod'

export const RoleSchema = z.enum(['USER', 'ADMIN'])
export type Role = z.infer<typeof RoleSchema>

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(50),
  role: RoleSchema.default('USER'),
  displayName: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  createdAt: z.string().datetime(),
})
export type User = z.infer<typeof UserSchema>

export const UpdateProfileSchema = z.object({
  displayName: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
})
export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().max(72),
  newPassword: z.string().min(6).max(72),
})
export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>

export const AdminCreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(72),
  role: RoleSchema.default('USER'),
})
export type AdminCreateUserDTO = z.infer<typeof AdminCreateUserSchema>

export const AdminUpdateRoleSchema = z.object({
  role: RoleSchema,
})
export type AdminUpdateRoleDTO = z.infer<typeof AdminUpdateRoleSchema>

export const LoginSchema = z.object({
  username: z.string(),
  password: z.string().max(72),
})
export type LoginDTO = z.infer<typeof LoginSchema>
