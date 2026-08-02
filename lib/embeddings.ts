import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    ) as Promise<FeatureExtractionPipeline>;
  }
  return extractorPromise;
}

/** Local, in-process embedding — no API key, no server, one-time model
 * download (~90MB) cached under the OS cache dir on first use. */
export async function embed(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}
