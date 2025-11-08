import { PrismaClient } from "@prisma/client";
import type { Request, Response } from "express";

const prisma = new PrismaClient();

// Get all servers where bot is configured
export const getAllServers = async (req: Request, res: Response) => {
  try {
    const servers = await prisma.server.findMany({
      include: {
        channels: {
          select: {
            id: true,
            channelId: true,
            costInUsdc: true,
            roleId: true,
            roleApplicableTime: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      servers: servers.map((server) => ({
        id: server.id,
        serverId: server.serverId,
        receiverSolanaAddress: server.receiverSolanaAddress,
        receiverEthereumAddress: server.receiverEthereumAddress,
        defaultChannelId: server.defaultChannelId,
        channelCount: server.channels.length,
        channels: server.channels.map((channel) => ({
          id: channel.id,
          channelId: channel.channelId,
          costInUsdc: channel.costInUsdc.toString(),
          roleId: channel.roleId,
          roleApplicableTime: channel.roleApplicableTime,
        })),
      })),
    });
  } catch (error) {
    console.error("Error fetching servers:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Get specific server by serverId
export const getServerById = async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;

    if (!serverId) {
      return res.status(400).json({
        success: false,
        error: "Server ID is required",
      });
    }

    const server = await prisma.server.findUnique({
      where: { serverId },
      include: {
        channels: {
          select: {
            id: true,
            channelId: true,
            costInUsdc: true,
            roleId: true,
            roleApplicableTime: true,
          },
        },
      },
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Server not found",
      });
    }

    res.status(200).json({
      success: true,
      server: {
        id: server.id,
        serverId: server.serverId,
        receiverSolanaAddress: server.receiverSolanaAddress,
        receiverEthereumAddress: server.receiverEthereumAddress,
        defaultChannelId: server.defaultChannelId,
        channels: server.channels.map((channel) => ({
          id: channel.id,
          channelId: channel.channelId,
          costInUsdc: channel.costInUsdc.toString(),
          roleId: channel.roleId,
          roleApplicableTime: channel.roleApplicableTime,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching server:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Get channel configuration by channelId
export const getChannelById = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;

    if (!channelId) {
      return res.status(400).json({
        success: false,
        error: "Channel ID is required",
      });
    }

    const channel = await prisma.channel.findUnique({
      where: { channelId },
      include: {
        server: {
          select: {
            serverId: true,
            receiverSolanaAddress: true,
            receiverEthereumAddress: true,
          },
        },
      },
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: "Channel not found or not configured",
      });
    }

    res.status(200).json({
      success: true,
      channel: {
        id: channel.id,
        channelId: channel.channelId,
        serverId: channel.serverId,
        costInUsdc: channel.costInUsdc.toString(),
        roleId: channel.roleId,
        roleApplicableTime: channel.roleApplicableTime,
        server: channel.server,
      },
    });
  } catch (error) {
    console.error("Error fetching channel:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
