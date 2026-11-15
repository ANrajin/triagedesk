// Only the fields of GitHub's issue response that we read.
export type RawIssue = {
    number: number,
    html_url: string,
    title: string,
    body?: string | null,
    labels?: Array<string | { name: string }>,
    state_reason?: string | null,
    created_at: string,
    closed_at?: string | null,
    author_association: string,
    comments: number,
    pull_request?: unknown
}
