CREATE TABLE `providers` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`encrypted_credentials` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `update_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`watched_record_id` text NOT NULL,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL,
	`old_ip` text,
	`new_ip` text,
	`success` integer NOT NULL,
	`message` text,
	FOREIGN KEY (`watched_record_id`) REFERENCES `watched_records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `watched_records` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`zone_id` text NOT NULL,
	`zone_name` text NOT NULL,
	`record_id` text NOT NULL,
	`record_name` text NOT NULL,
	`schedule` text DEFAULT '*/30 * * * *' NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`last_known_ip` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON UPDATE no action ON DELETE cascade
);
