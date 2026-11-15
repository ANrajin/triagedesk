import Anthropic from "@anthropic-ai/sdk";
import { Ajv } from "ajv";
import type { Issue } from "../github/Issue.ts";
import { triageSchema } from "./schema.ts";
import type { TriageResult } from "./schema.ts";

const MODEL = "claude-haiku-5-5";
const TOOL_NAME = "record_triage";
const MAX_BODY_CHARS = 8000;

const SYSTEM = "You triage GitHub issues for an e-commerce platform. Call the tool with your classification. " +
    "Use null instead of guessing. If the issue text is too thin to decide, use type 'unclear'.";

const client = new Anthropic();
const validate = new Ajv().compile(triageSchema);

export type Extraction = {
    triage: TriageResult,
    inputTokens: number,
    outputTokens: number
}

export async function extractTriage(issue: Issue): Promise<Extraction> {
    const body = (issue.body ?? "(empty)").slice(0, MAX_BODY_CHARS);

    const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM,
        tools: [{
            name: TOOL_NAME,
            description: "Record the triage classification for one GitHub issue.",
            input_schema: { ...triageSchema, required: [...triageSchema.required] },
        }],
        tool_choice: { type: "tool", name: TOOL_NAME },
        messages: [{ role: "user", content: `Title: ${issue.title}\n\nBody:\n${body}` }],
    });

    const block = response.content.find((b) => b.type === "tool_use");
    if (!block)
        throw new Error(`no tool call (stop_reason: ${response.stop_reason})`);

    if (!validate(block.input)) 
        throw new Error(`schema-invalid output: ${JSON.stringify(validate.errors)}`);

    return {
        triage: block.input,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
    };
}
