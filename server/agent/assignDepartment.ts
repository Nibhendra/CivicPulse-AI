/** Rule-based department assignment from issue category. Mirrors frontend categories.ts. */
export function assignDepartment(aiCategory: string): string {
  const map: Record<string, string> = {
    pothole: 'Roads & Infrastructure',
    broken_road: 'Roads & Infrastructure',
    drain: 'Water & Sewerage',
    water_leak: 'Water & Sewerage',
    garbage: 'Sanitation & Waste Management',
    streetlight: 'Electrical & Lighting',
    public_infra: 'Urban Development',
    other: 'General Administration',
  };
  return map[aiCategory.toLowerCase().replace(/\s+/g, '_')] ?? 'General Administration';
}
