const NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export async function generateImages(
  prompt: string,
  count: number = 4,
  width: number = 512,
  height: number = 512
): Promise<string[]> {
  const response = await fetch(`${NIM_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/flux-dev',
      prompt,
      n: count,
      width,
      height,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NIM Image error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.data.map((img: { url: string }) => img.url) as string[];
}

export async function generateImageFromReference(
  prompt: string,
  referenceImageBase64: string,
  width: number = 512,
  height: number = 512
): Promise<string> {
  const response = await fetch(`${NIM_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/flux-canny-dev',
      prompt,
      image: referenceImageBase64,
      strength: 0.75,
      n: 1,
      width,
      height,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NIM Canny error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.data[0].url as string;
}
