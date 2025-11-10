import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [statsRes, tenantsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/v1/admin/stats', config),
        axios.get('http://localhost:5000/api/v1/admin/tenants', config)
      ]);

      setStats(statsRes.data.data);
      setTenants(tenantsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (tenantId) => {
    const reason = prompt('Enter reason for suspension:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/v1/admin/tenants/${tenantId}/suspend`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Tenant suspended successfully');
      fetchData();
    } catch (error) {
      alert('Error suspending tenant');
    }
  };

  const handleDelist = async (tenantId) => {
    const reason = prompt('Enter reason for delisting:');
    if (!reason) return;

    if (!confirm('Are you sure you want to delist this tenant? This is a serious action.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/v1/admin/tenants/${tenantId}/delist`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Tenant delisted successfully');
      fetchData();
    } catch (error) {
      alert('Error delisting tenant');
    }
  };

  const handleReactivate = async (tenantId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/v1/admin/tenants/${tenantId}/reactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Tenant reactivated successfully');
      fetchData();
    } catch (error) {
      alert('Error reactivating tenant');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Hairvia Admin Portal</h1>
      
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Tenants</h3>
            <p className="stat-number">{stats.totalTenants}</p>
          </div>
          <div className="stat-card active">
            <h3>Active Tenants</h3>
            <p className="stat-number">{stats.activeTenants}</p>
          </div>
          <div className="stat-card suspended">
            <h3>Suspended</h3>
            <p className="stat-number">{stats.suspendedTenants}</p>
          </div>
          <div className="stat-card delisted">
            <h3>Delisted</h3>
            <p className="stat-number">{stats.delistedTenants}</p>
          </div>
        </div>
      )}

      <div className="tenants-section">
        <h2>All Tenants</h2>
        <table className="tenants-table">
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Country</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(tenant => (
              <tr key={tenant._id}>
                <td>{tenant.businessName}</td>
                <td>{tenant.country}</td>
                <td>
                  <span className={`status-badge ${tenant.status}`}>
                    {tenant.status}
                  </span>
                </td>
                <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                <td>
                  {tenant.status === 'active' && (
                    <>
                      <button onClick={() => handleSuspend(tenant._id)}>
                        Suspend
                      </button>
                      <button onClick={() => handleDelist(tenant._id)}>
                        Delist
                      </button>
                    </>
                  )}
                  {(tenant.status === 'suspended' || tenant.status === 'delisted') && (
                    <button onClick={() => handleReactivate(tenant._id)}>
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
