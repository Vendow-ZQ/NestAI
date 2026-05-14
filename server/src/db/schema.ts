import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';

/* ─── users ─────────────────────────────────────────── */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  openid: text('openid').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/* ─── spaces ────────────────────────────────────────── */
export const spaces = pgTable('spaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  type: text('type'), // dorm | rental | hdb | owned
  layout: text('layout'),
  images: jsonb('images').$type<Array<{ s3Url: string; uploadedAt: string; position?: string }>>(),
  longTermMemory: text('long_term_memory'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

/* ─── sessions ──────────────────────────────────────── */
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  spaceId: uuid('space_id').references(() => spaces.id),
  shortTermMemory: text('short_term_memory'),
  status: text('status').default('uploaded'), // uploaded | chat_done | intervention_generated | saved_to_next | feedback_submitted | letter_done | abandoned
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

/* ─── chat_responses ────────────────────────────────── */
export const chatResponses = pgTable('chat_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => sessions.id),
  questions: jsonb('questions').$type<Array<{ q: string; options: string[] }>>(),
  answers: jsonb('answers').$type<Array<{ selectedOption: string; freeText?: string }>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/* ─── interventions ─────────────────────────────────── */
export const interventions = pgTable('interventions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => sessions.id),
  tier: text('tier'), // zero_cost | low_cost | advanced
  diagnosis: text('diagnosis'),
  actions: jsonb('actions').$type<Array<{ step: string; estimatedTime: string; cost: string }>>(),
  imagePrompts: jsonb('image_prompts').$type<Record<string, string>>(),
  renderedImages: jsonb('rendered_images').$type<{ axonometric?: string; view1?: string; view2?: string }>(),
  savedToNext: boolean('saved_to_next').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/* ─── next_actions ──────────────────────────────────── */
export const nextActions = pgTable('next_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  interventionId: uuid('intervention_id').references(() => interventions.id),
  status: text('status').default('pending'), // pending | tried | done | abandoned
  beforeImages: jsonb('before_images').$type<string[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

/* ─── feedbacks ─────────────────────────────────────── */
export const feedbacks = pgTable('feedbacks', {
  id: uuid('id').defaultRandom().primaryKey(),
  nextActionId: uuid('next_action_id').references(() => nextActions.id),
  afterImages: jsonb('after_images').$type<string[]>(),
  userNote: text('user_note'),
  missedSteps: jsonb('missed_steps').$type<string[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/* ─── letters ───────────────────────────────────────── */
export const letters = pgTable('letters', {
  id: uuid('id').defaultRandom().primaryKey(),
  feedbackId: uuid('feedback_id').references(() => feedbacks.id),
  content: text('content'),
  signature: text('signature').default('—— Nobi'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
