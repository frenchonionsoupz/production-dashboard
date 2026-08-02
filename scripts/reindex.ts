import { reindex } from "../lib/index-store";

reindex().then((summary) => {
  console.log(JSON.stringify(summary, null, 2));
});
