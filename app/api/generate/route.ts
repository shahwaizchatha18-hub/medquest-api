import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const requestSchema = z.object({
  subj: z.string(),
  lo: z.string(),
  topic: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subj, lo, topic } = requestSchema.parse(body);

    const prompt = `You are a medical exam expert. Generate 3 extremely hard clinical scenario MCQs for UHS Year 3 Block 8.

Subject: ${subj}
Learning Outcome: ${lo}
Topic focus: ${topic}

Rules:
- Clinical vignette with patient details
- 4 options labeled 0-3
- Only one correct answer
- Test deep mechanism understanding
- Return ONLY valid JSON array`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0]?.text || '';
    const jsonMatch = text.match(/\[\s\S]*\]/);
    const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return Response.json({ success: true, questions });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}