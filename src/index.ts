import { schedule } from "node-cron";

import config from "./config";

import { backupDatabase, compressBackup } from "./utils/database";
import { cleanTempData } from "./utils/local";

import logger from "./utils/logger";

import {
  Protocols,
  isFTP,
  isSFTP,
  FTPProvider,
  SFTPProvider,
} from "./providers";

if (config.settings?.allowSelfSigned ?? false) {
  // @todo : ask for self-signed to Ladidi?
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
}

const providers = config.providers.map((description) => {
  if (isFTP(description)) {
    return new FTPProvider(description);
  } else if (isSFTP(description)) {
    return new SFTPProvider(description);
  } else {
    throw new Error(
      `Unknown provider type : ${
        description.type
      }, expected one of : ${Object.keys(Protocols).join(",")}`
    );
  }
});

async function backupJob(): Promise<void> {
  try {
    const backupFilePath = await backupDatabase(config.db);
    const compressedFilePath = await compressBackup(backupFilePath);

    const jobs: Promise<void>[] = [];
    for (const provider of providers) {
      const job = async () => {
        try {
          await provider.send(compressedFilePath);
          await provider.cleanup();
        } catch (err) {
          logger.error(`Error during job for ${provider.config.name}, ${err}`);
        }
      };

      jobs.push(job());
    }

    await Promise.all(jobs);

    try {
      await cleanTempData();
    } catch (err) {
      logger.error(`Error during local cleanup, ${err}`);
    }
  } catch (err) {
    logger.error(`Error during DB backup ${err}`);
  }
}

if (!config.settings?.scheduleExpression) {
  throw new Error("Invalid config, no schedule expression defined");
}

schedule(config.settings.scheduleExpression, async () => {
  await backupJob();
});

if (config.settings?.backupOnInit) {
  backupJob();
}
