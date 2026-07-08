export const CacheTags = {
  merchant: (merchantId: unknown): string[] =>
    typeof merchantId === 'string' ? [`merchant:${merchantId}`] : [],
};
