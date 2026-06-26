import * as path from 'path';
import { resolveNames } from './naming';
import { validateGeneration } from './validate';
import { renderModuleFiles, writeFiles } from './render';
import { patchAppModule } from './patch-app-module';
import { patchPayloadMap } from './patch-payload-map';

interface CliOptions {
  name: string;
  route?: string;
  noCache: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }

  let name: string | undefined;
  let route: string | undefined;
  let noCache = false;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--no-cache') {
      noCache = true;
      continue;
    }

    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg === '--route') {
      route = args[++i];
      if (!route) {
        throw new Error('--route requires a value');
      }
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Unknown flag: ${arg}`);
    }

    if (!name) {
      name = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  if (!name) {
    throw new Error('Module name is required');
  }

  return { name, route, noCache, dryRun };
}

function printHelp(): void {
  console.log(`Usage: yarn gen:module <name> [options]

Scaffolds folder structure + sample files (repository wiring, select presets).
Full CRUD/endpoints: copy patterns from src/modules/admin/.

Options:
  --route <path>   Controller route (default: same as module name)
  --no-cache       Skip repository cache config and PrismaSelectPayloadMap patch
  --dry-run        Print actions without writing files
  -h, --help       Show this help message

Examples:
  yarn gen:module product
  yarn gen:module blog-post --route blogs
  yarn gen:module product --dry-run
`);
}

function printNextSteps(kebab: string, cacheEnabled: boolean): void {
  console.log('\nNext steps:');
  console.log(`  1. Review samples in src/modules/${kebab}/`);
  console.log('  2. Copy endpoint/service/DTO patterns from src/modules/admin/');
  console.log('  3. Update select presets to match your Prisma model fields');
  if (cacheEnabled) {
    console.log('  4. Add lock config to repository if needed (see AGENTS.md)');
  }
  console.log('  5. Run: npx prisma generate && npx tsc --noEmit');
}

function main(): void {
  try {
    const options = parseArgs(process.argv);
    const projectRoot = path.resolve(__dirname, '../..');
    const templatesDir = path.join(__dirname, 'templates');
    const names = resolveNames(options.name, options.route);
    const cacheEnabled = !options.noCache;

    const model = validateGeneration(names, { projectRoot, cacheEnabled });

    const files = renderModuleFiles(
      { names, model, cacheEnabled },
      templatesDir,
    );

    writeFiles(projectRoot, files, options.dryRun);
    patchAppModule(projectRoot, names, options.dryRun);

    if (cacheEnabled) {
      patchPayloadMap(projectRoot, names, options.dryRun);
    }

    console.log(`\nModule "${names.pascal}" generated successfully.`);
    printNextSteps(names.kebab, cacheEnabled);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

main();
