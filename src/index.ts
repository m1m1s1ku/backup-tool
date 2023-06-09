import { schedule } from 'node-cron';

import config from './config';

import { backupDatabase, compressBackup } from './utils/database';
import { cleanTempData } from './utils/local';
import { ConfigType, Provider } from './providers';

import FTPProvider from './providers/ftp';
import SFTPProvider from './providers/sftp';
import logger from './logger';

// @todo : ask for self-signed to Ladidi?
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

async function backupJob(): Promise<void> {
  try {
    const backupFilePath = await backupDatabase(config.db);
    const compressedFilePath = await compressBackup(backupFilePath);

    const providers: Provider<'ftp' | 'ftpes' | 'sftp'>[] = [];

    for(const description of config.providers) {
      if(description.type === 'ftp' || description.type === 'ftpes') {
        providers.push(new FTPProvider(description as ConfigType<'ftp' | 'ftpes'>));
      }
      if(description.type === 'sftp') {
        providers.push(new SFTPProvider(description as ConfigType<'sftp'>));
      }
    }

    for(const provider of providers) {
      await provider.send(compressedFilePath);
      await provider.cleanup();
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

schedule('0 2 * * *', async () => {
  await backupJob();
});

backupJob();