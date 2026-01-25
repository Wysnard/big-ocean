import {
  listPlanet,
  findPlanet,
  createPlanet,
} from "./procedures/planet.procedure.js";
import {
  createSession,
  sendMessage,
  getMessages,
  getSession,
  startTherapistAssessment,
  sendTherapistMessage,
  getTherapistResults,
} from "./procedures/chat.procedure.js";

export const router = {
  planet: {
    list: listPlanet,
    find: findPlanet,
    create: createPlanet,
  },
  chat: {
    createSession,
    sendMessage,
    getMessages,
    getSession,
    startTherapistAssessment,
    sendTherapistMessage,
    getTherapistResults,
  },
};

export default router;
