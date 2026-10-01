'use client'

import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { trpc } from '@/providers/trpc-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Info, Loader2, CheckCircle2, Search, X, Play, Pause, RefreshCw, BookOpen, AlertCircle, Clock, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { skipToken } from '@tanstack/react-query'

const levelMap: Record<string, string> = { CET4: '四级', CET6: '六级', COMBINED: '综合', CUSTOM: '自定义' }
const levelColor: Record<string, string> = { CET4: 'bg-blue-100 text-blue-700', CET6: 'bg-purple-100 text-purple-700', COMBINED: 'bg-green-100 text-green-700', CUSTOM: 'bg-gray-100 text-gray-700' }
const masteryMap: Record<string, string> = { NEW: '新词', LEARNING: '学习中', KNOWN: '认识', MASTERED: '掌握', REVIEWING: '复习' }
const masteryColor: Record<string, string> = { NEW: 'bg-gray-100 text-gray-600', LEARNING: 'bg-yellow-100 text-yellow-700', KNOWN: 'bg-blue-100 text-blue-700', MASTERED: 'bg-green-100 text-green-700', REVIEWING: 'bg-orange-100 text-orange-700' }

function speakWord(text: string, lang: string = 'en-US') {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }
}

function SkeletonLine({ width }: { width: string }) {
  return <div className="h-4 animate-pulse rounded bg-muted" style={{ width }} />
}

