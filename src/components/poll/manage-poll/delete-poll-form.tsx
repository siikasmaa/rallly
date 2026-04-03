import clsx from "clsx";
import * as m from "@/paraglide/messages";

const usePlausible = () => (eventName: string, props?: unknown) => {};
import * as React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/button";
import Exclamation from "@/components/icons/exclamation.svg?react";

import { api } from "../../../utils/api";

const confirmText = "delete-me";

export const DeletePollForm: React.VoidFunctionComponent<{
  onCancel: () => void;
  onConfirm: () => void;
  urlId: string;
}> = ({ onCancel, onConfirm, urlId }) => {
  const { register, handleSubmit, formState, watch } =
    useForm<{ confirmation: string }>();

  const plausible = usePlausible();

  const confirmationText = watch("confirmation");
  const canDelete = confirmationText === confirmText;

  return (
    <div className="flex max-w-lg space-x-6 p-5">
      <div className="">
        <div className="rounded-full bg-rose-100 p-3">
          <Exclamation className="w-8 text-rose-500" />
        </div>
      </div>
      <form
        data-testid="delete-poll-form"
        onSubmit={handleSubmit(async () => {
          await api.api.polls.delete.post({ urlId });
          plausible("Deleted poll");
          onConfirm();
        })}
      >
        <div className="mb-3 text-xl font-medium text-slate-800">
          {m.app_areYouSure()}
        </div>
        <p className="text-slate-500">
          <span
            dangerouslySetInnerHTML={{
              __html: m.app_deletePollDescription({ confirmText }),
            }}
          />
        </p>
        <div className="mb-6">
          <input
            type="text"
            className={clsx("input w-full", {
              "input-error": formState.errors.confirmation,
            })}
            placeholder={confirmText}
            {...register("confirmation", {
              validate: (value) => value === confirmText,
            })}
            readOnly={formState.isSubmitting}
          />
        </div>
        <div className="flex space-x-3">
          <Button onClick={onCancel}>{m.app_cancel()}</Button>
          <Button
            disabled={!canDelete}
            htmlType="submit"
            type="danger"
            loading={formState.isSubmitting}
          >
            {m.app_deletePoll()}
          </Button>
        </div>
      </form>
    </div>
  );
};
