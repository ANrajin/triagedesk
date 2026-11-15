import { readFile } from "node:fs/promises";
import type { Issue } from "./Issue.ts";

const ISSUE_FILE = "data/issues.jsonl";

async function loadIssues(): Promise<Array<Issue>> {
    const text = await readFile(ISSUE_FILE, "utf-8");
    return text.split("\n").filter((line) => line.length > 0).map((line) => JSON.parse(line) as Issue);
}

const issues = await loadIssues();
console.log(`total issues: ${issues.length}`);

type LabelStats = {
    buckets: { unlabeled: number; single: number; multi: number };
    perLabel: Record<string, number>;
};

function countLabels(issues: Issue[]): LabelStats {
    const buckets = { unlabeled: 0, single: 0, multi: 0 };
    const perLabel: Record<string, number> = {};

    for (const issue of issues) {
        if (issue.labels.length === 0) buckets.unlabeled++;
        else if (issue.labels.length === 1) buckets.single++;
        else buckets.multi++;

        for (const label of issue.labels) {
            perLabel[label] = (perLabel[label] ?? 0) + 1;
        }
    }

    return { buckets, perLabel };
}

const { buckets, perLabel } = countLabels(issues);

console.log("label buckets:", buckets);
console.log("per label (highest first):");

for (const [label, count] of Object.entries(perLabel).sort(([, aCount], [, bCount]) => bCount - aCount)) {
    console.log(`  ${label}: ${count}`);
}

const TEMPLATE_HEADINGS: RegExp[] = [
    /steps to reproduce/i,
    /expected (result|behaviou?r)/i,
    /actual (result|behaviou?r)/i,
    /environment/i,
];

function followsTemplate(body: string | null): boolean {
    if (!body) return false;
    return TEMPLATE_HEADINGS.filter((re) => re.test(body)).length >= 2;
}

type profileBodies = {
    empty: number;
    short: number;
    template: number;
}

function profileBodies(issues: Issue[]): profileBodies {
    let empty = 0;
    let short = 0;
    let template = 0;

    for (const issue of issues) {
        const body = issue.body?.trim() ?? "";
        if (body.length === 0) empty++;
        else if (body.length < 40) short++;
        if (followsTemplate(issue.body)) template++;
    }

    return { empty, short, template };
}

type YearRow = { total: number; template: number; unlabeled: number };

function profileByYear(issues: Issue[]): Record<string, YearRow> {
    const byYear: Record<string, YearRow> = {};

    for (const issue of issues) {
        const year = issue.created_at.slice(0, 4);
        const row = (byYear[year] ??= { total: 0, template: 0, unlabeled: 0 });
        row.total++;
        if (followsTemplate(issue.body)) row.template++;
        if (issue.labels.length === 0) row.unlabeled++;
    }

    return byYear;
}

console.log("bodies:", profileBodies(issues));
console.table(profileByYear(issues));

const hardCases: Record<string, (issue: Issue) => boolean> = {
    "empty or tiny body": (i) => (i.body?.trim().length ?? 0) < 40,
    "no label": (i) => i.labels.length === 0,
    "multi-label": (i) => i.labels.length > 1,
    "unclear-type label": (i) =>
        i.labels.some((l) => l === "discussion / investigation" || l === "on hold / maybe wont"),
    "very long body": (i) => (i.body?.length ?? 0) > 5000,
};

for (const [name, test] of Object.entries(hardCases)) {
    const matches = issues.filter(test);
    console.log(`\n${name}: ${matches.length}`);
    for (const issue of matches.slice(-3)) {
        console.log(`  #${issue.number} ${issue.title}\n    ${issue.html_url}`);
    }
}