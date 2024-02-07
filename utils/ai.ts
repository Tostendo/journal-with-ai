import { OpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'
import z from 'zod'
import { Document } from 'langchain/document'
import { JournalEntry } from '@prisma/client'
import { loadQARefineChain } from 'langchain/chains'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    sentimentScore: z
      .number()
      .describe(
        'sentiment of a text rated in a scale from -10 to +10, where -10 is extremely negative, 0 is neutral and +10 is extremely positive.'
      ),
    mood: z
      .string()
      .describe('The mood of the person who wrote that journal entry.'),
    subject: z.string().describe('the subject of the journal entry.'),
    summary: z.string().describe('short summary of the entire entry.'),
    negative: z
      .boolean()
      .describe(
        'is the journal entry negative? (.e. does it contain negative emotions?).'
      ),
    color: z
      .string()
      .describe(
        'a hexadecimal color code that represents the mood of the entry. Example #0101fe for blue representing happiness.'
      ),
  })
)

const getPrompt = async (content: string) => {
  const format_instructions = parser.getFormatInstructions()
  const prompt = new PromptTemplate({
    template:
      'Analyze the following journal entry. Follow the instructions and format your response to match the format instructions, no matter what! \n{format_instructions}\n{entry}',
    inputVariables: ['entry'],
    partialVariables: { format_instructions },
  })

  const input = await prompt.format({
    entry: content,
  })
  console.log(input)
  return input
}

// LLM = large language model
export const analyze = async (content: string) => {
  // temperature of how random it picks results. temperature 0 picks the most likely. Higher temperature makes it more creative.
  // temperature = 1 is ai halluzination. sillyness level.
  const input = await getPrompt(content)
  const model = new OpenAI({
    temperature: 0,
    modelName: 'gpt-3.5-turbo-instruct',
  })
  const result = await model.invoke(input)
  try {
    return parser.parse(result)
  } catch (e) {
    console.log('Could not parse answer: ', e)
  }
  console.log(result)
}

export const qa = async (
  question: string,
  entries: { id: string; content: string; createdAt: Date }[]
) => {
  const docs = entries.map(
    (entry) =>
      new Document({
        pageContent: entry.content,
        metadata: { source: entry.id, date: entry.createdAt },
      })
  )

  const model = new OpenAI({
    temperature: 0,
    modelName: 'gpt-3.5-turbo-instruct',
  })
  const chain = loadQARefineChain(model)
  const embeddings = new OpenAIEmbeddings()
  const store = await MemoryVectorStore.fromDocuments(docs, embeddings)
  const relevantDocs = await store.similaritySearch(question)
  const res = await chain.invoke({
    input_documents: relevantDocs,
    question,
  })
  return res.output_text
}
