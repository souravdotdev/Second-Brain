import { relations } from "drizzle-orm";
import { accounts, sessions, users } from "./auth";
import { collections, items, itemsToCollections, itemsToTags, reminders, tags } from "./items";

export const usersRelations = relations(users, ({ many }) => ({
  items: many(items),
  collections: many(collections),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
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
