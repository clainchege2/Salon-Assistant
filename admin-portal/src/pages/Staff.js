import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Staff.css';

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'stylist'
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: '', // 'revoke' or 'restore'
    staffId: null,
    staffName: ''
  });
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    staffId: null,
    staffName: ''
  });
  const [resendEmailModal, setResendEmailModal] = useState({
    show: false,
    staffId: null,
    staffName: ''
  });
  const [permissionsModal, setPermissionsModal] = useState({
    show: false,
    staff: null,
    permissions: {
      canViewCommunications: false,
      canDeleteBookings: false,
      canDeleteClients: false,
      canManageStaff: false,
      canManageServices: false,
      canViewReports: false
    }
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.actions-dropdown')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/v1/admin/staff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched staff:', response.data.data);
      // Filter out owners - they manage their profile in Settings
      const staffOnly = (response.data.data || []).filter(member => member.role !== 'owner');
      // Force complete state update
      setStaff([]);
      setTimeout(() => {
        setStaff(staffOnly);
      }, 0);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.firstName || !newStaff.lastName || !newStaff.email) {
      setError('Please fill in all required fields');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.post('http://localhost:5000/api/v1/admin/staff', {
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAddModal(false);
      setNewStaff({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'stylist' });
      
      if (response.data.emailSent) {
        setSuccessMessage('✓ Staff member added! Welcome email sent with login credentials.');
      } else {
        setSuccessMessage('✓ Staff member added! Email failed - share credentials manually.');
      }
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchStaff();
    } catch (error) {
      console.error('Error adding staff:', error);
      setError(error.response?.data?.message || 'Failed to add staff member');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleEditClick = (member) => {
    setEditingStaff({
      _id: member._id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone || '',
      role: member.role
    });
    setShowEditModal(true);
  };

  const handleRevokeAccess = (staffId, staffName) => {
    setConfirmModal({
      show: true,
      type: 'revoke',
      staffId,
      staffName
    });
  };

  const handleRestoreAccess = (staffId, staffName) => {
    setConfirmModal({
      show: true,
      type: 'restore',
      staffId,
      staffName
    });
  };

  const confirmAction = async () => {
    const { type, staffId, staffName } = confirmModal;
    
    try {
      const token = localStorage.getItem('adminToken');
      
      await axios.put(
        `http://localhost:5000/api/v1/admin/staff/${staffId}`,
        { status: type === 'revoke' ? 'inactive' : 'active' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage(type === 'revoke' ? '✓ Access revoked successfully!' : '✓ Access restored successfully!');
      setConfirmModal({ show: false, type: '', staffId: null, staffName: '' });
      await fetchStaff(); // Wait for refresh
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error(`Error ${type === 'revoke' ? 'revoking' : 'restoring'} access:`, error);
      setError(`Failed to ${type === 'revoke' ? 'revoke' : 'restore'} access`);
      setTimeout(() => setError(''), 5000);
      setConfirmModal({ show: false, type: '', staffId: null, staffName: '' });
    }
  };

  const handleDropdownToggle = (event, memberId) => {
    if (openDropdown === memberId) {
      setOpenDropdown(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 180 // 180px is min-width of dropdown
      });
      setOpenDropdown(memberId);
    }
  };

  const handleDeleteClick = (staffId, staffName) => {
    setDeleteModal({
      show: true,
      staffId,
      staffName
    });
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        `http://localhost:5000/api/v1/admin/staff/${deleteModal.staffId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDeleteModal({ show: false, staffId: null, staffName: '' });
      setSuccessMessage('✓ Staff member deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      setError(error.response?.data?.message || 'Failed to delete staff member');
      setTimeout(() => setError(''), 5000);
      setDeleteModal({ show: false, staffId: null, staffName: '' });
    }
  };

  const handleResendEmailClick = (staffId, staffName) => {
    setResendEmailModal({
      show: true,
      staffId,
      staffName
    });
  };

  const handleConfirmResendEmail = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `http://localhost:5000/api/v1/admin/staff/${resendEmailModal.staffId}/resend-welcome`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResendEmailModal({ show: false, staffId: null, staffName: '' });
      
      if (response.data.emailSent) {
        setSuccessMessage('✓ Welcome email sent successfully!');
      } else {
        setError('Failed to send email. Temporary password: ' + response.data.tempPassword);
      }
      setTimeout(() => {
        setSuccessMessage('');
        setError('');
      }, 5000);
    } catch (error) {
      console.error('Error resending welcome email:', error);
      setError(error.response?.data?.message || 'Failed to resend welcome email');
      setTimeout(() => setError(''), 5000);
      setResendEmailModal({ show: false, staffId: null, staffName: '' });
    }
  };

  const handleOpenPermissions = (member) => {
    setPermissionsModal({
      show: true,
      staff: member,
      permissions: member.permissions || {
        canViewCommunications: false,
        canDeleteBookings: false,
        canDeleteClients: false,
        canManageStaff: false,
        canManageServices: false,
        canViewReports: false
      }
    });
  };

  const handleSavePermissions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      await axios.put(
        `http://localhost:5000/api/v1/admin/staff/${permissionsModal.staff._id}`,
        { permissions: permissionsModal.permissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage('✓ Permissions updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setPermissionsModal({ show: false, staff: null, permissions: {} });
      fetchStaff();
    } catch (error) {
      console.error('Error updating permissions:', error);
      setError('Failed to update permissions');
      setTimeout(() => setError(''), 5000);
    }
  };

  const togglePermission = (permission) => {
    setPermissionsModal({
      ...permissionsModal,
      permissions: {
        ...permissionsModal.permissions,
        [permission]: !permissionsModal.permissions[permission]
      }
    });
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff.firstName || !editingStaff.lastName || !editingStaff.email) {
      setError('Please fill in all required fields');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      await axios.put(
        `http://localhost:5000/api/v1/admin/staff/${editingStaff._id}`,
        {
          firstName: editingStaff.firstName,
          lastName: editingStaff.lastName,
          email: editingStaff.email,
          phone: editingStaff.phone,
          role: editingStaff.role
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setShowEditModal(false);
      setEditingStaff(null);
      setSuccessMessage('✓ Staff information updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchStaff();
    } catch (error) {
      console.error('Error updating staff:', error);
      setError(error.response?.data?.message || 'Failed to update staff member');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Sort staff by hierarchy: owners, managers, stylists
  const sortStaffByHierarchy = (staffList) => {
    const roleOrder = { owner: 1, manager: 2, stylist: 3 };
    return [...staffList].sort((a, b) => {
      const roleComparison = roleOrder[a.role] - roleOrder[b.role];
      if (roleComparison !== 0) return roleComparison;
      // Within same role, sort alphabetically by first name
      return a.firstName.localeCompare(b.firstName);
    });
  };

  // Group staff by role
  const groupStaffByRole = (staffList) => {
    const sorted = sortStaffByHierarchy(staffList);
    return {
      owners: sorted.filter(s => s.role === 'owner'),
      managers: sorted.filter(s => s.role === 'manager'),
      stylists: sorted.filter(s => s.role === 'stylist')
    };
  };

  const getRoleColor = (role) => {
    const colors = {
      owner: '#f59e0b',
      manager: '#3b82f6',
      stylist: '#10b981'
    };
    return colors[role] || '#6b7280';
  };

  const getRoleIcon = (role) => {
    const icons = {
      owner: '',
      manager: '',
      stylist: ''
    };
    return icons[role] || '';
  };

  if (loading) return <div className="loading">Loading staff...</div>;

  return (
    <div className="staff-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <div className="page-title-wrapper">
          <div className="title-with-icon">
            <span className="title-icon">👔</span>
            <div className="title-content">
              <h1>Team Management</h1>
              <p className="page-tagline">Empower your team, elevate your salon</p>
            </div>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="add-btn">
          ➕ Add Staff Member
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {staff.length === 0 ? (
        <div className="empty-state">
          <p>📭 No staff members yet</p>
          <p className="empty-hint">Add managers and stylists to your team</p>
          <button onClick={() => setShowAddModal(true)} className="add-btn">
            Add Your First Staff Member
          </button>
          <p className="owner-note">💡 Owner profile is managed in Settings</p>
        </div>
      ) : (
        <div className="staff-table-container">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const grouped = groupStaffByRole(staff);
                return (
                  <>
                    {/* Owners are managed in Settings, not shown here */}
                    
                    {/* Managers Section */}
                    {grouped.managers.length > 0 && (
                      <>
                        <tr className="role-section-header">
                          <td colSpan="5">
                            <div className="section-title">
                              <span>Managers ({grouped.managers.length})</span>
                            </div>
                          </td>
                        </tr>
                        {grouped.managers.map(member => (
                          <tr key={member._id} className="staff-row">
                            <td>
                              <div className="staff-name-cell">
                                <div className="staff-avatar-small">
                                  {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                </div>
                                <div>
                                  <div className="staff-name">{member.firstName} {member.lastName}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="contact-info">
                                <div className="email">{member.email}</div>
                                {member.phone && <div className="phone">{member.phone}</div>}
                              </div>
                            </td>
                            <td>
                              <span 
                                className="role-badge" 
                                style={{ backgroundColor: getRoleColor(member.role) }}
                              >
                                {getRoleIcon(member.role)} {member.role}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge status-${member.status || 'active'}`}>
                                {member.status === 'inactive' ? '🔴 Inactive' : '🟢 Active'}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions">
                                <div className="actions-dropdown">
                                  <button 
                                    className="actions-menu-btn"
                                    onClick={(e) => handleDropdownToggle(e, member._id)}
                                    title="Actions"
                                  >
                                    ⋮
                                  </button>
                                  
                                  {openDropdown === member._id && (
                                    <div 
                                      className="actions-dropdown-menu"
                                      style={{
                                        top: `${dropdownPosition.top}px`,
                                        left: `${dropdownPosition.left}px`
                                      }}
                                    >
                                      <button 
                                        className="dropdown-item"
                                        onClick={() => {
                                          handleEditClick(member);
                                          setOpenDropdown(null);
                                        }}
                                      >
                                        <span className="dropdown-icon">✏️</span>
                                        Edit
                                      </button>
                                      
                                      {member.role !== 'owner' && (
                                        <button 
                                          className="dropdown-item"
                                          onClick={() => {
                                            handleOpenPermissions(member);
                                            setOpenDropdown(null);
                                          }}
                                        >
                                          <span className="dropdown-icon">🔐</span>
                                          Permissions
                                        </button>
                                      )}
                                      
                                      <button 
                                        className="dropdown-item"
                                        onClick={() => {
                                          handleResendEmailClick(member._id, `${member.firstName} ${member.lastName}`);
                                          setOpenDropdown(null);
                                        }}
                                      >
                                        <span className="dropdown-icon">📧</span>
                                        Resend Email
                                      </button>
                                      
                                      <div className="dropdown-divider"></div>
                                      
                                      {member.status !== 'inactive' ? (
                                        <button 
                                          className="dropdown-item warning"
                                          onClick={() => {
                                            handleRevokeAccess(member._id, `${member.firstName} ${member.lastName}`);
                                            setOpenDropdown(null);
                                          }}
                                        >
                                          <span className="dropdown-icon">🚫</span>
                                          Revoke Access
                                        </button>
                                      ) : (
                                        <button 
                                          className="dropdown-item success"
                                          onClick={() => {
                                            handleRestoreAccess(member._id, `${member.firstName} ${member.lastName}`);
                                            setOpenDropdown(null);
                                          }}
                                        >
                                          <span className="dropdown-icon">✅</span>
                                          Restore Access
                                        </button>
                                      )}
                                      
                                      <button 
                                        className="dropdown-item danger"
                                        onClick={() => {
                                          handleDeleteClick(member._id, `${member.firstName} ${member.lastName}`);
                                          setOpenDropdown(null);
                                        }}
                                      >
                                        <span className="dropdown-icon">🗑️</span>
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}

                    {/* Stylists Section */}
                    {grouped.stylists.length > 0 && (
                      <>
                        <tr className="role-section-header">
                          <td colSpan="5">
                            <div className="section-title">
                              <span>Stylists ({grouped.stylists.length})</span>
                            </div>
                          </td>
                        </tr>
                        {grouped.stylists.map(member => (
                          <tr key={member._id} className="staff-row">
                            <td>
                              <div className="staff-name-cell">
                                <div className="staff-avatar-small">
                                  {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                </div>
                                <div>
                                  <div className="staff-name">{member.firstName} {member.lastName}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="contact-info">
                                <div className="email">{member.email}</div>
                                {member.phone && <div className="phone">{member.phone}</div>}
                              </div>
                            </td>
                            <td>
                              <span 
                                className="role-badge" 
                                style={{ backgroundColor: getRoleColor(member.role) }}
                              >
                                {getRoleIcon(member.role)} {member.role}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge status-${member.status || 'active'}`}>
                                {member.status === 'inactive' ? '🔴 Inactive' : '🟢 Active'}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions">
                                <div className="actions-dropdown">
                                  <button 
                                    className="actions-menu-btn"
                                    onClick={(e) => handleDropdownToggle(e, member._id)}
                                    title="Actions"
                                  >
                                    ⋮
                                  </button>
                                  
                                  {openDropdown === member._id && (
                                    <div 
                                      className="actions-dropdown-menu"
                                      style={{
                                        top: `${dropdownPosition.top}px`,
                                        left: `${dropdownPosition.left}px`
                                      }}
                                    >
                                      <button 
                                        className="dropdown-item"
                                        onClick={() => {
                                          handleEditClick(member);
                                          setOpenDropdown(null);
                                        }}
                                      >
                                        <span className="dropdown-icon">✏️</span>
                                        Edit
                                      </button>
                                      
                                      {member.role !== 'owner' && (
                                        <button 
                                          className="dropdown-item"
                                          onClick={() => {
                                            handleOpenPermissions(member);
                                            setOpenDropdown(null);
                                          }}
                                        >
                                          <span className="dropdown-icon">🔐</span>
                                          Permissions
                                        </button>
                                      )}
                                      
                                      <button 
                                        className="dropdown-item"
                                        onClick={() => {
                                          handleResendEmailClick(member._id, `${member.firstName} ${member.lastName}`);
                                          setOpenDropdown(null);
                                        }}
                                      >
                                        <span className="dropdown-icon">📧</span>
                                        Resend Email
                                      </button>
                                      
                                      <div className="dropdown-divider"></div>
                                      
                                      {member.status !== 'inactive' ? (
                                        <button 
                                          className="dropdown-item warning"
                                          onClick={() => {
                                            handleRevokeAccess(member._id, `${member.firstName} ${member.lastName}`);
                                            setOpenDropdown(null);
                                          }}
                                        >
                                          <span className="dropdown-icon">🚫</span>
                                          Revoke Access
                                        </button>
                                      ) : (
                                        <button 
                                          className="dropdown-item success"
                                          onClick={() => {
                                            handleRestoreAccess(member._id, `${member.firstName} ${member.lastName}`);
                                            setOpenDropdown(null);
                                          }}
                                        >
                                          <span className="dropdown-icon">✅</span>
                                          Restore Access
                                        </button>
                                      )}
                                      
                                      <button 
                                        className="dropdown-item danger"
                                        onClick={() => {
                                          handleDeleteClick(member._id, `${member.firstName} ${member.lastName}`);
                                          setOpenDropdown(null);
                                        }}
                                      >
                                        <span className="dropdown-icon">🗑️</span>
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}


      {/* Edit Staff Modal */}
      {showEditModal && editingStaff && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>✏️ Edit Staff Information</h2>

            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={editingStaff.firstName}
                  onChange={(e) => setEditingStaff({ ...editingStaff, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={editingStaff.lastName}
                  onChange={(e) => setEditingStaff({ ...editingStaff, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={editingStaff.email}
                onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={editingStaff.phone}
                onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                placeholder="+254 712 345 678"
              />
            </div>

            <div className="form-group">
              <label>Role *</label>
              <select
                value={editingStaff.role}
                onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
              >
                <option value="stylist">Stylist</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
              <p className="help-text">
                Stylists can manage bookings and clients. Managers have additional access to communications and reports.
              </p>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => {
                setShowEditModal(false);
                setEditingStaff(null);
              }}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleUpdateStaff}>
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>✨ Add New Staff Member</h2>

            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={newStaff.firstName}
                  onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={newStaff.lastName}
                  onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                placeholder="+254 712 345 678"
              />
            </div>

            <div className="info-box">
              <p>📧 A welcome email with login credentials will be sent to the staff member's email address.</p>
            </div>

            <div className="form-group">
              <label>Role *</label>
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
              >
                <option value="stylist">Stylist</option>
                <option value="manager">Manager</option>
              </select>
              <p className="help-text">
                Stylists can manage bookings and clients. Managers have additional access to communications and reports.
              </p>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleAddStaff}>
                💾 Add Staff Member
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Permissions Modal */}
      {permissionsModal.show && permissionsModal.staff && (
        <div className="modal-overlay" onClick={() => setPermissionsModal({ show: false, staff: null, permissions: {} })}>
          <div className="modal-content permissions-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🔐 Manage Permissions</h2>
            <p className="modal-subtitle">
              Set permissions for <strong>{permissionsModal.staff.firstName} {permissionsModal.staff.lastName}</strong>
            </p>

            <div className="permissions-grid">
              <div className="permission-item">
                <label className="permission-label">
                  <input
                    type="checkbox"
                    checked={permissionsModal.permissions.canViewCommunications}
                    onChange={() => togglePermission('canViewCommunications')}
                  />
                  <div className="permission-info">
                    <span className="permission-name">💬 View Communications</span>
                    <span className="permission-desc">Access to messages and feedback</span>
                  </div>
                </label>
              </div>

              <div className="permission-item">
                <label className="permission-label">
                  <input
                    type="checkbox"
                    checked={permissionsModal.permissions.canDeleteBookings}
                    onChange={() => togglePermission('canDeleteBookings')}
                  />
                  <div className="permission-info">
                    <span className="permission-name">🗑️ Delete Bookings</span>
                    <span className="permission-desc">Can cancel and delete appointments</span>
                  </div>
                </label>
              </div>

              <div className="permission-item">
                <label className="permission-label">
                  <input
                    type="checkbox"
                    checked={permissionsModal.permissions.canDeleteClients}
                    onChange={() => togglePermission('canDeleteClients')}
                  />
                  <div className="permission-info">
                    <span className="permission-name">👥 Delete Clients</span>
                    <span className="permission-desc">Can remove client records</span>
                  </div>
                </label>
              </div>

              <div className="permission-item">
                <label className="permission-label">
                  <input
                    type="checkbox"
                    checked={permissionsModal.permissions.canManageStaff}
                    onChange={() => togglePermission('canManageStaff')}
                  />
                  <div className="permission-info">
                    <span className="permission-name">👨‍💼 Manage Staff</span>
                    <span className="permission-desc">Add, edit, and remove staff members</span>
                  </div>
                </label>
              </div>

              <div className="permission-item">
                <label className="permission-label">
                  <input
                    type="checkbox"
                    checked={permissionsModal.permissions.canManageServices}
                    onChange={() => togglePermission('canManageServices')}
                  />
                  <div className="permission-info">
                    <span className="permission-name">✂️ Manage Services</span>
                    <span className="permission-desc">Add, edit, and delete services</span>
                  </div>
                </label>
              </div>

              <div className="permission-item">
                <label className="permission-label">
                  <input
                    type="checkbox"
                    checked={permissionsModal.permissions.canViewReports}
                    onChange={() => togglePermission('canViewReports')}
                  />
                  <div className="permission-info">
                    <span className="permission-name">📊 View Reports</span>
                    <span className="permission-desc">Access analytics and business reports</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setPermissionsModal({ show: false, staff: null, permissions: {} })}
              >
                Cancel
              </button>
              <button 
                className="btn-save-permissions"
                onClick={handleSavePermissions}
              >
                💾 Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ show: false, type: '', staffId: null, staffName: '' })}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              {confirmModal.type === 'revoke' ? '⚠️' : '✅'}
            </div>
            
            <h2>
              {confirmModal.type === 'revoke' ? 'Revoke Access?' : 'Restore Access?'}
            </h2>
            
            <p className="confirm-message">
              {confirmModal.type === 'revoke' ? (
                <>
                  Are you sure you want to revoke access for <strong>{confirmModal.staffName}</strong>?
                  <br /><br />
                  They will no longer be able to log in to the system.
                </>
              ) : (
                <>
                  Restore access for <strong>{confirmModal.staffName}</strong>?
                  <br /><br />
                  They will be able to log in again.
                </>
              )}
            </p>

            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setConfirmModal({ show: false, type: '', staffId: null, staffName: '' })}
              >
                Cancel
              </button>
              <button 
                className={confirmModal.type === 'revoke' ? 'btn-revoke-confirm' : 'btn-restore-confirm'}
                onClick={confirmAction}
              >
                {confirmModal.type === 'revoke' ? '🚫 Revoke Access' : '✅ Restore Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <h2>Delete {deleteModal.staffName}?</h2>
            <p className="warning-text">
              This action cannot be undone. All data associated with this staff member will be permanently deleted.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setDeleteModal({ show: false, staffId: null, staffName: '' })}
              >
                Cancel
              </button>
              <button 
                className="btn-delete-confirm"
                onClick={handleConfirmDelete}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resend Email Confirmation Modal */}
      {resendEmailModal.show && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <h2>Resend welcome email to {resendEmailModal.staffName}?</h2>
            <p className="info-text">
              This will generate a new temporary password and send it to their email.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setResendEmailModal({ show: false, staffId: null, staffName: '' })}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleConfirmResendEmail}
              >
                📧 Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
