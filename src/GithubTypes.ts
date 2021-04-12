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
