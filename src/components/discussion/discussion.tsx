import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import * as m from "@/paraglide/messages";

const usePlausible = () => (eventName: string, props?: unknown) => {};
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import { formatDistanceToNow } from "date-fns";
import type { Comment } from "@/db/schema";
import { useDayjs } from "../../utils/dayjs";
import { requiredString } from "../../utils/form-validation";
import { api } from "../../utils/api";
import { Button } from "../button";
import CompactButton from "../compact-button";
import Dropdown, { DropdownItem } from "../dropdown";
import DotsHorizontal from "../icons/dots-horizontal.svg?react";
import Trash from "../icons/trash.svg?react";
import NameInput from "../name-input";
import TruncatedLinkify from "../poll/truncated-linkify";
import UserAvatar from "../poll/user-avatar";
import { usePoll } from "../poll-context";
import { isUnclaimed, useSession } from "../session";

interface CommentForm {
  authorName: string;
  content: string;
}

const Discussion: React.VoidFunctionComponent = () => {
  const { locale } = useDayjs();
  const { poll } = usePoll();

  const pollId = poll.id;

  const [comments, setComments] = React.useState<Comment[] | null>(null);

  const fetchComments = React.useCallback(async () => {
    const { data } = await api.api.polls.comments.list.get({
      query: { pollId },
    });
    if (data) {
      setComments(data as Comment[]);
    }
  }, [pollId]);

  React.useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 10000); // refetch every 10 seconds
    return () => clearInterval(interval);
  }, [fetchComments]);

  const plausible = usePlausible();

  const session = useSession();

  const addComment = React.useCallback(
    async (input: { pollId: string; authorName: string; content: string }) => {
      const { data: newComment } = await api.api.polls.comments.add.post(input);
      session.refresh();
      if (newComment) {
        setComments((existing) =>
          existing ? [...existing, newComment as Comment] : [newComment as Comment],
        );
      }
      plausible("Created comment");
      return newComment;
    },
    [session, plausible],
  );

  const deleteComment = React.useCallback(
    async (input: { commentId: string; pollId: string }) => {
      // Optimistic update
      setComments((existing) =>
        existing ? existing.filter(({ id }) => id !== input.commentId) : existing,
      );
      await api.api.polls.comments.delete.post(input);
      plausible("Deleted comment");
    },
    [plausible],
  );

  const { register, reset, control, handleSubmit, formState } =
    useForm<CommentForm>({
      defaultValues: {
        authorName: "",
        content: "",
      },
    });

  if (!comments) {
    return null;
  }

  return (
    <div className="overflow-hidden border-t border-b shadow-sm md:rounded-lg md:border">
      <div className="border-b bg-white px-4 py-2">
        <div className="font-medium">{m.app_comments()}</div>
      </div>
      <div
        className={clsx({
          "space-y-3 border-b bg-slate-50 p-4": comments.length > 0,
        })}
      >
        <AnimatePresence initial={false}>
          {comments.map((comment) => {
            const canDelete =
              poll.admin || session.ownsObject(comment) || isUnclaimed(comment);

            return (
              <motion.div
                layoutId={comment.id}
                transition={{ duration: 0.2 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex"
                key={comment.id}
              >
                <motion.div
                  initial={{ scale: 0.8, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8 }}
                  data-testid="comment"
                  className="w-fit rounded-xl border bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex items-center space-x-2">
                    <UserAvatar
                      name={comment.authorName}
                      showName={true}
                      isYou={session.ownsObject(comment)}
                    />
                    <div className="mb-1">
                      <span className="mr-1 text-slate-400">&bull;</span>
                      <span className="text-sm text-slate-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale })}
                      </span>
                    </div>
                    <Dropdown
                      placement="bottom-start"
                      trigger={<CompactButton icon={DotsHorizontal} />}
                    >
                      <DropdownItem
                        icon={Trash}
                        label={m.app_deleteComment()}
                        disabled={!canDelete}
                        onClick={() => {
                          deleteComment({
                            commentId: comment.id,
                            pollId,
                          });
                        }}
                      />
                    </Dropdown>
                  </div>
                  <div className="w-fit whitespace-pre-wrap">
                    <TruncatedLinkify>{comment.content}</TruncatedLinkify>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <form
        className="bg-white p-4"
        onSubmit={handleSubmit(async ({ authorName, content }) => {
          await addComment({ authorName, content, pollId });
          reset({ authorName, content: "" });
        })}
      >
        <textarea
          id="comment"
          placeholder={m.app_commentPlaceholder()}
          className="input w-full py-2 pl-3 pr-4"
          {...register("content", { validate: requiredString })}
        />
        <div className="mt-1 flex space-x-3">
          <div>
            <Controller
              name="authorName"
              key={session.user?.id}
              control={control}
              rules={{ validate: requiredString }}
              render={({ field }) => (
                <NameInput {...field} className="w-full" />
              )}
            />
          </div>
          <Button htmlType="submit" loading={formState.isSubmitting}>
            {m.app_comment()}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(Discussion);
