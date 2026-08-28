import { z } from "zod";

export const loginSchema = z.object({
  phone: z.string().min(10, "Informe um telefone válido com DDD"),
  password: z.string().min(1, "Informe sua senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, "Informe seu nome completo"),
  phone: z.string().min(10, "Informe um telefone válido com DDD"),
  birthDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use o formato DD/MM/AAAA"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const bookingSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um serviço"),
  barberId: z.string().uuid("Selecione um barbeiro"),
  startTime: z.string().min(1, "Selecione um horário"),
});
export type BookingInput = z.infer<typeof bookingSchema>;

export const serviceFormSchema = z.object({
  name: z.string().min(2, "Informe o nome do serviço"),
  durationMinutes: z.coerce.number().int().min(5, "Duração mínima de 5 minutos"),
  price: z.coerce.number().min(0, "Preço inválido"),
  active: z.boolean().default(true),
  includedItems: z.string().optional(),
});
export type ServiceFormInput = z.infer<typeof serviceFormSchema>;

export const barberFormSchema = z.object({
  fullName: z.string().min(2, "Informe o nome completo"),
  phone: z.string().min(8, "Informe um telefone válido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
  isAdmin: z.boolean().default(false),
  commissionPercent: z.coerce.number().min(0).max(100).optional(),
});
export type BarberFormInput = z.infer<typeof barberFormSchema>;

export const scheduleFormSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
});
export type ScheduleFormInput = z.infer<typeof scheduleFormSchema>;

export const timeOffFormSchema = z.object({
  date: z.string().min(1, "Selecione uma data"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().optional(),
});
export type TimeOffFormInput = z.infer<typeof timeOffFormSchema>;
