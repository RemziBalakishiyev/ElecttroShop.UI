import type { InlineProductAttribute } from "../core/api/products.api";

interface SpecSection {
  heading: string;
  lines: string[];
}

function isContentLine(line: string): boolean {
  // A line is content if it starts with * OR contains : (key:value pair)
  return line.startsWith("*") || line.includes(":");
}

function extractSections(text: string): SpecSection[] {
  const sections: SpecSection[] = [];
  let currentHeading = "";
  let currentLines: string[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.trim();

    if (!line || line === "🔻") continue;

    if (isContentLine(line)) {
      currentLines.push(line.replace(/^\*\s*/, "").trim());
    } else {
      if (currentLines.length > 0) {
        sections.push({ heading: currentHeading, lines: [...currentLines] });
        currentLines = [];
      }
      currentHeading = line;
    }
  }

  if (currentLines.length > 0) {
    sections.push({ heading: currentHeading, lines: currentLines });
  }

  return sections;
}

/**
 * Parses product spec text with sections, bullet points, and key:value pairs
 * into InlineProductAttribute[].
 *
 * Key:value sections  → one attribute per pair (single value)
 * Plain list sections → one attribute for the whole section (multiple values)
 */
export function parseProductSpecText(text: string): InlineProductAttribute[] {
  const sections = extractSections(text);
  const attributes: InlineProductAttribute[] = [];
  let displayOrder = 0;

  for (const section of sections) {
    const isKeyValue = section.lines.every((l) => l.includes(":"));

    if (isKeyValue) {
      for (const line of section.lines) {
        const colonIdx = line.indexOf(":");
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();
        if (!key || !value) continue;

        attributes.push({
          name: key,
          displayName: key,
          attributeType: key,
          isRequired: false,
          displayOrder: displayOrder++,
          values: [{ value, displayOrder: 0 }],
        });
      }
    } else {
      const values = section.lines
        .filter((l) => l.length > 0)
        .map((l, i) => ({ value: l, displayOrder: i }));

      if (values.length === 0) continue;

      attributes.push({
        name: section.heading,
        displayName: section.heading,
        attributeType: section.heading,
        isRequired: false,
        displayOrder: displayOrder++,
        values,
      });
    }
  }

  return attributes;
}
