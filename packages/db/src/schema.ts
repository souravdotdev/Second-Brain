import { boolean, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const itemTypeEnum = pgEnum("item_type", [
  "article",
  "tweet",
  "image",
  "video",
  "pdf",
  "link",
]);

export const itemStatusEnum = pgEnum("item_status", ["processing", "ready", "failed"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: itemTypeEnum("type").notNull(),
  sourceUrl: text("source_url").notNull(),
  status: itemStatusEnum("status").notNull().default("processing"),
  title: text("title"),
  thumbnailUrl: text("thumbnail_url"),
  author: text("author"),
  extractedText: text("extracted_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  triggerAt: timestamp("trigger_at", { withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export const itemsToTags = pgTable(
  "items_to_tags",
  {
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.itemId, table.tagId] })],
);

export const itemsToCollections = pgTable(
  "items_to_collections",
  {
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.itemId, table.collectionId] })],
);

export const usersRelations = relations(users, ({ many }) => ({
  items: many(items),
  collections: many(collections),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  user: one(users, { fields: [items.userId], references: [users.id] }),
  reminders: many(reminders),
  itemsToTags: many(itemsToTags),
  itemsToCollections: many(itemsToCollections),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  itemsToTags: many(itemsToTags),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, { fields: [collections.userId], references: [users.id] }),
  itemsToCollections: many(itemsToCollections),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  item: one(items, { fields: [reminders.itemId], references: [items.id] }),
}));

export const itemsToTagsRelations = relations(itemsToTags, ({ one }) => ({
  item: one(items, { fields: [itemsToTags.itemId], references: [items.id] }),
  tag: one(tags, { fields: [itemsToTags.tagId], references: [tags.id] }),
}));

export const itemsToCollectionsRelations = relations(itemsToCollections, ({ one }) => ({
  item: one(items, { fields: [itemsToCollections.itemId], references: [items.id] }),
  collection: one(collections, {
    fields: [itemsToCollections.collectionId],
    references: [collections.id],
  }),
}));
