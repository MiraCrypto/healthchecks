CREATE TABLE `checks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`tags` text,
	`interval_seconds` integer NOT NULL,
	`grace_seconds` integer NOT NULL,
	`status` text DEFAULT 'NEW' NOT NULL,
	`last_ping` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pings` (
	`id` text PRIMARY KEY NOT NULL,
	`check_id` text NOT NULL,
	`remote_ip` text,
	`user_agent` text,
	`scheme` text,
	`method` text,
	`payload` blob,
	`mime_type` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`check_id`) REFERENCES `checks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`display_name` text,
	`description` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);