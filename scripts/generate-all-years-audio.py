#!/usr/bin/env python3

import os
import csv
import sys
import time
import json
from pathlib import Path
from hume import HumeClient
from hume.tts.types import PostedUtterance, PostedUtteranceVoiceWithId, FormatWav

def validate_text_content(text, filename):
    """
    Validate that text content is complete and not truncated
    """
    if not text or len(text.strip()) == 0:
        return False, "Empty text"
    
    # Check for common truncation indicators
    truncation_indicators = [
        "...",
        "…",
        "etc.",
        "etc",
        "and so on",
        "and more",
        "[truncated]",
        "[...]"
    ]
    
    text_lower = text.lower()
    for indicator in truncation_indicators:
        if text_lower.endswith(indicator):
            return False, f"Text appears truncated with '{indicator}'"
    
    # Check for reasonable text length (should be at least 10 words)
    word_count = len(text.split())
    if word_count < 10:
        return False, f"Text too short ({word_count} words)"
    
    # Check for reasonable character length (should be at least 50 characters)
    if len(text) < 50:
        return False, f"Text too short ({len(text)} characters)"
    
    return True, "Valid text"

def retry_audio_generation(client, utterance, max_retries=3):
    """
    Retry audio generation with exponential backoff
    """
    for attempt in range(max_retries):
        try:
            audio_data = client.tts.synthesize_json(
                utterances=[utterance],
                format=FormatWav()
            )
            return audio_data, None
        except Exception as e:
            if attempt == max_retries - 1:
                return None, str(e)
            print(f"   ⚠️  Attempt {attempt + 1} failed, retrying in {2**attempt}s...")
            time.sleep(2**attempt)
    
    return None, "Max retries exceeded"

def generate_year_audio(csv_file, output_dir, voice_id="e61bbb66-9084-40b7-a4dc-ddd0c62592c9"):
    """
    Generate audio files for a specific year's CSV with comprehensive error handling
    """
    print(f"🎵 Generating audio for: {csv_file}")
    print(f"📁 Output directory: {output_dir}")
    print(f"🎤 Using voice ID: {voice_id}")
    print("")
    
    # Initialize Hume client
    api_key = os.getenv('HUME_API_KEY', '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx')
    client = HumeClient(api_key=api_key)
    
    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Create error log file
    error_log_file = f"data/audio-generation-errors-{os.path.basename(csv_file).replace('.csv', '')}.json"
    errors = []
    
    # Read CSV file
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"📝 Found {len(rows)} love notes")
    print("")
    
    # Configure voice
    voice = PostedUtteranceVoiceWithId(id=voice_id)
    
    success_count = 0
    error_count = 0
    validation_errors = 0
    
    for i, row in enumerate(rows):
        text = row.get('text', '').strip()
        filename = row.get('filename', f'audio-{i+1}.wav')
        
        print(f"🎤 Processing {i+1}/{len(rows)}: {filename}")
        print(f"   📊 Text length: {len(text)} characters, {len(text.split())} words")
        print(f"   📅 Date: {row.get('date', 'Unknown')}")
        print(f"   📝 Preview: {text[:80]}...")
        
        # Validate text content
        is_valid, validation_message = validate_text_content(text, filename)
        if not is_valid:
            print(f"   ❌ Validation failed: {validation_message}")
            error_count += 1
            validation_errors += 1
            errors.append({
                "filename": filename,
                "row": i + 1,
                "error": f"Validation failed: {validation_message}",
                "text_length": len(text),
                "word_count": len(text.split()),
                "date": row.get('date', 'Unknown')
            })
            continue
        
        try:
            # Generate audio with retry logic
            utterance = PostedUtterance(
                text=text,
                voice=voice
            )
            
            audio_data, error = retry_audio_generation(client, utterance)
            
            if error:
                print(f"   ❌ Audio generation failed: {error}")
                error_count += 1
                errors.append({
                    "filename": filename,
                    "row": i + 1,
                    "error": f"Audio generation failed: {error}",
                    "text_length": len(text),
                    "word_count": len(text.split()),
                    "date": row.get('date', 'Unknown')
                })
                continue
            
            # Save audio file
            output_path = os.path.join(output_dir, filename)
            import base64
            audio_bytes = base64.b64decode(audio_data.generations[0].audio)
            
            # Verify audio file was created successfully
            with open(output_path, 'wb') as f:
                f.write(audio_bytes)
            
            # Verify file exists and has content
            if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                raise Exception("Audio file was not created or is empty")
            
            print(f"   ✅ Generated: {filename} ({audio_data.generations[0].duration:.2f}s)")
            success_count += 1
            
            # Add a small delay to avoid rate limiting
            time.sleep(0.1)
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            error_count += 1
            errors.append({
                "filename": filename,
                "row": i + 1,
                "error": str(e),
                "text_length": len(text),
                "word_count": len(text.split()),
                "date": row.get('date', 'Unknown')
            })
    
    # Save error log
    if errors:
        with open(error_log_file, 'w') as f:
            json.dump(errors, f, indent=2)
        print(f"📝 Error log saved to: {error_log_file}")
    
    print(f"")
    print(f"🎉 {csv_file} Audio generation complete!")
    print(f"✅ Successfully generated: {success_count} files")
    print(f"❌ Errors: {error_count} files")
    print(f"🔍 Validation errors: {validation_errors} files")
    print(f"📁 Output directory: {output_dir}")
    print("")
    
    return success_count, error_count

