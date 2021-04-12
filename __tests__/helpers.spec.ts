import * as fs from "fs";
import path from "path";
import * as tmp from "tmp";
import {scanFile} from "../src/helpers";
import {expect} from "chai";

const testCases: {
    content: string;
    expectedMatches: number[];
    description: string;
}[] = [
    {
        content: "// TODO: foo bar",
        expectedMatches: [0],
        description: "// TODO",
    },
];

describe("scanFile", () => {
    const tmpDir = tmp.dirSync().name;
    process.env.GITHUB_WORKSPACE = tmpDir;
    for (const tc of testCases) {
        it(`scanFile: ${tc.description}`, async () => {
            const tempFile = path.basename(tmp.tmpNameSync());
            fs.writeFileSync(`${tmpDir}/${tempFile}`, tc.content);

            const results = scanFile(tempFile, undefined);
            expect(results.map(x => x.lineIndex)).to.have.members(tc.expectedMatches);
            results.forEach(x => expect(x.filePath).to.equal(tempFile));
        });
    }
});
