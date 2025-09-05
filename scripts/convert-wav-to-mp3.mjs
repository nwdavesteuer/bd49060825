#!/usr/bin/env node

import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

const audioDir = path.join(__dirname, '../public/audio/love-notes');
const outputDir = path.join(__dirname, '../public/audio/love-notes-mp3');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function convertWavToMp3(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .toFormat('mp3')
      .audioBitrate(128) // 128kbps for good quality with smaller size
      .on('end', () => {
        console.log(`✓ Converted: ${path.basename(inputFile)}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`✗ Error converting ${path.basename(inputFile)}:`, err.message);
        reject(err);
      })
      .save(outputFile);
  });
}

async function convertAllFiles() {
  try {
    const files = fs.readdirSync(audioDir).filter(file => file.endsWith('.wav'));
    console.log(`Found ${files.length} WAV files to convert...`);
    
    let converted = 0;
    let errors = 0;
    
    for (const file of files) {
      const inputPath = path.join(audioDir, file);
      const outputPath = path.join(outputDir, file.replace('.wav', '.mp3'));
      
      // Skip if MP3 already exists
      if (fs.existsSync(outputPath)) {
        console.log(`⏭ Skipping ${file} (MP3 already exists)`);
        continue;
      }
      
      try {
        await convertWavToMp3(inputPath, outputPath);
        converted++;
      } catch (error) {
        errors++;
      }
    }
    
    console.log(`\n🎉 Conversion complete!`);
    console.log(`✓ Converted: ${converted} files`);
    console.log(`✗ Errors: ${errors} files`);
    
    // Check size difference
    const wavSize = await getFolderSize(audioDir);
    const mp3Size = await getFolderSize(outputDir);
    
    console.log(`\n📊 Size comparison:`);
    console.log(`WAV files: ${(wavSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`MP3 files: ${(mp3Size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Space saved: ${((wavSize - mp3Size) / wavSize * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('Error during conversion:', error);
  }
}

async function getFolderSize(folderPath) {
  if (!fs.existsSync(folderPath)) return 0;
  
  let size = 0;
  const files = fs.readdirSync(folderPath);
  
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);
    size += stats.size;
  }
  
  return size;
}

// Run the conversion
convertAllFiles();