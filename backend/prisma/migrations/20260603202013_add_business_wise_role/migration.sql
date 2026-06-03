-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- DropIndex
DROP INDEX "Product_metadata_gin";

-- AlterTable
ALTER TABLE "UserBusiness" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE';
