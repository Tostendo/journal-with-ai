import { analyze } from '@/utils/ai'
import { getUserByClerkId } from '@/utils/auth'
import { prisma } from '@/utils/db'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { useReducer } from 'react'

export const PATCH = async (request: Request, { params }: any) => {
  const { content } = await request.json()
  const user = await getUserByClerkId()
  const updatedEntry = await prisma.journalEntry.update({
    where: {
      userId_id: {
        userId: user.id,
        id: params.id,
      },
    },
    data: {
      content,
    },
  })
  const updatedAnalysis = await analyze(updatedEntry.content)
  const updated = await prisma.analysis.upsert({
    where: {
      entryId: updatedEntry.id,
    },
    // @ts-ignore
    create: {
      userId: user.id,
      entryId: updatedEntry.id,
      ...updatedAnalysis,
    },
    update: {
      ...updatedAnalysis,
    },
  })
  return NextResponse.json({
    data: { ...updatedEntry, analysis: updated },
  })
}
