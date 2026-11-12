import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { __unstable__loadDesignSystem } from "tailwindcss";

const root = fileURLToPath(new URL("../", import.meta.url));
const defaultDesignSystem = await __unstable__loadDesignSystem(
  await fs.readFile(fileURLToPath(import.meta.resolve("tailwindcss/theme.css")), "utf8"),
);
const designSystem = await __unstable__loadDesignSystem(
  await fs.readFile(path.join(root, "src/index.css"), "utf8"),
  {
    base: path.join(root, "src"),
    async loadStylesheet(id, base) {
      const filename = id === "tailwindcss"
        ? fileURLToPath(import.meta.resolve("tailwindcss/index.css"))
        : path.resolve(base, id);
      return { path: filename, base: path.dirname(filename), content: await fs.readFile(filename, "utf8") };
    },
  },
);

async function sourceFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const results = await Promise.all(entries.map(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(filename) : /\.tsx?$/.test(filename) ? [filename] : [];
  }));
  return results.flat();
}

const candidates = new Map();
const movementCandidates = new Map();
function record(text, location) {
  for (const candidate of text.trim().split(/\s+/).filter(Boolean)) {
    if (!candidates.has(candidate)) candidates.set(candidate, location);
    if (location.startsWith("src/features/movement/pages/MovementMap.tsx")) {
      movementCandidates.set(candidate, location);
    }
  }
}

// Document defaults are authored directly on the body in the HTML entry point.
const html = await fs.readFile(path.join(root, "index.html"), "utf8");
for (const match of html.matchAll(/\bclass="([^"]*)"/g)) record(match[1], "index.html");

for (const filename of await sourceFiles(path.join(root, "src"))) {
  const source = await fs.readFile(filename, "utf8");
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  function fragments(node) {
    if (!node) return;
    const line = tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1;
    const location = `${path.relative(root, filename)}:${line}`;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) record(node.text, location);
    else if (ts.isTemplateExpression(node)) {
      record(node.head.text, location);
      for (const span of node.templateSpans) {
        fragments(span.expression);
        record(span.literal.text, location);
      }
    } else if (ts.isConditionalExpression(node)) {
      fragments(node.whenTrue);
      fragments(node.whenFalse);
    } else if (ts.isBinaryExpression(node)) {
      fragments(node.left);
      fragments(node.right);
    } else if (ts.isJsxExpression(node)) fragments(node.expression);
  }
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(tree) === "className") fragments(node.initializer);
    else if (ts.isPropertyAssignment(node) && /^(className)$|Classes$/.test(node.name.getText(tree))) fragments(node.initializer);
    else if (ts.isVariableDeclaration(node) && /Classes$|^(inputClass|buttonPrimary|buttonSecondary)$/.test(node.name.getText(tree))) fragments(node.initializer);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  // Leaflet's marker HTML is supplied as a string rather than JSX.
  for (const match of source.matchAll(/\bclass="([^"]*)"/g)) {
    record(match[1].replace(/\$\{[^}]*\}/g, ""), path.relative(root, filename));
  }
}

const tokens = [...candidates.keys()];
const compiled = designSystem.candidatesToCss(tokens);
const failures = [];
// Group and peer are Tailwind variant markers; they deliberately emit no CSS rules.
const isVariantMarker = (candidate) => /^(group|peer)(\/[\w-]+)?$/.test(candidate);
const movementTokens = [...movementCandidates.keys()];
const defaultCompiled = defaultDesignSystem.candidatesToCss(movementTokens);
for (const [index, candidate] of movementTokens.entries()) {
  if (!defaultCompiled[index] && !isVariantMarker(candidate)) {
    failures.push(`${movementCandidates.get(candidate)}: MovementMap must use built-in Tailwind utilities: "${candidate}"`);
  }
}
for (const [index, candidate] of tokens.entries()) {
  if (!compiled[index] && !isVariantMarker(candidate)) failures.push(`${candidates.get(candidate)}: unsupported class "${candidate}"`);
  if (candidate.includes("[@")) {
    failures.push(`${candidates.get(candidate)}: use a named responsive variant instead of "${candidate}"`);
  }
  // Exact design values belong in the Tailwind theme, rather than inline brackets.
  // Keep selector variants and runtime chart variables available.
  for (const parsed of designSystem.parseCandidate(candidate)) {
    if (parsed.kind === "arbitrary" ||
      (parsed.kind === "functional" && parsed.value?.kind === "arbitrary" &&
        !/^var\(--[\w-]+\)$/.test(parsed.value.value))) {
      failures.push(`${candidates.get(candidate)}: move arbitrary value in "${candidate}" to a named Tailwind theme token`);
    }
  }
  // App state/composition selectors must use data attributes, never removed CSS classes.
  const selector = candidate.slice(0, Math.max(0, candidate.lastIndexOf("]:")));
  for (const match of selector.matchAll(/\.([a-zA-Z][a-zA-Z0-9-]*)/g)) {
    if (!match[1].startsWith("leaflet-")) failures.push(`${candidates.get(candidate)}: obsolete class selector ".${match[1]}"`);
  }
  const canonical = designSystem.canonicalizeCandidates([candidate], { rem: 16 })[0];
  if (canonical !== candidate) failures.push(`${candidates.get(candidate)}: prefer "${canonical}" over "${candidate}"`);
}

if (failures.length) {
  process.stderr.write(failures.join("\n") + "\n");
  process.exitCode = 1;
} else {
  process.stdout.write(`Checked ${tokens.length} Tailwind utilities: no obsolete classes, arbitrary values, or noncanonical utilities.\n`);
}
