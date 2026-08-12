CREATE TABLE "anexos" (
	"id" serial PRIMARY KEY NOT NULL,
	"rascunho_id" text NOT NULL,
	"numero_do_pedido" text,
	"documento_id" text NOT NULL,
	"nome" text NOT NULL,
	"tamanho" integer NOT NULL,
	"tipo_mime" text NOT NULL,
	"caminho" text NOT NULL,
	"anexado_por" text NOT NULL,
	"anexado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"cnpj_cpf" text PRIMARY KEY NOT NULL,
	"tipo" text NOT NULL,
	"razao_social" text NOT NULL,
	"contato" text DEFAULT '' NOT NULL,
	"contato_incompleto" boolean DEFAULT false NOT NULL,
	"email_financeiro" text DEFAULT '' NOT NULL,
	"email_assinatura" text DEFAULT '' NOT NULL,
	"telefone" text DEFAULT '' NOT NULL,
	"endereco_fiscal" jsonb,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clientes_rejeitados" (
	"id" serial PRIMARY KEY NOT NULL,
	"documento_bruto" text NOT NULL,
	"razao_social" text NOT NULL,
	"motivo" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "divergencias_de_cadastro" (
	"id" serial PRIMARY KEY NOT NULL,
	"cnpj_cpf" text NOT NULL,
	"numero_do_pedido" text,
	"campo_id" text NOT NULL,
	"valor_da_base" text NOT NULL,
	"valor_digitado" text NOT NULL,
	"registrada_por" text NOT NULL,
	"registrada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"resolvida_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "historico_de_situacao" (
	"id" serial PRIMARY KEY NOT NULL,
	"numero_do_pedido" text NOT NULL,
	"de" text,
	"para" text NOT NULL,
	"quando" timestamp with time zone DEFAULT now() NOT NULL,
	"quem" text NOT NULL,
	"motivo" text DEFAULT '' NOT NULL,
	"dias_na_situacao" integer DEFAULT 0 NOT NULL,
	"estourou_o_prazo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"numero" text PRIMARY KEY NOT NULL,
	"cnpj_cpf" text NOT NULL,
	"situacao_id" text NOT NULL,
	"responsavel" text NOT NULL,
	"operadora" text NOT NULL,
	"empresa_faturadora" text NOT NULL,
	"canal_de_venda" text NOT NULL,
	"plano_id" text NOT NULL,
	"qtd_linhas" integer NOT NULL,
	"preco_venda" numeric(10, 2) NOT NULL,
	"valor_do_chip" numeric(10, 2) NOT NULL,
	"tipo" text NOT NULL,
	"tipo_de_chip" text NOT NULL,
	"forma_de_entrega" text,
	"endereco_de_entrega" jsonb,
	"data_portabilidade" date,
	"vendedor" text NOT NULL,
	"observacao" text DEFAULT '' NOT NULL,
	"excecao_de_preco_status" text DEFAULT 'nao-solicitada' NOT NULL,
	"excecao_de_preco_justificativa" text DEFAULT '' NOT NULL,
	"tem_comprovante" boolean DEFAULT false NOT NULL,
	"data_entrada" timestamp with time zone DEFAULT now() NOT NULL,
	"data_situacao" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pendencias" (
	"id" serial PRIMARY KEY NOT NULL,
	"numero_do_pedido" text NOT NULL,
	"situacao_id" text NOT NULL,
	"pergunta" text NOT NULL,
	"dono" text NOT NULL,
	"aberta_por" text NOT NULL,
	"aberta_em" timestamp with time zone DEFAULT now() NOT NULL,
	"resposta" text,
	"respondida_por" text,
	"respondida_em" timestamp with time zone,
	"eh_regra" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planos" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"operadora" text NOT NULL,
	"custo_por_linha" numeric(10, 2),
	"origem_do_custo" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequencia_de_pedido" (
	"ano" integer PRIMARY KEY NOT NULL,
	"ultimo" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_numero_do_pedido_pedidos_numero_fk" FOREIGN KEY ("numero_do_pedido") REFERENCES "public"."pedidos"("numero") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "divergencias_de_cadastro" ADD CONSTRAINT "divergencias_de_cadastro_cnpj_cpf_clientes_cnpj_cpf_fk" FOREIGN KEY ("cnpj_cpf") REFERENCES "public"."clientes"("cnpj_cpf") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_de_situacao" ADD CONSTRAINT "historico_de_situacao_numero_do_pedido_pedidos_numero_fk" FOREIGN KEY ("numero_do_pedido") REFERENCES "public"."pedidos"("numero") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cnpj_cpf_clientes_cnpj_cpf_fk" FOREIGN KEY ("cnpj_cpf") REFERENCES "public"."clientes"("cnpj_cpf") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_plano_id_planos_id_fk" FOREIGN KEY ("plano_id") REFERENCES "public"."planos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pendencias" ADD CONSTRAINT "pendencias_numero_do_pedido_pedidos_numero_fk" FOREIGN KEY ("numero_do_pedido") REFERENCES "public"."pedidos"("numero") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sequencia_ano_unico" ON "sequencia_de_pedido" USING btree ("ano");