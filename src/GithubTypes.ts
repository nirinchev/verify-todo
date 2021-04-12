export interface GitHubAnnotation {
    path: string;
    annotation_level: "notice" | "warning" | "failure";
    start_line: number;
    end_line: number;
    message: string;
    title?: string;
}

export interface GithubCheckOutput {
    title: string;
    summary: string;
    text: string;
    annotations: GitHubAnnotation[];
}

export interface GithubCheckPayload {
    check_run_id?: number;
    status: "in_progress" | "completed";
    name: "Check TODOs";
    owner: string;
    repo: string;
    started_at: string;
    completed_at?: string;
    head_sha: string;
    conclusion?: "failure" | "success";
    output?: GithubCheckOutput;
    [key: string]: unknown;
}
