'use client'

import { getAnswers } from '@/utils/api'
import { useState } from 'react'

const Question = () => {
  const [value, setValue] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    setIsLoading(true)
    e.preventDefault()
    const answer = await getAnswers(value)
    setAnswer(answer)
    setValue('')
    setIsLoading(false)
  }
  const onChange = (e: any) => {
    setValue(e.target.value)
  }
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          disabled={isLoading}
          type="text"
          onChange={onChange}
          value={value}
          placeholder="Ask a question"
          className="border border-black/20 px-4 py-2 text-lg rounded-lg"
        />
        <button
          disabled={isLoading}
          type="submit"
          className="bg-blue-400 px-4 py-2 rounde-lg text-lg"
        >
          Ask
        </button>
      </form>
      {isLoading && <div>loading...</div>}
      {!isLoading && answer && (
        <div className="p-4 bg-green/10 rounded-lg">{answer}</div>
      )}
    </div>
  )
}

export default Question
