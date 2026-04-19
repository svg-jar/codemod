import { z, type ASTNode } from 'zmod';

const DEFAULT_SOURCE_DIRS = ['public'];

/**
 * Extracts a string value from an AST element, returning null for anything
 * that isn't a non-empty string literal.
 */
function toStringOrNull(element: ASTNode): string | null {
  if (element.type !== 'Literal' || typeof element.value !== 'string') return null;
  if (element.value.trim() === '') return null;
  return element.value;
}

export function getSvgJarSourceDirs(source: string) {
  // Find all sourceDirs arrays anywhere under the svgJar config object —
  // covers both the flat form (svgJar.sourceDirs) and strategy-level form
  // (svgJar.inline.sourceDirs, svgJar.symbol.sourceDirs, etc.).
  const sourceDirsArrays = z(source)
    .find(z.Property, { key: { name: 'svgJar' } })
    .find(z.Property, { key: { name: 'sourceDirs' } })
    .find(z.ArrayExpression);

  if (sourceDirsArrays.length === 0) {
    return { sourceDirs: DEFAULT_SOURCE_DIRS };
  }

  const sourceDirs = sourceDirsArrays
    .nodes()
    .flatMap((node: ASTNode) => {
      const elements = node.elements as ASTNode[];
      if (!Array.isArray(elements)) return [];
      return elements.map(toStringOrNull);
    })
    .filter((dir): dir is string => dir !== null);

  return { sourceDirs: sourceDirs.length > 0 ? sourceDirs : DEFAULT_SOURCE_DIRS };
}
