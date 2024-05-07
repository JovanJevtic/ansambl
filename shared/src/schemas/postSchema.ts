import { z } from "zod";
const zodSchema = z.object({
  text: z.string(),
});

export default zodSchema;
