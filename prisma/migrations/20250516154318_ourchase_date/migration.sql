-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "purchaseDate" DATETIME,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "vehicleTypeId" TEXT NOT NULL,
    CONSTRAINT "Vehicle_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("createdAt", "id", "licensePlate", "make", "model", "purchaseDate", "status", "updatedAt", "vehicleTypeId", "vin", "year") SELECT "createdAt", "id", "licensePlate", "make", "model", "purchaseDate", "status", "updatedAt", "vehicleTypeId", "vin", "year" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE UNIQUE INDEX "Vehicle_licensePlate_key" ON "Vehicle"("licensePlate");
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
