"use client"

import { useState, useEffect } from 'react'
import { Heart, Play, Pause, SkipBack, SkipForward, Plus, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAudioStore } from '@/lib/audio-state-manager'

interface Playlist {
  id: string
  name: string
  files: string[]
  createdAt: Date
}

interface AudioPlaylistManagerProps {
  currentAudioFiles: string[]
  onPlaylistSelect: (files: string[]) => void
}

export default function AudioPlaylistManager({
  currentAudioFiles,
  onPlaylistSelect
}: AudioPlaylistManagerProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  
  const {
    isPlaying,
    currentAudioFile,
    play,
    pause,
    next,
    previous
  } = useAudioStore()

  // Load playlists from localStorage
  useEffect(() => {
    const savedPlaylists = localStorage.getItem('love-notes-playlists')
    if (savedPlaylists) {
      try {
        const parsed = JSON.parse(savedPlaylists)
        setPlaylists(parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt)
        })))
      } catch (error) {
        console.error('Error loading playlists:', error)
      }
    }
  }, [])

  // Save playlists to localStorage
  const savePlaylists = (newPlaylists: Playlist[]) => {
    localStorage.setItem('love-notes-playlists', JSON.stringify(newPlaylists))
    setPlaylists(newPlaylists)
  }

  const createPlaylist = () => {
    if (!newPlaylistName.trim() || currentAudioFiles.length === 0) return

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName.trim(),
      files: [...currentAudioFiles],
      createdAt: new Date()
    }

    const updatedPlaylists = [...playlists, newPlaylist]
    savePlaylists(updatedPlaylists)
    
    setNewPlaylistName('')
    setShowCreateForm(false)
  }

  const deletePlaylist = (playlistId: string) => {
    const updatedPlaylists = playlists.filter(p => p.id !== playlistId)
    savePlaylists(updatedPlaylists)
    
    if (selectedPlaylist === playlistId) {
      setSelectedPlaylist(null)
    }
  }

  const playPlaylist = (playlist: Playlist) => {
    onPlaylistSelect(playlist.files)
    if (playlist.files.length > 0) {
      play(playlist.files[0], 0)
    }
  }

  const addToFavorites = () => {
    if (currentAudioFiles.length === 0) return

    const favoritesPlaylist = playlists.find(p => p.name === 'Favorites')
    
    if (favoritesPlaylist) {
      // Add current files to existing favorites
      const updatedFiles = [...new Set([...favoritesPlaylist.files, ...currentAudioFiles])]
      const updatedPlaylists = playlists.map(p => 
        p.id === favoritesPlaylist.id 
          ? { ...p, files: updatedFiles }
          : p
      )
      savePlaylists(updatedPlaylists)
    } else {
      // Create new favorites playlist
      const newFavorites: Playlist = {
        id: 'favorites',
        name: 'Favorites',
        files: [...currentAudioFiles],
        createdAt: new Date()
      }
      savePlaylists([...playlists, newFavorites])
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Playlists</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={addToFavorites}
            disabled={currentAudioFiles.length === 0}
            className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
          >
            <Heart className="h-4 w-4 mr-1" />
            Add to Favorites
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Playlist
          </Button>
        </div>
      </div>

      {/* Create Playlist Form */}
      {showCreateForm && (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name..."
              className="flex-1 px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-pink-500 focus:outline-none"
            />
            <Button
              size="sm"
              onClick={createPlaylist}
              disabled={!newPlaylistName.trim() || currentAudioFiles.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              Create
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreateForm(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
          {currentAudioFiles.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Will include {currentAudioFiles.length} audio files
            </p>
          )}
        </div>
      )}

      {/* Playlists List */}
      <div className="space-y-2">
        {playlists.length === 0 ? (
          <p className="text-gray-400 text-sm">No playlists yet. Create one to get started!</p>
        ) : (
          playlists.map(playlist => (
            <div
              key={playlist.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedPlaylist === playlist.id
                  ? 'bg-gray-700 border-pink-500'
                  : 'bg-gray-700 border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => setSelectedPlaylist(playlist.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {playlist.name === 'Favorites' && <Star className="h-4 w-4 text-yellow-500" />}
                  <div>
                    <h4 className="font-medium text-white">{playlist.name}</h4>
                    <p className="text-xs text-gray-400">
                      {playlist.files.length} files • Created {playlist.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      playPlaylist(playlist)
                    }}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePlaylist(playlist.id)
                    }}
                    variant="outline"
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Current Playlist Info */}
      {selectedPlaylist && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <h4 className="font-medium text-white mb-2">Current Selection</h4>
          <p className="text-sm text-gray-300">
            {currentAudioFiles.length} files ready to play
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              onClick={() => onPlaylistSelect(currentAudioFiles)}
              disabled={currentAudioFiles.length === 0}
              className="bg-gradient-to-r from-pink-500 to-red-500"
            >
              <Play className="h-3 w-3 mr-1" />
              Play All
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 