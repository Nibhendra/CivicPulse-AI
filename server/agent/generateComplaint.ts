/**
 * Standalone complaint generation.
 * Returns the Gemini-generated complaint if already available,
 * otherwise builds a structured template — no extra Gemini call.
 */
export function ensureFormalComplaint(
  existingComplaint: string | null | undefined,
  params: {
    title: string;
    description: string;
    category: string;
    address: string;
    locality: string;
    latitude: number;
    longitude: number;
    department: string;
  }
): string {
  if (existingComplaint && existingComplaint.trim().length > 100) {
    return existingComplaint.trim();
  }

  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `To,
The Head,
${params.department} Department,
Municipal Corporation

Date: ${today}

Subject: Urgent Complaint Regarding ${params.title} at ${params.address}

Respected Sir/Madam,

I am writing to report a civic issue that urgently requires your department's attention at the following location:

Location: ${params.address}, ${params.locality}
GPS Coordinates: ${params.latitude.toFixed(6)}°N, ${params.longitude.toFixed(6)}°E
Issue Type: ${params.category.replace(/_/g, ' ').toUpperCase()}

Issue Description:
${params.description}

This issue poses a risk to public safety and daily life in the area. I respectfully request that your department:

1. Inspect the site at the earliest convenience.
2. Take necessary corrective action within a reasonable timeframe.
3. Provide an update on the status of the complaint.

This complaint has been formally registered on the CivicPulse AI platform with photographic evidence and GPS location for your reference.

I trust that your department will address this matter promptly.

Yours faithfully,
A Concerned Citizen
(Submitted via CivicPulse AI — Civic Issue Reporting Platform)`;
}
