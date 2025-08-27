import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();
export const redis = createClient({
    username: 'default',
    password: `${process.env.REDIS_PASSWORD}`,
    socket: {
        host: `${process.env.REDIS_HOST}`,
        port: 19440
    }
});

redis.on('error', (err: any) => console.log('Redis Client Error', err));

await redis.connect();

await redis.set('foo', 'bar');
const result = await redis.get('foo');
console.log(result)  // >>> bar

