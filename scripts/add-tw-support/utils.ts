import { readFileSync } from "fs";
import { pinyinToZhuyin as pyToZy } from "pinyin-zhuyin";

const simpToTrad: { [key: string]: string } = JSON.parse(
  readFileSync("./simpToTrad.json", "utf8")
);
const tradValues = Object.values(simpToTrad);

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

const updateTradTerms = (
  tradTerms: {
    toAppend: Array<any>;
    existing: Array<string>;
  },
  term: Array<any>
) => {
  if (tradValues.includes(term[0])) {
    tradTerms.existing.push(term[0]);
  } else if (
    term[0] in simpToTrad &&
    !tradTerms.existing.includes(simpToTrad[term[0]])
  ) {
    const tradTerm = JSON.parse(JSON.stringify(term));
    tradTerm[0] = simpToTrad[term[0]];
    tradTerms.toAppend.push(tradTerm);
  }

  return tradTerms;
};

export { pinyinToZhuyin, updateTradTerms };
