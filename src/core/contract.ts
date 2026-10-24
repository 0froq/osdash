/**
 * The token contract. `src/tokens.css` defines every one of these as `--ui-<name>`
 * on `.ui`, and components only ever read these variables.
 * `pnpm check:tokens` fails when one is missing or a component stylesheet reads an undeclared variable.
 */
export const TOKENS = [
  'bg',
  'fg',
  'muted',
  'faint',
  'line',
  'accent',
  'font-display',
  'font-text',
  'font-meta',
  'ease',
  'dur',
  'radius',
] as const

export type TokenName = (typeof TOKENS)[number]

export function tokenVar(name: TokenName): string {
  return `--ui-${name}`
}
