import { search } from "../lib/index-store";

const query = process.argv.slice(2).join(" ");
if (!query) {
  console.error("Usage: npx tsx scripts/search.ts <query>");
  process.exit(1);
}

search(query).then((results) => {
  console.log(JSON.stringify(results, null, 2));
});
