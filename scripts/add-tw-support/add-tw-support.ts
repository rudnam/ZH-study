import fs from "fs";
import path from "path";
import archiver from "archiver";
import AdmZip from "adm-zip";
import { pinyinToZhuyin, updateTradTerms } from "./utils";
import minimist from "minimist";
import cliProgress from "cli-progress";

const dictPath = "./dicts";
const convertedDictPath = "./converted-dicts";
const MAX_TERMS_PER_BANK = 8000;

const argv: minimist.ParsedArgs = minimist(process.argv.slice(2));
let addTradEntries = argv.trad ?? true;
let convertToZhuyin = argv.zhuyin ?? true;

const addTWSupport = () => {
  try {
    // Create output directory
    fs.mkdir(convertedDictPath, (err) => {
      if (err && err.code !== "EEXIST") throw err;
    });

    fs.readdir(dictPath, async (err, dictFiles) => {
      if (err) throw err;

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
        const output = fs.createWriteStream(dictOutputPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        await new Promise<void>((resolve, reject) => {
          output.on("close", () => {
            console.log(
              `Finished converting ${dictName}, Total size: ${
                archive.pointer() / 1e6
              } Megabytes.`
            );
            console.log("");
            resolve();
          });
          archive.on("warning", function (err) {
            if (err.code === "ENOENT") {
            } else {
              reject(err);
            }
          });
          archive.on("error", (err) => {
            reject(err);
          });
          archive.pipe(output);

          // Set up progress bar
          const progressBar = new cliProgress.SingleBar(
            {},
            cliProgress.Presets.shades_classic
          );
          const totalTerms = zipEntries.reduce(
            (totalTerms, entry) =>
              entry.name.match(/^term_bank|^term_meta_bank/)
                ? JSON.parse(zip.readAsText(entry)).length + totalTerms
                : totalTerms,
            0
          );
          progressBar.start(totalTerms, 0);

          // Iterate through dict's zip files
          let tradTerms: {
            toAppend: Array<any>;
            existing: Array<string>;
          } = {
            toAppend: [],
            existing: [],
          };
          let termBankNum = 0;
          let termBankName = "term_bank";
          let entryCount = 0;
          let appendedCount = 0;
          for (const zipEntry of zipEntries) {
            if (
              zipEntry.isDirectory ||
              !zipEntry.name.endsWith(".json") ||
              !zipEntry.name.match(/^index|^term_bank|^term_meta_bank/)
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

            // For term*_bank_x.json
            if (
              jsonFileName.includes("term_bank") ||
              jsonFileName.includes("term_meta_bank")
            ) {
              if (jsonFileName.includes("term_bank")) {
                termBankName = "term_bank";
              } else {
                termBankName = "term_meta_bank";
              }
              termBankNum++;

              let termBankJson = JSON.parse(jsonData);
              for (const term of termBankJson) {
                if (convertToZhuyin && termBankName === "term_bank") {
                  term[1] = pinyinToZhuyin(term[1]);
                }
                if (addTradEntries) {
                  tradTerms = updateTradTerms(tradTerms, term);
                }
                entryCount++;
              }

              archive.append(JSON.stringify(termBankJson), {
                name: jsonFileName,
              });

              progressBar.update(entryCount);
              continue;
            }
          }

          progressBar.stop();
          if (convertToZhuyin && termBankName === "term_bank")
            console.log(`${entryCount} entries converted to Zhuyin.`);

          // Add traditional entries
          if (addTradEntries) {
            let newTermBankJson: Array<any> = [];
            for (const term of tradTerms.toAppend.filter(
              (term) => !tradTerms.existing.includes(term[0])
            )) {
              newTermBankJson.push(term);
              appendedCount++;
              if (newTermBankJson.length >= MAX_TERMS_PER_BANK) {
                archive.append(JSON.stringify(newTermBankJson), {
                  name: `${termBankName}_${++termBankNum}.json`,
                });
                newTermBankJson = [];
              }
            }

            if (newTermBankJson.length > 0) {
              archive.append(JSON.stringify(newTermBankJson), {
                name: `${termBankName}_${++termBankNum}.json`,
              });
            }
            console.log(`${appendedCount} traditional terms appended.`);
          }

          archive.finalize();
        });
      }
    });
  } catch (e) {
    console.error(e);
  }
};

addTWSupport();
