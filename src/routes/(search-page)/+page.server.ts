import { configuration } from "$src/lib/server/configuration";

export const load: import("./$types").PageServerLoad = () => {
  console.log("title: " + configuration.zoektTitle);
  return {
    zoektTitle: configuration.zoektTitle,
  };
};
