export interface RelationConfig {
  repository: any; // Target NestJS Repository
  type: 'one' | 'many'; // Relation multiplicity
  foreignKey?: string; // Source model foreign key (defaults to `${relationName}Id` for 'one')
  targetForeignKey?: string; // Target model foreign key (required for 'many', e.g. 'productId')
  composeHelper?: any; // The dynamic compose helper for the target entity (recursive)
  splitFn?: (select: any) => { dbSelect: any; relations: any }; // The split function for the target select
}

export class BaseComposeHelper {
  constructor(
    private readonly configs: Record<string, RelationConfig>,
    private readonly parentIdKey: string = 'id',
  ) {}

  async composeOne<T extends Record<string, any>>(
    product: T,
    relations: Record<string, any> = {},
  ): Promise<any> {
    if (!product) return null;
    const [composed] = await this.composeMany([product], relations);
    return composed;
  }

  async composeMany<T extends Record<string, any>>(
    products: T[],
    relations: Record<string, any> = {},
  ): Promise<any[]> {
    if (!products.length) return [];

    const activeRelations = Object.keys(relations).filter(
      (relKey) => this.configs[relKey],
    );

    await Promise.all(
      activeRelations.map(async (relKey) => {
        const config = this.configs[relKey];
        const relationSelect = relations[relKey];

        let targetDbSelect =
          relationSelect === true
            ? undefined
            : relationSelect.select || relationSelect;
        let targetRelations = {};

        // If target has its own compose helper, split its select recursively
        if (config.composeHelper && config.splitFn && targetDbSelect) {
          const split = config.splitFn(targetDbSelect);
          targetDbSelect = split.dbSelect;
          targetRelations = split.relations;
        }

        if (config.type === 'one') {
          const fkKey = config.foreignKey || `${relKey}Id`;
          const ids = [
            ...new Set(
              products.map((p) => p[fkKey]).filter((id): id is string => !!id),
            ),
          ];

          let entities: any[] = [];
          if (ids.length) {
            entities = await config.repository.getMany({
              where: { id: { in: ids } },
              select: targetDbSelect,
              setCache: true,
            });

            // Recursively compose nested relations
            if (config.composeHelper && targetDbSelect) {
              await config.composeHelper.composeMany(entities, targetRelations);
            }
          }

          const entityMap = new Map(entities.map((e) => [e.id, e]));

          products.forEach((p: any) => {
            p[relKey] = p[fkKey] ? (entityMap.get(p[fkKey]) ?? null) : null;
          });
        } else if (config.type === 'many') {
          const targetFk = config.targetForeignKey;
          if (!targetFk) {
            throw new Error(
              `targetForeignKey is required for 'many' relation config: ${relKey}`,
            );
          }

          const parentIds = products.map((p) => p[this.parentIdKey]);

          let entities: any[] = [];
          if (parentIds.length) {
            entities = await config.repository.getMany({
              where: { [targetFk]: { in: parentIds } },
              select: targetDbSelect,
              setCache: true,
            });

            // Recursively compose nested relations
            if (config.composeHelper && targetDbSelect) {
              await config.composeHelper.composeMany(entities, targetRelations);
            }
          }

          const entityMap = new Map<string, any[]>();
          for (const e of entities) {
            const fkValue = e[targetFk];
            const list = entityMap.get(fkValue) ?? [];
            list.push(e);
            entityMap.set(fkValue, list);
          }

          products.forEach((p: any) => {
            p[relKey] = entityMap.get(p[this.parentIdKey]) ?? [];
          });
        }
      }),
    );

    return products;
  }
}
