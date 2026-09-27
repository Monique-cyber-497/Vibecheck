import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response('Missing API Key', { status: 500 });
    }

    const { messages }: { messages: UIMessage[] } = await req.json();

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: `You are a mood matching assistant. Based on the user's mood, recommend:
- One specific book and its author.
- One specific travel destination, including its country.
- One specific song and its artist.

Use exactly this format, with each recommendation on its own line:

Book: Title by Author
Place: Destination, Country
Song: Title by Artist
Why: Briefly explain how these choices fit the user's mood.

Do not use Markdown, asterisks, or bullet points in the recommendation lines.`,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat route error:', error);
    return new Response('Chat route error', { status: 500 });
  }
}

