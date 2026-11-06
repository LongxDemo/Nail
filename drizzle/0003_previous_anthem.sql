PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_try_on_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`design_id` text NOT NULL,
	`shape` text NOT NULL,
	`length` text NOT NULL,
	`hand_photo_url` text NOT NULL,
	`result_image_url` text,
	`status` text NOT NULL,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`design_id`) REFERENCES `designs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_try_on_sessions`("id", "customer_id", "design_id", "shape", "length", "hand_photo_url", "result_image_url", "status", "error_message", "created_at") SELECT "id", "customer_id", "design_id", "shape", "length", "hand_photo_url", "result_image_url", "status", "error_message", "created_at" FROM `try_on_sessions`;--> statement-breakpoint
DROP TABLE `try_on_sessions`;--> statement-breakpoint
ALTER TABLE `__new_try_on_sessions` RENAME TO `try_on_sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `try_on_sessions_design_idx` ON `try_on_sessions` (`design_id`);