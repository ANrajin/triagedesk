import { readFile, writeFile } from "node:fs/promises";
import type { Issue } from "./Issue.ts";

const SEED = 42;
const FROM_YEAR = "2022";
const OUT_FILE = "data/gold-sample.jsonl";

function mulberry32(seed: number): () => number {
    let a = seed;

    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

const random = mulberry32(SEED);

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

const only = (issue: Issue, label: string) => issue.labels.length === 1 && issue.labels[0] === label;

type Pool = { name: string; quota: number; test: (issue: Issue) => boolean };

const pools: Pool[] = [
    { name: "tiny body", quota: 10, test: (i) => (i.body?.trim().length ?? 0) < 40 },
    { name: "multi-label", quota: 5, test: (i) => i.labels.length > 1 },
    { name: "very long body", quota: 5, test: (i) => (i.body?.length ?? 0) > 5000 },
    { name: "on hold", quota: 15, test: (i) => only(i, "on hold / maybe wont") },
    { name: "unlabeled", quota: 15, test: (i) => i.labels.length === 0 },
    { name: "bug", quota: 18, test: (i) => only(i, "bug") },
    {
        name: "feature",
        quota: 18,
        test: (i) => only(i, "functionality / feature") || only(i, "enterprise / highlight feature"),
    },
    { name: "refactoring", quota: 7, test: (i) => only(i, "refactoring / source code") },
    { name: "discussion", quota: 7, test: (i) => only(i, "discussion / investigation") },
];

const text = await readFile("data/issues.jsonl", "utf8");
const recent = text
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as Issue)
    .filter((issue) => issue.created_at.slice(0, 4) >= FROM_YEAR);

const used = new Set<number>();
const sample: Array<Issue> = [];

for (const pool of pools) {
    const candidates = shuffle(recent.filter((i) => !used.has(i.number) && pool.test(i)));
    const picked = candidates.slice(0, pool.quota);
    for (const issue of picked) used.add(issue.number);
    sample.push(...picked);
    console.log(`${pool.name}: ${picked.length}/${pool.quota} (pool size ${candidates.length})`);
}

const ordered = shuffle(sample);
await writeFile(OUT_FILE, ordered.map((i) => JSON.stringify(i)).join("\n") + "\n");
console.log(`sample: ${ordered.length} issues written (first 30 = blind set)`);
