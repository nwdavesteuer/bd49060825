import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase env vars are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "")

export const TABLE_NAME = "fulldata_set"

export interface Message {
  text: string
  data: string
  date_read: string
  is_from_me: number | string
  sender: string
  recipient: string
  has_attachments: number | string
  attachments_info: string
  emojis: string
  links: string
  service: string
  account: string
  contact_id: string
  readable_date: string
  message_id?: number | string
  date?: string
  message_type?: string
  year?: number
  month?: number
  day?: number
  metadata?: any
  created_at?: string
  updated_at?: string
  guid?: string
  attachment_count?: number
  // Emotion analysis fields
  primary_emotion?: string
  emotion_confidence?: number
  secondary_emotions?: string[]
  emotion_intensity?: number
  emotion_context?: string
  emotion_triggers?: string[]
  relationship_impact?: string
}

export const getMessagesTable = () => supabase.from(TABLE_NAME)

export async function testConnection() {
  try {
    const { count, error } = await supabase.from(TABLE_NAME).select("*", { count: "exact", head: true })
    if (error) throw error
    return { success: true, count }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getTableSchema() {
  try {
    const { data, error } = await supabase.from(TABLE_NAME).select("*").limit(1)
    if (error) throw error

    if (data && data.length > 0) {
      return {
        success: true,
        columns: Object.keys(data[0]),
        sample: data[0],
      }
    }

    return { success: true, columns: [], sample: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export function convertTimestampToDate(timestamp: any): Date {
  if (typeof timestamp === "string") {
    if (timestamp.includes("+") || timestamp.includes("-") || timestamp.includes("T")) {
      return new Date(timestamp)
    }
    return new Date(timestamp)
  }
  if (typeof timestamp === "number") {
    if (timestamp > 1000000000000) {
      return new Date(timestamp)
    } else if (timestamp > 1000000000) {
      return new Date(timestamp * 1000)
    } else {
      return new Date((timestamp + 978307200) * 1000)
    }
  }
  return new Date(timestamp)
}

export const CUTOFF_DATE = new Date("2015-07-24T00:00:00.000Z")

export function filterMessagesByDate(messages: Message[]): Message[] {
  console.log("filterMessagesByDate called with", messages.length, "messages - returning ALL (no filter)")
  return messages
}

export async function fetchAllMessages(limit?: number) {
  try {
    console.log("fetchAllMessages called with limit:", limit)

    const query = supabase.from(TABLE_NAME).select("*").order("readable_date", { ascending: true })

    console.log("NOT applying any limit - fetching ALL messages")

    const { data, error } = await query

    if (error) throw error

    console.log("Raw query returned:", data?.length, "messages")

    const normalizedMessages = (data || []).map((msg: any, idx: number) => {
      const messageDate = convertTimestampToDate(msg.readable_date)
      // Prefer stable database message id. Fall back through common fields.
      const rawId = (msg as any).message_id ?? (msg as any).id ?? (msg as any).rowid ?? (msg as any).ROWID
      const normalizedId = rawId != null && rawId !== '' && rawId !== 'undefined'
        ? (Number.isFinite(Number(rawId)) ? Number(rawId) : String(rawId))
        : undefined

      return {
        // Normalize text: treat numeric 0 or string "0" as empty
        text: ((): string => {
          const raw = (msg as any).text
          if (raw === 0 || raw === "0") return ""
          if (raw == null) return ""
          return String(raw)
        })(),
        data: msg.data || "",
        date_read: msg.date_read || "",
        is_from_me: msg.is_from_me,
        sender: msg.sender || "",
        recipient: msg.recipient || "",
        has_attachments: msg.has_attachments,
        attachments_info: msg.attachments_info || "",
        emojis: msg.emojis || "",
        links: msg.links || "",
        service: msg.service || "",
        account: msg.account || "",
        contact_id: msg.contact_id || "",
        readable_date: msg.readable_date || "",
        message_id: normalizedId ?? `${messageDate.getTime()}_${idx}`,
        date: messageDate.toISOString(),
        message_type: msg.has_attachments && msg.has_attachments !== "0" ? "image" : "text",
        year: messageDate.getFullYear(),
        month: messageDate.getMonth() + 1,
        day: messageDate.getDate(),
        metadata: {},
        attachment_count: msg.has_attachments && msg.has_attachments !== "0" ? 1 : 0,
      }
    })

    console.log("Normalized messages:", normalizedMessages.length)

    const filteredMessages = normalizedMessages
    console.log("After 'filtering' (no filter applied):", filteredMessages.length)

    return {
      success: true,
      data: filteredMessages,
      count: filteredMessages.length,
    }
  } catch (error: any) {
    console.error("fetchAllMessages error:", error)
    return {
      success: false,
      error: error.message,
      data: [],
      count: 0,
    }
  }
}

export async function getMessageStats() {
  try {
    const { data, error } = await supabase.from(TABLE_NAME).select("readable_date, sender, is_from_me, has_attachments")

    if (error) throw error

    const validMessages = (data || []).filter((msg) => {
      try {
        const messageDate = convertTimestampToDate(msg.readable_date)
        return !isNaN(messageDate.getTime())
      } catch {
        return false
      }
    })

    const stats = {
      total: validMessages.length,
      fromYou: validMessages.filter((m) => m.is_from_me === 1 || m.is_from_me === "1").length,
      fromNitzan: validMessages.filter((m) => m.is_from_me === 0 || m.is_from_me === "0").length,
      withAttachments: validMessages.filter((m) => m.has_attachments === 1 || m.has_attachments === "1").length,
      dateRange: {
        earliest:
          validMessages.length > 0
            ? new Date(Math.min(...validMessages.map((m) => convertTimestampToDate(m.readable_date).getTime())))
            : null,
        latest:
          validMessages.length > 0
            ? new Date(Math.max(...validMessages.map((m) => convertTimestampToDate(m.readable_date).getTime())))
            : null,
      },
    }

    return { success: true, stats }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
