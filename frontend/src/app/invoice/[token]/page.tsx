import React from "react";
import { prisma } from "../../../../prisma/prisma";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { token },
  });

  if (!invoice) {
    return notFound();
  }
  return <div>Home</div>;
}
