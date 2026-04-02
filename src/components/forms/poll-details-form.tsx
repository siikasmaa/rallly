import clsx from "clsx";
import * as m from "@/paraglide/messages";
import * as React from "react";
import { useForm } from "react-hook-form";

import { requiredString } from "../../utils/form-validation";
import { PollFormProps } from "./types";

export interface PollDetailsData {
  title: string;
  location: string;
  description: string;
}

export const PollDetailsForm: React.VoidFunctionComponent<
  PollFormProps<PollDetailsData>
> = ({ name, defaultValues, onSubmit, onChange, className }) => {
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm<PollDetailsData>({ defaultValues });

  React.useEffect(() => {
    if (onChange) {
      const subscription = watch(onChange);
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [onChange, watch]);

  return (
    <form
      id={name}
      className={clsx("max-w-full", className)}
      style={{ width: 500 }}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="formField">
        <label htmlFor="title">{m.app_title()}</label>
        <input
          type="text"
          id="title"
          className={clsx("input w-full", {
            "input-error": errors.title,
          })}
          placeholder={m.app_titlePlaceholder()}
          {...register("title", { validate: requiredString })}
        />
      </div>
      <div className="formField">
        <label htmlFor="location">{m.app_location()}</label>
        <input
          type="text"
          id="location"
          className="input w-full"
          placeholder={m.app_locationPlaceholder()}
          {...register("location")}
        />
      </div>
      <div className="formField">
        <label htmlFor="description">{m.app_description()}</label>
        <textarea
          id="description"
          className="input w-full"
          placeholder={m.app_descriptionPlaceholder()}
          rows={5}
          {...register("description")}
        />
      </div>
    </form>
  );
};
