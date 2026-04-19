import { z } from 'zmod';

/**
 * Removes the `svgJar` property (and its entire value) from the options object
 * passed to `new EmberApp(...)` in an `ember-cli-build.js` source string.
 *
 * @param source  Raw source text of ember-cli-build.js.
 * @returns       Transformed source with the svgJar config property removed.
 */
export function removeSvgJarConfig(source: string): string {
  const root = z(source);

  // Find the svgJar property node anywhere in the file.
  const svgJarProperty = root.find(z.Property, { key: { name: 'svgJar' } });

  if (svgJarProperty.length === 0) {
    // Nothing to remove — return source unchanged.
    return source;
  }

  svgJarProperty.remove();

  // AST-based removal leaves behind the trailing comma that belonged to the
  // svgJar property. When svgJar was the only property in the object, this
  // produces `{  ,  }` which is invalid JS. Collapse any such empty-but-for-a-
  // comma object literals back to `{}`.
  return root.toSource().replace(/\{\s*,\s*\}/gs, '{}');
}