def main():
    print("🎵 Complete Love Notes Audio Generator")
    print("=" * 60)
    print("📅 Generating audio for all years: 2022-2024, then 2015-2021")
    print("🔍 Includes comprehensive error correction and validation")
    print("")
    
    # Define the years and their CSV files in priority order
    years_priority = [
        # Priority 1: Recent years (2022-2024)
        ("2022", "data/2022-david-love-notes-for-audio.csv", 78),
        ("2023", "data/2023-david-love-notes-for-audio.csv", 77),
        ("2024", "data/2024-david-love-notes-for-audio.csv", 40),
        # Priority 2: Earlier years (2015-2021)
        ("2015", "data/2015-david-love-notes-for-audio.csv", 172),
        ("2016", "data/2016-david-love-notes-for-audio.csv", 104),
        ("2017", "data/2017-david-love-notes-for-audio.csv", 19),
        ("2018", "data/2018-david-love-notes-for-audio.csv", 29),
        ("2019", "data/2019-david-love-notes-for-audio.csv", 33),
        ("2020", "data/2020-david-love-notes-for-audio.csv", 44),
        ("2021", "data/2021-david-love-notes-for-audio.csv", 40),
    ]
    
    output_dir = "public/audio/love-notes"
    total_success = 0
    total_errors = 0
    
    print("📋 Processing Plan:")
    for year, csv_file, expected_count in years_priority:
        print(f"   {year}: {expected_count} love notes")
    print("")
    
    # Process each year
    for year, csv_file, expected_count in years_priority:
        if not os.path.exists(csv_file):
            print(f"⚠️  Skipping {year}: CSV file not found: {csv_file}")
            continue
        
        print(f"🚀 Starting {year} ({expected_count} love notes)...")
        print("=" * 50)
        
        success_count, error_count = generate_year_audio(csv_file, output_dir)
        total_success += success_count
        total_errors += error_count
        
        print(f"✅ {year} complete: {success_count}/{expected_count} files generated")
        print("")
        
        # Add a longer delay between years to be safe
        time.sleep(1)
    
    print("🎉 ALL YEARS COMPLETE!")
    print("=" * 60)
    print(f"📊 Total Summary:")
    print(f"   ✅ Successfully generated: {total_success} files")
    print(f"   ❌ Errors: {total_errors} files")
    print(f"   📁 All files saved to: {output_dir}")
    print("")
    print("🎯 Next steps:")
    print("1. Check the audio quality in the output directory")
    print("2. Review error logs in data/audio-generation-errors-*.json")
    print("3. Use the audio files in your application")
    print("4. Consider creating a web interface to browse and play the audio")

if __name__ == "__main__":
    main() 