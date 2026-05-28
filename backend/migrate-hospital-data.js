/**
 * Migration Script: Backfill Hospital Information for Existing Appointments
 * 
 * This script updates existing appointments to include hospital information
 * by looking up the doctor's current hospital.
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Appointment = require('./src/models/Appointment');
const HospitalPartner = require('./src/models/HospitalPartner');
const DoctorRegistration = require('./src/models/DoctorRegistration');

async function migrateHospitalData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthmandala');
    console.log('✅ Connected to database\n');

    // Get all appointments without hospital info
    const appointments = await Appointment.find({
      $and: [
        { $or: [{ hospital: { $exists: false } }, { hospital: '' }] },
        { $or: [{ hospitalId: { $exists: false } }, { hospitalId: null }] }
      ]
    });

    console.log(`📋 Found ${appointments.length} appointments without hospital information\n`);

    if (appointments.length === 0) {
      console.log('✅ All appointments already have hospital information!');
      return;
    }

    let updated = 0;
    let skipped = 0;

    for (const apt of appointments) {
      console.log(`\nProcessing: ${apt.patientName} → ${apt.doctorName}`);
      
      // Try to find doctor by doctorId
      let doctor = null;
      if (apt.doctorId && mongoose.Types.ObjectId.isValid(apt.doctorId)) {
        doctor = await DoctorRegistration.findOne({ userId: apt.doctorId });
        if (!doctor) {
          doctor = await DoctorRegistration.findById(apt.doctorId);
        }
      }

      // If not found by ID, try by name
      if (!doctor && apt.doctorName) {
        const nameParts = apt.doctorName.replace(/^Dr\.\s*/i, '').trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        
        doctor = await DoctorRegistration.findOne({
          firstName: new RegExp(`^${firstName}$`, 'i'),
          lastName: new RegExp(`^${lastName}$`, 'i')
        });
      }

      if (!doctor) {
        console.log(`   ⚠️  Doctor not found - skipping`);
        skipped++;
        continue;
      }

      // Get hospital name from doctor
      let hospitalName = null;
      if (doctor.currentHospital && doctor.currentHospital.length > 0) {
        hospitalName = doctor.currentHospital[0];
      }

      if (!hospitalName) {
        console.log(`   ⚠️  Doctor has no hospital assigned - skipping`);
        skipped++;
        continue;
      }

      // Find hospital by name
      const hospital = await HospitalPartner.findOne({
        hospitalName: new RegExp(`^${hospitalName.trim()}$`, 'i')
      });

      if (!hospital) {
        console.log(`   ⚠️  Hospital "${hospitalName}" not found in database - skipping`);
        skipped++;
        continue;
      }

      // Update appointment
      apt.hospital = hospital.hospitalName;
      apt.hospitalId = hospital._id;
      
      // Ensure tokenNumber exists (set to 0 if missing for old appointments)
      if (!apt.tokenNumber && apt.tokenNumber !== 0) {
        apt.tokenNumber = 0;
      }
      
      await apt.save();

      console.log(`   ✅ Updated: ${hospital.hospitalName} (${hospital._id})`);
      updated++;
    }

    console.log('\n\n📊 Migration Summary:');
    console.log('─'.repeat(60));
    console.log(`   Total appointments processed: ${appointments.length}`);
    console.log(`   Successfully updated: ${updated}`);
    console.log(`   Skipped (no hospital found): ${skipped}`);
    console.log(`   Success rate: ${((updated / appointments.length) * 100).toFixed(1)}%`);

    if (updated > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('   Run test-hospital-filtering.js to verify the results.');
    } else {
      console.log('\n⚠️  No appointments were updated.');
      console.log('   This might be because:');
      console.log('   - Doctors are not assigned to any hospitals');
      console.log('   - Hospital names in doctor records don\'t match HospitalPartner collection');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
console.log('🚀 Starting Hospital Data Migration...\n');
migrateHospitalData();
