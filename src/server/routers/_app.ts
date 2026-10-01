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

export const appRouter = router({
  auth: authRouter,
  circle: circleRouter,
  checkin: checkinRouter,
  feed: feedRouter,
  stats: statsRouter,
  vocab: vocabRouter,
  vocabProgress: vocabProgressRouter,
  audit: auditRouter,
  export: exportRouter,
  notification: notificationRouter,
  discussion: discussionRouter,
})

export type AppRouter = typeof appRouter
