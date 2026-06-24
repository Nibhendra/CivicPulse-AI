export const APP_CONFIG = {
  appName: 'CivicPulse AI',
  appDescription:
    'AI-powered civic issue reporting and tracking platform for smarter, cleaner cities.',
  version: '1.0.0',

  // Image constraints
  maxImageSizeKB: 500,
  maxImagesPerIssue: 3,

  // Rate limits
  maxIssuesPerDay: 10,

  // Duplicate detection
  duplicateRadiusMeters: 200,

  // User defaults
  defaultTrustScore: 50,

  // Pagination
  paginationLimit: 20,
} as const;

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || '';
