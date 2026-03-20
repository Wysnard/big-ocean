-- Story 30-2: Change all user-referencing FKs to onDelete CASCADE
-- Enables single-row user deletion with automatic cascade cleanup.
-- Anonymous-user-first is no longer supported, so "set null" behavior
-- is replaced with "cascade" (delete the child row).

-- 1. assessment_session.user_id: set null → cascade
ALTER TABLE "assessment_session"
  DROP CONSTRAINT "assessment_session_user_id_user_id_fk",
  ADD CONSTRAINT "assessment_session_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- 2. public_profile.user_id: set null → cascade
ALTER TABLE "public_profile"
  DROP CONSTRAINT "public_profile_user_id_user_id_fk",
  ADD CONSTRAINT "public_profile_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- 3. purchase_events.user_id: restrict → cascade
ALTER TABLE "purchase_events"
  DROP CONSTRAINT "purchase_events_user_id_user_id_fk",
  ADD CONSTRAINT "purchase_events_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- 4. relationship_invitations.inviter_user_id: no action → cascade
ALTER TABLE "relationship_invitations"
  DROP CONSTRAINT "relationship_invitations_inviter_user_id_user_id_fk",
  ADD CONSTRAINT "relationship_invitations_inviter_user_id_user_id_fk"
    FOREIGN KEY ("inviter_user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- 5. relationship_invitations.invitee_user_id: no action → cascade
ALTER TABLE "relationship_invitations"
  DROP CONSTRAINT "relationship_invitations_invitee_user_id_user_id_fk",
  ADD CONSTRAINT "relationship_invitations_invitee_user_id_user_id_fk"
    FOREIGN KEY ("invitee_user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- 6. relationship_analyses.user_a_id: no action → cascade
ALTER TABLE "relationship_analyses"
  DROP CONSTRAINT "relationship_analyses_user_a_id_user_id_fk",
  ADD CONSTRAINT "relationship_analyses_user_a_id_user_id_fk"
    FOREIGN KEY ("user_a_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- 7. relationship_analyses.user_b_id: no action → cascade
ALTER TABLE "relationship_analyses"
  DROP CONSTRAINT "relationship_analyses_user_b_id_user_id_fk",
  ADD CONSTRAINT "relationship_analyses_user_b_id_user_id_fk"
    FOREIGN KEY ("user_b_id") REFERENCES "user"("id") ON DELETE CASCADE;
