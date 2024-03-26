# ZH-study

- [HSK Deck Template](#hsk-deck-template)

## HSK Deck Template

Modified card template for the [HSK Deck](https://www.reddit.com/r/ChineseLanguage/comments/7mjmjc/best_anki_deck_for_hsk_ive_come_across/).

<p align="center">
    <img src="./images/hsk.png" width="70%" />
</p>

Just copy and paste the following templates into Anki.

- Front Template

  ```html
  <div class="hanzi">{{Simplified}}</div>
  <span>{{Homograph}}</span>
  <div class="pinyin"><br /></div>
  <div class="english"><br /></div>
  <div class="description"><br /></div>
  <hr />
  <div class="sentence">{{SentenceSimplified}}</div>
  ```

- Back Template

  ```html
  <div class="hanzi">{{Simplified}}</div>
  <span>{{Homograph}}</span>
  <div class="pinyin">{{Pinyin.1}}</div>
  <div class="english">{{Meaning}}</div>
  <div class="description">{{Part of speech}}</div>
  <hr />
  <div class="sentence">{{SentenceSimplified}}</div>
  <div class="pinyinSen">{{SentencePinyin.1}}</div>
  <div class="meaningSent">{{SentenceMeaning}}</div>
  <div class="audio">{{Audio}} {{SentenceAudio}}</div>
  <br />
  {{SentenceImage}}

  <!-- Pitch colorizer -->
  <script>
    (() => {
      // Modified from https://www.reddit.com/r/Anki/comments/i6rmp6/chinese_flashcards_automatic_coloring_according/ by /u/Destroyer862K2
      decode_pinyin = function (pinyin) {
        const core = ["a", "e", "i", "o", "u", "ü"];
        let arr = pinyin.replace(/<b>|<\/b>|<div>|<\/div>/g, "").split("");

        is_core = function (c, c_previous_two = "", c_next = "") {
          //pre conditions
          if (
            c == "r" &&
            (c_next == " " || c_next == "") &&
            c_previous_two != " " &&
            c_previous_two != ""
          ) {
            return [true, true];
          }
          //pre conditions

          c = c
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
          for (let i = 0; i < core.length; i++) {
            if (c === core[i]) {
              return [true, false];
            }
          }
          return [false, false];
        };

        get_tone = function (str) {
          let pure = str.replace(/a|e|i|o|u|ü|r/g, "");
          if (pure == "") {
            return 5;
          } else if (["ā", "ē", "ī", "ō", "ū", "ǖ"].includes(pure)) {
            return 1;
          } else if (["á", "é", "í", "ó", "ú", "ǘ"].includes(pure)) {
            return 2;
          } else if (["ǎ", "ě", "ǐ", "ǒ", "ǔ", "ǚ"].includes(pure)) {
            return 3;
          } else if (["à", "è", "ì", "ò", "ù", "ǜ"].includes(pure)) {
            return 4;
          }

          return pure;
        };

        let tones_arr = [];
        let buff = [];

        flush = function () {
          if (buff.length > 0) {
            tones_arr.push(get_tone(buff.join("")));
            buff = [];
          }
        };
        for (let i = 0; i < arr.length; i++) {
          let res = is_core(arr[i], arr[i - 2], arr[i + 1]);
          if (res[1]) {
            flush();
          }
          if (res[0]) {
            buff.push(arr[i]);
          } else {
            flush();
          }
        }
        if (buff.length > 0) {
          tones_arr.push(get_tone(buff.join("")));
          buff = [];
        }
        return tones_arr;
      };

      recolor_pinyin = function (pinyin_element, hanzi_element) {
        let hanzi_sentence = hanzi_element.innerHTML;
        let decoded = decode_pinyin(pinyin_element.innerHTML);
        let hanzi_sentence_strip = hanzi_sentence.replace(
          / |<b>|<\/b>|\.|。|\?|？|!|！|<div>|<\/div>|，|，/g,
          ""
        );
        if (hanzi_sentence_strip.length == decoded.length) {
          let start = 0;
          for (i in hanzi_sentence_strip) {
            let index = hanzi_sentence.indexOf(hanzi_sentence_strip[i], start);
            let insertion =
              '<span class="tone-' +
              decoded[i] +
              '">' +
              hanzi_sentence_strip[i] +
              "</span>";
            hanzi_sentence =
              hanzi_sentence.substring(0, index) +
              insertion +
              hanzi_sentence.substring(index + 1);
            start = index + insertion.length;
          }
          hanzi_element.innerHTML = hanzi_sentence;
        }
      };

      let pinyin_element = document.querySelector(".pinyin");
      let hanzi_elements = [...document.querySelectorAll(".hanzi")];
      let pinyin_sentence_element = document.querySelector(".pinyinSen");
      let hanzi_sentence_elements = [...document.querySelectorAll(".sentence")];

      if (pinyin_element != null && hanzi_elements.length > 0) {
        for (const hanzi_element of hanzi_elements) {
          recolor_pinyin(pinyin_element, hanzi_element);
        }
      }
      if (
        pinyin_sentence_element != null &&
        hanzi_sentence_elements.length > 0
      ) {
        for (const hanzi_sentence_element of hanzi_sentence_elements) {
          recolor_pinyin(pinyin_sentence_element, hanzi_sentence_element);
        }
      }
    })();
  </script>
  ```

- Styling

  ```css
  @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100..900&family=Noto+Serif+SC&display=swap");

  :root {
    --font-sans: "Noto Sans SC", sans;
    --font-serif: "Noto Serif SC", serif;
    --color-faint: #575757;
    --color-tone-1: #ec464f;
    --color-tone-2: #6cbf43;
    --color-tone-3: #39bae6;
    --color-tone-4: #af85f4;
    --color-tone-5: #777777;
    font-size: 14px;
  }

  .card {
    font-family: var(--font-serif);
    text-align: left;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .hanzi {
    font-size: 5rem;
  }

  .sentence {
    font-size: 1.8rem;
  }

  .pinyin {
    font-size: 1.5rem;
  }

  .pinyinSen {
    font-size: 1.3rem;
  }

  .english {
    font-size: 1.2rem;
  }

  .meaningSent {
    text-align: left;
    font-size: 1.15rem;
  }

  .description {
    font-size: 1.15rem;
    color: var(--color-faint);
  }

  .audio {
    display: flex;
  }

  img {
    max-height: 250px;
  }

  .tone-1 {
    color: var(--color-tone-1);
  }
  .tone-2 {
    color: var(--color-tone-2);
  }
  .tone-3 {
    color: var(--color-tone-3);
  }
  .tone-4 {
    color: var(--color-tone-4);
  }
  .tone-5 {
    color: var(--color-tone-5);
  }
  ```
