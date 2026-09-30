export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">隐私政策</h1>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">最后更新日期：2024年1月1日</p>

        <h2 className="font-semibold text-foreground">我们收集的信息</h2>
        <p>我们收集以下信息：</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>账户信息：</strong>邮箱地址、昵称</li>
          <li><strong>学习数据：</strong>打卡记录、单词数量、学习时长、学习笔记</li>
          <li><strong>圈子数据：</strong>圈子名称、成员关系、讨论消息</li>
          <li><strong>操作日志：</strong>登录时间、IP 地址、操作审计日志</li>
        </ul>

        <h2 className="font-semibold text-foreground">信息使用</h2>
        <p>我们使用收集的信息来：</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>提供和维护服务</li>
          <li>计算学习统计和排行榜</li>
          <li>发送通知和提醒</li>
          <li>改进服务质量和功能</li>
          <li>保障账户安全</li>
        </ul>

        <h2 className="font-semibold text-foreground">数据存储</h2>
        <p>数据存储在自托管的 VPS 服务器上。我们采取合理的安全措施保护你的数据，但不保证数据绝对不会被泄露。</p>

        <h2 className="font-semibold text-foreground">数据共享</h2>
        <p>我们不会将你的个人信息出售或分享给第三方，除非：</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>法律要求</li>
          <li>获得你的明确同意</li>
          <li>圈子内成员之间可见的公开信息（昵称、打卡记录）</li>
        </ul>

        <h2 className="font-semibold text-foreground">账户注销</h2>
        <p>你可以在个人设置中注销账户。注销后：</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>所有打卡记录和笔记将被删除</li>
          <li>圈子会员关系将被解除</li>
          <li>评论和点赞将被移除</li>
          <li>删除后数据不可恢复</li>
        </ul>

        <h2 className="font-semibold text-foreground">政策更新</h2>
        <p>我们可能会更新本隐私政策。如有重大变更，我们将通过应用内通知告知用户。更新后继续使用本服务即表示你同意新政策。</p>
      </div>
    </div>
  )
}
