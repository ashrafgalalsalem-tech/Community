/**
 * Input Sanitization, Security Guards & CSV Protection
 * Designed for Healthcare Executive Governance & Patient Data Protection
 */

// Escape HTML characters to prevent XSS / script injection
export function sanitizeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/javascript:/gi, '')
    .trim();
}

// Strip forbidden patterns & control characters
export function cleanPlainText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove non-printable control characters
    .trim();
}

/**
 * Healthcare Data Safety & PHI Guard
 * Scans content for accidental patient-identifiable data, MRNs, medical record numbers,
 * or raw clinical case identifiers that breach HIPAA/Egyptian Medical Syndicate privacy laws.
 */
export interface SafetyCheckResult {
  isSafe: boolean;
  reason?: string;
}

const PHI_PATTERNS = [
  { pattern: /\b(MRN|mrn|medical\s*record\s*(?:no|number)?)\s*[:#]?\s*\d{4,12}\b/i, name: 'Medical Record Number (MRN)' },
  { pattern: /\b(patient\s*name|pt\s*name)\s*[:=]\s*[A-Z][a-z]+/i, name: 'Patient Identification' },
  { pattern: /\b(national\s*id|id\s*number)\s*[:#]?\s*\d{14}\b/i, name: 'Egyptian National ID' },
  { pattern: /\b(ssn|social\s*security)\s*[:#]?\s*\d{3}-\d{2}-\d{4}\b/i, name: 'Social Security Number' },
  { pattern: /\b(diagnosis|dx)\s*[:=]\s*(?:confidential|patient\s+specific)/i, name: 'Confidential Patient Diagnosis' },
];

export function inspectHealthcareContent(content: string): SafetyCheckResult {
  if (!content || content.trim().length === 0) {
    return { isSafe: false, reason: 'Content cannot be empty.' };
  }

  // Check for script tags or dangerous protocol
  if (/<script|eval\(|javascript:/i.test(content)) {
    return { isSafe: false, reason: 'Malicious scripts or code tags are strictly forbidden.' };
  }

  // Check for PHI / Patient-Identifiable Information
  for (const { pattern, name } of PHI_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isSafe: false,
        reason: `Potential Protected Health Information (${name}) detected. Please keep discussions on strategic healthcare leadership and remove any patient-specific identifiers.`,
      };
    }
  }

  // Anti-Spam repetition check
  if (/(.)\1{12,}/.test(content)) {
    return { isSafe: false, reason: 'Excessive repetitive characters detected (spam protection).' };
  }

  return { isSafe: true };
}

/**
 * Safe CSV Exporter: Defends against Formula Injection (CSV Injection / CWE-1236)
 * Prepend single-quote if cell begins with =, +, -, @, \t, or \r
 */
export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // CSV Formula Injection mitigation
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }

  // Escape inner double quotes
  str = str.replace(/"/g, '""');

  return `"${str}"`;
}

export function generateCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerLine = headers.map(h => escapeCsvCell(h)).join(',');
  const rowLines = rows.map(row => row.map(cell => escapeCsvCell(cell)).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

export function triggerDownload(filename: string, content: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
