import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import * as m from "@/paraglide/messages";
import React from "react";
import { Toaster } from "react-hot-toast";

import Menu from "@/components/icons/menu.svg?react";
import User from "@/components/icons/user.svg?react";
import UserCircle from "@/components/icons/user-circle.svg?react";
import Logo from "~/public/logo.svg?react";

import { DayjsProvider } from "../utils/dayjs";
import Dropdown, { DropdownItem, DropdownProps } from "./dropdown";
import Adjustments from "./icons/adjustments.svg?react";
import DotsVertical from "./icons/dots-vertical.svg?react";
import Login from "./icons/login.svg?react";
import Logout from "./icons/logout.svg?react";
import Pencil from "./icons/pencil.svg?react";
import Question from "./icons/question-mark-circle.svg?react";
import LoginForm from "./login-form";
import { useModal } from "./modal";
import ModalProvider, { useModalContext } from "./modal/modal-provider";
import Popover from "./popover";
import Preferences from "./preferences";
import { useSession } from "./session";

const HomeLink = () => {
  return (
    <a href="/">
      <Logo className="inline-block w-28 text-primary-500 transition-colors active:text-primary-600 lg:w-32" />
    </a>
  );
};

const MobileNavigation: React.VoidFunctionComponent<{
  openLoginModal: () => void;
}> = ({ openLoginModal }) => {
  const { user } = useSession();
  return (
    <div
      className="fixed top-0 z-40 flex h-12 w-full shrink-0 items-center justify-between border-b bg-gray-50
     px-4 lg:hidden"
    >
      <div>
        <HomeLink />
      </div>
      <div className="flex items-center">
        {user ? null : (
          <button
            onClick={openLoginModal}
            className="flex w-full cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300"
          >
            <Login className="h-5 opacity-75" />
            <span className="inline-block">{m.app_login()}</span>
          </button>
        )}
        <AnimatePresence initial={false}>
          {user ? (
            <UserDropdown
              openLoginModal={openLoginModal}
              placement="bottom-end"
              trigger={
                <motion.button
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{
                    y: -50,
                    opacity: 0,
                  }}
                  data-testid="user"
                  className="group inline-flex w-full items-center space-x-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-slate-500/10 active:bg-slate-500/20"
                >
                  <div className="relative shrink-0">
                    <UserCircle className="w-5 opacity-75 group-hover:text-primary-500 group-hover:opacity-100" />
                  </div>
                  <div className="hidden max-w-[120px] truncate font-medium xs:block">
                    {user.shortName}
                  </div>
                </motion.button>
              }
            />
          ) : null}
        </AnimatePresence>
        <Popover
          placement="bottom-end"
          trigger={
            <button
              type="button"
              className="group flex items-center whitespace-nowrap rounded-md px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300"
            >
              <Adjustments className="h-5 opacity-75 group-hover:text-primary-500" />
              <span className="ml-2 hidden sm:block">
                {m.app_preferences()}
              </span>
            </button>
          }
        >
          <Preferences />
        </Popover>
        <Popover
          placement="bottom-end"
          trigger={
            <button
              type="button"
              className="group flex items-center rounded-md px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300"
            >
              <Menu className="w-5 group-hover:text-primary-500" />
              <span className="ml-2 hidden sm:block">{m.app_menu()}</span>
            </button>
          }
        >
          <AppMenu className="-m-2" />
        </Popover>
      </div>
    </div>
  );
};

const AppMenu: React.VoidFunctionComponent<{ className?: string }> = ({
  className,
}) => {
  return (
    <div className={clsx("space-y-1", className)}>
      <a href="/new" className="flex cursor-pointer items-center space-x-2 whitespace-nowrap rounded-md px-2 py-1 pr-4 font-medium text-slate-600 transition-colors hover:bg-gray-200 hover:text-slate-600 hover:no-underline active:bg-gray-300">
          <Pencil className="h-5 opacity-75 " />
          <span className="inline-block">{m.app_newPoll()}</span>
      </a>
    </div>
  );
};

const UserDropdown: React.VoidFunctionComponent<
  DropdownProps & { openLoginModal: () => void }
