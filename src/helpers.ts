import * as core from "@actions/core";
import {getOctokit, context} from "@actions/github";
import {GitHub} from "@actions/github/lib/utils";
import * as fs from "fs";
import {GithubCheckOutput, GithubCheckPayload} from "./GithubTypes";
import {TodoEntry} from "./TodoEntry";

export async function getModifiedFiles(base: string, head: string): Promise<string[]> {
    core.info(`Getting modified files between '${base}' and '${head}'`);

    const response = await getClient().repos.compareCommits({
        base,
        head,
        owner: context.repo.owner,
        repo: context.repo.repo,
    });

    if (response.status !== 200) {
        throw new Error(`Failed to compare commits - the Github API returned ${response.status}.`);
    }

    const files = new Array<string>();
    for (const file of response.data.files) {
        if (file.status === "removed") {
            continue;
        }

        files.push(file.filename);
    }

    core.info(`Found ${files.length} modified files.`);

    return files;
}

export function scanFile(path: string, pattern: string | undefined): TodoEntry[] {
    const result = new Array<TodoEntry>();
    const contents = fs.readFileSync(`${process.env.GITHUB_WORKSPACE}/${path}`, "utf-8").split("\n");

    core.info(`Procesing file: ${path}`);

    const todoRegex = /^[\W]+\/\/[\W]+TODO(?<text>.*)/gi;
    const githubRegex = /https:\/\/github.com/gm;
    const patternRegex = pattern ? new RegExp(pattern, "gi") : null;
    for (let i = 0; i < contents.length; i++) {
        const line = contents[i];
        const match = line.match(todoRegex);
        if (!match || !match.groups) {
            continue;
        }

        core.info(`TODO entry found in ${path}:${i} - ${line}`);

        const todoText = match.groups["text"];
        if (todoText.match(githubRegex)) {
            continue;
        }

        if (patternRegex && todoText.match(patternRegex)) {
            continue;
        }

        result.push({
            lineIndex: i,
            filePath: path,
        });
    }

    return result;
}

export async function reportCheckResults(payload: GithubCheckPayload, todoEntries: TodoEntry[]): Promise<void> {
    const hasFailures = todoEntries.length > 0;
    await updateCheck(payload, hasFailures ? "failure" : "success", {
        title: "Check TODOs",
        summary: hasFailures
            ? `Found ${todoEntries.length} TODO entries that don't have a link to a Github issue/Jira ticket.`
            : "No issues found.",
        text: "Where does this go?",
        annotations: todoEntries.map(e => {
            return {
                path: e.filePath,
                annotation_level: "warning",
                start_line: e.lineIndex,
                end_line: e.lineIndex,
                message: "TODO entry doesn't have a link to Github issue or Jira ticket",
            };
        }),
    });
}

export async function createCheck(head: string): Promise<GithubCheckPayload> {
    const payload: GithubCheckPayload = {
        status: "in_progress",
        name: "Check TODOs",
        owner: context.repo.owner,
        repo: context.repo.repo,
        started_at: new Date().toISOString(),
        head_sha: head,
    };
    const response = await getClient().checks.create(payload);

    core.info(`Created a check with Id: ${response.data.id}`);

    payload.check_run_id = response.data.id;
    return payload;
}

export async function updateCheck(
    payload: GithubCheckPayload,
    conclusion: "failure" | "success",
    output?: GithubCheckOutput,
): Promise<void> {
    payload.status = "completed";
    payload.completed_at = new Date().toISOString();
    payload.conclusion = conclusion;
    payload.output = output;
    await getClient().checks.update(payload);
}

function getClient(): InstanceType<typeof GitHub> {
    return getOctokit(core.getInput("token", {required: true}));
}
