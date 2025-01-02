import { configuration } from "$src/lib/server/configuration";

export const load: import("./$types").PageServerLoad = () => {
  return {
    neogrokTitle: configuration.neogrokTitle,
    dvcsMappings: configuration.dvcsMappings,
  };
};
