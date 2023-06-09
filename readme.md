# Backup tool

Simple Database Backup tool in NodeJS (using node-cron)

Backup a local database, compress, send to defined providers in config.
Also perform a cleanup task on providers. (Keep only 3 days of backups.)

```jsonc
{
    "settings": {
        // Start backup on script startup
        "backupOnInit": true,
        // every day at 02:00. @see: https://crontab.guru/
        "scheduleExpression": "0 2 * * *"
    },
    "db": {
        "host": "localhost",
        "user": "xxx",
        "password": "xxx",
        "name": "xxx"
    },
    "providers": [
        {
            "name": "siteA",
            "type": "sftp",
            "destination": "/remote-path",
            "connection": {
                "host": "remote-sftp-host",
                "port": 22,
                "username": "xxx",
                "password": "xxx"
            }
        },
        {
            "name": "siteB",
            "type": "ftpes",
            "destination": "/remote-path",
            "connection": {
                "host": "remote-ftpes-host",
                "port": 21,
                "user": "xxx",
                "password": "xxx",
                "secure": true,
                "connTimeout": 10000,
                "pasvTimeout": 10000,
                "dataTimeout": 10000,
                "aliveTimeout": 10000,
                "secureOptions": {}
            }
        }
    ]
}
```

## Usage

```sh
$ pnpm install
$ pnpm run dev
```

For production usage, use `pm2` or similar.

## License

[MIT License](./LICENSE)
