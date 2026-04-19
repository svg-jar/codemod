// ─── Glimmer AST node types ───────────────────────────────────────────────────
//
// ember-estree ships no TypeScript declarations, so we define the subset of
// Glimmer node types that this codemod actually handles. All nodes extend
// zmod's ASTNode so they are assignable where ASTNode is expected.

import type { ASTNode } from 'zmod';

export interface SourcePosition {
  line: number;
  column: number;
}

export interface SourceLocation {
  start: SourcePosition;
  end: SourcePosition;
}

export interface GlimmerBaseNode extends ASTNode {
  loc?: SourceLocation;
}

export interface GlimmerStringLiteral extends GlimmerBaseNode {
  type: 'GlimmerStringLiteral';
  value: string;
}

export interface GlimmerBooleanLiteral extends GlimmerBaseNode {
  type: 'GlimmerBooleanLiteral';
  value: boolean;
}

export interface GlimmerPathExpression extends GlimmerBaseNode {
  type: 'GlimmerPathExpression';
  original: string;
}

export interface GlimmerSubExpression extends GlimmerBaseNode {
  type: 'GlimmerSubExpression';
  params: GlimmerExpression[];
}

/** Any Glimmer expression that can appear as a mustache param or hash value. */
export type GlimmerExpression =
  | GlimmerStringLiteral
  | GlimmerBooleanLiteral
  | GlimmerPathExpression
  | GlimmerSubExpression;

export interface GlimmerHashPair extends GlimmerBaseNode {
  type: 'GlimmerHashPair';
  key: string;
  value: GlimmerExpression;
}

export interface GlimmerHash extends GlimmerBaseNode {
  type: 'GlimmerHash';
  pairs: GlimmerHashPair[];
}

export interface GlimmerMustacheStatement extends GlimmerBaseNode {
  type: 'GlimmerMustacheStatement';
  path: GlimmerPathExpression;
  params: GlimmerExpression[];
  hash: GlimmerHash | null;
}
