SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "public";

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

CREATE SCHEMA IF NOT EXISTS "supabase_migrations";

ALTER SCHEMA "supabase_migrations" OWNER TO "postgres";

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE OR REPLACE FUNCTION "public"."clean_up_old_games"() RETURNS void
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    game_record games%ROWTYPE;
BEGIN
    FOR game_record IN SELECT * FROM games
    LOOP
        IF EXTRACT(EPOCH FROM NOW() - (game_record.created_at)) > 300 THEN
            DELETE FROM games WHERE id = game_record.id;
        ELSE
            -- Extract the timestamps from the heartbeat column and find the latest one
            PERFORM id FROM jsonb_array_elements(game_record.heartbeat) AS heartbeat
            WHERE EXTRACT(EPOCH FROM NOW() - (heartbeat->>'timestamp')::timestamp) > 300
            LIMIT 1;
            IF FOUND THEN
                DELETE FROM games WHERE id = game_record.id;
            END IF;
        END IF;
    END LOOP;
END;
$$;

ALTER FUNCTION "public"."clean_up_old_games"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS trigger
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."increment_total_games"() RETURNS void
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- This updates the first row's total_count in total_games table.
    -- Adjust the WHERE clause as needed for your specific use case.
    UPDATE public.total_games
    SET total_count = total_count + 1
    WHERE id = 1; -- Adjust this to target the correct row
END;
$$;

ALTER FUNCTION "public"."increment_total_games"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_heartbeat"(game_id text, user_id text) RETURNS void
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE games
    SET heartbeat = COALESCE(heartbeat, '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
            'user_id', user_id, 
            'message', 'pong', 
            'timestamp', NOW()
        )
    )
    WHERE id = game_id::uuid;
END;
$$;

ALTER FUNCTION "public"."update_heartbeat"(game_id text, user_id text) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "start_time" timestamp with time zone,
    "status" text NOT NULL,
    "text_id" bigint,
    "finishing_times" jsonb,
    "players" uuid[] NOT NULL,
    "player_active" jsonb NOT NULL,
    "heartbeat" jsonb
);

ALTER TABLE "public"."games" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" uuid NOT NULL,
    "updated_at" timestamp with time zone,
    "username" text,
    "full_name" text,
    "website" text,
    "coins" bigint DEFAULT 0,
    "last_unlocked_level" bigint,
    "last_round_wpm" jsonb,
    "last_round_gross_wpm" jsonb,
    "100_slow_words" jsonb,
    "last_slow_words" jsonb,
    "time_played" bigint,
    "games_played" bigint,
    "created_at" timestamp with time zone,
    "training_plan" jsonb,
    "avatar_id" integer DEFAULT 15,
    "flag_id" integer DEFAULT 1,
    "avatar_url" text,
    "wpm_buckets" integer[] DEFAULT ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "accuracy_buckets" integer[] DEFAULT ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    CONSTRAINT "username_length" CHECK ((char_length(username) >= 3))
);

ALTER TABLE "public"."profiles" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."texts" (
    "id" bigint NOT NULL,
    "text" text
);

ALTER TABLE "public"."texts" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."total_games" (
    "id" integer NOT NULL,
    "total_count" integer DEFAULT 0,
    "total_time" bigint,
    "wpmbuckets" integer[] DEFAULT ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "accuracybuckets" integer[] DEFAULT ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "grosswpmbuckets" integer[] DEFAULT ARRAY[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
);

ALTER TABLE "public"."total_games" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."total_games_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."total_games_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."total_games_id_seq" OWNED BY "public"."total_games"."id";

CREATE TABLE IF NOT EXISTS "public"."user_stats" (
    "id" bigint NOT NULL,
    "user_id" uuid,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "wpm" bigint,
    "accuracy" bigint,
    "errors" jsonb,
    "totalOccurrences" jsonb,
    "mistakesMade" jsonb,
    "consistency" double precision,
    "grossWPM" bigint
);

ALTER TABLE "public"."user_stats" OWNER TO "postgres";

ALTER TABLE "public"."user_stats" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."userStats_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."words" (
    "id" bigint,
    "3_letters" text
);

ALTER TABLE "public"."words" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "supabase_migrations"."schema_migrations" (
    "version" text NOT NULL,
    "statements" text[],
    "name" text
);

ALTER TABLE "supabase_migrations"."schema_migrations" OWNER TO "postgres";

ALTER TABLE ONLY "public"."total_games" ALTER COLUMN "id" SET DEFAULT nextval('public.total_games_id_seq'::regclass);

ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");

ALTER TABLE ONLY "public"."texts"
    ADD CONSTRAINT "texts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."total_games"
    ADD CONSTRAINT "total_games_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_stats"
    ADD CONSTRAINT "userStats_pkey" PRIMARY KEY ("id");

--ALTER TABLE ONLY "supabase_migrations"."schema_migrations"
    --ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");

-- Drop the existing primary key constraint
ALTER TABLE supabase_migrations.schema_migrations DROP CONSTRAINT schema_migrations_pkey;

-- Add a new primary key constraint
ALTER TABLE supabase_migrations.schema_migrations ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version, name);

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_stats"
    ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

CREATE POLICY "Delete (authenticated)" ON "public"."user_stats" FOR DELETE TO authenticated USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."texts" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."words" FOR SELECT USING (true);

CREATE POLICY "Insert (Authenticated)" ON "public"."user_stats" FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Insert (authenticated)" ON "public"."profiles" FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Insert for all users" ON "public"."games" FOR INSERT WITH CHECK (true);

CREATE POLICY "Public (Update)" ON "public"."total_games" FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public (select)" ON "public"."total_games" FOR SELECT USING (true);

CREATE POLICY "Select (Authenticated)" ON "public"."user_stats" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Select (authenticated)" ON "public"."profiles" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Select for all users" ON "public"."games" FOR SELECT USING (true);

CREATE POLICY "Update (Authenticated)" ON "public"."user_stats" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Update (authenticated)" ON "public"."profiles" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."texts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."total_games" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_stats" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."words" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."clean_up_old_games"() TO "anon";
GRANT ALL ON FUNCTION "public"."clean_up_old_games"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_up_old_games"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT ALL ON FUNCTION "public"."increment_total_games"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_total_games"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_total_games"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_heartbeat"(game_id text, user_id text) TO "anon";
GRANT ALL ON FUNCTION "public"."update_heartbeat"(game_id text, user_id text) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_heartbeat"(game_id text, user_id text) TO "service_role";

GRANT ALL ON TABLE "public"."games" TO "anon";
GRANT ALL ON TABLE "public"."games" TO "authenticated";
GRANT ALL ON TABLE "public"."games" TO "service_role";

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

GRANT ALL ON TABLE "public"."texts" TO "anon";
GRANT ALL ON TABLE "public"."texts" TO "authenticated";
GRANT ALL ON TABLE "public"."texts" TO "service_role";

GRANT ALL ON TABLE "public"."total_games" TO "anon";
GRANT ALL ON TABLE "public"."total_games" TO "authenticated";
GRANT ALL ON TABLE "public"."total_games" TO "service_role";

GRANT ALL ON SEQUENCE "public"."total_games_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."total_games_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."total_games_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."user_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_stats" TO "service_role";

GRANT ALL ON SEQUENCE "public"."userStats_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."userStats_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."userStats_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."words" TO "anon";
GRANT ALL ON TABLE "public"."words" TO "authenticated";
GRANT ALL ON TABLE "public"."words" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
