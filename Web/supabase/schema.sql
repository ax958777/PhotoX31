-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.generated_images (
  prompt text NOT NULL,
  image_url text NOT NULL,
  image_type character varying NOT NULL CHECK (image_type::text = ANY (ARRAY['generated'::character varying, 'edited'::character varying]::text[])),
  original_filename text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id text NOT NULL DEFAULT (auth.jwt() ->> 'sub'::text),
  CONSTRAINT generated_images_pkey PRIMARY KEY (id)
);

CREATE TABLE public.migrations (
  timestamp bigint NOT NULL,
  name character varying NOT NULL,
  id integer NOT NULL DEFAULT nextval('migrations_id_seq'::regclass),
  CONSTRAINT migrations_pkey PRIMARY KEY (id)
);

CREATE TABLE public.project (
    id character varying NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    createdAt timestamp
    with
        time zone NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp
    with
        time zone NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        icon json,
        CONSTRAINT project_pkey PRIMARY KEY (id)
);

CREATE TABLE public.subscribers (
    clerk_user_id text,
    user_id uuid,
    email text NOT NULL UNIQUE,
    stripe_customer_id text,
    subscription_tier text,
    subscription_end timestamp
    with
        time zone,
        id uuid NOT NULL DEFAULT gen_random_uuid (),
        subscribed boolean NOT NULL DEFAULT false,
        updated_at timestamp
    with
        time zone NOT NULL DEFAULT now(),
        created_at timestamp
    with
        time zone NOT NULL DEFAULT now(),
        CONSTRAINT subscribers_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user (
  email character varying UNIQUE,
  firstName character varying,
  lastName character varying,
  password character varying,
  personalizationAnswers json,
  id uuid NOT NULL DEFAULT uuid_in((OVERLAY(OVERLAY(md5((((random())::text || ':'::text) || (clock_timestamp())::text)) PLACING '4'::text FROM 13) PLACING to_hex((floor(((random() * (((11 - 8) + 1))::double precision) + (8)::double precision)))::integer) FROM 17))::cstring),
  settings json,
  disabled boolean NOT NULL DEFAULT false,
  mfaSecret text,
  mfaRecoveryCodes text,
  mfaEnabled boolean NOT NULL DEFAULT false,
  createdAt timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  role text NOT NULL,
  CONSTRAINT user_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user_api_keys (
    id character varying NOT NULL,
    userId uuid NOT NULL,
    label character varying NOT NULL,
    apiKey character varying NOT NULL,
    createdAt timestamp
    with
        time zone NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt timestamp
    with
        time zone NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        scopes json,
        CONSTRAINT user_api_keys_pkey PRIMARY KEY (id),
        CONSTRAINT FK_e131705cbbc8fb589889b02d457 FOREIGN KEY (userId) REFERENCES public.user (id)
);

CREATE TABLE public.user_profiles (
    clerk_user_id text NOT NULL UNIQUE,
    email text,
    first_name text,
    last_name text,
    username text,
    avatar_url text,
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    created_at timestamp
    with
        time zone NOT NULL DEFAULT now(),
        updated_at timestamp
    with
        time zone NOT NULL DEFAULT now(),
        CONSTRAINT user_profiles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user_subscription (
  clerk_user_id text,
  subscription_tier text NOT NULL,
  stripe_subscription_id text,
  subscription_end timestamp with time zone,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subscription_status text NOT NULL DEFAULT 'active'::text,
  monthly_limit integer NOT NULL DEFAULT 5,
  current_usage integer NOT NULL DEFAULT 0,
  subscription_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id text,
  email text UNIQUE,
  CONSTRAINT user_subscription_pkey PRIMARY KEY (id)
);