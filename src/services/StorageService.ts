import type { Paper, TopicOutput } from "../types/types";
import { mkdir, writeFile, copyFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export class StorageService {
  private readonly dataDir: string;
  private readonly resultsPath: string;
  private readonly processedPapersPath: string;
  private processedPapers: Map<string, string[]>;

  constructor() {
    // Store data in ./data directory
    this.dataDir = path.join(process.cwd(), "data");
    this.resultsPath = path.join(this.dataDir, "results.json");
    this.processedPapersPath = path.join(this.dataDir, "processed_papers.json");
    this.processedPapers = new Map();
  }

  /**
   * Initialize storage by creating necessary directories and loading cache
   */
  async init(): Promise<void> {
    // Create data directory if it doesn't exist
    if (!existsSync(this.dataDir)) {
      await mkdir(this.dataDir, { recursive: true });
    }

    // Load processed papers cache
    await this.loadProcessedPapers();
  }

  /**
   * Generate a unique key for a paper
   */
  private getPaperKey(paper: Paper): string {
    // Using title and authors as unique identifier
    return `${paper.title}|${paper.authors.join("|")}`;
  }

  /**
   * Check if a paper has been processed before
   */
  isPaperProcessed(paper: Paper): boolean {
    return this.processedPapers.has(this.getPaperKey(paper));
  }

  /**
   * Get cached topics for a paper if available
   */
  getCachedTopics(paper: Paper): string[] | null {
    return this.processedPapers.get(this.getPaperKey(paper)) || null;
  }

  /**
   * Save results with error handling and backup
   */
  async saveResults(results: TopicOutput[]): Promise<void> {
    try {
      // Create backup of existing results
      if (existsSync(this.resultsPath)) {
        const backupPath = `${this.resultsPath}.backup`;
        await copyFile(this.resultsPath, backupPath);
      }
      // Save new results
      await writeFile(
        this.resultsPath,
        JSON.stringify(results, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("Error saving results:", error);
      throw error; // Re-throw to handle in calling code
    }
  }

  /**
   * Load previous results if they exist
   */
  async loadResults(): Promise<TopicOutput[] | null> {
    try {
      if (existsSync(this.resultsPath)) {
        const data = await readFile(this.resultsPath, "utf-8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Error loading results:", error);
    }
    return null;
  }

  /**
   * Add processed paper to cache with immediate save
   */
  async addProcessedPaper(
    paper: Paper,
    relevantTopics: string[]
  ): Promise<void> {
    this.processedPapers.set(this.getPaperKey(paper), relevantTopics);
    await this.saveProcessedPapers();
    console.log(`Cached paper: ${paper.title}`);
  }

  /**
   * Load processed papers cache
   */
  private async loadProcessedPapers(): Promise<void> {
    try {
      if (existsSync(this.processedPapersPath)) {
        const data = await readFile(this.processedPapersPath, "utf-8");
        const processed = JSON.parse(data);
        this.processedPapers = new Map(Object.entries(processed));
      }
    } catch (error) {
      console.error("Error loading processed papers cache:", error);
    }
  }

  /**
   * Save processed papers cache
   */
  private async saveProcessedPapers(): Promise<void> {
    try {
      const processed = Object.fromEntries(this.processedPapers);
      await writeFile(
        this.processedPapersPath,
        JSON.stringify(processed, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("Error saving processed papers cache:", error);
    }
  }
}