function WordCardSkeleton() {
  return (
    <div className="rounded-md border bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <SkeletonLine width="120px" />
          <SkeletonLine width="80px" />
          <SkeletonLine width="200px" />
        </div>
        <div className="flex gap-1">
          <div className="h-6 w-12 animate-pulse rounded bg-muted" />
          <div className="h-6 w-12 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <SkeletonLine width="100%" />
        <SkeletonLine width="80%" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

interface WordCardProps {
  word: any
  onProgressUpdate?: () => void
  showMasteryButtons?: boolean
  onMarked?: () => void
}

function WordCard({ word, onProgressUpdate, showMasteryButtons = true, onMarked }: WordCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const [pronunciation, setPronunciation] = useState('en-US')
  const [loading, setLoading] = useState(false)
  const [justMarked, setJustMarked] = useState<string | null>(null)
  const { mutate: reviewWord, isPending } = trpc.vocabProgress.reviewWord.useMutation()
  const progress = word.progress?.[0]
  const mastery = progress?.mastery || 'NEW'

  const handleReview = useCallback((quality: number, label: string) => {
    if (loading || isPending) return
    setLoading(true)
    reviewWord({ entryId: word.id, quality }, {
      onSuccess: () => {
        setJustMarked(label)
        toast.success('已标记: ' + label)
        onProgressUpdate?.()
        onMarked?.()
        setTimeout(() => setJustMarked(null), 2000)
      },
      onError: (error: any) => {
        toast.error('标记失败: ' + (error?.message || '未知错误'))
      },
      onSettled: () => setLoading(false)
    })
  }, [word.id, loading, isPending, reviewWord, onProgressUpdate, onMarked])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === '1') handleReview(0, '不认识')
      if (e.key === '2') handleReview(3, '模糊')
      if (e.key === '3') handleReview(5, '认识')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleReview])

  return (
    <div className="rounded-md border bg-white p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold">{word.term}</h3>
            {word.phonetic && <span className="text-sm text-muted-foreground">/{word.phonetic}/</span>}
            <button onClick={() => speakWord(word.term, pronunciation)} className="text-blue-500 hover:text-blue-700 transition-colors" title="点击发音">
              <Volume2 size={16} />
            </button>
            <select value={pronunciation} onChange={(e) => setPronunciation(e.target.value)} className="text-xs rounded border border-input bg-background px-1 py-0.5" title="选择发音">
              <option value="en-US">美音</option>
              <option value="en-GB">英音</option>
            </select>
            {word.wordType && <span className="text-xs text-muted-foreground">{word.wordType}</span>}
          </div>
          {word.definition && <p className="mt-1 text-sm">{word.definition}</p>}
          {word.englishDefinition && <p className="mt-1 text-sm text-muted-foreground">{word.englishDefinition}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={'rounded px-2 py-1 text-xs font-medium ' + (levelColor[word.level] || 'bg-gray-100')}>{levelMap[word.level]}</span>
          <span className={'rounded px-2 py-1 text-xs font-medium ' + masteryColor[mastery]}>{masteryMap[mastery]}</span>
          {word.frequency && <span className="rounded px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700" title={'词频排名: ' + word.frequency + '/100'}>词频{word.frequency}</span>}
        </div>
      </div>
      {word.example && (
        <div className="mt-2 bg-muted rounded p-2">
          <p className="text-sm italic">"{word.example}"</p>
          {word.exampleCn && <p className="text-xs text-muted-foreground mt-1">{word.exampleCn}</p>}
        </div>
      )}
      <button onClick={() => setShowDetail(!showDetail)} className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        {showDetail ? '收起详情 ▲' : '展开详情 ▼'}
      </button>
      {showDetail && (
        <div className="mt-2 space-y-2 rounded-md bg-muted/50 p-3 text-sm">
          {word.collocations && <div><span className="font-medium text-muted-foreground">常用搭配：</span><span>{Array.isArray(word.collocations) ? word.collocations.join(', ') : JSON.stringify(word.collocations)}</span></div>}
          {word.synonyms && <div><span className="font-medium text-muted-foreground">同义词：</span><span>{Array.isArray(word.synonyms) ? word.synonyms.join(', ') : JSON.stringify(word.synonyms)}</span></div>}
          {word.antonyms && <div><span className="font-medium text-muted-foreground">反义词：</span><span>{Array.isArray(word.antonyms) ? word.antonyms.join(', ') : JSON.stringify(word.antonyms)}</span></div>}
          {word.derivedWords && <div><span className="font-medium text-muted-foreground">派生词：</span><span>{Array.isArray(word.derivedWords) ? word.derivedWords.join(', ') : JSON.stringify(word.derivedWords)}</span></div>}
          {word.confusionWords && <div><span className="font-medium text-muted-foreground">易混词：</span><span>{Array.isArray(word.confusionWords) ? word.confusionWords.join(', ') : JSON.stringify(word.confusionWords)}</span></div>}
          {word.commonErrors && <div><span className="font-medium text-muted-foreground">常见错误：</span><span>{Array.isArray(word.commonErrors) ? word.commonErrors.join(', ') : JSON.stringify(word.commonErrors)}</span></div>}
          {word.audioUrl && <div className="flex items-center gap-2"><span className="font-medium text-muted-foreground">真人发音：</span><audio controls src={word.audioUrl} className="h-8" /></div>}
          {word.frequency && <div><span className="font-medium text-muted-foreground">词频排名：</span><span>第 {word.frequency} 高频词（1-100，数字越小越常用）</span></div>}
          {progress?.reviewCount != null && progress.reviewCount > 0 && <div><span className="font-medium text-muted-foreground">复习次数：</span><span>{progress.reviewCount} 次</span></div>}
          {progress?.nextReviewAt && <div><span className="font-medium text-muted-foreground">下次复习：</span><span>{new Date(progress.nextReviewAt).toLocaleDateString('zh-CN')}</span></div>}
        </div>
      )}
      {showMasteryButtons && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleReview(0, '不认识')} disabled={loading || isPending} className={justMarked === '不认识' ? 'bg-red-100 text-red-700 border-red-300' : ''} title="快捷键: 1">
            {loading ? <Loader2 className="mr-1 animate-spin" size={14} /> : null}
            {justMarked === '不认识' ? <CheckCircle2 className="mr-1" size={14} /> : null}
            不认识
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleReview(3, '模糊')} disabled={loading || isPending} className={justMarked === '模糊' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : ''} title="快捷键: 2">
            {loading ? <Loader2 className="mr-1 animate-spin" size={14} /> : null}
            {justMarked === '模糊' ? <CheckCircle2 className="mr-1" size={14} /> : null}
            模糊
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleReview(5, '认识')} disabled={loading || isPending} className={justMarked === '认识' ? 'bg-green-100 text-green-700 border-green-300' : 'text-green-600'} title="快捷键: 3">
            {loading ? <Loader2 className="mr-1 animate-spin" size={14} /> : null}
            {justMarked === '认识' ? <CheckCircle2 className="mr-1" size={14} /> : null}
            认识
          </Button>
        </div>
      )}
    </div>
  )
}

