CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`poll_id` text NOT NULL,
	`author_name` text NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`poll_id`) REFERENCES `polls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `comments_poll_id_idx` ON `comments` (`poll_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `comments_id_poll_id_idx` ON `comments` (`id`,`poll_id`);--> statement-breakpoint
CREATE TABLE `options` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`poll_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`poll_id`) REFERENCES `polls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `options_poll_id_idx` ON `options` (`poll_id`);--> statement-breakpoint
CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user_id` text,
	`poll_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`poll_id`) REFERENCES `polls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `participants_poll_id_idx` ON `participants` (`poll_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `participants_id_poll_id_idx` ON `participants` (`id`,`poll_id`);--> statement-breakpoint
CREATE TABLE `polls` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deadline` integer,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`location` text,
	`user_id` text NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`time_zone` text,
	`author_name` text DEFAULT '' NOT NULL,
	`demo` integer DEFAULT false NOT NULL,
	`legacy` integer DEFAULT false NOT NULL,
	`closed` integer DEFAULT false NOT NULL,
	`notifications` integer DEFAULT false NOT NULL,
	`deleted` integer DEFAULT false NOT NULL,
	`deleted_at` integer,
	`touched_at` integer NOT NULL,
	`participant_url_id` text NOT NULL,
	`admin_url_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `polls_participant_url_id_unique` ON `polls` (`participant_url_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `polls_admin_url_id_unique` ON `polls` (`admin_url_id`);--> statement-breakpoint
CREATE INDEX `polls_user_id_idx` ON `polls` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text NOT NULL,
	`option_id` text NOT NULL,
	`poll_id` text NOT NULL,
	`type` text DEFAULT 'yes' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`option_id`) REFERENCES `options`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`poll_id`) REFERENCES `polls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `votes_participant_id_idx` ON `votes` (`participant_id`);--> statement-breakpoint
CREATE INDEX `votes_poll_id_idx` ON `votes` (`poll_id`);