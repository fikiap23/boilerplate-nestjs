import * as fs from 'fs';
import * as path from 'path';
import { ModuleNames } from './naming';
import { PrismaModelInfo } from './validate';

export interface RenderContext {
  names: ModuleNames;
  model: PrismaModelInfo;
  cacheEnabled: boolean;
}

function loadTemplate(templateName: string, templatesDir: string): string {
  return fs.readFileSync(
    path.join(templatesDir, `${templateName}.ts.tpl`),
    'utf-8',
  );
}

function applyTemplate(template: string, context: RenderContext): string {
  const { names, model, cacheEnabled } = context;

  const generalFields = model.hasCreatedAt
    ? 'id: true,\n    createdAt: true,'
    : 'id: true,';

  const withPasswordPreset = model.hasPassword
    ? `,
  withPassword: {
    id: true,
    password: true,
  } satisfies Prisma.${names.pascal}Select`
    : '';

  const cacheBlock = cacheEnabled
    ? `  model: '${names.repoModel}',
  cache: {
    ttl: 300,
    nullTtl: 60,
    sensitiveFields: ['password'],
    methods: {
      getManyPaginate: { ttl: 60 },
      getMany: { ttl: 60 },
    },
  },`
    : '';

  const repoModelGeneric = cacheEnabled ? `,\n  '${names.repoModel}'` : '';

  const replacements: Record<string, string> = {
    '{{pascal}}': names.pascal,
    '{{camel}}': names.camel,
    '{{kebab}}': names.kebab,
    '{{route}}': names.route,
    '{{repoModel}}': names.repoModel,
    '{{tableMap}}': names.tableMap,
    '{{generalFields}}': generalFields,
    '{{withPasswordPreset}}': withPasswordPreset,
    '{{cacheBlock}}': cacheBlock,
    '{{repoModelGeneric}}': repoModelGeneric,
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(key).join(value);
  }

  return result;
}

export interface GeneratedFile {
  relativePath: string;
  content: string;
}

export function renderModuleFiles(
  context: RenderContext,
  templatesDir: string,
): GeneratedFile[] {
  const { names } = context;
  const base = path.join('src', 'modules', names.kebab);

  const templateFiles: Array<{ template: string; output: string }> = [
    { template: 'module', output: `${names.kebab}.module.ts` },
    {
      template: 'controller',
      output: path.join(
        'presentation',
        'controllers',
        `${names.kebab}.controller.ts`,
      ),
    },
    {
      template: 'service',
      output: path.join(
        'application',
        'services',
        `${names.kebab}.service.ts`,
      ),
    },
    {
      template: 'repository',
      output: path.join('repositories', `${names.kebab}.repository.ts`),
    },
    {
      template: 'dto',
      output: path.join('presentation', 'dto', `${names.kebab}.dto.ts`),
    },
    {
      template: 'select',
      output: path.join('types', `select-${names.kebab}.type.ts`),
    },
    {
      template: 'where',
      output: path.join('types', `where-${names.kebab}.type.ts`),
    },
    {
      template: 'entity',
      output: path.join('domain', 'entities', `${names.kebab}.entity.ts`),
    },
    {
      template: 'repository.interface',
      output: path.join(
        'domain',
        'repositories',
        `${names.kebab}.repository.interface.ts`,
      ),
    },
    {
      template: 'prisma-repository',
      output: path.join(
        'infrastructure',
        'repositories',
        `prisma-${names.kebab}.repository.ts`,
      ),
    },
    {
      template: 'mapper',
      output: path.join(
        'infrastructure',
        'mappers',
        `${names.kebab}.mapper.ts`,
      ),
    },
  ];

  return templateFiles.map(({ template, output }) => {
    const raw = loadTemplate(template, templatesDir);
    const content = applyTemplate(raw, context);
    return {
      relativePath: path.join(base, output),
      content,
    };
  });
}

export function writeFiles(
  projectRoot: string,
  files: GeneratedFile[],
  dryRun: boolean,
): void {
  for (const file of files) {
    const fullPath = path.join(projectRoot, file.relativePath);
    if (dryRun) {
      console.log(`[dry-run] would write ${file.relativePath}`);
      continue;
    }

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, contentWithTrailingNewline(file.content), 'utf-8');
    console.log(`created ${file.relativePath}`);
  }
}

function contentWithTrailingNewline(content: string): string {
  return content.endsWith('\n') ? content : `${content}\n`;
}
