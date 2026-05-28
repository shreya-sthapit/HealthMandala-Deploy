/**
 * Backfill script:
 * 1. Fix existing prescriptions missing hospitalId
 * 2. Create prescription records for appointments that are 'prescribed' but have no prescription
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  require('../src/models/User');
  const Prescription = require('../src/models/Prescription');
  const Appointment  = require('../src/models/Appointment');

  // ── 1. Backfill hospitalId on existing prescriptions ──────────────────────
  const orphaned = await Prescription.find({ hospitalId: null }).lean();
  console.log(`\nPrescriptions missing hospitalId: ${orphaned.length}`);

  for (const rx of orphaned) {
    if (!rx.appointmentId) continue;
    const apt = await Appointment.findById(rx.appointmentId).lean();
    if (apt && apt.hospitalId) {
      await Prescription.findByIdAndUpdate(rx._id, {
        hospitalId:   apt.hospitalId,
        hospitalName: apt.hospital,
      });
      console.log(`  Backfilled: ${rx.patientName} -> ${apt.hospital}`);
    }
  }

  // ── 2. Create prescriptions for 'prescribed' appointments with no record ──
  const prescribedApts = await Appointment.find({
    status: 'prescribed',
    hospitalId: { $ne: null },
  }).lean();

  console.log(`\nPrescribed appointments: ${prescribedApts.length}`);

  for (const apt of prescribedApts) {
    const existing = await Prescription.findOne({ appointmentId: apt._id }).lean();
    if (existing) {
      console.log(`  Already has prescription: ${apt.patientName} (${apt._id})`);
      continue;
    }

    // patientId on the appointment is always a clean ObjectId
    const patientId = apt.patientId;
    const doctorId  = apt.doctorId;

    if (!patientId || !doctorId) {
      console.log(`  Skipping ${apt.patientName} — missing patientId or doctorId`);
      continue;
    }

    const rx = new Prescription({
      patientId,
      doctorId,
      appointmentId: apt._id,
      medicines:     [],          // doctor didn't fill form — empty placeholder
      diagnosis:     '',
      chiefComplaints: '',
      notes:         '',
      doctorName:    apt.doctorName,
      patientName:   apt.patientName,
      hospitalId:    apt.hospitalId,
      hospitalName:  apt.hospital,
      checkupDate:   apt.updatedAt || new Date(),
    });

    await rx.save();
    console.log(`  Created prescription for: ${apt.patientName} at ${apt.hospital} (token #${apt.tokenNumber})`);
  }

  // ── 3. Verify ──────────────────────────────────────────────────────────────
  const pharmacistHospitalId = prescribedApts[0]?.hospitalId;
  if (pharmacistHospitalId) {
    const visible = await Prescription.find({
      hospitalId: pharmacistHospitalId,
      status: 'pending',
    }).lean();
    console.log(`\nPharmacist will now see ${visible.length} pending prescription(s):`);
    visible.forEach(r => console.log(`  - Token #${r.tokenNumber || '?'} | ${r.patientName} | ${r.doctorName}`));
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });
