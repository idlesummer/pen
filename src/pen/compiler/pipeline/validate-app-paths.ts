import type { RolesMapping } from './create-roles-mapping'

/**
 * Step 3: URL-level validation on the flat mapping — equivalent to Next.js's validateAppPaths.
 * Runs before bucketing and tree building.
 *
 * Duplicate-screen detection requires sibling context (two groups both exposing
 * a catchall at the same level) that is only visible in the tree. It therefore
 * stays in buildRouteTree's validation pass, where the structural error
 * (DuplicateCatchallError, ConflictingDynamicSegmentsError, etc.) can fire
 * first and give a more actionable message.
 *
 * This step is the correct layer for URL-pattern structural checks that do not
 * need tree relationships — reserved for future constraints.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function validateAppPaths(_mapping: RolesMapping): void {
  // Future: check for URL-level structural conflicts (e.g. invalid segment names,
  // root-segment constraints, parallel-route naming rules).
}