> = ({ children, openLoginModal, ...forwardProps }) => {
  const { logout, user } = useSession();
  const modalContext = useModalContext();
  if (!user) {
    return null;
  }
  return (
    <Dropdown {...forwardProps}>
      {children}
      {user.isGuest ? (
        <DropdownItem
          icon={Question}
          label={m.app_whatsThis()}
          onClick={() => {
            modalContext.render({
              showClose: true,
              content: (
                <div className="w-96 max-w-full p-6 pt-28">
                  <div className="absolute left-0 -top-8 w-full text-center">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full border-8 border-white bg-gradient-to-b from-purple-400 to-primary-500">
                      <User className="h-7 text-white" />
                    </div>
                    <div className="">
                      <div className="text-lg font-medium leading-snug">
                        Guest
                      </div>
                      <div className="text-sm text-slate-500">
                        {user.shortName}
                      </div>
                    </div>
                  </div>
                  <p>{m.app_guestSessionNotice()}</p>
                </div>
              ),
              overlayClosable: true,
              footer: null,
            });
          }}
        />
      ) : null}
      {!user.isGuest ? (
        <DropdownItem
          href="/profile"
          icon={User}
          label={m.app_yourProfile()}
        />
      ) : null}
      {user.isGuest ? (
        <DropdownItem
          icon={Login}
          label={m.app_login()}
          onClick={openLoginModal}
        />
      ) : null}
      <DropdownItem
        icon={Logout}
        label={user.isGuest ? m.app_forgetMe() : m.app_logout()}
        onClick={() => {
          if (user?.isGuest) {
            modalContext.render({
              title: m.app_areYouSure(),
              description: m.app_endingGuestSessionNotice(),

              onOk: logout,
              okButtonProps: {
                type: "danger",
              },
              okText: m.app_endSession(),
              cancelText: m.app_cancel(),
            });
          } else {
            logout();
          }
        }}
      />
    </Dropdown>
  );
};

const StandardLayout: React.VoidFunctionComponent<{
  children?: React.ReactNode;
}> = ({ children, ...rest }) => {
  const { user } = useSession();
  const [loginModal, openLoginModal] = useModal({
    footer: null,
    overlayClosable: true,
    showClose: true,
    content: <LoginForm />,
  });

  return (
    <ModalProvider>
      <DayjsProvider>
        <Toaster />
        <div
          className="relative flex min-h-full flex-col bg-gray-50 lg:flex-row"
          {...rest}
        >
          {loginModal}
          <MobileNavigation openLoginModal={openLoginModal} />
          <div className="hidden grow px-4 pt-6 pb-5 lg:block">
            <div className="sticky top-6 float-right w-48 items-start">
              <div className="mb-8 px-3">
                <HomeLink />
              </div>
              <div className="mb-4">
                <a href="/new" className="group mb-1 flex items-center space-x-3 whitespace-nowrap rounded-md px-3 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-500/10 hover:text-slate-600 hover:no-underline active:bg-slate-500/20">
                    <Pencil className="h-5 opacity-75 group-hover:text-primary-500 group-hover:opacity-100" />
                    <span className="grow text-left">{m.app_newPoll()}</span>
              </a>
                <Popover
                  placement="right-start"
                  trigger={
                    <button className="group flex w-full items-center space-x-3 whitespace-nowrap rounded-md px-3 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-500/10 hover:text-slate-600 hover:no-underline active:bg-slate-500/20">
                      <Adjustments className="h-5 opacity-75 group-hover:text-primary-500 group-hover:opacity-100" />
                      <span className="grow text-left">
                        {m.app_preferences()}
                      </span>
                      <DotsVertical className="h-4 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  }
                >
                  <Preferences />
                </Popover>
                {user ? null : (
                  <button
                    onClick={openLoginModal}
                    className="group flex w-full items-center space-x-3 whitespace-nowrap rounded-md px-3 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-500/10 hover:text-slate-600 hover:no-underline active:bg-slate-500/20"
                  >
                    <Login className="h-5 opacity-75 group-hover:text-primary-500 group-hover:opacity-100" />
                    <span className="grow text-left">{m.app_login()}</span>
                  </button>
                )}
              </div>
              <AnimatePresence initial={false}>
                {user ? (
                  <UserDropdown
                    className="mb-4 w-full"
                    placement="bottom-end"
                    openLoginModal={openLoginModal}
                    trigger={
                      <motion.button
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{
                          x: -20,
                          opacity: 0,
                          transition: { duration: 0.2 },
                        }}
                        className="group w-full rounded-lg p-2 px-3 text-left text-inherit transition-colors hover:bg-slate-500/10 active:bg-slate-500/20"
                      >
                        <div className="flex w-full items-center space-x-3">
                          <div className="relative">
                            <UserCircle className="h-5 opacity-75 group-hover:text-primary-500 group-hover:opacity-100" />
                          </div>
                          <div className="grow overflow-hidden">
                            <div className="truncate font-medium leading-snug text-slate-600">
                              {user.shortName}
                            </div>
                            <div className="truncate text-xs text-slate-500">
                              {user.isGuest ? m.app_guest() : m.app_user()}
                            </div>
                          </div>
                          <DotsVertical className="h-4 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </motion.button>
                    }
                  />
                ) : null}
              </AnimatePresence>
            </div>
          </div>
          <div className="min-w-0 grow">
            <div className="max-w-full pt-12 md:w-[1024px] lg:min-h-[calc(100vh-64px)] lg:pt-0">
              {children}
            </div>
            <div className="flex items-center justify-center px-6 pt-3 pb-6 text-slate-400 lg:h-16 lg:px-8 lg:py-0 lg:pb-3">
              <a href="/" className="text-sm text-slate-400 transition-colors hover:text-primary-500 hover:no-underline">
                <Logo className="h-5" />
              </a>
            </div>
          </div>
        </div>
      </DayjsProvider>
    </ModalProvider>
  );
};

export default StandardLayout;
