
export async function generateImages(
  prompt: string,
  count: number = 4,
  width: number = 1024,
  height: number = 1024
): Promise<string[]> {
  // SDXL on NIM only generates 1 image per request, so we do Promise.all
  const promises = Array(count).fill(0).map(async (_, i) => {
    const response = await fetch(`https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt, weight: 1 }],
        cfg_scale: 7,
        sampler: 'K_DPM_2_ANCESTRAL',
        seed: i, // different seed for each variation
        steps: 25,
        width,
        height,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`NIM SDXL error ${response.status}: ${err}`);
    }

    const data = await response.json();
    if (!data.artifacts?.[0]?.base64) throw new Error('No image returned from NIM');
    
    // Convert base64 to data URL
    return `data:image/jpeg;base64,${data.artifacts[0].base64}`;
  });

  return Promise.all(promises);
}

export async function generateImageFromReference(
  prompt: string,
  referenceImageBase64: string,
  width: number = 1024,
  height: number = 1024
): Promise<string> {
  // Use image-to-image with SDXL
  // The referenceImageBase64 usually includes "data:image/jpeg;base64,", so we strip it for the API
  const b64Data = referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  const response = await fetch(`https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      text_prompts: [{ text: prompt, weight: 1 }],
      init_image: b64Data,
      init_image_mode: 'IMAGE_STRENGTH',
      image_strength: 0.35, // 0 to 1, higher means closer to original
      cfg_scale: 7,
      sampler: 'K_DPM_2_ANCESTRAL',
      seed: 0,
      steps: 25,
      width,
      height,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NIM SDXL I2I error ${response.status}: ${err}`);
  }

  const data = await response.json();
  if (!data.artifacts?.[0]?.base64) throw new Error('No image returned from NIM');
  
  return `data:image/jpeg;base64,${data.artifacts[0].base64}`;
}

