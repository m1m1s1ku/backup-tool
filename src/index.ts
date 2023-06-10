import { schedule } from 'node-cron';

import config, { Protocols } from './config';

import { backupDatabase, compressBackup } from './utils/database';
import { cleanTempData } from './utils/local';
import { isFTP, isSFTP } from './providers';

import FTPProvider from './providers/ftp';
import SFTPProvider from './providers/sftp';
import logger from './logger';

if(config.settings?.allowSelfSigned ?? false) {
  // @todo : ask for self-signed to Ladidi?
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
}

async function backupJob(): Promise<void> {
  try {
    const backupFilePath = await backupDatabase(config.db);
    const compressedFilePath = await compressBackup(backupFilePath);

    for(const description of config.providers) {
      let provider: FTPProvider | SFTPProvider;

      if(isFTP(description)) {
        provider = new FTPProvider(description);
      } else if (isSFTP(description)) {
        provider = new SFTPProvider(description);
      } else {
        throw new Error(`Unknown provider type : ${description.type}, expected one of : ${Object.keys(Protocols).join(',')}`);
      }

      try {
        await provider.send(compressedFilePath);
        await provider.cleanup();
      } catch (err) {
        logger.error(`Error during job for ${description.name}`, err);
      }
    }

    try {
      await cleanTempData();
    } catch (err) {
      logger.error('Error during local cleanup', err);
    }
  } catch (err) {
    logger.error(err);
  }
}

if(!config.settings?.scheduleExpression) {
  throw new Error('Invalid config, no schedule expression defined');
}

schedule(config.settings.scheduleExpression, async () => {
  await backupJob();
});

if(config.settings?.backupOnInit) {
  backupJob();
}
