import { boolean, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const tokenEnum = pgEnum("token_type", ["refreshToken", "accessToken", "verificationToken", "passwordResetToken"]);

export const usersTable = pgTable("users", {
  userId: uuid("user_id").primaryKey().defaultRandom(),
  firstName: varchar("first_name" ,{ length: 255 }).notNull(),
  lastName: varchar("last_name" ,{length: 255}).notNull(),
  password: text("password").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date())
});

export const tokensTable = pgTable("tokens", {
  tokenId: uuid("token_id").primaryKey().defaultRandom(),
  
  userId: uuid("user_id").references(() => usersTable.userId, {onDelete: "cascade"}),

  tokenType: tokenEnum("token_type").notNull(),
  token: text("token").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date())
});

export const clientsTable = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: varchar("client_name", {length: 255}).notNull(),
  domain: varchar("domain", {length: 255}).notNull(),
  redirectUrl: varchar("redirect_url", {length: 255}).notNull(),

  clientId: text("client_id").notNull(),
  clientSecret: text("client_secret").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date())
});
