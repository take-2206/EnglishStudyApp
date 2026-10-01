export interface RawWord { id?: string; word: string; pos?: string; meaning?: string; example_en?: string; example_ja?: string }
export interface RawData { levels: { level: string; range: string; words?: RawWord[] }[] }
export interface Word { id: string; word: string; pos: string; meaning: string; exampleEn: string; exampleJa: string }
export interface Level { name: string; range: string; words: Word[] }
export interface Quiz { list: Word[]; idx: number; score: number; picked: Word | null; opts: Word[] }
export type View = "hub" | "home" | "study" | "grammar" | "manage";
export type Screen = "levels" | "days" | "modes";
export type Mode = "card" | "quiz" | "type";
export interface Question { s: string; o: string[]; a: number; e: string }
export interface Topic { id: string; icon: string; title: string; ja: string; summary: string; rules: string[]; examples: [string, string][]; q: Question[] }
