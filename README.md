# Verify TODOs have links

Verifies that `// TODO` comments in code contain a link to a Github issue or match a pattern specified by you. It doesn't
create tickets on your behalf - it rather validates that the ticket link is added to the TODO.

## Basic Usage

A simple workflow script can look like this:

```
name: "Workflow"
on: ["pull_request"]
jobs:
  build:
    runs-on: "ubuntu-latest"
    steps:
      - uses: "actions/checkout@v2"
      - name: "Verify TODOs"
        uses: "nirinchev/verify-todo@v1"
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          include: "**/*.+(cs|cpp|hpp)
          exclude: "external/**"
```

### Inputs

| Input | Required | Description |
|-|-|-|
| `token` | `true` | The Github token used by this action. This should be set to ${{ secrets.GITHUB_TOKEN }}. |
| `include` | `false` | A glob specifying a pattern for including files to process. Any file not matched by this glob will be ignored. |
| `exclude` | `false` | A glob specifying a pattern for excluding files from processing. Any file matched by this glob will be ignored. |
| `pattern` | `false` | A Regex pattern that will be used to match the text of the TODO item. By default, we'll look for a github link in the TODO text, but if you use a different issue tracker, you can provide the pattern here. For example, `MYPROJECT-[0-9]+`. |

### Supported triggers

Currently, only `pull_request` triggers are supported. It would be trivial to add support for `push` triggers, but I typically rely on PRs being green before merging and rarely check the build status of the main branch.

### Existing TODOs

This action will only evaluate files that were changed between the `base` and the `head` commit. This means that it will not generate warnings for existing TODOs without a link unless those were modified by the current PR.

## Contributing & Issues

This action is developed as a getting started project and is not extensively tested. If you encounter problems, feel free to open an issue or submit a pull request.
