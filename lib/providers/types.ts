import { Verse } from "@/types/scripture";

export interface BibleProvider {
  id: string;
  name: string;
  fetchPassage(ref: PassageRef): Promise<Verse[]>;
  listBooks?(): Promise<BookMeta[]>;
}

export interface PassageRef {
  book: string;
  startChapter: number;
  endChapter: number;
  startVerse?: number;
  endVerse?: number;
}

export interface BookMeta {
  id: string;
  name: string;
  abbreviation?: string;
  testament: "OT" | "NT";
}
