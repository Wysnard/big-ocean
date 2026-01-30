import { useState, useCallback } from 'react'
// TODO: Migrate to Effect-ts RPC - see use-assessment.ts for pattern
// import { orpc } from '@/orpc/client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface TraitScores {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
  opennessPrecision: number
  conscientiousnessPrecision: number
  extraversionPrecision: number
  agreeablenessPrecision: number
  neuroticismPrecision: number
}

export function useTherapistChat(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [traits, setTraits] = useState<TraitScores | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const sendMessage = useCallback(
    async (userMessage?: string) => {
      if (!sessionId) return

      setIsLoading(true)

      // Add user message if provided
      if (userMessage) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
          },
        ])
      }

      try {
        // TODO: Migrate to Effect-ts RPC - see use-assessment.ts for pattern
        throw new Error('oRPC removed - migrate to Effect-ts RPC')

        // let assistantMessage = ''
        // let currentTraits: TraitScores | null = null

        // // Stream the response
        // for await (const event of await orpc.chat.sendTherapistMessage({
        //   sessionId,
        //   message: userMessage,
        // })) {
        //   if (event.type === 'response') {
        //     assistantMessage += event.chunk
        //   } else if (event.type === 'traits') {
        //     currentTraits = event.traits
        //   } else if (event.type === 'complete') {
        //     currentTraits = event.traits
        //     setIsCompleted(true)
        //   }
        // }

        // // Add assistant message
        // if (assistantMessage) {
        //   setMessages((prev) => [
        //     ...prev,
        //     {
        //       id: `msg-${Date.now()}`,
        //       role: 'assistant',
        //       content: assistantMessage,
        //       timestamp: new Date(),
        //     },
        //   ])
        // }

        // // Update traits
        // if (currentTraits) {
        //   setTraits(currentTraits)
        // }
      } catch (error) {
        console.error('Failed to send message:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [sessionId],
  )

  return {
    messages,
    traits,
    isLoading,
    isCompleted,
    sendMessage,
  }
}
