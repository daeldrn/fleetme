-- CreateTable
CREATE TABLE "_DriverToVehicle" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_DriverToVehicle_A_fkey" FOREIGN KEY ("A") REFERENCES "Driver" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DriverToVehicle_B_fkey" FOREIGN KEY ("B") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_DriverToVehicle_AB_unique" ON "_DriverToVehicle"("A", "B");

-- CreateIndex
CREATE INDEX "_DriverToVehicle_B_index" ON "_DriverToVehicle"("B");
