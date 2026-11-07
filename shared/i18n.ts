import type { Composer } from 'vue-i18n'

/**
 * The `t` function components get from `useI18n()`. Locale-typed generics make
 * `ComposerTranslation` invariant, so pass this around instead of redeclaring
 * the full call signature.
 */
export type TFunc = Composer['t']
