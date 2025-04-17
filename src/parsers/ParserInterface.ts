import type { Paper } from "../types/types";

export interface ParserInterface {
  // Parse the HTML content and return array of papers
  parse(html: string, baseUrl: string): Promise<Paper[]>;
}
