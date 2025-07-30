import { supabase } from "./supabase"

export interface ImportOptions {
  replaceExisting: boolean
  dateRangeStart?: string
  dateRangeEnd?: string
  batchSize?: number
  markAsSource?: string
}

export async function importWithDuplicateHandling(
  messages: any[],
  options: ImportOptions = { replaceExisting: false },
) {
  console.log(`Starting enhanced import of ${messages.length} messages...`)

  const {
    replaceExisting = false,
    dateRangeStart,
    dateRangeEnd,
    batchSize = 1000,
    markAsSource = "full_import",
  } = options

  // Step 1: Clear existing data if requested
  if (replaceExisting) {
    console.log("Clearing existing data...")

    let deleteQuery = supabase.from("messages").delete()

    if (dateRangeStart && dateRangeEnd) {
      deleteQuery = deleteQuery.gte("date_sent", dateRangeStart).lte("date_sent", dateRangeEnd)
    } else {
      // Delete all
      deleteQuery = deleteQuery.neq("id", "00000000-0000-0000-0000-000000000000")
    }

    const { error: deleteError, count: deletedCount } = await deleteQuery

    if (deleteError) {
      console.error("Error clearing existing data:", deleteError)
      throw deleteError
    }

    console.log(`Cleared ${deletedCount || 0} existing messages`)
  }

  // Step 2: Process and import messages in batches
  const convertedMessages = messages
    .filter((msg) => msg && msg.text && msg.text.trim().length > 0)
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
          source: markAsSource,
          import_timestamp: new Date().toISOString(),
        },
      }
    })

  console.log(`Converted ${convertedMessages.length} valid messages`)

  let imported = 0
  let errors = 0
  const totalBatches = Math.ceil(convertedMessages.length / batchSize)

  for (let i = 0; i < convertedMessages.length; i += batchSize) {
    const batch = convertedMessages.slice(i, i + batchSize)
    const currentBatch = Math.floor(i / batchSize) + 1

    try {
      const { error } = await supabase.from("messages").insert(batch)

      if (error) {
        console.error(`Error importing batch ${currentBatch}/${totalBatches}:`, error)
        errors += batch.length
      } else {
        imported += batch.length
        console.log(`Imported batch ${currentBatch}/${totalBatches}`)
      }
    } catch (err) {
      console.error(`Exception importing batch ${currentBatch}/${totalBatches}:`, err)
      errors += batch.length
    }
  }

  console.log(`Import complete: ${imported} imported, ${errors} errors`)
  return { imported, errors, total: convertedMessages.length }
}
