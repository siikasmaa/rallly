import type { Participant, Vote, VoteType } from "@/db/schema";
import * as m from "@/paraglide/messages";
import * as React from "react";

import { api } from "../utils/api";
import FullPageLoader from "./full-page-loader";
import { useRequiredContext } from "./use-required-context";

const ParticipantsContext =
  React.createContext<{
    participants: Array<Participant & { votes: Vote[] }>;
    getParticipants: (optionId: string, voteType: VoteType) => Participant[];
    refetch: () => void;
  } | null>(null);

export const useParticipants = () => {
  return useRequiredContext(ParticipantsContext);
};

export const ParticipantsProvider: React.VoidFunctionComponent<{
  children?: React.ReactNode;
  pollId: string;
}> = ({ children, pollId }) => {
  const [participants, setParticipants] = React.useState<
    Array<Participant & { votes: Vote[] }> | null
  >(null);

  const fetchParticipants = React.useCallback(async () => {
    const { data } = await api.api.polls.participants.list.get({
      query: { pollId },
    });
    if (data) {
      setParticipants(data as Array<Participant & { votes: Vote[] }>);
    }
  }, [pollId]);

  React.useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const getParticipants = (
    optionId: string,
    voteType: VoteType,
  ): Participant[] => {
    if (!participants) {
      return [];
    }
    return participants.filter((participant) => {
      return participant.votes.some((vote) => {
        return vote.optionId === optionId && vote.type === voteType;
      });
    });
  };

  if (!participants) {
    return <FullPageLoader>{m.app_loadingParticipants()}</FullPageLoader>;
  }

  return (
    <ParticipantsContext.Provider
      value={{ participants, getParticipants, refetch: fetchParticipants }}
    >
      {children}
    </ParticipantsContext.Provider>
  );
};
