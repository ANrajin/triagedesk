export type Issue = {
    number: number,
    html_url: string,
    title: string,
    body: string | null,
    labels: Array<string>,
    state_reason: string | null,
    created_at: string,
    closed_at: string | null,
    author_association: string,
    comments: number
}