import { Client } from "ssh2";
import { createReadStream } from "fs";
import { basename, join } from "path";

import logger from "../utils/logger";
import { ageInDays } from "../utils/date";

import type { ConfigType, Provider, Protocols } from ".";
import Config from "../config";

export default class SFTPProvider implements Provider<Protocols.sftp> {
  constructor(public config: ConfigType<Protocols.sftp>) {}

  async send(file: string): Promise<void> {
    const client = new Client();
    await new Promise<void>((resolve, reject) => {
      client.on("ready", () => {
        client.sftp((err, sftp) => {
          if (err) reject(err);
          const localFilePath = createReadStream(file);
          const remoteFilePath = join(this.config.destination, basename(file));
          const remoteFileStream = sftp.createWriteStream(remoteFilePath);
          localFilePath
            .pipe(remoteFileStream)
            .on("error", reject)
            .on("close", () => {
              logger.info(`File ${file} sent to ${this.config.name}`);
              client.end();
              resolve();
            });
        });
      });
      client.connect(this.config.connection);
    });
  }

  async cleanup(): Promise<void> {
    const client = new Client();
    await new Promise<void>((resolve, reject) => {
      client.on("ready", () => {
        client.sftp((err, sftp) => {
          if (err) reject(err);
          sftp.readdir(this.config.destination, (err, files) => {
            if (err) reject(err);

            const deletePromises = files
              .filter((file) => file.filename.endsWith(".gz"))
              .map((file) => ({
                ...file,
                age: ageInDays(new Date(file.attrs.mtime * 1000)),
              }))
              .filter((file) => file.age > Config.settings.maxFileAge)
              .map((file) => {
                const filePath = join(this.config.destination, file.filename);
                return new Promise<void>((resolve, reject) => {
                  sftp.unlink(filePath, (err) => {
                    if (err) reject(err);
                    logger.info(
                      `Deleting file ${file.filename} in ${this.config.name}`
                    );
                    resolve();
                  });
                });
              });

            Promise.all(deletePromises)
              .then(() => {
                client.end();
                resolve();
              })
              .catch(reject);
          });
        });
      });
      client.connect(this.config.connection);
    });
  }
}
