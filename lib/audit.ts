import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

type AuditLogInput = {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
  request?: Request;
};

function getClientIp(request?: Request): string | null {
  if (!request) return null;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return null;
}

export async function logAuditEvent({
  actorId,
  action,
  targetType,
  targetId,
  metadata,
  request,
}: AuditLogInput): Promise<void> {
  const ip = getClientIp(request);
  const userAgent = request?.headers.get("user-agent") || null;

  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId: targetId ?? null,
        metadata: metadata ?? null,
        ip,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Falha ao registrar audit log:", error);
  }
}
