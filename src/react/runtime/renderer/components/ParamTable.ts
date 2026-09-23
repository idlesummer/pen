/** The keyed params shape a component reads (params.id), built from the
 *  router's ordered Params. Its own file since PageComponent,
 *  LayoutComponent, and DefaultBoundary all need it, and render.tsx, its
 *  sibling in renderer/, reaches in for the same shape. */
export type ParamTable = Record<string, string | string[]>
