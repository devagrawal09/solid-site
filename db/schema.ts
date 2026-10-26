import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const runs = sqliteTable('experiment_runs', {
  experiment: text('experiment').primaryKey(),
  startedAt: integer('started_at').notNull(),
});

export const exposures = sqliteTable(
  'experiment_exposures',
  {
    experiment: text('experiment').notNull(),
    visitor: text('visitor').notNull(),
    variant: text('variant').notNull(),
    exposedAt: integer('exposed_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.experiment, table.visitor] })],
);
export const events = sqliteTable(
  'experiment_events',
  {
    experiment: text('experiment').notNull(),
    visitor: text('visitor').notNull(),
    event: text('event').notNull(),
    happenedAt: integer('happened_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.experiment, table.visitor, table.event] })],
);
