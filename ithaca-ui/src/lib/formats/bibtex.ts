import type { PaperNode } from "@/lib/api/graph-api";

/**
 * Generates a BibTeX string for a list of papers.
 * @param papers Array of papers to export
 * @returns Formatted BibTeX string
 */
export function generateBibTeX(papers: PaperNode[]): string {
  return papers
    .map((paper) => {
      // Create a unique key: AuthorYearTitleWord
      const authorLast = paper.authors.split(" ")[0].replace(/[^\w]/g, "");
      const titleWord = paper.title.split(" ")[0].replace(/[^\w]/g, "");
      const key = `${authorLast}${paper.year}${titleWord}`;

      const entry = [
        `@article{${key},`,
        `  title={${escapeLatex(paper.title)}},`,
        `  author={${escapeLatex(paper.authors)}},`,
        `  year={${paper.year}},`,
        paper.venue ? `  journal={${escapeLatex(paper.venue)}},` : "",
        paper.citations ? `  note={Citations: ${paper.citations}},` : "",
        `}`,
      ]
        .filter(Boolean)
        .join("\n");

      return entry;
    })
    .join("\n\n");
}

function escapeLatex(str: string): string {
  // Basic escaping. For full robustness, a library is better, but this suffices for integration ready.
  return str
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}");
}
