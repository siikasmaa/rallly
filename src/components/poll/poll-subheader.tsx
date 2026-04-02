import * as m from "@/paraglide/messages";
import * as React from "react";

import { formatDistanceToNow } from "date-fns";
import { useDayjs } from "../../utils/dayjs";
import Badge from "../badge";
import { usePoll } from "../poll-context";
import Tooltip from "../tooltip";

const PollSubheader: React.VoidFunctionComponent = () => {
  const { poll } = usePoll();
  const { locale } = useDayjs();
  return (
    <div className="text-slate-500/75 lg:text-lg">
      <div className="md:inline">
        <span
          dangerouslySetInnerHTML={{
            __html: m.app_createdBy({ name: poll.authorName }),
          }}
        />
        {poll.legacy && poll.admin ? (
          <Tooltip
            width={400}
            content="This poll was created with an older version of Rallly. Some features might not work."
          >
            <Badge color="amber" className="ml-1">
              Legacy
            </Badge>
          </Tooltip>
        ) : null}
        {poll.demo ? (
          <Tooltip content={m.app_demoPollNotice()}>
            <Badge color="blue" className="ml-1">
              Demo
            </Badge>
          </Tooltip>
        ) : null}
      </div>
      <span className="hidden md:inline">&nbsp;&bull;&nbsp;</span>
      <span className="whitespace-nowrap">
        {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true, locale })}
      </span>
    </div>
  );
};

export default PollSubheader;
