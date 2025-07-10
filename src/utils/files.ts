import { tmpdir } from "os";
import { join } from "path";
import { zip } from "zip-a-folder";

export async function zipFiles(name: string, source: string) {
  const zipFilePath = join(tmpdir(), `files-${name}-${Date.now()}.zip`);
  await zip(source, zipFilePath);
  return zipFilePath;
}
