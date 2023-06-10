import type { IOptions } from "ftp-ts";
import type { ConnectConfig } from "ssh2";

import type { Protocols } from "../config";

interface ConnectionConfigForProvider {
    sftp: ConnectConfig,
    ftp: IOptions,
    ftpes: IOptions,
}

export interface ConfigType<Protocol extends Protocols> {
    name: string;
    type: Protocol;
    destination: string;
    connection: ConnectionConfigForProvider[Protocol],
}

export interface Provider<T extends Protocols> {
    config: ConfigType<T>;

    send(file: string): Promise<void>;
    cleanup(): Promise<void>;
}

export function isSFTP(config: { type: string }): config is ConfigType<Protocols.sftp> {
    return config.type === 'sftp';
}

export function isFTP(config: { type: string }): config is ConfigType<Protocols.ftp | Protocols.ftpes> {
    return config.type === 'ftp' || config.type === 'ftpes';
}