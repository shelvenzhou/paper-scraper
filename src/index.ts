import { config } from "dotenv";
import { CrawlerService } from "./services/CrawlerService";

// Load environment variables
config();

async function main() {
  const urls = [
    "https://www.ndss-symposium.org/ndss-program/ndss-2021/",
    "https://www.ndss-symposium.org/ndss-program/ndss-2022/",
    "https://www.ndss-symposium.org/ndss-program/symposium-2023/",
    "https://www.ndss-symposium.org/ndss-program/symposium-2024/",
    "https://www.ndss-symposium.org/ndss-program/symposium-2025/",
  ];

  const topics = [
    "Trusted Execution Environment",
    "SGX",
    "TDX",
    "Confidential Computing",
  ];

  const crawler = new CrawlerService();
  const result = await crawler.crawl(urls, topics);

  // Output results
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
