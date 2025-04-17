import axios from "axios";
import type { Paper, TopicOutput } from "../types/types";
import { ParserFactory } from "../parsers/ParserFactory";
import { OpenAIService } from "./OpenAIService";
import { StorageService } from "./StorageService";

export class CrawlerService {
  private openAIService: OpenAIService;
  private storageService: StorageService;

  constructor() {
    this.openAIService = new OpenAIService();
    this.storageService = new StorageService();
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
    // Initialize storage
    await this.storageService.init();

    // Initialize result structure
    let result: TopicOutput[] = topics.map((topic) => ({
      topic,
      papers: [],
    }));

    // Load existing results if any
    const existingResults = await this.storageService.loadResults();
    if (existingResults) {
      result = existingResults;
    }

    // Collect all papers from all URLs
    const allPapers: Paper[] = [];
    const newPapers: Paper[] = [];

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

        // Identify new papers that need processing
        validPapers.forEach((paper) => {
          if (!this.storageService.isPaperProcessed(paper)) {
            newPapers.push(paper);
          } else {
            // Add cached papers to results
            const cachedTopics = this.storageService.getCachedTopics(paper);
            if (cachedTopics) {
              this.addPaperToResults(paper, cachedTopics, result);
            }
          }
        });
      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
      }
    }

    console.log(
      `Found ${allPapers.length} papers in total (${newPapers.length} new)`
    );

    // Process new papers with immediate updates
    if (newPapers.length > 0) {
      await this.openAIService.batchProcessPapers(
        newPapers,
        topics,
        async (paper, relevantTopics) => {
          // Update cache
          await this.storageService.addProcessedPaper(paper, relevantTopics);

          // Update results
          this.addPaperToResults(paper, relevantTopics, result);

          // Save current results
          await this.storageService.saveResults(result);

          // Log progress
          console.log(`Updated results for paper: ${paper.title}`);
        }
      );
    }

    // Log final summary
    result.forEach((topicOutput) => {
      console.log(
        `Found ${topicOutput.papers.length} papers related to "${topicOutput.topic}"`
      );
    });

    return result;
  }

  /**
   * Helper method to add a paper to results
   */
  private addPaperToResults(
    paper: Paper,
    relevantTopics: string[],
    results: TopicOutput[]
  ): void {
    relevantTopics.forEach((topic) => {
      const topicOutput = results.find((t) => t.topic === topic);
      if (
        topicOutput &&
        !topicOutput.papers.some((p) => p.title === paper.title)
      ) {
        topicOutput.papers.push(paper);
      }
    });
  }
}
