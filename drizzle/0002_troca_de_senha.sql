ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "precisa_trocar_senha" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
-- Quem já existe entrou com senha definida por quem administra: todos trocam.
UPDATE "usuarios" SET "precisa_trocar_senha" = true;
