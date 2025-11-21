--
-- PostgreSQL database dump
--

\restrict aNvdu1lEuQruOQEoBbvTLslwdLH0hGHUjAfGSYIw5ridPlpgKse9sdN5sGprNea

-- Dumped from database version 18.1 (Postgres.app)
-- Dumped by pg_dump version 18.1 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clientes; Type: TABLE; Schema: public; Owner: vpablo
--

CREATE TABLE public.clientes (
    id_cliente integer NOT NULL,
    nombre_empresa character varying(255) NOT NULL,
    contacto_nombre character varying(255),
    contacto_email character varying(255),
    telefono character varying(50),
    direccion_texto text,
    latitud numeric(9,6) NOT NULL,
    longitud numeric(9,6) NOT NULL
);


ALTER TABLE public.clientes OWNER TO vpablo;

--
-- Name: clientes_id_cliente_seq; Type: SEQUENCE; Schema: public; Owner: vpablo
--

CREATE SEQUENCE public.clientes_id_cliente_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_id_cliente_seq OWNER TO vpablo;

--
-- Name: clientes_id_cliente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vpablo
--

ALTER SEQUENCE public.clientes_id_cliente_seq OWNED BY public.clientes.id_cliente;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: vpablo
--

CREATE TABLE public.roles (
    id_rol integer NOT NULL,
    nombre_rol character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO vpablo;

--
-- Name: roles_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: vpablo
--

CREATE SEQUENCE public.roles_id_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_rol_seq OWNER TO vpablo;

--
-- Name: roles_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vpablo
--

ALTER SEQUENCE public.roles_id_rol_seq OWNED BY public.roles.id_rol;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: vpablo
--

CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    nombre_completo character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    id_rol integer
);


ALTER TABLE public.usuarios OWNER TO vpablo;

--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: vpablo
--

CREATE SEQUENCE public.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_usuario_seq OWNER TO vpablo;

--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vpablo
--

ALTER SEQUENCE public.usuarios_id_usuario_seq OWNED BY public.usuarios.id_usuario;


--
-- Name: visitas; Type: TABLE; Schema: public; Owner: vpablo
--

CREATE TABLE public.visitas (
    id_visita integer NOT NULL,
    id_cliente integer NOT NULL,
    id_tecnico integer NOT NULL,
    id_supervisor integer NOT NULL,
    fecha_planificada timestamp without time zone NOT NULL,
    estado character varying(20) DEFAULT 'Planificada'::character varying,
    fecha_ingreso timestamp without time zone,
    latitud_ingreso numeric(9,6),
    longitud_ingreso numeric(9,6),
    fecha_egreso timestamp without time zone,
    reporte_visita text,
    hora_inicio timestamp without time zone,
    hora_fin timestamp without time zone,
    latitud_tecnico numeric(18,10),
    longitud_tecnico numeric(18,10)
);


ALTER TABLE public.visitas OWNER TO vpablo;

--
-- Name: visitas_id_visita_seq; Type: SEQUENCE; Schema: public; Owner: vpablo
--

CREATE SEQUENCE public.visitas_id_visita_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visitas_id_visita_seq OWNER TO vpablo;

--
-- Name: visitas_id_visita_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vpablo
--

ALTER SEQUENCE public.visitas_id_visita_seq OWNED BY public.visitas.id_visita;


--
-- Name: clientes id_cliente; Type: DEFAULT; Schema: public; Owner: vpablo
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id_cliente SET DEFAULT nextval('public.clientes_id_cliente_seq'::regclass);


--
-- Name: roles id_rol; Type: DEFAULT; Schema: public; Owner: vpablo
--

ALTER TABLE ONLY public.roles ALTER COLUMN id_rol SET DEFAULT nextval('public.roles_id_rol_seq'::regclass);


--
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: public; Owner: vpablo
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq'::regclass);


--
-- Name: visitas id_visita; Type: DEFAULT; Schema: public; Owner: vpablo
--

ALTER TABLE ONLY public.visitas ALTER COLUMN id_visita SET DEFAULT nextval('public.visitas_id_visita_seq'::regclass);


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: vpablo
--

