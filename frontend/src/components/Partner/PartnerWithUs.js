import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './PartnerWithUs.css';

const FACILITY_CATEGORIES = [
  'Private Hospital', 'Teaching Hospital', 'Government Hospital',
  'Community / Non-Profit Hospital', 'Specialized Clinic', 'Diagnostic & Lab Center',
  'Polyclinic', 'Ayurveda and Alternative Medicine Center', 'Other'
];

const NEPAL_DATA = {
  'Koshi Province': {
    'Taplejung': ['Phungling Municipality','Sidingba Rural Municipality','Sirijangha Rural Municipality','Meringden Rural Municipality','Mikwakhola Rural Municipality','Maiwakhola Rural Municipality','Pathivara Yangwarak Rural Municipality','Aathrai Tribeni Rural Municipality','Phaktanglung Rural Municipality','Siddhicharan Municipality','Khandbari Municipality','Madi Municipality','Bhotkhola Rural Municipality','Sabhapokhari Rural Municipality','Chhathar Jorpati Rural Municipality'],
    'Sankhuwasabha': ['Chainpur Municipality','Dharmadevi Municipality','Panchkhapan Municipality','Madi Municipality','Sabhapokhari Rural Municipality','Bhotkhola Rural Municipality','Silichong Rural Municipality','Makalu Rural Municipality','Chichila Rural Municipality','Hatuwagadhi Rural Municipality'],
    'Bhojpur': ['Bhojpur Municipality','Shadananda Municipality','Tyamkemaiyung Rural Municipality','Aamchowk Rural Municipality','Ramprasad Rai Rural Municipality','Hatuwagadhi Rural Municipality','Pauwadungma Rural Municipality','Salpasilichho Rural Municipality'],
    'Dhankuta': ['Dhankuta Municipality','Pakhribas Municipality','Mahalaxmi Municipality','Sangurigadhi Rural Municipality','Chhathar Jorpati Rural Municipality','Sahidbhumi Rural Municipality'],
    'Terhathum': ['Myanglung Municipality','Laligurans Municipality','Aathrai Rural Municipality','Chhathar Rural Municipality','Phedap Rural Municipality'],
    'Solukhumbu': ['Solu Dudhkunda Municipality','Namche Rural Municipality','Khumbu Pasanglhamu Rural Municipality','Mahakulung Rural Municipality','Sotang Rural Municipality','Thulung Dudhkoshi Rural Municipality','Likhupike Rural Municipality','Necha Salyan Rural Municipality'],
    'Okhaldhunga': ['Siddhicharan Municipality','Molung Rural Municipality','Champadevi Rural Municipality','Khijidemba Rural Municipality','Manebhanjyang Rural Municipality','Sunkoshi Rural Municipality','Likhu Rural Municipality'],
    'Khotang': ['Diktel Rupakot Majhuwagadhi Municipality','Halesi Tuwachung Municipality','Khotehang Rural Municipality','Barahpokhari Rural Municipality','Ainselukhark Rural Municipality','Kepilasagadhi Rural Municipality','Rawabesi Rural Municipality','Sakela Rural Municipality'],
    'Udayapur': ['Triyuga Municipality','Belaka Municipality','Udayapurgadhi Rural Municipality','Tapli Rural Municipality','Chaudandigadhi Municipality','Katari Municipality','Rautamai Rural Municipality'],
    'Sunsari': ['Dharan Sub-Metropolitan City','Itahari Sub-Metropolitan City','Inaruwa Municipality','Barahakshetra Municipality','Duhabi Municipality','Ramdhuni Municipality','Harinagar Rural Municipality','Koshi Rural Municipality','Barju Rural Municipality'],
    'Morang': ['Biratnagar Metropolitan City','Urlabari Municipality','Pathari Shanischare Municipality','Sundarharaicha Municipality','Letang Municipality','Rangeli Municipality','Ratuwamai Municipality','Budhiganga Rural Municipality','Gramthan Rural Municipality','Jahada Rural Municipality','Katahari Rural Municipality','Kerabari Rural Municipality','Miklajung Rural Municipality'],
    'Jhapa': ['Mechinagar Municipality','Bhadrapur Municipality','Birtamod Municipality','Damak Municipality','Kankai Municipality','Arjundhara Municipality','Gauradaha Municipality','Shivasataxi Municipality','Haldibari Rural Municipality','Buddhashanti Rural Municipality','Barhadashi Rural Municipality','Kamal Rural Municipality','Kachankawal Rural Municipality','Jhapa Rural Municipality'],
    'Ilam': ['Ilam Municipality','Deumai Municipality','Mai Municipality','Suryodaya Municipality','Maijogmai Rural Municipality','Sandakpur Rural Municipality','Chulachuli Rural Municipality','Mangsebung Rural Municipality','Rong Rural Municipality','Phakphokthum Rural Municipality'],
    'Panchthar': ['Phidim Municipality','Hilihang Rural Municipality','Kummayak Rural Municipality','Miklajung Rural Municipality','Phungling Rural Municipality','Tumbewa Rural Municipality','Yangwarak Rural Municipality'],
  },
  'Madhesh Province': {
    'Parsa': ['Birgunj Metropolitan City','Bahudarmai Municipality','Parsagadhi Municipality','Pokhariya Municipality','Chhipaharmai Rural Municipality','Dhobini Rural Municipality','Jagarnathpur Rural Municipality','Jirabhawani Rural Municipality','Kalikamai Rural Municipality','Pakaha Mainpur Rural Municipality','Paterwasugauli Rural Municipality','Paterwa Sugauli Rural Municipality','Sakhuwa Prasauni Rural Municipality','Thori Rural Municipality'],
    'Bara': ['Kalaiya Sub-Metropolitan City','Jitpur Simara Sub-Metropolitan City','Kolhabi Municipality','Nijgadh Municipality','Mahagadhimai Municipality','Simraungadh Municipality','Karaiyamai Rural Municipality','Pacharauta Rural Municipality','Pheta Rural Municipality','Prasauni Rural Municipality','Suwarna Rural Municipality','Devtal Rural Municipality','Adarsha Kotwal Rural Municipality'],
    'Rautahat': ['Gaur Municipality','Chandrapur Municipality','Garuda Municipality','Gadhimai Municipality','Gujara Municipality','Ishanath Municipality','Katahariya Municipality','Maulapur Municipality','Rajpur Municipality','Rajdevi Municipality','Brindaban Rural Municipality','Baudhimai Rural Municipality','Dewahi Gonahi Rural Municipality','Durga Bhagwati Rural Municipality','Madhav Narayan Rural Municipality','Paroha Rural Municipality','Phatuwa Bijayapur Rural Municipality','Yamunamai Rural Municipality'],
    'Sarlahi': ['Malangwa Municipality','Haripur Municipality','Hariwan Municipality','Ishworpur Municipality','Kabilasi Municipality','Lalbandi Municipality','Bagmati Municipality','Balara Rural Municipality','Barahathawa Municipality','Bishnu Rural Municipality','Bramhapuri Rural Municipality','Chakraghatta Rural Municipality','Chandranagar Rural Municipality','Dhankaul Rural Municipality','Godaita Municipality','Haripurwa Rural Municipality','Harion Rural Municipality','Kaudena Rural Municipality','Parsa Rural Municipality','Ramnagar Rural Municipality','Ramprasad Rural Municipality'],
    'Mahottari': ['Jaleshwar Municipality','Bardibas Municipality','Gaushala Municipality','Manara Shiswa Municipality','Matihani Municipality','Ramgopalpur Municipality','Aurahi Rural Municipality','Balwa Rural Municipality','Bhangaha Municipality','Ekdara Rural Municipality','Loharpatti Rural Municipality','Mahottari Rural Municipality','Pipra Rural Municipality','Samsi Rural Municipality','Sonama Rural Municipality'],
    'Dhanusha': ['Janakpurdham Sub-Metropolitan City','Chhireshwornath Municipality','Dhanusadham Municipality','Ganeshman Charnath Municipality','Hansapur Municipality','Janakpur Municipality','Mithila Municipality','Mithila Bihari Municipality','Nagarain Municipality','Sabaila Municipality','Shahidnagar Municipality','Aurahi Rural Municipality','Bateshwar Rural Municipality','Bideha Rural Municipality','Dhanauji Rural Municipality','Janaknandini Rural Municipality','Kamala Rural Municipality','Lakshminiya Rural Municipality','Mukhiyapatti Musharniya Rural Municipality','Saptari Rural Municipality'],
    'Siraha': ['Lahan Municipality','Siraha Municipality','Golbazar Municipality','Mirchaiya Municipality','Sukhipur Municipality','Karjanha Rural Municipality','Arnama Rural Municipality','Aurahi Rural Municipality','Bariyarpatti Rural Municipality','Bishnupur Rural Municipality','Bhagawanpur Rural Municipality','Dhangadhimai Municipality','Kalyanpur Rural Municipality','Lakshmipur Patari Rural Municipality','Mahadeva Rural Municipality','Naraha Rural Municipality','Nawarajpur Rural Municipality','Sakhuwanankarkatti Rural Municipality','Shyamaprasad Municipality'],
    'Saptari': ['Rajbiraj Municipality','Kanchanrup Municipality','Bodebarsain Municipality','Dakneshwori Municipality','Hanumannagar Kankalini Municipality','Shambhunath Municipality','Surunga Municipality','Tilathi Koiladi Municipality','Agnisair Krishna Savaran Rural Municipality','Balan-Bihul Rural Municipality','Bishnupur Rural Municipality','Chhinnamasta Rural Municipality','Mahadeva Rural Municipality','Rupani Rural Municipality','Saptakoshi Rural Municipality'],
  },
  'Bagmati Province': {
    'Kathmandu': ['Kathmandu Metropolitan City','Kirtipur Municipality','Shankharapur Municipality','Gokarneshwar Municipality','Kageshwari Manohara Municipality','Nagarjun Municipality','Tarakeshwar Municipality','Tokha Municipality','Budhanilkantha Municipality','Chandragiri Municipality','Dakshinkali Municipality'],
    'Lalitpur': ['Lalitpur Metropolitan City','Godawari Municipality','Mahalaxmi Municipality','Konjyosom Rural Municipality','Bagmati Rural Municipality'],
    'Bhaktapur': ['Bhaktapur Municipality','Madhyapur Thimi Municipality','Changunarayan Municipality','Suryabinayak Municipality'],
    'Kavrepalanchok': ['Banepa Municipality','Dhulikhel Municipality','Panauti Municipality','Panchkhal Municipality','Namobuddha Municipality','Mandan Deupur Municipality','Bethanchok Rural Municipality','Bhumlu Rural Municipality','Chaurideurali Rural Municipality','Khanikhola Rural Municipality','Mahabharat Rural Municipality','Roshi Rural Municipality','Temal Rural Municipality'],
    'Sindhupalchok': ['Chautara Sangachokgadhi Municipality','Melamchi Municipality','Bahrabise Municipality','Barhabise Municipality','Bhotekoshi Rural Municipality','Helambu Rural Municipality','Indrawati Rural Municipality','Jugal Rural Municipality','Lisankhu Pakhar Rural Municipality','Panchpokhari Thangpal Rural Municipality','Sunkoshi Rural Municipality','Tripurasundari Rural Municipality'],
    'Dolakha': ['Bhimeshwar Municipality','Jiri Municipality','Bigu Rural Municipality','Baiteshwar Rural Municipality','Gaurishankar Rural Municipality','Kalinchok Rural Municipality','Melung Rural Municipality','Sailung Rural Municipality','Tamakoshi Rural Municipality'],
    'Ramechhap': ['Manthali Municipality','Ramechhap Municipality','Doramba Rural Municipality','Gokulganga Rural Municipality','Khandadevi Rural Municipality','Likhu Tamakoshi Rural Municipality','Sunapati Rural Municipality','Umakunda Rural Municipality'],
    'Sindhuli': ['Kamalamai Municipality','Dudhauli Municipality','Golanjor Rural Municipality','Hariharpurgadhi Rural Municipality','Marin Rural Municipality','Phikkal Rural Municipality','Sunkoshi Rural Municipality','Tinpatan Rural Municipality'],
    'Makwanpur': ['Hetauda Sub-Metropolitan City','Thaha Municipality','Bakaiya Rural Municipality','Bagmati Rural Municipality','Bhimphedi Rural Municipality','Indrasarowar Rural Municipality','Kailash Rural Municipality','Manahari Rural Municipality','Raksirang Rural Municipality'],
    'Nuwakot': ['Bidur Municipality','Belkotgadhi Municipality','Dupcheshwar Rural Municipality','Kakani Rural Municipality','Kispang Rural Municipality','Likha Rural Municipality','Myagang Rural Municipality','Panchakanya Rural Municipality','Shivapuri Rural Municipality','Suryagadhi Rural Municipality','Tadi Rural Municipality','Tarkeshwar Rural Municipality'],
    'Rasuwa': ['Kalika Rural Municipality','Gosaikunda Rural Municipality','Naukunda Rural Municipality','Parbatikunda Rural Municipality','Uttargaya Rural Municipality'],
    'Dhading': ['Nilkantha Municipality','Dhading Besi Municipality','Gajuri Rural Municipality','Galchi Rural Municipality','Gangajamuna Rural Municipality','Jwalamukhi Rural Municipality','Khaniyabas Rural Municipality','Netrawati Dabjong Rural Municipality','Rubi Valley Rural Municipality','Siddhalek Rural Municipality','Thakre Rural Municipality','Tripura Sundari Rural Municipality'],
    'Chitwan': ['Bharatpur Metropolitan City','Ratnanagar Municipality','Khairahani Municipality','Madi Municipality','Rapti Municipality','Ichchhakamana Rural Municipality','Bharatpur Rural Municipality'],
  },
  'Gandaki Province': {
    'Kaski': ['Pokhara Metropolitan City','Annapurna Rural Municipality','Machhapuchchhre Rural Municipality','Madi Rural Municipality','Rupa Rural Municipality'],
    'Syangja': ['Waling Municipality','Putalibazar Municipality','Galyang Municipality','Arjunchaupari Rural Municipality','Biruwa Rural Municipality','Chapakot Municipality','Harinas Rural Municipality','Kaligandaki Rural Municipality','Phedikhola Rural Municipality','Aandhikhola Rural Municipality'],
    'Parbat': ['Kushma Municipality','Phalewas Municipality','Bihadi Rural Municipality','Jaljala Rural Municipality','Mahashila Rural Municipality','Modi Rural Municipality','Painyu Rural Municipality'],
    'Baglung': ['Baglung Municipality','Galkot Municipality','Dhorpatan Municipality','Bareng Rural Municipality','Badigad Rural Municipality','Taman Khola Rural Municipality','Nisikhola Rural Municipality','Tara Hill Rural Municipality','Jaimini Municipality'],
    'Myagdi': ['Beni Municipality','Annapurna Rural Municipality','Dhaulagiri Rural Municipality','Mangala Rural Municipality','Malika Rural Municipality','Raghuganga Rural Municipality'],
    'Mustang': ['Mustang Rural Municipality','Lomanthang Rural Municipality','Gharapjhong Rural Municipality','Thasang Rural Municipality','Dalome Rural Municipality'],
    'Manang': ['Chame Rural Municipality','Narphu Rural Municipality','Narpa Bhumi Rural Municipality','Neshyang Rural Municipality'],
    'Lamjung': ['Besisahar Municipality','Sundarbazar Municipality','Dordi Rural Municipality','Dudhpokhari Rural Municipality','Kwholasothar Rural Municipality','Marsyangdi Rural Municipality','Madhya Nepal Municipality','Rainas Municipality'],
    'Tanahu': ['Damauli Municipality','Bhimad Municipality','Byas Municipality','Ghiring Rural Municipality','Myagde Rural Municipality','Rishing Rural Municipality','Shuklagandaki Municipality','Bandipur Rural Municipality','Devghat Rural Municipality','Anbukhaireni Rural Municipality'],
    'Gorkha': ['Gorkha Municipality','Palungtar Municipality','Arughat Rural Municipality','Arpak Dudhauli Rural Municipality','Barpak Sulikot Rural Municipality','Bhimsen Thapa Rural Municipality','Dharche Rural Municipality','Gandaki Rural Municipality','Tsum Nubri Rural Municipality','Shahid Lakhan Rural Municipality'],
    'Nawalpur': ['Kawasoti Municipality','Devchuli Municipality','Bulingtar Rural Municipality','Gaindakot Municipality','Hupsekot Municipality','Madhyabindu Municipality','Binayi Tribeni Rural Municipality'],
  },
  'Lumbini Province': {
    'Rupandehi': ['Butwal Sub-Metropolitan City','Siddharthanagar Municipality','Tilottama Municipality','Devdaha Municipality','Lumbini Sanskritik Municipality','Marchawari Rural Municipality','Mayadevi Rural Municipality','Omsatiya Rural Municipality','Rohini Rural Municipality','Sammarimai Rural Municipality','Siyari Rural Municipality','Sudhdhodhan Rural Municipality','Sainamaina Municipality','Kotahimai Rural Municipality','Gaidahawa Rural Municipality','Kanchan Rural Municipality','Shudhodhan Rural Municipality'],
    'Kapilvastu': ['Kapilvastu Municipality','Banganga Municipality','Buddhabhumi Municipality','Bijaynagar Rural Municipality','Krishnanagar Municipality','Maharajgunj Municipality','Mayadevi Rural Municipality','Shivaraj Municipality','Suddhodhan Rural Municipality','Yashodhara Rural Municipality'],
    'Nawalparasi (East)': ['Kawasoti Municipality','Devchuli Municipality','Bulingtar Rural Municipality','Gaindakot Municipality','Hupsekot Municipality','Madhyabindu Municipality','Binayi Tribeni Rural Municipality'],
    'Nawalparasi (West)': ['Sunwal Municipality','Palhinandan Rural Municipality','Pratappur Rural Municipality','Ramgram Municipality','Sarawal Rural Municipality','Susta Rural Municipality'],
    'Arghakhanchi': ['Sandhikharka Municipality','Sitganga Municipality','Bhumikasthan Municipality','Chhatradev Rural Municipality','Malarani Rural Municipality','Panini Rural Municipality'],
    'Gulmi': ['Resunga Municipality','Musikot Municipality','Chandrakot Rural Municipality','Chatrakot Rural Municipality','Dhurkot Rural Municipality','Gulmi Darbar Rural Municipality','Isma Rural Municipality','Kaligandaki Rural Municipality','Madane Rural Municipality','Malika Rural Municipality','Ruru Rural Municipality','Satyawati Rural Municipality'],
    'Palpa': ['Tansen Municipality','Rampur Municipality','Bagnaskali Rural Municipality','Mathagadhi Rural Municipality','Nisdi Rural Municipality','Purbakhola Rural Municipality','Rainadevi Chhahara Rural Municipality','Ribdikot Rural Municipality','Ridi Municipality','Tinau Rural Municipality'],
    'Pyuthan': ['Pyuthan Municipality','Swargadwary Municipality','Airawati Rural Municipality','Gaumukhi Rural Municipality','Jhimruk Rural Municipality','Lungri Rural Municipality','Mallarani Rural Municipality','Mandavi Rural Municipality','Naubahini Rural Municipality','Sarumarani Rural Municipality'],
    'Rolpa': ['Rolpa Municipality','Runtigadhi Rural Municipality','Sunchhahari Rural Municipality','Thawang Rural Municipality','Tribeni Rural Municipality','Lungri Rural Municipality','Madi Rural Municipality','Pariwartan Rural Municipality','Sunil Smriti Rural Municipality'],
    'Rukum (East)': ['Putha Uttarganga Rural Municipality','Bhume Rural Municipality','Sisne Rural Municipality'],
    'Dang': ['Tulsipur Sub-Metropolitan City','Ghorahi Sub-Metropolitan City','Lamahi Municipality','Banglachuli Rural Municipality','Babai Rural Municipality','Dangisharan Rural Municipality','Gadhawa Rural Municipality','Rajpur Rural Municipality','Rapti Rural Municipality','Shantinagar Rural Municipality'],
    'Banke': ['Nepalgunj Sub-Metropolitan City','Kohalpur Municipality','Duduwa Rural Municipality','Janki Rural Municipality','Khajura Rural Municipality','Narainapur Rural Municipality','Raptisonari Rural Municipality'],
    'Bardiya': ['Gulariya Municipality','Madhuwan Municipality','Rajapur Municipality','Thakurbaba Municipality','Badhaiyatal Rural Municipality','Bansgadhi Municipality','Barbardiya Municipality','Geruwa Rural Municipality'],
  },
  'Karnali Province': {
    'Surkhet': ['Birendranagar Municipality','Bheriganga Municipality','Gurbhakot Municipality','Lekbeshi Municipality','Panchpuri Municipality','Barahatal Rural Municipality','Chaukune Rural Municipality','Chingad Rural Municipality','Simta Rural Municipality'],
    'Dailekh': ['Narayan Municipality','Dullu Municipality','Aathabis Municipality','Bhagawatimai Rural Municipality','Bhairabi Rural Municipality','Chamunda Bindrasaini Municipality','Dungeshwar Rural Municipality','Gurans Rural Municipality','Mahabu Rural Municipality','Naumule Rural Municipality','Thantikandh Rural Municipality'],
    'Jajarkot': ['Bheri Municipality','Chhedagad Municipality','Barekot Rural Municipality','Junichande Rural Municipality','Kuse Rural Municipality','Nalagad Municipality','Shiwalaya Rural Municipality','Tribeni Rural Municipality'],
    'Rukum (West)': ['Musikot Municipality','Aathbiskot Municipality','Banfikot Rural Municipality','Chaurjahari Municipality','Putha Uttarganga Rural Municipality','Sanibheri Rural Municipality','Triveni Rural Municipality'],
    'Salyan': ['Sharada Municipality','Bangad Kupinde Municipality','Bagchaur Municipality','Darma Rural Municipality','Kalimati Rural Municipality','Kapurkot Rural Municipality','Kumakh Rural Municipality','Siddha Kumakh Rural Municipality','Tribeni Rural Municipality'],
    'Dolpa': ['Thuli Bheri Municipality','Tripurasundari Municipality','Chharka Tangsong Rural Municipality','Dolpo Buddha Rural Municipality','Jagadulla Rural Municipality','Kaike Rural Municipality','Mudkechula Rural Municipality','She Phoksundo Rural Municipality'],
    'Mugu': ['Chhayanath Rara Municipality','Khatyad Rural Municipality','Mugum Karmarong Rural Municipality','Soru Rural Municipality'],
    'Humla': ['Simkot Rural Municipality','Adanchuli Rural Municipality','Chankheli Rural Municipality','Kharpunath Rural Municipality','Namkha Rural Municipality','Sarkegad Rural Municipality','Tanjakot Rural Municipality'],
    'Jumla': ['Chandannath Municipality','Guthichaur Rural Municipality','Hima Rural Municipality','Kanakasundari Rural Municipality','Patarasi Rural Municipality','Sinja Rural Municipality','Tatopani Rural Municipality','Tila Rural Municipality'],
    'Kalikot': ['Khandachakra Municipality','Mahawai Rural Municipality','Naraharinath Rural Municipality','Pachaljharana Rural Municipality','Palata Rural Municipality','Raskot Municipality','Sanni Triveni Rural Municipality','Shubha Kalika Municipality','Tilagufa Municipality'],
  },
  'Sudurpashchim Province': {
    'Kailali': ['Dhangadhi Sub-Metropolitan City','Tikapur Municipality','Bhajani Municipality','Ghodaghodi Municipality','Godawari Municipality','Janaki Rural Municipality','Joshipur Rural Municipality','Kailari Rural Municipality','Lamkichuha Municipality','Mohanyal Rural Municipality','Phatepur Rural Municipality','Bardagoriya Rural Municipality','Chure Rural Municipality'],
    'Kanchanpur': ['Mahendranagar Municipality','Bedkot Municipality','Belauri Municipality','Bhimdatta Municipality','Krishnapur Municipality','Laljhadi Rural Municipality','Punarbas Municipality','Shuklaphanta Municipality'],
    'Dadeldhura': ['Amargadhi Municipality','Aalital Rural Municipality','Ajayameru Rural Municipality','Bhageshwar Rural Municipality','Ganyapadhura Rural Municipality','Nawadurga Rural Municipality','Parashuram Municipality'],
    'Baitadi': ['Dasharathchand Municipality','Patan Municipality','Dilasaini Rural Municipality','Dogdakedar Rural Municipality','Melauli Municipality','Purchaudi Municipality','Shivanath Rural Municipality','Sigas Rural Municipality','Surnaya Rural Municipality'],
    'Darchula': ['Shailyashikhar Municipality','Apihimal Rural Municipality','Byans Rural Municipality','Duhun Rural Municipality','Lekam Rural Municipality','Mahakali Municipality','Marma Rural Municipality','Naugad Rural Municipality'],
    'Bajhang': ['Bungal Municipality','Chhededaha Rural Municipality','Durgathali Rural Municipality','Jayaprithvi Municipality','Kanda Rural Municipality','Khaptad Chhanna Rural Municipality','Masta Rural Municipality','Surma Rural Municipality','Talkot Rural Municipality','Thalara Rural Municipality','Bithadchir Rural Municipality','Kedarasyu Rural Municipality'],
    'Bajura': ['Badimalika Municipality','Budhiganga Municipality','Budhinanda Municipality','Gaumul Rural Municipality','Himali Rural Municipality','Jagannath Rural Municipality','Pandusain Rural Municipality','Swamikartik Khapar Rural Municipality','Triveni Rural Municipality'],
    'Achham': ['Mangalsen Municipality','Panchadewal Binayak Municipality','Bannigadhi Jayagadh Rural Municipality','Chaurpati Rural Municipality','Dhakari Rural Municipality','Mellekh Rural Municipality','Ramaroshan Rural Municipality','Sanphebagar Municipality','Turmakhand Rural Municipality'],
    'Doti': ['Dipayal Silgadhi Municipality','Shikhar Municipality','Aadarsha Rural Municipality','Badikedar Rural Municipality','Bogtan Fudsil Rural Municipality','Jorayal Rural Municipality','K.I. Singh Rural Municipality','Purbichauki Rural Municipality','Sayal Rural Municipality'],
  },
};

