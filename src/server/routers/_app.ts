import { router } from '../trpc'
import { authRouter } from './auth'
import { circleRouter } from './circle'
import { checkinRouter } from './checkin'
import { feedRouter } from './feed'
import { statsRouter } from './stats'
import { vocabRouter } from './vocab'
import { vocabProgressRouter } from './vocabProgress'
import { auditRouter } from './audit'
import { exportRouter } from './export'
import { notificationRouter } from './notification'
import { discussionRouter } from './discussion'

export const appRouter = router()
  .merge('auth.', authRouter)
  .merge('circle.', circleRouter)
  .merge('checkin.', checkinRouter)
  .merge('feed.', feedRouter)
  .merge('stats.', statsRouter)
  .merge('vocab.', vocabRouter)
  .merge('vocabProgress.', vocabProgressRouter)
  .merge('audit.', auditRouter)
  .merge('export.', exportRouter)
  .merge('notification.', notificationRouter)
  .merge('discussion.', discussionRouter)

export type AppRouter = typeof appRouter