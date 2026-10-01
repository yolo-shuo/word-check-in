import { PrismaClient, VocabLevel } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// ===== KyleBing Vocabulary Data =====

interface KyleBingEntry {
  word: string
  translations: Array<{ translation: string; type: string }>
  phrases?: Array<{ phrase: string; translation: string }>
}

interface VocabEntryData {
  term: string
  phonetic: string
  definition: string
  englishDefinition: string
  example: string
  exampleCn: string
  wordType: string
  collocations: string[]
  synonyms: string[]
  antonyms: string[]
  derivedWords: string[]
  confusionWords: string[]
  commonErrors: string[]
  audioUrl: string | null
  frequency: number
  level: string
  orderIndex: number
}

function processKyleBingWords(data: KyleBingEntry[], level: string): VocabEntryData[] {
  const wordMap = new Map<string, VocabEntryData>()
  
  data.forEach((entry, index) => {
    const word = entry.word.toLowerCase()
    const translation = entry.translations?.[0]?.translation || ''
    const wordType = entry.translations?.[0]?.type || ''
    const phrases = entry.phrases || []
    
    const frequency = Math.min(100, Math.max(1, Math.ceil((index + 1) / data.length * 100)))
    
    if (!wordMap.has(word)) {
      wordMap.set(word, {
        term: entry.word,
        phonetic: '',
        definition: translation,
        englishDefinition: '',
        example: phrases[0]?.phrase || '',
        exampleCn: phrases[0]?.translation || '',
        wordType: wordType,
        collocations: phrases.length > 0 ? phrases.map(p => p.phrase + ' (' + p.translation + ')') : [],
        synonyms: [],
        antonyms: [],
        derivedWords: [],
        confusionWords: [],
        commonErrors: [],
        audioUrl: null,
        frequency: frequency,
        level: level,
        orderIndex: index
      })
    }
  })
  
  return [...wordMap.values()]
}

async function main() {
  console.log('Importing KyleBing vocabulary data...')
  
  // Read JSON files
  const cet4Path = path.join(process.cwd(), 'cet4.json')
  const cet6Path = path.join(process.cwd(), 'cet6.json')
  
  if (!fs.existsSync(cet4Path) || !fs.existsSync(cet6Path)) {
    console.error('Error: cet4.json and cet6.json files not found')
    process.exit(1)
  }
  
  const cet4Data = JSON.parse(fs.readFileSync(cet4Path, 'utf8'))
  const cet6Data = JSON.parse(fs.readFileSync(cet6Path, 'utf8'))
  
  console.log('CET4 entries:', cet4Data.length)
  console.log('CET6 entries:', cet6Data.length)
  
  // Process KyleBing words
  const cet4Words = processKyleBingWords(cet4Data, 'CET4')
  const cet6Words = processKyleBingWords(cet6Data, 'CET6')
  
  // Create combined list (KyleBing CET4 + CET6)
  const combinedMap = new Map<string, VocabEntryData>()
  cet4Words.forEach(w => combinedMap.set(w.term.toLowerCase(), w))
  cet6Words.forEach(w => {
    if (!combinedMap.has(w.term.toLowerCase())) {
      combinedMap.set(w.term.toLowerCase(), w)
    }
  })
  const combinedWords = [...combinedMap.values()]
  
  console.log('CET4 unique words:', cet4Words.length)
  console.log('CET6 unique words:', cet6Words.length)
  console.log('Combined unique words:', combinedWords.length)
  
  // Clean old data (handle foreign key constraints)
  console.log('Cleaning old data...')
  
  // Delete related checkins first
  await prisma.checkin.deleteMany({
    where: { vocabVersion: { name: { in: ['四级词库', '六级词库', '四六级综合词库', '基础词库（小学/初中）'] } } }
  })
  
  // Delete related checkin drafts
  await prisma.checkinDraft.deleteMany({
    where: { vocabVersion: { name: { in: ['四级词库', '六级词库', '四六级综合词库', '基础词库（小学/初中）'] } } }
  })
  
  // Delete vocab entries
  await prisma.vocabEntry.deleteMany({
    where: { version: { name: { in: ['四级词库', '六级词库', '四六级综合词库', '基础词库（小学/初中）'] } } }
  })
  
  // Delete vocab versions
  await prisma.vocabVersion.deleteMany({
    where: { name: { in: ['四级词库', '六级词库', '四六级综合词库', '基础词库（小学/初中）'] } }
  })
  
  // Create versions
  const versions = [
    { name: '四级词库', level: VocabLevel.CET4, words: cet4Words },
    { name: '六级词库', level: VocabLevel.CET6, words: cet6Words },
    { name: '四六级综合词库', level: VocabLevel.COMBINED, words: combinedWords }
  ]
  
  for (const v of versions) {
    console.log('Creating ' + v.name + '...')
    const version = await prisma.vocabVersion.create({
      data: {
        name: v.name,
        level: v.level,
        version: '2.0',
        source: 'KyleBing/english-vocabulary',
        isActive: true,
        importDate: new Date(),
        entryCount: v.words.length
      }
    })
    
    // Split into batches of 1000 to avoid timeout
    for (let i = 0; i < v.words.length; i += 1000) {
      const batch = v.words.slice(i, i + 1000).map((word, idx) => ({
        term: word.term,
        phonetic: word.phonetic,
        definition: word.definition,
        englishDefinition: word.englishDefinition,
        example: word.example,
        exampleCn: word.exampleCn,
        wordType: word.wordType,
        collocations: JSON.stringify(word.collocations),
        synonyms: JSON.stringify(word.synonyms),
        antonyms: JSON.stringify(word.antonyms),
        derivedWords: JSON.stringify(word.derivedWords),
        confusionWords: JSON.stringify(word.confusionWords),
        commonErrors: JSON.stringify(word.commonErrors),
        audioUrl: word.audioUrl,
        frequency: word.frequency,
        level: word.level,
        orderIndex: i + idx,
        versionId: version.id
      }))
      
      await prisma.vocabEntry.createMany({ data: batch })
    }
    
    console.log('  Created ' + v.words.length + ' entries')
  }
  
  console.log('')
  console.log('=== Import Summary ===')
  console.log('四级词库: ' + cet4Words.length + ' words')
  console.log('六级词库: ' + cet6Words.length + ' words')
  console.log('综合词库: ' + combinedWords.length + ' words (CET4 + CET6, deduplicated)')
  console.log('')
  console.log('Total entries: ' + (cet4Words.length + cet6Words.length + combinedWords.length))
  console.log('Unique in combined: ' + combinedWords.length + ' words')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
