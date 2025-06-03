-- Rename tables
ALTER TABLE "Account" RENAME TO account;
ALTER TABLE "Session" RENAME TO session;
ALTER TABLE "User" RENAME TO "user";
ALTER TABLE "VerificationToken" RENAME TO verification_token;
ALTER TABLE "Project" RENAME TO project;

-- Rename columns for account
ALTER TABLE account RENAME COLUMN "userId" TO user_id;
ALTER TABLE account RENAME COLUMN "providerAccountId" TO provider_account_id;
ALTER TABLE account RENAME COLUMN "refresh_token" TO refresh_token;
ALTER TABLE account RENAME COLUMN "access_token" TO access_token;
ALTER TABLE account RENAME COLUMN "expires_at" TO expires_at;
ALTER TABLE account RENAME COLUMN "token_type" TO token_type;
ALTER TABLE account RENAME COLUMN "id_token" TO id_token;
ALTER TABLE account RENAME COLUMN "session_state" TO session_state;

-- Rename columns for session
ALTER TABLE session RENAME COLUMN "sessionToken" TO session_token;
ALTER TABLE session RENAME COLUMN "userId" TO user_id;

-- Rename columns for user
ALTER TABLE "user" RENAME COLUMN "emailVerified" TO email_verified;

-- Rename columns for verification_token
-- (no columns to rename, all are already snake_case)

-- Rename columns for project
ALTER TABLE project RENAME COLUMN "externalId" TO external_id;
ALTER TABLE project RENAME COLUMN "short_summary" TO short_summary;
ALTER TABLE project RENAME COLUMN "long_summary" TO long_summary;
ALTER TABLE project RENAME COLUMN "ai_address" TO ai_address;
ALTER TABLE project RENAME COLUMN "ai_city" TO ai_city;
ALTER TABLE project RENAME COLUMN "ai_zip_code" TO ai_zip_code;
ALTER TABLE project RENAME COLUMN "ai_country" TO ai_country;
ALTER TABLE project RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE project RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE project RENAME COLUMN "userId" TO user_id;

-- Rename enums
ALTER TYPE "ProjectStatus" RENAME TO project_status;
ALTER TYPE "ProjectVisibility" RENAME TO project_visibility;

-- Update columns to use the renamed enums
ALTER TABLE project
  ALTER COLUMN status TYPE project_status USING status::text::project_status,
  ALTER COLUMN visibility TYPE project_visibility USING visibility::text::project_visibility;