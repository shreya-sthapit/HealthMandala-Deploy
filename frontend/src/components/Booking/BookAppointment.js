import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Booking.css';
import '../Doctors/SelectDoctor.css';
import '../Doctors/DoctorProfileModal.css';

// Nepal address data
const NEPAL_DATA = {
  'Koshi Province': {
    'Taplejung': ['Phungling Municipality','Sidingba Rural Municipality','Sirijangha Rural Municipality'],
    'Sankhuwasabha': ['Chainpur Municipality','Dharmadevi Municipality','Panchkhapan Municipality'],
    'Bhojpur': ['Bhojpur Municipality','Shadananda Municipality','Tyamkemaiyung Rural Municipality'],
    'Dhankuta': ['Dhankuta Municipality','Pakhribas Municipality','Mahalaxmi Municipality'],
    'Morang': ['Biratnagar Metropolitan City','Urlabari Municipality','Pathari Shanischare Municipality'],
    'Sunsari': ['Dharan Sub-Metropolitan City','Itahari Sub-Metropolitan City','Inaruwa Municipality'],
    'Jhapa': ['Mechinagar Municipality','Bhadrapur Municipality','Birtamod Municipality','Damak Municipality'],
    'Ilam': ['Ilam Municipality','Deumai Municipality','Mai Municipality','Suryodaya Municipality'],
  },
  'Madhesh Province': {
    'Parsa': ['Birgunj Metropolitan City','Bahudarmai Municipality','Parsagadhi Municipality'],
    'Bara': ['Kalaiya Sub-Metropolitan City','Jitpur Simara Sub-Metropolitan City','Kolhabi Municipality'],
    'Rautahat': ['Gaur Municipality','Chandrapur Municipality','Garuda Municipality'],
    'Sarlahi': ['Malangwa Municipality','Haripur Municipality','Lalbandi Municipality'],
    'Dhanusha': ['Janakpurdham Sub-Metropolitan City','Chhireshwornath Municipality','Dhanusadham Municipality'],
    'Siraha': ['Lahan Municipality','Siraha Municipality','Golbazar Municipality'],
    'Saptari': ['Rajbiraj Municipality','Kanchanrup Municipality','Bodebarsain Municipality'],
  },
  'Bagmati Province': {
    'Kathmandu': ['Kathmandu Metropolitan City','Kirtipur Municipality','Shankharapur Municipality','Gokarneshwar Municipality','Kageshwari Manohara Municipality','Nagarjun Municipality','Tarakeshwar Municipality','Tokha Municipality','Budhanilkantha Municipality','Chandragiri Municipality','Dakshinkali Municipality'],
    'Lalitpur': ['Lalitpur Metropolitan City','Godawari Municipality','Mahalaxmi Municipality','Konjyosom Rural Municipality','Bagmati Rural Municipality'],
    'Bhaktapur': ['Bhaktapur Municipality','Madhyapur Thimi Municipality','Changunarayan Municipality','Suryabinayak Municipality'],
    'Kavrepalanchok': ['Banepa Municipality','Dhulikhel Municipality','Panauti Municipality','Panchkhal Municipality','Namobuddha Municipality'],
    'Sindhupalchok': ['Chautara Sangachokgadhi Municipality','Melamchi Municipality','Bahrabise Municipality'],
    'Makwanpur': ['Hetauda Sub-Metropolitan City','Thaha Municipality','Bakaiya Rural Municipality'],
    'Chitwan': ['Bharatpur Metropolitan City','Ratnanagar Municipality','Khairahani Municipality'],
  },
  'Gandaki Province': {
    'Kaski': ['Pokhara Metropolitan City','Annapurna Rural Municipality','Machhapuchchhre Rural Municipality'],
    'Syangja': ['Waling Municipality','Putalibazar Municipality','Galyang Municipality'],
    'Tanahu': ['Damauli Municipality','Bhimad Municipality','Byas Municipality'],
    'Gorkha': ['Gorkha Municipality','Palungtar Municipality','Arughat Rural Municipality'],
    'Lamjung': ['Besisahar Municipality','Sundarbazar Municipality','Dordi Rural Municipality'],
  },
  'Lumbini Province': {
    'Rupandehi': ['Butwal Sub-Metropolitan City','Siddharthanagar Municipality','Tilottama Municipality','Devdaha Municipality'],
    'Kapilvastu': ['Kapilvastu Municipality','Banganga Municipality','Buddhabhumi Municipality'],
    'Palpa': ['Tansen Municipality','Rampur Municipality','Ridi Municipality'],
    'Nawalparasi (East)': ['Kawasoti Municipality','Devchuli Municipality','Gaindakot Municipality'],
    'Dang': ['Tulsipur Sub-Metropolitan City','Ghorahi Sub-Metropolitan City','Lamahi Municipality'],
    'Banke': ['Nepalgunj Sub-Metropolitan City','Kohalpur Municipality','Duduwa Rural Municipality'],
  },
  'Karnali Province': {
    'Surkhet': ['Birendranagar Municipality','Bheriganga Municipality','Gurbhakot Municipality'],
    'Dailekh': ['Narayan Municipality','Dullu Municipality','Aathabis Municipality'],
    'Jumla': ['Chandannath Municipality','Guthichaur Rural Municipality','Hima Rural Municipality'],
    'Salyan': ['Sharada Municipality','Bangad Kupinde Municipality','Bagchaur Municipality'],
    'Dolpa': ['Thuli Bheri Municipality','Tripurasundari Municipality'],
  },
  'Sudurpashchim Province': {
    'Kailali': ['Dhangadhi Sub-Metropolitan City','Tikapur Municipality','Bhajani Municipality','Ghodaghodi Municipality'],
    'Kanchanpur': ['Mahendranagar Municipality','Bedkot Municipality','Belauri Municipality','Bhimdatta Municipality'],
    'Dadeldhura': ['Amargadhi Municipality','Parashuram Municipality'],
    'Baitadi': ['Dasharathchand Municipality','Patan Municipality','Melauli Municipality'],
    'Doti': ['Dipayal Silgadhi Municipality','Shikhar Municipality'],
  },
};

const PROVINCES = Object.keys(NEPAL_DATA);

// Department icon mapping - same as hospital dashboard
const DEPT_ICONS = {
  'Cardiologist (Heart Specialist)': '🫀',
  'Dermatologist (Skin & Hair Specialist)': '🧴',
  'Endocrinologist (Diabetes & Hormone Specialist)': '🩸',
  'Gastroenterologist (Stomach & Liver Specialist)': '�',
  'General Physician (Internal Medicine & Fever)': '�',
  'General Practitioner (Family Doctor)': '👨‍⚕️',
  'General Surgeon (General Operations)': '�',
  "Gynecologist & Obstetrician (Women's Health & Pregnancy)": '🌸',
  'Nephrologist (Kidney Specialist)': '�',
  'Neurologist (Brain & Nerve Specialist)': '🧠',
  'Neurosurgeon (Brain & Spine Surgeon)': '🧬',
  'Oncologist (Cancer Specialist)': '🎗️',
  'Ophthalmologist (Eye Specialist)': '👁️',
  'Orthopedic Surgeon (Bone & Joint Specialist)': '🦴',
  'Otolaryngologist (ENT - Ear, Nose & Throat Specialist)': '👂',
  'Pediatrician (Child & Newborn Specialist)': '👶',
  'Physiotherapist (Physical Rehab Specialist)': '🏃',
  'Psychiatrist (Mental Health & Counseling Specialist)': '�',
  'Pulmonologist (Chest & Lung Specialist)': '🫁',
  'Radiologist (X-Ray & Ultrasound Specialist)': '🔬',
  'Rheumatologist (Arthritis & Joint Pain Specialist)': '�',
  'Urologist (Urinary & Kidney Stone Specialist)': '💧',
  'Dental Surgeon (Teeth & Oral Specialist)': '🦷',
  'Ayurveda Physician (Traditional Medicine Specialist)': '🌿',
};

const getDepartmentIcon = (departmentName) => {
  return DEPT_ICONS[departmentName] || '🏥';
};

