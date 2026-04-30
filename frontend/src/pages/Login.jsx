import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';
import logoDark from '../assets/logo-dark.png';

const CAR_MODELS = [
  'Maruti Alto', 'Maruti Swift', 'Maruti Baleno', 'Maruti Wagon R',
  'Hyundai i10', 'Hyundai i20', 'Hyundai Creta', 'Hyundai Verna',
  'Honda City', 'Honda Amaze', 'Tata Nexon', 'Tata Harrier', 'Tata Tiago',
  'Kia Seltos', 'Kia Sonet', 'Mahindra XUV700', 'Mahindra Scorpio',
  'Toyota Fortuner', 'Toyota Innova', 'BMW 3 Series', 'Audi A4', 'Mercedes C-Class',
];

export default function Login() {
  const navigate = useNavigate();
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const [form, setForm] = useState({
    fullname:     '',
    email:        '',
    phone:        '',
    company:      '',
    vehicleReg:   '',
    vehicleModel: 'Maruti Swift',
    purchaseYear: 2022,
    kmDriven:     40000,
    ownerName:    '',
  });

  const [errors, setErrors] = useState({});
  const [toast, setToast]   = useState('');

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error on change
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const ageHint = useMemo(() => {
    const age = currentYear - (parseInt(form.purchaseYear) || currentYear);
    return `Age: ${Math.max(0, age)} year${age !== 1 ? 's' : ''}`;
  }, [form.purchaseYear, currentYear]);

  const kmHint = useMemo(() => {
    return parseInt(form.kmDriven || 0) >= 80000 ? '⚠ High mileage' : 'Normal range';
  }, [form.kmDriven]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    let valid = true;

    if (!form.fullname.trim()) {
      newErrors.fullname = 'Name is required';
      valid = false;
    }
    if (!form.vehicleReg.trim()) {
      newErrors.vehicleReg = 'Registration number is required';
      valid = false;
    }

    const year = parseInt(form.purchaseYear);
    if (!year || year < 2010 || year > currentYear) {
      newErrors.purchaseYear = `Enter a valid year (2010–${currentYear})`;
      valid = false;
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Invalid email format';
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    // Store in sessionStorage & navigate
    const userData = {
      fullname:     form.fullname.trim(),
      email:        form.email.trim(),
      phone:        form.phone.trim(),
      company:      form.company.trim(),
      vehicleReg:   form.vehicleReg.trim().toUpperCase(),
      vehicleModel: form.vehicleModel,
      purchaseYear: parseInt(form.purchaseYear),
      kmDriven:     parseInt(form.kmDriven) || 0,
      ownerName:    form.ownerName.trim(),
      loginTime:    new Date().toISOString(),
    };
    sessionStorage.setItem('autovision_user', JSON.stringify(userData));
    navigate('/home');
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="logo-mark">
            <img src={logoDark} alt="AutoVision Logo" />
          </div>
          <div className="login-title">Auto<span>Vision</span></div>
          <div className="login-subtitle">AI Damage Inspection System</div>
        </div>

        {/* Form */}
        <form className="login-body" id="login-form" autoComplete="on" noValidate onSubmit={handleSubmit}>
          <div className="section-label">Inspector Details</div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullname">Full Name *</label>
              <input
                type="text" id="fullname"
                placeholder="John Doe"
                required autoComplete="name"
                className={errors.fullname ? 'error' : ''}
                value={form.fullname}
                onChange={handleChange('fullname')}
              />
              <div className="error-msg">{errors.fullname || ''}</div>
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email" id="email"
                placeholder="john@example.com"
                autoComplete="email"
                className={errors.email ? 'error' : ''}
                value={form.email}
                onChange={handleChange('email')}
              />
              <div className="error-msg">{errors.email || ''}</div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel" id="phone"
                placeholder="+91 98765 43210"
                autoComplete="tel"
                value={form.phone}
                onChange={handleChange('phone')}
              />
            </div>
            <div className="form-group">
              <label htmlFor="company">Company / Organisation</label>
              <input
                type="text" id="company"
                placeholder="ABC Insurance Ltd."
                autoComplete="organization"
                value={form.company}
                onChange={handleChange('company')}
              />
            </div>
          </div>

          <div className="section-label" style={{ marginTop: '20px' }}>Vehicle Details</div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vehicle-reg">Vehicle Reg. Number *</label>
              <input
                type="text" id="vehicle-reg"
                placeholder="MH 01 AB 1234"
                required
                style={{ textTransform: 'uppercase' }}
                className={errors.vehicleReg ? 'error' : ''}
                value={form.vehicleReg}
                onChange={handleChange('vehicleReg')}
              />
              <div className="error-msg">{errors.vehicleReg || ''}</div>
            </div>
            <div className="form-group">
              <label htmlFor="vehicle-model">Car Model *</label>
              <select
                id="vehicle-model"
                required
                value={form.vehicleModel}
                onChange={handleChange('vehicleModel')}
              >
                {CAR_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="purchase-year">Purchase Year *</label>
              <input
                type="number" id="purchase-year"
                min="2010" max={currentYear}
                required
                className={errors.purchaseYear ? 'error' : ''}
                value={form.purchaseYear}
                onChange={handleChange('purchaseYear')}
              />
              <div className="hint-text">{ageHint}</div>
              <div className="error-msg">{errors.purchaseYear || ''}</div>
            </div>
            <div className="form-group">
              <label htmlFor="km-driven">KM Driven *</label>
              <input
                type="number" id="km-driven"
                min="0" max="300000" step="1000"
                required
                value={form.kmDriven}
                onChange={handleChange('kmDriven')}
              />
              <div className="hint-text">{kmHint}</div>
            </div>
          </div>

          <div className="form-row full">
            <div className="form-group">
              <label htmlFor="owner-name">Vehicle Owner Name</label>
              <input
                type="text" id="owner-name"
                placeholder="Owner's full name"
                value={form.ownerName}
                onChange={handleChange('ownerName')}
              />
            </div>
          </div>

          <button type="submit" className="login-btn" id="login-submit">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="4.5" />
              <path d="M10.5 10.5L14 14" />
            </svg>
            Start Inspection
          </button>
        </form>

        <div className="login-footer">
          Powered by <a href="#">AutoVision AI</a> &middot; Deep Learning Vehicle Inspection
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="error-toast show" style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