function VocabPageContent() {
  const searchParams = useSearchParams()
  const circleId = searchParams.get('circle') || ''
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [selectedVersion, setSelectedVersion] = useState<string>('')
  const [masteryFilter, setMasteryFilter] = useState<string>('')
  const [skip, setSkip] = useState(0)
  const [showAbout, setShowAbout] = useState(false)
  const [studyMode, setStudyMode] = useState<'list' | 'study'>('list')
  const [studyIndex, setStudyIndex] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: versions, isLoading: versionsLoading, isError: versionsError, refetch: refetchVersions } = trpc.vocab.listVersions.useQuery({ isActive: true })
  const { data: stats, refetch: refetchStats } = trpc.vocabProgress.getProgressStats.useQuery(selectedVersion ? { versionId: selectedVersion } : skipToken)
  const { data: reviewQueue, refetch: refetchQueue } = trpc.vocabProgress.getReviewQueue.useQuery(selectedVersion ? { versionId: selectedVersion, take: 20 } : skipToken)
  const { data: wordsWithProgress, isLoading: wordsLoading, isError: wordsError, refetch: refetchWords } = trpc.vocabProgress.getWordsWithProgress.useQuery(selectedVersion ? { versionId: selectedVersion, skip, take: 50, mastery: masteryFilter ? masteryFilter as 'NEW' | 'LEARNING' | 'KNOWN' | 'MASTERED' | 'REVIEWING' : undefined } : skipToken)
  const { data: searchResults, isLoading: searchLoading, isError: searchError } = trpc.vocab.search.useQuery(debouncedTerm && debouncedTerm.length >= 1 ? { term: debouncedTerm, level: levelFilter as 'CET4' | 'CET6' | 'COMBINED' | 'CUSTOM' | undefined, skip, take: 50 } : skipToken)

  const handleProgressUpdate = useCallback(() => {
    refetchStats()
    if (selectedVersion) { refetchWords(); refetchQueue() }
  }, [refetchStats, refetchWords, refetchQueue, selectedVersion])

  const currentStudyWord = studyMode === 'study' ? (wordsWithProgress?.entries?.[studyIndex] || null) : null
  const selectedVersionInfo = versions?.find((v) => v.id === selectedVersion)
  const pageState = versionsLoading ? 'loading' : versionsError ? 'error' : versions && versions.length === 0 ? 'no-libraries' : !selectedVersion ? 'no-selection' : 'selected'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">词库</h1>
          <p className="text-sm text-muted-foreground">选择词库并持续学习，掌握情况会自动记录</p>
        </div>
        <div className="flex gap-2">
          {selectedVersion && (
            <Button variant={studyMode === 'study' ? 'default' : 'outline'} size="sm" onClick={() => setStudyMode(studyMode === 'study' ? 'list' : 'study')}>
              {studyMode === 'study' ? <Pause className="mr-1" size={14} /> : <Play className="mr-1" size={14} />}
              {studyMode === 'study' ? '退出学习' : '开始学习'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowAbout(!showAbout)}>
            <Info className="mr-1" size={14} /> 关于词库
          </Button>
        </div>
      </div>
      {showAbout && (
        <div className="mb-6 rounded-md bg-muted/50 p-4 text-sm">
          <p className="font-medium text-foreground">词库说明</p>
          <div className="mt-2 space-y-2 text-muted-foreground">
            <p><strong>数据来源：</strong>基于 CET 官方大纲整理，包含中小学基础词汇和四六级核心词汇。</p>
            <p><strong>词库类型：</strong>基础词库（小学/初中）、四级词库、六级词库、综合词库。</p>
            <p><strong>学习进度：</strong>每个词库独立记录学习进度，切换词库不会混淆。</p>
            <p><strong>掌握程度：</strong>新词 → 学习中 → 认识 → 掌握。连续标记"认识" 5 次以上自动升级为"掌握"。</p>
            <p><strong>快捷键：</strong>按 1（不认识）、2（模糊）、3（认识）快速标记。</p>
          </div>
          <button onClick={() => setShowAbout(false)} className="mt-2 text-primary hover:underline">关闭</button>
        </div>
      )}
      {pageState === 'loading' && (
        <div className="space-y-3">
          <WordCardSkeleton />
          <WordCardSkeleton />
          <div className="text-center text-sm text-muted-foreground py-4">
            <Loader2 className="inline animate-spin mr-1" size={14} /> 正在加载词库...
          </div>
        </div>
      )}
      {pageState === 'error' && (
        <Card><CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
          <p className="text-lg font-medium">词库加载失败</p>
          <p className="text-sm text-muted-foreground mt-1">请检查网络连接后重试</p>
          <Button className="mt-4" onClick={() => refetchVersions()}><RefreshCw className="mr-1" size={14} /> 重试</Button>
        </CardContent></Card>
      )}
      {pageState === 'no-libraries' && (
        <Card><CardContent className="py-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-lg font-medium">还没有可用的词库</p>
          <p className="text-sm text-muted-foreground mt-1">创建一个词库，或导入一份词表开始学习</p>
          <div className="mt-4 flex justify-center gap-2"><Button>创建词库</Button><Button variant="outline">导入词表</Button></div>
        </CardContent></Card>
      )}
      {pageState === 'no-selection' && versions && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">选择一个词库开始学习</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {versions.map((v) => {
              const entryCount = (v as any)._count?.entries || v.entryCount || 0
              return (
                <Card key={v.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{v.name}</h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={'rounded px-2 py-0.5 text-xs font-medium ' + (levelColor[v.level] || 'bg-gray-100')}>{levelMap[v.level]}</span>
                          <span className="text-xs text-muted-foreground">v{v.version}</span>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-muted-foreground">{entryCount}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">独立词目数：{entryCount}</p>
                    {v.source && <p className="mt-1 text-xs text-muted-foreground">来源: {v.source}</p>}
                    {v.importDate && <p className="mt-1 text-xs text-muted-foreground">更新于: {new Date(v.importDate).toLocaleDateString('zh-CN')}</p>}
                    <Button className="mt-3 w-full" onClick={() => { setSelectedVersion(v.id); setSkip(0); setStudyMode('list') }}>选择此词库</Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
      {pageState === 'selected' && selectedVersionInfo && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5" /> {selectedVersionInfo.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedVersion('')}><ChevronLeft className="mr-1" size={14} /> 切换词库</Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <span className={'rounded px-2 py-1 text-xs font-medium ' + (levelColor[selectedVersionInfo.level] || 'bg-gray-100')}>{levelMap[selectedVersionInfo.level]}</span>
                <span className="text-sm text-muted-foreground">v{selectedVersionInfo.version}</span>
                <span className="text-sm text-muted-foreground">独立词目: {(selectedVersionInfo as any)._count?.entries || selectedVersionInfo.entryCount || 0}</span>
              </div>
              {stats && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {(['NEW', 'LEARNING', 'KNOWN', 'MASTERED'] as const).map((m) => (
                    <div key={m} className="rounded-md bg-muted p-2 text-center">
                      <div className="text-lg font-bold">{stats.masteryStats[m] || 0}</div>
                      <div className="text-xs text-muted-foreground">{masteryMap[m]}</div>
                    </div>
                  ))}
                </div>
              )}
              {reviewQueue && reviewQueue.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-orange-600"><Clock className="h-4 w-4" /> <span>今日待复习: {reviewQueue.length} 词</span></div>
              )}
            </CardContent>
          </Card>
          {studyMode === 'study' && currentStudyWord && (
            <Card className="border-2 border-primary">
              <CardHeader className="flex flex-row items-center justify-between bg-primary/5">
                <CardTitle className="text-lg flex items-center gap-2"><Play className="h-5 w-5" /> 连续学习模式</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{studyIndex + 1} / {wordsWithProgress?.entries?.length || 0}</span>
                  <Button size="sm" variant="outline" onClick={() => setStudyMode('list')}><X size={14} /> 退出</Button>
                </div>
              </CardHeader>
              <CardContent>
                <WordCard word={currentStudyWord} onProgressUpdate={handleProgressUpdate} onMarked={() => { setTimeout(() => setStudyIndex(studyIndex + 1), 1000) }} />
                <div className="mt-4 flex justify-between">
                  <Button size="sm" variant="outline" onClick={() => setStudyIndex(Math.max(0, studyIndex - 1))} disabled={studyIndex === 0}><ChevronLeft className="mr-1" size={14} /> 上一个</Button>
                  <span className="text-sm text-muted-foreground flex items-center">
                    <span className="inline-block w-32 h-2 bg-muted rounded-full mr-2"><span className="block h-2 bg-primary rounded-full transition-all" style={{ width: ((studyIndex + 1) / (wordsWithProgress?.entries?.length || 1)) * 100 + '%' }} /></span>
                  </span>
                  <Button size="sm" variant="outline" onClick={() => setStudyIndex(Math.min((wordsWithProgress?.entries?.length || 1) - 1, studyIndex + 1))} disabled={studyIndex >= (wordsWithProgress?.entries?.length || 1) - 1}>下一个 <ChevronRight className="ml-1" size={14} /></Button>
                </div>
                {studyIndex + 1 >= (wordsWithProgress?.entries?.length || 0) && (
                  <div className="mt-4 rounded-md bg-green-50 p-4 text-center">
                    <p className="text-lg font-bold text-green-700">本轮学习完成！</p>
                    <p className="text-sm text-green-600 mt-1">已学习 {wordsWithProgress?.entries?.length || 0} 个单词，继续保持！</p>
                    <Button className="mt-3" onClick={() => { setStudyIndex(0); setSkip(0); refetchWords() }}>重新开始</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Search className="h-5 w-5" /> 在当前词库中搜索</CardTitle>
              {searchTerm && <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setDebouncedTerm('') }}><X className="mr-1" size={14} /> 清除</Button>}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input ref={searchRef} placeholder="搜索单词、释义或词根..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSkip(0) }} className="pl-9" />
                </div>
                <select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setSkip(0) }} className="h-9 rounded-md border border-input bg-background px-3 text-sm" title="按考试级别筛选">
                  <option value="">全部级别</option>
                  <option value="CET4">四级</option>
                  <option value="CET6">六级</option>
                </select>
              </div>
              {searchTerm.length > 0 && searchTerm.length < 2 && <p className="text-xs text-orange-600">请输入至少两个字符</p>}
              {searchLoading && <div className="space-y-2"><WordCardSkeleton /><WordCardSkeleton /></div>}
              {searchError && <div className="flex flex-col items-center py-4"><AlertCircle className="h-6 w-6 text-red-500 mb-2" /><p className="text-sm text-muted-foreground">搜索失败，请检查网络后重试</p><Button size="sm" className="mt-2" onClick={() => refetchVersions()}><RefreshCw className="mr-1" size={14} /> 重新搜索</Button></div>}
              {searchResults && searchResults.entries.length > 0 && (
                <div className="space-y-2">
                  {searchResults.entries.map((e: any) => <WordCard key={e.id} word={e} onProgressUpdate={handleProgressUpdate} />)}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-muted-foreground">共 {searchResults.total} 条结果</span>
                    {searchResults.total > 50 && <Button size="sm" onClick={() => setSkip(skip + 50)} disabled={searchResults.entries.length < 50}>加载更多</Button>}
                  </div>
                </div>
              )}
              {searchResults && searchResults.entries.length === 0 && debouncedTerm.length >= 2 && <div className="flex flex-col items-center py-6"><Search className="h-8 w-8 text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">没有找到匹配的词条</p><p className="text-xs text-muted-foreground mt-1">建议检查拼写或切换考试级别</p></div>}
            </CardContent>
          </Card>
          {studyMode === 'list' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">词条列表</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <select value={masteryFilter} onChange={(e) => { setMasteryFilter(e.target.value); setSkip(0) }} className="h-9 rounded-md border border-input bg-background px-2 text-sm" title="按学习状态筛选">
                    <option value="">全部状态</option>
                    <option value="NEW">新词</option>
                    <option value="LEARNING">学习中</option>
                    <option value="KNOWN">认识</option>
                    <option value="MASTERED">掌握</option>
                    <option value="REVIEWING">复习</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {wordsLoading && <div className="space-y-3"><WordCardSkeleton /><WordCardSkeleton /><WordCardSkeleton /><div className="text-center text-sm text-muted-foreground py-2"><Loader2 className="inline animate-spin mr-1" size={14} /> 正在加载词条...</div></div>}
                {wordsError && <div className="flex flex-col items-center py-8"><AlertCircle className="h-10 w-10 text-red-500 mb-3" /><p className="text-sm text-muted-foreground">词条加载失败</p><p className="text-xs text-muted-foreground mt-1">可能是网络问题或服务器错误</p><Button size="sm" className="mt-3" onClick={() => refetchWords()}><RefreshCw className="mr-1" size={14} /> 重试</Button></div>}
                {wordsWithProgress && !wordsLoading && (
                  <>
                    {wordsWithProgress.entries.length > 0 ? <div className="space-y-3">{wordsWithProgress.entries.map((e: any) => <WordCard key={e.id} word={e} onProgressUpdate={handleProgressUpdate} />)}</div> : <div className="flex flex-col items-center py-8"><BookOpen className="h-10 w-10 text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">{masteryFilter ? '当前筛选条件下暂无词条' : '暂无词条'}</p>{masteryFilter && <Button size="sm" variant="outline" className="mt-2" onClick={() => setMasteryFilter('')}>清除筛选</Button>}</div>}
                    {wordsWithProgress.entries.length > 0 && <div className="mt-3 flex justify-between items-center"><span className="text-sm text-muted-foreground">共 {wordsWithProgress.total} 条</span><div className="flex gap-2"><Button size="sm" onClick={() => setSkip(Math.max(0, skip - 50))} disabled={skip === 0}>上一页</Button><Button size="sm" onClick={() => setSkip(skip + 50)} disabled={wordsWithProgress.entries.length < 50}>下一页</Button></div></div>}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default function VocabPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
      <VocabPageContent />
    </Suspense>
  )
}