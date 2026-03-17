// ─── Database Types ───────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'studio';
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  genre: string | null;
  style: 'manga' | 'western' | 'webtoon';
  status: 'draft' | 'published';
  visibility: 'public' | 'private' | 'marketplace';
  cover_panel_url: string | null;
  script: ComicScript | null;
  page_count: number;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  project_id: string;
  tag: string; // e.g. '@samurai_main'
  name: string;
  type: 'character' | 'background' | 'prop';
  image_url: string;
  reference_url: string | null;
  description: string;
  created_at: string;
}

export interface Page {
  id: string;
  project_id: string;
  page_number: number;
  template_id: 'twobytwo' | 'splash_2' | 'threestrip' | 'full_splash';
  panels: Panel[];
  is_finalized: boolean;
  created_at: string;
}

// ─── Comic Structure Types ────────────────────────────────────────────────────

export interface SpeechBubble {
  id: string;
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  type: 'speech' | 'thought' | 'caption';
  x?: number;
  y?: number;
}

export interface Panel {
  panel_index: number;
  position: 'wide' | 'square' | 'tall';
  image_url: string | null;
  script_ref: string;
  speech_bubbles: SpeechBubble[];
  sfx_text: string | null;
  sfx_x?: number;
  sfx_y?: number;
  active_assets: string[]; // asset tags
}

export interface ScriptLine {
  panel: number;
  type: 'establishing' | 'reaction' | 'closeup' | 'action' | 'dialogue';
  scene: string;
  dialogue: string;
  suggestedAssets: string[];
}

export interface ComicScript {
  title: string;
  script: ScriptLine[];
}

// ─── API Request/Response Types ───────────────────────────────────────────────

export interface GenerateScriptRequest {
  concept: string;
  genre: string;
  style: string;
  pages: number;
  projectId: string;
}

export interface GenerateAssetRequest {
  prompt: string;
  type: 'character' | 'background' | 'prop';
  style: 'manga' | 'western' | 'webtoon';
}

export interface SaveAssetRequest {
  projectId: string;
  tag: string;
  name: string;
  type: 'character' | 'background' | 'prop';
  imageUrl: string;
  description: string;
  referenceUrl?: string;
}

export interface GeneratePanelRequest {
  scriptLine: { scene: string; dialogue: string };
  assets: { tag: string; description: string; imageUrl: string; referenceUrl?: string }[];
  style: 'manga' | 'western' | 'webtoon';
  panelPosition: 'wide' | 'square' | 'tall';
  projectId: string;
  pageId: string;
  panelIndex: number;
}

export interface SavePageRequest {
  projectId: string;
  pageNumber: number;
  templateId: string;
  panels: Panel[];
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export type ComicStyle = 'manga' | 'western' | 'webtoon';
export type ComicGenre = 'Action' | 'Romance' | 'Horror' | 'Sci-Fi' | 'Fantasy' | 'Slice of Life' | 'Comedy';
export type TemplateId = 'twobytwo' | 'splash_2' | 'threestrip' | 'full_splash';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
