import FTPClient from "ftp-ts";
import { basename, join } from "path";

import logger from "../utils/logger";

import type { ConfigType, Provider, Protocols } from ".";

export default class FTPProvider implements Provider<Protocols.ftp | Protocols.ftpes> {
    constructor(public config: ConfigType<Protocols.ftp | Protocols.ftpes>) {}

    async send(file: string): Promise<void> {
        const ftpClient = await FTPClient.connect(this.config.connection);

        ftpClient.on('close', (isError: boolean) => {
          if(!isError) {
            logger.info(`File ${file} sent to ${this.config.name}`);
            return;
          }
      
          logger.error(`connection closed, with error: ${isError}`);
        });
      
        await ftpClient.put(file, join(this.config.destination, basename(file)));
        ftpClient.end();
    }

    async cleanup(): Promise<void> {
        const currentDate = new Date();

        const ftpClient = await FTPClient.connect(this.config.connection);
        const fileListing = await ftpClient.list(this.config.destination);
        const toDelete: Promise<void>[] = [];
    
        for(const file of fileListing) {
            if(typeof file === 'string') { continue; }
            if(file.name.endsWith('.gz') && file.date) {
                const ageInDays = Math.floor((currentDate.getTime() - file.date.getTime())) / 86400000;
                if(ageInDays > 2) {
                    logger.info(`Deleting file ${file.name} in ${this.config.name}`);
                    toDelete.push(ftpClient.delete(join(this.config.destination, file.name)));
                }
            }
        }
        
        await Promise.all(toDelete);

        ftpClient.end();
    }
}