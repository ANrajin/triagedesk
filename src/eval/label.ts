import { appendFile, readFile } from "node:fs/promises";
import { createInterface, type Interface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { Issue } from "../github/Issue.ts";

const SAMPLE_FILE = "data/gold-sample.jsonl";
const GOLD_FILE = "data/gold.jsonl";
const BLIND_COUNT = 30;
const MAX_BODY_CHARS = 3000;

const TYPES = ["bug", "feature", "refactoring", "discussion", "other", "unclear"] as const;
const SEVERITIES = ["critical", "high", "medium", "low"] as const;
const COMPONENTS = [
    "catalog", "cart-checkout", "orders", "payment", "shipping", "customers",
    "promotions", "admin-ui", "plugins", "core-platform", "other",
] as const;

type GoldLabel = {
    number: number;
    type: (typeof TYPES)[number];
    severity: (typeof SEVERITIES)[number] | null;
    component: (typeof COMPONENTS)[number] | null;
    missing_info: string[];
    notes: string;
    blind: boolean;
};

async function readJsonl<T>(path: string): Promise<Array<T>> {
    try {
        const text = await readFile(path, "utf8");
        return text.split("\n").filter((l) => l.length > 0).map((l) => JSON.parse(l) as T);
    } catch {
        return [];
    }
}

async function askChoice<T extends string>(
    rl: Interface,
    label: string,
    options: readonly T[],
    nullable: boolean,
): Promise<T | null> {
    while (true) {
        const hint = nullable ? `${options.join(" | ")} | (Enter = null)` : options.join(" | ");
        const answer = (await rl.question(`${label} [${hint}]: `)).trim().toLowerCase();
        if (answer === "q") {
            rl.close();
            process.exit(0); // every answer is saved as you go, so quitting is safe
        }
        if (answer === "" && nullable) return null;
        if (options.includes(answer as T)) return answer as T;
        console.log("  not a valid value, try again");
    }
}

const sample = await readJsonl<Issue>(SAMPLE_FILE);
const done = new Set((await readJsonl<GoldLabel>(GOLD_FILE)).map((g) => g.number));
const rl = createInterface({ input, output });

for (const [index, issue] of sample.entries()) {
    if (done.has(issue.number)) continue;

    const body = issue.body?.trim() || "(empty body)";
    console.log(`\n===== ${index + 1}/${sample.length}  #${issue.number} =====`);
    console.log(`TITLE: ${issue.title}\n`);
    console.log(body.length > MAX_BODY_CHARS ? body.slice(0, MAX_BODY_CHARS) + "\n...[truncated]" : body);
    console.log("\n(type q at any prompt to quit and resume later)\n");

    const type = await askChoice(rl, "type", TYPES, false);
    const severity = await askChoice(rl, "severity", SEVERITIES, true);
    const component = await askChoice(rl, "component", COMPONENTS, true);
    const missing = await rl.question("missing_info (comma separated, Enter = none): ");
    const notes = await rl.question("notes (Enter = none): ");

    const label: GoldLabel = {
        number: issue.number,
        type: type!,
        severity,
        component,
        missing_info: missing.split(",").map((s) => s.trim()).filter(Boolean),
        notes: notes.trim(),
        blind: index < BLIND_COUNT,
    };
    await appendFile(GOLD_FILE, JSON.stringify(label) + "\n");
}

rl.close();
console.log("all issues labeled");
