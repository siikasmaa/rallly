import clsx from "clsx";
import * as m from "@/paraglide/messages";
import * as React from "react";
import { createBreakpoint } from "react-use";

import DotsVertical from "@/components/icons/dots-vertical.svg";
import Github from "@/components/icons/github.svg";
import Logo from "~/public/logo.svg";

import Footer from "./page-layout/footer";

const Popover = React.lazy(() => import("./popover"));
export interface PageLayoutProps {
  children?: React.ReactNode;
}

const useBreakpoint = createBreakpoint({ sm: 640, md: 768, lg: 1024 });

const Menu: React.VoidFunctionComponent<{ className: string }> = ({
  className,
}) => {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  return (
    <nav className={className}>
      <a
        href="/"
        className={clsx(
          "text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2",
          {
            "pointer-events-none font-bold text-gray-600":
              pathname === "/home",
          },
        )}
      >
        {m.common_home()}
      </a>
      <a
        href="https://blog.rallly.co"
        className={clsx(
          "text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2",
        )}
      >
        {m.common_blog()}
      </a>
      <a
        href="https://support.rallly.co"
        className="text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2"
      >
        {m.common_support()}
      </a>
      <a
        href="https://github.com/lukevella/rallly"
        className="text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2"
      >
        <Github className="w-6" />
      </a>
    </nav>
  );
};

const PageLayout: React.VoidFunctionComponent<PageLayoutProps> = ({
  children,
}) => {
  const breakpoint = useBreakpoint();
  return (
    <div className="bg-pattern min-h-full overflow-x-hidden">
      <div className="mx-auto flex max-w-7xl items-center py-8 px-8">
        <div className="grow">
          <div className="relative inline-block">
            <a href="/">
                <Logo className="w-40 text-primary-500" alt="Rallly" />
          </a>
            <span className="absolute -bottom-6 right-0 text-sm text-slate-400 transition-colors">
              <span
                dangerouslySetInnerHTML={{
                  __html: m.homepage_3Ls().replace("<e>", "<em>").replace("</e>", "</em>"),
                }}
              />
            </span>
          </div>
        </div>
        <Menu className="hidden items-center space-x-8 md:flex" />
        {breakpoint === "sm" ? (
          <Popover
            placement="left-start"
            trigger={
              <button className="text-gray-400 transition-colors hover:text-primary-500 hover:no-underline hover:underline-offset-2">
                <DotsVertical className="w-5" />
              </button>
            }
          >
            <Menu className="flex flex-col space-y-2" />
          </Popover>
        ) : null}
      </div>
      <div className="md:min-h-[calc(100vh-460px)]">{children}</div>
      <Footer />
    </div>
  );
};

export default PageLayout;
