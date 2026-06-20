export interface BookEntry {
  name: string;
  chapters: number;
  testament: "OT" | "NT";
  usfm: string; // api.bible book ID
}

export const BOOKS: BookEntry[] = [
  // Old Testament
  { name: "Genesis", chapters: 50, testament: "OT", usfm: "GEN" },
  { name: "Exodus", chapters: 40, testament: "OT", usfm: "EXO" },
  { name: "Leviticus", chapters: 27, testament: "OT", usfm: "LEV" },
  { name: "Numbers", chapters: 36, testament: "OT", usfm: "NUM" },
  { name: "Deuteronomy", chapters: 34, testament: "OT", usfm: "DEU" },
  { name: "Joshua", chapters: 24, testament: "OT", usfm: "JOS" },
  { name: "Judges", chapters: 21, testament: "OT", usfm: "JDG" },
  { name: "Ruth", chapters: 4, testament: "OT", usfm: "RUT" },
  { name: "1 Samuel", chapters: 31, testament: "OT", usfm: "1SA" },
  { name: "2 Samuel", chapters: 24, testament: "OT", usfm: "2SA" },
  { name: "1 Kings", chapters: 22, testament: "OT", usfm: "1KI" },
  { name: "2 Kings", chapters: 25, testament: "OT", usfm: "2KI" },
  { name: "1 Chronicles", chapters: 29, testament: "OT", usfm: "1CH" },
  { name: "2 Chronicles", chapters: 36, testament: "OT", usfm: "2CH" },
  { name: "Ezra", chapters: 10, testament: "OT", usfm: "EZR" },
  { name: "Nehemiah", chapters: 13, testament: "OT", usfm: "NEH" },
  { name: "Esther", chapters: 10, testament: "OT", usfm: "EST" },
  { name: "Job", chapters: 42, testament: "OT", usfm: "JOB" },
  { name: "Psalms", chapters: 150, testament: "OT", usfm: "PSA" },
  { name: "Proverbs", chapters: 31, testament: "OT", usfm: "PRO" },
  { name: "Ecclesiastes", chapters: 12, testament: "OT", usfm: "ECC" },
  { name: "Song of Solomon", chapters: 8, testament: "OT", usfm: "SNG" },
  { name: "Isaiah", chapters: 66, testament: "OT", usfm: "ISA" },
  { name: "Jeremiah", chapters: 52, testament: "OT", usfm: "JER" },
  { name: "Lamentations", chapters: 5, testament: "OT", usfm: "LAM" },
  { name: "Ezekiel", chapters: 48, testament: "OT", usfm: "EZK" },
  { name: "Daniel", chapters: 12, testament: "OT", usfm: "DAN" },
  { name: "Hosea", chapters: 14, testament: "OT", usfm: "HOS" },
  { name: "Joel", chapters: 3, testament: "OT", usfm: "JOL" },
  { name: "Amos", chapters: 9, testament: "OT", usfm: "AMO" },
  { name: "Obadiah", chapters: 1, testament: "OT", usfm: "OBA" },
  { name: "Jonah", chapters: 4, testament: "OT", usfm: "JON" },
  { name: "Micah", chapters: 7, testament: "OT", usfm: "MIC" },
  { name: "Nahum", chapters: 3, testament: "OT", usfm: "NAH" },
  { name: "Habakkuk", chapters: 3, testament: "OT", usfm: "HAB" },
  { name: "Zephaniah", chapters: 3, testament: "OT", usfm: "ZEP" },
  { name: "Haggai", chapters: 2, testament: "OT", usfm: "HAG" },
  { name: "Zechariah", chapters: 14, testament: "OT", usfm: "ZEC" },
  { name: "Malachi", chapters: 4, testament: "OT", usfm: "MAL" },
  // New Testament
  { name: "Matthew", chapters: 28, testament: "NT", usfm: "MAT" },
  { name: "Mark", chapters: 16, testament: "NT", usfm: "MRK" },
  { name: "Luke", chapters: 24, testament: "NT", usfm: "LUK" },
  { name: "John", chapters: 21, testament: "NT", usfm: "JHN" },
  { name: "Acts", chapters: 28, testament: "NT", usfm: "ACT" },
  { name: "Romans", chapters: 16, testament: "NT", usfm: "ROM" },
  { name: "1 Corinthians", chapters: 16, testament: "NT", usfm: "1CO" },
  { name: "2 Corinthians", chapters: 13, testament: "NT", usfm: "2CO" },
  { name: "Galatians", chapters: 6, testament: "NT", usfm: "GAL" },
  { name: "Ephesians", chapters: 6, testament: "NT", usfm: "EPH" },
  { name: "Philippians", chapters: 4, testament: "NT", usfm: "PHP" },
  { name: "Colossians", chapters: 4, testament: "NT", usfm: "COL" },
  { name: "1 Thessalonians", chapters: 5, testament: "NT", usfm: "1TH" },
  { name: "2 Thessalonians", chapters: 3, testament: "NT", usfm: "2TH" },
  { name: "1 Timothy", chapters: 6, testament: "NT", usfm: "1TI" },
  { name: "2 Timothy", chapters: 4, testament: "NT", usfm: "2TI" },
  { name: "Titus", chapters: 3, testament: "NT", usfm: "TIT" },
  { name: "Philemon", chapters: 1, testament: "NT", usfm: "PHM" },
  { name: "Hebrews", chapters: 13, testament: "NT", usfm: "HEB" },
  { name: "James", chapters: 5, testament: "NT", usfm: "JAS" },
  { name: "1 Peter", chapters: 5, testament: "NT", usfm: "1PE" },
  { name: "2 Peter", chapters: 3, testament: "NT", usfm: "2PE" },
  { name: "1 John", chapters: 5, testament: "NT", usfm: "1JN" },
  { name: "2 John", chapters: 1, testament: "NT", usfm: "2JN" },
  { name: "3 John", chapters: 1, testament: "NT", usfm: "3JN" },
  { name: "Jude", chapters: 1, testament: "NT", usfm: "JUD" },
  { name: "Revelation", chapters: 22, testament: "NT", usfm: "REV" },
];

export function chapterCount(bookName: string): number {
  return BOOKS.find((b) => b.name === bookName)?.chapters ?? 1;
}

export function usfmId(bookName: string): string {
  return BOOKS.find((b) => b.name === bookName)?.usfm ?? bookName.toUpperCase().slice(0, 3);
}
