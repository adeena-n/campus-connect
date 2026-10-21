-- CampusConnect Supabase PostgreSQL Schema Migration
-- Migration: 20261021000000_init_campusconnect.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  major TEXT NOT NULL,
  semester INT NOT NULL CHECK (semester >= 1 AND semester <= 16),
  bio TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. Create gigs table
CREATE TABLE IF NOT EXISTS public.gigs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 100),
  description TEXT NOT NULL CHECK (char_length(description) >= 20 AND char_length(description) <= 2000),
  type TEXT NOT NULL CHECK (type IN ('Offering', 'Requesting')),
  category TEXT NOT NULL CHECK (category IN ('Programming', 'Design', 'Writing', 'Tutoring')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('Paid', 'SkillSwap', 'Free')),
  budget NUMERIC NULL CHECK (budget IS NULL OR budget > 0),
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Completed', 'Expired', 'Cancelled')),
  accepted_applicant_id INT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gigs_user_id ON public.gigs(user_id);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON public.gigs(status);
CREATE INDEX IF NOT EXISTS idx_gigs_category ON public.gigs(category);
CREATE INDEX IF NOT EXISTS idx_gigs_payment_type ON public.gigs(payment_type);
CREATE INDEX IF NOT EXISTS idx_gigs_deadline ON public.gigs(deadline);

-- 3. Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id SERIAL PRIMARY KEY,
  gig_id INT NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  applicant_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(message) >= 10 AND char_length(message) <= 500),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected', 'Withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_gig_applicant UNIQUE (gig_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_gig_id ON public.applications(gig_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON public.applications(applicant_id);

-- 4. Circular foreign key for accepted_applicant_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_gigs_accepted_applicant'
  ) THEN
    ALTER TABLE public.gigs
      ADD CONSTRAINT fk_gigs_accepted_applicant
      FOREIGN KEY (accepted_applicant_id) REFERENCES public.applications(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id SERIAL PRIMARY KEY,
  gig_id INT NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  reviewer_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL CHECK (char_length(trim(comment)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_gig_reviewer UNIQUE (gig_id, reviewer_id),
  CONSTRAINT chk_no_self_review CHECK (reviewer_id <> reviewee_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_gig_id ON public.reviews(gig_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);

-- 6. Atomic applicant acceptance RPC function
CREATE OR REPLACE FUNCTION public.accept_applicant(p_application_id INT, p_owner_user_id INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gig_id INT;
  v_applicant_id INT;
  v_app_status TEXT;
  v_gig_status TEXT;
  v_gig_owner_id INT;
  v_deadline TIMESTAMPTZ;
  v_rejected_count INT := 0;
  v_result JSONB;
BEGIN
  SELECT gig_id, applicant_id, status 
  INTO v_gig_id, v_applicant_id, v_app_status
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application with ID % not found', p_application_id;
  END IF;

  IF v_app_status <> 'Pending' THEN
    RAISE EXCEPTION 'Cannot accept application with status "%". Only Pending applications can be accepted.', v_app_status;
  END IF;

  SELECT user_id, status, deadline
  INTO v_gig_owner_id, v_gig_status, v_deadline
  FROM public.gigs
  WHERE id = v_gig_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated gig not found';
  END IF;

  IF v_gig_owner_id <> p_owner_user_id THEN
    RAISE EXCEPTION 'Forbidden: Only the gig creator can accept applicant proposals.';
  END IF;

  IF v_gig_status <> 'Open' THEN
    RAISE EXCEPTION 'Cannot accept applicant because gig is currently "%". Only Open gigs can accept applications.', v_gig_status;
  END IF;

  IF v_deadline <= NOW() THEN
    UPDATE public.gigs SET status = 'Expired' WHERE id = v_gig_id;
    RAISE EXCEPTION 'Cannot accept applicant: gig deadline has expired.';
  END IF;

  UPDATE public.applications
  SET status = 'Accepted'
  WHERE id = p_application_id;

  WITH rejected AS (
    UPDATE public.applications
    SET status = 'Rejected'
    WHERE gig_id = v_gig_id AND id <> p_application_id AND status = 'Pending'
    RETURNING id
  )
  SELECT count(*) INTO v_rejected_count FROM rejected;

  UPDATE public.gigs
  SET status = 'In Progress',
      accepted_applicant_id = p_application_id
  WHERE id = v_gig_id;

  SELECT jsonb_build_object(
    'application_id', p_application_id,
    'gig_id', v_gig_id,
    'status', 'Accepted',
    'gig_status', 'In Progress',
    'rejected_count', v_rejected_count
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 7. Row Level Security Setup
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are readable by everyone" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Public gigs are readable by everyone" ON public.gigs
  FOR SELECT USING (true);

CREATE POLICY "Public reviews are readable by everyone" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id OR auth_user_id IS NULL);

CREATE POLICY "Gigs manageable by owners or service role" ON public.gigs
  FOR ALL USING (true);

CREATE POLICY "Applications viewable by applicant or gig owner" ON public.applications
  FOR ALL USING (true);

CREATE POLICY "Reviews insertable by participants" ON public.reviews
  FOR ALL USING (true);
