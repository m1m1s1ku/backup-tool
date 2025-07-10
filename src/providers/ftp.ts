import FTPClient from "ftp-ts";
import { basename, join } from "path";

import logger from "../utils/logger";
import { ageInDays } from "../utils/date";

import type { ConfigType, Provider, Protocols } from ".";
import Config from "../config";

export default class FTPProvider
  implements Provider<Protocols.ftp | Protocols.ftpes>
{
  constructor(public config: ConfigType<Protocols.ftp | Protocols.ftpes>) {}

  async send(file: string): Promise<void> {
    const ftpClient = await FTPClient.connect(this.config.connection);

    ftpClient.on("close", (isError: boolean) => {
      if (!isError) {
        logger.info(`File ${file} sent to ${this.config.name}`);
        return;
      }

      logger.error(`connection closed, with error: ${isError}`);
    });

    await ftpClient.put(file, join(this.config.destination, basename(file)));
    ftpClient.end();
  }

  async cleanup(): Promise<void> {
    const ftpClient = await FTPClient.connect(this.config.connection);
    const fileListing = await ftpClient.list(this.config.destination);
    const toDelete: Promise<void>[] = [];

    for (const file of fileListing) {
      if (typeof file === "string") {
        continue;
      }
      if (
        (file.name.endsWith(".gz") || file.name.endsWith(".zip")) &&
        file.date
      ) {
        const age = ageInDays(file.date);
        if (age > Config.settings.maxFileAge) {
          logger.info(`Deleting file ${file.name} in ${this.config.name}`);
          toDelete.push(
            ftpClient.delete(join(this.config.destination, file.name)),
          );
        }
      }
    }

    await Promise.all(toDelete);

    ftpClient.end();
  }
}
