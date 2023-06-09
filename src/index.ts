import { schedule } from 'node-cron';

import config, { TransportProtocols } from './config';

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

    for(const description of config.providers) {
      let provider: Provider<'ftp' | 'ftpes' | 'sftp'>;

      switch (description.type) {
        case 'ftp':
        case 'ftpes':
          provider = new FTPProvider(description as ConfigType<'ftp' | 'ftpes'>);
          break;
        case 'sftp':
          provider = new SFTPProvider(description as ConfigType<'sftp'>);
          break;
        default:
          throw new Error('Unknown provider type');
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

schedule('0 2 * * *', async () => {
  await backupJob();
});

backupJob();