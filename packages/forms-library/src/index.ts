export type {
  BlockDefinition,
  BlockInstantiationResult,
  BlockPreview,
  BlockSearchFilters,
  FieldCategoryId,
  FieldDefinition,
  FieldInputKind,
  FieldSearchFilters,
  InstantiatedField,
  InsuranceProductId,
  LibraryFavorites,
} from "./metadata/types"

export {
  FIELD_CATEGORIES,
  INSURANCE_PRODUCTS,
} from "./metadata/types"

export {
  FIELD_CATEGORY_LABELS,
  PRODUCT_LABELS,
  PRODUCT_ORDER,
} from "./metadata/categories"

export {
  allCatalogFields,
  sharedFields,
  autoFields,
  vidaFields,
  residencialFields,
  empresarialFields,
  getFieldDefinition,
  fieldCatalogById,
} from "./fields/index"

export {
  allBlocks,
  autoBlocks,
  vidaBlocks,
  residencialBlocks,
  empresarialBlocks,
  getBlockDefinition,
  blockCatalogById,
} from "./blocks/index"

export {
  instantiateBlock,
  fieldDefinitionToInstantiated,
  mergeTemplateRules,
  type InstantiateBlockInput,
} from "./utils/instantiate"

export {
  searchFields,
  searchBlocks,
  groupFieldsByCategory,
  groupBlocksByProduct,
  listFieldTags,
  listBlockTags,
  sortWithFavorites,
} from "./utils/search"

export {
  DEFAULT_FAVORITES,
  toggleFavoriteId,
  isFavorite,
  parseFavoritesJson,
  serializeFavorites,
} from "./utils/favorites"
