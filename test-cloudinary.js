// test-cloudinary.js - Simple test script to verify Cloudinary configuration

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const testCloudinaryConfig = async () => {
  console.log('🧪 Testing Cloudinary configuration...');
  
  // Check environment variables
  const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars);
    return false;
  }
  
  console.log('✅ Environment variables found');
  
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  
  try {
    // Test Cloudinary connection by getting account info
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', result);
    
    // Test folder creation (this will create the audio-files folder if it doesn't exist)
    console.log('📁 Testing folder access...');
    const folders = await cloudinary.api.root_folders();
    console.log('✅ Folders accessible:', folders.folders?.length || 0, 'folders found');
    
    return true;
  } catch (error) {
    console.error('❌ Cloudinary test failed:', error.message);
    return false;
  }
};

// Run the test
testCloudinaryConfig()
  .then(success => {
    if (success) {
      console.log('🎉 Cloudinary configuration is working correctly!');
    } else {
      console.log('💥 Cloudinary configuration has issues. Please check your environment variables.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  });






