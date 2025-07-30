"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface Message {
  timestamp: Date
  sender: string
  content: string
}

interface SampleVisualizationProps {
  messages: Message[]
}

const SampleVisualization: React.FC<SampleVisualizationProps> = ({ messages }) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!messages || messages.length === 0) {
      return
    }

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove() // Clear previous content

    const width = 600
    const height = 400
    const margin = { top: 20, right: 20, bottom: 30, left: 40 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    svg.attr("width", width).attr("height", height)

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Process data (example: count messages per sender)
    const senderCounts = d3
      .rollups(
        messages,
        (v) => v.length,
        (d) => d.sender,
      )
      .sort(([, a], [, b]) => b - a)

    const topSenders = senderCounts.slice(0, 5) // Display top 5 senders
    const data = topSenders.map(([sender, count]) => ({ sender, count }))

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.sender))
      .range([0, innerWidth])
      .padding(0.1)

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) || 0])
      .range([innerHeight, 0])

    g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x))

    g.append("g").call(d3.axisLeft(y))

    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.sender) || "0")
      .attr("y", (d) => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", (d) => innerHeight - y(d.count))
      .attr("fill", "steelblue")
  }, [messages])

  return <svg ref={svgRef}></svg>
}

export default SampleVisualization
