/** A plain string-keyed lookup object, with no inherited prototype. */
export type Dict<T> = Record<string, T>

/** Creates an empty `Dict`. Its prototype is `null`, so keys like
 *  `"constructor"` or `"__proto__"` can't collide with anything
 *  inherited from `Object.prototype` the way they would with `{}` -
 *  important since these keys come from route folder names, not
 *  anything under our control. */
export function dict<T>(): Dict<T> {
  return Object.create(null)
}
