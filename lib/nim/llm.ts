const NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(`${NIM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NIM LLM error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content as string;
}
