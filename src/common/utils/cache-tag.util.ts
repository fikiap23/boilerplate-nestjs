export const CacheTags = {
  shop: (merchantId: unknown): string[] =>
    typeof merchantId === 'string' ? [`shop:${merchantId}`] : [],
};
