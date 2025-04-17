// src/services/CrawlerService.ts

import axios from "axios";
import type { Paper, TopicOutput } from "../types/types";
import { ParserFactory } from "../parsers/ParserFactory";
import { OpenAIService } from "./OpenAIService";

export class CrawlerService {
  private openAIService: OpenAIService;

  constructor() {
    this.openAIService = new OpenAIService();
  }

  /**
   * Validate paper data
   */
  private isValidPaper(paper: Paper): boolean {
    return Boolean(
      paper &&
        paper.title &&
        paper.title.trim() !== "" &&
        paper.abstract &&
        paper.abstract.trim() !== ""
    );
  }

  async crawl(urls: string[], topics: string[]): Promise<TopicOutput[]> {
    // Initialize result structure
    const result: TopicOutput[] = topics.map((topic) => ({
      topic,
      papers: [],
    }));

    // Collect all papers from all URLs
    const allPapers: Paper[] = [];

    // Crawl each URL
    for (const url of urls) {
      try {
        console.log(`Crawling ${url}...`);
        const response = await axios.get(url);
        const parser = ParserFactory.getParser(url);
        const papers = await parser.parse(response.data, url);

        // Filter out invalid papers
        const validPapers = papers.filter((paper) => this.isValidPaper(paper));

        if (papers.length !== validPapers.length) {
          console.warn(
            `Filtered out ${
              papers.length - validPapers.length
            } invalid papers from ${url}`
          );
        }

        allPapers.push(...validPapers);
      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
      }
    }

    console.log(`Found ${allPapers.length} valid papers in total`);

    if (allPapers.length === 0) {
      console.warn("No valid papers found to process");
      return result;
    }

    // Process all papers in batch
    const paperTopicsMap = await this.openAIService.batchProcessPapers(
      allPapers,
      topics
    );

    // Organize results by topic
    paperTopicsMap.forEach((relevantTopics, paper) => {
      if (relevantTopics.length > 0) {
        relevantTopics.forEach((topic) => {
          const topicOutput = result.find((t) => t.topic === topic);
          if (topicOutput) {
            topicOutput.papers.push(paper);
          }
        });
      }
    });

    // Log summary
    result.forEach((topicOutput) => {
      console.log(
        `Found ${topicOutput.papers.length} papers related to "${topicOutput.topic}"`
      );
    });

    return result;
  }
}
