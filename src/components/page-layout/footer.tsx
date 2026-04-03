import * as m from "@/paraglide/messages";
import * as React from "react";

import Discord from "@/components/icons/discord.svg?react";
import Star from "@/components/icons/star.svg?react";
import Translate from "@/components/icons/translate.svg?react";
import Twitter from "@/components/icons/twitter.svg?react";
import DigitalOcean from "~/public/digitalocean.svg?react";
import Logo from "~/public/logo.svg?react";
import Sentry from "~/public/sentry.svg?react";
import Vercel from "~/public/vercel-logotype-dark.svg?react";

import { LanguageSelect } from "../poll/language-selector";

const Footer: React.VoidFunctionComponent = () => {
  return (
    <div className="mt-16 bg-gradient-to-b from-gray-50/0 via-gray-50 to-gray-50 ">
      <div className="mx-auto max-w-7xl space-y-8 p-8 lg:flex lg:space-x-16 lg:space-y-0">
        <div className=" lg:w-2/6">
          <Logo className="w-32 text-slate-400" />
          <div className="mb-8 mt-4 text-slate-400">
            <p>
              <span
                dangerouslySetInnerHTML={{
                  __html: m.common_footerSponsor().replace(
                    "<a>",
                    '<a class="font-normal leading-loose text-slate-400 underline hover:text-slate-800 hover:underline" href="https://www.paypal.com/donate/?hosted_button_id=7QXP2CUBLY88E">',
                  ).replace("</a>", "</a>"),
                }}
              />
            </p>
            <div>
              <span
                dangerouslySetInnerHTML={{
                  __html: m.common_footerCredit().replace(
                    "<a>",
                    '<a class="font-normal leading-loose text-slate-400 underline hover:text-slate-800 hover:underline" href="https://twitter.com/imlukevella">',
                  ).replace("</a>", "</a>"),
                }}
              />
            </div>
          </div>
          <div className="mb-8 flex items-center space-x-6">
            <a
              href="https://twitter.com/ralllyco"
              className="text-sm text-slate-400 transition-colors hover:text-primary-500 hover:no-underline"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://discord.gg/uzg4ZcHbuM"
              className="text-sm text-slate-400 transition-colors hover:text-primary-500 hover:no-underline"
            >
              <Discord className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/lukevella/rallly"
              className="inline-flex h-8 items-center rounded-full bg-slate-100 pl-2 pr-3 text-sm text-slate-400 transition-colors hover:bg-primary-500 hover:text-white hover:no-underline focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 active:bg-primary-600"
            >
              <Star className="mr-2 inline-block w-5" />
              <span>{m.common_starOnGithub()}</span>
            </a>
          </div>
        </div>
        <div className="lg:w-1/6">
          <div className="mb-4 font-medium">{m.common_links()}</div>
          <ul className="space-y-2">
            <li>
              <a
                className="inline-block font-normal text-slate-400 hover:text-slate-800 hover:no-underline"
                href="https://github.com/lukevella/rallly/discussions"
              >
                {m.common_discussions()}
              </a>
            </li>
            <li>
              <a href="https://blog.rallly.co" className="inline-block font-normal text-slate-400 hover:text-slate-800 hover:no-underline">
                  {m.common_blog()}
              </a>
            </li>
            <li>
              <a
                href="https://support.rallly.co"
                className="inline-block font-normal text-slate-400 hover:text-slate-800 hover:no-underline"
              >
                {m.common_support()}
              </a>
            </li>
            <li>
              <a href="/privacy-policy" className="inline-block font-normal text-slate-400 hover:text-slate-800 hover:no-underline">
                  {m.common_privacyPolicy()}
              </a>
            </li>
          </ul>
        </div>
        <div className="lg:w-1/6">
          <div className="mb-4 font-medium">{m.common_poweredBy()}</div>
          <div className="block space-y-4">
            <div>
              <a
                href="https://vercel.com?utm_source=rallly&utm_campaign=oss"
                className="inline-block text-white"
              >
                <Vercel className="h-5" />
              </a>
            </div>
            <div>
              <a className="inline-block" href="https://m.do.co/c/f91efc9c9e50">
                <DigitalOcean className="h-7" />
              </a>
            </div>
            <div>
              <a className="inline-block" href="https://sentry.io">
                <Sentry className="h-6" />
              </a>
            </div>
          </div>
        </div>
        <div className="lg:w-2/6">
          <div className="mb-4 font-medium">{m.common_language()}</div>
          <LanguageSelect
            className="mb-4 w-full"
            onChange={(locale) => {
              const currentPath = window.location.pathname + window.location.search;
              window.location.href = `/${locale}${currentPath}`;
            }}
          />
          <a
            href="https://github.com/lukevella/rallly/wiki/Guide-for-translators"
            className="inline-flex items-center rounded-md border px-3 py-2 text-xs text-slate-500"
          >
            <Translate className="mr-2 h-5 w-5" />
            {m.common_volunteerTranslator()} &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
