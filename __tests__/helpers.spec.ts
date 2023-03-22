import * as fs from "fs";
import path from "path";
import * as tmp from "tmp";
import {filterFiles, scanFile} from "../src/helpers";
import {expect} from "chai";

describe("scanFile", () => {
    const testCases: {
        content: string;
        expectedMatches: number[];
        description: string;
        expectedMessages: string[];
    }[] = [
        {
            content: "// TODO: foo bar",
            expectedMatches: [1],
            description: "// TODO",
            expectedMessages: ["foo bar"],
        },
        {
            content: "# TODO blah blah",
            expectedMatches: [],
            description: "# TODO",
            expectedMessages: [],
        },
        {
            content: "",
            expectedMatches: [],
            description: "empty string",
            expectedMessages: [],
        },
    ];

    const tmpDir = tmp.dirSync().name;
    process.env.GITHUB_WORKSPACE = tmpDir;
    for (const tc of testCases) {
        it(`${tc.description}`, () => {
            const tempFile = path.basename(tmp.tmpNameSync());
            fs.writeFileSync(`${tmpDir}/${tempFile}`, tc.content);

            const results = scanFile(tempFile, undefined);
            expect(results.map(x => x.lineIndex)).to.have.members(tc.expectedMatches);
            results.forEach(x => expect(x.filePath).to.equal(tempFile));
        });
    }
});

describe("filterFiles", () => {
    describe("removes excluded file", () => {
        const files = ["README.md", "foo.ts", "__tests__/foo.ts", "dist/index.js"];
        const testCases: {
            glob: string;
            expected: string[];
        }[] = [
            {
                glob: "?(__tests__|dist)/**",
                expected: ["README.md", "foo.ts"],
            },
            {
                glob: "**/*",
                expected: [],
            },
            {
                glob: "foo.ts",
                expected: ["README.md", "__tests__/foo.ts", "dist/index.js"],
            },
            {
                glob: "**/foo.ts",
                expected: ["README.md", "dist/index.js"],
            },
            {
                glob: "**/*.+(js|md)",
                expected: ["foo.ts", "__tests__/foo.ts"],
            },
        ];

        for (const tc of testCases) {
            it(`with pattern '${tc.glob}'`, () => {
                const result = filterFiles(files, tc.glob);
                expect(result).to.have.members(tc.expected);
            });
        }
    });

    describe("removes non-included files", () => {
        const files = ["README.md", "foo.ts", "__tests__/foo.ts", "dist/index.js"];
        const testCases: {
            glob: string;
            expected: string[];
        }[] = [
            {
                glob: "?(__tests__|dist)/**",
                expected: ["__tests__/foo.ts", "dist/index.js"],
            },
            {
                glob: "**/*",
                expected: ["README.md", "foo.ts", "__tests__/foo.ts", "dist/index.js"],
            },
            {
                glob: "foo.ts",
                expected: ["foo.ts"],
            },
            {
                glob: "**/foo.ts",
                expected: ["foo.ts", "__tests__/foo.ts"],
            },
            {
                glob: "**/*.+(js|md)",
                expected: ["README.md", "dist/index.js"],
            },
        ];

        for (const tc of testCases) {
            it(`with pattern '${tc.glob}'`, () => {
                const result = filterFiles(files, "", tc.glob);
                expect(result).to.have.members(tc.expected);
            });
        }
    });
});
