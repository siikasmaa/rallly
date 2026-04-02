import clsx from "clsx";
import * as m from "@/paraglide/messages";
import * as React from "react";
import { useForm } from "react-hook-form";

const usePlausible = () => (eventName: string, props?: unknown) => {};

import { Button } from "@/components/button";
import Magic from "@/components/icons/magic.svg";
import { validEmail } from "@/utils/form-validation";

import { api } from "../utils/api";

const LoginForm: React.VoidFunctionComponent = () => {
  const { register, formState, handleSubmit, getValues } =
    useForm<{ email: string }>();

  const plausible = usePlausible();
  const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
  return (
    <div className="flex">
      <div className="hidden items-center rounded-tl-lg rounded-bl-lg bg-slate-50 p-6 md:flex">
        <Magic className="h-24 text-slate-300" />
      </div>
      <div className="max-w-sm p-6">
        <div className="mb-2 text-xl font-semibold">
          {m.app_loginViaMagicLink()}
        </div>
        {!formState.isSubmitSuccessful ? (
          <form
            onSubmit={handleSubmit(async ({ email }) => {
              plausible("Login requested");
              await api.api.login.post({ email, path: currentPath });
            })}
          >
            <div className="mb-2 text-slate-500">
              {m.app_loginViaMagicLinkDescription()}
            </div>
            <div className="mb-4">
              <input
                autoFocus={true}
                readOnly={formState.isSubmitting}
                className={clsx("input w-full", {
                  "input-error": formState.errors.email,
                })}
                placeholder="john.doe@email.com"
                {...register("email", { validate: validEmail })}
              />
              {formState.errors.email ? (
                <div className="mt-1 text-sm text-rose-500">
                  {m.app_loginWithValidEmail()}
                </div>
              ) : null}
            </div>
            <div className="flex space-x-3">
              <Button
                htmlType="submit"
                loading={formState.isSubmitting}
                type="primary"
              >
                {m.app_loginSendMagicLink()}
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <div className="text-slate-500">{m.app_loginMagicLinkSent()}</div>
            <div className="font-mono text-primary-500">
              {getValues("email")}
            </div>
            <div className="mt-2 text-slate-500">{m.app_loginCheckInbox()}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
