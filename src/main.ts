import * as core from "@actions/core";
import {context} from "@actions/github/lib/utils";
import {createCheck, getModifiedFiles, reportCheckResults, scanFile} from "./helpers";
import {TodoEntry} from "./TodoEntry";

async function run(): Promise<void> {
    try {
        let files: string[];
        let checkId: number;
        switch (context.eventName) {
            case "pull_request":
                const base: string | undefined = context.payload.pull_request?.base?.sha;
                const head: string | undefined = context.payload.pull_request?.head?.sha;

                if (!base || !head) {
                    throw new Error("The base and head commits are missing from the payload info.");
                }

                checkId = await createCheck(head);
                files = await getModifiedFiles(base, head);
                break;
            default:
                core.info(`Event type ${context.eventName} is not supported.`);
                return;
        }

        const pattern = core.getInput("pattern", {required: false});

        const entries = new Array<TodoEntry>();
        for (const file of files) {
            entries.push(...scanFile(file, pattern));
        }

        core.info(`Found ${entries.length} issues.`);

        await reportCheckResults(checkId, entries);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
