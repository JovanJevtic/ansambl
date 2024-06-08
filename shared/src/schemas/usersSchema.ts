import { z } from 'zod'

export const getUserParamsSchema = z.object({
    username: z.string().trim().min(1)
})