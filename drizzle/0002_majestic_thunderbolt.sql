ALTER TABLE `designs` ADD `shape` text DEFAULT 'oval' NOT NULL;--> statement-breakpoint
ALTER TABLE `designs` ADD `is_popular` integer DEFAULT false NOT NULL;