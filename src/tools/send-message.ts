import { SendMessageSchema } from '../schemas.js';
import { ToolHandler } from './types.js';
import { handleDiscordError } from "../errorHandler.js";
import { getChannelIdsByNames } from '../utils/channelUtils.js';


// Accepts: guildId, channelNames (string or array), message
export const sendMessageHandler: ToolHandler = async (args, { client }) => {
  // Accept both single and multiple channel names
  const { guildId, channelNames, message } = args;
  try {
    if (!client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true
      };
    }

    // Normalize channelNames to array
    const names = Array.isArray(channelNames) ? channelNames : [channelNames];
    const channelIds = await getChannelIdsByNames(client, guildId, names);
    if (channelIds.length === 0) {
      return {
        content: [{ type: "text", text: `No valid channels found for names: ${names.join(", ")}` }],
        isError: true
      };
    }

    let sentCount = 0;
    let errors: string[] = [];
    for (const channelId of channelIds) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (channel && channel.isTextBased() && 'send' in channel) {
          await channel.send(message);
          sentCount++;
        } else {
          errors.push(`Channel ${channelId} is not text-based or cannot send messages.`);
        }
      } catch (err) {
        errors.push(`Failed to send to channel ${channelId}: ${err}`);
      }
    }
    return {
      content: [{ type: "text", text: `Message sent to ${sentCount} channel(s).${errors.length ? ' Errors: ' + errors.join(' | ') : ''}` }],
      isError: errors.length > 0
    };
  } catch (error) {
    return handleDiscordError(error);
  }
};