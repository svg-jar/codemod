import type { GlimmerExpression, GlimmerHashPair } from '#types/glimmer-types.ts';

/**
 * Extracts the raw icon name string from the first parameter of a svgJar
 * mustache call. Handles two forms:
 *
 *   - String literal:   {{svgJar "icon-name"}}  → "icon-name"
 *   - Sub-expression:   {{svgJar (helper "icon-name")}}  → "icon-name"
 *
 * Returns undefined if the icon name cannot be statically determined.
 */
export function extractRawIconName(firstParam: GlimmerExpression | undefined): string | undefined {
  if (firstParam?.type === 'GlimmerStringLiteral') {
    return firstParam.value;
  }

  if (firstParam?.type === 'GlimmerSubExpression') {
    const subFirstParam = firstParam.params[0];
    if (subFirstParam?.type === 'GlimmerStringLiteral') {
      return subFirstParam.value;
    }
  }

  return undefined;
}

/**
 * Serialises a single Glimmer hash pair value into the appropriate HTML/HBS
 * attribute syntax for use in an angle-bracket component invocation.
 *
 * The four cases mirror what Glimmer can express as a hash value:
 *
 *   GlimmerStringLiteral  → key="value"
 *   GlimmerBooleanLiteral → key  (true, bare attribute)  /  key={{false}}  (false)
 *   GlimmerPathExpression → key={{identifier}}
 *   GlimmerSubExpression  → key={{helper arg1 arg2}}
 *
 * For the sub-expression case the original source text is sliced directly
 * using the node's byte offsets, stripping the surrounding `()` parens that
 * Handlebars uses for sub-expressions (they are not needed inside `{{}}`).
 */
function serialiseHashPairValue(key: string, value: GlimmerExpression, source: string): string {
  switch (value.type) {
    case 'GlimmerStringLiteral':
      return `${key}="${value.value}"`;

    case 'GlimmerBooleanLiteral':
      return value.value ? key : `${key}={{false}}`;

    case 'GlimmerPathExpression':
      return `${key}={{${value.original}}}`;

    case 'GlimmerSubExpression': {
      // Strip the surrounding `(` `)` from the sub-expression source slice.
      const inner = source.slice(value.start + 1, value.end - 1);
      return `${key}={{${inner}}}`;
    }
  }
}

/**
 * Builds an angle-bracket component invocation string from a component name
 * and the hash pairs collected from the original mustache call.
 *
 * @example
 *   buildComponentTag('OneIcon', [], source)
 *   // → '<OneIcon />'
 *
 * @example
 *   buildComponentTag('Two', [{ key: 'class', value: ... }], source)
 *   // → '<Two class="my-icon" />'
 */
export function buildComponentTag(componentName: string, hashPairs: GlimmerHashPair[], source: string): string {
  if (hashPairs.length === 0) {
    return `<${componentName} />`;
  }

  const attrs = hashPairs.map(({ key, value }) => serialiseHashPairValue(key, value, source)).join(' ');

  return `<${componentName} ${attrs} />`;
}
