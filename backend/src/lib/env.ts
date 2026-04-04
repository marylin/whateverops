import { config } from 'dotenv'
import { z } from 'zod'

config({ path: '../.env' })

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CACHE_BACKEND: z.enum(['memory', 'redis']).default('memory'),
  FRONTEND_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse(process.env)
