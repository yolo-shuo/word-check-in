export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">用户协议</h1>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">最后更新日期：2024年1月1日</p>
        <p>欢迎使用单词打卡。在使用本服务前，请仔细阅读以下条款。使用本服务即表示你同意接受以下条款的约束。</p>

        <h2 className="font-semibold text-foreground">1. 服务说明</h2>
        <p>单词打卡是一个面向 3-15 人熟人小圈子的学习记录工具，帮助用户记录单词学习进度并与朋友一起坚持打卡。本服务不包含测验、推荐、成就体系、公共广场和陌生人社交功能。</p>

        <h2 className="font-semibold text-foreground">2. 账户注册</h2>
        <p>你需要提供有效的邮箱地址来注册账户。你负责维护账户密码的安全性，并对账户下的所有活动负责。</p>

        <h2 className="font-semibold text-foreground">3. 用户行为</h2>
        <p>你承诺不使用本服务进行任何违法活动，包括但不限于：</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>发布违法、侵权或有害内容</li>
          <li>骚扰、威胁或欺凌其他用户</li>
          <li>散布垃圾信息或广告</li>
          <li>侵犯他人知识产权</li>
        </ul>

        <h2 className="font-semibold text-foreground">4. 数据与隐私</h2>
        <p>你在使用本服务过程中产生的数据（包括打卡记录、笔记、讨论消息等）将保存在服务器上。详情请参阅隐私政策。</p>

        <h2 className="font-semibold text-foreground">5. 免责声明</h2>
        <p>本服务按"现状"提供，不保证服务完全无错。在法律允许的范围内，我们不承担因使用本服务而产生的任何损害责任。</p>

        <h2 className="font-semibold text-foreground">6. 服务变更</h2>
        <p>我们保留随时修改或终止服务的权利。如有重大变更，我们将通过应用内通知告知用户。</p>
      </div>
    </div>
  )
}
