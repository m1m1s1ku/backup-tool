import type { IOptions } from "ftp-ts";
import type { ConnectConfig } from "ssh2";

import type { TransportProtocols } from "../config";

interface ConnectionConfigForProvider {
    sftp: ConnectConfig,
    ftp: IOptions,
    ftpes: IOptions,
}

export interface ConfigType<Protocol extends TransportProtocols> {
    name: string;
    type: Protocol;
    destination: string;
    connection: ConnectionConfigForProvider[Protocol],
}

export interface Provider<T extends TransportProtocols> {
    config: ConfigType<T>;

    send(file: string): Promise<void>;
    cleanup(): Promise<void>;
}
