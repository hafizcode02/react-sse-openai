import { createParser } from "eventsource-parser"

export const config = {
    runtime: 'edge',
}

export default async (req: Request) => {

    if (req.method == 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS, POST, PUT, DELETE, PATCH',
                'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
                'ACCESS-CONTROL-ALLOW-CREDENTIALS': 'true'
            },
        })
    }


    const { content } = await req.json() as { content: string }

    const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization:
                    'Bearer ' + process.env.OPENAI_API_KEY,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant.',
                    },
                    {
                        role: 'user',
                        content: content,
                    },
                ],
                stream: true,
            }),
        }
    )

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const customReadable = new ReadableStream({
        async start(controller) {
            function onParse(event) {
                if (event.type == 'event') {
                    const data = event.data
                    if (data == '[Done]') {
                        controller.enqueue(encoder.encode(data))
                    }
                }
            }

            const parser = createParser(onParse)
            for await (const chunck of response.body as any) {
                parser.feed(decoder.decode(chunck))
            }
        }
    })

    const transformStream = new TransformStream({
        async transform(chunk, controller) {
            const content = decoder.decode(chunk)
            if (content == '[Done]') {
                controller.terminate()
                return
            }
            const results = JSON.parse(content)
            const contentText = results.choices?.[0].delta?.content
            if (contentText) {
                controller.enqueue(encoder.encode(contentText))
            }

        }
    })

    return new Response(customReadable.pipeThrough(transformStream));
}