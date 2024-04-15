import { readFileSync } from "fs";
import { pinyinToZhuyin as pyToZy } from "pinyin-zhuyin";

const simpToTrad: { [key: string]: string } = JSON.parse(
  readFileSync("./simpToTrad.json", "utf8")
);

const cleanUpPinyin = (reading: string) => {
  const replacements = {
    ɡ: "g",
    ị̌: "ǐ",
    ụ̀: "ù",
    ụ̌: "ǔ",
    ạ̌: "ǎ",
    ẹ̌: "ě",
    ọ̌: "ǒ",
    ụ̈: "ǔ",
    ị̄: "ī",
    ụ̈̌: "ǚ",
  };
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(key, "g");
    reading = reading.replace(regex, value);
  }

  return reading;
};

const pinyinToZhuyin = (reading: string) => {
  reading = cleanUpPinyin(reading);
  reading = pyToZy(reading);
  reading = reading.replace(/\s|\*|\-|\…/g, "");

  return reading;
};

const updateToAppend = (toAppend: Array<any>, term: Array<any>) => {
  if (term[0] in simpToTrad) {
    const tradTerm = JSON.parse(JSON.stringify(term));
    tradTerm[0] = simpToTrad[term[0]];
    toAppend.push(tradTerm);
  }

  const indexToRemove = toAppend.findIndex(
    (tradTerm) => tradTerm[0] === term[0]
  );
  if (indexToRemove !== -1) {
    toAppend.splice(indexToRemove, 1);
  }

  return toAppend;
};

export { pinyinToZhuyin, updateToAppend };
