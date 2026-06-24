import type { IssueCategory } from '@/types/issue';

export interface CategoryConfig {
  id: IssueCategory;
  label: string;
  icon: string;
  color: string;
  department: string;
}

export const ISSUE_CATEGORIES: CategoryConfig[] = [
  {
    id: 'pothole',
    label: 'Pothole',
    icon: 'CircleAlert',
    color: 'text-orange-500',
    department: 'Roads & Infrastructure',
  },
  {
    id: 'drain',
    label: 'Drainage / Sewage',
    icon: 'Waves',
    color: 'text-cyan-500',
    department: 'Water & Sewerage',
  },
  {
    id: 'garbage',
    label: 'Garbage / Waste',
    icon: 'Trash2',
    color: 'text-green-500',
    department: 'Sanitation & Waste Management',
  },
  {
    id: 'water_leak',
    label: 'Water Leak',
    icon: 'Droplets',
    color: 'text-blue-500',
    department: 'Water & Sewerage',
  },
  {
    id: 'streetlight',
    label: 'Streetlight',
    icon: 'Lightbulb',
    color: 'text-yellow-500',
    department: 'Electrical & Lighting',
  },
  {
    id: 'broken_road',
    label: 'Broken Road',
    icon: 'Construction',
    color: 'text-red-500',
    department: 'Roads & Infrastructure',
  },
  {
    id: 'public_infra',
    label: 'Public Infrastructure',
    icon: 'Building2',
    color: 'text-purple-500',
    department: 'Urban Development',
  },
  {
    id: 'other',
    label: 'Other',
    icon: 'MoreHorizontal',
    color: 'text-slate-500',
    department: 'General Administration',
  },
];

export const DEPARTMENTS = [
  'Roads & Infrastructure',
  'Water & Sewerage',
  'Sanitation & Waste Management',
  'Electrical & Lighting',
  'Urban Development',
  'General Administration',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export function getCategoryById(id: IssueCategory): CategoryConfig | undefined {
  return ISSUE_CATEGORIES.find((cat) => cat.id === id);
}
