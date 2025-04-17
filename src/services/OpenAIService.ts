// src/services/OpenAIService.ts

import OpenAI from "openai";
import type { Paper } from "../types/types";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE_URL,
    });
  }

  /**
   * Check which topics are relevant to the given paper
   * @param paper The paper to analyze
   * @param topics Array of research topics
   * @returns Array of relevant topics
   */
  async getRelevantTopics(paper: Paper, topics: string[]): Promise<string[]> {
    console.log("Analyzing paper:", paper);

    const prompt = `
Given a list of topics, identify which of them are related to this paper.
Respond with an array in JSON format. If no paper info is given/no topics are related, return an empty array.

Paper Title: ${paper.title}
Paper Abstract: ${paper.abstract}

Topics to consider:
${topics.map((topic) => `- ${topic}`).join("\n")}

Response format example: ["${topics[0]}"]
`;

    const response = await this.openai.chat.completions.create({
      model: "anthropic/claude-3-5-sonnet",
      messages: [
        {
          role: "system",
          content: "You are a research paper classifier.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1, // Lower temperature for more consistent results
    });

    try {
      const content = response.choices[0]?.message.content || "[]";
      console.log("Response:", content);
      const parsedTopics = JSON.parse(content) as string[];

      // Validate that returned topics are from the original list
      const validTopics = parsedTopics.filter((topic) =>
        topics.includes(topic)
      );

      if (validTopics.length !== parsedTopics.length) {
        console.warn(
          "Some returned topics were not in the original list and were filtered out"
        );
      }

      return validTopics;
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      return [];
    }
  }

  /**
   * Process multiple papers in batch to reduce API calls
   * @param papers Array of papers to analyze
   * @param topics Array of research topics
   * @returns Map of paper titles to their relevant topics
   */
  async batchProcessPapers(
    papers: Paper[],
    topics: string[]
  ): Promise<Map<Paper, string[]>> {
    const results = new Map<Paper, string[]>();

    // Process papers in parallel with a concurrency limit
    const concurrencyLimit = 1; // Adjust based on your needs
    const chunks = this.chunkArray(papers, concurrencyLimit);

    for (const chunk of chunks) {
      const promises = chunk.map((paper) =>
        this.getRelevantTopics(paper, topics).then((relevantTopics) => {
          results.set(paper, relevantTopics);
          console.log("", paper.title, "->", relevantTopics);
        })
      );

      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Helper method to chunk array for parallel processing
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
