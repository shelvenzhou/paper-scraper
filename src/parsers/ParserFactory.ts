import type { ParserInterface } from "./ParserInterface";
import { NDSSParser } from "./NDSSParser";

export class ParserFactory {
  // Get appropriate parser based on URL pattern
  static getParser(url: string): ParserInterface {
    if (url.includes("ndss-symposium.org")) {
      return new NDSSParser();
    }
    // Add more parsers for different conferences
    throw new Error(`No parser available for URL: ${url}`);
  }
}
