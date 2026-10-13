-- CreateTable
CREATE TABLE "SiteContent" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "titre" TEXT NOT NULL DEFAULT 'Qui sommes-nous',
    "intro" TEXT NOT NULL DEFAULT '',
    "imageId" INTEGER,
    "adresse" TEXT NOT NULL DEFAULT '',
    "telephone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "horaires" TEXT NOT NULL DEFAULT '',
    "chiffres" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
