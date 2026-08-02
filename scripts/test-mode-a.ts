import { processInboxRaw } from "../lib/mode-a";

processInboxRaw().then((summary) => {
  console.log(JSON.stringify(summary, null, 2));
});