const PROVINCES = Object.keys(NEPAL_DATA);

const StatusIcon = ({ type }) => {
  if (type === 'under_review') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  );
  if (type === 'approved') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  );
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  );
};

const statusMeta = {
  under_review: { label: 'Under Review', color: '#92400e', bg: '#fef3c7' },
  approved:     { label: 'Approved',      color: '#065f46', bg: '#d1fae5' },
  rejected:     { label: 'Rejected',      color: '#991b1b', bg: '#fee2e2' },
};

export default function PartnerWithUs() {
  const [step, setStep] = useState('form');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState({});

  const [statusEmail, setStatusEmail] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [form, setForm] = useState({
    hospitalName: '', facilityCategory: '', dohsLicenseNumber: '', panVatNumber: '',
    hospitalPhone: '', officialEmail: '',
    adminName: '', adminPhone: '',
    province: '', district: '', palika: '',
    estimatedDoctors: '',
  });

  const [opLic, setOpLic]     = useState(null);
  const [regCert, setRegCert] = useState(null);
  const [taxCert, setTaxCert] = useState(null);
  const opLicRef   = useRef(null);
  const regCertRef = useRef(null);
  const taxRef     = useRef(null);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  const phoneRe = /^[+]?[\d\s\-().]{7,20}$/;

  const validate = () => {
    const e = {};
    if (!form.hospitalName.trim())      e.hospitalName = 'Required';
    if (!form.facilityCategory)         e.facilityCategory = 'Required';
    if (!form.dohsLicenseNumber.trim()) e.dohsLicenseNumber = 'Required';
    if (!form.panVatNumber.trim())      e.panVatNumber = 'Required';
    if (!form.hospitalPhone.trim())     e.hospitalPhone = 'Required';
    else if (!phoneRe.test(form.hospitalPhone)) e.hospitalPhone = 'Invalid phone format';
    if (!form.officialEmail.trim())     e.officialEmail = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.officialEmail)) e.officialEmail = 'Invalid email';
    if (!form.adminName.trim())         e.adminName = 'Required';
    if (!form.adminPhone.trim())        e.adminPhone = 'Required';
    else if (!phoneRe.test(form.adminPhone)) e.adminPhone = 'Invalid phone format';
    if (!form.province)                 e.province = 'Required';
    if (!form.district.trim())          e.district = 'Required';
    if (!form.palika.trim())            e.palika = 'Required';
    if (!form.estimatedDoctors)         e.estimatedDoctors = 'Required';
    else if (isNaN(form.estimatedDoctors) || parseInt(form.estimatedDoctors) < 1) e.estimatedDoctors = 'Must be a positive number';
    if (!opLic)   e.opLic = 'Required';
    if (!regCert) e.regCert = 'Required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true); setSubmitError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));      fd.append('operatingLicense', opLic);
      fd.append('companyRegCert', regCert);
      if (taxCert) fd.append('taxClearance', taxCert);
      const res = await fetch('http://localhost:5001/api/partner/apply', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) setSubmitted(true);
      else setSubmitError(data.error || 'Submission failed.');
    } catch { setSubmitError('Unable to connect to server.'); }
    finally { setSubmitting(false); }
  };

  const handleCheckStatus = async (e) => {
    e.preventDefault();
    setStatusLoading(true); setStatusResult(null);
    try {
      const res = await fetch(`http://localhost:5001/api/partner/status/${encodeURIComponent(statusEmail)}`);
      const data = await res.json();
      setStatusResult(data.success ? data.application : { error: data.error });
    } catch { setStatusResult({ error: 'Unable to connect.' }); }
    finally { setStatusLoading(false); }
  };

  if (submitted) return (
    <div className="pw-page">
      <div className="pw-hero">
        <div className="pw-hero-inner">
          <h1>Partner With HealthMandala</h1>
          <p>Join Nepal's growing network of verified healthcare facilities.</p>
        </div>
      </div>
      <div className="pw-container">
        <div className="pw-success">
          <div className="pw-success-check">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2>Application Submitted</h2>
          <p>Thank you for applying to partner with HealthMandala. Your application has been received and is now under review.</p>

          <div className="pw-status-pill">
            <span className="pw-status-dot" />
            Under Review
          </div>

          <div className="pw-success-info">
            <div className="pw-info-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <span>Our admin team will verify your documents and license details</span>
            </div>
            <div className="pw-info-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Typical review time: <strong>3–5 business days</strong></span>
            </div>
            <div className="pw-info-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span>You'll be notified at your official email once a decision is made</span>
            </div>
          </div>



          <div className="pw-success-actions">
            <button className="pw-btn-primary" onClick={() => { setSubmitted(false); setStep('status'); }}>
              Track Status
            </button>
            <Link to="/" className="pw-btn-outline">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pw-page">

      {/* Hero */}
      <div className="pw-hero">
        <div className="pw-hero-inner">
          <h1>Partner With HealthMandala</h1>
          <p>Join Nepal's growing network of verified healthcare facilities and connect with thousands of patients.</p>
        </div>
      </div>

      <div className="pw-container">

        {step === 'status' ? (
          <div className="pw-status-card">
            <h2>Check Application Status</h2>
            <p>Enter the official email address you used when applying.</p>
            <form onSubmit={handleCheckStatus} className="pw-status-form">
              <input type="email" placeholder="admin@yourhospital.gov.np"
                value={statusEmail} onChange={e => setStatusEmail(e.target.value)} required />
              <button type="submit" disabled={statusLoading}>{statusLoading ? 'Checking...' : 'Check Status'}</button>
            </form>
            {statusResult && (statusResult.error ? (
              <p className="pw-err-msg">{statusResult.error}</p>
            ) : (
              <div className="pw-status-result">
                <div className="pw-status-name">{statusResult.hospitalName}</div>
                <span className="pw-status-badge" style={{ background: statusMeta[statusResult.status]?.bg, color: statusMeta[statusResult.status]?.color }}>
                  <StatusIcon type={statusResult.status} />
                  {statusMeta[statusResult.status]?.label}
                </span>
                <div className="pw-status-date">Submitted: {new Date(statusResult.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                {statusResult.adminNote && <div className="pw-status-note"><strong>Note:</strong> {statusResult.adminNote}</div>}
              </div>
            ))}
          </div>
        ) : (
          <form className="pw-form" onSubmit={handleSubmit} noValidate>

            {/* Section 1 — Facility & Legal Identity */}
            <div className="pw-section">
              <div className="pw-section-header">
                <span className="pw-section-num">1</span>
                <div>
                  <h3>Facility &amp; Legal Identity</h3>
                  <p>As registered with the Office of the Company Registrar (OCR)</p>
                </div>
              </div>
              <div className="pw-fields">
                <div className="pw-field pw-full">
                  <label>Official Hospital Name <span className="pw-req">*</span></label>
                  <input type="text" placeholder="As registered with OCR" value={form.hospitalName} onChange={e => set('hospitalName', e.target.value)} />
                  {errors.hospitalName && <span className="pw-err">{errors.hospitalName}</span>}
                </div>
                <div className="pw-field">
                  <label>Facility Category <span className="pw-req">*</span></label>
                  <select value={form.facilityCategory} onChange={e => set('facilityCategory', e.target.value)}>
                    <option value="">Select category</option>
                    {FACILITY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.facilityCategory && <span className="pw-err">{errors.facilityCategory}</span>}
                </div>
                <div className="pw-field">
                  <label>MoHP / DoHS License Number <span className="pw-req">*</span></label>
                  <input type="text" placeholder="e.g., DoHS-2024-001234" value={form.dohsLicenseNumber} onChange={e => set('dohsLicenseNumber', e.target.value)} />
                  {errors.dohsLicenseNumber && <span className="pw-err">{errors.dohsLicenseNumber}</span>}
                </div>
                <div className="pw-field">
                  <label>PAN / VAT Number <span className="pw-req">*</span></label>
                  <input type="text" placeholder="e.g., 123456789" value={form.panVatNumber} onChange={e => set('panVatNumber', e.target.value)} />
                  {errors.panVatNumber && <span className="pw-err">{errors.panVatNumber}</span>}
                </div>
              </div>
            </div>

            {/* Section 2 — Contact Information */}
            <div className="pw-section">
              <div className="pw-section-header">
                <span className="pw-section-num">2</span>
                <div>
                  <h3>Contact Information</h3>
                  <p>Official hospital contact details</p>
                </div>
              </div>
              <div className="pw-fields">
                <div className="pw-field">
                  <label>Hospital Phone Number <span className="pw-req">*</span></label>
                  <input type="tel" placeholder="+977 01-XXXXXXX" value={form.hospitalPhone} onChange={e => set('hospitalPhone', e.target.value)} />
                  {errors.hospitalPhone && <span className="pw-err">{errors.hospitalPhone}</span>}
                </div>
                <div className="pw-field">
                  <label>Official Designate Email <span className="pw-req">*</span></label>
                  <input type="email" placeholder="admin@yourhospital.gov.np" value={form.officialEmail} onChange={e => set('officialEmail', e.target.value)} />
                  {errors.officialEmail && <span className="pw-err">{errors.officialEmail}</span>}
                </div>
              </div>
            </div>

            {/* Section 3 — Administrative Contact */}
            <div className="pw-section">
              <div className="pw-section-header">
                <span className="pw-section-num">3</span>
                <div>
                  <h3>Administrative Contact</h3>
                  <p>Person responsible for managing the hospital account</p>
                </div>
              </div>
              <div className="pw-fields">
                <div className="pw-field">
                  <label>Admin / Contact Person Name <span className="pw-req">*</span></label>
                  <input type="text" placeholder="Full name" value={form.adminName} onChange={e => set('adminName', e.target.value)} />
                  {errors.adminName && <span className="pw-err">{errors.adminName}</span>}
                </div>
                <div className="pw-field">
                  <label>Contact Person Phone Number <span className="pw-req">*</span></label>
                  <input type="tel" placeholder="+977 98XXXXXXXX" value={form.adminPhone} onChange={e => set('adminPhone', e.target.value)} />
                  {errors.adminPhone && <span className="pw-err">{errors.adminPhone}</span>}
                </div>
              </div>
            </div>

            {/* Section 4 — Location Details */}
            <div className="pw-section">
              <div className="pw-section-header">
                <span className="pw-section-num">4</span>
                <div>
                  <h3>Location Details</h3>
                  <p>Helps patients find hospitals by province or local government</p>
                </div>
              </div>
              <div className="pw-fields">
                <div className="pw-field">
                  <label>Province <span className="pw-req">*</span></label>
                  <select value={form.province} onChange={e => { set('province', e.target.value); set('district', ''); set('palika', ''); }}>
                    <option value="">Select province</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.province && <span className="pw-err">{errors.province}</span>}
                </div>
                <div className="pw-field">
                  <label>District <span className="pw-req">*</span></label>
                  <select value={form.district} onChange={e => { set('district', e.target.value); set('palika', ''); }} disabled={!form.province}>
                    <option value="">Select district</option>
                    {form.province && Object.keys(NEPAL_DATA[form.province] || {}).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.district && <span className="pw-err">{errors.district}</span>}
                </div>
                <div className="pw-field pw-full">
                  <label>Local Level (Palika) <span className="pw-req">*</span></label>
                  <select
                    value={form.palika}
                    onChange={e => set('palika', e.target.value)}
                    disabled={!form.district}
                  >
                    <option value="">{form.district ? 'Select palika' : 'Select district first'}</option>
                    {(NEPAL_DATA[form.province]?.[form.district] || []).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {errors.palika && <span className="pw-err">{errors.palika}</span>}
                </div>
              </div>
            </div>

            {/* Section 5 — Basic Information */}
            <div className="pw-section">
              <div className="pw-section-header">
                <span className="pw-section-num">5</span>
                <div>
                  <h3>Basic Information</h3>
                  <p>Helps with analytics and doctor matching</p>
                </div>
              </div>
              <div className="pw-fields">
                <div className="pw-field">
                  <label>Estimated Number of Doctors <span className="pw-req">*</span></label>
                  <input type="number" placeholder="e.g., 45" min="1" value={form.estimatedDoctors} onChange={e => set('estimatedDoctors', e.target.value)} />
                  {errors.estimatedDoctors && <span className="pw-err">{errors.estimatedDoctors}</span>}
                </div>
              </div>
            </div>

            {/* Section 6 — Documents */}
            <div className="pw-section">
              <div className="pw-section-header">
                <span className="pw-section-num">6</span>
                <div>
                  <h3>Required Document Uploads (KYC)</h3>
                  <p>Digital copies required for Super Admin verification</p>
                </div>
              </div>
              <div className="pw-uploads">
                {[
                  { label: 'Health Facility Operating License', req: true,  ref: opLicRef,   file: opLic,   setFile: setOpLic,   errKey: 'opLic' },
                  { label: 'Company Registration Certificate',  req: true,  ref: regCertRef, file: regCert, setFile: setRegCert, errKey: 'regCert' },
                  { label: 'Tax Clearance Certificate',         req: false, ref: taxRef,     file: taxCert, setFile: setTaxCert, errKey: null },
                ].map(({ label, req, ref, file, setFile, errKey }) => (
                  <div key={label} className="pw-field">
                    <label>{label} {req ? <span className="pw-req">*</span> : <span className="pw-opt">(Optional)</span>}</label>
                    <div
                      className={`pw-upload ${file ? 'has-file' : ''} ${errKey && errors[errKey] ? 'has-error' : ''}`}
                      onClick={() => ref.current.click()}
                    >
                      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => { setFile(e.target.files[0]); if (errKey) setErrors(p => ({ ...p, [errKey]: '' })); }}
                        style={{ display: 'none' }} />
                      {file ? (
                        <div className="pw-upload-file">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <span className="pw-upload-name">{file.name}</span>
                          <button type="button" className="pw-upload-remove" onClick={ev => { ev.stopPropagation(); setFile(null); }}>✕</button>
                        </div>
                      ) : (
                        <>
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00a896" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                          </svg>
                          <span>Click to upload</span>
                          <span className="pw-upload-hint">PDF, JPG, PNG · Max 10MB</span>
                        </>
                      )}
                    </div>
                    {errKey && errors[errKey] && <span className="pw-err">{errors[errKey]}</span>}
                  </div>
                ))}
              </div>
            </div>

            {submitError && <div className="pw-submit-error">{submitError}</div>}
            <button type="submit" className="pw-submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
