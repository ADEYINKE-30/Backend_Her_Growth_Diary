import { prepareTestDatabase } from "./test-database";

export default async function globalSetup(): Promise<void> {
  await prepareTestDatabase();
}
