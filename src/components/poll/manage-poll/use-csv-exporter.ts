import { format } from "date-fns";
import * as m from "@/paraglide/messages";

import { usePoll } from "@/components/poll-context";

import { useParticipants } from "../../participants-provider";

export const useCsvExporter = () => {
  const { poll, options } = usePoll();
  const { participants } = useParticipants();
  return {
    exportToCsv: () => {
      const header = [
        m.app_participantCount({
          count: participants.length,
        }),
        ...options.map((decodedOption) => {
          const day = `${decodedOption.dow} ${decodedOption.day} ${decodedOption.month}`;
          return decodedOption.type === "date"
            ? day
            : `${day} ${decodedOption.startTime} - ${decodedOption.endTime}`;
        }),
      ].join(",");
      const rows = participants.map((participant) => {
        return [
          participant.name,
          ...poll.options.map((option) => {
            const vote = participant.votes.find((vote) => {
              return vote.optionId === option.id;
            });

            switch (vote?.type) {
              case "yes":
                return m.app_yes();
              case "ifNeedBe":
                return m.app_ifNeedBe();
              default:
                return m.app_no();
            }
          }),
        ].join(",");
      });
      const csv = `data:text/csv;charset=utf-8,${[header, ...rows].join(
        "\r\n",
      )}`;

      const encodedCsv = encodeURI(csv);
      const link = document.createElement("a");
      link.setAttribute("href", encodedCsv);
      link.setAttribute(
        "download",
        `${poll.title.replace(/\s/g, "_")}-${format(
          new Date(),
          "yyyyMMddHHmm",
        )}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  };
};
