/**
 * Converts a display name into a URL-safe kebab-case slug.
 */
export const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

/**
 * Ensures a unique slug by appending -1, -2, … when needed.
 */
export const ensureUniqueSlug = async (Model, baseSlug, excludeId = null) => {
  let slug = baseSlug || 'item';
  let suffix = 0;

  for (;;) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const query = { slug: candidate };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const exists = await Model.exists(query);
    if (!exists) {
      return candidate;
    }
    suffix += 1;
  }
};
