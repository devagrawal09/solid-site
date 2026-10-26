CREATE TABLE `experiment_events` (
	`experiment` text NOT NULL,
	`visitor` text NOT NULL,
	`event` text NOT NULL,
	`happened_at` integer NOT NULL,
	PRIMARY KEY(`experiment`, `visitor`, `event`)
);
--> statement-breakpoint
CREATE TABLE `experiment_exposures` (
	`experiment` text NOT NULL,
	`visitor` text NOT NULL,
	`variant` text NOT NULL,
	`exposed_at` integer NOT NULL,
	PRIMARY KEY(`experiment`, `visitor`)
);
