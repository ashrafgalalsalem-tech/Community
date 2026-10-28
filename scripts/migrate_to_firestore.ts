/**
 * Production-Ready Firestore Migration & Verification Script
 * Validates local data against Firestore schema blueprint, tests integrity,
 * preserves backups, and generates migration execution reports.
 */

import fs from 'fs';
import path from 'path';

interface MigrationReport {
  timestamp: string;
  sourceFiles: {
    members: string;
    private: string;
    audit: string;
  };
  backupPath: string;
  counts: {
    membersCount: number;
    privateCredsCount: number;
    auditLogsCount: number;
  };
  validations: {
    allMembersHaveValidStatus: boolean;
    allEmailsUnique: boolean;
    credentialsSeparatedAndHashed: boolean;
    zeroPlaintextPasswords: boolean;
    rootAdminPreserved: boolean;
  };
  collectionsPlanned: {
    members: number;
    members_private: number;
    audit_logs: number;
  };
  conflicts: string[];
  status: 'READY' | 'FAILED';
}

export function runMigrationValidation(): MigrationReport {
  const membersPath = path.resolve('data/members.json');
  const privatePath = path.resolve('data/private.json');
  const auditPath = path.resolve('data/audit.json');
  const backupDir = path.resolve('data/backup/pre_firestore_migration');

  // Verify backup exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    fs.copyFileSync(membersPath, path.join(backupDir, 'members.json'));
    fs.copyFileSync(privatePath, path.join(backupDir, 'private.json'));
    fs.copyFileSync(auditPath, path.join(backupDir, 'audit.json'));
  }

  const members = JSON.parse(fs.readFileSync(membersPath, 'utf-8'));
  const privates = JSON.parse(fs.readFileSync(privatePath, 'utf-8'));
  const audit = fs.existsSync(auditPath) ? JSON.parse(fs.readFileSync(auditPath, 'utf-8')) : [];

  const conflicts: string[] = [];

  // Check unique emails
  const emails = new Set<string>();
  for (const m of members) {
    if (!m.professionalEmail || !m.professionalEmail.includes('@')) {
      conflicts.push(`Member ${m.id} has invalid professional email.`);
    }
    const lower = m.professionalEmail.toLowerCase();
    if (emails.has(lower)) {
      conflicts.push(`Duplicate email detected in members: ${lower}`);
    }
    emails.add(lower);
  }

  // Check member private separation and zero plaintext passwords
  let zeroPlaintext = true;
  let hasHashesAndSalts = true;

  for (const [memberId, cred] of Object.entries<any>(privates)) {
    if (cred.password) {
      conflicts.push(`CRITICAL SECURITY FAILURE: Plaintext password found in private record for ${memberId}`);
      zeroPlaintext = false;
    }
    if (!cred.salt || !cred.passwordHash) {
      conflicts.push(`Missing cryptographic salt or passwordHash for ${memberId}`);
      hasHashesAndSalts = false;
    }
  }

  const rootAdminPreserved = members.some(
    (m: any) => m.professionalEmail.toLowerCase() === 'ashrafgalalsalem@gmail.com' && m.role === 'administrator'
  );
  if (!rootAdminPreserved) {
    conflicts.push('Root administrator (Ashrafgalalsalem@gmail.com) missing from members list.');
  }

  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    sourceFiles: {
      members: membersPath,
      private: privatePath,
      audit: auditPath,
    },
    backupPath: backupDir,
    counts: {
      membersCount: members.length,
      privateCredsCount: Object.keys(privates).length,
      auditLogsCount: audit.length,
    },
    validations: {
      allMembersHaveValidStatus: members.every((m: any) => ['pending', 'approved', 'rejected', 'suspended'].includes(m.status)),
      allEmailsUnique: emails.size === members.length,
      credentialsSeparatedAndHashed: hasHashesAndSalts,
      zeroPlaintextPasswords: zeroPlaintext,
      rootAdminPreserved,
    },
    collectionsPlanned: {
      members: members.length,
      members_private: Object.keys(privates).length,
      audit_logs: audit.length,
    },
    conflicts,
    status: conflicts.length === 0 ? 'READY' : 'FAILED',
  };

  fs.writeFileSync('data/migration_report.json', JSON.stringify(report, null, 2));
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runMigrationValidation();
  console.log('=== FIRESTORE MIGRATION VALIDATION REPORT ===');
  console.log(JSON.stringify(result, null, 2));
}
