import { supabase } from "./supabase"

export interface ImportMessage {
  date: string
  sender: "you" | "nitzan"
  content: string
  type?: string
  // Add other fields from your JSON structure
}

export async function importMessagesFromJSON(messages: ImportMessage[]) {
  console.log(`Starting import of ${messages.length} messages...`)

  const batchSize = 1000
  let imported = 0
  let errors = 0

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize)

    const formattedBatch = batch.map((msg) => {
      const date = new Date(msg.date)
      return {
        original_id: `import_${i + batch.indexOf(msg)}`,
        date_sent: date.toISOString(),
        sender: msg.sender,
        content: msg.content || "",
        message_type: msg.type || "text",
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      }
    })

    try {
      const { error } = await supabase.from("messages").insert(formattedBatch)

      if (error) {
        console.error(`Error importing batch ${i / batchSize + 1}:`, error)
        errors += batch.length
      } else {
        imported += batch.length
        console.log(`Imported batch ${i / batchSize + 1}/${Math.ceil(messages.length / batchSize)}`)
      }
    } catch (err) {
      console.error(`Exception importing batch ${i / batchSize + 1}:`, err)
      errors += batch.length
    }
  }

  console.log(`Import complete: ${imported} imported, ${errors} errors`)
  return { imported, errors }
}

// Helper function to validate JSON structure
export function validateMessageData(data: any[]): ImportMessage[] {
  return data.filter((item) => {
    return (
      item.date &&
      item.sender &&
      (item.sender === "you" || item.sender === "nitzan") &&
      typeof item.content === "string"
    )
  })
}
