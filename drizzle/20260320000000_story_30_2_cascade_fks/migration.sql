-- Story 30-2: Change all user-referencing FKs to onDelete CASCADE
-- Enables single-row user deletion with automatic cascade cleanup.
-- Anonymous-user-first is no longer supported, so "set null" behavior
-- is replaced with "cascade" (delete the child row).
--
-- Uses dynamic constraint lookup because the clean-slate migration (Story 9.1)
-- recreated tables with inline FK syntax, producing PostgreSQL auto-generated
-- constraint names that differ from the named constraints in the initial schema.

DO $$
DECLARE
  v_constraint_name text;
BEGIN
  -- 1. assessment_session.user_id: set null → cascade
  SELECT conname INTO v_constraint_name
    FROM pg_constraint
    WHERE conrelid = 'assessment_session'::regclass
      AND contype = 'f'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'assessment_session'::regclass AND attname = 'user_id')];

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "assessment_session" DROP CONSTRAINT %I', v_constraint_name);
  END IF;

  ALTER TABLE "assessment_session"
    ADD CONSTRAINT "assessment_session_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

  -- 2. public_profile.user_id: set null → cascade
  SELECT conname INTO v_constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public_profile'::regclass
      AND contype = 'f'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public_profile'::regclass AND attname = 'user_id')];

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "public_profile" DROP CONSTRAINT %I', v_constraint_name);
  END IF;

  ALTER TABLE "public_profile"
    ADD CONSTRAINT "public_profile_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

  -- 3. purchase_events.user_id: restrict → cascade
  SELECT conname INTO v_constraint_name
    FROM pg_constraint
    WHERE conrelid = 'purchase_events'::regclass
      AND contype = 'f'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'purchase_events'::regclass AND attname = 'user_id')];

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "purchase_events" DROP CONSTRAINT %I', v_constraint_name);
  END IF;

  ALTER TABLE "purchase_events"
    ADD CONSTRAINT "purchase_events_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

  -- 4. relationship_invitations.inviter_user_id: no action → cascade
  SELECT conname INTO v_constraint_name
    FROM pg_constraint
    WHERE conrelid = 'relationship_invitations'::regclass
      AND contype = 'f'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'relationship_invitations'::regclass AND attname = 'inviter_user_id')];

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "relationship_invitations" DROP CONSTRAINT %I', v_constraint_name);
  END IF;

  ALTER TABLE "relationship_invitations"
    ADD CONSTRAINT "relationship_invitations_inviter_user_id_user_id_fk"
    FOREIGN KEY ("inviter_user_id") REFERENCES "user"("id") ON DELETE CASCADE;

  -- 5. relationship_invitations.invitee_user_id: no action → cascade
  SELECT conname INTO v_constraint_name
    FROM pg_constraint
    WHERE conrelid = 'relationship_invitations'::regclass
      AND contype = 'f'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'relationship_invitations'::regclass AND attname = 'invitee_user_id')];

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "relationship_invitations" DROP CONSTRAINT %I', v_constraint_name);
  END IF;

  ALTER TABLE "relationship_invitations"
    ADD CONSTRAINT "relationship_invitations_invitee_user_id_user_id_fk"
    FOREIGN KEY ("invitee_user_id") REFERENCES "user"("id") ON DELETE CASCADE;

  -- 6. relationship_analyses.user_a_id: no action → cascade
  SELECT conname INTO v_constraint_name
    FROM pg_constraint
    WHERE conrelid = 'relationship_analyses'::regclass
      AND contype = 'f'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'relationship_analyses'::regclass AND attname = 'user_a_id')];

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "relationship_analyses" DROP CONSTRAINT %I', v_constraint_name);
  END IF;

  ALTER TABLE "relationship_analyses"
    ADD CONSTRAINT "relationship_analyses_user_a_id_user_id_fk"
    FOREIGN KEY ("user_a_id") REFERENCES "user"("id") ON DELETE CASCADE;

  -- 7. relationship_analyses.user_b_id: no action → cascade
  SELECT conname INTO v_constraint_name
    FROM pg_constraint
    WHERE conrelid = 'relationship_analyses'::regclass
      AND contype = 'f'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'relationship_analyses'::regclass AND attname = 'user_b_id')];

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "relationship_analyses" DROP CONSTRAINT %I', v_constraint_name);
  END IF;

  ALTER TABLE "relationship_analyses"
    ADD CONSTRAINT "relationship_analyses_user_b_id_user_id_fk"
    FOREIGN KEY ("user_b_id") REFERENCES "user"("id") ON DELETE CASCADE;
END $$;
