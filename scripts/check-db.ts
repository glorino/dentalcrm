import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const customers = await sql`SELECT id, name, email, phone FROM customers ORDER BY name`;
  console.log("=== CUSTOMERS ===");
  customers.forEach((c: any) => console.log(`${c.name} | ${c.email} | ${c.phone || 'no phone'}`));

  console.log("\n=== DOCTORS ===");
  const doctors = await sql`SELECT id, name, specialty FROM doctors`;
  doctors.forEach((d: any) => console.log(`${d.name} | ${d.specialty} | ${d.id}`));
}

main().catch(console.error);
