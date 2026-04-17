// build.js - Build script to replace placeholders with environment variables
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting build process...');
console.log('📂 Current directory:', __dirname);

const templatePath = path.join(__dirname, 'static', 'js', 'app.js.template');
const outputPath = path.join(__dirname, 'static', 'js', 'app.js');

console.log('📖 Reading template from:', templatePath);

// Check if template file exists
if (!fs.existsSync(templatePath)) {
    console.error('❌ Template file not found!');
    console.error('   Expected path:', templatePath);
    process.exit(1);
}

let content = fs.readFileSync(templatePath, 'utf8');
console.log('✅ Template file loaded successfully');
console.log('📊 Template size:', content.length, 'characters');

// Read environment variables (supports both naming conventions)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔑 Environment variables found:');
console.log('   SUPABASE_URL:', supabaseUrl ? '✅ Yes' : '❌ No');
console.log('   SUPABASE_KEY:', supabaseKey ? '✅ Yes' : '❌ No');

// Show partial values for verification (safe - only shows first few characters)
console.log('\n📋 Partial values (for verification):');
console.log('   SUPABASE_URL value:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Not found');
console.log('   SUPABASE_KEY value:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'Not found');

// Check if environment variables are missing
if (!supabaseUrl || !supabaseKey) {
    console.error('\n❌ Missing required environment variables!');
    console.error('   Please set the following in Vercel:');
    console.error('   - SUPABASE_URL');
    console.error('   - SUPABASE_KEY');
    console.error('\n   Or using NEXT_PUBLIC_ prefix:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
}

// Replace placeholders
const originalContent = content;
content = content.replace(/\{\{SUPABASE_URL\}\}/g, supabaseUrl);
content = content.replace(/\{\{SUPABASE_KEY\}\}/g, supabaseKey);

// Check if replacements were made
const urlReplacements = (originalContent.match(/\{\{SUPABASE_URL\}\}/g) || []).length;
const keyReplacements = (originalContent.match(/\{\{SUPABASE_KEY\}\}/g) || []).length;

console.log('\n📝 Placeholder replacements:');
console.log('   {{SUPABASE_URL}}:', urlReplacements, 'occurrences');
console.log('   {{SUPABASE_KEY}}:', keyReplacements, 'occurrences');

if (urlReplacements === 0 && keyReplacements === 0) {
    console.warn('\n⚠️ Warning: No placeholders found in template!');
    console.warn('   Make sure your template contains {{SUPABASE_URL}} and {{SUPABASE_KEY}}');
}

// Write the final file
fs.writeFileSync(outputPath, content);

console.log('\n✅ Build complete!');
console.log('📁 Generated file:', outputPath);
console.log('📊 Output file size:', (content.length / 1024).toFixed(2), 'KB');
console.log('\n🎉 NEXUX Dashboard is ready for deployment!');

// Verify the output file was created
if (fs.existsSync(outputPath)) {
    console.log('✅ Verification: app.js was successfully created');
    
    // Check if placeholders were actually replaced (quick check)
    const outputContent = fs.readFileSync(outputPath, 'utf8');
    if (outputContent.includes('{{SUPABASE_URL}}') || outputContent.includes('{{SUPABASE_KEY}}')) {
        console.error('❌ ERROR: Placeholders still present in output file!');
        console.error('   Build failed to replace environment variables.');
        process.exit(1);
    } else {
        console.log('✅ Verification: All placeholders replaced successfully');
    }
} else {
    console.error('❌ Verification failed: app.js was not created');
    process.exit(1);
}

console.log('\n🚀 You can now deploy to Vercel!');
