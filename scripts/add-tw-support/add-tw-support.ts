import fs from "fs/promises";
import path from "path";
import archiver from "archiver";
import { createWriteStream } from "fs";
import AdmZip from "adm-zip";
import { pinyinToZhuyin, updateToAppend } from "./utils";

const dictPath = "./dicts";
const convertedDictPath = "./converted-dicts";

// Toggle behavior here
let addTradEntries = true;
let convertToZhuyin = false;

(async () => {
  try {
    const dictFiles = await fs.readdir(dictPath);

    // Create output directory
    try {
      await fs.mkdir(convertedDictPath);
    } catch (error) {
      if (
        !(error instanceof Error) ||
        (error instanceof Error && "code" in error && error.code !== "EEXIST")
      ) {
        throw error;
      }
    }

    // Iterate through dict files
    for (const dictFile of dictFiles) {
      if (!dictFile.endsWith(".zip")) {
        continue;
      }
      const dictFilePath = path.join(dictPath, dictFile);
      const dictName = path.basename(dictFile, path.extname(dictFile));
      const stringToAppend = convertToZhuyin
        ? dictName.includes("[ZH-EN]")
          ? " (Zhuyin)"
          : dictName.includes("[ZH-")
          ? " (注音)"
          : ""
        : "";
      const dictOutputPath = path.join(
        convertedDictPath,
        dictName + stringToAppend + ".zip"
      );

      console.log(`Converting ${dictName}...`);

      const zip = new AdmZip(dictFilePath);
      const zipEntries = zip.getEntries();

      // Set up archiver
      const output = createWriteStream(dictOutputPath);
      const archive = archiver("zip", { zlib: { level: 9 } });
      await new Promise<void>((resolve, reject) => {
        output.on("close", () => {
          console.log(
            `Finished converting ${dictName}, ${
              toAppend.length
            } traditional terms appended. Total size: ${
              archive.pointer() / 1000000
            } Megabytes.`
          );
          resolve();
        });

        archive.on("error", (err) => {
          reject(err);
        });

        archive.pipe(output);

        // Iterate through dict's zip files
        let toAppend: Array<any> = [];
        let termBankNum = 0;
        let termBankName = "term_bank";
        let n = 0;
        for (const zipEntry of zipEntries) {
          if (
            zipEntry.isDirectory ||
            !zipEntry.name.endsWith(".json") ||
            (!zipEntry.name.includes("index") &&
              !zipEntry.name.includes("term_bank") &&
              !zipEntry.name.includes("term_meta_bank"))
          ) {
            continue;
          }

          const jsonData = zip.readAsText(zipEntry);
          const jsonFileName = path.basename(zipEntry.entryName);

          // For index.json
          if (jsonFileName === "index.json") {
            let indexJson = JSON.parse(jsonData);
            indexJson["title"] = indexJson["title"] + stringToAppend;
            archive.append(JSON.stringify(indexJson), { name: jsonFileName });
            continue;
          }

          // For term_bank_x.json
          if (jsonFileName.includes("term_bank")) {
            termBankNum += 1;
            let termBankJson = JSON.parse(jsonData);

            for (const term of termBankJson) {
              if (convertToZhuyin) term[1] = pinyinToZhuyin(term[1]);
              if (addTradEntries) toAppend = updateToAppend(toAppend, term);
              n += 1;
              if (n > 0 && n % 10000 === 0)
                console.log(`${n} entries converted.`);
            }
            archive.append(JSON.stringify(termBankJson), {
              name: jsonFileName,
            });
            continue;
          }

          // For term_meta_bank_x.json
          if (jsonFileName.includes("term_meta_bank")) {
            termBankName = "term_meta_bank";
            termBankNum += 1;
            let termBankJson = JSON.parse(jsonData);

            for (const term of termBankJson) {
              if (addTradEntries) toAppend = updateToAppend(toAppend, term);
              n += 1;
              if (n > 0 && n % 10000 === 0)
                console.log(`${n} entries converted.`);
            }
            archive.append(JSON.stringify(termBankJson), {
              name: jsonFileName,
            });
            continue;
          }
        }

        // Add traditional entries
        if (addTradEntries) {
          let newTermBankJson: Array<any> = [];
          let appended = 0;
          for (const term of toAppend) {
            if (appended > 0 && appended % 8000 === 0) {
              archive.append(JSON.stringify(newTermBankJson), {
                name: `${termBankName}_${termBankNum + 1}.json`,
              });
              termBankNum += 1;
              newTermBankJson = [];
            }
            newTermBankJson.push(term);
            appended += 1;
            n += 1;
            if (n > 0 && n % 10000 === 0)
              console.log(`${n} entries converted.`);
          }
          if (newTermBankJson.length > 0) {
            archive.append(JSON.stringify(newTermBankJson), {
              name: `${termBankName}_${termBankNum + 1}.json`,
            });
          }
        }

        archive.finalize();
      });
    }
  } catch (e) {
    console.error(e);
  }
})();
