import type { Paper } from "../types/types";
import type { ParserInterface } from "./ParserInterface";
import * as cheerio from "cheerio";

export class NDSSParser implements ParserInterface {
  async parse(html: string, baseUrl: string): Promise<Paper[]> {
    const papers: Paper[] = [];
    const $ = cheerio.load(html);

    // Find all paper elements
    $("li.list-group-item").each((_, element) => {
      const $element = $(element);

      // Extract title and url
      const titleElement = $element.find("strong a");
      const title = titleElement.text().trim();
      const paperUrl = titleElement.attr("href") || "";

      // Extract authors
      const authorsText = $element.find("i p").text().trim();
      const authors = authorsText.split(",").map((author) => author.trim());

      // Extract abstract
      const abstract = $element.find(".collapse p").text().trim();

      // Extract PDF URL
      const pdfUrl = $element.find('a[href$=".pdf"]').attr("href") || "";

      papers.push({
        title,
        authors,
        abstract,
        pdfUrl,
        paperUrl,
      });
    });

    return papers;
  }
}
