import { join } from "path";
import { tmpdir } from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';
import { createReadStream, createWriteStream } from "fs";
import { createGzip } from "zlib";
import { pipeline } from "stream";

export interface DBConfig {
    host: string;
    user: string;
    password: string;
    name: string;
}

export async function backupDatabase(config: DBConfig): Promise<string> {
    const backupFilePath = join(tmpdir(), `backup-${Date.now()}.sql`);
    const backupCommand = `mysqldump -h ${config.host} -u ${config.user} -p${config.password} ${config.name} > ${backupFilePath}`;
    await promisify(exec)(backupCommand);
    return backupFilePath;
}

export async function compressBackup(backupFilePath: string): Promise<string> {
    const compressedFilePath = join(tmpdir(), `backup-${Date.now()}.gz`);
    const input = createReadStream(backupFilePath);
    const output = createWriteStream(compressedFilePath);
    const gzip = createGzip();
    await promisify(pipeline)(input, gzip, output);
    return compressedFilePath;
}