/** The keyed params shape a component reads (params.id), built from the
 *  router's ordered Params. Its own file since both a boundary
 *  (DefaultBoundary) and the renderer (component-map) need it, and neither
 *  should own the other's dependency. */
export type ParamTable = Record<string, string | string[]>
