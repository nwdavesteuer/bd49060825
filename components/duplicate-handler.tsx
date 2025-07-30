"use client"

import { useState, useEffect } from "react"
import { supabase } from "../utils/supabaseClient"

const DuplicateHandler = () => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("messages").select("*")

        if (error) {
          console.error("Error fetching stats:", error)
          return
        }

        // Process stats here
        const processedStats = {
          totalMessages: data.length,
          dateRange: {
            earliest: data.length > 0 ? new Date(Math.min(...data.map((m) => new Date(m.date_sent).getTime()))) : null,
            latest: data.length > 0 ? new Date(Math.max(...data.map((m) => new Date(m.date_sent).getTime()))) : null,
          },
          fromYou: data.filter((m) => m.sender === "you").length,
          fromNitzan: data.filter((m) => m.sender === "nitzan").length,
        }

        setStats(processedStats)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <div>
      {stats && (
        <div>
          <p>Total Messages: {stats.totalMessages}</p>
          <p>Earliest Message: {stats.dateRange.earliest?.toLocaleDateString() || "N/A"}</p>
          <p>Latest Message: {stats.dateRange.latest?.toLocaleDateString() || "N/A"}</p>
          <p>Messages from You: {stats.fromYou}</p>
          <p>Messages from Nitzan: {stats.fromNitzan}</p>
        </div>
      )}
    </div>
  )
}

export default DuplicateHandler
