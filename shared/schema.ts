import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export User types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Quiz Creator Schema
export const creators = pgTable("creators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
});

export const insertCreatorSchema = createInsertSchema(creators).pick({
  name: true,
  username: true,
  userId: true,
});

// Quiz Taker Schema
export const takers = pgTable("takers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: varchar("user_id").references(() => users.id),
});

export const insertTakerSchema = createInsertSchema(takers).pick({
  name: true,
  userId: true,
});

// Question Types
export const QuestionTypeEnum = z.enum(["mcq", "tf", "essay"]);
export type QuestionType = z.infer<typeof QuestionTypeEnum>;

// Question Schema (used within tests as a JSON field)
export const QuestionSchema = z.object({
  id: z.string(),
  type: QuestionTypeEnum,
  text: z.string(),
  points: z.number().min(1),
  // For MCQ
  choices: z.array(z.string()).optional(),
  correctChoice: z.number().optional(),
  // For True/False
  correctAnswer: z.boolean().optional(),
  // For Essay
  modelAnswers: z.array(z.string()).optional(),
});

export type Question = z.infer<typeof QuestionSchema>;

// Test Schema
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  questions: jsonb("questions").notNull().$type<Question[]>(),
  shareCode: text("share_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestSchema = createInsertSchema(tests).pick({
  creatorId: true,
  title: true,
  description: true,
  duration: true,
  questions: true,
  shareCode: true,
});

// Answer Schema (used within submissions as a JSON field)
export const AnswerSchema = z.object({
  questionId: z.string(),
  // Different answer types based on question type
  choiceIndex: z.number().optional(),
  booleanAnswer: z.boolean().optional(),
  essayAnswer: z.string().optional(),
  isCorrect: z.boolean().optional(),
  points: z.number().optional(),
  reviewRequested: z.boolean().optional(),
  reviewComment: z.string().optional(),
  reviewed: z.boolean().optional(),
});

export type Answer = z.infer<typeof AnswerSchema>;

// Submission Schema
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  takerId: integer("taker_id").notNull(),
  answers: jsonb("answers").notNull().$type<Answer[]>(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  score: integer("score").notNull(),
  totalPoints: integer("total_points").notNull(),
  hasReviewRequest: boolean("has_review_request").default(false),
});

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  testId: true,
  takerId: true,
  answers: true,
  startTime: true,
  endTime: true,
  score: true,
  totalPoints: true,
  hasReviewRequest: true,
});

// Review Request Schema
export const reviewRequests = pgTable("review_requests", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").notNull(),
  questionId: text("question_id").notNull(),
  requestMessage: text("request_message"),
  status: text("status").notNull(), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewRequestSchema = createInsertSchema(reviewRequests).pick({
  submissionId: true,
  questionId: true,
  requestMessage: true,
  status: true,
});

// Type exports
export type Creator = typeof creators.$inferSelect;
export type InsertCreator = z.infer<typeof insertCreatorSchema>;

export type Taker = typeof takers.$inferSelect;
export type InsertTaker = z.infer<typeof insertTakerSchema>;

export type Test = typeof tests.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;

export type ReviewRequest = typeof reviewRequests.$inferSelect;
export type InsertReviewRequest = z.infer<typeof insertReviewRequestSchema>;
