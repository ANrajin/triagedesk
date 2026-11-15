import { readFile } from "node:fs/promises";
import { Ajv } from "ajv";
import { triageSchema } from "../triage/schema.ts";
import type { GoldEntry } from "./GoldEntry.ts";

const GOLD_FILE = "data/gold.jsonl";

const text = await readFile(GOLD_FILE, "utf-8");
const entries = text
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as GoldEntry);

const ajv = new Ajv();
const validate = ajv.compile(triageSchema);

let valid = 0;

for (const entry of entries) {
    const { type, severity, component, missing_info } = entry;

    if (validate({ type, severity, component, missing_info })) {
        valid++;
    } else {
        console.log(`#${entry.number} invalid: ${ajv.errorsText(validate.errors)}`);
        process.exitCode = 1;
    }
}

console.log(`valid ${valid} of ${entries.length}`);