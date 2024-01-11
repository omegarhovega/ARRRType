revoke delete on table "public"."test" from "anon";

revoke insert on table "public"."test" from "anon";

revoke references on table "public"."test" from "anon";

revoke select on table "public"."test" from "anon";

revoke trigger on table "public"."test" from "anon";

revoke truncate on table "public"."test" from "anon";

revoke update on table "public"."test" from "anon";

revoke delete on table "public"."test" from "authenticated";

revoke insert on table "public"."test" from "authenticated";

revoke references on table "public"."test" from "authenticated";

revoke select on table "public"."test" from "authenticated";

revoke trigger on table "public"."test" from "authenticated";

revoke truncate on table "public"."test" from "authenticated";

revoke update on table "public"."test" from "authenticated";

revoke delete on table "public"."test" from "service_role";

revoke insert on table "public"."test" from "service_role";

revoke references on table "public"."test" from "service_role";

revoke select on table "public"."test" from "service_role";

revoke trigger on table "public"."test" from "service_role";

revoke truncate on table "public"."test" from "service_role";

revoke update on table "public"."test" from "service_role";

alter table "public"."test" drop constraint "test_pkey";

drop index if exists "public"."test_pkey";

drop table "public"."test";


