import { useState, useEffect } from 'react';
import '../styles/modal.css';

export default function EditProfileModal({ isOpen, onClose, onSave, showError }) {
  const [form, setForm] = useState({
    fullname: '',
    email: '',
    phone: '',
    company: '',
    vehicleReg: '',
    vehicleModel: '',
    ownerName: '',
  });

  // Load current session data when modal opens
  useEffect(() => {
    if (isOpen) {
      const user = JSON.parse(sessionStorage.getItem('autovision_user') || '{}');
      setForm({
        fullname:     user.fullname     || '',
        email:        user.email        || '',
        phone:        user.phone        || '',
        company:      user.company      || '',
        vehicleReg:   user.vehicleReg   || '',
        vehicleModel: user.vehicleModel || '',
        ownerName:    user.ownerName    || '',
      });
    }
  }, [isOpen]);

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = () => {
    const fullname = form.fullname.trim();
    if (!fullname) { showError('Name is required.'); return; }
    const vehicleReg = form.vehicleReg.trim().toUpperCase();
    if (!vehicleReg) { showError('Vehicle registration is required.'); return; }

    const current = JSON.parse(sessionStorage.getItem('autovision_user') || '{}');
    const updated = {
      fullname,
      email:        form.email.trim(),
      phone:        form.phone.trim(),
      company:      form.company.trim(),
      vehicleReg,
      vehicleModel: form.vehicleModel.trim(),
      ownerName:    form.ownerName.trim(),
      loginTime:    current.loginTime || new Date().toISOString(),
      purchaseYear: current.purchaseYear,
      kmDriven:     current.kmDriven,
    };

    sessionStorage.setItem('autovision_user', JSON.stringify(updated));
    onSave(updated);
    onClose();
  };

  return (
    <div className={`modal-overlay${isOpen ? ' active' : ''}`} id="edit-modal">
      <div className="modal-card">
        <div className="modal-header">
          <span className="modal-header-title">Edit Profile</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="m-row">
            <div className="m-group">
              <label>Full Name</label>
              <input type="text" value={form.fullname} onChange={handleChange('fullname')} />
            </div>
            <div className="m-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={handleChange('email')} />
            </div>
          </div>
          <div className="m-row">
            <div className="m-group">
              <label>Phone</label>
              <input type="tel" value={form.phone} onChange={handleChange('phone')} />
            </div>
            <div className="m-group">
              <label>Company</label>
              <input type="text" value={form.company} onChange={handleChange('company')} />
            </div>
          </div>
          <div className="m-row">
            <div className="m-group">
              <label>Vehicle Reg. Number</label>
              <input
                type="text"
                value={form.vehicleReg}
                onChange={handleChange('vehicleReg')}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="m-group">
              <label>Make / Model</label>
              <input type="text" value={form.vehicleModel} onChange={handleChange('vehicleModel')} />
            </div>
          </div>
          <div className="m-row full">
            <div className="m-group">
              <label>Vehicle Owner</label>
              <input type="text" value={form.ownerName} onChange={handleChange('ownerName')} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn secondary" onClick={onClose}>Cancel</button>
          <button className="modal-btn primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
