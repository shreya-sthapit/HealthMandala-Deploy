#!/usr/bin/env node

/**
 * Test Script: Check Doctor Schedule
 * 
 * This script helps diagnose why dates aren't showing in the booking interface.
 * 
 * Usage:
 *   node test-doctor-schedule.js [DOCTOR_USER_ID]
 * 
 * Example:
 *   node test-doctor-schedule.js 507f1f77bcf86cd799439011
 */

const http = require('http');

const BACKEND_URL = 'localhost';
const BACKEND_PORT = 5001;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BACKEND_URL,
      port: BACKEND_PORT,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testDoctorSchedule(doctorId) {
  console.log('\n===========================================');
  console.log('DOCTOR SCHEDULE DIAGNOSTIC TEST');
  console.log('===========================================\n');

  if (!doctorId) {
    console.log('❌ ERROR: No doctor ID provided');
    console.log('\nUsage: node test-doctor-schedule.js [DOCTOR_USER_ID]');
    console.log('Example: node test-doctor-schedule.js 507f1f77bcf86cd799439011\n');
    process.exit(1);
  }

  console.log(`Testing doctor ID: ${doctorId}\n`);

  try {
    // Test 1: Check if backend is running
    console.log('Test 1: Checking backend connection...');
    try {
      await makeRequest('/api/doctor/approved');
      console.log('✅ Backend is running on port 5001\n');
    } catch (error) {
      console.log('❌ Backend is NOT running or not accessible');
      console.log('   Make sure backend server is started: cd backend && npm start\n');
      process.exit(1);
    }

    // Test 2: Get doctor schedule
    console.log('Test 2: Fetching doctor schedule...');
    const scheduleData = await makeRequest(`/api/doctor/debug/schedule/${doctorId}`);
    
    if (!scheduleData.success) {
      console.log('❌ Failed to fetch doctor schedule');
      console.log('   Error:', scheduleData.error);
      console.log('   This doctor may not exist or is not approved\n');
      process.exit(1);
    }

    const doctor = scheduleData.doctor;
    console.log('✅ Doctor found:', doctor.name);
    console.log('   Specialization:', doctor.specialization);
    console.log('   Status:', doctor.status);
    console.log('');

    // Test 3: Check schedule array
    console.log('Test 3: Checking schedule configuration...');
    if (!doctor.schedule || doctor.schedule.length === 0) {
      console.log('❌ PROBLEM FOUND: Schedule array is empty!');
      console.log('   The doctor needs to set their schedule via "My Schedule" page');
      console.log('   Steps to fix:');
      console.log('   1. Login as this doctor');
      console.log('   2. Go to "My Schedule" from dashboard');
      console.log('   3. Toggle ON the days they want to work');
      console.log('   4. Set working hours (e.g., 09:00 - 17:00)');
      console.log('   5. Set lunch break (e.g., 13:00 - 14:00)');
      console.log('   6. Click "Save Schedule"\n');
      
      // Check fallback
      if (doctor.availableDays && doctor.availableDays.length > 0) {
        console.log('   Note: Old format availableDays exists:', doctor.availableDays);
        console.log('   But new schedule format is preferred\n');
      }
      
      process.exit(1);
    }

    console.log('✅ Schedule array exists with', doctor.schedule.length, 'days');
    console.log('');

    // Test 4: Check active days
    console.log('Test 4: Checking active working days...');
    const activeDays = doctor.schedule.filter(s => s.active);
    
    if (activeDays.length === 0) {
      console.log('❌ PROBLEM FOUND: No active days in schedule!');
      console.log('   All days are toggled OFF');
      console.log('   Doctor needs to toggle ON at least one day in "My Schedule"\n');
      process.exit(1);
    }

    console.log('✅ Active working days:', activeDays.length);
    activeDays.forEach(day => {
      console.log(`   - ${day.day}: ${day.start} - ${day.end}`);
    });
    console.log('');

    // Test 5: Check lunch break
    console.log('Test 5: Checking lunch break...');
    if (!doctor.lunchBreak || !doctor.lunchBreak.start || !doctor.lunchBreak.end) {
      console.log('⚠️  WARNING: Lunch break not configured');
      console.log('   This may affect token calculation');
      console.log('   Recommended: Set lunch break in "My Schedule"\n');
    } else {
      console.log('✅ Lunch break configured:', `${doctor.lunchBreak.start} - ${doctor.lunchBreak.end}\n`);
    }

    // Test 6: Calculate expected tokens
    console.log('Test 6: Calculating expected tokens...');
    const firstActiveDay = activeDays[0];
    const startTime = firstActiveDay.start.split(':');
    const endTime = firstActiveDay.end.split(':');
    const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
    const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
    const workMinutes = endMinutes - startMinutes;
    
    let lunchMinutes = 0;
    if (doctor.lunchBreak && doctor.lunchBreak.start && doctor.lunchBreak.end) {
      const lunchStart = doctor.lunchBreak.start.split(':');
      const lunchEnd = doctor.lunchBreak.end.split(':');
      const lunchStartMinutes = parseInt(lunchStart[0]) * 60 + parseInt(lunchStart[1]);
      const lunchEndMinutes = parseInt(lunchEnd[0]) * 60 + parseInt(lunchEnd[1]);
      lunchMinutes = lunchEndMinutes - lunchStartMinutes;
    }
    
    const effectiveMinutes = workMinutes - lunchMinutes;
    const expectedTokens = Math.floor(effectiveMinutes / 30);
    
    console.log('   Working hours:', `${firstActiveDay.start} - ${firstActiveDay.end}`, `(${workMinutes} minutes)`);
    console.log('   Lunch break:', lunchMinutes, 'minutes');
    console.log('   Effective time:', effectiveMinutes, 'minutes');
    console.log('✅ Expected tokens per day:', expectedTokens, '(30 min per patient)\n');

    // Test 7: Check next available date
    console.log('Test 7: Finding next available date...');
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const activeDayNames = activeDays.map(d => d.day);
    
    let nextDate = null;
    for (let i = 0; i < 14; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() + i);
      const dayName = dayNames[checkDate.getDay()];
      
      if (activeDayNames.includes(dayName)) {
        nextDate = {
          date: checkDate.toISOString().split('T')[0],
          dayName: dayName,
          daysFromNow: i
        };
        break;
      }
    }
    
    if (!nextDate) {
      console.log('❌ PROBLEM: No available dates found in next 14 days');
      console.log('   Active days:', activeDayNames.join(', '));
      console.log('   This should not happen - check schedule configuration\n');
      process.exit(1);
    }
    
    console.log('✅ Next available date:', nextDate.date, `(${nextDate.dayName})`);
    if (nextDate.daysFromNow === 0) {
      console.log('   This is TODAY\n');
    } else if (nextDate.daysFromNow === 1) {
      console.log('   This is TOMORROW\n');
    } else {
      console.log('   This is in', nextDate.daysFromNow, 'days\n');
    }

    // Test 8: Check token availability for next date
    console.log('Test 8: Checking token availability for next date...');
    try {
      const tokenData = await makeRequest(`/api/appointments/available-tokens/${doctor.id}/${nextDate.date}`);
      
      if (tokenData.success) {
        console.log('✅ Token API working correctly');
        console.log('   Available tokens:', tokenData.availableTokens, '/', tokenData.totalTokens);
        console.log('   Booked tokens:', tokenData.bookedTokens);
        console.log('   Working hours:', tokenData.workingHours);
        console.log('   Lunch break:', tokenData.lunchBreak);
        console.log('');
        
        if (tokenData.availableTokens === 0) {
          console.log('⚠️  WARNING: This date is fully booked!');
          console.log('   The system should show the next available date\n');
        }
      } else {
        console.log('❌ Token API returned error:', tokenData.error);
        console.log('');
      }
    } catch (error) {
      console.log('❌ Failed to fetch token data:', error.message);
      console.log('');
    }

    // Final summary
    console.log('===========================================');
    console.log('DIAGNOSTIC SUMMARY');
    console.log('===========================================\n');
    console.log('✅ Backend is running');
    console.log('✅ Doctor exists and is approved');
    console.log('✅ Schedule is configured with', activeDays.length, 'active days');
    console.log('✅ Expected', expectedTokens, 'tokens per day');
    console.log('✅ Next available date:', nextDate.date);
    console.log('');
    console.log('If dates still don\'t show in the booking interface:');
    console.log('1. Open browser console (F12) when booking');
    console.log('2. Look for detailed logs starting with "==="');
    console.log('3. Check if doctor object includes schedule array');
    console.log('4. Verify /available-tokens API is being called');
    console.log('');
    console.log('For more help, see TROUBLESHOOTING_NO_DATES.md\n');

  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('');
    console.log('Make sure:');
    console.log('1. Backend server is running (cd backend && npm start)');
    console.log('2. Server is accessible on http://localhost:5001');
    console.log('3. Doctor ID is correct\n');
    process.exit(1);
  }
}

// Get doctor ID from command line argument
const doctorId = process.argv[2];
testDoctorSchedule(doctorId);
