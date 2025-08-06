#!/usr/bin/env python3

import os
import csv
import sys
import base64
from pathlib import Path
from hume import HumeClient
from hume.tts.types import PostedUtterance, PostedUtteranceVoiceWithId, FormatWav

def get_remaining_notes(csv_file, output_dir):
    """Get the list of remaining notes that haven't been processed yet"""
    # Read CSV file
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    # Get existing audio files
    existing_files = set()
    if os.path.exists(output_dir):
        for file in os.listdir(output_dir):
            if file.endswith('.wav'):
                existing_files.add(file)
    
    # Find remaining notes
    remaining_notes = []
    for i, row in enumerate(rows):
        filename = row.get('filename', f'audio-{i+1}.wav')
        if filename not in existing_files:
            remaining_notes.append({
                'index': i,
                'id': row.get('id', ''),
                'text': row.get('text', ''),
                'date': row.get('date', ''),
                'emotion': row.get('emotion', ''),
                'filename': filename
            })
    
    return remaining_notes

def display_notes(notes, start_index=0, count=10):
    """Display a page of notes for selection"""
    end_index = min(start_index + count, len(notes))
    current_notes = notes[start_index:end_index]
    
    print(f"\n📄 Showing notes {start_index + 1}-{end_index} of {len(notes)} remaining")
    print("=" * 80)
    
    for i, note in enumerate(current_notes):
        note_num = start_index + i + 1
        text_preview = note['text'][:80] + "..." if len(note['text']) > 80 else note['text']
        print(f"{note_num:2d}. [{note['emotion']}] {text_preview}")
        print(f"     Date: {note['date']} | ID: {note['id']}")
        print()

def get_user_selection(notes):
    """Get user selection for which notes to process"""
    start_index = 0
    notes_per_page = 20
    
    while True:
        display_notes(notes, start_index, notes_per_page)
        
        print("Commands:")
        print("  n - Next page")
        print("  p - Previous page")
        print("  s <numbers> - Select specific notes (e.g., 's 1 3 5')")
        print("  a - Select all remaining notes")
        print("  q - Quit")
        print()
        
        command = input("Enter command: ").strip().lower()
        
        if command == 'q':
            return []
        elif command == 'n':
            if start_index + notes_per_page < len(notes):
                start_index += notes_per_page
            else:
                print("📄 Already at the last page")
        elif command == 'p':
            if start_index > 0:
                start_index = max(0, start_index - notes_per_page)
            else:
                print("📄 Already at the first page")
        elif command == 'a':
            return list(range(len(notes)))
        elif command.startswith('s '):
            try:
                # Parse selected numbers
                numbers = [int(x) for x in command[2:].split()]
                # Convert to 0-based indices
                selected_indices = [n - 1 for n in numbers if 1 <= n <= len(notes)]
                return selected_indices
            except ValueError:
                print("❌ Invalid selection. Please enter numbers separated by spaces.")
        else:
            print("❌ Invalid command. Please try again.")

def generate_selected_audio(selected_notes, output_dir, voice_id="e61bbb66-9084-40b7-a4dc-ddd0c62592c9"):
    """Generate audio for selected notes"""
    if not selected_notes:
        print("❌ No notes selected for processing.")
        return 0, 0
    
    print(f"\n🎵 Generating audio for {len(selected_notes)} selected notes...")
    print(f"🎤 Using voice ID: {voice_id}")
    print()
    
    # Initialize Hume client
    api_key = os.getenv('HUME_API_KEY', '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx')
    client = HumeClient(api_key=api_key)
    
    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Configure voice
    voice = PostedUtteranceVoiceWithId(
        id=voice_id
    )
    
    success_count = 0
    error_count = 0
    
    for i, note in enumerate(selected_notes):
        text = note['text'].strip()
        filename = note['filename']
        
        print(f"🎤 Generating audio {i+1}/{len(selected_notes)}: {filename}")
        print(f"   Text: {text[:100]}{'...' if len(text) > 100 else ''}")
        
        try:
            # Generate audio
            utterance = PostedUtterance(
                text=text,
                voice=voice
            )
            
            audio_data = client.tts.synthesize_json(
                utterances=[utterance],
                format=FormatWav()
            )
            
            # Save audio file
            output_path = os.path.join(output_dir, filename)
            audio_bytes = base64.b64decode(audio_data.generations[0].audio)
            with open(output_path, 'wb') as f:
                f.write(audio_bytes)
            
            print(f"   ✅ Generated: {filename} ({audio_data.generations[0].duration:.2f}s)")
            success_count += 1
            
            # Add a small delay to avoid rate limiting
            import time
            time.sleep(0.1)
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            error_count += 1
    
    print("")
    print("🎉 Audio generation complete!")
    print(f"✅ Successfully generated: {success_count} files")
    print(f"❌ Errors: {error_count} files")
    print(f"📁 Output directory: {output_dir}")
    
    return success_count, error_count

def main():
    csv_file = "data/2016-david-love-notes-for-audio.csv"
    output_dir = "public/audio/love-notes"
    
    if not os.path.exists(csv_file):
        print(f"❌ CSV file not found: {csv_file}")
        sys.exit(1)
    
    print("🎵 Interactive Audio Generator for 2016 Love Notes")
    print("=" * 50)
    
    # Get remaining notes
    remaining_notes = get_remaining_notes(csv_file, output_dir)
    
    if not remaining_notes:
        print("✅ All notes have already been processed!")
        return
    
    print(f"📝 Found {len(remaining_notes)} remaining notes to process")
    
    # Get user selection (this will handle pagination internally)
    selected_indices = get_user_selection(remaining_notes)
    
    if selected_indices:
        # Get the actual selected notes
        selected_notes = [remaining_notes[i] for i in selected_indices]
        
        # Confirm selection
        print(f"\n🎯 You selected {len(selected_notes)} notes to process:")
        for i, note in enumerate(selected_notes):
            print(f"   {i+1}. {note['text'][:60]}...")
        
        # Auto-confirm if selecting all notes
        if len(selected_notes) == len(remaining_notes):
            print("\n🎵 Auto-proceeding with generation for all notes...")
            generate_selected_audio(selected_notes, output_dir)
        else:
            confirm = input("\nProceed with generation? (y/n): ").strip().lower()
            if confirm == 'y':
                generate_selected_audio(selected_notes, output_dir)
            else:
                print("❌ Generation cancelled.")
    else:
        print("❌ No notes selected.")

if __name__ == "__main__":
    main() 