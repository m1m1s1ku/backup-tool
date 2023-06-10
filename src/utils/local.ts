import { readdir, stat, unlink } from "fs/promises";
import { tmpdir } from "os";
import logger from "./logger";

/**
 * Cleanup script data. (.sql and .gz file in tmpdir)
 */
export async function cleanTempData(): Promise<void> {
    const dir = tmpdir();

    try {
      const files = await readdir(dir);
      for (const file of files) {
        const filePath = `${dir}/${file}`;
        const fileExtension = file.split('.').pop();
        const stats = await stat(filePath);
        if (stats.isFile() && (fileExtension === 'sql' || fileExtension === 'gz')) {
          await unlink(filePath);
          logger.info(`File ${filePath} removed.`);
        }
      }
    } catch (err) {
        logger.error(`Error while removing files in ${dir}. ${err}`);
    }
}