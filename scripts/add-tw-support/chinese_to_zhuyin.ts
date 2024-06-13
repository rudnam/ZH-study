import axios from "axios";

// Define an interface for the table data
interface TableRow {
  traditional: string;
  simplified: string;
  zhuyin: string;
  english: string;
  frequency: string;
}

// Function to scrape the table data from the URL
async function scrapeTable(url: string): Promise<TableRow[]> {
  try {
    const { data } = await axios.get(url);
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, "text/html");
    const rows: TableRow[] = [];

    const tableRows = doc.querySelectorAll("tbody tr");
    tableRows.forEach((row: any) => {
      const cells = row.querySelectorAll("td");
      const traditional = cells[0].textContent?.trim() || "";
      const simplified = cells[1].textContent?.trim() || "";
      const zhuyin = cells[2].textContent?.trim() || "";
      const english = cells[3].textContent?.trim() || "";
      const frequency =
        cells[4].querySelector(".pie")?.getAttribute("style") || "";

      rows.push({
        traditional,
        simplified,
        zhuyin,
        english,
        frequency,
      });
    });

    return rows;
  } catch (error) {
    console.error("Error fetching or parsing data:", error);
    return [];
  }
}

// Function to convert a Mandarin word to Zhuyin
export async function convertToZhuyin(
  mandarinWord: string
): Promise<string | null> {
  const encodedWord = encodeURIComponent(mandarinWord);
  const url = `https://mandarinspot.com/dict?word=${encodedWord}&phs=zhuyin&sort=rel`;

  const tableData = await scrapeTable(url);

  if (tableData.length > 0) {
    console.log(mandarinWord, "found", tableData[0].simplified);
    return tableData[0].zhuyin;
  } else {
    return null;
  }
}
