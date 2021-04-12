import * as core from "@actions/core";
import {context} from "@actions/github/lib/utils";
import {GithubCheckPayload} from "./GithubTypes";
import {createCheck, filterFiles, getModifiedFiles, reportCheckResults, scanFile, updateCheck} from "./helpers";
import {TodoEntry} from "./TodoEntry";

async function run(): Promise<void> {
    let payload: GithubCheckPayload | undefined;
    try {
        let files: string[];
        switch (context.eventName) {
            case "pull_request":
                {
                    const base: string | undefined = context.payload.pull_request?.base?.sha;
                    const head: string | undefined = context.payload.pull_request?.head?.sha;

                    if (!base || !head) {
                        throw new Error("The base and head commits are missing from the payload info.");
                    }

                    payload = await createCheck(head);
                    files = await getModifiedFiles(base, head);
                }
                break;
            default:
                core.info(`Event type ${context.eventName} is not supported.`);
                return;
        }

        const pattern = core.getInput("pattern", {required: false});
        const excludePattern = core.getInput("exclude", {required: false});
        const includePattern = core.getInput("include", {required: false});

        const filteredFiles = filterFiles(files, excludePattern, includePattern);

        const entries = new Array<TodoEntry>();
        for (const file of filteredFiles) {
            entries.push(...scanFile(file, pattern));
        }

        core.info(`Found ${entries.length} issues.`);

        await reportCheckResults(payload, entries);
    } catch (error) {
        if (payload) {
            try {
                await updateCheck(payload, "failure");
            } catch (e) {
                core.info(`Failed to update check: ${payload}: ${e}`);
            }
        }
        core.setFailed(error.message);
    }
}

void run();
