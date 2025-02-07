import {z} from 'zod';

export const loginSchema = z.object({
  username: z.string(),
  password: z.string().min(6),
}).strict();

export const registerSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9_]{3,16}$/, {
    message: 'Invalid username. Must be 3-16 characters long and contain only letters, numbers and underscores'
  }),
  password: z.string().min(6),
})
