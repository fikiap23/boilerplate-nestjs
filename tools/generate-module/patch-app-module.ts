import * as fs from 'fs';
import * as path from 'path';
import { ModuleNames } from './naming';

export function patchAppModule(
  projectRoot: string,
  names: ModuleNames,
  dryRun: boolean,
): void {
  const appModulePath = path.join(projectRoot, 'src', 'app.module.ts');
  let content = fs.readFileSync(appModulePath, 'utf-8');
  const moduleImport = `${names.pascal}Module`;
  const importLine = `import { ${moduleImport} } from './modules/${names.kebab}/${names.kebab}.module';`;

  if (content.includes(importLine) || content.includes(moduleImport)) {
    throw new Error(`${moduleImport} is already registered in app.module.ts`);
  }

  const lastImportIndex = content.lastIndexOf('\nimport ');
  if (lastImportIndex === -1) {
    throw new Error('Could not find import block in app.module.ts');
  }

  const insertImportAt = content.indexOf('\n', lastImportIndex + 1);
  content =
    content.slice(0, insertImportAt + 1) +
    importLine +
    '\n' +
    content.slice(insertImportAt + 1);

  const importsArrayMatch = content.match(/imports:\s*\[([\s\S]*?)\n {2}\],/);
  if (!importsArrayMatch) {
    throw new Error('Could not find imports array in app.module.ts');
  }

  const importsBlock = importsArrayMatch[1];
  const updatedImportsBlock = `${importsBlock.trimEnd()}\n    ${moduleImport},`;
  content = content.replace(importsBlock, updatedImportsBlock);

  if (dryRun) {
    console.log('[dry-run] would patch src/app.module.ts');
    return;
  }

  fs.writeFileSync(appModulePath, content, 'utf-8');
  console.log('patched src/app.module.ts');
}
