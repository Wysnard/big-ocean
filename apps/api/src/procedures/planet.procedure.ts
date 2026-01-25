import { os } from "../os.js";

export const listPlanet = os.planet.list.handler(async ({ input }) => {
  // your list code here
  return [{ id: 1, name: "name" }];
});

export const findPlanet = os.planet.find.handler(async ({ input }) => {
  // your find code here
  return { id: 1, name: "name" };
});

export const createPlanet = os.planet.create
  .use(({ context, next }) => {
    return next({ context: { user: { id: 1, name: "John Doe" } } });
  })
  .handler(async ({ input, context }) => {
    // your create code here
    return { id: 1, name: "name" };
  });
