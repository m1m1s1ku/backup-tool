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
import { zipFiles } from "./utils/files";

if (config.settings?.allowSelfSigned ?? false) {
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
      }, expected one of : ${Object.keys(Protocols).join(",")}`,
    );
  }
});

async function backupJob(): Promise<void> {
  try {
    for (const db of config.dbs) {
      const backupFilePath = await backupDatabase(db);
      const compressedFilePath = await compressBackup(db, backupFilePath);

      const jobs: Promise<void>[] = [];
      for (const provider of providers) {
        const job = async () => {
          try {
            await provider.send(compressedFilePath);
          } catch (err) {
            logger.error(
              `Error during db job for ${provider.config.name}, ${err}`,
            );
          }
        };

        jobs.push(job());
      }

      await Promise.all(jobs);
    }

    for (const files of config.files) {
      const jobs: Promise<void>[] = [];
      const zipFilePath = await zipFiles(files.name, files.source);
      for (const provider of providers) {
        const job = async () => {
          try {
            await provider.send(zipFilePath);
          } catch (err) {
            logger.error(
              `Error during files job for ${provider.config.name}, ${err}`,
            );
          }
        };

        jobs.push(job());
      }

      await Promise.all(jobs);
    }

    // Once everything is sent, cleanup providers
    for (const provider of providers) {
      try {
        await provider.cleanup();
      } catch (err) {
        logger.error(
          `Error during cleanup for ${provider.config.name}, ${err}`,
        );
      }
    }

    try {
      await cleanTempData();
    } catch (err) {
      logger.error(`Error during local cleanup, ${err}`);
    }
  } catch (err) {
    logger.error(`Error during backup ${err}`);
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

process.on("uncaughtException", (err) => {
  logger.error(`uncaughtException: ${err}`);
});

process.on("unhandledRejection", (err) => {
  logger.error(`unhandledRejection : ${err}`);
});
