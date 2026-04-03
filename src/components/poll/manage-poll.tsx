import { Placement } from "@floating-ui/react";
import * as m from "@/paraglide/messages";
import * as React from "react";

import { Button } from "@/components/button";
import Cog from "@/components/icons/cog.svg?react";
import LockClosed from "@/components/icons/lock-closed.svg?react";
import LockOpen from "@/components/icons/lock-open.svg?react";
import Pencil from "@/components/icons/pencil-alt.svg?react";
import Save from "@/components/icons/save.svg?react";
import Table from "@/components/icons/table.svg?react";
import Trash from "@/components/icons/trash.svg?react";
import { encodeDateOption } from "@/utils/date-time-utils";

import Dropdown, { DropdownItem } from "../dropdown";
import { PollDetailsForm } from "../forms";
import { useModal } from "../modal";
import { useModalContext } from "../modal/modal-provider";
import { usePoll } from "../poll-context";
import { DeletePollForm } from "./manage-poll/delete-poll-form";
import { useCsvExporter } from "./manage-poll/use-csv-exporter";
import { useUpdatePollMutation } from "./mutations";

const PollOptionsForm = React.lazy(() => import("../forms/poll-options-form"));

const ManagePoll: React.VoidFunctionComponent<{
  placement?: Placement;
}> = ({ placement }) => {
  const { poll, getParticipantsWhoVotedForOption, setDeleted, urlId } =
    usePoll();

  const { exportToCsv } = useCsvExporter();

  const modalContext = useModalContext();

  const handleChangeOptions = () => {
    if (poll.legacy) {
      modalContext.render({
        overlayClosable: true,
        title: "Sorry!",
        description:
          "This poll was created with an older version of Rallly and does not support this feature.",
        cancelText: "Close",
      });
    } else {
      openChangeOptionsModal();
    }
  };

  const { mutate: updatePollMutation, isLoading: isUpdating } =
    useUpdatePollMutation();
  const [
    changeOptionsModalContextHolder,
    openChangeOptionsModal,
    closeChangeOptionsModal,
  ] = useModal({
    okText: m.app_save(),
    okButtonProps: {
      form: "pollOptions",
      htmlType: "submit",
      loading: isUpdating,
    },
    cancelText: m.app_cancel(),
    content: (
      <React.Suspense fallback={null}>
        <PollOptionsForm
          name="pollOptions"
          title={poll.title}
          defaultValues={{
            navigationDate: poll.options[0].value.split("/")[0],
            options: poll.options.map((option) => {
              const [start, end] = option.value.split("/");
              return end
                ? {
                    type: "timeSlot",
                    start,
                    end,
                  }
                : {
                    type: "date",
                    date: start,
                  };
            }),
            timeZone: poll.timeZone ?? "",
          }}
          onSubmit={(data) => {
            const encodedOptions = data.options.map(encodeDateOption);
            const optionsToDelete = poll.options.filter((option) => {
              return !encodedOptions.includes(option.value);
            });

            const optionsToAdd = encodedOptions.filter(
              (encodedOption) =>
                !poll.options.find((o) => o.value === encodedOption),
            );

            const onOk = () => {
              updatePollMutation(
                {
                  urlId: urlId,
                  timeZone: data.timeZone,
                  optionsToDelete: optionsToDelete.map(({ id }) => id),
                  optionsToAdd,
                },
                {
                  onSuccess: () => closeChangeOptionsModal(),
                },
              );
            };

            const optionsToDeleteThatHaveVotes = optionsToDelete.filter(
              (option) =>
                getParticipantsWhoVotedForOption(option.id).length > 0,
            );

            if (optionsToDeleteThatHaveVotes.length > 0) {
              modalContext.render({
                title: m.app_areYouSure(),
                description: m.app_deletingOptionsWarning(),
                onOk,
                okButtonProps: {
                  type: "danger",
                },
                okText: m.app_delete(),
                cancelText: m.app_cancel(),
              });
            } else {
              onOk();
            }
          }}
        />
      </React.Suspense>
    ),
  });

  const [
    changePollDetailsModalContextHolder,
    openChangePollDetailsModa,
    closePollDetailsModal,
  ] = useModal({
    okText: m.app_save(),
    okButtonProps: {
      form: "updateDetails",
      loading: isUpdating,
      htmlType: "submit",
    },
    cancelText: m.app_cancel(),
    content: (
      <PollDetailsForm
        name="updateDetails"
        defaultValues={{
          title: poll.title,
          location: poll.location ?? "",
          description: poll.description ?? "",
        }}
        className="p-4"
        onSubmit={(data) => {
          //submit
          updatePollMutation(
            { urlId, ...data },
            { onSuccess: closePollDetailsModal },
          );
        }}
      />
    ),
  });
  return (
    <div>
      {changeOptionsModalContextHolder}
      {changePollDetailsModalContextHolder}
      <Dropdown
        placement={placement}
        trigger={<Button icon={<Cog />}>{m.app_manage()}</Button>}
      >
        <DropdownItem
          icon={Pencil}
          label={m.app_editDetails()}
          onClick={openChangePollDetailsModa}
        />
        <DropdownItem
          icon={Table}
          label={m.app_editOptions()}
          onClick={handleChangeOptions}
        />
        <DropdownItem
          icon={Save}
          label={m.app_exportToCsv()}
          onClick={exportToCsv}
        />
        {poll.closed ? (
          <DropdownItem
            icon={LockOpen}
            label={m.app_unlockPoll()}
            onClick={() => updatePollMutation({ urlId, closed: false })}
          />
        ) : (
          <DropdownItem
            icon={LockClosed}
            label={m.app_lockPoll()}
            onClick={() => updatePollMutation({ urlId, closed: true })}
          />
        )}
        <DropdownItem
          icon={Trash}
          label={m.app_deletePoll()}
          onClick={() => {
            modalContext.render({
              overlayClosable: true,
              content: function Content({ close }) {
                return (
                  <DeletePollForm
                    onConfirm={async () => {
                      close();
                      setDeleted(true);
                    }}
                    onCancel={close}
                    urlId={urlId}
                  />
                );
              },
              footer: null,
            });
          }}
        />
      </Dropdown>
    </div>
  );
};

export default ManagePoll;
