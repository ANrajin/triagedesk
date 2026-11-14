import type { Issue } from "./github/Issue.ts";
import { appendFile, mkdir } from "node:fs/promises";

const MAX_PAGES = 3;
const token = process.env.GITHUB_READ_TOKEN;

if (!token) {
    throw new Error("GITHUB_READ_TOKEN is not set (check .env and the --env-file flag)");
}

function getNextUrl(linkHeader: string | null): string | null {
    if (!linkHeader) return null;
    // Header looks like: <url1>; rel="next", <url2>; rel="last"
    for (const part of linkHeader.split(",")) {
        const match = part.match(/<([^>]+)>;\s*rel="next"/);
        if (match) return match[1];
    }
    return null;
}

const params = new URLSearchParams({
    state: "closed",
    per_page: "100",
    sort: "created",
    direction: "asc",
})

let url: string | null = `https://api.github.com/repos/nopSolutions/nopCommerce/issues?${params}`;
let page: number = 0;
let issueCount: number = 0;
let prCount: number = 0;

function toIssue(raw: Record<string, any>): Issue {
    return {
        number: raw.number,
        html_url: raw.html_url,
        title: raw.title,
        body: raw.body ?? null,
        labels: (raw.labels ?? []).map((l: string | { name: string }) =>
            typeof l === "string" ? l : l.name,
        ),
        state_reason: raw.state_reason ?? null,
        created_at: raw.created_at,
        closed_at: raw.closed_at ?? null,
        author_association: raw.author_association,
        comments: raw.comments,
    };
}

await mkdir("data", { recursive: true });

while (url && page < MAX_PAGES) {
    const githubResponse = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "triagedesk"
        }
    })

    if (!githubResponse.ok) {
        throw new Error(`GitHub request failed: ${githubResponse.status} ${githubResponse.statusText}`)
    }

    const items = (await githubResponse.json()) as Array<Record<string, any>>;
    const issues = items.filter((item) => !("pull_request" in item));
    const prs = items.length - issues.length;

    if (issues.length > 0) {
        const lines = issues.map((raw) => JSON.stringify(toIssue(raw))).join("\n") + "\n";
        await appendFile("data/issues.jsonl", lines);
    }

    page++;
    prCount += prs;
    issueCount += issues.length;

    console.log(
        `page ${page}: ${items.length} items, ${prs} PRs, remaining=${githubResponse.headers.get("x-ratelimit-remaining")}`,
    );

    url = getNextUrl(githubResponse.headers.get("link"));
}

console.log(`done: ${issueCount} issues, ${prCount} PRs skipped`);
