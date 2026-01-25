import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { router } from "../../../api/src/router";

const link = new RPCLink({
  url: "http://127.0.0.1:4000",
  headers: { Authorization: "Bearer token" },
});

export const orpc: RouterClient<typeof router> = createORPCClient(link);
