import { useMount } from "react-use";

import { api } from "../../utils/api";

/**
 * Touching a poll updates a column with the current date. This information is used to
 * find polls that haven't been accessed for some time so that they can be deleted by house keeping.
 */
export const useTouchBeacon = (pollId: string) => {
  useMount(() => {
    api.api.polls.touch.post({ pollId });
  });
};
