import { router } from '@trpc/server'
import { z } from 'zod'

export const testRouter = router()
  .mutation('test', {
    input: z.object({ name: z.string() }),
    resolve: async ({ input, ctx }) => {
      return { message: 'Hello', name: input.name }
    }
  })
  .query('testQuery', {
    resolve: async ({ ctx }) => {
      return { message: 'Hello Query' }
    }
  })
