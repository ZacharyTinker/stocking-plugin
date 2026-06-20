export interface TranslationOption {
  id: string;
  name: string;
  provider: "esv" | "apibible";
  /** env var name that holds the Bible ID for api.bible translations */
  bibleIdEnvVar?: string;
  /** known public-domain Bible ID (no env var needed) */
  bibleId?: string;
  copyright: string;
}

export const TRANSLATIONS: TranslationOption[] = [
  {
    id: "esv",
    name: "ESV",
    provider: "esv",
    copyright:
      "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway. Used by permission. All rights reserved.",
  },
  {
    id: "kjv",
    name: "KJV",
    provider: "apibible",
    bibleId: "de4e12af7f28f599-02",
    copyright: "King James Version — public domain.",
  },
  {
    id: "niv",
    name: "NIV",
    provider: "apibible",
    bibleIdEnvVar: "API_BIBLE_NIV_ID",
    copyright:
      "Scripture taken from the Holy Bible, NEW INTERNATIONAL VERSION®, NIV® Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide.",
  },
  {
    id: "nasb",
    name: "NASB",
    provider: "apibible",
    bibleIdEnvVar: "API_BIBLE_NASB_ID",
    copyright:
      "Scripture quotations taken from the (NASB®) New American Standard Bible®, Copyright © 1960, 1971, 1977, 1995, 2020 by The Lockman Foundation. Used by permission. www.lockman.org",
  },
];

export function getTranslation(id: string): TranslationOption | undefined {
  return TRANSLATIONS.find((t) => t.id === id);
}
