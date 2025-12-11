import { Question } from '../data/questions';

export interface NonCriticalEntry {
  id?: number;
  name: string;
  line: string;
  images: string[];
  note?: string;
}


export type QuestionsState = Record<string, Question[]>;
export type ImagesState = Record<string, Record<string, string[]>>;
