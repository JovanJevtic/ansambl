import Redis from 'ioredis'
import env from './env'

const client = new Redis(env.REDIS_URL, {
  password: env.REDIS_PWD,
  connectTimeout: 10000,
  port: 6379
})

// https://github.com/redis/ioredis/issues/1042

client.on('connect', () => {
  console.log('Connected to Redis');
});

client.on('error', (err) => {
  console.error('Redis connection error:', err);
});


export default client