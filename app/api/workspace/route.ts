import { apiError, requireUser } from '@/lib/auth';
import { readWorkspace } from '@/lib/store';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{const viewer=await requireUser();return Response.json({workspace:await readWorkspace(viewer),viewer},{headers:{'Cache-Control':'no-store'}});}catch(e){return apiError(e);}}
