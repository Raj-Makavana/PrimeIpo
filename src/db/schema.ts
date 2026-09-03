import { pgTable, text, integer, timestamp, numeric, jsonb, boolean, uuid } from 'drizzle-orm/pg-core';

export const ipos = pgTable('ipos', {
  id: text('id').primaryKey(),
  symbol: text('symbol').notNull(),
  companyName: text('company_name').notNull(),
  sector: text('sector').default('General'),
  type: text('type').notNull(), // 'mainboard' | 'sme'
  openDate: text('open_date'),
  closeDate: text('close_date'),
  allotmentDate: text('allotment_date'),
  listingDate: text('listing_date'),
  priceBandLow: integer('price_band_low').default(0),
  priceBandHigh: integer('price_band_high').default(0),
  lotSize: integer('lot_size').default(1),
  issueSize: numeric('issue_size').default('0'), // in Crores
  faceValue: integer('face_value').default(10),
  registrar: text('registrar').default('Bigshare Services'), // KFintech, Link Intime / MUFG Intime, Bigshare, Cameo, Skyline
  status: text('status').notNull(), // 'open' | 'upcoming' | 'closed' | 'listed'
  gmpCurrent: integer('gmp_current').default(0),
  gmpPct: numeric('gmp_pct').default('0'),
  gmpHistory: jsonb('gmp_history').default([]), // array of { date, gmp }
  subscriptionQib: numeric('subscription_qib').default('0'),
  subscriptionNii: numeric('subscription_nii').default('0'),
  subscriptionRetail: numeric('subscription_retail').default('0'),
  subscriptionEmployee: numeric('subscription_employee').default('0'),
  subscriptionTotal: numeric('subscription_total').default('0'),
  logoUrl: text('logo_url'),
  description: text('description'),
  listingGainPct: numeric('listing_gain_pct'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userPans = pgTable('user_pans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  panEncrypted: text('pan_encrypted').notNull(),
  panHash: text('pan_hash').notNull(),
  label: text('label').default('Self'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const allotmentResults = pgTable('allotment_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  ipoId: text('ipo_id').notNull(),
  panHash: text('pan_hash').notNull(),
  status: text('status').notNull(), // 'allotted' | 'not_allotted' | 'pending'
  shares: integer('shares').default(0),
  category: text('category').default('Retail'),
  checkedAt: timestamp('checked_at').defaultNow(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email'),
  name: text('name'),
  phone: text('phone'),
  phoneVerified: boolean('phone_verified').default(false),
  passwordHash: text('password_hash'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userAlerts = pgTable('user_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  email: text('email'),
  emailAlerts: boolean('email_alerts').default(true),
  pushAlerts: boolean('push_alerts').default(true),
  gmpSurgeAlerts: boolean('gmp_surge_alerts').default(true),
  allotmentAlerts: boolean('allotment_alerts').default(true),
  newIpoAlerts: boolean('new_ipo_alerts').default(true),
  updatedAt: timestamp('updated_at').defaultNow(),
});

