CREATE TABLE `artifacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`engagement_id` integer NOT NULL,
	`kind` text NOT NULL,
	`version` integer NOT NULL,
	`content_json` text NOT NULL,
	`model_used` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `engagements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_name` text NOT NULL,
	`industry` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inputs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`engagement_id` integer NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`engagement_id`) REFERENCES `engagements`(`id`) ON UPDATE no action ON DELETE no action
);
