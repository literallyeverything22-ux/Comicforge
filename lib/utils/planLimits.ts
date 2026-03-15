import type { Profile } from '@/types';

interface PlanLimits {
  maxComicsPerMonth: number;
  maxPanelsPerComic: number;
  allowedTemplates: string[];
  canMakePrivate: boolean;
  hasWatermark: boolean;
  canExportPDF: boolean;
  canListOnMarketplace: boolean;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxComicsPerMonth: 5,
    maxPanelsPerComic: 10,
    allowedTemplates: ['twobytwo', 'threestrip'],
    canMakePrivate: false,
    hasWatermark: true,
    canExportPDF: false,
    canListOnMarketplace: false,
  },
  pro: {
    maxComicsPerMonth: Infinity,
    maxPanelsPerComic: Infinity,
    allowedTemplates: ['twobytwo', 'splash_2', 'threestrip', 'full_splash'],
    canMakePrivate: true,
    hasWatermark: false,
    canExportPDF: true,
    canListOnMarketplace: false,
  },
  studio: {
    maxComicsPerMonth: Infinity,
    maxPanelsPerComic: Infinity,
    allowedTemplates: ['twobytwo', 'splash_2', 'threestrip', 'full_splash'],
    canMakePrivate: true,
    hasWatermark: false,
    canExportPDF: true,
    canListOnMarketplace: true,
  },
};

export function getPlanLimits(plan: Profile['plan']): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

export function checkTemplateAccess(
  plan: Profile['plan'],
  templateId: string
): { allowed: boolean; feature: string } {
  const limits = getPlanLimits(plan);
  if (!limits.allowedTemplates.includes(templateId)) {
    return { allowed: false, feature: 'premium_templates' };
  }
  return { allowed: true, feature: '' };
}

export function checkPanelLimit(
  plan: Profile['plan'],
  currentPanelCount: number
): { allowed: boolean; feature: string } {
  const limits = getPlanLimits(plan);
  if (currentPanelCount >= limits.maxPanelsPerComic) {
    return { allowed: false, feature: 'panel_limit' };
  }
  return { allowed: true, feature: '' };
}
