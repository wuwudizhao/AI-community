-- Phase 1 infrastructure probe only. Forum domain tables are intentionally deferred.
CREATE TABLE "system_probes" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_probes_pkey" PRIMARY KEY ("id")
);
