-- AlterTable
ALTER TABLE "VocabEntry" ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "collocations" JSONB,
ADD COLUMN     "definition" TEXT,
ADD COLUMN     "derivedWords" JSONB,
ADD COLUMN     "example" TEXT,
ADD COLUMN     "exampleCn" TEXT,
ADD COLUMN     "frequency" INTEGER,
ADD COLUMN     "phonetic" TEXT,
ADD COLUMN     "synonyms" JSONB,
ADD COLUMN     "wordType" TEXT;

-- CreateIndex
CREATE INDEX "VocabEntry_frequency_idx" ON "VocabEntry"("frequency");
