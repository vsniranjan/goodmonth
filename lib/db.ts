import 'server-only';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor=ws;
const globalDb=globalThis as unknown as {goodmonthDb?:PrismaClient};
export function db(){
 if(!process.env.DATABASE_URL)throw new Error('Connect a Neon database to use live accounts. The sample workspace is ready to explore.');
 if(!globalDb.goodmonthDb)globalDb.goodmonthDb=new PrismaClient({adapter:new PrismaNeon({connectionString:process.env.DATABASE_URL})});
 return globalDb.goodmonthDb;
}
