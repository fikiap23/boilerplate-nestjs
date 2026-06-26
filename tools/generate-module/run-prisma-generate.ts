import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function findUnownedGeneratedFile(generatedDir: string): string | null {
  try {
    const uid = execSync('id -u', { encoding: 'utf-8' }).trim();
    const foreign = execSync(
      `find "${generatedDir}" ! -user "${uid}" -print -quit 2>/dev/null || true`,
      { encoding: 'utf-8', shell: '/bin/bash' },
    ).trim();
    return foreign || null;
  } catch {
    return null;
  }
}

function tryFixOwnership(projectRoot: string, generatedDir: string): boolean {
  console.warn(
    'src/generated has files not owned by you (common after `make up` / Docker).',
  );
  console.warn('Attempting: sudo chown -R $(id -u):$(id -g) src/generated');

  try {
    execSync('sudo chown -R "$(id -u):$(id -g)" src/generated', {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: '/bin/bash',
    });
    return !findUnownedGeneratedFile(generatedDir);
  } catch {
    return false;
  }
}

export function ensureGeneratedWritable(projectRoot: string): void {
  const generatedDir = path.join(projectRoot, 'src', 'generated');
  if (!fs.existsSync(generatedDir)) {
    return;
  }

  const foreignFile = findUnownedGeneratedFile(generatedDir);
  if (!foreignFile) {
    return;
  }

  if (tryFixOwnership(projectRoot, generatedDir)) {
    return;
  }

  throw new Error(
    'Cannot write to src/generated (files owned by root after Docker).\n' +
      'Fix once, then re-run prisma generate:\n' +
      '  sudo chown -R $(id -u):$(id -g) src/generated\n' +
      'Or: make fix-generated-perms',
  );
}

export function runPrismaGenerate(projectRoot: string, dryRun: boolean): void {
  if (dryRun) {
    console.log('[dry-run] would run npx prisma generate');
    return;
  }

  ensureGeneratedWritable(projectRoot);

  console.log('\nRunning npx prisma generate...');
  try {
    execSync('npx prisma generate', {
      cwd: projectRoot,
      stdio: 'inherit',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('EACCES') || message.includes('permission denied')) {
      throw new Error(
        'npx prisma generate failed: permission denied on src/generated.\n' +
          'Fix with: sudo chown -R $(id -u):$(id -g) src/generated\n' +
          'Module files were created; re-run: npx prisma generate',
      );
    }
    throw error;
  }
}