const BookAppointment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedDoctor = location.state?.preSelectedDoctor;
  const preSelectedDate = location.state?.preSelectedDate;
  const preSelectedTime = location.state?.preSelectedTime;
  const hospitalFilter = location.state?.hospitalFilter || null; // from hospital page
  const specialtyFilter = location.state?.specialtyFilter || null; // from specialty card
  
  const [step, setStep] = useState(() => {
    // Always start at step 1 when coming from hospital page
    if (hospitalFilter) return 1;
    // Start at step 2 only if there's a preselected doctor (from other flows)
    return preSelectedDoctor ? 2 : 1;
  });
  const [searchMode, setSearchMode] = useState(hospitalFilter ? 'browse' : 'specialty');
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientStatus] = useState('approved'); // approval gate removed
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  // Track booked slots for doctor card inline display: key = `${doctorId}_${dateStr}`, value = Set of booked time strings
  const [bookedSlotsMap, setBookedSlotsMap] = useState({});
  const [selectedDependent, setSelectedDependent] = useState(null);
  const [dependentSearch, setDependentSearch] = useState('');
  const [patientInfo, setPatientInfo] = useState(null);
  const [dependents, setDependents] = useState([]);
  const [selectedDepartmentDoctorIds, setSelectedDepartmentDoctorIds] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [showAddDependentModal, setShowAddDependentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState(null);
  const [patientDetailsExpanded, setPatientDetailsExpanded] = useState(false);
  const [newDependent, setNewDependent] = useState({
    firstName: '',
    lastName: '',
    age: '',
    dobAD: '',
    dobBS: '',
    phone: '',
    email: '',
    gender: '',
    relationship: '',
    province: '',
    district: '',
    palika: '',
    address: ''
  });
  const [booking, setBooking] = useState({
    specialty: preSelectedDoctor?.specialtyId || specialtyFilter || '',
    doctor: preSelectedDoctor || null,
    selectedDepartment: null,
    date: null,
    tokenNumber: null,
    availableTokens: 0,
    totalTokens: 0,
    workingHours: '',
    reason: '',
    paymentMethod: 'esewa',
    appointmentTime: null
  });

  const specialties = [
    { id: 'cardiology', name: 'Cardiology' },
    { id: 'neurology', name: 'Neurology' },
    { id: 'orthopedics', name: 'Orthopedics' },
    { id: 'dermatology', name: 'Dermatology' },
    { id: 'pediatrics', name: 'Pediatrics' },
    { id: 'ophthalmology', name: 'Ophthalmology' },
    { id: 'dental', name: 'Dental' },
    { id: 'general', name: 'General' }
  ];

  // Mock data as fallback
  const mockDoctors = [
    { id: 1, name: 'Dr. Anita Sharma', specialty: 'Cardiologist', specialtyId: 'cardiology', rating: 4.9, patients: '1.2k', experience: '15 yrs', fee: 1500, available: true },
    { id: 2, name: 'Dr. Rajesh Patel', specialty: 'Cardiologist', specialtyId: 'cardiology', rating: 4.8, patients: '980', experience: '12 yrs', fee: 1200, available: true },
    { id: 3, name: 'Dr. Priya Thapa', specialty: 'Pediatrician', specialtyId: 'pediatrics', rating: 4.9, patients: '1.5k', experience: '10 yrs', fee: 1000, available: true },
    { id: 4, name: 'Dr. Suman Gurung', specialty: 'Orthopedic', specialtyId: 'orthopedics', rating: 4.7, patients: '850', experience: '8 yrs', fee: 1100, available: true },
    { id: 5, name: 'Dr. Maya Shrestha', specialty: 'Dermatologist', specialtyId: 'dermatology', rating: 4.8, patients: '1.1k', experience: '11 yrs', fee: 1300, available: true },
    { id: 6, name: 'Dr. Bikash Adhikari', specialty: 'Neurologist', specialtyId: 'neurology', rating: 4.6, patients: '720', experience: '7 yrs', fee: 900, available: true },
    { id: 7, name: 'Dr. Gita Devi', specialty: 'Ophthalmologist', specialtyId: 'ophthalmology', rating: 4.7, patients: '890', experience: '9 yrs', fee: 1000, available: true },
    { id: 8, name: 'Dr. Hari Prasad', specialty: 'Dentist', specialtyId: 'dental', rating: 4.8, patients: '1.3k', experience: '14 yrs', fee: 800, available: true },
    { id: 9, name: 'Dr. Ram Sharma', specialty: 'General Physician', specialtyId: 'general', rating: 4.5, patients: '2k', experience: '20 yrs', fee: 600, available: true }
  ];

  // Fetch departments when hospital filter is present
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!hospitalFilter) return;
      
      setLoadingDepartments(true);
      try {
        const response = await fetch(`http://localhost:5001/api/hospital-dashboard/departments/public/${encodeURIComponent(hospitalFilter)}`);
        const data = await response.json();
        
        if (data.success) {
          setDepartments(data.departments || []);
        } else {
          console.error('Failed to fetch departments:', data.error);
          setDepartments([]);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [hospitalFilter]);

  // Fetch approved doctors from API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/doctor/approved');
        const data = await response.json();
        
        if (data.success && data.doctors && data.doctors.length > 0) {
          console.log('=== FETCHED DOCTORS FROM API ===');
          console.log('Total doctors:', data.doctors.length);
          console.log('First doctor sample:', {
            name: data.doctors[0].name,
            nmcNumber: data.doctors[0].nmcNumber,
            qualification: data.doctors[0].qualification,
            hospital: data.doctors[0].hospital,
            currentHospital: data.doctors[0].currentHospital,
            hasHospitalSchedules: 'hospitalSchedules' in data.doctors[0],
            hospitalSchedulesCount: data.doctors[0].hospitalSchedules?.length || 0,
            hasSchedule: 'schedule' in data.doctors[0],
            scheduleLength: data.doctors[0].schedule?.length || 0,
            availableDays: data.doctors[0].availableDays,
            allFields: Object.keys(data.doctors[0])
          });
          
          // Find Aayush for debugging
          const aayush = data.doctors.find(d => d.name.includes('Aayush'));
          if (aayush) {
            console.log('=== AAYUSH MAHARJAN DATA ===');
            console.log('Full object:', aayush);
            console.log('hospitalSchedules:', aayush.hospitalSchedules);
          }
          
          setDoctors(data.doctors);
        } else {
          console.log('No approved doctors found, using mock data');
          setDoctors(mockDoctors);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        console.log('Using mock data due to error');
        setDoctors(mockDoctors);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Enrich preSelectedDoctor with missing fields from API
  useEffect(() => {
    if (preSelectedDoctor && doctors.length > 0) {
      const fullDoctorData = doctors.find(d => d.id === preSelectedDoctor.id);
      if (fullDoctorData && (!preSelectedDoctor.nmcNumber || !preSelectedDoctor.qualification)) {
        console.log('Enriching preSelectedDoctor with API data');
        setBooking(prev => ({
          ...prev,
          doctor: {
            ...prev.doctor,
            nmcNumber: fullDoctorData.nmcNumber,
            qualification: fullDoctorData.qualification
          }
        }));
      }
    }
  }, [doctors, preSelectedDoctor]);

  // Fetch available slots when doctor and date are selected
  // Using a timestamp key to force re-fetch on mount (ensures fresh data after a booking)
  const [slotFetchKey, setSlotFetchKey] = useState(0);

  // Force a slot re-fetch on mount so that slots booked in a previous session
  // are immediately reflected as unavailable.
  useEffect(() => {
    setSlotFetchKey(k => k + 1);
    // Also clear the doctor card booked slots cache so inline slots are fresh
    setBookedSlotsMap({});
  }, []); // run once on mount

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!booking.doctor || !booking.date) {
        console.log('Slots fetch skipped - missing doctor or date:', { 
          hasDoctor: !!booking.doctor, 
          hasDate: !!booking.date 
        });
        setAvailableSlots([]);
        setSelectedSlot(null);
        return;
      }

      setLoadingSlots(true);
      try {
        const hospitalName = (Array.isArray(booking.doctor.hospital) 
          ? booking.doctor.hospital[0] 
          : booking.doctor.hospital) || 
          (Array.isArray(booking.doctor.currentHospital) 
            ? booking.doctor.currentHospital[0] 
            : booking.doctor.currentHospital) || '';
        const formattedDate = booking.date.full; // Already in YYYY-MM-DD format
        const doctorId = booking.doctor._id || booking.doctor.id; // Support both _id and id
        
        console.log('=== FETCHING SLOTS ===');
        console.log('Fetching slots with params:', {
          doctorId,
          date: formattedDate,
          hospitalName,
          doctorSchedule: booking.doctor.schedule,
          doctorHospitalSchedules: booking.doctor.hospitalSchedules
        });
        
        const url = `http://localhost:5001/api/doctor/slots/${doctorId}?date=${formattedDate}&hospitalName=${encodeURIComponent(hospitalName)}`;
        console.log('Slots API URL:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Slots API response:', data);
        console.log('Slots array:', data.slots);
        console.log('First slot in response:', data.slots?.[0]);
        
        if (data.success) {
          console.log('Setting available slots:', data.slots);
          setAvailableSlots(data.slots || []);
        } else {
          console.error('Failed to fetch slots:', data.error);
          setAvailableSlots([]);
        }
      } catch (error) {
        console.error('Error fetching slots:', error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [booking.doctor, booking.date, slotFetchKey]);

  // Debug: Log doctor object when step 2 is reached
  useEffect(() => {
    if (step === 2 && booking.doctor) {
      console.log('=== STEP 2 DOCTOR OBJECT ===');
      console.log('Doctor Name:', booking.doctor.name);
      console.log('NMC Number:', booking.doctor.nmcNumber);
      console.log('Qualification:', booking.doctor.qualification);
      console.log('Hospital:', booking.doctor.hospital);
      console.log('Current Hospital:', booking.doctor.currentHospital);
      console.log('Hospital Schedules:', booking.doctor.hospitalSchedules);
      console.log('Schedule:', booking.doctor.schedule);
      console.log('Available Days:', booking.doctor.availableDays);
      console.log('Full doctor object:', booking.doctor);
    }
  }, [step, booking.doctor]);

  // Fetch patient information when reaching step 4
  useEffect(() => {
    const fetchPatientInfo = async () => {
      if (step !== 4) return;

      // Auto-select self immediately
      setSelectedDependent('self');

      try {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = userData.id;
        
        if (!userId) {
          console.error('No user ID found');
          return;
        }

        const response = await fetch(`http://localhost:5001/api/patient/profile/${userId}`);
        const data = await response.json();
        
        console.log('Patient profile response:', data);
        
        // The API returns 'profile' not 'patient'
        if (data.success && data.profile) {
          setPatientInfo(data.profile);
          // Set dependents from the profile
          setDependents(data.profile.dependents || []);
        } else {
          console.log('No patient profile found or not approved yet');
        }
      } catch (error) {
        console.error('Error fetching patient info:', error);
      }
    };

    fetchPatientInfo();
  }, [step]);

  // Restore pending booking after login
  useEffect(() => {
    const token = localStorage.getItem('token');
    const pendingBookingStr = sessionStorage.getItem('pendingBooking');
    
    if (token && pendingBookingStr) {
      try {
        const pendingBooking = JSON.parse(pendingBookingStr);
        console.log('=== RESTORING PENDING BOOKING ===');
        console.log('Pending booking:', pendingBooking);
        
        // Restore the booking state
        setBooking(prev => ({
          ...prev,
          doctor: pendingBooking.doctor,
          date: pendingBooking.date,
          appointmentTime: pendingBooking.slot,
          tokenNumber: pendingBooking.tokenNumber
        }));
        
        setSelectedSlot(pendingBooking.slot);
        setStep(2); // Go to step 2
        
        // Clear the pending booking
        sessionStorage.removeItem('pendingBooking');
      } catch (error) {
        console.error('Error restoring pending booking:', error);
        sessionStorage.removeItem('pendingBooking');
      }
    }
  }, []); // Run once on mount

  // Handle preselected date and time from SelectDoctor page
  useEffect(() => {
    const handlePreselectedSlot = async () => {
      if (preSelectedDate && preSelectedTime && preSelectedDoctor) {
        console.log('=== PRESELECTED DATE/TIME DETECTED ===');
        console.log('Date:', preSelectedDate);
        console.log('Time:', preSelectedTime);
        
        // Parse the date string (YYYY-MM-DD format)
        const dateObj = new Date(preSelectedDate);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const formattedDate = {
          day: shortDayNames[dateObj.getDay()],
          date: dateObj.getDate(),
          month: monthNames[dateObj.getMonth()],
          full: preSelectedDate,
          dayName: dayNames[dateObj.getDay()]
        };
        
        // Calculate token number by generating the same slots as SelectDoctor
        let tokenNumber = 1; // Default
        
        try {
          // Generate slots using the same logic as SelectDoctor
          const dayName = dayNames[dateObj.getDay()];
          let start = preSelectedDoctor.availableTimeStart || '09:00';
          let end = preSelectedDoctor.availableTimeEnd || '17:00';
          let breakStart = null;
          let breakEnd = null;
          let hasBreak = false;
          
          // Get schedule for this specific day - check hospitalSchedules first
          let daySchedule = null;
          if (preSelectedDoctor.hospitalSchedules && preSelectedDoctor.hospitalSchedules.length > 0) {
            const hospitalSchedule = preSelectedDoctor.hospitalSchedules[0];
            if (hospitalSchedule.schedule) {
              daySchedule = hospitalSchedule.schedule.find(s => s.day === dayName && s.active);
            }
          }
          // Fallback to flat schedule
          if (!daySchedule && preSelectedDoctor.schedule) {
            daySchedule = preSelectedDoctor.schedule.find(s => s.day === dayName && s.active);
          }
          
          if (daySchedule) {
            start = daySchedule.start;
            end = daySchedule.end;
            // Check if this day has a break
            if (daySchedule.hasBreak && daySchedule.breakStart && daySchedule.breakEnd) {
              hasBreak = true;
              breakStart = daySchedule.breakStart;
              breakEnd = daySchedule.breakEnd;
            }
          }
          
          // Generate all slots for the day (same logic as SelectDoctor)
          const slots = [];
          const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
          const toStr = m => { const h = Math.floor(m/60); const mn = m%60; return `${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}`; };
          
          const startMin = toMin(start);
          const endMin = toMin(end);
          const breakStartMin = hasBreak ? toMin(breakStart) : null;
          const breakEndMin = hasBreak ? toMin(breakEnd) : null;
          const interval = preSelectedDoctor.consultationDuration || 10;
          
          for (let m = startMin; m < endMin; m += interval) {
            if (hasBreak && m >= breakStartMin && m < breakEndMin) {
              continue;
            }
            slots.push(toStr(m));
          }
          
          console.log('=== GENERATED SLOTS (CLIENT-SIDE) ===');
          console.log('All slots for the day:', slots);
          console.log('Looking for slot:', preSelectedTime);
          
          // Find the index of the selected time slot
          const slotIndex = slots.findIndex(slot => slot === preSelectedTime);
          tokenNumber = slotIndex !== -1 ? slotIndex + 1 : 1;
          
          console.log('Found slot at index:', slotIndex);
          console.log('Calculated token number:', tokenNumber);
          
          if (slotIndex === -1) {
            console.warn('⚠️ WARNING: Slot not found in generated slots! Using default token 1');
          }
        } catch (error) {
          console.error('Error calculating token number:', error);
        }
        
        // Set the booking state with date, time, and correct token number
        setBooking(prev => ({
          ...prev,
          date: formattedDate,
          appointmentTime: preSelectedTime,
          tokenNumber: tokenNumber
        }));
        
        setSelectedSlot(preSelectedTime);
        
        // Navigate directly to Step 4
        setStep(4);
        
        console.log('Navigated to Step 4 with preselected data and token:', tokenNumber);
      }
    };
    
    handlePreselectedSlot();
  }, [preSelectedDate, preSelectedTime, preSelectedDoctor]);


  const getFilteredDoctors = () => {
    let filtered = doctors;

    // Hospital flow — filter to doctors belonging to the selected department
    if (hospitalFilter) {
      if (selectedDepartmentDoctorIds.length > 0) {
        filtered = filtered.filter(doc =>
          selectedDepartmentDoctorIds.includes(String(doc.id || doc._id))
        );
      } else {
        // No department selected yet — show nothing
        filtered = [];
      }
      if (searchTerm) {
        filtered = filtered.filter(doc =>
          doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.specialty.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return filtered;
    }

    if (searchMode === 'browse') {
      return filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Specialty mode — match by specialtyId or by specialty name
    return filtered.filter(doc => {
      if (doc.specialtyId === booking.specialty) return true;
      // Also match by specialty name for doctors registered via new signup
      if (booking.specialty && doc.specialty) {
        return doc.specialty.toLowerCase().includes(booking.specialty.toLowerCase()) ||
               booking.specialty.toLowerCase().includes(doc.specialty.toLowerCase());
      }
      return false;
    });
  };

  // Helper functions for doctor schedule display (matching SelectDoctor)
  const getAvailableDays = (doc) => {
    if (doc.hospitalSchedules && doc.hospitalSchedules.length > 0) {
      const hospitalSchedule = doc.hospitalSchedules[0];
      if (hospitalSchedule.schedule && hospitalSchedule.schedule.length > 0) {
        return hospitalSchedule.schedule.filter(s => s.active).map(s => s.day);
      }
    }
    if (doc.schedule && doc.schedule.length > 0) {
      return doc.schedule.filter(s => s.active).map(s => s.day);
    }
    return doc.availableDays || [];
  };

  const getNextDates = (doc) => {
    const days = getAvailableDays(doc);
    if (!days.length) return [];
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const results = [];
    for (let i = 0; i < 14 && results.length < 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      if (days.includes(dayNames[d.getDay()])) {
        results.push(d);
      }
    }
    return results;
  };

  const getNextAvailableTime = (doc) => {
    const dates = getNextDates(doc);
    if (dates.length === 0) return null;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const todayStr = new Date().toISOString().split('T')[0];
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const docId = doc.id || doc._id;

    for (const date of dates) {
      const slots = getTimeSlots(doc, date);
      if (slots.length === 0) continue;

      const dateIso = date.toISOString().split('T')[0];
      const isToday = dateIso === todayStr;
      const cacheKey = `${docId}_${dateIso}`;
      const bookedSet = bookedSlotsMap[cacheKey]; // may be undefined if not yet fetched

      for (const slot of slots) {
        // Skip past slots when today is selected
        if (isToday) {
          const [h, m] = slot.split(':').map(Number);
          if (h * 60 + m <= nowMinutes) continue;
        }
        // Skip booked slots (only when cache is available)
        if (bookedSet && bookedSet.has(slot)) continue;

        const month = monthNames[date.getMonth()];
        const day = date.getDate();
        const [hours, minutes] = slot.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
        const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        return `${month} ${day} at ${timeStr}`;
      }
    }

    return null;
  };

  const getTimeSlots = (doc, date) => {
    const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()];
    let start = doc.availableTimeStart || '09:00';
    let end = doc.availableTimeEnd || '17:00';
    let breakStart = null;
    let breakEnd = null;
    let hasBreak = false;
    
    let daySchedule = null;
    if (doc.hospitalSchedules && doc.hospitalSchedules.length > 0) {
      const hospitalSchedule = doc.hospitalSchedules[0];
      if (hospitalSchedule.schedule) {
        daySchedule = hospitalSchedule.schedule.find(s => s.day === dayName && s.active);
      }
    }
    if (!daySchedule && doc.schedule) {
      daySchedule = doc.schedule.find(s => s.day === dayName && s.active);
    }
    
    if (daySchedule) {
      start = daySchedule.start;
      end = daySchedule.end;
      if (daySchedule.hasBreak && daySchedule.breakStart && daySchedule.breakEnd) {
        hasBreak = true;
        breakStart = daySchedule.breakStart;
        breakEnd = daySchedule.breakEnd;
      }
    }
    
    const slots = [];
    const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
    const toStr = m => { const h = Math.floor(m/60); const mn = m%60; return `${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}`; };
    
    const startMin = toMin(start);
    const endMin = toMin(end);
    const breakStartMin = hasBreak ? toMin(breakStart) : null;
    const breakEndMin = hasBreak ? toMin(breakEnd) : null;
    const interval = doc.consultationDuration || 10;
    
    for (let m = startMin; m < endMin; m += interval) {
      if (hasBreak && m >= breakStartMin && m < breakEndMin) {
        continue;
      }
      slots.push(toStr(m));
    }
    
    return slots;
  };

  // Fetch booked slots for a doctor card's inline slot display.
  // Cache is keyed by doctorId+date; cleared on mount so navigating back always gets fresh data.
  const fetchCardBookedSlots = async (doctorId, dateStr, hospitalName) => {
    const key = `${doctorId}_${dateStr}`;
    if (bookedSlotsMap[key] !== undefined) return; // already fetched this session
    try {
      const res = await fetch(
        `http://localhost:5001/api/doctor/slots/${doctorId}?date=${dateStr}&hospitalName=${encodeURIComponent(hospitalName || '')}`
      );
      const data = await res.json();
      if (data.success && data.slots) {
        const booked = new Set(
          data.slots.filter(s => s.isBooked).map(s => s.time)
        );
        setBookedSlotsMap(prev => ({ ...prev, [key]: booked }));
      }
    } catch (e) {
      // silent fail
    }
  };

  const isCardSlotBooked = (doctorId, dateStr, slotTime) => {
    const key = `${doctorId}_${dateStr}`;
    return bookedSlotsMap[key]?.has(slotTime) ?? false;
  };

  const handleBookSlot = (doc, date, time) => {
    const photoPath = doc.profilePhoto
      ? doc.profilePhoto.replace(/\\/g, '/').replace(/^backend\//, '')
      : null;
    
    setBooking(prev => ({
      ...prev,
      doctor: {
        id: doc.id, 
        _id: doc.id,
        name: doc.name, 
        specialty: doc.specialty,
        specialtyId: doc.specialtyId, 
        rating: doc.rating,
        patients: doc.patients, 
        experience: doc.experience,
        fee: doc.fee, 
        hospital: doc.hospital, 
        currentHospital: doc.currentHospital || doc.hospital,
        profilePhoto: photoPath,
        schedule: doc.schedule, 
        hospitalSchedules: doc.hospitalSchedules,
        lunchBreak: doc.lunchBreak,
        leaves: doc.leaves, 
        availableDays: doc.availableDays,
        availableTimeStart: doc.availableTimeStart,
        availableTimeEnd: doc.availableTimeEnd,
        consultationDuration: doc.consultationDuration,
        nmcNumber: doc.nmcNumber,
        qualification: doc.qualification,
      },
      date: {
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        date: date.getDate(),
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()],
        full: date.toISOString().split('T')[0],
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]
      },
      appointmentTime: time
    }));
    
    setSelectedSlot(time);
    setStep(4);
  };

  const getAvailableDates = async () => {
    console.log('=== GET AVAILABLE DATES FUNCTION ===');
    
    if (!booking.doctor) {
      console.log('✗ No doctor selected');
      return [];
    }

    console.log('✓ Doctor selected:', booking.doctor.name);
    console.log('Doctor object:', JSON.stringify(booking.doctor, null, 2));

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Get doctor's available days from schedule array (new format) or availableDays (old format)
    let doctorAvailableDays = [];
    
    console.log('Checking schedule format...');
    console.log('  - schedule:', booking.doctor.schedule);
    console.log('  - availableDays:', booking.doctor.availableDays);
    
    if (booking.doctor.schedule && booking.doctor.schedule.length > 0) {
      // New format: use schedule array
      doctorAvailableDays = booking.doctor.schedule
        .filter(s => s.active)
        .map(s => s.day);
      console.log('✓ Using schedule array:', doctorAvailableDays);
    } else if (booking.doctor.availableDays && booking.doctor.availableDays.length > 0) {
      // Old format: use availableDays array
      doctorAvailableDays = booking.doctor.availableDays;
      console.log('✓ Using availableDays array:', doctorAvailableDays);
    }
    
    if (doctorAvailableDays.length === 0) {
      console.log('✗ ERROR: No available days found for doctor!');
      console.log('Doctor needs to set their schedule in "My Schedule" page');
      console.log('Full doctor object:', booking.doctor);
      return [];
    }
    
    console.log('✓ Doctor available days:', doctorAvailableDays);
    
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('Today:', today.toDateString());
    console.log('Doctor available days:', doctorAvailableDays);
    
    // Look ahead for the next 60 days to find available dates
    for (let i = 0; i < 60; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      const dayName = dayNames[date.getDay()];
      
      console.log(`Checking day ${i}: ${date.toDateString()} (${dayName})`);
      
      // Check if this day is in doctor's available days
      if (doctorAvailableDays.includes(dayName)) {
        const dateObj = {
          day: shortDayNames[date.getDay()],
          date: date.getDate(),
          month: monthNames[date.getMonth()],
          full: `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`,
          dayName: dayName
        };
        
        console.log('Found matching day:', dateObj);
        dates.push(dateObj);
        
        // Limit to next 10 potential dates for checking
        if (dates.length >= 10) {
          break;
        }
      }
    }
    
    console.log('Generated potential dates:', dates.length, dates);
    
    if (dates.length === 0) {
      console.log('No dates generated - check doctor schedule configuration');
      return [];
    }
    
    // Now filter dates based on token availability
    // Only show dates progressively - next date only shows when current is fully booked
    const availableDates = [];
    
    for (const dateObj of dates) {
      try {
        console.log('Fetching tokens for:', dateObj.full);
        const response = await fetch(
          `http://localhost:5001/api/appointments/available-tokens/${booking.doctor.id}/${dateObj.full}`
        );
        const data = await response.json();
        
        console.log('Token response for', dateObj.full, ':', data);
        
        if (data.success) {
          // Add token info to date object
          dateObj.availableTokens = data.availableTokens;
          dateObj.totalTokens = data.totalTokens;
          dateObj.workingHours = data.workingHours;
          
          // If this is the first date OR previous date is fully booked, add it
          if (availableDates.length === 0) {
            // Always show the first available date (even if 0 tokens - user needs to see the issue)
            console.log('Adding first date:', dateObj);
            availableDates.push(dateObj);
          } else {
            // Only show next date if previous date has 0 tokens available
            const previousDate = availableDates[availableDates.length - 1];
            console.log('Previous date tokens:', previousDate.availableTokens);
            if (previousDate.availableTokens === 0) {
              console.log('Previous date full, adding next date:', dateObj);
              availableDates.push(dateObj);
            } else {
              console.log('Previous date still has tokens, not showing this date yet');
            }
          }
          
          // Stop after finding 2 dates (current + next if current is full)
          if (availableDates.length >= 2) {
            break;
          }
        } else {
          console.log('Token fetch failed for', dateObj.full, ':', data);
        }
      } catch (error) {
        console.error('Error fetching tokens for date:', dateObj.full, error);
      }
    }
    
    console.log('Final available dates to show:', availableDates);
    return availableDates;
  };

  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);

  // Pure function — takes doctor explicitly, no closure dependency on booking state
  const fetchAvailableDatesForDoctor = async (doctor) => {
    if (!doctor) return [];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Resolve active days from schedule (new) or availableDays (old)
    let activeDays = [];
    if (doctor.schedule && doctor.schedule.length > 0) {
      activeDays = doctor.schedule.filter(s => s.active).map(s => s.day);
    } else if (doctor.availableDays && doctor.availableDays.length > 0) {
      activeDays = doctor.availableDays;
    }

    if (activeDays.length === 0) return [];

    // Collect next 10 matching dates within 60 days
    const candidates = [];
    for (let i = 0; i < 60; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      const dayName = dayNames[d.getDay()];
      if (activeDays.includes(dayName)) {
        candidates.push({
          day: shortDayNames[d.getDay()],
          date: d.getDate(),
          month: monthNames[d.getMonth()],
          full: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
          dayName
        });
        if (candidates.length >= 10) break;
      }
    }

    if (candidates.length === 0) return [];

    // Progressive filter: show first date; show next only when previous is fully booked
    const result = [];
    for (const dateObj of candidates) {
      try {
        const res = await fetch(
          `http://localhost:5001/api/appointments/available-tokens/${doctor.id}/${dateObj.full}`
        );
        const data = await res.json();
        if (!data.success) continue;

        dateObj.availableTokens = data.availableTokens;
        dateObj.totalTokens = data.totalTokens;
        dateObj.workingHours = data.workingHours;

        if (result.length === 0) {
          result.push(dateObj); // always show the first upcoming date
        } else if (result[result.length - 1].availableTokens === 0) {
          result.push(dateObj); // show next only when previous is full
        } else {
          break; // previous still has tokens — stop here
        }

        if (result.length >= 2) break;
      } catch (e) {
        console.error('Token fetch error for', dateObj.full, e);
      }
    }

    return result;
  };

  // Reload dates whenever doctor changes or we arrive at step 2
  useEffect(() => {
    if (!booking.doctor || step !== 2) return;
    const doctor = booking.doctor; // capture current value
    setLoadingDates(true);
    fetchAvailableDatesForDoctor(doctor)
      .then(dates => setAvailableDates(dates))
      .catch(() => setAvailableDates([]))
      .finally(() => setLoadingDates(false));
  }, [booking.doctor?.id, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateSelect = async (dateObj) => {
    console.log('=== DATE SELECTED ===');
    console.log('Selected date object:', dateObj);
    
    setBooking(prev => ({ 
      ...prev, 
      date: dateObj, 
      tokenNumber: null,
      appointmentTime: null,
      availableTokens: dateObj.availableTokens,
      totalTokens: dateObj.totalTokens
    }));
    
    // Reset selected slot when date changes
    setSelectedSlot(null);
    
    if (booking.doctor && (booking.doctor.id || booking.doctor._id)) {
      const doctorId = booking.doctor._id || booking.doctor.id;
      await fetchAvailableTokens(doctorId, dateObj.full);
    }
  };

  // Refresh dates after booking to show next date if current is full
  const refreshAvailableDates = async () => {
    setLoadingDates(true);
    const dates = await getAvailableDates();
    setAvailableDates(dates);
    setLoadingDates(false);
  };

  const fetchAvailableTokens = async (doctorId, date) => {
    try {
      const response = await fetch(`http://localhost:5001/api/appointments/available-tokens/${doctorId}/${date}`);
      const data = await response.json();
      
      if (data.success) {
        setBooking(prev => ({
          ...prev,
          availableTokens: data.availableTokens,
          totalTokens: data.totalTokens,
          workingHours: data.workingHours,
          lunchBreak: data.lunchBreak
        }));
      }
    } catch (error) {
      console.error('Error fetching available tokens:', error);
    }
  };

  const getNextAvailableDate = () => {
    if (!booking.doctor) {
      return null;
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Get doctor's available days from schedule array (new format) or availableDays (old format)
    let doctorAvailableDays = [];
    
    if (booking.doctor.schedule && booking.doctor.schedule.length > 0) {
      doctorAvailableDays = booking.doctor.schedule
        .filter(s => s.active)
        .map(s => s.day);
    } else if (booking.doctor.availableDays && booking.doctor.availableDays.length > 0) {
      doctorAvailableDays = booking.doctor.availableDays;
    }
    
    if (doctorAvailableDays.length === 0) {
      return null;
    }
    
    // Look for the next available date within the next 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const dayName = dayNames[date.getDay()];
      
      if (doctorAvailableDays.includes(dayName)) {
        const options = { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        };
        return {
          formatted: date.toLocaleDateString('en-US', options),
          isToday: i === 0,
          isTomorrow: i === 1
        };
      }
    }
    
    return null;
  };

  const isDateOnLeave = (dateStr) => {
    if (!booking.doctor || !booking.doctor.leaves || booking.doctor.leaves.length === 0) {
      return false;
    }

    const checkDate = new Date(dateStr);
    
    for (const leave of booking.doctor.leaves) {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      
      if (checkDate >= leaveStart && checkDate <= leaveEnd) {
        return true;
      }
    }
    
    return false;
  };

  const handleBooking = async () => {
    // Validate slot selection
    if (!selectedSlot) {
      alert('Please select an appointment time slot before proceeding.');
      return;
    }

    // Validate token selection
    if (!booking.tokenNumber) {
      alert('Please confirm your token number before proceeding.');
      return;
    }

    console.log('=== HANDLE BOOKING DEBUG ===');
    console.log('selectedSlot:', selectedSlot);
    console.log('booking.tokenNumber:', booking.tokenNumber);
    console.log('booking.appointmentTime:', booking.appointmentTime);
    console.log('Full booking object:', booking);

    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      // Fetch patient profile to get complete details
      let patientProfile = null;
      if (userData.id) {
        try {
          const profileRes = await fetch(`http://localhost:5001/api/patient/profile/${userData.id}`);
          const profileData = await profileRes.json();
          if (profileData.success && profileData.profile) {
            patientProfile = profileData.profile;
          }
        } catch (error) {
          console.error('Error fetching patient profile:', error);
        }
      }

      // Determine the actual patient: self or a dependent
      let activePatient = null;
      let isDependent = false;
      if (selectedDependent && selectedDependent !== 'self') {
        const dep = dependents.find(d => d._id === selectedDependent);
        if (dep) {
          activePatient = dep;
          isDependent = true;
        }
      }
      if (!activePatient) {
        activePatient = patientProfile; // fall back to self
      }

      const appointmentData = {
        patientId: userData.id || null,
        doctorId: booking.doctor.id || booking.doctor._id || null,
        // Patient details — use dependent data when a dependent is selected
        patientName: isDependent
          ? `${activePatient.firstName} ${activePatient.lastName}`
          : (patientProfile ? `${patientProfile.firstName} ${patientProfile.lastName}` :
             (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : 'Patient Name')),
        patientPhone: isDependent
          ? (activePatient.phone || activePatient.mobileNumber || '')
          : (patientProfile?.mobileNumber || userData.phone || ''),
        patientEmail: isDependent
          ? (activePatient.email || '')
          : (patientProfile?.email || userData.email || ''),
        patientAge: isDependent
          ? (activePatient.age || null)
          : (patientProfile?.age || null),
        patientDOB: isDependent
          ? (activePatient.dobAD && activePatient.dobAD.trim() ? activePatient.dobAD : null)
          : (patientProfile?.dateOfBirth || null),
        patientGender: isDependent
          ? (activePatient.gender || null)
          : (patientProfile?.gender || null),
        patientAddress: isDependent
          ? `${activePatient.district || ''}, ${activePatient.palika || activePatient.municipality || ''}`.replace(/^,\s*|,\s*$/g, '')
          : (patientProfile ? `${patientProfile.district || ''}, ${patientProfile.municipality || ''}, ${patientProfile.wardNumber || ''}`.trim() : ''),
        isForDependent: isDependent,
        dependentRelationship: isDependent ? (activePatient.relationship || '') : '',
        // Doctor details
        doctorName: booking.doctor.name || `Dr. ${booking.doctor.firstName} ${booking.doctor.lastName}`,
        doctorSpecialization: booking.doctor.specialty || booking.doctor.specialization,
        doctorExperience: booking.doctor.experience || '',
        doctorNMCNumber: booking.doctor.nmcNumber || '',
        doctorQualification: booking.doctor.qualification || '',
        doctorCurrentlyPracticeAt: Array.isArray(booking.doctor.hospital) ? booking.doctor.hospital[0] : (booking.doctor.hospital || (Array.isArray(booking.doctor.currentHospital) ? booking.doctor.currentHospital[0] : booking.doctor.currentHospital) || ''),
        hospital: Array.isArray(booking.doctor.hospital) ? booking.doctor.hospital[0] : (booking.doctor.hospital || (Array.isArray(booking.doctor.currentHospital) ? booking.doctor.currentHospital[0] : booking.doctor.currentHospital) || ''),
        // Appointment details
        appointmentDate: booking.date.full,
        appointmentDay: booking.date.day || '',
        appointmentTime: selectedSlot || booking.appointmentTime, // Use selectedSlot first, fallback to booking.appointmentTime
        tokenNumber: booking.tokenNumber,
        appointmentType: 'consultation',
        reasonForVisit: booking.reason || 'General consultation',
        consultationFee: booking.doctor.fee || booking.doctor.consultationFee || 0,
        paymentMethod: 'khalti',
        paymentStatus: 'pending',
      };

      console.log('=== APPOINTMENT DATA ===');
      console.log('appointmentTime:', appointmentData.appointmentTime);
      console.log('tokenNumber:', appointmentData.tokenNumber);
      console.log('selectedSlot:', selectedSlot);
      console.log('booking.appointmentTime:', booking.appointmentTime);
      console.log('Full appointmentData:', appointmentData);

      // Amount in paisa (Rs × 100) — check both fee field names
      const feeRs = booking.doctor.fee || booking.doctor.consultationFee || 0;
      if (!feeRs || feeRs <= 0) {
        alert('Consultation fee is not set for this doctor. Please contact the clinic.');
        return;
      }
      const amountPaisa = Math.round(feeRs * 100);
      const orderId = `APT-${Date.now()}`;
      const returnUrl = `${window.location.origin}/khalti-return`;

      console.log('Initiating Khalti payment with:', {
        amount: amountPaisa,
        orderId,
        orderName: `Appointment with ${booking.doctor.name}`,
        customerName: appointmentData.patientName,
        returnUrl,
      });

      // Khalti validates customer email strictly — send empty string if not a valid address
      const safeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(appointmentData.patientEmail)
        ? appointmentData.patientEmail
        : '';

      // Initiate Khalti payment via backend
      const initiateRes = await fetch('http://localhost:5001/api/khalti/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountPaisa,
          orderId,
          orderName: `Appointment with ${booking.doctor.name}`,
          customerName: appointmentData.patientName,
          customerEmail: safeEmail,
          customerPhone: appointmentData.patientPhone,
          returnUrl,
        }),
      });

      console.log('Khalti initiate response status:', initiateRes.status);
      const initiateData = await initiateRes.json();
      console.log('Khalti initiate response data:', initiateData);

      if (!initiateData.success || !initiateData.paymentUrl) {
        // Extract the most specific error message from Khalti's response
        const khaltiDetails = initiateData.khaltiError || initiateData.details || {};
        const fieldErrors = Object.entries(khaltiDetails)
          .filter(([k]) => k !== 'error_key')
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
        const errorMsg = fieldErrors || initiateData.error || 'Failed to initiate Khalti payment. Please try again.';
        console.error('Khalti initiation failed:', errorMsg, initiateData);
        alert(`Khalti payment error:\n${errorMsg}`);
        return;
      }

      // Save appointment data to sessionStorage so KhaltiReturn can complete the booking
      sessionStorage.setItem('khaltiPendingAppointment', JSON.stringify({
        appointmentData,
        bookingState: {
          ...booking,
          appointmentTime: selectedSlot,
          // Pass the active patient info so BookingConfirmed can display the correct person
          activePatient: {
            name: appointmentData.patientName,
            phone: appointmentData.patientPhone,
            age: appointmentData.patientAge,
            gender: appointmentData.patientGender,
            isDependent: isDependent,
            relationship: appointmentData.dependentRelationship,
          },
        },
      }));

      // Redirect to Khalti payment page
      window.location.href = initiateData.paymentUrl;

    } catch (error) {
      console.error('Booking error:', error);
      alert(`Failed to initiate payment: ${error.message}. Please check your connection and try again.`);
    }
  };

  const canProceed = () => {
    if (step === 1) return false; // department click navigates directly
    if (step === 2) return false; // doctor card click navigates directly
    if (step === 3) return booking.date && selectedSlot;
    if (step === 4) return selectedDependent;
    return true;
  };

  const filteredDoctors = getFilteredDoctors();

  // If no hospital filter, redirect to hospitals page
  if (!hospitalFilter && !preSelectedDoctor) {
    return (
      <div className="booking-container">
        <div className="booking-content">
          <div className="booking-layout">
            <div className="booking-main" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏥</div>
              <h2 style={{ color: '#1a2e35', marginBottom: '0.75rem' }}>Select a Hospital First</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem' }}>Please choose a hospital to book an appointment.</p>
              <a href="/hospitals" className="book-btn" style={{ display: 'inline-block', textDecoration: 'none', padding: '0.85rem 2rem', borderRadius: 12 }}>
                Browse Hospitals →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-container">
      <div className="booking-content">
        {/* Progress Stepper - Matching SelectDoctor */}
        <div className="booking-stepper">
          <div className={`stepper-step ${step === 1 ? 'active' : ''}`}>
            <div className="step-label">
              <div className="step-title">STEP 1</div>
              <div className="step-desc">Select Department</div>
            </div>
          </div>
          <div className="stepper-line"></div>
          <div className={`stepper-step ${step === 2 ? 'active' : ''}`}>
            <div className="step-label">
              <div className="step-title">STEP 2</div>
              <div className="step-desc">Select the doctor</div>
            </div>
          </div>
          <div className="stepper-line"></div>
          <div className={`stepper-step ${step === 3 ? 'active' : ''}`}>
            <div className="step-label">
              <div className="step-title">STEP 3</div>
              <div className="step-desc">Select Appointment time</div>
            </div>
          </div>
          <div className="stepper-line"></div>
          <div className={`stepper-step ${step === 4 ? 'active' : ''}`}>
            <div className="step-label">
              <div className="step-title">STEP 4</div>
              <div className="step-desc">Verify Patient</div>
            </div>
          </div>
          <div className="stepper-line"></div>
          <div className={`stepper-step ${step === 5 ? 'active' : ''}`}>
            <div className="step-label">
              <div className="step-title">STEP 5</div>
              <div className="step-desc">Payments</div>
            </div>
          </div>
        </div>

        <div className="booking-layout">
          <div className="booking-main" style={step === 2 && hospitalFilter ? { background: 'transparent', boxShadow: 'none', padding: 0 } : {}}>
            {/* Step 1: Select Department (Hospital Flow) or Select Specialty & Doctor (General Flow) */}
            {step === 1 && (
              <>
                {/* Hospital filter banner + search row */}
                {hospitalFilter && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.1rem', color: '#065f46', fontWeight: 700, margin: 0, flexShrink: 0 }}>
                      Departments available at <strong>{hospitalFilter}</strong>
                    </h2>
                    {/* Department Search Box */}
                    <div style={{ position: 'relative', width: '260px', flexShrink: 0 }}>
                      <svg
                        style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a0aec0' }}
                        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 1rem 0.65rem 2.75rem',
                          border: '1.5px solid #dce3ef',
                          borderRadius: '999px',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                          color: '#4a5568',
                          background: '#ffffff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                        onFocus={e => { e.target.style.borderColor = '#a0aec0'; e.target.style.boxShadow = '0 1px 6px rgba(0,0,0,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = '#dce3ef'; e.target.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
                      />
                    </div>
                  </div>
                )}

                {/* Hospital Flow - Show Departments */}
                {hospitalFilter ? (
                  <div className="department-selection">
                    {loadingDepartments ? (
                      <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading departments...</p>
                      </div>
                    ) : departments.length > 0 ? (
                      <div className="department-grid">
                        {departments.filter(dept => dept.name.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                          departments.filter(dept => dept.name.toLowerCase().includes(searchTerm.toLowerCase())).map((dept) => {
                            const icon = getDepartmentIcon(dept.name);
                            const match = dept.name.match(/^([^(]+)\s*(\(.*\))?$/);
                            const main = match?.[1]?.trim() || dept.name;
                            const sub = match?.[2]?.trim();
                            return (
                              <div
                                key={dept._id}
                                className="department-card-new"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  const doctorIds = (dept.doctors || []).map(d => String(d._id || d));
                                  setSelectedDepartmentDoctorIds(doctorIds);
                                  setBooking(prev => ({ ...prev, selectedDepartment: dept.name, doctor: null }));
                                  setSearchTerm('');
                                  setStep(2);
                                }}
                              >
                                <div className="dept-icon-container">
                                  <div className="dept-icon">{icon}</div>
                                </div>
                                <h3 className="dept-name">{main}</h3>
                                {sub && <p className="dept-subtitle">{sub}</p>}
                              </div>
                            );
                          })
                        ) : (
                          <div className="no-departments" style={{ gridColumn: '1 / -1' }}>
                            <p>No departments match "<strong>{searchTerm}</strong>".</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="no-departments">
                        <p>No departments found for {hospitalFilter}.</p>
                        <p>Please contact the hospital directly or try another hospital.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Original Flow - Show Specialties and Doctors */
                  <>
                    {/* Search Mode Toggle */}
                    <div className="search-mode-toggle">
                      <button 
                        className={`mode-btn ${searchMode === 'specialty' ? 'active' : ''}`}
                        onClick={() => { setSearchMode('specialty'); setSearchTerm(''); }}
                      >
                        By Specialty
                      </button>
                      <button 
                        className={`mode-btn ${searchMode === 'browse' ? 'active' : ''}`}
                        onClick={() => { setSearchMode('browse'); setBooking(prev => ({ ...prev, specialty: '' })); }}
                      >
                        Browse All Doctors
                      </button>
                    </div>

                    {loading ? (
                      <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading doctors...</p>
                      </div>
                    ) : searchMode === 'specialty' ? (
                      <>
                        <div className="specialty-select">
                          <h2>Select Specialty</h2>
                          <div className="specialty-options">
                            {specialties.map((spec) => (
                              <div
                                key={spec.id}
                                className={`specialty-option ${booking.specialty === spec.id ? 'selected' : ''}`}
                                onClick={() => setBooking(prev => ({ ...prev, specialty: spec.id, doctor: null }))}
                              >
                                <div className="icon">{spec.name[0]}</div>
                                <span>{spec.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {booking.specialty && (
                          <div className="doctor-select">
                            <h2>Select Doctor</h2>
                            {filteredDoctors.length > 0 ? (
                              <div className="doctors-list">
                                {filteredDoctors.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className={`doctor-option ${booking.doctor?.id === doc.id ? 'selected' : ''}`}
                                    onClick={() => setBooking(prev => ({ ...prev, doctor: doc }))}
                                  >
                                    <div className="avatar">
                                      {doc.profilePhoto ? (
                                        <img 
                                          src={`http://localhost:5001/${doc.profilePhoto}`} 
                                          alt={doc.name}
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                          }}
                                        />
                                      ) : null}
                                      <div className="avatar-fallback" style={{ display: doc.profilePhoto ? 'none' : 'flex' }}>
                                        {doc.name.split(' ')[1][0]}
                                      </div>
                                    </div>
                                    <div className="info">
                                      <h3>{doc.name}</h3>
                                      <p>{doc.specialty} • {doc.experience} experience</p>
                                      <div className="stats">
                                        <span className="rating">{doc.rating.toFixed(1)} rating</span>
                                        <span>{doc.patients} patients</span>
                                        <span>Rs. {doc.fee}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="no-results">
                                <p>No doctors available for {specialties.find(s => s.id === booking.specialty)?.name}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="doctor-browse">
                        <h2>Browse Doctors</h2>
                        <div className="doctor-search-bar">
                          <span className="search-icon">S</span>
                          <input
                            type="text"
                            placeholder="Search by doctor name or specialty..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          {searchTerm && (
                            <button className="clear-search" onClick={() => setSearchTerm('')}>X</button>
                          )}
                        </div>
                        
                        <div className="doctors-list browse-list">
                          {filteredDoctors.length > 0 ? (
                            filteredDoctors.map((doc) => (
                              <div
                                key={doc.id}
                                className={`doctor-option ${booking.doctor?.id === doc.id ? 'selected' : ''}`}
                                onClick={() => setBooking(prev => ({ ...prev, doctor: doc, specialty: doc.specialtyId }))}
                              >
                                <div className="avatar">
                                  {doc.profilePhoto ? (
                                    <img 
                                      src={`http://localhost:5001/${doc.profilePhoto}`} 
                                      alt={doc.name}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className="avatar-fallback" style={{ display: doc.profilePhoto ? 'none' : 'flex' }}>
                                    {doc.name.split(' ')[1][0]}
                                  </div>
                                </div>
                                <div className="info">
                                  <h3>{doc.name}</h3>
                                  <p>{doc.specialty} • {doc.experience} experience</p>
                                  <div className="stats">
                                    <span className="rating">{doc.rating.toFixed(1)} rating</span>
                                    <span>{doc.patients} patients</span>
                                    <span>Rs. {doc.fee}</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="no-results">
                              <p>No doctors found matching "{searchTerm}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Action Buttons */}
                <div className="booking-actions">
                  <button
                    className="action-btn primary-btn"
                    disabled={!canProceed()}
                    onClick={() => setStep(step + 1)}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* Step 2 (Hospital Flow): Select Doctor from Department */}
            {step === 2 && hospitalFilter && (
              <>
                {/* Filter Bar - Matching SelectDoctor style */}
                <div className="filter-bar" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'white',
                  padding: '1.25rem 1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  margin: '0 0.5% 2rem 0.5%',
                  gap: '1rem'
                }}>
                  <div className="filter-left">
                    <label>Find By Speciality:</label>
                    <select
                      value={booking.specialty || ''}
                      onChange={e => setBooking(prev => ({ ...prev, specialty: e.target.value }))}
                    >
                      <option value="">All Specializations</option>
                      {[...new Set(filteredDoctors.map(d => d.specialty).filter(Boolean))].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="filter-right">
                    <div className="search-box">
                      <svg className="search-icon-left" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Doctor List - Matching SelectDoctor style */}
                <div className="doctor-list" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  padding: '0 0.5% 3rem 0.5%'
                }}>
                  {loading ? (
                    <div className="loading-state">Loading doctors...</div>
                  ) : (() => {
                    const displayed = filteredDoctors.filter(doc =>
                      (!booking.specialty || doc.specialty === booking.specialty) &&
                      (!searchTerm || doc.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                    
                    if (displayed.length === 0) {
                      return (
                        <div className="empty-state">
                          <p>No doctors found for this department.</p>
                        </div>
                      );
                    }

                    return displayed.map(doc => {
                      const photoPath = doc.profilePhoto?.replace(/\\/g, '/').replace(/^backend\//, '');
                      const dates = getNextDates(doc);
                      const nextAvailable = getNextAvailableTime(doc);

                      return (
                        <div key={doc.id} className="doctor-row" style={{
                          background: 'white',
                          borderRadius: '16px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                          display: 'flex',
                          overflow: 'hidden',
                          border: 'none',
                          padding: '1.5rem',
                          gap: '1.5rem',
                          marginBottom: '1.5rem'
                        }}>
                          {/* Left: Doctor Info (Photo + Details side by side) */}
                          <div className="doctor-info-col" style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '1.25rem',
                            minWidth: '380px',
                            flexShrink: 0
                          }}>
                            <div className="doctor-photo" style={{
                              width: '180px',
                              height: '180px',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              flexShrink: 0,
                              background: 'var(--primary-color)',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setSelectedDoctorProfile(doc);
                              setShowProfileModal(true);
                            }}
                            >
                              {photoPath ? (
                                <img
                                  src={`http://localhost:5001/${photoPath}`}
                                  alt={doc.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: 'center top'
                                  }}
                                  onError={e => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="photo-fallback" style={{ 
                                display: photoPath ? 'none' : 'flex',
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(135deg, #00c9b1, #0284c7)',
                                color: 'white',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '5rem',
                                fontWeight: 700
                              }}>
                                {doc.name.split(' ')[1]?.[0] || 'D'}
                              </div>
                            </div>

                            <div className="doctor-details" style={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              paddingTop: 0
                            }}>
                              <h3 style={{
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                color: '#1a2e35',
                                marginBottom: '0.75rem'
                              }}>{doc.name}</h3>
                              <p className="spec-tag" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.85rem',
                                color: '#64748b',
                                marginBottom: '0.4rem'
                              }}>
                                <span className="dot" style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: 'var(--primary-color)',
                                  flexShrink: 0
                                }}></span>{doc.specialty}
                              </p>
                              <p className="exp-tag" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.85rem',
                                color: '#64748b',
                                marginBottom: '0.4rem'
                              }}>
                                <span className="dot" style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: 'var(--primary-color)',
                                  flexShrink: 0
                                }}></span>Experience: {doc.experience}
                              </p>
                              <p className="next-available-tag" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.82rem',
                                color: '#10b981',
                                fontWeight: 500,
                                marginBottom: '0.75rem'
                              }}>
                                <span className="dot green" style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: '#10b981',
                                  flexShrink: 0
                                }}></span>
                                Next Available: {nextAvailable || 'Contact clinic directly'}
                              </p>
                              <button className="view-profile-btn" style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 1.5rem',
                                border: '2px solid var(--primary-color)',
                                borderRadius: '8px',
                                color: 'var(--primary-color)',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                background: 'white',
                                alignSelf: 'flex-start',
                                height: '36px',
                                lineHeight: 1,
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                setSelectedDoctorProfile(doc);
                                setShowProfileModal(true);
                              }}
                              >
                                View Profile ›
                              </button>
                            </div>
                          </div>

                          {/* Right: Schedule */}
                          <div className="doctor-schedule-col" style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0,
                            background: 'transparent',
                            borderRadius: 0,
                            padding: 0,
                            boxShadow: 'none'
                          }}>{dates.length === 0 ? (
                              <div className="no-schedule" style={{
                                color: 'var(--text-light)',
                                fontSize: '0.9rem',
                                padding: '1rem 0'
                              }}>No availability set. Contact clinic directly.</div>
                            ) : (
                              <>
                                <div className="schedule-header" style={{
                                  display: 'grid',
                                  gridTemplateColumns: '80px 200px 1fr',
                                  gap: '1.5rem',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  color: '#94a3b8',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  paddingBottom: '0.4rem',
                                  borderBottom: '1px solid #e2e8f0',
                                  marginBottom: '0.2rem'
                                }}>
                                  <span>Date</span>
                                  <span>Dr. Available Time</span>
                                  <span>Available Slots</span>
                                </div>
                                {dates.map((date, di) => {
                                  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()];
                                  let timeRange = `${doc.availableTimeStart || '09:00'} - ${doc.availableTimeEnd || '17:00'}`;
                                  
                                  // Convert 24h time to 12h format with AM/PM
                                  const formatTime12h = (time24) => {
                                    const [hours, minutes] = time24.split(':').map(Number);
                                    const period = hours >= 12 ? 'PM' : 'AM';
                                    const hours12 = hours % 12 || 12;
                                    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
                                  };
                                  
                                  // Get schedule from hospitalSchedules or flat schedule
                                  let daySchedule = null;
                                  if (doc.hospitalSchedules && doc.hospitalSchedules.length > 0) {
                                    const hospitalSchedule = doc.hospitalSchedules[0];
                                    if (hospitalSchedule.schedule) {
                                      daySchedule = hospitalSchedule.schedule.find(s => s.day === dayName && s.active);
                                    }
                                  }
                                  if (!daySchedule && doc.schedule) {
                                    daySchedule = doc.schedule.find(s => s.day === dayName && s.active);
                                  }
                                  if (daySchedule) {
                                    timeRange = `${formatTime12h(daySchedule.start)} - ${formatTime12h(daySchedule.end)}`;
                                  } else {
                                    const [start, end] = timeRange.split(' - ');
                                    timeRange = `${formatTime12h(start)} - ${formatTime12h(end)}`;
                                  }
                                  
                                  const slots = getTimeSlots(doc, date);
                                  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                  const dateIso = date.toISOString().split('T')[0];
                                  const docId = doc.id || doc._id;
                                  const hospitalNameStr = Array.isArray(doc.hospital) ? doc.hospital[0] : (doc.hospital || '');
                                  // Trigger fetch for this doctor+date (lazy, cached per session)
                                  fetchCardBookedSlots(docId, dateIso, hospitalNameStr);

                                  const todayIso = new Date().toISOString().split('T')[0];
                                  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
                                  const isToday = dateIso === todayIso;

                                  // Show first 4 slots always; mark each as booked or past (disabled)
                                  const displaySlots = slots.slice(0, 4).map(s => {
                                    const isBooked = isCardSlotBooked(docId, dateIso, s);
                                    const isPast = isToday && (() => {
                                      const [h, m] = s.split(':').map(Number);
                                      return h * 60 + m <= nowMinutes;
                                    })();
                                    return { slot: s, disabled: isBooked || isPast };
                                  });
                                  // Count remaining selectable slots beyond the first 4
                                  const remainingCardCount = slots.slice(4).filter(s => {
                                    if (isCardSlotBooked(docId, dateIso, s)) return false;
                                    if (isToday) {
                                      const [h, m] = s.split(':').map(Number);
                                      if (h * 60 + m <= nowMinutes) return false;
                                    }
                                    return true;
                                  }).length;

                                  return (
                                    <div key={di} className="schedule-row" style={{
                                      display: 'grid',
                                      gridTemplateColumns: '80px 160px 1fr',
                                      gap: '1rem',
                                      alignItems: 'center',
                                      padding: '0.4rem 0',
                                      borderBottom: di < dates.length - 1 ? '1px solid #f1f5f9' : 'none'
                                    }}>
                                      <span className="sched-date" style={{
                                        fontSize: '0.85rem',
                                        color: '#1e293b',
                                        fontWeight: 700
                                      }}>{dateStr}</span>
                                      
                                      <span className="sched-range" style={{
                                        fontSize: '0.8rem',
                                        color: '#64748b',
                                        fontWeight: 400
                                      }}>{timeRange}</span>
                                      
                                      <div className="sched-slots" style={{
                                        display: 'flex',
                                        gap: '0.4rem',
                                        flexWrap: 'nowrap',
                                        alignItems: 'center'
                                      }}>
                                        {displaySlots.map(({ slot: slotTime, disabled }) => (
                                          <button
                                            key={slotTime}
                                            className={`slot-btn${disabled ? ' booked' : ''}`}
                                            disabled={disabled}
                                            onClick={() => !disabled && handleBookSlot(doc, date, slotTime)}
                                            style={{
                                              padding: '0.6rem 0',
                                              width: '90px',
                                              background: disabled ? '#f1f5f9' : '#f8f9fa',
                                              color: disabled ? '#b0bec5' : '#475569',
                                              border: '2px solid transparent',
                                              borderRadius: '8px',
                                              fontSize: '0.85rem',
                                              fontWeight: 600,
                                              cursor: disabled ? 'not-allowed' : 'pointer',
                                              opacity: disabled ? 0.5 : 1,
                                              boxShadow: 'none',
                                              height: '36px',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              lineHeight: 1,
                                              flexShrink: 0,
                                              whiteSpace: 'nowrap',
                                              pointerEvents: disabled ? 'none' : 'auto',
                                            }}
                                          >
                                            {formatTime12h(slotTime)}
                                          </button>
                                        ))}
                                        {remainingCardCount > 0 && (
                                          <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.25rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                            +{remainingCardCount} more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                <button
                                  className="check-schedule-btn"
                                  onClick={() => {
                                    const photoPath = doc.profilePhoto?.replace(/\\/g, '/').replace(/^backend\//, '');
                                    setBooking(prev => ({
                                      ...prev,
                                      doctor: {
                                        id: doc.id,
                                        _id: doc.id,
                                        name: doc.name,
                                        specialty: doc.specialty,
                                        specialtyId: doc.specialtyId,
                                        rating: doc.rating,
                                        patients: doc.patients,
                                        experience: doc.experience,
                                        fee: doc.fee,
                                        hospital: doc.hospital,
                                        currentHospital: doc.currentHospital || doc.hospital,
                                        profilePhoto: photoPath,
                                        schedule: doc.schedule,
                                        hospitalSchedules: doc.hospitalSchedules,
                                        lunchBreak: doc.lunchBreak,
                                        leaves: doc.leaves,
                                        availableDays: doc.availableDays,
                                        availableTimeStart: doc.availableTimeStart,
                                        availableTimeEnd: doc.availableTimeEnd,
                                        consultationDuration: doc.consultationDuration,
                                        nmcNumber: doc.nmcNumber,
                                        qualification: doc.qualification,
                                      }
                                    }));
                                    setStep(3);
                                  }}
                                  style={{
                                    marginTop: '0.2rem',
                                    padding: '0.5rem 1.5rem',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    width: '100%'
                                  }}
                                >
                                  Check Other Schedule Time to take appointment →
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            )}

            {/* Step 2 (General Flow) or Step 3 (Hospital Flow): Select Date & Time - Side by Side Layout */}
            {((step === 2 && !hospitalFilter) || (step === 3 && hospitalFilter)) && (
              <>
                {/* Header */}
                <div className="booking-page-header">
                  <h2>Book Appointment With</h2>
                </div>

                {/* Doctor Info & Slots Container */}
                <div className="booking-content-wrapper">
                  {/* Left Side - Doctor Details */}
                  <div className="doctor-details-panel">
                    {/* Doctor Information Card - Vertical Layout */}
                    <div className="step4-doctor-card">
                      {/* Avatar at top */}
                      <div className="step4-doctor-avatar" style={{ margin: '0 auto 1rem auto' }}>
                        {booking.doctor?.profilePhoto ? (
                          <img 
                            src={`http://localhost:5001/${booking.doctor.profilePhoto.replace(/\\/g, '/').replace(/^backend\//, '')}`}
                            alt={booking.doctor.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="step4-avatar-fallback"
                          style={{ display: booking.doctor?.profilePhoto ? 'none' : 'flex' }}
                        >
                          {booking.doctor?.name?.split(' ')[1]?.[0] || 'D'}
                        </div>
                      </div>
                      
                      {/* Doctor name */}
                      <h3 style={{ textAlign: 'center', margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: '#1a2e35' }}>
                        {booking.doctor?.name}
                      </h3>
                      
                      {/* Specialization */}
                      <p style={{ textAlign: 'center', color: '#00a896', fontWeight: 600, margin: '0 0 1rem 0' }}>
                        {booking.doctor?.specialty}
                      </p>
                      
                      {/* Horizontal line */}
                      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1rem 0' }} />
                      
                      {/* Details List with improved styling */}
                      <div className="step3-details-list">
                        <div className="step3-detail-row">
                          <span className="step3-detail-label">Experience</span>
                          <span className="step3-detail-value">{booking.doctor?.experience || 'N/A'}</span>
                        </div>
                        
                        <div className="step3-detail-row">
                          <span className="step3-detail-label">NMC Number</span>
                          <span className="step3-detail-value">{booking.doctor?.nmcNumber || 'N/A'}</span>
                        </div>
                        
                        <div className="step3-detail-row">
                          <span className="step3-detail-label">Qualification</span>
                          <span className="step3-detail-value">{booking.doctor?.qualification || 'N/A'}</span>
                        </div>
                        
                        <div className="step3-detail-row">
                          <span className="step3-detail-label">Currently Practice at</span>
                          <span className="step3-detail-value">
                            {(Array.isArray(booking.doctor?.hospital) 
                              ? booking.doctor.hospital[0] 
                              : booking.doctor?.hospital) || 
                            (Array.isArray(booking.doctor?.currentHospital) 
                              ? booking.doctor.currentHospital[0] 
                              : booking.doctor?.currentHospital) || 'Not specified'}
                          </span>
                        </div>
                        
                        <div className="step3-detail-row">
                          <span className="step3-detail-label">Consultation Fee</span>
                          <span className="step3-detail-value step3-fee">Rs. {booking.doctor?.fee || booking.doctor?.consultationFee || 0}</span>
                        </div>
                        
                        <div className="step3-detail-row step3-highlight">
                          <span className="step3-detail-label">Next available time</span>
                          <span className="step3-detail-value">{getNextAvailableTime(booking.doctor) || 'Contact clinic'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Date & Time Selection */}
                  <div className="slots-selection-panel">
                    {/* Date Selection */}
                    <div className="selection-section">
                      <h3>Select Date</h3>
                      <div className="week-calendar">
                        {(() => {
                          const today = new Date();
                          const weekDates = [];
                          for (let i = 0; i < 7; i++) {
                            const date = new Date(today);
                            date.setDate(today.getDate() + i);
                            weekDates.push(date);
                          }
                          
                          return weekDates.map((date, index) => {
                            const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                            const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            const dateNum = date.getDate();
                            const dayName = dayNames[date.getDay()];
                            const fullDayName = fullDayNames[date.getDay()];
                            const dateStr = date.toISOString().split('T')[0];
                            const isToday = date.toDateString() === today.toDateString();
                            const isSelected = booking.date?.full === dateStr;
                            
                            const doctorAvailableDays = (() => {
                              // Mirror exactly what getTimeSlots does:
                              // 1. Try to match by hospital name
                              // 2. Fall back to hospitalSchedules[0]
                              // 3. Fall back to general schedule / availableDays
                              const hospitalName = (Array.isArray(booking.doctor?.hospital)
                                ? booking.doctor.hospital[0]
                                : booking.doctor?.hospital) ||
                                (Array.isArray(booking.doctor?.currentHospital)
                                  ? booking.doctor.currentHospital[0]
                                  : booking.doctor?.currentHospital) || '';

                              if (booking.doctor?.hospitalSchedules && Array.isArray(booking.doctor.hospitalSchedules) && booking.doctor.hospitalSchedules.length > 0) {
                                // Try exact hospital name match first
                                const matched = booking.doctor.hospitalSchedules.find(
                                  hs => hs.hospital?.trim().toLowerCase() === hospitalName?.trim().toLowerCase()
                                );
                                const scheduleToUse = matched || booking.doctor.hospitalSchedules[0];
                                if (scheduleToUse?.schedule) {
                                  return scheduleToUse.schedule.filter(s => s.active).map(s => s.day);
                                }
                              }

                              // Fall back to general schedule or availableDays
                              return booking.doctor?.schedule?.filter(s => s.active).map(s => s.day) ||
                                     booking.doctor?.availableDays || [];
                            })();
                            // Check if date is in the past (before today)
                            const isPastDate = date < today && !isToday;
                            
                            // Check if doctor works on this day
                            const doctorWorksThisDay = doctorAvailableDays.includes(fullDayName);
                            
                            // Date is clickable if it's not in the past (even if doctor doesn't work)
                            const isClickable = !isPastDate;
                            
                            // Date is "available" (has slots) only if doctor works AND not past
                            const isAvailable = doctorWorksThisDay && !isPastDate;

                            return (
                              <div
                                key={index}
                                className={`date-box ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''} ${isToday ? 'today' : ''}`}
                                onClick={() => {
                                  if (isClickable) {
                                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    handleDateSelect({
                                      day: dayName,
                                      date: dateNum,
                                      month: monthNames[date.getMonth()],
                                      full: dateStr,
                                      dayName: fullDayName
                                    });
                                  }
                                }}
                              >
                                <span className="date-day">{dayName}</span>
                                <span className="date-num">{dateNum}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Time Selection */}
                    <div className="selection-section">
                      <h3>Select Time</h3>
                      {!booking.date ? (
                        <div className="empty-state">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e0" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                          </svg>
                          <p>Please select a date first</p>
                        </div>
                      ) : loadingSlots ? (
                        <div className="loading-state">
                          <div className="spinner"></div>
                          <p>Loading available times...</p>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="empty-state">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e0" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <p>Doctor not available on this date</p>
                          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                            Please select another date
                          </p>
                        </div>
                      ) : (
                          <div className="time-slots-grouped">
                            {(() => {
                              // Group slots by time of day
                              const morning = []; // 5 AM - 11:59 AM
                              const afternoon = []; // 12 PM - 4:59 PM
                              const evening = []; // 5 PM onwards

                              // For today, mark slots whose time has already passed
                              const isSelectedToday = booking.date?.full === new Date().toISOString().split('T')[0];
                              const nowMinutes = isSelectedToday
                                ? new Date().getHours() * 60 + new Date().getMinutes()
                                : -1;
                              
                              availableSlots.forEach((slotObj, originalIndex) => {
                                // Handle both string format (old) and object format (new)
                                const slot = typeof slotObj === 'string' ? slotObj : slotObj.time;
                                const isBooked = (typeof slotObj === 'object' && slotObj !== null) ? slotObj.isBooked : false;

                                // Disable slots in the past when today is selected
                                const [slotHour, slotMin] = slot.split(':').map(Number);
                                const slotMinutes = slotHour * 60 + slotMin;
                                const isPast = isSelectedToday && slotMinutes <= nowMinutes;
                                
                                const hour = slotHour;
                                
                                if (hour >= 5 && hour < 12) {
                                  morning.push({ slot, originalIndex, isBooked, isPast });
                                } else if (hour >= 12 && hour < 17) {
                                  afternoon.push({ slot, originalIndex, isBooked, isPast });
                                } else {
                                  evening.push({ slot, originalIndex, isBooked, isPast });
                                }
                              });
                              
                              return (
                                <>
                                  {morning.length > 0 && (
                                    <div className="time-slot-group">
                                      <h4 className="time-group-heading">Morning</h4>
                                      <div className="time-slots">
                                        {morning.map(({ slot, originalIndex, isBooked, isPast }) => {
                                          const [hours, minutes] = slot.split(':');
                                          const hour = parseInt(hours);
                                          const ampm = hour >= 12 ? 'PM' : 'AM';
                                          const hour12 = hour % 12 || 12;
                                          const formattedTime = `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`;
                                          const tokenNumber = originalIndex + 1;
                                          
                                          // Debug log for each button
                                          console.log(`Rendering button for ${formattedTime}:`, { slot, isBooked, disabled: isBooked });
                                          
                                          return (
                                            <button
                                              key={slot}
                                              type="button"
                                              className={`time-slot ${selectedSlot === slot ? 'selected' : ''} ${isBooked || isPast ? 'booked' : ''}`}
                                              disabled={isBooked || isPast}
                                              onClick={() => {
                                                if (isBooked || isPast) return;
                                                
                                                // Check if user is logged in
                                                const token = localStorage.getItem('token');
                                                if (!token) {
                                                  // Save current booking state to resume after login
                                                  const bookingState = {
                                                    doctor: booking.doctor,
                                                    date: booking.date,
                                                    slot: slot,
                                                    tokenNumber: originalIndex + 1
                                                  };
                                                  sessionStorage.setItem('pendingBooking', JSON.stringify(bookingState));
                                                  
                                                  // Redirect to login with return URL
                                                  navigate('/login?redirect=/book-appointment');
                                                  return;
                                                }
                                                
                                                // User is logged in, proceed with slot selection
                                                setSelectedSlot(slot);
                                                setBooking(prev => ({ 
                                                  ...prev, 
                                                  appointmentTime: slot,
                                                  tokenNumber: tokenNumber
                                                }));
                                                // Automatically advance to Step 4
                                                setStep(4);
                                              }}
                                            >
                                              {formattedTime}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {afternoon.length > 0 && (
                                    <div className="time-slot-group">
                                      <h4 className="time-group-heading">Afternoon</h4>
                                      <div className="time-slots">
                                        {afternoon.map(({ slot, originalIndex, isBooked, isPast }) => {
                                          const [hours, minutes] = slot.split(':');
                                          const hour = parseInt(hours);
                                          const ampm = hour >= 12 ? 'PM' : 'AM';
                                          const hour12 = hour % 12 || 12;
                                          const formattedTime = `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`;
                                          const tokenNumber = originalIndex + 1;
                                          
                                          return (
                                            <button
                                              key={slot}
                                              type="button"
                                              className={`time-slot ${selectedSlot === slot ? 'selected' : ''} ${isBooked || isPast ? 'booked' : ''}`}
                                              disabled={isBooked || isPast}
                                              onClick={() => {
                                                if (isBooked || isPast) return;
                                                
                                                // Check if user is logged in
                                                const token = localStorage.getItem('token');
                                                if (!token) {
                                                  // Save current booking state to resume after login
                                                  const bookingState = {
                                                    doctor: booking.doctor,
                                                    date: booking.date,
                                                    slot: slot,
                                                    tokenNumber: originalIndex + 1
                                                  };
                                                  sessionStorage.setItem('pendingBooking', JSON.stringify(bookingState));
                                                  
                                                  // Redirect to login with return URL
                                                  navigate('/login?redirect=/book-appointment');
                                                  return;
                                                }
                                                
                                                // User is logged in, proceed with slot selection
                                                setSelectedSlot(slot);
                                                setBooking(prev => ({ 
                                                  ...prev, 
                                                  appointmentTime: slot,
                                                  tokenNumber: tokenNumber
                                                }));
                                                // Automatically advance to Step 4
                                                setStep(4);
                                              }}
                                            >
                                              {formattedTime}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {evening.length > 0 && (
                                    <div className="time-slot-group">
                                      <h4 className="time-group-heading">Evening</h4>
                                      <div className="time-slots">
                                        {evening.map(({ slot, originalIndex, isBooked, isPast }) => {
                                          const [hours, minutes] = slot.split(':');
                                          const hour = parseInt(hours);
                                          const ampm = hour >= 12 ? 'PM' : 'AM';
                                          const hour12 = hour % 12 || 12;
                                          const formattedTime = `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`;
                                          const tokenNumber = originalIndex + 1;
                                          
                                          return (
                                            <button
                                              key={slot}
                                              type="button"
                                              className={`time-slot ${selectedSlot === slot ? 'selected' : ''} ${isBooked || isPast ? 'booked' : ''}`}
                                              disabled={isBooked || isPast}
                                              onClick={() => {
                                                if (isBooked || isPast) return;
                                                
                                                // Check if user is logged in
                                                const token = localStorage.getItem('token');
                                                if (!token) {
                                                  // Save current booking state to resume after login
                                                  const bookingState = {
                                                    doctor: booking.doctor,
                                                    date: booking.date,
                                                    slot: slot,
                                                    tokenNumber: originalIndex + 1
                                                  };
                                                  sessionStorage.setItem('pendingBooking', JSON.stringify(bookingState));
                                                  
                                                  // Redirect to login with return URL
                                                  navigate('/login?redirect=/book-appointment');
                                                  return;
                                                }
                                                
                                                // User is logged in, proceed with slot selection
                                                setSelectedSlot(slot);
                                                setBooking(prev => ({ 
                                                  ...prev, 
                                                  appointmentTime: slot,
                                                  tokenNumber: tokenNumber
                                                }));
                                                // Automatically advance to Step 4
                                                setStep(4);
                                              }}
                                            >
                                              {formattedTime}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )
                      }
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Hide for the date/time step (slot click advances automatically) */}
                {!((step === 2 && !hospitalFilter) || (step === 3 && hospitalFilter)) && (
                  <div className="booking-actions">
                    {step > (preSelectedDoctor ? 2 : 1) && (
                      <button
                        className="action-btn secondary-btn"
                        onClick={() => setStep(step - 1)}
                      >
                        Go Back
                      </button>
                    )}
                    {step < (hospitalFilter ? 3 : 2) ? (
                      <button
                        className="action-btn primary-btn"
                        disabled={!canProceed()}
                        onClick={() => setStep(step + 1)}
                      >
                        Continue
                      </button>
                    ) : step === 5 ? (
                      <button className="action-btn primary-btn" onClick={handleBooking}>
                        Pay Rs. {booking.doctor?.fee || booking.doctor?.consultationFee || 0} & Confirm
                      </button>
                    ) : null}
                  </div>
                )}
              </>
            )}

            {/* Step 4: Verify Patient / Select Dependent */}
            {step === 4 && (
              <div className="step4-container">
                <div className="step4-layout">
                  {/* LEFT COLUMN */}
                  <div className="step4-left">
                    {/* Doctor Information Card */}
                    <div className="step4-doctor-card">
                      <div className="step4-doctor-header">
                        <div className="step4-doctor-avatar">
                          {booking.doctor?.profilePhoto ? (
                            <img 
                              src={`http://localhost:5001/${booking.doctor.profilePhoto.replace(/\\/g, '/').replace(/^backend\//, '')}`}
                              alt={booking.doctor.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="step4-avatar-fallback"
                            style={{ display: booking.doctor?.profilePhoto ? 'none' : 'flex' }}
                          >
                            {booking.doctor?.name?.split(' ')[1]?.[0] || 'D'}
                          </div>
                        </div>
                        <div className="step4-doctor-info">
                          <h3>{booking.doctor?.name}</h3>
                          <p className="step4-specialty">{booking.doctor?.specialty}</p>
                          <p className="step4-detail">Experience: {booking.doctor?.experience || 'N/A'}</p>
                          <p className="step4-detail">NMC Number: {booking.doctor?.nmcNumber || 'N/A'}</p>
                          <p className="step4-detail">Qualification: {booking.doctor?.qualification || 'N/A'}</p>
                        </div>
                      </div>
                      <p className="step4-hospital">
                        Currently Practice at: {
                          (Array.isArray(booking.doctor?.hospital) 
                            ? booking.doctor.hospital[0] 
                            : booking.doctor?.hospital) || 
                          (Array.isArray(booking.doctor?.currentHospital) 
                            ? booking.doctor.currentHospital[0] 
                            : booking.doctor?.currentHospital) || 'Not specified'
                        }
                      </p>
                    </div>

                    {/* Booking Details Grid */}
                    <div className="step4-booking-grid">
                      <div className="step4-grid-item">
                        <div className="step4-grid-label">Date</div>
                        <div className="step4-grid-value">
                          {booking.date ? 
                            `${booking.date.month} ${booking.date.date}, ${new Date().getFullYear()}` : 
                            'Not selected'
                          }
                        </div>
                        <div className="step4-grid-subvalue">
                          {booking.date?.dayName || ''}
                        </div>
                      </div>
                      
                      <div className="step4-grid-item">
                        <div className="step4-grid-label">Consultation Time</div>
                        <div className="step4-grid-value">
                          {selectedSlot ? (() => {
                            const [hours, minutes] = selectedSlot.split(':');
                            const hour = parseInt(hours);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const hour12 = hour % 12 || 12;
                            return `${hour12}:${minutes} ${ampm}`;
                          })() : 'Not selected'}
                        </div>
                      </div>
                      
                      <div className="step4-grid-item">
                        <div className="step4-grid-label">Consultation Fee</div>
                        <div className="step4-grid-value">Rs. {booking.doctor?.fee || booking.doctor?.consultationFee || 0}</div>
                      </div>
                      
                      <div className="step4-grid-item">
                        <div className="step4-grid-label">Token No:</div>
                        <div className="step4-grid-value">#{booking.tokenNumber || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="step4-right">
                    <div className="step4-dependent-section">
                      <div className="step4-dependent-header">
                        <div>
                          <h2>Who will be seeing the doctor?</h2>
                          <p>Select the Dependent</p>
                        </div>
                        <input
                          type="text"
                          placeholder="Search Dependents"
                          value={dependentSearch}
                          onChange={(e) => setDependentSearch(e.target.value)}
                          className="step4-search-input"
                        />
                      </div>

                      {/* Self Card */}
                      <div className="step4-dependents-grid">
                        {patientInfo ? (
                          <div 
                            className={`step4-dependent-card ${selectedDependent === 'self' ? 'selected' : ''}`}
                            onClick={() => setSelectedDependent('self')}
                          >
                            <div className="step4-dependent-avatar">
                              {patientInfo.firstName?.[0] || 'P'}
                            </div>
                            <div className="step4-dependent-info">
                              <h4>{patientInfo.firstName} {patientInfo.lastName}</h4>
                              <p>{patientInfo.dateOfBirth ? new Date(patientInfo.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                              <span className="step4-self-badge">Self</span>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className={`step4-dependent-card ${selectedDependent === 'self' ? 'selected' : ''}`}
                            onClick={() => setSelectedDependent('self')}
                          >
                            <div className="step4-dependent-avatar">
                              {(() => {
                                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                                return userData.firstName?.[0] || 'P';
                              })()}
                            </div>
                            <div className="step4-dependent-info">
                              <h4>
                                {(() => {
                                  const userData = JSON.parse(localStorage.getItem('user') || '{}');
                                  return `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Patient';
                                })()}
                              </h4>
                              <p>Loading...</p>
                              <span className="step4-self-badge">Self</span>
                            </div>
                          </div>
                        )}

                        {/* Dependents List */}
                        {dependents
                          .filter(dep => {
                            if (!dependentSearch) return true;
                            const searchLower = dependentSearch.toLowerCase();
                            const fullName = `${dep.firstName} ${dep.lastName}`.toLowerCase();
                            return fullName.includes(searchLower);
                          })
                          .map((dependent) => (
                            <div 
                              key={dependent._id}
                              className={`step4-dependent-card ${selectedDependent === dependent._id ? 'selected' : ''}`}
                              onClick={() => setSelectedDependent(dependent._id)}
                            >
                              <div className="step4-dependent-avatar">
                                {dependent.firstName?.[0] || 'D'}
                              </div>
                              <div className="step4-dependent-info">
                                <h4>{dependent.firstName} {dependent.lastName}</h4>
                                <p>{dependent.dobAD || (dependent.age ? `Age: ${dependent.age}` : 'N/A')}</p>
                                <span className="step4-relationship-badge">{dependent.relationship}</span>
                              </div>
                            </div>
                          ))
                        }
                      </div>

                      {/* Add New Dependent Button */}
                      <button 
                        className="step4-add-dependent-btn"
                        onClick={() => setShowAddDependentModal(true)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add new Dependent
                      </button>
                    </div>

                    {/* Continue Button */}
                    <button 
                      className="step4-continue-btn"
                      disabled={!selectedDependent}
                      onClick={() => setStep(5)}
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {step === 5 && (
              <div className="step4-container">
                <div className="step4-layout">
                  {/* LEFT COLUMN - Doctor Details (Same as Step 4) */}
                  <div className="step4-left">
                    {/* Doctor Information Card */}
                    <div className="step4-doctor-card">
                      <div className="step4-doctor-header">
                        <div className="step4-doctor-avatar">
                          {booking.doctor?.profilePhoto ? (
                            <img 
                              src={`http://localhost:5001/${booking.doctor.profilePhoto.replace(/\\/g, '/').replace(/^backend\//, '')}`}
                              alt={booking.doctor.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="step4-avatar-fallback"
                            style={{ display: booking.doctor?.profilePhoto ? 'none' : 'flex' }}
                          >
                            {booking.doctor?.name?.split(' ')[1]?.[0] || 'D'}
                          </div>
                        </div>
                        <div className="step4-doctor-info">
                          <h3>{booking.doctor?.name}</h3>
                          <p className="step4-specialty">{booking.doctor?.specialty}</p>
                          <p className="step4-detail">Experience: {booking.doctor?.experience || 'N/A'}</p>
                          <p className="step4-detail">NMC Number: {booking.doctor?.nmcNumber || 'N/A'}</p>
                          <p className="step4-detail">Qualification: {booking.doctor?.qualification || 'N/A'}</p>
                        </div>
                      </div>
                      <p className="step4-hospital">
                        Currently Practice at: {
                          (Array.isArray(booking.doctor?.hospital) 
                            ? booking.doctor.hospital[0] 
                            : booking.doctor?.hospital) || 
                          (Array.isArray(booking.doctor?.currentHospital) 
                            ? booking.doctor.currentHospital[0] 
                            : booking.doctor?.currentHospital) || 'Not specified'
                        }
                      </p>
                    </div>

                    {/* Booking Details Grid */}
                    <div className="step4-booking-grid">
                      <div className="step4-grid-item">
                        <div className="step4-grid-label">Date</div>
                        <div className="step4-grid-value">
                          {booking.date ? 
                            `${booking.date.month} ${booking.date.date}, ${new Date().getFullYear()}` : 
                            'Not selected'
                          }
                        </div>
                        <div className="step4-grid-subvalue">
                          {booking.date?.dayName || ''}
                        </div>
                      </div>
                      
                      <div className="step4-grid-item">
                        <div className="step4-grid-label">Consultation Time</div>
                        <div className="step4-grid-value">
                          {selectedSlot ? (() => {
                            const [hours, minutes] = selectedSlot.split(':');
                            const hour = parseInt(hours);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const hour12 = hour % 12 || 12;
                            return `${hour12}:${minutes} ${ampm}`;
                          })() : 'Not selected'}
                        </div>
                      </div>
                      
                      <div className="step4-grid-item">
                        <div className="step4-grid-label">Consultation Fee</div>
                        <div className="step4-grid-value">Rs. {booking.doctor?.fee || booking.doctor?.consultationFee || 0}</div>
                      </div>
                      
                      <div className="step4-grid-item">
                        <div className="step4-grid-label">Token No:</div>
                        <div className="step4-grid-value">#{booking.tokenNumber || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN - Patient Details & Payment */}
                  <div className="step4-right">
                    {/* Patient Details Section */}
                    <div className="step5-patient-section">
                      <div 
                        className="step5-patient-header"
                        onClick={() => setPatientDetailsExpanded(!patientDetailsExpanded)}
                      >
                        <h2>Patient Details</h2>
                        <svg 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                          style={{ 
                            transform: patientDetailsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s'
                          }}
                        >
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                      
                      {/* Always visible: Name and Age */}
                      <div className="step5-patient-summary">
                        {selectedDependent === 'self' ? (
                          <>
                            <div className="step5-summary-item">
                              <span className="step5-summary-label">Name:</span>
                              <span className="step5-summary-value">
                                {patientInfo ? `${patientInfo.firstName} ${patientInfo.lastName}` : 'Loading...'}
                              </span>
                            </div>
                            <div className="step5-summary-item">
                              <span className="step5-summary-label">Age:</span>
                              <span className="step5-summary-value">
                                {patientInfo?.dateOfBirth 
                                  ? Math.floor((new Date() - new Date(patientInfo.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
                                  : 'N/A'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            {(() => {
                              const dependent = dependents.find(dep => dep._id === selectedDependent);
                              if (!dependent) return null;
                              return (
                                <>
                                  <div className="step5-summary-item">
                                    <span className="step5-summary-label">Name:</span>
                                    <span className="step5-summary-value">{`${dependent.firstName} ${dependent.lastName}`}</span>
                                  </div>
                                  <div className="step5-summary-item">
                                    <span className="step5-summary-label">Age:</span>
                                    <span className="step5-summary-value">{dependent.age || 'N/A'}</span>
                                  </div>
                                </>
                              );
                            })()}
                          </>
                        )}
                      </div>

                      {/* Expandable: Full Details */}
                      {patientDetailsExpanded && (
                        <div className="step5-patient-info">
                          {selectedDependent === 'self' ? (
                            <>
                              <div className="step5-detail-row">
                                <span className="step5-label">Date of Birth:</span>
                                <span className="step5-value">
                                  {patientInfo?.dateOfBirth 
                                    ? new Date(patientInfo.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                    : 'N/A'}
                                </span>
                              </div>
                              <div className="step5-detail-row">
                                <span className="step5-label">Gender:</span>
                                <span className="step5-value">{patientInfo?.gender ? patientInfo.gender.charAt(0).toUpperCase() + patientInfo.gender.slice(1) : 'N/A'}</span>
                              </div>
                              <div className="step5-detail-row">
                                <span className="step5-label">Mobile No:</span>
                                <span className="step5-value">{patientInfo?.phone || 'N/A'}</span>
                              </div>
                              <div className="step5-detail-row">
                                <span className="step5-label">Address:</span>
                                <span className="step5-value">
                                  {patientInfo?.address 
                                    ? `${patientInfo.address.street || ''}, ${patientInfo.address.city || ''}, ${patientInfo.address.district || ''}, ${patientInfo.address.province || ''}`.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ',')
                                    : 'N/A'}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              {(() => {
                                const dependent = dependents.find(dep => dep._id === selectedDependent);
                                if (!dependent) return null;
                                return (
                                  <>
                                    <div className="step5-detail-row">
                                      <span className="step5-label">Date of Birth:</span>
                                      <span className="step5-value">{dependent.dobAD || 'N/A'}</span>
                                    </div>
                                    <div className="step5-detail-row">
                                      <span className="step5-label">Gender:</span>
                                      <span className="step5-value">{dependent.gender || 'N/A'}</span>
                                    </div>
                                    <div className="step5-detail-row">
                                      <span className="step5-label">Mobile No:</span>
                                      <span className="step5-value">{dependent.phone || 'N/A'}</span>
                                    </div>
                                    <div className="step5-detail-row">
                                      <span className="step5-label">Address:</span>
                                      <span className="step5-value">
                                        {dependent.address 
                                          ? dependent.address
                                          : `${dependent.palika || ''}, ${dependent.district || ''}, ${dependent.province || ''}`.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ',') || 'N/A'}
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Payment Method Section */}
                    <div className="step5-payment-section">
                      <h2>Payment Method</h2>
                      <div className="step5-khalti-card">
                        <img
                          src="https://web.khalti.com/static/img/logo1.png"
                          alt="Khalti"
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                        <div className="step5-khalti-fallback" style={{ display: 'none' }}>Khalti</div>
                        <div className="step5-radio-checked">✓</div>
                      </div>
                      <p className="step5-payment-note">Pay securely with Khalti digital wallet</p>
                      
                      {/* Payment Summary */}
                      <div className="step5-payment-summary">
                        <div className="step5-summary-row step5-summary-total">
                          <span>Total Amount</span>
                          <span>Rs. {booking.doctor?.fee || booking.doctor?.consultationFee || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="step5-actions">
                      <button
                        className="step5-btn step5-btn-back"
                        onClick={() => setStep(step - 1)}
                      >
                        ← Go Back
                      </button>
                      <button 
                        className="step5-btn step5-btn-pay" 
                        onClick={handleBooking}
                      >
                        Pay Rs. {booking.doctor?.fee || booking.doctor?.consultationFee || 0}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Dependent Modal */}
      {showAddDependentModal && (
        <div className="modal-overlay" onClick={() => setShowAddDependentModal(false)}>
          <div className="add-dependent-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Patient</h2>
            
            <form className="dependent-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter First Name"
                    value={newDependent.firstName}
                    onChange={(e) => setNewDependent({...newDependent, firstName: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter Last Name"
                    value={newDependent.lastName}
                    onChange={(e) => setNewDependent({...newDependent, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Age <span className="required">*</span></label>
                  <input
                    type="number"
                    placeholder="Enter Age"
                    value={newDependent.age}
                    onChange={(e) => setNewDependent({...newDependent, age: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth (AD)</label>
                  <input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={newDependent.dobAD}
                    onChange={(e) => setNewDependent({...newDependent, dobAD: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth (BS)</label>
                  <input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    value={newDependent.dobBS}
                    onChange={(e) => setNewDependent({...newDependent, dobBS: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Enter your Phone Number"
                    value={newDependent.phone}
                    onChange={(e) => setNewDependent({...newDependent, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="Enter your Email Address"
                    value={newDependent.email}
                    onChange={(e) => setNewDependent({...newDependent, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Gender <span className="required">*</span></label>
                  <select
                    value={newDependent.gender}
                    onChange={(e) => setNewDependent({...newDependent, gender: e.target.value})}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Relationship <span className="required">*</span></label>
                  <select
                    value={newDependent.relationship}
                    onChange={(e) => setNewDependent({...newDependent, relationship: e.target.value})}
                  >
                    <option value="">Select</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Province <span className="required">*</span></label>
                  <select
                    value={newDependent.province}
                    onChange={(e) => setNewDependent({...newDependent, province: e.target.value, district: '', palika: ''})}
                  >
                    <option value="">Select Province</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>District <span className="required">*</span></label>
                  <select
                    value={newDependent.district}
                    onChange={(e) => setNewDependent({...newDependent, district: e.target.value, palika: ''})}
                    disabled={!newDependent.province}
                  >
                    <option value="">{newDependent.province ? 'Select District' : 'Select Province First'}</option>
                    {newDependent.province && Object.keys(NEPAL_DATA[newDependent.province] || {}).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Local Level (Palika) <span className="required">*</span></label>
                  <select
                    value={newDependent.palika}
                    onChange={(e) => setNewDependent({...newDependent, palika: e.target.value})}
                    disabled={!newDependent.district}
                  >
                    <option value="">{newDependent.district ? 'Select Palika' : 'Select District First'}</option>
                    {(NEPAL_DATA[newDependent.province]?.[newDependent.district] || []).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    placeholder="Enter Address"
                    value={newDependent.address}
                    onChange={(e) => setNewDependent({...newDependent, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowAddDependentModal(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn-add-dependent"
                  onClick={async () => {
                    try {
                      // Get user data from localStorage
                      const userData = JSON.parse(localStorage.getItem('user') || '{}');
                      const userId = userData.id;
                      
                      if (!userId) {
                        alert('User not found. Please log in again.');
                        return;
                      }

                      // Validate required fields
                      if (!newDependent.firstName || !newDependent.lastName || !newDependent.gender || 
                          !newDependent.relationship || !newDependent.province || !newDependent.district || 
                          !newDependent.palika) {
                        alert('Please fill in all required fields');
                        return;
                      }

                      // Save dependent to backend
                      const response = await fetch(`http://localhost:5001/api/patient/dependents/${userId}`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(newDependent)
                      });

                      const data = await response.json();

                      if (data.success) {
                        // Add the new dependent to the local state
                        setDependents(prev => [...prev, data.dependent]);
                        
                        // Reset form
                        setNewDependent({
                          firstName: '',
                          lastName: '',
                          age: '',
                          dobAD: '',
                          dobBS: '',
                          phone: '',
                          email: '',
                          gender: '',
                          relationship: '',
                          province: '',
                          district: '',
                          palika: '',
                          address: ''
                        });
                        
                        // Close modal
                        setShowAddDependentModal(false);
                        
                        alert('Dependent added successfully!');
                      } else {
                        alert('Failed to add dependent: ' + (data.error || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Error adding dependent:', error);
                      alert('Failed to add dependent. Please try again.');
                    }
                  }}
                >
                  Add Dependent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Profile Modal - EXACT COPY from SelectDoctor */}
      {showProfileModal && selectedDoctorProfile && (
        <div className="doctor-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="doctor-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowProfileModal(false)}>×</button>

            <div className="modal-header">
              <div className="modal-doctor-photo">
                {selectedDoctorProfile.profilePhoto ? (
                  <img 
                    src={`http://localhost:5001/${selectedDoctorProfile.profilePhoto.replace(/\\/g, '/').replace(/^backend\//, '')}`} 
                    alt={selectedDoctorProfile.name}
                    onError={(e) => { 
                      e.target.style.display = 'none'; 
                      e.target.nextSibling.style.display = 'flex'; 
                    }}
                  />
                ) : null}
                <div className="modal-photo-fallback" style={{ display: selectedDoctorProfile.profilePhoto ? 'none' : 'flex' }}>
                  {selectedDoctorProfile.name?.split(' ')[1]?.[0] || selectedDoctorProfile.name?.[0] || 'D'}
                </div>
              </div>
              <div className="modal-doctor-info">
                <h3>{selectedDoctorProfile.name}</h3>
                <p className="modal-specialty">{selectedDoctorProfile.specialty}</p>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-info-row">
                <span className="info-label">NMC Number:</span>
                <span className="info-value">{selectedDoctorProfile.nmcNumber || 'N/A'}</span>
              </div>
              
              <div className="modal-info-row">
                <span className="info-label">Qualification:</span>
                <span className="info-value">{selectedDoctorProfile.qualification || 'Not specified'}</span>
              </div>
              
              <div className="modal-info-row">
                <span className="info-label">Experience:</span>
                <span className="info-value">{selectedDoctorProfile.experience || 'Not specified'}</span>
              </div>
              
              <div className="modal-info-row">
                <span className="info-label">Currently Practice at:</span>
                <span className="info-value">
                  {Array.isArray(selectedDoctorProfile.hospital) 
                    ? selectedDoctorProfile.hospital[0] 
                    : selectedDoctorProfile.hospital || 
                      (Array.isArray(selectedDoctorProfile.currentHospital) 
                        ? selectedDoctorProfile.currentHospital[0] 
                        : selectedDoctorProfile.currentHospital) || 'Not specified'}
                </span>
              </div>
              
              <div className="modal-info-row highlight">
                <span className="info-label">Consultation Fee:</span>
                <span className="info-value fee">Rs. {selectedDoctorProfile.fee || selectedDoctorProfile.consultationFee || 'Contact clinic'}</span>
              </div>
              
              <div className="modal-info-row highlight">
                <span className="info-label">Next Available Time:</span>
                <span className="info-value available">{getNextAvailableTime(selectedDoctorProfile) || 'Contact clinic'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
