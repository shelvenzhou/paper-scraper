// Define the structure of a paper
export interface Paper {
  title: string;
  authors: string[];
  abstract: string;
  pdfUrl: string;
  paperUrl: string;
}

// Define the output format
export interface TopicOutput {
  topic: string;
  papers: Paper[];
}
