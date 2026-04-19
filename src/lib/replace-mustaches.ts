import { buildIconImportPath } from '#lib/build-icon-import-path.ts';
import type { IconKey, UsedIcon } from '#lib/resolve-icon-names.ts';
import type { ImportAlias } from '#lib/resolve-import-alias.ts';
import type { GlimmerMustacheStatement } from '#types/glimmer-types.ts';
import { buildComponentTag, extractRawIconName } from '#utils/glimmer.ts';
import { determineIconType } from '#utils/icon-names.ts';
import { z, type Collection, type FilteredCollection, type NodePath } from 'zmod';

const j = z;

/**
 * Replaces every `{{svgJar ...}}` mustache call in the template with the
 * equivalent angle-bracket component invocation, e.g. `<OneIcon />`.
 *
 * Uses the pre-resolved icon name map so that conflict disambiguation
 * (IconName vs IconNameInline) is already settled before any replacement runs.
 *
 * Mustaches whose icon name cannot be statically resolved are left unchanged.
 */
export function replaceMustachesWithComponents(
  svgJarUsages: FilteredCollection,
  resolvedIcons: Map<IconKey, UsedIcon>,
  source: string,
): void {
  svgJarUsages.replaceWith((path: NodePath) => {
    const node = path.node as GlimmerMustacheStatement;
    const rawName = extractRawIconName(node.params[0]);

    // Skip mustaches we can't statically analyse (e.g. fully dynamic icon names)
    if (!rawName) {
      return node;
    }

    const iconSlug = rawName.replace(/^#/, '');
    const type = determineIconType(rawName);
    const key: IconKey = `${iconSlug}:${type}`;
    const icon = resolvedIcons.get(key);

    // Should always be present since resolveIconNames saw the same usages,
    // but guard defensively to avoid a runtime crash.
    if (!icon) {
      return node;
    }

    return buildComponentTag(icon.componentName, node.hash?.pairs ?? [], source);
  });
}

/**
 * Inserts an import declaration for each icon component collected during the
 * pre-scan pass.
 *
 * If the file already has imports, the new ones are inserted after the last
 * existing import. If there are no imports at all (e.g. a bare template-only
 * component with no JS), the imports are prepended at the top of the file.
 */
export function addIconImports(
  root: Collection,
  usedIcons: Map<IconKey, UsedIcon>,
  filePath: string,
  importAliases: ImportAlias[],
): void {
  const allImports = root.find(j.ImportDeclaration);

  if (allImports.length > 0) {
    // FilteredCollection.at() does not support negative indices, so use length - 1
    const lastImport = allImports.at(allImports.length - 1);
    for (const icon of usedIcons.values()) {
      const importPath = buildIconImportPath(icon, filePath, importAliases);
      lastImport?.insertAfter(`\nimport ${icon.componentName} from '${importPath}';`);
    }
  } else {
    // No existing imports — prepend all icon imports at the top of the file.
    const lines = [...usedIcons.values()]
      .map((icon) => `import ${icon.componentName} from '${buildIconImportPath(icon, filePath, importAliases)}';`)
      .join('\n');
    root.insertAt(0, lines + '\n\n');
  }
}
