import type { ComicStyle } from '@/types';

interface AssetInfo {
  tag: string;
  description: string;
  type: 'character' | 'background' | 'prop';
}

const MANGA_SUFFIX = ', manga illustration style, black and white ink, clean lines, high contrast, professional manga art';
const WESTERN_SUFFIX = ', comic book style, bold outlines, detailed illustration, vibrant';
const WEBTOON_SUFFIX = ', webtoon style, clean lines, pastel colors, digital art';
const QUALITY_SUFFIX = ', professional illustration, detailed, sharp';

export function buildAssetPrompt(userPrompt: string, style: ComicStyle): string {
  const suffix = style === 'manga' ? MANGA_SUFFIX : style === 'western' ? WESTERN_SUFFIX : WEBTOON_SUFFIX;
  return `${userPrompt}${suffix}${QUALITY_SUFFIX}`;
}

export function buildPanelPrompt(
  sceneDescription: string,
  assets: AssetInfo[],
  style: ComicStyle
): string {
  const characters = assets.filter(a => a.type === 'character');
  const backgrounds = assets.filter(a => a.type === 'background');
  const props = assets.filter(a => a.type === 'prop');

  let prompt = sceneDescription;

  if (characters.length > 0) {
    prompt += `, featuring ${characters.map(c => c.description).join(' and ')}`;
  }

  if (backgrounds.length > 0) {
    prompt += `, set in ${backgrounds.map(b => b.description).join(' and ')}`;
  }

  if (props.length > 0) {
    prompt += `, with ${props.map(p => p.description).join(' and ')}`;
  }

  const styleSuffix =
    style === 'manga'
      ? ', manga ink style, black and white, high contrast'
      : style === 'western'
      ? ', comic book art, bold lines, vibrant'
      : ', webtoon style, clean digital art';

  return `${prompt}${styleSuffix}${QUALITY_SUFFIX}`;
}

export function buildScriptPrompt(
  concept: string,
  genre: string,
  style: string,
  pages: number
): string {
  return `Story concept: ${concept}\nGenre: ${genre}\nStyle: ${style}\nNumber of pages: ${pages} (${pages * 3}-${pages * 4} panels total)`;
}
