import { supabase } from "./supabase"

// Updated interface to match your JSON structure
export interface iMessageData {
  message_id: number
  guid: string
  text: string
  date: number
  date_read?: number
  is_from_me: boolean
  has_attachments: boolean
  contact_id: string
  service: string
  readable_date: string
  attachments: any[]
  conversation_stats?: any
}

// New interface for your specific JSON format
export interface MessageExportFormat {
  metadata: {
    contact_identifier: string
    extraction_date: string
    total_messages: number
    date_range: {
      start: string
      end: string
    }
    conversation_stats: {
      total_messages: number
      sent_messages: number
      received_messages: number
      messages_with_attachments: number
      daily_message_counts: Record<string, number>
    }
  }
  messages: iMessageData[]
}

export function convertToOurFormat(messages: iMessageData[]) {
  return messages
    .filter((msg) => msg.text && msg.text.trim().length > 0)
    .map((msg) => {
      const date = new Date(msg.readable_date)
      return {
        original_id: msg.guid,
        date_sent: date.toISOString(),
        sender: msg.is_from_me ? "you" : "nitzan",
        content: msg.text,
        message_type: msg.has_attachments ? "image" : "text",
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        metadata: {
          message_id: msg.message_id,
          service: msg.service,
          contact_id: msg.contact_id,
          has_attachments: msg.has_attachments,
          attachment_count: msg.attachments?.length || 0,
        },
      }
    })
}

export async function importiMessageData(data: MessageExportFormat | iMessageData[]) {
  // Handle both formats - array of messages or object with metadata and messages
  const messages = Array.isArray(data) ? data : data.messages

  console.log(`Starting import of ${messages.length} messages...`)

  const convertedMessages = convertToOurFormat(messages)
  console.log(`Converted ${convertedMessages.length} valid messages`)

  const batchSize = 1000
  let imported = 0
  let errors = 0

  for (let i = 0; i < convertedMessages.length; i += batchSize) {
    const batch = convertedMessages.slice(i, i + batchSize)

    try {
      const { error } = await supabase.from("messages").insert(batch)

      if (error) {
        console.error(`Error importing batch ${i / batchSize + 1}:`, error)
        errors += batch.length
      } else {
        imported += batch.length
        console.log(`Imported batch ${i / batchSize + 1}/${Math.ceil(convertedMessages.length / batchSize)}`)
      }
    } catch (err) {
      console.error(`Exception importing batch ${i / batchSize + 1}:`, err)
      errors += batch.length
    }
  }

  console.log(`Import complete: ${imported} imported, ${errors} errors`)
  return { imported, errors, total: convertedMessages.length }
}

export function analyzeMessageData(data: MessageExportFormat | iMessageData[]) {
  // Handle both formats - array of messages or object with metadata and messages
  const messages = Array.isArray(data) ? data : data.messages

  // If we have metadata, use it for faster analysis
  if (!Array.isArray(data) && data.metadata) {
    const metadata = data.metadata
    return {
      totalMessages: metadata.total_messages,
      messagesWithText: messages.filter((m) => m.text && m.text.trim().length > 0).length,
      fromYou: metadata.conversation_stats.sent_messages,
      fromNitzan: metadata.conversation_stats.received_messages,
      withAttachments: metadata.conversation_stats.messages_with_attachments,
      services: [...new Set(messages.slice(0, 100).map((m) => m.service))], // Sample the first 100
      dateRange: {
        earliest: new Date(metadata.date_range.start),
        latest: new Date(metadata.date_range.end),
      },
      dailyMessageCounts: metadata.conversation_stats.daily_message_counts,
    }
  }

  // Fallback to manual analysis if no metadata
  const stats = {
    totalMessages: messages.length,
    messagesWithText: messages.filter((m) => m.text && m.text.trim().length > 0).length,
    fromYou: messages.filter((m) => m.is_from_me).length,
    fromNitzan: messages.filter((m) => !m.is_from_me).length,
    withAttachments: messages.filter((m) => m.has_attachments).length,
    services: [...new Set(messages.map((m) => m.service))],
    dateRange: {
      earliest: messages.reduce(
        (earliest, msg) => {
          const date = new Date(msg.readable_date)
          return !earliest || date < earliest ? date : earliest
        },
        null as Date | null,
      ),
      latest: messages.reduce(
        (latest, msg) => {
          const date = new Date(msg.readable_date)
          return !latest || date > latest ? date : latest
        },
        null as Date | null,
      ),
    },
  }

  return stats
}
