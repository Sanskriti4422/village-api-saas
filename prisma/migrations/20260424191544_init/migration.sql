-- CreateTable
CREATE TABLE "State" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "District_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubDistrict" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubDistrict_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Village" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "searchText" TEXT NOT NULL,
    "subDistrictId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Village_subDistrictId_fkey" FOREIGN KEY ("subDistrictId") REFERENCES "SubDistrict" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "State_slug_key" ON "State"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "District_stateId_slug_key" ON "District"("stateId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "SubDistrict_districtId_slug_key" ON "SubDistrict"("districtId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Village_subDistrictId_slug_key" ON "Village"("subDistrictId", "slug");
