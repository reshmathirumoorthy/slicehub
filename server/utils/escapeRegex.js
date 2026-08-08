/**
 * Escape user input before building a RegExp / $regex query.
 */
export const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default escapeRegex;
