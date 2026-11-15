import type { FetchState } from "./fetchState.ts";
import type { Issue } from "./Issue.ts";
import type { RawIssue } from "./RawIssue.ts";
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";

const ISSUES_FILE = "data/issues.jsonl";
const STATE_FILE = "data/fetch-state.json";
const MAX_RETRIES = 4;

const token = process.env.GITHUB_READ_TOKEN;
if (!token) {
    throw new Error("GITHUB_READ_TOKEN is not set (check .env and the --env-file flag)");
}

const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "triagedesk",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getNextUrl(linkHeader: string | null): string | null {
    if (!linkHeader) return null;
    // Header looks like: <url1>; rel="next", <url2>; rel="last"
    for (const part of linkHeader.split(",")) {
        const match = part.match(/<([^>]+)>;\s*rel="next"/);
        if (match) return match[1];
    }
    return null;
}

function getRateLimitWaitMs(res: Response): number {
    const retryAfter = res.headers.get("retry-after");
    if (retryAfter) return Number(retryAfter) * 1000;
    const reset = res.headers.get("x-ratelimit-reset");
    if (reset) return Math.max(Number(reset) * 1000 - Date.now(), 0) + 1000;
    return 60_000;
}

async function fetchWithRetry(url: string): Promise<Response> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        let waitMs = 2 ** attempt * 1000;

        let res: Response;

        try {
            res = await fetch(url, { headers });
        } catch (err) {
            if (attempt === MAX_RETRIES) throw err;

            console.log(`network error, retry ${attempt + 1} in ${waitMs / 1000}s`);
            await sleep(waitMs);
            continue;
        }

        if (res.ok) return res;

        const rateLimited = res.status === 429 ||
            (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0");

        if (!rateLimited && res.status < 500) {
            throw new Error(`GitHub request failed, not retryable: ${res.status} ${res.statusText}`);
        }

        if (attempt === MAX_RETRIES) {
            throw new Error(`GitHub request failed after retries: ${res.status} ${res.statusText}`);
        }

        if (rateLimited) waitMs = getRateLimitWaitMs(res);

        console.log(`status ${res.status}, retry ${attempt + 1} in ${Math.round(waitMs / 1000)}s`);
        await sleep(waitMs);
    }

    throw new Error("unreachable");
}

function toIssue(raw: RawIssue): Issue {
    return {
        number: raw.number,
        html_url: raw.html_url,
        title: raw.title,
        body: raw.body ?? null,
        labels: (raw.labels ?? []).map((l) => (typeof l === "string" ? l : l.name)),
        state_reason: raw.state_reason ?? null,
        created_at: raw.created_at,
        closed_at: raw.closed_at ?? null,
        author_association: raw.author_association,
        comments: raw.comments,
    };
}

async function loadExisting(): Promise<Set<number>> {
    const seen = new Set<number>();
    let text: string;

    try {
        text = await readFile(ISSUES_FILE, "utf-8");
    } catch {
        return seen;
    }

    const lines = text.split("\n").filter((line) => line.length > 0);
    const good: Array<string> = [];

    for (const line of lines) {
        try {
            seen.add((JSON.parse(line) as Pick<Issue, "number">).number);
            good.push(line);
        } catch {
            console.log("dropping corrupt line (crash during a previous write)");
        }
    }

    if (good.length < lines.length) {
        await writeFile(ISSUES_FILE, good.join("\n") + (good.length ? "\n" : ""));
    }
    return seen;
}

async function loadState(): Promise<FetchState> {
    try {
        return JSON.parse(await readFile(STATE_FILE, "utf8")) as FetchState;
    } catch {
        return { nextUrl: null, done: false };
    }
}

async function saveState(state: FetchState): Promise<void> {
    const tmp = `${STATE_FILE}.tmp`;
    await writeFile(tmp, JSON.stringify(state));
    await rename(tmp, STATE_FILE);
}

const params = new URLSearchParams({
    state: "closed",
    per_page: "100",
    sort: "created",
    direction: "asc",
})

const firstUrl: string | null = `https://api.github.com/repos/nopSolutions/nopCommerce/issues?${params}`;

await mkdir("data", { recursive: true });
const seen = await loadExisting();
const state = await loadState();

if (state.done) {
    console.log("fetch already complete. Delete data/fetch-state.json to start over.");
    process.exit(0);
}

let url: string | null = state.nextUrl ?? firstUrl;
let page = 0;
let saved = 0;
let prCount = 0;
let duplicates = 0;

while (url) {
    const res = await fetchWithRetry(url);
    const items = (await res.json()) as Array<RawIssue>;

    const nonPrs = items.filter((item) => !("pull_request" in item));
    const fresh = nonPrs.filter((item) => !seen.has(item.number));

    if (fresh.length > 0) {
        const lines = fresh.map((raw) => JSON.stringify(toIssue(raw))).join("\n") + "\n";
        await appendFile(ISSUES_FILE, lines);
        for (const raw of fresh) seen.add(raw.number);
    }

    page++;
    saved += fresh.length;
    prCount += items.length - nonPrs.length;
    duplicates += nonPrs.length - fresh.length;

    url = getNextUrl(res.headers.get("link"));
    await saveState({ nextUrl: url, done: url === null });

    console.log(
        `page ${page}: +${fresh.length} issues, ${items.length - nonPrs.length} PRs, remaining=${res.headers.get("x-ratelimit-remaining")}`,
    );
}

console.log(`done: ${saved} saved, ${prCount} PRs skipped, ${duplicates} duplicates skipped`);