COPY public.clientes (id_cliente, nombre_empresa, contacto_nombre, contacto_email, telefono, direccion_texto, latitud, longitud) FROM stdin;
1	Pablo Enterprise	Pablo test	post@test.com	1234-5678	Avenida Reforma 1-1	14.613200	-90.533200
3	JJ. Solutions	Jose test	jose@test.com	0000-1234	Avenida Reforma 1-2	14.613200	-95.533200
5	Global Translations	Alex Valle	pablitovalle00@gmail.com	3214-9876	21 calle 6-77 zona 1, Centro Cívico	14.637391	-90.568011
2	Daleth Chocolate	Chaito test	jvalleq@miumg.edu.gt	1234-1234	Avenida Reforma 1-1	15.613200	-92.533200
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: vpablo
--

COPY public.roles (id_rol, nombre_rol) FROM stdin;
1	Administrador
2	Supervisor
3	Tecnico
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: vpablo
--

COPY public.usuarios (id_usuario, nombre_completo, email, password_hash, id_rol) FROM stdin;
1	Super Administrador	admin@skynet.com	$2b$10$GIU6exwlYMN1DkvTd5a1Qe/YovqHDmnOxrZW9wmpdmxIHJZy3rXj6	1
2	Admin Test	admin.test@skynet.com	$2b$10$XhRsz.vTGQRU9kGVaPDdQOPigDsxJuWdTAHpzCiJPD.9956AlQmoS	1
3	Tecnico Test	tecnico@skynet.com	$2b$10$jlBYuVq82/l7rNiiNPmTTOSyQDB2iru3AuM8IHFu.DyywhjwcHTCW	3
4	Jose Lopez	sup@skynet.com	$2b$10$nWq7OFSDkKr5B2ZHM.G9Q.4yGnYl6zwpNA.kpdl4F5nc4JauR/Pie	2
5	Manolo Valle	manolo@skynet.com	$2b$10$VroEkRwIUSaV5LqipX2g.u7z0fZWpI3y5OvNtIijBoTL9SQYs/AHm	2
\.


--
-- Data for Name: visitas; Type: TABLE DATA; Schema: public; Owner: vpablo
--

COPY public.visitas (id_visita, id_cliente, id_tecnico, id_supervisor, fecha_planificada, estado, fecha_ingreso, latitud_ingreso, longitud_ingreso, fecha_egreso, reporte_visita, hora_inicio, hora_fin, latitud_tecnico, longitud_tecnico) FROM stdin;
2	2	3	1	2025-11-24 23:38:00	Completada	2025-11-19 23:41:16.929012	14.634900	-90.506900	2025-11-20 21:01:10.581789	Visita finalizada con éxito	\N	\N	\N	\N
3	2	3	1	2025-11-29 00:42:00	En Progreso	2025-11-20 21:01:14.261722	14.634900	-90.506900	\N	\N	\N	\N	\N	\N
1	1	3	1	2025-11-26 23:38:00	Completada	2025-11-20 21:15:09.21182	14.598306	-90.757700	2025-11-20 21:21:17.670392	Visita realizada con éxito	\N	\N	\N	\N
5	2	3	4	2025-11-30 21:46:00	En Progreso	2025-11-20 21:46:59.394378	14.598315	-90.757736	\N	\N	\N	\N	\N	\N
4	5	3	4	2025-11-26 21:24:00	Finalizada	2025-11-20 21:25:12.932306	14.598314	-90.757700	\N	Test email	\N	2025-11-20 22:01:19.244908	\N	\N
\.


--
-- Name: clientes_id_cliente_seq; Type: SEQUENCE SET; Schema: public; Owner: vpablo
--

SELECT pg_catalog.setval('public.clientes_id_cliente_seq', 5, true);


--
-- Name: roles_id_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: vpablo
--

SELECT pg_catalog.setval('public.roles_id_rol_seq', 3, true);


--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: vpablo
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 5, true);


--
-- Name: visitas_id_visita_seq; Type: SEQUENCE SET; Schema: public; Owner: vpablo
--

SELECT pg_catalog.setval('public.visitas_id_visita_seq', 5, true);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: vpablo
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id_cliente);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: vpablo
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: vpablo
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: vpablo
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- Name: visitas visitas_pkey; Type: CONSTRAINT; Schema: public; Owner: vpablo
--

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_pkey PRIMARY KEY (id_visita);


--
-- Name: usuarios usuarios_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vpablo
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol);


--
-- PostgreSQL database dump complete
--

\unrestrict aNvdu1lEuQruOQEoBbvTLslwdLH0hGHUjAfGSYIw5ridPlpgKse9sdN5sGprNea

