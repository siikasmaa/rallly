import * as m from "@/paraglide/messages";
import React from "react";
import { useSessionStorage } from "react-use";

const usePlausible = () => (eventName: string, props?: unknown) => {};

import { encodeDateOption } from "../utils/date-time-utils";
import { api } from "../utils/api";
import { Button } from "./button";
import {
  NewEventData,
  PollDetailsData,
  PollDetailsForm,
  PollOptionsData,
  PollOptionsForm,
  UserDetailsData,
  UserDetailsForm,
} from "./forms";
import { SessionProps, useSession, withSession } from "./session";
import StandardLayout from "./standard-layout";
import Steps from "./steps";

type StepName = "eventDetails" | "options" | "userDetails";

const steps: StepName[] = ["eventDetails", "options", "userDetails"];

const required = <T,>(v: T | undefined): T => {
  if (!v) {
    throw new Error("Required value is missing");
  }

  return v;
};

const initialNewEventData: NewEventData = { currentStep: 0 };
const sessionStorageKey = "newEventFormData";

export interface CreatePollPageProps extends SessionProps {
  title?: string;
  location?: string;
  description?: string;
  view?: "week" | "month";
}

const Page: React.VoidFunctionComponent<CreatePollPageProps> = ({
  title,
  location,
  description,
  view,
}) => {
  const session = useSession();

  const [persistedFormData, setPersistedFormData] =
    useSessionStorage<NewEventData>(sessionStorageKey, {
      currentStep: 0,
      eventDetails: {
        title,
        location,
        description,
      },
      options: {
        view,
      },
      userDetails:
        session.user?.isGuest === false
          ? {
              name: session.user.name,
              contact: session.user.email,
            }
          : undefined,
    });

  const [formData, setTransientFormData] = React.useState(persistedFormData);

  const setFormData = React.useCallback(
    (newEventData: NewEventData) => {
      setTransientFormData(newEventData);
      setPersistedFormData(newEventData);
    },
    [setPersistedFormData],
  );

  const currentStepIndex = formData?.currentStep ?? 0;

  const currentStepName = steps[currentStepIndex];

  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  const plausible = usePlausible();

  const isBusy = isRedirecting || isCreating;

  const handleSubmit = async (
    data: PollDetailsData | PollOptionsData | UserDetailsData,
  ) => {
    if (currentStepIndex < steps.length - 1) {
      setFormData({
        ...formData,
        currentStep: currentStepIndex + 1,
        [currentStepName]: data,
      });
    } else {
      // last step
      const title = required(formData?.eventDetails?.title);
      setIsCreating(true);

      try {
        const { data: res } = await api.api.polls.create.post({
          title: title,
          type: "date",
          location: formData?.eventDetails?.location,
          description: formData?.eventDetails?.description,
          user: {
            name: required(formData?.userDetails?.name),
            email: required(formData?.userDetails?.contact),
          },
          timeZone: formData?.options?.timeZone,
          options: required(formData?.options?.options).map(encodeDateOption),
        });

        if (res && typeof res === "object" && "urlId" in res) {
          setIsRedirecting(true);
          plausible("Created poll", {
            props: {
              numberOfOptions: formData.options?.options?.length,
              optionsView: formData?.options?.view,
            },
          });
          setPersistedFormData(initialNewEventData);
          window.location.replace(`/admin/${res.urlId}?sharing=true`);
        }
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleChange = (
    data: Partial<PollDetailsData | PollOptionsData | UserDetailsData>,
  ) => {
    setFormData({
      ...formData,
      currentStep: currentStepIndex,
      [currentStepName]: data,
    });
  };

  return (
    <StandardLayout>
      <div className="max-w-full py-4 md:px-3 lg:px-6">
        <div className="mx-auto w-fit max-w-full lg:mx-0">
          <div className="mb-4 flex items-center justify-center space-x-4 px-4 lg:justify-start">
            <h1 className="m-0">{m.app_newPoll()}</h1>
            <Steps current={currentStepIndex} total={steps.length} />
          </div>
          <div className="overflow-hidden border-t border-b bg-white shadow-sm md:rounded-lg md:border">
            {(() => {
              switch (currentStepName) {
                case "eventDetails":
                  return (
                    <PollDetailsForm
                      className="max-w-full px-4 pt-4"
                      name={currentStepName}
                      defaultValues={formData?.eventDetails}
                      onSubmit={handleSubmit}
                      onChange={handleChange}
                    />
                  );
                case "options":
                  return (
                    <PollOptionsForm
                      className="grow"
                      name={currentStepName}
                      defaultValues={formData?.options}
                      onSubmit={handleSubmit}
                      onChange={handleChange}
                      title={formData.eventDetails?.title}
                    />
                  );
                case "userDetails":
                  return (
                    <UserDetailsForm
                      className="grow px-4 pt-4"
                      name={currentStepName}
                      defaultValues={formData?.userDetails}
                      onSubmit={handleSubmit}
                      onChange={handleChange}
                    />
                  );
              }
            })()}
            <div className="flex w-full justify-end space-x-3 border-t bg-slate-50 px-4 py-3">
              {currentStepIndex > 0 ? (
                <Button
                  disabled={isBusy}
                  onClick={() => {
                    setFormData({
                      ...persistedFormData,
                      currentStep: currentStepIndex - 1,
                    });
                  }}
                >
                  {m.app_back()}
                </Button>
              ) : null}
              <Button
                form={currentStepName}
                loading={isBusy}
                htmlType="submit"
                type="primary"
              >
                {currentStepIndex < steps.length - 1
                  ? m.app_continue()
                  : m.app_createPoll()}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
};

export default withSession(Page);
