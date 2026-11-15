import { readFile } from "node:fs/promises";
import type { Issue } from "../github/Issue.ts";
import type { GoldEntry } from "../eval/GoldEntry.ts";
import { extractTriage } from "./extract.ts";

async function readJsonl<T>(file: string): Promise<Array<T>> {
    const text = await readFile(file, "utf-8");
    return text
        .split("\n")
        .filter((line) => line.length > 0)
        .map((line) => JSON.parse(line) as T);
}

const gold = await readJsonl<GoldEntry>("data/gold.jsonl");
const issues = await readJsonl<Issue>("data/issues.jsonl");

const number = Number(process.argv[2] ?? gold[0].number);
const goldEntry = gold.find((g) => g.number === number);
const issue = issues.find((i) => i.number === number);

if (!goldEntry || !issue) {
    throw new Error(`issue #${number} not found in both gold.jsonl and issues.jsonl`);
}

const result = await extractTriage(issue);

console.log(`#${issue.number} ${issue.title}`);
console.log("claude:", result.triage);
console.log("gold:  ", {
    type: goldEntry.type,
    severity: goldEntry.severity,
    component: goldEntry.component,
    missing_info: goldEntry.missing_info,
});
console.log(`tokens: ${result.inputTokens} in, ${result.outputTokens} out`);
