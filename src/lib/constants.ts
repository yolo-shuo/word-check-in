// 词库级别映射
export const levelMap: Record<string, string> = {
  CET4: '四级',
  CET6: '六级',
  COMBINED: '综合',
  CUSTOM: '自定义',
}

// 词库级别颜色
export const levelColor: Record<string, string> = {
  CET4: 'bg-blue-100 text-blue-700',
  CET6: 'bg-purple-100 text-purple-700',
  COMBINED: 'bg-green-100 text-green-700',
  CUSTOM: 'bg-gray-100 text-gray-700',
}

// 掌握程度映射
export const masteryMap: Record<string, string> = {
  NEW: '新词',
  LEARNING: '学习中',
  KNOWN: '认识',
  MASTERED: '掌握',
  REVIEWING: '复习',
}

// 掌握程度颜色
export const masteryColor: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-600',
  LEARNING: 'bg-yellow-100 text-yellow-700',
  KNOWN: 'bg-blue-100 text-blue-700',
  MASTERED: 'bg-green-100 text-green-700',
  REVIEWING: 'bg-orange-100 text-orange-700',
}

// 角色映射
export const roleMap: Record<string, { label: string; className: string }> = {
  OWNER: { label: '所有者', className: 'bg-yellow-100 text-yellow-800' },
  ADMIN: { label: '管理员', className: 'bg-blue-100 text-blue-800' },
  MEMBER: { label: '成员', className: 'bg-gray-100 text-gray-600' },
}

// 通知类型映射
export const notificationTypeMap: Record<string, string> = {
  LIKE: '👍 点赞',
  COMMENT: '💬 评论',
  INVITE: '📨 邀请',
  JOIN: '👥 加入',
  REMOVED: '⚠️ 移除',
  PASSWORD_RESET: '🔑 密码重置',
  ADMIN_ACTION: '🛡️ 管理员操作',
}

// 学习方向选项
export const studyDirections = [
  { value: 'CET4', label: '大学英语四级' },
  { value: 'CET6', label: '大学英语六级' },
  { value: 'IELTS', label: '雅思' },
  { value: 'TOEFL', label: '托福' },
  { value: 'GRE', label: 'GRE' },
  { value: 'CET', label: '英语等级考试' },
  { value: 'OTHER', label: '其他' },
]

// 考试类型选项
export const examTypes = [
  { value: 'CET4', label: '四级' },
  { value: 'CET6', label: '六级' },
  { value: 'IELTS', label: '雅思' },
  { value: 'TOEFL', label: '托福' },
  { value: 'GRE', label: 'GRE' },
  { value: 'CET', label: '英语等级考试' },
  { value: 'OTHER', label: '其他' },
]

// 圈子类型选项
export const circleTypes = [
  { value: 'PUBLIC', label: '公开圈子', desc: '任何人都可以加入' },
  { value: 'PRIVATE', label: '私密圈子', desc: '需要邀请码加入' },
  { value: 'INVITE_ONLY', label: '邀请制', desc: '需要圈主批准' },
]
