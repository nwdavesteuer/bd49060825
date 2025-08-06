import PhotoTimeline from "@/components/photo-timeline"

export default function PhotoTimelinePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <PhotoTimeline messages={[]} />
      </div>
    </div>
  )
} 