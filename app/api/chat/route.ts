import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages.map((message: any) => ({
        role: message.role,
        content: message.content,
      })),
      stream: true,
    })

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            controller.enqueue(encoder.encode(content))
          }
          controller.close()
        },
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      }
    )
  } catch (error) {
    console.error('Error en la API de OpenAI:', error)
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 })
  }
}