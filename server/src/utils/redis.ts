import * as redis from "redis";
import env from "./env";

const client = redis.createClient({
  url: env.REDIS_URL,
  password: env.REDIS_PWD,
  pingInterval: 10000,
});

client.on("error", (err) => {
  console.log("Redis error: " + err);
});

client.on("connect", () => {
  console.log("connected!");
});

export default client;
