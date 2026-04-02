const usePlausible = () => (eventName: string, props?: unknown) => {};

import * as React from "react";

import { api } from "../../utils/api";
import type { GetPollApiResponse } from "../../utils/types";
import { usePoll } from "../poll-context";
import { useSession } from "../session";
import { useParticipants } from "../participants-provider";
import { ParticipantForm } from "./types";

export const normalizeVotes = (
  optionIds: string[],
  votes: ParticipantForm["votes"],
) => {
  return optionIds.map((optionId, i) => ({
    optionId,
    type: votes[i]?.type ?? ("no" as const),
  }));
};

export const useAddParticipantMutation = () => {
  const session = useSession();
  const { refetch } = useParticipants();
  const plausible = usePlausible();
  const [isLoading, setIsLoading] = React.useState(false);

  const mutate = React.useCallback(
    async (
      input: {
        pollId: string;
        name: string;
        votes: Array<{ optionId: string; type: "yes" | "no" | "ifNeedBe" }>;
      },
      options?: { onSuccess?: (data: unknown) => void },
    ) => {
      setIsLoading(true);
      try {
        const { data } = await api.api.polls.participants.add.post(input);
        plausible("Add participant");
        session.refresh();
        await refetch();
        options?.onSuccess?.(data);
        return data;
      } finally {
        setIsLoading(false);
      }
    },
    [plausible, session, refetch],
  );

  return { mutate, mutateAsync: mutate, isLoading };
};

export const useUpdateParticipantMutation = () => {
  const { refetch } = useParticipants();
  const plausible = usePlausible();
  const [isLoading, setIsLoading] = React.useState(false);

  const mutate = React.useCallback(
    async (
      input: {
        pollId: string;
        participantId: string;
        name: string;
        votes: Array<{ optionId: string; type: "yes" | "no" | "ifNeedBe" }>;
      },
      options?: { onSuccess?: (data: unknown) => void },
    ) => {
      setIsLoading(true);
      try {
        const { data } = await api.api.polls.participants.update.post(input);
        plausible("Update participant");
        await refetch();
        options?.onSuccess?.(data);
        return data;
      } finally {
        setIsLoading(false);
      }
    },
    [plausible, refetch],
  );

  return { mutate, mutateAsync: mutate, isLoading };
};

export const useDeleteParticipantMutation = () => {
  const { refetch } = useParticipants();
  const plausible = usePlausible();
  const [isLoading, setIsLoading] = React.useState(false);

  const mutate = React.useCallback(
    async (
      input: { pollId: string; participantId: string },
      options?: { onSuccess?: () => void },
    ) => {
      setIsLoading(true);
      try {
        await api.api.polls.participants.delete.post(input);
        plausible("Remove participant");
        await refetch();
        options?.onSuccess?.();
      } finally {
        setIsLoading(false);
      }
    },
    [plausible, refetch],
  );

  return { mutate, mutateAsync: mutate, isLoading };
};

export const useUpdatePollMutation = () => {
  const { urlId, admin } = usePoll();
  const plausible = usePlausible();
  const [isLoading, setIsLoading] = React.useState(false);

  const mutate = React.useCallback(
    async (
      input: {
        urlId: string;
        title?: string;
        timeZone?: string;
        location?: string;
        description?: string;
        optionsToDelete?: string[];
        optionsToAdd?: string[];
        notifications?: boolean;
        closed?: boolean;
      },
      options?: { onSuccess?: (data: GetPollApiResponse) => void },
    ) => {
      setIsLoading(true);
      try {
        const { data } = await api.api.polls.update.post(input);
        plausible("Updated poll");
        options?.onSuccess?.(data as GetPollApiResponse);
        return data;
      } finally {
        setIsLoading(false);
      }
    },
    [plausible],
  );

  return { mutate, mutateAsync: mutate, isLoading };
};
