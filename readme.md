# Backup tool

Simple Database Backup tool in NodeJS (using node-cron)

Backup a local database, compress, send to defined providers in config.
Also perform a cleanup task on providers. (Keep only 3 days of backups.)

```json
{
    "db": {
        "host": "localhost",
        "user": "xxx",
        "password": "xxx",
        "name": "xxx"
    },
    "providers": [
        {
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

## License

[MIT License](./LICENSE)
