/**
 * Test Script: Hospital-Specific Appointment Filtering
 * 
 * This script tests that appointments are properly filtered by hospital
 * and only displayed in the respective hospital's dashboard.
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Appointment = require('./src/models/Appointment');
const HospitalPartner = require('./src/models/HospitalPartner');

async function testHospitalFiltering() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthmandala');
    console.log('✅ Connected to database\n');

    // Get all hospitals
    const hospitals = await HospitalPartner.find({}).select('hospitalName _id');
    console.log(`📋 Found ${hospitals.length} hospitals:\n`);
    hospitals.forEach((h, i) => {
      console.log(`   ${i + 1}. ${h.hospitalName} (ID: ${h._id})`);
    });
    console.log('');

    // Get all appointments
    const allAppointments = await Appointment.find({}).select('hospital hospitalId doctorName patientName appointmentDate');
    console.log(`📅 Total appointments in database: ${allAppointments.length}\n`);

    // Test filtering for each hospital
    for (const hospital of hospitals) {
      console.log(`\n🏥 Testing: ${hospital.hospitalName}`);
      console.log('─'.repeat(60));

      // Filter by hospitalId (new method)
      const byId = await Appointment.find({ hospitalId: hospital._id });
      console.log(`   By hospitalId: ${byId.length} appointments`);

      // Filter by hospital name (legacy method)
      const byName = await Appointment.find({ 
        hospital: new RegExp(`^${hospital.hospitalName}$`, 'i') 
      });
      console.log(`   By hospital name: ${byName.length} appointments`);

      // Combined filter (what dashboard uses)
      const combined = await Appointment.find({
        $or: [
          { hospitalId: hospital._id },
          { hospital: new RegExp(`^${hospital.hospitalName}$`, 'i') }
        ]
      });
      console.log(`   Combined (dashboard): ${combined.length} appointments`);

      // Show sample appointments
      if (combined.length > 0) {
        console.log(`\n   Sample appointments:`);
        combined.slice(0, 3).forEach((apt, i) => {
          console.log(`   ${i + 1}. ${apt.patientName} → ${apt.doctorName}`);
          console.log(`      Date: ${apt.appointmentDate.toLocaleDateString()}`);
          console.log(`      Hospital: ${apt.hospital || 'N/A'}`);
          console.log(`      HospitalId: ${apt.hospitalId || 'N/A'}`);
        });
      }
    }

    // Check for appointments without hospital info
    console.log('\n\n⚠️  Checking for appointments without hospital information:');
    console.log('─'.repeat(60));
    
    const noHospital = await Appointment.find({
      $and: [
        { $or: [{ hospital: { $exists: false } }, { hospital: '' }] },
        { $or: [{ hospitalId: { $exists: false } }, { hospitalId: null }] }
      ]
    });
    
    console.log(`   Found ${noHospital.length} appointments without hospital info`);
    if (noHospital.length > 0) {
      console.log(`   ⚠️  These appointments won't appear in any hospital dashboard!`);
      noHospital.slice(0, 5).forEach((apt, i) => {
        console.log(`   ${i + 1}. ${apt.patientName} → ${apt.doctorName} (${apt.appointmentDate.toLocaleDateString()})`);
      });
    }

    // Summary
    console.log('\n\n📊 Summary:');
    console.log('─'.repeat(60));
    console.log(`   Total Hospitals: ${hospitals.length}`);
    console.log(`   Total Appointments: ${allAppointments.length}`);
    console.log(`   Appointments with hospitalId: ${allAppointments.filter(a => a.hospitalId).length}`);
    console.log(`   Appointments with hospital name: ${allAppointments.filter(a => a.hospital).length}`);
    console.log(`   Appointments without hospital info: ${noHospital.length}`);

    // Test isolation
    console.log('\n\n🔒 Testing Hospital Isolation:');
    console.log('─'.repeat(60));
    
    if (hospitals.length >= 2) {
      const hospital1 = hospitals[0];
      const hospital2 = hospitals[1];
      
      const h1Appointments = await Appointment.find({
        $or: [
          { hospitalId: hospital1._id },
          { hospital: new RegExp(`^${hospital1.hospitalName}$`, 'i') }
        ]
      });
      
      const h2Appointments = await Appointment.find({
        $or: [
          { hospitalId: hospital2._id },
          { hospital: new RegExp(`^${hospital2.hospitalName}$`, 'i') }
        ]
      });
      
      // Check for overlap
      const h1Ids = new Set(h1Appointments.map(a => a._id.toString()));
      const h2Ids = new Set(h2Appointments.map(a => a._id.toString()));
      const overlap = [...h1Ids].filter(id => h2Ids.has(id));
      
      console.log(`   ${hospital1.hospitalName}: ${h1Appointments.length} appointments`);
      console.log(`   ${hospital2.hospitalName}: ${h2Appointments.length} appointments`);
      console.log(`   Overlap: ${overlap.length} appointments`);
      
      if (overlap.length === 0) {
        console.log(`   ✅ Perfect isolation - no appointments shared between hospitals`);
      } else {
        console.log(`   ⚠️  WARNING: ${overlap.length} appointments appear in both hospitals!`);
      }
    }

    console.log('\n✅ Test completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testHospitalFiltering();
