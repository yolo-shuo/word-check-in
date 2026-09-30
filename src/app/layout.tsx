import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { Providers } from '@/providers'
import { NavbarWrapper } from '@/components/layout/navbar-wrapper'
import { CircleNav } from '@/components/circle-nav'
import { Breadcrumb } from '@/components/breadcrumb'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: '单词打卡 - 和朋友一起坚持学习',
    template: '%s | 单词打卡',
  },
  description: '社区单词打卡应用 - 和朋友一起坚持背单词，记录学习进度，互相鼓励。创建学习圈子，邀请朋友一起打卡，让坚持变得更容易。',
  keywords: ['单词打卡', '英语学习', '学习圈子', '背单词', '四六级', '学习打卡'],
  robots: { index: false, follow: false },
  openGraph: {
    title: '单词打卡 - 和朋友一起坚持学习',
    description: '社区单词打卡应用，和朋友一起坚持背单词',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <NavbarWrapper />
          <Suspense fallback={null}>
            <CircleNav />
            <Breadcrumb />
          </Suspense>
          <main className="min-h-[calc(100vh-10rem)]">
            {children}
          </main>
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  )
}
