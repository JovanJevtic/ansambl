import redis from "redis";
import env from "./env";

const client = redis.createClient({
  url: env.REDIS_URL,
  password: env.REDIS_PWD,
});
